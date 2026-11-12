import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { escutarTarefas, adicionarTarefa, atualizarTarefa, deletarTarefa } from '@/services/tarefaService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PageHeader from '@/components/ui/PageHeader';
import toast from 'react-hot-toast';
import { Plus, CheckSquare, Square, Trash2, Calendar, Pencil } from 'lucide-react';

export default function Tarefas() {
    const { dadosUsuario } = useAuth();
    const [tarefas, setTarefas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [idParaDeletar, setIdParaDeletar] = useState(null);
    const [filtro, setFiltro] = useState('pendentes'); // 'todas', 'pendentes', 'concluidas'

    // Estados do Formulário
    const [tarefaEditando, setTarefaEditando] = useState(null);
    const [titulo, setTitulo] = useState('');
    const [dataVencimento, setDataVencimento] = useState('');
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (!dadosUsuario?.empresaId) return;
        const unsubscribe = escutarTarefas(dadosUsuario.empresaId, (lista) => {
            setTarefas(lista);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [dadosUsuario?.empresaId]);

    // Filtragem
    const tarefasFiltradas = tarefas.filter(t => {
        if (filtro === 'pendentes') return !t.concluida;
        if (filtro === 'concluidas') return t.concluida;
        return true;
    });

    const pendentesCount = tarefas.filter(t => !t.concluida).length;

    // Ações
    function abrirModalCriar() {
        setTarefaEditando(null);
        setTitulo('');
        setDataVencimento('');
        setIsModalOpen(true);
    }

    function handleEditar(tarefa) {
        setTarefaEditando(tarefa.id);
        setTitulo(tarefa.titulo);
        setDataVencimento(tarefa.dataVencimento || '');
        setIsModalOpen(true);
    }

    function handleDeletar(id) {
        setIdParaDeletar(id);
        setIsConfirmOpen(true);
    }

    async function confirmarDelecao() {
        const resultado = await deletarTarefa(idParaDeletar);
        if (resultado.sucesso) {
            toast.success('Tarefa excluída!');
            setIsConfirmOpen(false);
        } else {
            toast.error('Erro ao excluir tarefa.');
        }
    }

    async function toggleConcluida(tarefa) {
        await atualizarTarefa(tarefa.id, { concluida: !tarefa.concluida });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSalvando(true);
        const dados = { titulo, dataVencimento, concluida: tarefaEditando ? undefined : false };

        let resultado;
        if (tarefaEditando) {
            // Remove o campo concluida do update para não sobrescrever o status atual
            const { concluida, ...dadosUpdate } = dados;
            resultado = await atualizarTarefa(tarefaEditando, dadosUpdate);
        } else {
            resultado = await adicionarTarefa(dados, dadosUsuario.empresaId);
        }

        if (resultado.sucesso) {
            toast.success(tarefaEditando ? 'Tarefa atualizada!' : 'Tarefa criada!');
            setIsModalOpen(false);
        } else {
            toast.error("Erro: " + resultado.erro);
        }
        setSalvando(false);
    }

    return (
        <div className="w-full h-full flex flex-col">
            <PageHeader
                icon={<CheckSquare size={18} />}
                title="Tarefas"
                subtitle={`Você tem ${pendentesCount} tarefa(s) pendente(s).`}
                action={
                    <button onClick={abrirModalCriar} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors w-full md:w-auto justify-center shadow-sm">
                        <Plus size={18} /> Nova Tarefa
                    </button>
                }
            />

            {/* Filtros */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                <button onClick={() => setFiltro('todas')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filtro === 'todas' ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white' : '!text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Todas</button>
                <button onClick={() => setFiltro('pendentes')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filtro === 'pendentes' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : '!text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Pendentes</button>
                <button onClick={() => setFiltro('concluidas')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filtro === 'concluidas' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : '!text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Concluídas</button>
            </div>

            {/* Lista de Tarefas */}
            {loading ? (
                <p className="!text-slate-500">Carregando tarefas...</p>
            ) : tarefasFiltradas.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <CheckSquare size={32} />
                    </div>
                    <h3 className="text-lg font-bold !text-slate-900 dark:!text-white mb-2">Nenhuma tarefa encontrada</h3>
                    <p className="!text-slate-500 text-sm">Crie uma nova tarefa ou mude o filtro acima.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {tarefasFiltradas.map(tarefa => (
                        <div key={tarefa.id} className={`group flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all ${tarefa.concluida ? 'opacity-60' : 'hover:shadow-md'}`}>

                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <button onClick={() => toggleConcluida(tarefa)} className={`shrink-0 transition-colors ${tarefa.concluida ? 'text-emerald-500' : 'text-slate-300 hover:text-blue-500'}`}>
                                    {tarefa.concluida ? <CheckSquare size={24} /> : <Square size={24} />}
                                </button>

                                <div className="flex flex-col min-w-0">
                                    <span className={`font-medium truncate transition-colors ${tarefa.concluida ? 'line-through !text-slate-400' : '!text-slate-900 dark:!text-white'}`}>
                                        {tarefa.titulo}
                                    </span>
                                    {tarefa.dataVencimento && (
                                        <span className="text-xs !text-slate-500 flex items-center gap-1 mt-1">
                                            <Calendar size={12} /> Vence em: {new Date(tarefa.dataVencimento).toLocaleDateString('pt-BR')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-4">
                                <button onClick={() => handleEditar(tarefa)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"><Pencil size={16} /></button>
                                <button onClick={() => handleDeletar(tarefa.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 size={16} /></button>
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Criação/Edição */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={tarefaEditando ? "Editar Tarefa" : "Nova Tarefa"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium !text-slate-700 dark:!text-slate-300 mb-1">O que precisa ser feito?</label>
                        <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" required placeholder="Ex: Ligar para o cliente" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium !text-slate-700 dark:!text-slate-300 mb-1">Data de Vencimento (Opcional)</label>
                        <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 !text-slate-600 hover:bg-slate-100 rounded-lg dark:!text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
                        <button type="submit" disabled={salvando} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium">
                            {salvando ? 'Salvando...' : (tarefaEditando ? 'Atualizar' : 'Salvar')}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmarDelecao}
                message="Tem certeza que deseja excluir esta tarefa?"
            />
        </div>
    );
}