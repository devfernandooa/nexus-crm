import { ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2, ChevronRight } from 'lucide-react';

export default function ListView({ negocios, onEdit, onDelete, onOpenDetails, sortConfig, onSort }) {

    const formatarMoeda = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
    const formatarData = (d) => d ? new Date(d.seconds * 1000).toLocaleDateString('pt-BR') : '-';

    // Configuração das colunas
    const columns = [
        { key: 'titulo', label: 'Título', sortable: true },
        { key: 'contato', label: 'Contato', sortable: false },
        { key: 'valor', label: 'Valor', sortable: true },
        { key: 'status', label: 'Etapa', sortable: true },
        { key: 'dataCriacao', label: 'Criado em', sortable: true },
        { key: 'actions', label: '', sortable: false }
    ];

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={14} className="opacity-30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    onClick={() => col.sortable && onSort(col.key)}
                                    className={`px-4 py-3 font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none' : ''}`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        {col.label}
                                        {col.sortable && getSortIcon(col.key)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {negocios.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Nenhum negócio encontrado</td></tr>
                        ) : (
                            negocios.map(negocio => (
                                <tr
                                    key={negocio.id}
                                    onClick={() => onOpenDetails(negocio)}
                                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white max-w-[200px] truncate">{negocio.titulo}</td>
                                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[150px] truncate">{negocio.contato || '-'}</td>
                                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{formatarMoeda(negocio.valor)}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase rounded-full border border-blue-100 dark:border-blue-800/30">
                                            {negocio.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{formatarData(negocio.dataCriacao)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); onEdit(negocio); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"><Pencil size={14} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); onDelete(negocio.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}