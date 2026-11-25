import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase-config';
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
import {
  Plus,
  Briefcase,
  DollarSign,
  TrendingUp,
  Pencil,
  LayoutGrid,
  List,
  Settings,
  UserCheck,
  UserPlus,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { DragDropContext } from '@hello-pangea/dnd';

import ListView from '@/features/negocios/ListView';
import ModalConfigurarFunil from '@/features/negocios/ModalConfigurarFunil';

import { garantirContatoVinculado } from '@/services/negocioContatoService';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

const normalizarTelefone = (tel = '') => String(tel).replace(/\D/g, '');

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
  const [contatosCadastrados, setContatosCadastrados] = useState([]);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [negocioEditando, setNegocioEditando] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState('Aberto');

  // Estados de contato do negócio
  const [contatoSelecionadoId, setContatoSelecionadoId] = useState('');
  const [contato, setContato] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  const [produtosSelecionados, setProdutosSelecionados] = useState([]);
  const [observacoes, setObservacoes] = useState('');
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

  useEffect(() => {
    if (!dadosUsuario?.empresaId) return;
    const q = query(
      collection(db, 'contatos'),
      where('empresaId', '==', dadosUsuario.empresaId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'));
      setContatosCadastrados(lista);
    });

    return () => unsub();
  }, [dadosUsuario?.empresaId]);

  const contatoCorrespondente = useMemo(() => {
    if (contatoSelecionadoId) {
      return contatosCadastrados.find((c) => c.id === contatoSelecionadoId) || null;
    }

    const emailLimpo = String(email || '').trim().toLowerCase();
    const telLimpo = normalizarTelefone(telefone);
    const nomeLimpo = String(contato || '').trim().toLowerCase();

    if (emailLimpo) {
      const porEmail = contatosCadastrados.find(
        (c) => String(c.email || '').trim().toLowerCase() === emailLimpo
      );
      if (porEmail) return porEmail;
    }

    if (telLimpo.length >= 8) {
      const porTel = contatosCadastrados.find((c) => {
        const telDoc = normalizarTelefone(c.telefone);
        return telDoc && (telDoc === telLimpo || telDoc.endsWith(telLimpo) || telLimpo.endsWith(telDoc));
      });
      if (porTel) return porTel;
    }

    if (nomeLimpo) {
      const porNome = contatosCadastrados.find(
        (c) => String(c.nome || '').trim().toLowerCase() === nomeLimpo
      );
      if (porNome) return porNome;
    }

    return null;
  }, [contatoSelecionadoId, contato, telefone, email, contatosCadastrados]);

  const handleSelecionarContatoExistente = (idSelecionado) => {
    setContatoSelecionadoId(idSelecionado);
    if (!idSelecionado) return;

    const encontrado = contatosCadastrados.find((c) => c.id === idSelecionado);
    if (encontrado) {
      setContato(encontrado.nome || '');
      setTelefone(encontrado.telefone || '');
      setEmail(encontrado.email || '');
    }
  };

  const formatarMoeda = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const abrirModalCriarComStatus = (stageId = 'Aberto') => {
    setNegocioEditando(null);
    setTitulo('');
    setValor('');
    setStatus(stageId);
    setContatoSelecionadoId('');
    setContato('');
    setTelefone('');
    setEmail('');
    setProdutosSelecionados([]);
    setObservacoes('');
    setIsFormModalOpen(true);
  };

  const abrirModalCriar = () => abrirModalCriarComStatus('Aberto');

  const handleEditar = (n) => {
    setNegocioEditando(n.id);
    setTitulo(n.titulo || '');
    setValor(n.valor ?? '');
    setStatus(n.status || 'Aberto');
    setContatoSelecionadoId(n.contatoId || '');
    setContato(n.contato || '');
    setTelefone(n.telefone || '');
    setEmail(n.email || '');
    setProdutosSelecionados(n.produtos || []);
    setObservacoes(n.observacoes || '');
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);

    try {
      const empresaId = dadosUsuario?.empresaId;
      if (!empresaId) {
        toast.error('Empresa não identificada.');
        return;
      }

      const colunaCorrespondente = (colunas || []).find(
        (col) =>
          String(col.id).toLowerCase() === String(status || '').trim().toLowerCase() ||
          String(col.titulo).toLowerCase() === String(status || '').trim().toLowerCase()
      );

      const statusNormalizado =
        colunaCorrespondente?.id ||
        (colunas?.[0]?.id ?? status) ||
        'prospeccao';

      const nomeContatoFinal = String(contato || '').trim() || String(titulo || '').trim();
      const telefoneFinal = String(telefone || '').trim();
      const emailFinal = String(email || '').trim();
      const observacoesFinal = String(observacoes || '').trim();
      const jaExiste = Boolean(contatoCorrespondente);

      const resultadoContato = await garantirContatoVinculado({
        empresaId,
        contatoIdSelecionado: contatoCorrespondente?.id || contatoSelecionadoId || null,
        nomeContato: nomeContatoFinal,
        telefone: telefoneFinal,
        email: emailFinal,
        telefoneOuEmail: telefoneFinal || emailFinal,
        observacoes: observacoesFinal,
        tipo: jaExiste ? 'cliente' : 'lead',
      });

      const contatoId =
        typeof resultadoContato === 'string'
          ? resultadoContato
          : resultadoContato?.contatoId || contatoCorrespondente?.id || null;

      const dados = {
        titulo,
        valor: Number(valor),
        status: statusNormalizado,
        contato: nomeContatoFinal,
        telefone: telefoneFinal,
        email: emailFinal,
        observacoes: observacoesFinal,
        contatoExistente: jaExiste,
        produtos: produtosSelecionados,
        ...(contatoId ? { contatoId } : {}),
      };

      const res = negocioEditando
        ? await atualizarNegocio(negocioEditando, dados)
        : await adicionarNegocio(dados, empresaId);

      if (res.sucesso) {
        toast.success(
          negocioEditando
            ? 'Atualizado!'
            : jaExiste
              ? 'Negócio criado e vinculado ao contato existente!'
              : 'Negócio criado e novo lead cadastrado!'
        );
        setIsFormModalOpen(false);
      } else {
        toast.error(res.erro);
      }
    } finally {
      setSalvando(false);
    }
  };

  const modalInputClass =
    'w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all';

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-50/70 dark:bg-slate-950 text-left transition-colors">

      {/* 1. ÁREA FIXA SUPERIOR */}
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

        {/* KPIs */}
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

      {/* 2. KANBAN / LISTA */}
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
        title={negocioEditando ? 'Editar Negócio' : 'Novo Negócio'}
        icon={<Pencil size={18} />}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/70 bg-white dark:bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="form-negocio"
              disabled={salvando}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-lg font-semibold transition-colors disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        }
      >
        <form id="form-negocio" onSubmit={handleSubmit} className="space-y-4 pb-16">
          {/* Dados do Negócio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Título do Negócio *
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Fornecimento BioBac"
                className={modalInputClass}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className={modalInputClass}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Etapa / Status
              </label>
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

          {/* Informações do Contato / Cliente */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Contato / Cliente
              </label>

              {contatoCorrespondente ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                  <UserCheck size={13} />
                  Já cadastrado ({contatoCorrespondente.nome})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <UserPlus size={13} />
                  Novo contato (será criado como lead)
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Selecionar Contato / Cliente Existente
              </label>
              <select
                value={contatoSelecionadoId}
                onChange={(e) => handleSelecionarContatoExistente(e.target.value)}
                className={modalInputClass}
              >
                <option value="">— Novo contato ou buscar por nome/telefone/e-mail —</option>
                {contatosCadastrados.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                    {c.empresa ? ` • ${c.empresa}` : ''}
                    {c.telefone ? ` (${c.telefone})` : ''}
                    {c.status ? ` [${c.status}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <User size={13} /> Nome do Contato
                </label>
                <input
                  type="text"
                  value={contato}
                  onChange={(e) => {
                    setContato(e.target.value);
                    if (contatoSelecionadoId) setContatoSelecionadoId('');
                  }}
                  placeholder="Nome do cliente ou lead"
                  className={modalInputClass}
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <Phone size={13} /> Telefone
                </label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => {
                    setTelefone(e.target.value);
                    if (contatoSelecionadoId) setContatoSelecionadoId('');
                  }}
                  placeholder="(75) 99999-9999"
                  className={modalInputClass}
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <Mail size={13} /> E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (contatoSelecionadoId) setContatoSelecionadoId('');
                  }}
                  placeholder="cliente@empresa.com"
                  className={modalInputClass}
                />
              </div>
            </div>
          </div>

          {/* Produtos em Verde Esmeralda */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Produtos
            </label>
            <div className="[&_[class*='bg-blue-50']]:!bg-emerald-50/80 dark:[&_[class*='bg-blue-50']]:!bg-emerald-500/15 [&_[class*='bg-blue-100']]:!bg-emerald-100 dark:[&_[class*='bg-blue-100']]:!bg-emerald-500/20 [&_[class*='border-blue-']]:!border-emerald-200 dark:[&_[class*='border-blue-']]:!border-emerald-500/30 [&_[class*='text-blue-']]:!text-emerald-700 dark:[&_[class*='text-blue-']]:!text-emerald-300">
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
          </div>

          {/* Observações */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Observações
            </label>
            <textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Detalhes do pedido, condições negociadas ou observações do atendimento..."
              className={`${modalInputClass} resize-y min-h-[76px]`}
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