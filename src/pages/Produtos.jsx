import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { escutarProdutos, adicionarProduto, atualizarProduto, deletarProduto } from '@/services/produtoService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PageHeader from '@/components/ui/PageHeader';
import toast from 'react-hot-toast';
import { Plus, Package, Pencil, Trash2, Search } from 'lucide-react';

export default function Produtos() {
    const { dadosUsuario } = useAuth();
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [idParaDeletar, setIdParaDeletar] = useState(null);
    const [busca, setBusca] = useState('');

    // Estados do Formulário
    const [produtoEditando, setProdutoEditando] = useState(null);
    const [nome, setNome] = useState('');
    const [preco, setPreco] = useState('');
    const [tipo, setTipo] = useState('Produto');
    const [descricao, setDescricao] = useState('');
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (!dadosUsuario?.empresaId) return;
        const unsubscribe = escutarProdutos(dadosUsuario.empresaId, (lista) => {
            setProdutos(lista);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [dadosUsuario?.empresaId]);

    const produtosFiltrados = produtos.filter(p =>
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.descricao?.toLowerCase().includes(busca.toLowerCase())
    );

    function abrirModalCriar() {
        setProdutoEditando(null);
        setNome(''); setPreco(''); setTipo('Produto'); setDescricao('');
        setIsModalOpen(true);
    }

    function handleEditar(produto) {
        setProdutoEditando(produto.id);
        setNome(produto.nome);
        setPreco(produto.preco);
        setTipo(produto.tipo || 'Produto');
        setDescricao(produto.descricao || '');
        setIsModalOpen(true);
    }

    function handleDeletar(id) {
        setIdParaDeletar(id);
        setIsConfirmOpen(true);
    }

    async function confirmarDelecao() {
        const resultado = await deletarProduto(idParaDeletar);
        if (resultado.sucesso) {
            toast.success('Produto excluído!');
            setIsConfirmOpen(false);
        } else {
            toast.error('Erro ao excluir produto.');
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSalvando(true);
        const dados = { nome, preco: Number(preco), tipo, descricao };

        let resultado;
        if (produtoEditando) {
            resultado = await atualizarProduto(produtoEditando, dados);
        } else {
            resultado = await adicionarProduto(dados, dadosUsuario.empresaId);
        }

        if (resultado.sucesso) {
            toast.success(produtoEditando ? 'Produto atualizado!' : 'Produto criado!');
            setIsModalOpen(false);
        } else {
            toast.error("Erro: " + resultado.erro);
        }
        setSalvando(false);
    }

    const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

    return (
        <div className="w-full h-full flex flex-col">
            <PageHeader
                icon={<Package size={18} />}
                title="Produtos e Serviços"
                subtitle="Gerencie o catálogo do que a sua empresa vende."
                action={
                    <button onClick={abrirModalCriar} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors w-full md:w-auto justify-center shadow-sm">
                        <Plus size={18} /> Novo Item
                    </button>
                }
            />

            {/* Barra de Busca */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col flex-1">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar produtos ou serviços..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center !text-slate-500">Carregando catálogo...</div>
                ) : produtosFiltrados.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center flex-1">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-blue-500 mb-4">
                            <Package size={32} />
                        </div>
                        <h3 className="text-lg font-bold !text-slate-900 dark:!text-white mb-2">Nenhum item cadastrado</h3>
                        <p className="!text-slate-500 mb-6 max-w-md">Adicione produtos ou serviços para agilizar a criação de propostas e negócios.</p>
                        <button onClick={abrirModalCriar} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                            <Plus size={18} /> Adicionar Item
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Visão Desktop (Tabela) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                        <th className="px-6 py-3 text-xs font-semibold !text-slate-500 uppercase">Nome</th>
                                        <th className="px-6 py-3 text-xs font-semibold !text-slate-500 uppercase">Tipo</th>
                                        <th className="px-6 py-3 text-xs font-semibold !text-slate-500 uppercase">Preço</th>
                                        <th className="px-6 py-3 text-xs font-semibold !text-slate-500 uppercase text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {produtosFiltrados.map(produto => (
                                        <tr key={produto.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium !text-slate-900 dark:!text-white">{produto.nome}</p>
                                                <p className="text-xs !text-slate-500 truncate max-w-xs">{produto.descricao}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    {produto.tipo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold !text-slate-900 dark:!text-white">{formatarMoeda(produto.preco)}</td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button onClick={() => handleEditar(produto)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"><Pencil size={18} /></button>
                                                <button onClick={() => handleDeletar(produto.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Visão Mobile (Cards) */}
                        <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                            {produtosFiltrados.map(produto => (
                                <div key={produto.id} className="p-4 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold !text-slate-900 dark:!text-white">{produto.nome}</h3>
                                        <span className="text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full">{produto.tipo}</span>
                                    </div>
                                    <p className="text-xs !text-slate-500 line-clamp-2">{produto.descricao}</p>
                                    <p className="text-sm font-bold !text-slate-900 dark:!text-white mt-1">{formatarMoeda(produto.preco)}</p>
                                    <div className="flex justify-end gap-3 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <button onClick={() => handleEditar(produto)} className="flex items-center gap-1 text-xs text-blue-600 font-medium"><Pencil size={14} /> Editar</button>
                                        <button onClick={() => handleDeletar(produto.id)} className="flex items-center gap-1 text-xs text-red-600 font-medium"><Trash2 size={14} /> Excluir</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Modal de Criação/Edição */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={produtoEditando ? "Editar Item" : "Novo Item"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium !text-slate-700 dark:!text-slate-300 mb-1">Nome</label>
                        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500" required placeholder="Ex: Consultoria Mensal" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium !text-slate-700 dark:!text-slate-300 mb-1">Preço (R$)</label>
                            <input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500" required placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium !text-slate-700 dark:!text-slate-300 mb-1">Tipo</label>
                            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500">
                                <option value="Produto">Produto</option>
                                <option value="Serviço">Serviço</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium !text-slate-700 dark:!text-slate-300 mb-1">Descrição (Opcional)</label>
                        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows="3" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="Detalhes do item..."></textarea>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 !text-slate-600 hover:bg-slate-100 rounded-lg dark:!text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
                        <button type="submit" disabled={salvando} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium">
                            {salvando ? 'Salvando...' : (produtoEditando ? 'Atualizar' : 'Salvar')}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmarDelecao}
                message="Tem certeza que deseja excluir este item do catálogo?"
            />
        </div>
    );
}