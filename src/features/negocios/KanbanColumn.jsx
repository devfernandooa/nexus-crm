import { useState } from 'react';
import KanbanCard from './KanbanCard';
import { Plus, AlertTriangle } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { obterTemaColuna } from '@/constants/funilCores';

export default function KanbanColumn({
    coluna,
    negocios,
    isMobile,
    onOpenDetails,
    onMoveStage,
    onEdit,
    onDelete,
    onQuickCreate,
    columnIndex,
}) {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const totalValor = negocios.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
    const tema = obterTemaColuna(coluna, columnIndex);

    const formatarMoeda = (valor) =>
        new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0,
        }).format(valor || 0);

    const handleDragOver = (e) => {
        if (isMobile) return;
        e.preventDefault();
        if (!isDraggingOver) setIsDraggingOver(true);
    };

    const handleDragLeave = (e) => {
        if (isMobile) return;
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDraggingOver(false);
    };

    return (
        <div
            className={`
        flex flex-col w-full md:flex-1 md:w-0 md:min-w-[190px] lg:min-w-[205px] md:min-h-full
        border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800 last:border-b-0 md:last:border-r-0
        transition-colors ${tema.column}
        ${isDraggingOver ? 'ring-1 ring-inset ring-blue-400/70 dark:ring-blue-500/50' : ''}
      `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            {/* Cabeçalho com cor personalizada ou padrão da etapa */}
            <div
                className={`
          md:sticky md:top-0 z-20 px-3 py-2.5 backdrop-blur-xs
          border-b text-left md:shadow-2xs ${tema.accent} ${tema.header}
        `}
            >
                <h3 className={`font-semibold text-[12px] truncate ${tema.title}`} title={coluna.titulo}>
                    {coluna.titulo}
                </h3>
                <p className="text-[11px] text-slate-600/90 dark:text-slate-300/85 mt-0.5 tabular-nums truncate">
                    {formatarMoeda(totalValor)} · {negocios.length}{' '}
                    {negocios.length === 1 ? 'negócio' : 'negócios'}
                </p>
            </div>

            {/* Área de cartões */}
            <Droppable droppableId={coluna.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 flex flex-col gap-2 p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-500/10 dark:bg-blue-400/10' : ''
                            }`}
                    >
                        {negocios.length === 0 ? (
                            <button
                                type="button"
                                onClick={() => onQuickCreate?.(coluna.id)}
                                className="w-full py-6 px-2 rounded-md border border-dashed border-slate-300/80 dark:border-slate-700/80 bg-white/45 dark:bg-slate-900/35 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-white/80 dark:hover:bg-slate-900/60 transition-colors flex flex-col items-center justify-center gap-1"
                            >
                                {coluna.isVirtual ? <AlertTriangle size={14} /> : <Plus size={14} />}
                                <span className="text-[11px]">Adicionar</span>
                            </button>
                        ) : (
                            negocios.map((negocio, index) => (
                                <Draggable key={negocio.id} draggableId={negocio.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={
                                                snapshot.isDragging ? 'opacity-95 scale-[1.02] shadow-lg z-50' : ''
                                            }
                                        >
                                            <KanbanCard
                                                negocio={negocio}
                                                isMobile={isMobile}
                                                onOpenDetails={() => onOpenDetails(negocio)}
                                                onMoveStage={(direcao) => onMoveStage(negocio.id, direcao, coluna.id)}
                                                onEdit={() => onEdit(negocio)}
                                                onDelete={() => onDelete(negocio.id)}
                                                canGoBack={columnIndex > 0}
                                            />
                                        </div>
                                    )}
                                </Draggable>
                            ))
                        )}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}