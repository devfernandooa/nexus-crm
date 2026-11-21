import { useState, useEffect, useRef } from 'react';
import { buscarConfiguracoesEmpresa, atualizarFunilVendas } from '@/services/empresaService';
import { buscarContagemNegociosPorEtapa } from '@/services/negocioService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal'; // <-- Importação padronizada
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, GripVertical, Pencil, Check, X, AlertTriangle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ModalConfigurarFunil({ isOpen, onClose, empresaId }) {
    const [etapas, setEtapas] = useState([]);
    const [novaEtapa, setNovaEtapa] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [contagemNegocios, setContagemNegocios] = useState({});

    // NOVO: Estados para o modal de confirmação de exclusão
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

            if (resConfig.sucesso && resConfig.dados?.etapasFunil?.length > 0) {
                setEtapas(resConfig.dados.etapasFunil);
            } else {
                setEtapas(['Prospecção', 'Qualificação', 'Proposta']);
            }

            if (resContagem.sucesso) {
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
        items.splice(result.destination.index, 0, reorderedItem);
        setEtapas(items);
    };

    const iniciarEdicao = (index) => {
        const etapaAtual = etapas[index];
        if (contagemNegocios[etapaAtual] > 0) {
            toast.error(`Não é possível renomear. Existem ${contagemNegocios[etapaAtual]} negócios nesta etapa.`);
            return;
        }
        setEditandoIndex(index);
        setTextoEdicao(etapaAtual);
    };

    const salvarEdicao = () => {
        if (editandoIndex === null) return;
        const nomeLimpo = textoEdicao.trim();
        if (!nomeLimpo) {
            toast.error('O nome da etapa não pode ser vazio!');
            return;
        }
        const existeDuplicata = etapas.some((e, i) => i !== editandoIndex && e.toLowerCase() === nomeLimpo.toLowerCase());
        if (existeDuplicata) {
            toast.error('Já existe uma etapa com esse nome!');
            return;
        }
        const novasEtapas = [...etapas];
        novasEtapas[editandoIndex] = nomeLimpo;
        setEtapas(novasEtapas);
        setEditandoIndex(null);
    };

    const cancelarEdicao = () => {
        setEditandoIndex(null);
        setTextoEdicao('');
    };

    const adicionarEtapa = () => {
        if (!novaEtapa.trim()) return;
        if (etapas.some(e => e.toLowerCase() === novaEtapa.trim().toLowerCase())) {
            toast.error('Essa etapa já existe!');
            return;
        }
        setEtapas([...etapas, novaEtapa.trim()]);
        setNovaEtapa('');
    };

    // NOVO: Prepara a exclusão abrindo o modal de confirmação
    const prepararExclusao = (index) => {
        if (etapas.length <= 1) {
            toast.error('O funil precisa ter pelo menos uma etapa!');
            return;
        }
        const etapaParaRemover = etapas[index];
        if (contagemNegocios[etapaParaRemover] > 0) {
            toast.error(`Não é possível excluir. Existem ${contagemNegocios[etapaParaRemover]} negócios nesta etapa.`);
            return;
        }

        setEtapaParaExcluir(index);
        setIsConfirmModalOpen(true);
    };

    // NOVO: Executa a exclusão após o usuário confirmar
    const confirmarExclusao = () => {
        if (etapaParaExcluir !== null) {
            setEtapas(etapas.filter((_, i) => i !== etapaParaExcluir));
            setEtapaParaExcluir(null);
        }
        setIsConfirmModalOpen(false);
    };

    const salvarFunil = async () => {
        setSalvando(true);
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

    const negociosOrfaos = Object.keys(contagemNegocios).filter(status => !etapas.includes(status));

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Configurar Etapas do Funil"
                size="md"
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
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-500/50 rounded-xl flex gap-3 items-start text-red-800 dark:text-red-200 shadow-sm animate-pulse-slow">
                                <AlertTriangle size={24} className="shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-base mb-1">Ação Necessária!</h4>
                                    <p className="text-sm">
                                        Existem negócios presos em etapas que foram excluídas (ex: <strong className="font-bold underline">{negociosOrfaos.join(', ')}</strong>).
                                        Vá na Lista de Negócios, edite esses negócios e mova-os para uma etapa válida para não perder o rastreio deles.
                                    </p>
                                </div>
                            </div>
                        )}

                        <p className="text-sm text-slate-500">Arraste para reordenar ou clique no lápis para editar o nome.</p>

                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="etapas-funil">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                        {etapas.map((etapa, index) => {
                                            const temNegocios = contagemNegocios[etapa] > 0;
                                            return (
                                                <Draggable key={etapa} draggableId={etapa} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div ref={provided.innerRef} {...provided.draggableProps} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 z-10' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'} ${editandoIndex === index ? 'ring-2 ring-blue-400 bg-white dark:bg-slate-900' : ''}`}>
                                                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600">
                                                                <GripVertical size={16} />
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                {editandoIndex === index ? (
                                                                    <input ref={inputRef} type="text" value={textoEdicao} onChange={(e) => setTextoEdicao(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') salvarEdicao(); if (e.key === 'Escape') cancelarEdicao(); }} onBlur={salvarEdicao} className="w-full px-2 py-1 text-sm bg-transparent border-b border-blue-500 focus:outline-none text-slate-900 dark:text-white font-medium" placeholder="Nome da etapa..." />
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        <span onClick={() => iniciarEdicao(index)} className={`block truncate font-medium py-1 ${temNegocios ? 'text-slate-500 cursor-not-allowed' : 'text-slate-700 dark:text-slate-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400'}`} title={temNegocios ? "Não é possível editar uma etapa com negócios" : "Clique para editar"}>
                                                                            {etapa}
                                                                        </span>
                                                                        {temNegocios && (
                                                                            <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full" title={`${contagemNegocios[etapa]} negócio(s) nesta etapa`}>
                                                                                {contagemNegocios[etapa]}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-1">
                                                                {editandoIndex === index ? (
                                                                    <>
                                                                        <button onClick={salvarEdicao} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded" title="Confirmar"><Check size={16} /></button>
                                                                        <button onClick={cancelarEdicao} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Cancelar"><X size={16} /></button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button onClick={() => iniciarEdicao(index)} disabled={temNegocios} className={`p-1.5 rounded ${temNegocios ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`} title={temNegocios ? "Mova os negócios antes de editar" : "Editar nome"}><Pencil size={16} /></button>

                                                                        {/* NOVO: Chama a função prepararExclusao */}
                                                                        <button onClick={() => prepararExclusao(index)} disabled={temNegocios} className={`p-1.5 rounded ${temNegocios ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}`} title={temNegocios ? "Mova os negócios antes de excluir" : "Remover etapa"}><Trash2 size={16} /></button>
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

            {/* NOVO: Modal de Confirmação de Exclusão */}
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmarExclusao}
                title="Excluir Etapa"
                message={`Tem certeza que deseja excluir a etapa "${etapaParaExcluir !== null ? etapas[etapaParaExcluir] : ''}"? Esta ação não pode ser desfeita.`}
                confirmText="Sim, excluir"
                cancelText="Cancelar"
                isDestructive={true}
            />
        </>
    );
}