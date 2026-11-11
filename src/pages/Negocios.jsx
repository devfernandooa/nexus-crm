import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { escutarNegocios, adicionarNegocio, atualizarNegocio, deletarNegocio } from '@/services/negocioService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Briefcase, DollarSign, TrendingUp, Pencil, Trash2, GripVertical } from 'lucide-react';

export default function Negocios() {
  const { dadosUsuario } = useAuth();
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [idParaDeletar, setIdParaDeletar] = useState(null);
  
  // Estados do Formulário
  const [negocioEditando, setNegocioEditando] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState('Aberto');
  const [contato, setContato] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!dadosUsuario?.empresaId) return;
    const unsubscribe = escutarNegocios(dadosUsuario.empresaId, (lista) => {
      setNegocios(lista);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [dadosUsuario?.empresaId]);

  // Cálculos para os KPIs
  const totalAberto = negocios.filter(n => n.status === 'Aberto').reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  const totalGanho = negocios.filter(n => n.status === 'Ganho').reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  const totalPerdido = negocios.filter(n => n.status === 'Perdido').reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

  // Lógica do Kanban
  async function handleDragEnd(result) {
    const { source, destination, draggableId } = result;

    if (!destination || source.droppableId === destination.droppableId) return;

    const novoStatus = destination.droppableId;
    const resultado = await atualizarNegocio(draggableId, { status: novoStatus });
    
    if (resultado.sucesso) {
      toast.success(`Negócio movido para ${novoStatus}!`);
    } else {
      toast.error('Erro ao mover negócio.');
    }
  }

  function abrirModalCriar() {
    setNegocioEditando(null);
    setTitulo(''); setValor(''); setStatus('Aberto'); setContato('');
    setIsModalOpen(true);
  }

  function handleEditar(negocio) {
    setNegocioEditando(negocio.id);
    setTitulo(negocio.titulo);
    setValor(negocio.valor);
    setStatus(negocio.status);
    setContato(negocio.contato || '');
    setIsModalOpen(true);
  }

  function handleDeletar(id) {
    setIdParaDeletar(id);
    setIsConfirmOpen(true);
  }

  async function confirmarDelecao() {
    const resultado = await deletarNegocio(idParaDeletar);
    if (resultado.sucesso) {
      toast.success('Negócio excluído com sucesso!');
      setIsConfirmOpen(false);
    } else {
      toast.error('Erro ao excluir negócio.');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSalvando(true);
    const dados = { titulo, valor: Number(valor), status, contato };

    let resultado;
    if (negocioEditando) {
      resultado = await atualizarNegocio(negocioEditando, dados);
    } else {
      resultado = await adicionarNegocio(dados, dadosUsuario.empresaId);
    }

    if (resultado.sucesso) {
      toast.success(negocioEditando ? 'Negócio atualizado!' : 'Negócio criado!');
      setIsModalOpen(false);
    } else {
      toast.error("Erro: " + resultado.erro);
    }
    setSalvando(false);
  }

  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const colunas = [
    { id: 'Aberto', title: 'Em Aberto', color: 'bg-blue-500' },
    { id: 'Ganho', title: 'Ganhos', color: 'bg-emerald-500' },
    { id: 'Perdido', title: 'Perdidos', color: 'bg-red-500' },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Negócios</h1>
          <p className="text-sm text-slate-500">Arraste os cards para atualizar o status do funil.</p>
        </div>
        <button 
          onClick={abrirModalCriar}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors w-full md:w-auto justify-center"
        >
          <Plus size={18} /> Novo Negócio
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Em Aberto</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{formatarMoeda(totalAberto)}</p>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg"><Briefcase size={20} /></div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Ganhos</p>
            <p className="text-xl font-bold text-emerald-600">{formatarMoeda(totalGanho)}</p>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Perdidos</p>
            <p className="text-xl font-bold text-red-600">{formatarMoeda(totalPerdido)}</p>
          </div>
          <div className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-lg"><DollarSign size={20} /></div>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <p className="text-slate-500">Carregando negócios...</p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 h-full">
            {colunas.map(coluna => {
              const negociosDaColuna = negocios.filter(n => n.status === coluna.id);

              return (
                <div key={coluna.id} className="flex-1 min-w-[280px] flex flex-col bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-3 h-3 rounded-full ${coluna.color}`}></div>
                    <h2 className="font-bold text-slate-700 dark:text-slate-200">{coluna.title}</h2>
                    <span className="bg-slate-200 dark:bg-slate-800 text-xs font-semibold px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400">
                      {negociosDaColuna.length}
                    </span>
                  </div>

                  <Droppable droppableId={coluna.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 space-y-3 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? 'bg-slate-200/50 dark:bg-slate-800/50 rounded-lg' : ''}`}
                      >
                        {negociosDaColuna.map((negocio, index) => (
                          <Draggable key={negocio.id} draggableId={negocio.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm group ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''}`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate">{negocio.titulo}</h3>
                                  <GripVertical size={16} className="text-slate-300 cursor-grab" />
                                </div>
                                <p className="text-xs text-slate-500 mb-3 truncate">{negocio.contato || 'Sem contato'}</p>
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-800 dark:text-white text-sm">{formatarMoeda(negocio.valor)}</span>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button onClick={() => handleEditar(negocio)} className="p-1 text-slate-400 hover:text-blue-600"><Pencil size={14} /></button>
                                    <button onClick={() => handleDeletar(negocio.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Modais (Criação/Edição e Confirmação) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={negocioEditando ? "Editar Negócio" : "Novo Negócio"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500" required placeholder="Ex: Proposta Empresa X" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
            <input type="number" value={valor} onChange={(e) => setValor(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500" required placeholder="5000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contato (Empresa/Pessoa)</label>
            <input type="text" value={contato} onChange={(e) => setContato(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="Ex: João da Silva" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500">
              <option value="Aberto">Aberto</option>
              <option value="Ganho">Ganho</option>
              <option value="Perdido">Perdido</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
            <button type="submit" disabled={salvando} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium">
              {salvando ? 'Salvando...' : (negocioEditando ? 'Atualizar' : 'Salvar')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmarDelecao}
        message="Tem certeza que deseja excluir este negócio? Ele será removido permanentemente."
      />
    </div>
  );
}