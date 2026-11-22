import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { escutarTarefas, adicionarTarefa, atualizarTarefa, deletarTarefa } from '@/services/tarefaService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PageHeader from '@/components/ui/PageHeader';
import toast from 'react-hot-toast';
import {
    Plus,
    CheckSquare,
    Square,
    Trash2,
    Calendar,
    Pencil,
    Kanban,
    List,
    Clock,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    RotateCcw,
    CalendarClock,
    FileText,
} from 'lucide-react';

function obterDataISOComOffset(diasOffset = 0) {
    const data = new Date();
    data.setDate(data.getDate() + diasOffset);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function diferencaDiasEmRelacaoHoje(dataISO, hojeISO) {
    if (!dataISO) return null;
    const [anoA, mesA, diaA] = dataISO.split('-').map(Number);
    const [anoB, mesB, diaB] = hojeISO.split('-').map(Number);
    const utcA = Date.UTC(anoA, mesA - 1, diaA);
    const utcB = Date.UTC(anoB, mesB - 1, diaB);
    return Math.round((utcA - utcB) / (1000 * 60 * 60 * 24));
}

export default function Tarefas() {
    const { dadosUsuario } = useAuth();
    const [tarefas, setTarefas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [idParaDeletar, setIdParaDeletar] = useState(null);
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'lista'
    const [filtroLista, setFiltroLista] = useState('todas'); // 'todas' | 'pendentes' | 'concluidas'

    // Estados do Formulário Principal
    const [tarefaEditando, setTarefaEditando] = useState(null);
    const [titulo, setTitulo] = useState('');
    const [dataVencimento, setDataVencimento] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [salvando, setSalvando] = useState(false);

    // Estado para Renovar Data rapidamente de qualquer tarefa
    const [tarefaRenovando, setTarefaRenovando] = useState(null);
    const [novaDataRenovacao, setNovaDataRenovacao] = useState('');
    const [salvandoRenovacao, setSalvandoRenovacao] = useState(false);

    useEffect(() => {
        if (!dadosUsuario?.empresaId) return;
        const unsubscribe = escutarTarefas(dadosUsuario.empresaId, (lista) => {
            setTarefas(lista);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [dadosUsuario?.empresaId]);

    const hojeISO = obterDataISOComOffset(0);

    const { pendentes, vencidas, concluidas } = useMemo(() => {
        const listaPendentes = [];
        const listaVencidas = [];
        const listaConcluidas = [];

        tarefas.forEach((t) => {
            if (t.concluida) {
                listaConcluidas.push(t);
            } else if (t.dataVencimento && t.dataVencimento < hojeISO) {
                listaVencidas.push(t);
            } else {
                listaPendentes.push(t);
            }
        });

        return {
            pendentes: listaPendentes,
            vencidas: listaVencidas,
            concluidas: listaConcluidas,
        };
    }, [tarefas, hojeISO]);

    const tarefasListaFiltrada = useMemo(() => {
        if (filtroLista === 'pendentes') return tarefas.filter((t) => !t.concluida);
        if (filtroLista === 'concluidas') return tarefas.filter((t) => t.concluida);
        return tarefas;
    }, [tarefas, filtroLista]);

    const colunasKanban = [
        {
            id: 'pendentes',
            titulo: 'Pendentes',
            badgeClass:
                'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
            headerClass:
                'bg-emerald-100/75 dark:bg-emerald-950/65 border-b border-emerald-200/70 dark:border-emerald-800/60',
            icon: <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />,
            itens: pendentes,
        },
        {
            id: 'vencidas',
            titulo: 'Vencidas',
            badgeClass:
                'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
            headerClass:
                'bg-amber-100/75 dark:bg-amber-950/55 border-b border-amber-200/70 dark:border-amber-800/60',
            icon: <AlertCircle size={14} className="text-amber-600 dark:text-amber-400" />,
            itens: vencidas,
        },
        {
            id: 'concluidas',
            titulo: 'Concluídas',
            badgeClass:
                'bg-emerald-100 text-emerald-800 border-emerald-300/80 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/35',
            headerClass:
                'bg-teal-100/75 dark:bg-teal-950/65 border-b border-teal-200/70 dark:border-teal-800/60',
            icon: <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />,
            itens: concluidas,
        },
    ];

    function abrirModalCriar(dataSugerida = '') {
        setTarefaEditando(null);
        setTitulo('');
        setDataVencimento(dataSugerida);
        setObservacoes('');
        setIsModalOpen(true);
    }

    function handleEditar(tarefa) {
        setTarefaEditando(tarefa.id);
        setTitulo(tarefa.titulo);
        setDataVencimento(tarefa.dataVencimento || '');
        setObservacoes(tarefa.observacoes || '');
        setIsModalOpen(true);
    }

    function abrirRenovarData(tarefa) {
        setTarefaRenovando(tarefa);
        setNovaDataRenovacao(
            tarefa.dataVencimento && tarefa.dataVencimento >= hojeISO
                ? tarefa.dataVencimento
                : obterDataISOComOffset(1)
        );
    }

    async function confirmarRenovacaoData(e) {
        e.preventDefault();
        if (!tarefaRenovando) return;
        setSalvandoRenovacao(true);
        const res = await atualizarTarefa(tarefaRenovando.id, {
            dataVencimento: novaDataRenovacao || '',
        });
        if (res?.sucesso) {
            toast.success('Data da tarefa atualizada!');
            setTarefaRenovando(null);
        } else {
            toast.error('Erro ao renovar data da tarefa.');
        }
        setSalvandoRenovacao(false);
    }

    function handleDeletar(id) {
        setIdParaDeletar(id);
        setIsConfirmOpen(true);
    }

    async function confirmarDelecao() {
        const resultado = await deletarTarefa(idParaDeletar);
        if (resultado.sucesso) {
            toast.success('Tarefa excluída!');
            setIsConfirmOpen(false);
        } else {
            toast.error('Erro ao excluir tarefa.');
        }
    }

    async function toggleConcluida(tarefa) {
        const res = await atualizarTarefa(tarefa.id, { concluida: !tarefa.concluida });
        if (res?.sucesso) {
            toast.success(!tarefa.concluida ? 'Tarefa concluída!' : 'Tarefa reaberta!');
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSalvando(true);
        const dados = { titulo, dataVencimento, observacoes };

        let resultado;
        if (tarefaEditando) {
            const dadosUpdate = { ...dados };
            delete dadosUpdate.concluida;
            resultado = await atualizarTarefa(tarefaEditando, dadosUpdate);
        } else {
            resultado = await adicionarTarefa(dados, dadosUsuario.empresaId);
        }

        if (resultado.sucesso) {
            toast.success(tarefaEditando ? 'Tarefa atualizada!' : 'Tarefa criada!');
            setIsModalOpen(false);
        } else {
            toast.error('Erro: ' + resultado.erro);
        }
        setSalvando(false);
    }

    function formatarDataVencimento(dataString) {
        if (!dataString) return '';
        const [ano, mes, dia] = dataString.split('-');
        return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR');
    }

    function getInfoPrazo(tarefa) {
        if (tarefa.concluida) {
            return {
                label: 'Concluída',
                className:
                    'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
            };
        }
        if (!tarefa.dataVencimento) {
            return {
                label: 'Sem prazo',
                className:
                    'bg-slate-100 text-slate-600 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
            };
        }

        const diff = diferencaDiasEmRelacaoHoje(tarefa.dataVencimento, hojeISO);
        if (diff < 0) {
            return {
                label: `Vencida há ${Math.abs(diff)}d`,
                className:
                    'bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
            };
        }
        if (diff === 0) {
            return {
                label: 'Vence hoje',
                className:
                    'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
            };
        }
        return {
            label: `Em ${diff}d`,
            className:
                'bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800/90 dark:text-slate-300 dark:border-slate-700',
        };
    }

    const totalPendentes = pendentes.length + vencidas.length;

    return (
        <div className="w-full min-h-full flex flex-col px-4 sm:px-6 lg:px-7 py-4 sm:py-5 bg-slate-50/60 dark:bg-slate-950 transition-colors text-left">
            <PageHeader
                icon={<CheckSquare size={18} />}
                title="Tarefas"
                subtitle={`Você tem ${totalPendentes} tarefa(s) pendente(s).`}
                action={
                    <div className="flex items-center gap-2 w-full sm:w-auto mr-1">
                        <div className="flex bg-white dark:bg-[#0b192c] border border-slate-200/90 dark:border-slate-800 p-1 rounded-lg shadow-2xs">
                            <button
                                type="button"
                                onClick={() => setViewMode('kanban')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${viewMode === 'kanban'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 shadow-2xs'
                                        : 'border border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <Kanban size={15} /> Kanban
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('lista')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${viewMode === 'lista'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 shadow-2xs'
                                        : 'border border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <List size={15} /> Lista
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => abrirModalCriar('')}
                            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                        >
                            <Plus size={16} /> Nova Tarefa
                        </button>
                    </div>
                }
            />

            {/* Resumo / KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-white dark:bg-[#0b192c] rounded-xl border border-slate-200/90 dark:border-slate-800 px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Pendentes
                        </p>
                        <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                            {pendentes.length}
                        </p>
                    </div>
                    <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        <Clock size={16} />
                    </span>
                </div>

                <div className="bg-white dark:bg-[#0b192c] rounded-xl border border-slate-200/90 dark:border-slate-800 px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Vencidas
                        </p>
                        <p className="text-base sm:text-lg font-bold text-amber-700 dark:text-amber-300 tabular-nums mt-0.5">
                            {vencidas.length}
                        </p>
                    </div>
                    <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        <AlertCircle size={16} />
                    </span>
                </div>

                <div className="bg-white dark:bg-[#0b192c] rounded-xl border border-slate-200/90 dark:border-slate-800 px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Concluídas
                        </p>
                        <p className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5">
                            {concluidas.length}
                        </p>
                    </div>
                    <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 size={16} />
                    </span>
                </div>
            </div>

            {/* Conteúdo Principal */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-72 rounded-xl bg-slate-200/70 dark:bg-slate-800/60" />
                    ))}
                </div>
            ) : viewMode === 'kanban' ? (
                /* VISÃO KANBAN */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start flex-1">
                    {colunasKanban.map((coluna) => (
                        <div
                            key={coluna.id}
                            className="rounded-xl bg-white dark:bg-[#0b192c] border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col"
                        >
                            {/* Cabeçalho da Coluna */}
                            <div className={`px-4 py-3 flex items-center justify-between gap-2 ${coluna.headerClass}`}>
                                <div className="flex items-center gap-2 min-w-0">
                                    {coluna.icon}
                                    <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                        {coluna.titulo}
                                    </h2>
                                </div>
                                <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded-full border tabular-nums ${coluna.badgeClass}`}
                                >
                                    {coluna.itens.length}
                                </span>
                            </div>

                            {/* Cards da Coluna */}
                            <div className="p-3 space-y-2.5 bg-slate-50/50 dark:bg-slate-950/35 min-h-[220px]">
                                {coluna.itens.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center space-y-2">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Nenhuma tarefa nesta etapa.
                                        </p>
                                        {coluna.id !== 'concluidas' && (
                                            <button
                                                type="button"
                                                onClick={() => abrirModalCriar('')}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                                            >
                                                <Plus size={13} /> Adicionar tarefa
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    coluna.itens.map((tarefa) => {
                                        const prazoInfo = getInfoPrazo(tarefa);
                                        return (
                                            <div
                                                key={tarefa.id}
                                                className={`group rounded-xl bg-white dark:bg-[#0b192c] border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xs hover:border-emerald-400/70 dark:hover:border-emerald-500/40 transition-all space-y-2.5 ${tarefa.concluida ? 'opacity-80' : ''
                                                    }`}
                                            >
                                                {/* Topo do Card: Checkbox + Título + Editar/Excluir */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleConcluida(tarefa)}
                                                        className="flex items-start gap-2.5 text-left flex-1 min-w-0"
                                                    >
                                                        <span
                                                            className={`mt-0.5 shrink-0 transition-colors ${tarefa.concluida
                                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                                    : 'text-slate-300 dark:text-slate-600 group-hover:text-emerald-500'
                                                                }`}
                                                        >
                                                            {tarefa.concluida ? <CheckSquare size={18} /> : <Square size={18} />}
                                                        </span>
                                                        <span
                                                            className={`text-sm font-semibold leading-snug break-words ${tarefa.concluida
                                                                    ? 'line-through !text-slate-400 dark:!text-slate-500'
                                                                    : '!text-slate-900 dark:!text-white'
                                                                }`}
                                                        >
                                                            {tarefa.titulo}
                                                        </span>
                                                    </button>

                                                    <div className="flex items-center gap-0.5 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditar(tarefa)}
                                                            title="Editar tarefa"
                                                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeletar(tarefa.id)}
                                                            title="Excluir tarefa"
                                                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Observações (se houver) */}
                                                {tarefa.observacoes && (
                                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-900/75 border border-slate-200/70 dark:border-slate-800/90 px-2.5 py-2 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                                                        <FileText size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                                        <p className="line-clamp-2 leading-relaxed break-words">
                                                            {tarefa.observacoes}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Informações de Prazo + Status */}
                                                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                                                    <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 tabular-nums">
                                                        <Calendar size={12} className="shrink-0" />
                                                        {tarefa.dataVencimento
                                                            ? formatarDataVencimento(tarefa.dataVencimento)
                                                            : 'Sem data definida'}
                                                    </span>

                                                    <span
                                                        className={`px-2 py-0.5 rounded-full font-semibold border text-[10px] tabular-nums ${prazoInfo.className}`}
                                                    >
                                                        {prazoInfo.label}
                                                    </span>
                                                </div>

                                                {/* Rodapé do Card: Renovar Data (sempre disponível) + Concluir/Reabrir */}
                                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirRenovarData(tarefa)}
                                                        className="text-[11px] font-semibold text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 bg-slate-100/80 hover:bg-emerald-50 dark:bg-slate-800/80 dark:hover:bg-emerald-500/15 px-2 py-1 rounded-md inline-flex items-center gap-1 transition-colors"
                                                        title="Renovar ou alterar data de vencimento"
                                                    >
                                                        <CalendarClock size={12} /> Renovar data
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => toggleConcluida(tarefa)}
                                                        className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                                                    >
                                                        {tarefa.concluida ? (
                                                            <>
                                                                <RotateCcw size={12} /> Reabrir
                                                            </>
                                                        ) : (
                                                            <>
                                                                Concluir <ArrowRight size={12} />
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* VISÃO LISTA */
                <div className="space-y-4">
                    <div className="flex gap-1.5 bg-white dark:bg-[#0b192c] border border-slate-200/90 dark:border-slate-800 p-1 rounded-xl w-fit shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setFiltroLista('todas')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${filtroLista === 'todas'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                                    : 'border border-transparent !text-slate-600 dark:!text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            Todas
                        </button>
                        <button
                            type="button"
                            onClick={() => setFiltroLista('pendentes')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${filtroLista === 'pendentes'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                                    : 'border border-transparent !text-slate-600 dark:!text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            Pendentes
                        </button>
                        <button
                            type="button"
                            onClick={() => setFiltroLista('concluidas')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${filtroLista === 'concluidas'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                                    : 'border border-transparent !text-slate-600 dark:!text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            Concluídas
                        </button>
                    </div>

                    {tarefasListaFiltrada.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-[#0b192c] rounded-xl border border-slate-200/90 dark:border-slate-800">
                            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600 dark:text-emerald-400">
                                <CheckSquare size={26} />
                            </div>
                            <h3 className="text-base font-bold !text-slate-900 dark:!text-white mb-1">
                                Nenhuma tarefa encontrada
                            </h3>
                            <p className="!text-slate-500 dark:!text-slate-400 text-xs sm:text-sm">
                                Crie uma nova tarefa ou mude o filtro acima.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {tarefasListaFiltrada.map((tarefa) => {
                                const prazoInfo = getInfoPrazo(tarefa);
                                return (
                                    <div
                                        key={tarefa.id}
                                        className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#0b192c] border border-slate-200/90 dark:border-slate-800 rounded-xl transition-all ${tarefa.concluida ? 'opacity-70' : 'hover:border-emerald-400/70 dark:hover:border-emerald-500/40'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                            <button
                                                type="button"
                                                onClick={() => toggleConcluida(tarefa)}
                                                className={`mt-0.5 shrink-0 transition-colors ${tarefa.concluida
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-slate-300 dark:text-slate-600 hover:text-emerald-500'
                                                    }`}
                                            >
                                                {tarefa.concluida ? <CheckSquare size={20} /> : <Square size={20} />}
                                            </button>

                                            <div className="flex flex-col min-w-0 gap-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`text-sm font-semibold break-words transition-colors ${tarefa.concluida
                                                                ? 'line-through !text-slate-400 dark:!text-slate-500'
                                                                : '!text-slate-900 dark:!text-white'
                                                            }`}
                                                    >
                                                        {tarefa.titulo}
                                                    </span>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full font-semibold border text-[10px] tabular-nums ${prazoInfo.className}`}
                                                    >
                                                        {prazoInfo.label}
                                                    </span>
                                                </div>

                                                {tarefa.observacoes && (
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 break-words">
                                                        {tarefa.observacoes}
                                                    </p>
                                                )}

                                                {tarefa.dataVencimento && (
                                                    <span className="text-xs !text-slate-500 dark:!text-slate-400 flex items-center gap-1 tabular-nums">
                                                        <Calendar size={12} /> Vence em: {formatarDataVencimento(tarefa.dataVencimento)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-1.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => abrirRenovarData(tarefa)}
                                                className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 bg-slate-100/80 hover:bg-emerald-50 dark:bg-slate-800/80 dark:hover:bg-emerald-500/15 rounded-lg inline-flex items-center gap-1 transition-colors"
                                            >
                                                <CalendarClock size={13} /> Renovar data
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleEditar(tarefa)}
                                                className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeletar(tarefa.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Criação/Edição com Observações */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={tarefaEditando ? 'Editar Tarefa' : 'Nova Tarefa'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider !text-slate-600 dark:!text-slate-300 mb-1.5">
                            O que precisa ser feito? *
                        </label>
                        <input
                            type="text"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                            required
                            placeholder="Ex: Ligar para o cliente"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider !text-slate-600 dark:!text-slate-300 mb-1.5">
                            Data de Vencimento (Opcional)
                        </label>
                        <input
                            type="date"
                            value={dataVencimento}
                            onChange={(e) => setDataVencimento(e.target.value)}
                            className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider !text-slate-600 dark:!text-slate-300 mb-1.5">
                            Observações (Opcional)
                        </label>
                        <textarea
                            rows={3}
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-y"
                            placeholder="Detalhes importantes, contexto da ligação, próximos passos..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800 mt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium !text-slate-600 hover:bg-slate-100 rounded-lg dark:!text-slate-300 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={salvando}
                            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-lg font-semibold transition-colors disabled:opacity-60"
                        >
                            {salvando ? 'Salvando...' : tarefaEditando ? 'Atualizar' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Rápido para Renovar Data de Qualquer Tarefa */}
            <Modal
                isOpen={!!tarefaRenovando}
                onClose={() => setTarefaRenovando(null)}
                title="Renovar Data da Tarefa"
            >
                <form onSubmit={confirmarRenovacaoData} className="space-y-4">
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-3">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tarefa</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                            {tarefaRenovando?.titulo}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setNovaDataRenovacao(obterDataISOComOffset(0))}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-400 transition-colors"
                        >
                            Hoje
                        </button>
                        <button
                            type="button"
                            onClick={() => setNovaDataRenovacao(obterDataISOComOffset(1))}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-400 transition-colors"
                        >
                            Amanhã
                        </button>
                        <button
                            type="button"
                            onClick={() => setNovaDataRenovacao(obterDataISOComOffset(7))}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-400 transition-colors"
                        >
                            +7 dias
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider !text-slate-600 dark:!text-slate-300 mb-1.5">
                            Nova Data de Vencimento
                        </label>
                        <input
                            type="date"
                            value={novaDataRenovacao}
                            onChange={(e) => setNovaDataRenovacao(e.target.value)}
                            className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800 mt-4">
                        <button
                            type="button"
                            onClick={() => setTarefaRenovando(null)}
                            className="px-4 py-2 text-sm font-medium !text-slate-600 hover:bg-slate-100 rounded-lg dark:!text-slate-300 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={salvandoRenovacao}
                            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-lg font-semibold transition-colors disabled:opacity-60"
                        >
                            {salvandoRenovacao ? 'Salvando...' : 'Salvar Nova Data'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmarDelecao}
                message="Tem certeza que deseja excluir esta tarefa?"
            />
        </div>
    );
}