import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Package, X } from 'lucide-react';

export default function SelectProdutos({ produtos, produtosSelecionados, onAdicionar, onRemover }) {
    const [isOpen, setIsOpen] = useState(false);
    const [busca, setBusca] = useState('');
    const dropdownRef = useRef(null);

    // Fecha o dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filtra produtos pela busca e remove os já selecionados
    const produtosFiltrados = produtos.filter(p =>
        p.nome.toLowerCase().includes(busca.toLowerCase()) &&
        !produtosSelecionados.find(sel => sel.id === p.id)
    );

    const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Botão que abre o dropdown */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
                <span className="flex items-center gap-2 text-slate-500">
                    <Package size={16} /> Selecionar produtos do catálogo...
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                    {/* Campo de Busca */}
                    <div className="sticky top-0 bg-white dark:bg-slate-800 p-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Buscar produto..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-md focus:outline-none dark:bg-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Lista de Produtos */}
                    <div className="p-1">
                        {produtosFiltrados.length === 0 ? (
                            <p className="text-center text-xs text-slate-500 py-4">Nenhum produto encontrado.</p>
                        ) : (
                            produtosFiltrados.map(produto => (
                                <button
                                    key={produto.id}
                                    type="button"
                                    onClick={() => {
                                        onAdicionar(produto);
                                        setBusca('');
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                                >
                                    <span className="!text-slate-700 dark:!text-slate-300">{produto.nome}</span>
                                    <span className="text-xs font-medium text-emerald-600">{formatarMoeda(produto.preco)}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Lista de Produtos Selecionados (Chips) */}
            {produtosSelecionados.length > 0 && (
                <div className="mt-3 space-y-2">
                    {produtosSelecionados.map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-blue-50 dark:bg-blue-500/10 p-2 rounded-lg border border-blue-100 dark:border-blue-500/20">
                            <div className="flex items-center gap-2">
                                <Package size={14} className="text-blue-500" />
                                <span className="text-sm !text-slate-700 dark:!text-slate-300">{p.nome}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold !text-slate-600 dark:!text-slate-400">{formatarMoeda(p.preco)}</span>
                                <button
                                    type="button"
                                    onClick={() => onRemover(p.id, p.preco)}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-md transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}