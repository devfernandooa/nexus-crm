import { ChevronRight, ChevronLeft, Pencil, Trash2, Package } from 'lucide-react';

export default function KanbanCard({ negocio, isMobile, onOpenDetails, onMoveStage, onEdit, onDelete, canGoBack = false }) {
    const formatarMoeda = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

    const handleChipClick = (e, dir) => {
        e.stopPropagation(); e.preventDefault();
        onMoveStage(dir);
    };

    return (
        <div
            onClick={() => onOpenDetails()}
            className={`
        group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
        rounded-lg p-3 shadow-sm transition-all duration-200 relative select-none
        ${!isMobile ? 'cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 touch-none' : 'cursor-pointer active:scale-[0.98]'}
      `}
        >
            <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="font-semibold text-[13px] text-slate-900 dark:text-white truncate flex-1 leading-snug pt-0.5">
                    {negocio.titulo}
                </h3>

                <div className="flex gap-1 flex-shrink-0">
                    {canGoBack && (
                        <button onClick={(e) => handleChipClick(e, 'prev')} className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500 transition-colors touch-manipulation min-w-[28px] min-h-[28px] flex items-center justify-center">
                            <ChevronLeft size={14} strokeWidth={2.5} />
                        </button>
                    )}
                    <button onClick={(e) => handleChipClick(e, 'next')} className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 active:bg-blue-200 dark:active:bg-blue-900/70 transition-colors touch-manipulation min-w-[28px] min-h-[28px] flex items-center justify-center">
                        <ChevronRight size={14} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {negocio.contato && <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mb-2 pl-0.5">{negocio.contato}</p>}

            {negocio.produtos?.length > 0 && (
                <div className="flex items-center gap-1 mb-2 text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider pl-0.5">
                    <Package size={9} /> <span>{negocio.produtos.length} item(ns)</span>
                </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700/50 mt-1">
                <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 pl-0.5">{formatarMoeda(negocio.valor)}</span>
                <div className="flex gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors touch-manipulation"><Pencil size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors touch-manipulation"><Trash2 size={14} /></button>
                </div>
            </div>
        </div>
    );
}