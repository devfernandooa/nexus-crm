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

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-50/70 dark:bg-slate-950 text-left">

      {/* 1. ÁREA FIXA SUPERIOR */}
      <div className="shrink-0 px-3 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 z-10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <Briefcase size={15} />
            </span>
            <div className="flex flex-wrap items-baseline gap-2.5 min-w-0">
              <h1
                style={{ fontSize: '16px', lineHeight: '1.2', margin: 0 }}
                className="font-bold !text-slate-900 dark:!text-white truncate"
              >
                Negócios
              </h1>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Arraste os cards ou use as setas para avançar etapas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <LayoutGrid size={13} /> Kanban
              </button>
              <button
                type="button"
                onClick={() => setViewMode('lista')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'lista'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <List size={13} /> Lista
              </button>
            </div>

            <button
              type="button"
              onClick={abrirModalCriar}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 shadow-2xs text-xs transition-colors"
            >
              <Plus size={14} /> Novo Negócio
            </button>

            <button
              type="button"
              onClick={() => setIsFunilModalOpen(true)}
              className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 text-xs transition-colors"
              title="Configurar etapas do funil"
            >
              <Settings size={14} /> Etapas
            </button>
          </div>
        </div>

        {/* KPIs um pouco maiores com espaçamento equilibrado */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* KPIs alinhados em 3 colunas */}
          <div className="grid grid-cols-3 gap-2">
            <KPICard title="Em Aberto" value={formatarMoeda(kpiData.totalAberto)} icon={<Briefcase size={14} />} color="blue" />
            <KPICard title="Ganhos" value={formatarMoeda(kpiData.totalGanho)} icon={<TrendingUp size={14} />} color="emerald" />
            <KPICard title="Perdidos" value={formatarMoeda(kpiData.totalPerdido)} icon={<DollarSign size={14} />} color="red" />
          </div>

          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
            {negocios.length} {negocios.length === 1 ? 'negócio no funil' : 'negócios no funil'}
          </span>
        </div>
      </div>

      {/* 2. SOMENTE A SEÇÃO DAS COLUNAS TEM SCROLL */}
      <div className="flex-1 min-h-0 overflow-auto scrollbar-thin bg-[#f9fafb] dark:bg-slate-900/50">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium"
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Contato</label>
              <input
                type="text"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
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
    blue: {
      badge: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
      value: 'text-slate-900 dark:text-white',
    },
    emerald: {
      badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      value: 'text-emerald-600 dark:text-emerald-400',
    },
    red: {
      badge: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
      value: 'text-red-600 dark:text-red-400',
    },
  };

  const current = styles[color] || styles.blue;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 px-2.5 py-2 flex items-center justify-between gap-2 shadow-2xs min-w-0">
      <div className="min-w-0">
        <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate m-0">
          {title}
        </p>
        <p className={`text-xs sm:text-sm font-bold tabular-nums truncate mt-0.5 m-0 ${current.value}`}>
          {value}
        </p>
      </div>
      <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 hidden xs:flex sm:flex ${current.badge}`}>
        {icon}
      </div>
    </div>
  );
}