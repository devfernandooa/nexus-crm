import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { escutarNegocios, adicionarNegocio, atualizarNegocio, deletarNegocio } from '@/services/negocioService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PageHeader from '@/components/ui/PageHeader';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Plus, Briefcase, DollarSign, TrendingUp, Pencil, Trash2, GripVertical,
  ChevronLeft, ChevronRight // <-- Novos ícones para mobile
} from 'lucide-react';

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

  // Lógica de Drag and Drop (Desktop)
  async function handleDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;
    await moverStatus(draggableId, destination.droppableId);
  }

  // Lógica de mover status (usada no drag and drop e nos botões mobile)
  async function moverStatus(id, novoStatus) {
    const resultado = await atualizarNegocio(id, { status: novoStatus });
    if (resultado.sucesso) {
      toast.success(`Negócio movido para ${novoStatus}!`);
    } else {
      toast.error('Erro ao mover negócio.');
    }
  }

  // Função para os botões mobile (Anterior / Próximo)
  function handleMoverBotao(negocio, direcao) {
    const fluxo = ['Aberto', 'Ganho', 'Perdido'];
    const indexAtual = fluxo.indexOf(negocio.status);
    const novoIndex = direcao === 'proximo' ? indexAtual + 1 : indexAtual - 1;

    if (novoIndex >= 0 && novoIndex < fluxo.length) {
      moverStatus(negocio.id, fluxo[novoIndex]);
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
      <PageHeader
        icon={<Briefcase size={18} />}
        title="Negócios"
        subtitle="Arraste os cards (desktop) ou use as setas (mobile) para atualizar o funil."
        action={
          <button onClick={abrirModalCriar} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors w-full md:w-auto justify-center shadow-sm">
            <Plus size={18} /> Novo Negócio
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold !text-slate-500 uppercase tracking-wider mb-1">Em Aberto</p>
            <p className="text-xl font-bold !text-slate-900 dark:!text-white">{formatarMoeda(totalAberto)}</p>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg"><Briefcase size={18} /></div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold !text-slate-500 uppercase tracking-wider mb-1">Ganhos</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatarMoeda(totalGanho)}</p>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg"><TrendingUp size={18} /></div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold !text-slate-500 uppercase tracking-wider mb-1">Perdidos</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatarMoeda(totalPerdido)}</p>
          </div>
          <div className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-lg"><DollarSign size={18} /></div>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <p className="!text-slate-500">Carregando negócios...</p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 h-full">
            {colunas.map(coluna => {
              const negociosDaColuna = negocios.filter(n => n.status === coluna.id);

              return (
                <div key={coluna.id} className="flex-1 min-w-[280px] flex flex-col bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-3 h-3 rounded-full ${coluna.color}`}></div>
                    <h2 className="font-bold !text-slate-900 dark:!text-slate-200">{coluna.title}</h2>
                    <span className="bg-slate-200 dark:bg-slate-800 text-xs font-semibold px-2 py-0.5 rounded-full !text-slate-600 dark:!text-slate-400">
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
                                  <h3 className="font-bold !text-slate-900 dark:!text-white text-sm truncate">{negocio.titulo}</h3>
                                  <GripVertical size={16} className="text-slate-300 cursor-grab hidden md:block" />
                                </div>
                                <p className="text-xs !text-slate-500 mb-3 truncate">{negocio.contato || 'Sem contato'}</p>
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold !text-slate-800 dark:!text-white text-sm">{formatarMoeda(negocio.valor)}</span>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button onClick={() => handleEditar(negocio)} className="p-1 text-slate-400 hover:text-blue-600"><Pencil size={14} /></button>
                                    <button onClick={() => handleDeletar(negocio.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                                  </div>
                                </div>

                                {/* CONTROLES MOBILE: Setas para mover o card entre as colunas */}
                                <div className="flex md:hidden justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                  <button
                                    onClick={() => handleMoverBotao(negocio, 'anterior')}
                                    disabled={negocio.status === 'Aberto'}
                                    className="flex items-center gap-1 text-xs font-medium text-slate-500 disabled:opacity-30"
                                  >
                                    <ChevronLeft size={16} /> Voltar
                                  </button>
                                  <button
                                    onClick={() => handleMoverBotao(negocio, 'proximo')}
                                    disabled={negocio.status === 'Perdido'}
                                    className="flex items-center gap-1 text-xs font-medium text-blue-600 disabled:opacity-30"
                                  >
                                    Avançar <ChevronRight size={16} />
                                  </button>
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

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={negocioEditando ? "Editar Negócio" : "Novo Negócio"}
        icon={negocioEditando ? <Pencil size={18} /> : <Plus size={18} />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold !text-slate-600 dark:!text-slate-400 mb-1">Título do Negócio</label>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" required placeholder="Ex: Proposta Empresa X" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold !text-slate-600 dark:!text-slate-400 mb-1">Valor (R$)</label>
              <input type="number" value={valor} onChange={(e) => setValor(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" required placeholder="5000" />
            </div>
            <div>
              <label className="block text-xs font-semibold !text-slate-600 dark:!text-slate-400 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                <option value="Aberto">Aberto</option>
                <option value="Ganho">Ganho</option>
                <option value="Perdido">Perdido</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold !text-slate-600 dark:!text-slate-400 mb-1">Contato (Empresa/Pessoa)</label>
            <input type="text" value={contato} onChange={(e) => setContato(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="Ex: João da Silva" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium !text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:!text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
            <button type="submit" disabled={salvando} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
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