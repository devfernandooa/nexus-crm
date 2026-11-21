import { useState, useEffect, useRef } from 'react';
import { buscarConfiguracoesEmpresa, atualizarFunilVendas } from '@/services/empresaService';
import { buscarContagemNegociosPorEtapa } from '@/services/negocioService';
import { migrarFunilAntigo, gerarSlug } from '@/utils/funilUtils';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, GripVertical, Pencil, Check, X, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ModalConfigurarFunil({ isOpen, onClose, empresaId }) {
    const [etapas, setEtapas] = useState([]);
    const [novaEtapa, setNovaEtapa] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [contagemNegocios, setContagemNegocios] = useState({});

    const [etapaParaExcluir, setEtapaParaExcluir] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const [editandoIndex, setEditandoIndex] = useState(null);
    const [textoEdicao, setTextoEdicao] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !empresaId) return;

        const carregar = async () => {
            setCarregando(true);

            const [resConfig, resContagem] = await Promise.all([
                buscarConfiguracoesEmpresa(empresaId),
                buscarContagemNegociosPorEtapa(empresaId)
            ]);

            // Aplica a migração caso o banco ainda tenha o modelo antigo
            const etapasFormatadas = migrarFunilAntigo(resConfig.dados?.etapasFunil || []);
            setEtapas(etapasFormatadas);

            if (resContagem.sucesso) {
                // A contagem agora vem baseada no ID da etapa
                setContagemNegocios(resContagem.dados);
            }

            setCarregando(false);
        };
        carregar();
    }, [isOpen, empresaId]);

    useEffect(() => {
        if (editandoIndex !== null && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editandoIndex]);

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(etapas);
        const [reorderedItem] = items.splice(result.source.index, 1);

        // NOVO: Segurança do Drag and Drop
        // Se o item arrastado for fixo (ganho/perdido), ele só pode ir para as extremidades
        if (reorderedItem.tipo === 'ganho' && result.destination.index !== (items.length - 1)) {
            toast.error('A etapa de Ganho deve ser a última etapa principal do funil.');
            return;
        }

        items.splice(result.destination.index, 0, reorderedItem);
        setEtapas(items);
    };

    // NOVO: Agora a contagem é feita usando o ID (ex: 'ganho'), não mais o nome
    const iniciarEdicao = (index) => {
        const etapaAtual = etapas[index];

        setEditandoIndex(index);
        setTextoEdicao(etapaAtual.nome);
    };

    const salvarEdicao = () => {
        if (editandoIndex === null) return;
        const nomeLimpo = textoEdicao.trim();
        if (!nomeLimpo) {
            toast.error('O nome da etapa não pode ser vazio!');
            return;
        }
        const existeDuplicata = etapas.some((e, i) => i !== editandoIndex && e.nome.toLowerCase() === nomeLimpo.toLowerCase());
        if (existeDuplicata) {
            toast.error('Já existe uma etapa com esse nome!');
            return;
        }

        const novasEtapas = [...etapas];
        novasEtapas[editandoIndex].nome = nomeLimpo; // Altera apenas o nome, o ID continua o mesmo!
        setEtapas(novasEtapas);
        setEditandoIndex(null);
    };

    const cancelarEdicao = () => {
        setEditandoIndex(null);
        setTextoEdicao('');
    };

    const adicionarEtapa = () => {
        if (!novaEtapa.trim()) return;
        if (etapas.some(e => e.nome.toLowerCase() === novaEtapa.trim().toLowerCase())) {
            toast.error('Essa etapa já existe!');
            return;
        }

        // NOVO: Cria a etapa com ID gerado automaticamente
        const nova = {
            id: gerarSlug(novaEtapa.trim()),
            nome: novaEtapa.trim(),
            tipo: 'aberto' // Toda nova etapa nasce como 'aberto'
        };

        // Impede IDs duplicados
        if (etapas.some(e => e.id === nova.id)) {
            toast.error('Já existe uma etapa com esse ID interno. Escolha outro nome.');
            return;
        }

        setEtapas([...etapas, nova]);
        setNovaEtapa('');
    };

    const prepararExclusao = (index) => {
        const etapa = etapas[index];

        // REGRA DE OURO: Não permite excluir Ganho ou Perdido
        if (etapa.tipo === 'ganho' || etapa.tipo === 'perdido') {
            toast.error('Você não pode excluir a etapa principal de Ganho ou Perdido.');
            return;
        }

        if (contagemNegocios[etapa.id] > 0) {
            toast.error(`Não é possível excluir. Existem ${contagemNegocios[etapa.id]} negócios nesta etapa.`);
            return;
        }

        setEtapaParaExcluir(index);
        setIsConfirmModalOpen(true);
    };

    const confirmarExclusao = () => {
        if (etapaParaExcluir !== null) {
            setEtapas(etapas.filter((_, i) => i !== etapaParaExcluir));
            setEtapaParaExcluir(null);
        }
        setIsConfirmModalOpen(false);
    };

    const salvarFunil = async () => {
        setSalvando(true);
        // Agora envia o array de objetos { id, nome, tipo }
        const res = await atualizarFunilVendas(empresaId, etapas);
        if (res.sucesso) {
            toast.success('Funil atualizado com sucesso!');
            onClose();
            setTimeout(() => window.location.reload(), 300);
        } else {
            toast.error('Erro ao salvar: ' + res.erro);
            setSalvando(false);
        }
    };

    // Identifica órfãos checando se o status do negócio bate com o ID de alguma etapa
    const negociosOrfaos = Object.keys(contagemNegocios).filter(
        status => !etapas.some(e => e.id === status)
    );

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Configurar Etapas do Funil"
                size="lg" // Aumentei o tamanho para caber as tags de tipo
                footer={
                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
                        <button onClick={salvarFunil} disabled={salvando || carregando} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50">
                            <Save size={16} /> {salvando ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                }
            >
                {carregando ? (
                    <div className="py-8 text-center text-slate-500">Carregando configurações...</div>
                ) : (
                    <div className="space-y-4">
                        {negociosOrfaos.length > 0 && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-500/50 rounded-xl flex gap-3 items-start text-red-800 dark:text-red-200 shadow-sm">
                                <AlertTriangle size={24} className="shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-base mb-1">Ação Necessária!</h4>
                                    <p className="text-sm">
                                        Existem negócios presos em etapas que foram excluídas (ex: <strong className="font-bold underline">{negociosOrfaos.join(', ')}</strong>).
                                        Vá na Lista de Negócios e mova-os para uma etapa válida.
                                    </p>
                                </div>
                            </div>
                        )}

                        <p className="text-sm text-slate-500">Arraste para reordenar ou clique no lápis para editar o nome.</p>

                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="etapas-funil">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                                        {etapas.map((etapa, index) => {
                                            const temNegocios = contagemNegocios[etapa.id] > 0;
                                            const isFixa = etapa.tipo === 'ganho' || etapa.tipo === 'perdido';

                                            return (
                                                <Draggable key={etapa.id} draggableId={etapa.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div ref={provided.innerRef} {...provided.draggableProps} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 z-10' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'} ${editandoIndex === index ? 'ring-2 ring-blue-400 bg-white dark:bg-slate-900' : ''}`}>

                                                            {/* Handle de Arrasto */}
                                                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600">
                                                                <GripVertical size={16} />
                                                            </div>

                                                            {/* Conteúdo */}
                                                            <div className="flex-1 min-w-0 flex items-center gap-2">
                                                                {editandoIndex === index ? (
                                                                    <input ref={inputRef} type="text" value={textoEdicao} onChange={(e) => setTextoEdicao(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') salvarEdicao(); if (e.key === 'Escape') cancelarEdicao(); }} onBlur={salvarEdicao} className="w-full px-2 py-1 text-sm bg-transparent border-b border-blue-500 focus:outline-none text-slate-900 dark:text-white font-medium" placeholder="Nome da etapa..." />
                                                                ) : (
                                                                    <>
                                                                        <span onClick={() => iniciarEdicao(index)} className={`block truncate font-medium py-1 ${temNegocios || isFixa ? 'text-slate-500 cursor-not-allowed' : 'text-slate-700 dark:text-slate-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400'}`} title={isFixa ? "Etapa do sistema" : temNegocios ? "Não é possível editar uma etapa com negócios" : "Clique para editar"}>
                                                                            {etapa.nome}
                                                                        </span>

                                                                        {/* Badge de Tipo */}
                                                                        {etapa.tipo === 'ganho' && <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle2 size={10} /> Ganho</span>}
                                                                        {etapa.tipo === 'perdido' && <span className="text-[10px] uppercase font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 px-2 py-0.5 rounded flex items-center gap-1"><XCircle size={10} /> Perdido</span>}

                                                                        {/* Badge de Negócios */}
                                                                        {temNegocios && (
                                                                            <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full" title={`${contagemNegocios[etapa.id]} negócio(s) nesta etapa`}>
                                                                                {contagemNegocios[etapa.id]}
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* Ações */}
                                                            <div className="flex items-center gap-1">
                                                                {editandoIndex === index ? (
                                                                    <>
                                                                        <button onClick={salvarEdicao} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded" title="Confirmar"><Check size={16} /></button>
                                                                        <button onClick={cancelarEdicao} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Cancelar"><X size={16} /></button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button onClick={() => iniciarEdicao(index)} className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Editar nome">
                                                                            <Pencil size={16} />
                                                                        </button>

                                                                        <button onClick={() => prepararExclusao(index)} disabled={temNegocios || isFixa} className={`p-1.5 rounded ${temNegocios || isFixa ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}`} title={isFixa ? "Não pode ser excluído" : temNegocios ? "Mova os negócios antes de excluir" : "Remover etapa"}><Trash2 size={16} /></button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            );
                                        })}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>

                        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <input type="text" value={novaEtapa} onChange={(e) => setNovaEtapa(e.target.value)} placeholder="Adicionar nova etapa..." className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" onKeyDown={(e) => e.key === 'Enter' && adicionarEtapa()} />
                            <button onClick={adicionarEtapa} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"><Plus size={16} /> Adicionar</button>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmarExclusao}
                title="Excluir Etapa"
                message={`Tem certeza que deseja excluir a etapa "${etapaParaExcluir !== null ? etapas[etapaParaExcluir]?.nome : ''}"? Esta ação não pode ser desfeita.`}
                confirmText="Sim, excluir"
                cancelText="Cancelar"
                isDestructive={true}
            />
        </>
    );
}