import { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, User, Package, CheckCircle, Clock, Pencil, ChevronRight } from 'lucide-react';
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

    const fmtMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
    const fmtDate = (d) => d ? new Date(d.seconds * 1000).toLocaleDateString('pt-BR') : '-';

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
                                <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">{fmtMoney(negocio.valor)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700/50">
                                <span className="text-xs text-slate-500 font-medium">Etapa Atual</span>
                                <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wide rounded-full border border-blue-100 dark:border-blue-800/30">
                                    {negocio.status}
                                </span>
                            </div>
                        </div>

                        {/* Informações do Contato */}
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informações do Contato</h3>
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg"><User size={16} className="text-slate-500" /></div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{negocio.contato || 'Não informado'}</p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mt-0.5">Cliente Principal</p>
                                </div>
                            </div>
                        </div>

                        {/* Produtos e Serviços (ENRIQUECIDO) */}
                        {negocio.produtos && negocio.produtos.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Produtos / Serviços ({negocio.produtos.length})</h3>
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                                    {negocio.produtos.map((p, i) => (
                                        <div key={i} className={`flex justify-between items-center p-3 ${i !== negocio.produtos.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/50' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-md"><Package size={14} className="text-slate-500" /></div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{p.nome}</p>
                                                    <p className="text-[10px] text-slate-500">{p.tipo || 'Serviço'}</p>
                                                </div>
                                            </div>
                                            <span className="font-semibold text-sm text-slate-900 dark:text-white">{fmtMoney(p.preco)}</span>
                                        </div>
                                    ))}
                                    <div className="bg-slate-50 dark:bg-slate-800/80 p-3 flex justify-between items-center border-t border-slate-200 dark:border-slate-700/50">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
                                        <span className="font-bold text-base text-blue-600 dark:text-blue-400">{fmtMoney(negocio.valor)}</span>
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
                            <div className="text-center py-8 text-slate-500"><Clock size={32} className="mx-auto mb-2 opacity-50" /><p>Nenhuma atividade vinculada</p></div>
                        ) : tarefasVinculadas.map(t => (
                            <div key={t.id} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className={`mt-1 p-1 rounded-full ${t.concluida ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{t.concluida ? <CheckCircle size={14} /> : <Clock size={14} />}</div>
                                <div className="flex-1">
                                    <p className={`text-sm font-medium ${t.concluida ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>{t.titulo}</p>
                                    <p className="text-xs text-slate-500 mt-1">Vence: {fmtDate(t.dataVencimento)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'produtos':
                // Reutiliza a lógica de produtos se quiser uma aba dedicada, ou redireciona para visao
                return renderContent();
            default: return null;
        }
    };

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/60 z-40 transition-opacity backdrop-blur-[2px]" onClick={onClose} />

            {/* Painel Lateral */}
            <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-slate-200 dark:border-slate-800">

                {/* Header do Drawer - CORREÇÃO DE CONTRASTE E REMOÇÃO DE ID */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex-1 pr-4">
                        {/* Título agora é text-slate-900 (quase preto) para máximo contraste no modo claro */}
                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                            {negocio.titulo}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 shrink-0">
                        <X size={20} />
                    </button>
                </div>

                {/* Navegação por Abas */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    {[
                        { id: 'visao', label: 'Visão Geral', icon: <DollarSign size={14} /> },
                        { id: 'atividades', label: 'Atividades', icon: <Calendar size={14} /> },
                        { id: 'produtos', label: 'Produtos', icon: <Package size={14} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wide transition-colors border-b-2 
                ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
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
                        onClick={handleEditClick}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
                    >
                        <Pencil size={16} /> Editar
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </>
    );
}