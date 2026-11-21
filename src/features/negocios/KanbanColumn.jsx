import { useState } from 'react';
import KanbanCard from './KanbanCard';
import { Plus, AlertTriangle } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';

export default function KanbanColumn({
    coluna,
    negocios,
    isMobile,
    onOpenDetails,
    onMoveStage,
    onEdit,
    onDelete,
    columnIndex
}) {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const totalValor = negocios.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

    const formatarMoeda = (valor) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor || 0);

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

    const bgClass = coluna.isVirtual ? 'bg-red-50/30 dark:bg-red-900/10' : 'bg-[#f4f5f7] dark:bg-slate-900/50';

    return (
        <div
            className={`
                flex flex-col 
                flex-1 w-0 min-w-[150px] /* A MÁGICA AQUI: flex-1 divide a tela, min-w-[150px] impede de esmagar demais */
                rounded-lg 
                ${bgClass}
                ${isDraggingOver ? 'ring-2 ring-blue-400 dark:ring-blue-600' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            {/* CABEÇALHO FIXO E COMPACTO */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-2 rounded-t-lg bg-[#f4f5f7] dark:bg-slate-900/90 backdrop-blur-sm border-b border-transparent">
                <div className="flex items-center gap-1 overflow-hidden">
                    <h3 className={`font-bold text-[12px] truncate ${coluna.isVirtual ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`} title={coluna.titulo}>
                        {coluna.titulo}
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                        {negocios.length}
                    </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium shrink-0 ml-1">
                    {formatarMoeda(totalValor)}
                </div>
            </div>

            {/* ÁREA DE CARDS */}
            <Droppable droppableId={coluna.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex flex-col space-y-1.5 p-1.5"
                    >
                        {negocios.length === 0 ? (
                            <div className={`flex flex-col items-center justify-center py-4 rounded-md
                                ${coluna.isVirtual ? 'text-red-400' : 'text-slate-400/60'}
                            `}>
                                {coluna.isVirtual ? <AlertTriangle size={14} className="mb-1" /> : <Plus size={14} className="mb-1" />}
                                <p className="text-[10px] font-medium">Adicionar</p>
                            </div>
                        ) : (
                            negocios.map((negocio, index) => (
                                <Draggable key={negocio.id} draggableId={negocio.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`${snapshot.isDragging ? 'opacity-50 scale-[0.98] rotate-1 shadow-xl z-50' : ''}`}
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