import { ChevronRight, ChevronLeft, Pencil, Trash2, Package } from 'lucide-react';

export default function KanbanCard({
    negocio,
    isMobile,
    onOpenDetails,
    onMoveStage,
    onEdit,
    onDelete,
    canGoBack = false,
}) {
    const formatarMoeda = (v) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

    const handleChipClick = (e, dir) => {
        e.stopPropagation();
        e.preventDefault();
        onMoveStage(dir);
    };

    return (
        <div
            onClick={() => onOpenDetails()}
            className={`
        group text-left bg-white dark:bg-slate-800/95 border border-slate-200/90 dark:border-slate-700/80
        rounded-lg p-3 shadow-xs transition-all duration-150 relative select-none
        ${!isMobile
                    ? 'cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-400/70 dark:hover:border-blue-500/50 touch-none'
                    : 'cursor-pointer active:scale-[0.99]'
                }
      `}
        >
            {/* Linha superior: título + controles de etapa */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3
                    className="font-semibold text-[13px] text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 flex-1"
                    title={negocio.titulo}
                >
                    {negocio.titulo}
                </h3>

                <div className="flex items-center gap-1 shrink-0">
                    {canGoBack && (
                        <button
                            type="button"
                            title="Mover para etapa anterior"
                            onClick={(e) => handleChipClick(e, 'prev')}
                            className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center"
                        >
                            <ChevronLeft size={13} strokeWidth={2.5} />
                        </button>
                    )}
                    <button
                        type="button"
                        title="Avançar para próxima etapa"
                        onClick={(e) => handleChipClick(e, 'next')}
                        className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/25 transition-colors flex items-center justify-center"
                    >
                        <ChevronRight size={13} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Contato e quantidade de itens */}
            <div className="space-y-1.5 mb-2.5">
                {negocio.contato && (
                    <p
                        className="text-[11px] text-slate-500 dark:text-slate-400 truncate"
                        title={negocio.contato}
                    >
                        {negocio.contato}
                    </p>
                )}

                {negocio.produtos?.length > 0 && (
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                        <Package size={10} className="text-slate-400" />
                        <span>
                            {negocio.produtos.length} {negocio.produtos.length === 1 ? 'item' : 'itens'}
                        </span>
                    </div>
                )}
            </div>

            {/* Rodapé: valor + ações */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <span className="text-[13px] font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatarMoeda(negocio.valor)}
                </span>

                <div className="flex items-center gap-0.5">
                    <button
                        type="button"
                        title="Editar negócio"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/15 rounded-md transition-colors"
                    >
                        <Pencil size={13} />
                    </button>
                    <button
                        type="button"
                        title="Excluir negócio"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15 rounded-md transition-colors"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
}