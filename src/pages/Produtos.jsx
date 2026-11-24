import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    escutarProdutos,
    adicionarProduto,
    atualizarProduto,
    deletarProduto,
} from '@/services/produtoService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PageHeader from '@/components/ui/PageHeader';
import toast from 'react-hot-toast';
import { Plus, Package, Pencil, Trash2, Search, Briefcase, Layers } from 'lucide-react';

function normalizarTipo(tipo) {
    const s = String(tipo || 'Produto')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    return s === 'servico' ? 'Serviço' : 'Produto';
}

export default function Produtos() {
    const { dadosUsuario } = useAuth();
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [idParaDeletar, setIdParaDeletar] = useState(null);
    const [busca, setBusca] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'Produto' | 'Serviço'

    // Estados do Formulário
    const [produtoEditando, setProdutoEditando] = useState(null);
    const [nome, setNome] = useState('');
    const [preco, setPreco] = useState('');
    const [tipo, setTipo] = useState('Produto');
    const [descricao, setDescricao] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [excluindo, setExcluindo] = useState(false);

    useEffect(() => {
        if (!dadosUsuario?.empresaId) return;

        let ativo = true;
        setLoading(true);

        const unsubscribe = escutarProdutos(dadosUsuario.empresaId, (lista) => {
            if (ativo) {
                setProdutos(lista);
                setLoading(false);
            }
        });

        return () => {
            ativo = false;
            unsubscribe();
        };
    }, [dadosUsuario?.empresaId]);

    const resumoCatalogo = useMemo(() => {
        let totalProdutos = 0;
        let totalServicos = 0;

        produtos.forEach((item) => {
            if (normalizarTipo(item.tipo) === 'Serviço') {
                totalServicos += 1;
            } else {
                totalProdutos += 1;
            }
        });

        return {
            totalItens: produtos.length,
            totalProdutos,
            totalServicos,
        };
    }, [produtos]);

    const produtosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return produtos.filter((p) => {
            const tipoItem = normalizarTipo(p.tipo);
            if (filtroTipo !== 'todos' && tipoItem !== filtroTipo) {
                return false;
            }
            if (!termo) return true;

            return (
                String(p.nome || '')
                    .toLowerCase()
                    .includes(termo) ||
                String(p.descricao || '')
                    .toLowerCase()
                    .includes(termo) ||
                tipoItem.toLowerCase().includes(termo)
            );
        });
    }, [produtos, busca, filtroTipo]);

    function abrirModalCriar() {
        setProdutoEditando(null);
        setNome('');
        setPreco('');
        setTipo('Produto');
        setDescricao('');
        setIsModalOpen(true);
    }

    function handleEditar(produto) {
        setProdutoEditando(produto.id);
        setNome(produto.nome || '');
        setPreco(produto.preco ?? '');
        setTipo(normalizarTipo(produto.tipo));
        setDescricao(produto.descricao || '');
        setIsModalOpen(true);
    }

    function handleDeletar(id) {
        setIdParaDeletar(id);
        setIsConfirmOpen(true);
    }

    async function confirmarDelecao() {
        if (!idParaDeletar) return;
        setExcluindo(true);
        try {
            const resultado = await deletarProduto(idParaDeletar);
            if (resultado.sucesso) {
                toast.success('Item excluído do catálogo!');
                setIsConfirmOpen(false);
                setIdParaDeletar(null);
            } else {
                toast.error('Erro ao excluir item.');
            }
        } finally {
            setExcluindo(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!dadosUsuario?.empresaId && !produtoEditando) {
            toast.error('Empresa não identificada.');
            return;
        }

        setSalvando(true);
        try {
            const dados = {
                nome: nome.trim(),
                preco: Number(preco) || 0,
                tipo: normalizarTipo(tipo),
                descricao: descricao.trim(),
            };

            const resultado = produtoEditando
                ? await atualizarProduto(produtoEditando, dados)
                : await adicionarProduto(dados, dadosUsuario.empresaId);

            if (resultado.sucesso) {
                toast.success(produtoEditando ? 'Item atualizado!' : 'Item criado!');
                setIsModalOpen(false);
            } else {
                toast.error('Erro: ' + resultado.erro);
            }
        } finally {
            setSalvando(false);
        }
    }

    const formatarMoeda = (valor) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
            Number(valor) || 0
        );

    const containerClass =
        'w-full max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:overflow-y-auto max-md:overscroll-y-contain md:min-h-full md:h-auto md:overflow-visible overflow-x-hidden touch-pan-y flex flex-col px-4 sm:px-6 lg:px-7 py-4 sm:py-5 pb-28 md:pb-8 bg-slate-50/60 dark:bg-slate-950 transition-colors text-left space-y-4';

    const inputClass =
        'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all';

    const labelClass = 'block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1';

    const btnPrimaryClass =
        'bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-2xs';

    return (
        <div className={containerClass}>
            <PageHeader
                icon={<Package size={18} />}
                title="Produtos e Serviços"
                subtitle="Gerencie o catálogo do que a sua empresa vende."
                action={
                    <button
                        type="button"
                        onClick={abrirModalCriar}
                        className={`${btnPrimaryClass} w-full md:w-auto`}
                    >
                        <Plus size={16} /> Novo Item
                    </button>
                }
            />

            {/* Resumo do Catálogo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
                <div className="bg-white dark:bg-[#0b192c] px-4 py-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Total no Catálogo
                        </p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                            {resumoCatalogo.totalItens}
                        </p>
                    </div>
                    <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        <Layers size={16} />
                    </span>
                </div>

                <div className="bg-white dark:bg-[#0b192c] px-4 py-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Produtos
                        </p>
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
                            {resumoCatalogo.totalProdutos}
                        </p>
                    </div>
                    <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        <Package size={16} />
                    </span>
                </div>

                <div className="bg-white dark:bg-[#0b192c] px-4 py-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Serviços
                        </p>
                        <p className="text-lg font-bold text-teal-700 dark:text-teal-400 tabular-nums mt-0.5">
                            {resumoCatalogo.totalServicos}
                        </p>
                    </div>
                    <span className="p-2 rounded-lg bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300">
                        <Briefcase size={16} />
                    </span>
                </div>
            </div>

            {/* Container do Catálogo */}
            <div className="bg-white dark:bg-[#0b192c] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs flex flex-col flex-1 min-w-0">
                {/* Barra de Busca e Filtro */}
                <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative w-full sm:max-w-sm">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            size={15}
                        />
                        <input
                            type="text"
                            placeholder="Buscar produtos ou serviços..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        {['todos', 'Produto', 'Serviço'].map((opcao) => {
                            const ativo = filtroTipo === opcao;
                            return (
                                <button
                                    key={opcao}
                                    type="button"
                                    onClick={() => setFiltroTipo(opcao)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${ativo
                                            ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {opcao === 'todos' ? 'Todos' : `${opcao}s`}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {loading ? (
                    <div className="p-6 space-y-3 animate-pulse">
                        <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                        <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                        <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                    </div>
                ) : produtosFiltrados.length === 0 ? (
                    <div className="p-10 sm:p-12 text-center flex flex-col items-center justify-center flex-1">
                        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/70 dark:border-emerald-500/25 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-300 mb-3">
                            <Package size={26} />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
                            Nenhum item encontrado
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5 max-w-md">
                            Adicione produtos ou serviços para agilizar a criação de propostas e negócios.
                        </p>
                        <button type="button" onClick={abrirModalCriar} className={btnPrimaryClass}>
                            <Plus size={16} /> Adicionar Item
                        </button>
                    </div>
                ) : (
                    <>
                        {/* VISÃO DESKTOP (Tabela) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-slate-50/90 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-slate-800">
                                        <th className="px-6 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Nome
                                        </th>
                                        <th className="px-6 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Tipo
                                        </th>
                                        <th className="px-6 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Preço
                                        </th>
                                        <th className="px-6 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right pr-6">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {produtosFiltrados.map((produto) => {
                                        const tipoFormatado = normalizarTipo(produto.tipo);
                                        const isServico = tipoFormatado === 'Serviço';

                                        return (
                                            <tr
                                                key={produto.id}
                                                className="hover:bg-emerald-50/40 dark:hover:bg-emerald-500/5 transition-colors"
                                            >
                                                <td className="px-6 py-3.5">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {produto.nome}
                                                    </p>
                                                    {produto.descricao && (
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md mt-0.5">
                                                            {produto.descricao}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${isServico
                                                                ? 'bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-500/25'
                                                                : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/25'
                                                            }`}
                                                    >
                                                        {tipoFormatado}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                                                    {formatarMoeda(produto.preco)}
                                                </td>
                                                <td className="px-6 py-3.5 text-right space-x-1 pr-6">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditar(produto)}
                                                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                                        title="Editar item"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletar(produto.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                                                        title="Excluir item"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* VISÃO MOBILE (Cards) */}
                        <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
                            {produtosFiltrados.map((produto) => {
                                const tipoFormatado = normalizarTipo(produto.tipo);
                                const isServico = tipoFormatado === 'Serviço';

                                return (
                                    <div key={produto.id} className="p-4 flex flex-col gap-2">
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                {produto.nome}
                                            </h3>
                                            <span
                                                className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${isServico
                                                        ? 'bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300'
                                                        : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                                    }`}
                                            >
                                                {tipoFormatado}
                                            </span>
                                        </div>

                                        {produto.descricao && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                                {produto.descricao}
                                            </p>
                                        )}

                                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
                                            {formatarMoeda(produto.preco)}
                                        </p>

                                        <div className="flex gap-2.5 mt-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                                            <button
                                                type="button"
                                                onClick={() => handleEditar(produto)}
                                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 rounded-lg w-1/2 transition-colors"
                                            >
                                                <Pencil size={13} /> Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeletar(produto.id)}
                                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-red-700 dark:text-red-300 font-semibold bg-red-50 dark:bg-red-500/15 hover:bg-red-100 dark:hover:bg-red-500/25 rounded-lg w-1/2 transition-colors"
                                            >
                                                <Trash2 size={13} /> Excluir
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Modal de Criar / Editar Item */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={produtoEditando ? 'Editar Item' : 'Novo Item'}
                icon={produtoEditando ? <Pencil size={18} /> : <Plus size={18} />}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={labelClass}>Nome</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className={inputClass}
                            required
                            placeholder="Ex: Consultoria Mensal"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Preço (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={preco}
                                onChange={(e) => setPreco(e.target.value)}
                                className={inputClass}
                                required
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Tipo</label>
                            <select
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                                className={inputClass}
                            >
                                <option value="Produto">Produto</option>
                                <option value="Serviço">Serviço</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Descrição (Opcional)</label>
                        <textarea
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            rows="3"
                            className={inputClass}
                            placeholder="Detalhes do item..."
                        />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button type="submit" disabled={salvando} className={btnPrimaryClass}>
                            {salvando ? 'Salvando...' : produtoEditando ? 'Atualizar' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmarDelecao}
                title="Excluir Item"
                message="Tem certeza que deseja excluir este item do catálogo?"
                confirmText={excluindo ? 'Excluindo...' : 'Sim, excluir'}
            />
        </div>
    );
}