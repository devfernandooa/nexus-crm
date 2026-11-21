import { useState, useEffect, useRef } from 'react';
import { buscarConfiguracoesEmpresa, atualizarFunilVendas } from '@/services/empresaService';
import { buscarContagemNegociosPorEtapa } from '@/services/negocioService';
import { migrarFunilAntigo, gerarSlug } from '@/utils/funilUtils';
import { CORES_FUNIL, LISTA_CORES_FUNIL, obterCorPadraoId } from '@/constants/funilCores';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, GripVertical, Pencil, Check, X, AlertTriangle, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ModalConfigurarFunil({ isOpen, onClose, empresaId }) {
    const [etapas, setEtapas] = useState([]);
    const [novaEtapa, setNovaEtapa] = useState('');
    const [corNovaEtapa, setCorNovaEtapa] = useState('sky');
    const [salvando, setSalvando] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [contagemNegocios, setContagemNegocios] = useState({});

    const [etapaParaExcluir, setEtapaParaExcluir] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const [editandoIndex, setEditandoIndex] = useState(null);
    const [textoEdicao, setTextoEdicao] = useState('');
    const [corPopoverIndex, setCorPopoverIndex] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !empresaId) return;

        const carregar = async () => {
            setCarregando(true);

            const [resConfig, resContagem] = await Promise.all([
                buscarConfiguracoesEmpresa(empresaId),
                buscarContagemNegociosPorEtapa(empresaId)
            ]);

            const etapasFormatadas = migrarFunilAntigo(resConfig.dados?.etapasFunil || []).map((etapa, idx) => ({
                ...etapa,
                cor: etapa.cor && CORES_FUNIL[etapa.cor] ? etapa.cor : obterCorPadraoId(etapa, idx),
            }));

            setEtapas(etapasFormatadas);
            setCorNovaEtapa(obterCorPadraoId({}, etapasFormatadas.length));
            setCorPopoverIndex(null);

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

        if (reorderedItem.tipo === 'ganho' && result.destination.index !== (items.length - 1)) {
            toast.error('A etapa de Ganho deve ser a última etapa principal do funil.');
            return;
        }

        items.splice(result.destination.index, 0, reorderedItem);
        setEtapas(items);
        setCorPopoverIndex(null);
    };

    const iniciarEdicao = (index) => {
        const etapaAtual = etapas[index];
        setEditandoIndex(index);
        setTextoEdicao(etapaAtual.nome);
        setCorPopoverIndex(null);
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
        novasEtapas[editandoIndex].nome = nomeLimpo;
        setEtapas(novasEtapas);
        setEditandoIndex(null);
    };

    const cancelarEdicao = () => {
        setEditandoIndex(null);
        setTextoEdicao('');
    };

    const alterarCorEtapa = (index, corId) => {
        const novasEtapas = [...etapas];
        novasEtapas[index] = { ...novasEtapas[index], cor: corId };
        setEtapas(novasEtapas);
        setCorPopoverIndex(null);
    };

    const restaurarCoresPadrao = () => {
        const restauradas = etapas.map((etapa, idx) => ({
            ...etapa,
            cor: obterCorPadraoId(etapa, idx),
        }));
        setEtapas(restauradas);
        setCorPopoverIndex(null);
        toast.success('Esquema de cores padrão restaurado!');
    };

    const adicionarEtapa = () => {
        if (!novaEtapa.trim()) return;
        if (etapas.some(e => e.nome.toLowerCase() === novaEtapa.trim().toLowerCase())) {
            toast.error('Essa etapa já existe!');
            return;
        }

        const nova = {
            id: gerarSlug(novaEtapa.trim()),
            nome: novaEtapa.trim(),
            tipo: 'aberto',
            cor: corNovaEtapa || obterCorPadraoId({}, etapas.length),
        };

        if (etapas.some(e => e.id === nova.id)) {
            toast.error('Já existe uma etapa com esse ID interno. Escolha outro nome.');
            return;
        }

        const proximas = [...etapas, nova];
        setEtapas(proximas);
        setNovaEtapa('');
        setCorNovaEtapa(obterCorPadraoId({}, proximas.length));
    };

    const prepararExclusao = (index) => {
        const etapa = etapas[index];

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

    const negociosOrfaos = Object.keys(contagemNegocios).filter(
        status => !etapas.some(e => e.id === status)
    );

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Configurar Etapas do Funil"
                size="lg"
                footer={
                    <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                        <button
                            type="button"
                            onClick={restaurarCoresPadrao}
                            disabled={salvando || carregando}
                            className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                            title="Voltar todas as etapas às cores padrão"
                        >
                            <RotateCcw size={14} /> Restaurar cores padrão
                        </button>

                        <div className="flex items-center gap-3 ml-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={salvarFunil}
                                disabled={salvando || carregando}
                                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save size={16} /> {salvando ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
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

                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Arraste para reordenar, clique na bolinha para escolher a cor ou no lápis para editar o nome.
                        </p>

                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="etapas-funil">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                                        {etapas.map((etapa, index) => {
                                            const temNegocios = contagemNegocios[etapa.id] > 0;
                                            const isFixa = etapa.tipo === 'ganho' || etapa.tipo === 'perdido';
                                            const corAtual = CORES_FUNIL[etapa.cor] || CORES_FUNIL[obterCorPadraoId(etapa, index)];

                                            return (
                                                <Draggable key={etapa.id} draggableId={etapa.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className={`relative flex items-center gap-2 p-2 rounded-lg border transition-all ${snapshot.isDragging
                                                                    ? 'shadow-lg ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 z-10'
                                                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                                                } ${editandoIndex === index ? 'ring-2 ring-blue-400 bg-white dark:bg-slate-900' : ''}`}
                                                        >
                                                            {/* Handle de Arrasto */}
                                                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600">
                                                                <GripVertical size={16} />
                                                            </div>

                                                            {/* Seletor de Cor da Etapa */}
                                                            <div className="relative">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setCorPopoverIndex(corPopoverIndex === index ? null : index)}
                                                                    className="w-6 h-6 rounded-full flex items-center justify-center border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:scale-105 transition-transform"
                                                                    title={`Cor: ${corAtual.nome} (clique para alterar)`}
                                                                >
                                                                    <span className={`w-3.5 h-3.5 rounded-full ${corAtual.swatch}`} />
                                                                </button>

                                                                {corPopoverIndex === index && (
                                                                    <div className="absolute left-0 top-8 z-30 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center gap-1.5">
                                                                        {LISTA_CORES_FUNIL.map((corItem) => (
                                                                            <button
                                                                                key={corItem.id}
                                                                                type="button"
                                                                                onClick={() => alterarCorEtapa(index, corItem.id)}
                                                                                className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${corItem.swatch} ${corAtual.id === corItem.id ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-slate-900' : ''
                                                                                    }`}
                                                                                title={corItem.nome}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Conteúdo */}
                                                            <div className="flex-1 min-w-0 flex items-center gap-2">
                                                                {editandoIndex === index ? (
                                                                    <input
                                                                        ref={inputRef}
                                                                        type="text"
                                                                        value={textoEdicao}
                                                                        onChange={(e) => setTextoEdicao(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') salvarEdicao();
                                                                            if (e.key === 'Escape') cancelarEdicao();
                                                                        }}
                                                                        onBlur={salvarEdicao}
                                                                        className="w-full px-2 py-1 text-sm bg-transparent border-b border-blue-500 focus:outline-none text-slate-900 dark:text-white font-medium"
                                                                        placeholder="Nome da etapa..."
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        <span
                                                                            onClick={() => iniciarEdicao(index)}
                                                                            className={`block truncate font-medium py-1 ${temNegocios || isFixa
                                                                                    ? 'text-slate-500 cursor-not-allowed'
                                                                                    : 'text-slate-700 dark:text-slate-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400'
                                                                                }`}
                                                                            title={
                                                                                isFixa
                                                                                    ? 'Etapa do sistema'
                                                                                    : temNegocios
                                                                                        ? 'Não é possível editar uma etapa com negócios'
                                                                                        : 'Clique para editar'
                                                                            }
                                                                        >
                                                                            {etapa.nome}
                                                                        </span>

                                                                        {etapa.tipo === 'ganho' && (
                                                                            <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1">
                                                                                <CheckCircle2 size={10} /> Ganho
                                                                            </span>
                                                                        )}
                                                                        {etapa.tipo === 'perdido' && (
                                                                            <span className="text-[10px] uppercase font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 px-2 py-0.5 rounded flex items-center gap-1">
                                                                                <XCircle size={10} /> Perdido
                                                                            </span>
                                                                        )}

                                                                        {temNegocios && (
                                                                            <span
                                                                                className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full"
                                                                                title={`${contagemNegocios[etapa.id]} negócio(s) nesta etapa`}
                                                                            >
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
                                                                        <button type="button" onClick={salvarEdicao} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded" title="Confirmar">
                                                                            <Check size={16} />
                                                                        </button>
                                                                        <button type="button" onClick={cancelarEdicao} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Cancelar">
                                                                            <X size={16} />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button type="button" onClick={() => iniciarEdicao(index)} className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Editar nome">
                                                                            <Pencil size={16} />
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => prepararExclusao(index)}
                                                                            disabled={temNegocios || isFixa}
                                                                            className={`p-1.5 rounded ${temNegocios || isFixa
                                                                                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                                                                    : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                                                }`}
                                                                            title={isFixa ? 'Não pode ser excluído' : temNegocios ? 'Mova os negócios antes de excluir' : 'Remover etapa'}
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
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

                        {/* Nova Etapa + Escolha de Cor */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Cor da nova etapa:
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {LISTA_CORES_FUNIL.map((corItem) => (
                                        <button
                                            key={corItem.id}
                                            type="button"
                                            onClick={() => setCorNovaEtapa(corItem.id)}
                                            className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${corItem.swatch} ${corNovaEtapa === corItem.id
                                                    ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-slate-900 scale-110'
                                                    : 'opacity-80 hover:opacity-100'
                                                }`}
                                            title={corItem.nome}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={novaEtapa}
                                    onChange={(e) => setNovaEtapa(e.target.value)}
                                    placeholder="Adicionar nova etapa..."
                                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    onKeyDown={(e) => e.key === 'Enter' && adicionarEtapa()}
                                />
                                <button
                                    type="button"
                                    onClick={adicionarEtapa}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                                >
                                    <Plus size={16} /> Adicionar
                                </button>
                            </div>
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