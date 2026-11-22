import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNegociosKanban } from '@/features/negocios/useNegociosKanban';
import KanbanColumn from '@/features/negocios/KanbanColumn';
import NegocioDrawer from '@/features/negocios/NegocioDrawer';
import { escutarProdutos } from '@/services/produtoService';
import { adicionarNegocio, atualizarNegocio } from '@/services/negocioService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import SelectProdutos from '@/components/ui/SelectProdutos';
import toast from 'react-hot-toast';
import { Plus, Briefcase, DollarSign, TrendingUp, Pencil, LayoutGrid, List, Settings } from 'lucide-react';
import { DragDropContext } from '@hello-pangea/dnd';

import ListView from '@/features/negocios/ListView';
import ModalConfigurarFunil from '@/features/negocios/ModalConfigurarFunil';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

export default function Negocios() {
  const { dadosUsuario } = useAuth();
  const isMobile = useIsMobile();

  const {
    negocios, loading, colunas, kpiData,
    handleDragEnd, handleMoverBotao, handleDeletar,
    isConfirmOpen, setIsConfirmOpen, confirmarDelecao,
    negocioDetalhes, handleOpenDetails, handleCloseDetails
  } = useNegociosKanban(dadosUsuario?.empresaId);

  const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [negocioEditando, setNegocioEditando] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState('Aberto');
  const [contato, setContato] = useState('');
  const [produtosSelecionados, setProdutosSelecionados] = useState([]);
  const [salvando, setSalvando] = useState(false);

  const [viewMode, setViewMode] = useState(() => localStorage.getItem('negocios_view_mode') || 'kanban');
  const [sortConfig, setSortConfig] = useState({ key: 'dataCriacao', direction: 'desc' });
  const [isFunilModalOpen, setIsFunilModalOpen] = useState(false);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedNegocios = useMemo(() => {
    const sorted = [...negocios];
    sorted.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === 'dataCriacao') {
        valA = valA?.toMillis() || 0;
        valB = valB?.toMillis() || 0;
      } else if (sortConfig.key === 'valor') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [negocios, sortConfig]);

  useEffect(() => {
    localStorage.setItem('negocios_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (!dadosUsuario?.empresaId) return;
    const unsub = escutarProdutos(dadosUsuario.empresaId, setProdutosDisponiveis);
    return () => unsub();
  }, [dadosUsuario?.empresaId]);

  const formatarMoeda = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const abrirModalCriarComStatus = (stageId = 'Aberto') => {
    setNegocioEditando(null);
    setTitulo('');
    setValor('');
    setStatus(stageId);
    setContato('');
    setProdutosSelecionados([]);
    setIsFormModalOpen(true);
  };

  const abrirModalCriar = () => abrirModalCriarComStatus('Aberto');

  const handleEditar = (n) => {
    setNegocioEditando(n.id);
    setTitulo(n.titulo);
    setValor(n.valor);
    setStatus(n.status);
    setContato(n.contato || '');
    setProdutosSelecionados(n.produtos || []);
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    const dados = { titulo, valor: Number(valor), status, contato, produtos: produtosSelecionados };
    const res = negocioEditando
      ? await atualizarNegocio(negocioEditando, dados)
      : await adicionarNegocio(dados, dadosUsuario.empresaId);

    if (res.sucesso) {
      toast.success(negocioEditando ? 'Atualizado!' : 'Criado!');
      setIsFormModalOpen(false);
    } else {
      toast.error(res.erro);
    }
    setSalvando(false);
  };

  const modalInputClass =
    'w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all';

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-50/70 dark:bg-slate-950 text-left transition-colors">

      {/* 1. ÁREA FIXA SUPERIOR (Padrão de página única com respiro lateral e botões/KPIs maiores) */}
      <div className="shrink-0 px-4 sm:px-6 lg:px-7 py-3.5 sm:py-4 bg-white dark:bg-[#0b192c] border-b border-slate-200/80 dark:border-slate-800/90 z-10 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center shrink-0 shadow-2xs">
              <Briefcase size={18} />
            </span>
            <div className="flex flex-col min-w-0">
              <h1 className="text-lg sm:text-xl font-bold !text-slate-900 dark:!text-white leading-tight truncate m-0">
                Negócios
              </h1>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Arraste os cards ou use as setas para avançar etapas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap mr-0.5">
            <div className="flex bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all ${viewMode === 'kanban'
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30 shadow-2xs'
                    : 'border border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <LayoutGrid size={15} /> Kanban
              </button>
              <button
                type="button"
                onClick={() => setViewMode('lista')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all ${viewMode === 'lista'
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30 shadow-2xs'
                    : 'border border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <List size={15} /> Lista
              </button>
            </div>

            <button
              type="button"
              onClick={abrirModalCriar}
              className="bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs text-xs sm:text-sm transition-colors"
            >
              <Plus size={16} /> Novo Negócio
            </button>

            <button
              type="button"
              onClick={() => setIsFunilModalOpen(true)}
              className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm transition-colors shadow-2xs"
              title="Configurar etapas do funil"
            >
              <Settings size={15} /> Etapas
            </button>
          </div>
        </div>

        {/* KPIs maiores com espaçamento equilibrado */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 max-w-2xl">
            <KPICard
              title="Em Aberto"
              value={formatarMoeda(kpiData.totalAberto)}
              icon={<Briefcase size={16} />}
              color="emerald"
            />
            <KPICard
              title="Ganhos"
              value={formatarMoeda(kpiData.totalGanho)}
              icon={<TrendingUp size={16} />}
              color="emeraldStrong"
            />
            <KPICard
              title="Perdidos"
              value={formatarMoeda(kpiData.totalPerdido)}
              icon={<DollarSign size={16} />}
              color="red"
            />
          </div>

          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
            {negocios.length} {negocios.length === 1 ? 'negócio no funil' : 'negócios no funil'}
          </span>
        </div>
      </div>

      {/* 2. ESTRUTURA E FORMATO DAS COLUNAS PRESERVADOS INTEGRALMENTE */}
      <div className="flex-1 min-h-0 overflow-auto scrollbar-thin bg-[#f9fafb] dark:bg-slate-950/60">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 dark:border-emerald-400" />
          </div>
        ) : viewMode === 'kanban' ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex flex-col md:flex-row w-full min-h-full items-stretch">
              {colunas.map((coluna, index) => (
                <KanbanColumn
                  key={coluna.id}
                  coluna={coluna}
                  negocios={coluna.cards}
                  isMobile={isMobile}
                  onOpenDetails={handleOpenDetails}
                  onMoveStage={handleMoverBotao}
                  onEdit={handleEditar}
                  onDelete={handleDeletar}
                  onQuickCreate={abrirModalCriarComStatus}
                  columnIndex={index}
                />
              ))}
            </div>
          </DragDropContext>
        ) : (
          <ListView
            negocios={sortedNegocios}
            onEdit={handleEditar}
            onDelete={handleDeletar}
            onOpenDetails={handleOpenDetails}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        )}
      </div>

      <NegocioDrawer
        negocio={negocioDetalhes}
        isOpen={!!negocioDetalhes}
        onClose={handleCloseDetails}
        onEdit={handleEditar}
      />

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={negocioEditando ? 'Editar' : 'Novo'}
        icon={<Pencil size={18} />}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="form-negocio"
              disabled={salvando}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-lg font-semibold transition-colors disabled:opacity-60"
            >
              {salvando ? '...' : 'Salvar'}
            </button>
          </div>
        }
      >
        <form id="form-negocio" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Título</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className={modalInputClass}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Contato</label>
              <input
                type="text"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                className={modalInputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Valor</label>
              <input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className={modalInputClass}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={modalInputClass}
              >
                {colunas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titulo}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Produtos</label>
            <SelectProdutos
              produtos={produtosDisponiveis}
              produtosSelecionados={produtosSelecionados}
              onAdicionar={(p) => {
                if (!produtosSelecionados.find((x) => x.id === p.id)) {
                  setProdutosSelecionados([...produtosSelecionados, p]);
                  setValor((v) => Number(v) + Number(p.preco));
                }
              }}
              onRemover={(id, p) => {
                setProdutosSelecionados(produtosSelecionados.filter((x) => x.id !== id));
                setValor((v) => Math.max(0, Number(v) - Number(p)));
              }}
            />
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmarDelecao}
        message="Excluir este negócio?"
      />

      <ModalConfigurarFunil
        isOpen={isFunilModalOpen}
        onClose={() => setIsFunilModalOpen(false)}
        empresaId={dadosUsuario?.empresaId}
      />
    </div>
  );
}

function KPICard({ title, value, icon, color }) {
  const styles = {
    emerald: {
      badge: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/25',
      value: 'text-slate-900 dark:text-white',
    },
    emeraldStrong: {
      badge: 'bg-emerald-100/90 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-500/30',
      value: 'text-emerald-700 dark:text-emerald-400',
    },
    red: {
      badge: 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-200/70 dark:border-red-500/25',
      value: 'text-red-600 dark:text-red-400',
    },
  };

  const current = styles[color] || styles.emerald;

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200/90 dark:border-slate-800 px-3.5 py-2.5 flex items-center justify-between gap-2.5 shadow-2xs min-w-0">
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate m-0">
          {title}
        </p>
        <p className={`text-sm sm:text-base font-bold tabular-nums truncate mt-0.5 m-0 ${current.value}`}>
          {value}
        </p>
      </div>
      <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center ${current.badge}`}>
        {icon}
      </div>
    </div>
  );
}