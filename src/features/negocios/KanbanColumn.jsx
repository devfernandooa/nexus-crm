import { useState } from 'react';
import KanbanCard from './KanbanCard';
import { Briefcase, TrendingUp } from 'lucide-react';
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
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

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
                flex flex-col flex-shrink-0 
                w-[280px] md:w-[300px] 
                rounded-xl 
                transition-colors duration-200 
                h-full max-h-[calc(100vh-260px)]
                /* FUNDO CINZA CLARO PARA CONTRASTE NO MODO CLARO */
                bg-slate-100 dark:bg-slate-900/40 
                border border-slate-200 dark:border-slate-800
                ${isDraggingOver ? 'ring-2 ring-blue-400 dark:ring-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            {/* CABEÇALHO COMPACTO E SEMÂNTICO */}
            <div className="flex items-center justify-between p-3 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${coluna.cor}`}></div>
                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 leading-none">
                        {coluna.titulo}
                    </h3>
                    <span className="bg-slate-200 dark:bg-slate-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-slate-600 dark:text-slate-400 min-w-[18px] text-center">
                        {negocios.length}
                    </span>
                </div>
            </div>

            {/* RESUMO FINANCEIRO DA COLUNA */}
            <div className="flex items-center gap-1 px-3 pb-3 text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide shrink-0">
                <TrendingUp size={10} />
                <span>{formatarMoeda(totalValor)}</span>
            </div>

            {/* ÁREA DE CARDS COM SCROLL INTERNO */}
            <Droppable droppableId={coluna.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
                            flex-1 space-y-2 overflow-y-auto px-2 pb-2 
                            scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700
                            ${snapshot.isDraggingOver ? 'bg-blue-50/30 dark:bg-blue-900/10 rounded-lg' : ''}
                        `}
                    >
                        {negocios.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 dark:text-slate-600 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl m-1 bg-slate-50/50 dark:bg-slate-900/30">
                                <Briefcase size={18} className="mb-2 opacity-40" />
                                <p className="text-[10px] font-bold uppercase tracking-wider">Vazio</p>
                            </div>
                        ) : (
                            negocios.map((negocio, index) => (
                                <Draggable key={negocio.id} draggableId={negocio.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`${snapshot.isDragging ? 'opacity-40 scale-95 rotate-1 shadow-xl z-50' : ''}`}
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