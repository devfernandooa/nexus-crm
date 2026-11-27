import { useState, useEffect } from 'react';
import { X, Calendar, Briefcase, User, Package, CheckCircle, Clock, Pencil } from 'lucide-react';
import { escutarTarefas } from '@/services/tarefaService';
import { useAuth } from '@/hooks/useAuth';

export default function NegocioDrawer({ negocio, isOpen, onClose, onEdit }) {
    const { dadosUsuario } = useAuth();
    const [activeTab, setActiveTab] = useState('visao');
    const [tarefasVinculadas, setTarefasVinculadas] = useState([]);

    useEffect(() => {
        if (!isOpen || !negocio?.id || activeTab !== 'atividades') return;

        const unsub = escutarTarefas(dadosUsuario?.empresaId, (lista) => {
            setTarefasVinculadas(lista.filter(t => t.negocioId === negocio.id));
        });
        return () => unsub();
    }, [isOpen, negocio?.id, activeTab, dadosUsuario?.empresaId]);

    if (!isOpen || !negocio) return null;

    const toNumeroSeguro = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };

    const fmtMoney = (v) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toNumeroSeguro(v));
    const fmtDate = (d) => d ? new Date(d.seconds * 1000).toLocaleDateString('pt-BR') : '-';

    const itensNormalizados = (Array.isArray(negocio.produtos) && negocio.produtos.length > 0
        ? negocio.produtos
        : Array.isArray(negocio.pedidos)
            ? negocio.pedidos
            : []
    ).map((p) => {
        if (typeof p === 'string') {
            return { nome: p, tipo: 'Produto', quantidade: 1, preco: 0 };
        }
        const qtd = Math.max(1, Math.floor(toNumeroSeguro(p?.quantidade)) || 1);
        const precoUnit = toNumeroSeguro(p?.subtotal ?? p?.preco ?? p?.valorUnitario ?? p?.precoUnitario);
        return {
            nome: p?.nome || p?.produto || 'Produto',
            tipo: p?.tipo || 'Serviço',
            quantidade: qtd,
            preco: precoUnit,
        };
    });

    const valorTotalSeguro = toNumeroSeguro(negocio.valor ?? negocio.valorTotal);

    const handleEditClick = () => {
        if (onEdit) onEdit(negocio);
        onClose();
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'visao':
                return (
                    <div className="space-y-6 p-5">
                        {/* Card Financeiro */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Resumo Financeiro</h3>
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-xs text-slate-500 font-medium">Valor Total</span>
                                <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">{fmtMoney(valorTotalSeguro)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700/50">
                                <span className="text-xs text-slate-500 font-medium">Etapa Atual</span>
                                <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wide rounded-full border border-emerald-200/80 dark:border-emerald-500/30">
                                    {negocio.status}
                                </span>
                            </div>
                        </div>

                        {/* Informações do Contato */}
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informações do Contato</h3>
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/70 dark:border-emerald-500/25 rounded-lg">
                                    <User size={16} className="text-emerald-700 dark:text-emerald-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{negocio.contato || negocio.contatoNome || 'Não informado'}</p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mt-0.5">Cliente Principal</p>
                                </div>
                            </div>
                        </div>
                        {/* Responsável pelo Atendimento */}
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsável</h3>
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                                <div className="p-2 bg-slate-100 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600/50 rounded-lg">
                                    <User size={16} className="text-slate-700 dark:text-slate-200" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {negocio.responsavelNome || negocio.vendedorNome || 'Não atribuído'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mt-0.5">
                                        Vendedor / Responsável
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Produtos e Serviços (ENRIQUECIDO) */}
                        {itensNormalizados.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Produtos / Serviços ({itensNormalizados.length})</h3>
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                                    {itensNormalizados.map((p, i) => (
                                        <div key={i} className={`flex justify-between items-center p-3 ${i !== itensNormalizados.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/50' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/70 dark:border-emerald-500/25 rounded-md">
                                                    <Package size={14} className="text-emerald-700 dark:text-emerald-300" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {p.quantidade > 1 ? `${p.quantidade}x ${p.nome}` : p.nome}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500">{p.tipo}</p>
                                                </div>
                                            </div>
                                            <span className="font-semibold text-sm text-slate-900 dark:text-white">{fmtMoney(p.preco)}</span>
                                        </div>
                                    ))}
                                    <div className="bg-slate-50 dark:bg-slate-800/80 p-3 flex justify-between items-center border-t border-slate-200 dark:border-slate-700/50">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
                                        <span className="font-bold text-base text-emerald-700 dark:text-emerald-400">{fmtMoney(valorTotalSeguro)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'atividades':
                return (
                    <div className="p-4 space-y-3">
                        {tarefasVinculadas.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <Clock size={32} className="mx-auto mb-2 opacity-50" />
                                <p>Nenhuma atividade vinculada</p>
                            </div>
                        ) : tarefasVinculadas.map(t => (
                            <div key={t.id} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className={`mt-1 p-1 rounded-full ${t.concluida ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {t.concluida ? <CheckCircle size={14} /> : <Clock size={14} />}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-medium ${t.concluida ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>{t.titulo}</p>
                                    <p className="text-xs text-slate-500 mt-1">Vence: {fmtDate(t.dataVencimento)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'produtos':
                return (
                    <div className="p-5 space-y-3">
                        {itensNormalizados.length > 0 ? (
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                                {itensNormalizados.map((p, i) => (
                                    <div key={i} className={`flex justify-between items-center p-3 ${i !== itensNormalizados.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/50' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/70 dark:border-emerald-500/25 rounded-md">
                                                <Package size={14} className="text-emerald-700 dark:text-emerald-300" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {p.quantidade > 1 ? `${p.quantidade}x ${p.nome}` : p.nome}
                                                </p>
                                                <p className="text-[10px] text-slate-500">{p.tipo}</p>
                                            </div>
                                        </div>
                                        <span className="font-semibold text-sm text-slate-900 dark:text-white">{fmtMoney(p.preco)}</span>
                                    </div>
                                ))}
                                <div className="bg-slate-50 dark:bg-slate-800/80 p-3 flex justify-between items-center border-t border-slate-200 dark:border-slate-700/50">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
                                    <span className="font-bold text-base text-emerald-700 dark:text-emerald-400">{fmtMoney(valorTotalSeguro)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Package size={32} className="mx-auto mb-2 opacity-50" />
                                <p>Nenhum produto ou serviço vinculado</p>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/60 z-40 transition-opacity backdrop-blur-[2px]" onClick={onClose} />

            {/* Painel Lateral */}
            <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-slate-200 dark:border-slate-800">

                {/* Header do Drawer em Verde Claro */}
                <div className="p-4 border-b border-emerald-100 dark:border-emerald-900/50 flex justify-between items-center bg-emerald-50/70 dark:bg-emerald-950/30 shrink-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                        <span className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200/80 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                            <Briefcase size={17} />
                        </span>
                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                            {negocio.titulo}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 hover:bg-emerald-100/70 dark:hover:bg-emerald-500/15 rounded-lg transition-colors text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navegação por Abas */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    {[
                        { id: 'visao', label: 'Visão Geral', icon: <Briefcase size={14} /> },
                        { id: 'atividades', label: 'Atividades', icon: <Calendar size={14} /> },
                        { id: 'produtos', label: 'Produtos', icon: <Package size={14} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wide transition-colors border-b-2 
                ${activeTab === tab.id
                                    ? 'border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-500/10'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Conteúdo Scrollável */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                    {renderContent()}
                </div>

                {/* RODAPÉ COM BOTÕES CORRIGIDOS */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-3">
                    <button
                        type="button"
                        onClick={handleEditClick}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-xl font-semibold text-sm transition-colors shadow-sm"
                    >
                        <Pencil size={16} /> Editar
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 bg-white dark:bg-transparent border border-emerald-300 dark:border-emerald-700/70 text-emerald-700 dark:text-emerald-300 rounded-xl font-semibold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </>
    );
}