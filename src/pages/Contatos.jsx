import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { escutarContatos, adicionarContato, atualizarContato, deletarContato } from '@/services/contatoService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PageHeader from '@/components/ui/PageHeader';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
  X,
  Mail,
  Phone,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const ITENS_POR_PAGINA = 10;

function classificarContato(contato) {
  const candidatos = [
    contato?.tipo,
    contato?.status,
    contato?.categoria,
    contato?.perfil,
    contato?.estagio,
    contato?.etapa,
    contato?.fase,
  ]
    .filter(Boolean)
    .map((v) => String(v).trim().toLowerCase());

  const ehCliente = candidatos.some(
    (val) =>
      val === 'cliente' ||
      val === 'clientes' ||
      val === 'client' ||
      val.startsWith('cliente ')
  );

  return ehCliente ? 'cliente' : 'lead';
}

function obterVisualStatusContato(contato) {
  const categoria = classificarContato(contato);
  const status = String(contato?.status || '').trim().toLowerCase();

  // 1. Cliente: sem flag de lead ao lado do nome, pill verde na coluna Status
  if (categoria === 'cliente') {
    return {
      ehCliente: true,
      ehNovoLead: false,
      mostrarFlagLead: false,
      labelFlag: '',
      classeFlag: '',
      labelStatus: 'Cliente',
      classeStatus:
        'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
    };
  }

  // 2. Em Atendimento: flag âmbar no mesmo local ao lado do nome
  if (status === 'em atendimento' || status === 'em_atendimento') {
    return {
      ehCliente: false,
      ehNovoLead: false,
      mostrarFlagLead: true,
      labelFlag: 'Em Atendimento',
      classeFlag:
        'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
      labelStatus: 'Em Atendimento',
      classeStatus: '',
    };
  }

  // 3. Novo Lead: flag vermelha pulsante no mesmo local
  const ehNovo =
    status === '' ||
    status === 'novo' ||
    status === 'novo_lead' ||
    status === 'novo lead';

  if (ehNovo) {
    return {
      ehCliente: false,
      ehNovoLead: true,
      mostrarFlagLead: true,
      labelFlag: 'Novo Lead',
      classeFlag:
        'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
      labelStatus: 'Novo Lead',
      classeStatus: '',
    };
  }

  // 4. Outros status de lead em andamento
  return {
    ehCliente: false,
    ehNovoLead: false,
    mostrarFlagLead: true,
    labelFlag: contato.status || 'Lead',
    classeFlag:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    labelStatus: contato.status || 'Lead',
    classeStatus: '',
  };
}

export default function Contatos() {
  const { dadosUsuario } = useAuth();
  const [searchParams] = useSearchParams();

  const [contatos, setContatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [idParaDeletar, setIdParaDeletar] = useState(null);
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Estado do Filtro (Todos, Leads, Clientes)
  const [filtro, setFiltro] = useState(searchParams.get('tipo') || 'todos');

  // Estados do Formulário
  const [contatoEditando, setContatoEditando] = useState(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [endereco, setEndereco] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState('Novo');
  const [salvando, setSalvando] = useState(false);

  // Atualiza o filtro se o usuário mudar a URL pela Sidebar
  useEffect(() => {
    const tipo = searchParams.get('tipo') || 'todos';
    setFiltro(tipo);
    setPaginaAtual(1);
  }, [searchParams]);

  // Volta para a página 1 ao trocar filtro ou termo de busca
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtro, busca]);

  useEffect(() => {
    if (!dadosUsuario?.empresaId) return;
    const unsubscribe = escutarContatos(dadosUsuario.empresaId, (lista) => {
      setContatos(lista);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [dadosUsuario?.empresaId]);

  const contadores = useMemo(() => {
    let clientes = 0;
    let leads = 0;

    for (const c of contatos) {
      if (classificarContato(c) === 'cliente') {
        clientes += 1;
      } else {
        leads += 1;
      }
    }

    return {
      todos: contatos.length,
      leads,
      clientes,
    };
  }, [contatos]);

  // Lógica de Filtragem (Busca + Aba)
  const contatosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return contatos.filter((c) => {
      const categoria = classificarContato(c);

      let passaNaAba = true;
      if (filtro === 'leads') passaNaAba = categoria === 'lead';
      if (filtro === 'clientes') passaNaAba = categoria === 'cliente';

      if (!passaNaAba) return false;
      if (!termo) return true;

      return (
        c.nome?.toLowerCase().includes(termo) ||
        c.email?.toLowerCase().includes(termo) ||
        c.empresa?.toLowerCase().includes(termo) ||
        c.cargo?.toLowerCase().includes(termo) ||
        c.telefone?.toLowerCase().includes(termo) ||
        c.observacoes?.toLowerCase().includes(termo)
      );
    });
  }, [contatos, filtro, busca]);

  const totalPaginas = Math.max(1, Math.ceil(contatosFiltrados.length / ITENS_POR_PAGINA));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  const contatosPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return contatosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [contatosFiltrados, paginaSegura]);

  const indiceInicioExibido =
    contatosFiltrados.length === 0 ? 0 : (paginaSegura - 1) * ITENS_POR_PAGINA + 1;
  const indiceFimExibido = Math.min(
    paginaSegura * ITENS_POR_PAGINA,
    contatosFiltrados.length
  );

  function abrirModalCriar() {
    setContatoEditando(null);
    setNome('');
    setEmail('');
    setTelefone('');
    setStatus('Novo');
    setCargo('');
    setEmpresa('');
    setEndereco('');
    setObservacoes('');
    setIsModalOpen(true);
  }

  function handleEditar(contato) {
    setContatoEditando(contato.id);
    setNome(contato.nome || '');
    setEmail(contato.email || '');
    setTelefone(contato.telefone || '');
    setStatus(classificarContato(contato) === 'cliente' ? 'Cliente' : contato.status || 'Novo');
    setCargo(contato.cargo || '');
    setEmpresa(contato.empresa || '');
    setEndereco(contato.endereco || '');
    setObservacoes(contato.observacoes || '');
    setIsModalOpen(true);
  }

  function handleDeletar(id) {
    setIdParaDeletar(id);
    setIsConfirmOpen(true);
  }

  async function confirmarDelecao() {
    const resultado = await deletarContato(idParaDeletar);
    if (resultado.sucesso) {
      toast.success('Contato excluído com sucesso!');
      setIsConfirmOpen(false);
    } else {
      toast.error('Erro ao excluir contato.');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSalvando(true);
    const dados = {
      nome,
      email,
      telefone,
      status,
      ...(status === 'Cliente' ? { tipo: 'cliente' } : { tipo: 'lead' }),
      cargo,
      empresa,
      endereco,
      observacoes,
    };

    let resultado;
    if (contatoEditando) {
      resultado = await atualizarContato(contatoEditando, dados);
    } else {
      resultado = await adicionarContato(dados, dadosUsuario.empresaId);
    }

    if (resultado.sucesso) {
      toast.success(contatoEditando ? 'Contato atualizado!' : 'Contato criado!');
      setIsModalOpen(false);
    } else {
      toast.error('Erro: ' + resultado.erro);
    }
    setSalvando(false);
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all';
  const labelClass = 'block text-xs font-semibold !text-slate-700 dark:!text-slate-300 mb-1';

  return (
    <div className="w-full min-h-full flex flex-col px-4 sm:px-6 lg:px-7 py-4 sm:py-5 bg-slate-50/60 dark:bg-slate-950 transition-colors text-left">
      <PageHeader
        icon={<Users size={18} />}
        title="Contatos"
        subtitle="Gerencie os leads e clientes da sua empresa."
        action={
          <button
            type="button"
            onClick={abrirModalCriar}
            className="bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors w-full md:w-auto justify-center shadow-2xs mr-1"
          >
            <Plus size={16} /> Novo Contato
          </button>
        }
      />

      {/* Barra de Filtros (Abas) e Busca */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 mb-4">
        <div className="flex gap-1.5 bg-white dark:bg-[#0b192c] border border-slate-200/90 dark:border-slate-800 p-1 rounded-xl w-full md:w-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setFiltro('todos')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all inline-flex items-center justify-center gap-1.5 ${
              filtro === 'todos'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 shadow-2xs'
                : 'border border-transparent !text-slate-600 dark:!text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <span>Todos</span>
            <span className="text-[11px] opacity-75 tabular-nums">({contadores.todos})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltro('leads')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all inline-flex items-center justify-center gap-1.5 ${
              filtro === 'leads'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 shadow-2xs'
                : 'border border-transparent !text-slate-600 dark:!text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <span>Leads</span>
            <span className="text-[11px] opacity-75 tabular-nums">({contadores.leads})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltro('clientes')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all inline-flex items-center justify-center gap-1.5 ${
              filtro === 'clientes'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 shadow-2xs'
                : 'border border-transparent !text-slate-600 dark:!text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <span>Clientes</span>
            <span className="text-[11px] opacity-75 tabular-nums">({contadores.clientes})</span>
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, empresa..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm bg-white dark:bg-[#0b192c] border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs transition-all"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              aria-label="Limpar busca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Container da Tabela / Cards */}
      <div className="bg-white dark:bg-[#0b192c] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs flex flex-col flex-1">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/70 rounded-lg" />
            ))}
          </div>
        ) : contatosFiltrados.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center flex-1">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/80 dark:border-emerald-500/25 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
              <Users size={26} />
            </div>
            <h3 className="text-base sm:text-lg font-bold !text-slate-900 dark:!text-white mb-1">
              Nenhum contato encontrado
            </h3>
            <p className="text-xs sm:text-sm !text-slate-500 dark:!text-slate-400 mb-5 max-w-md">
              {busca
                ? 'Nenhum contato corresponde ao termo pesquisado.'
                : 'Nenhum contato cadastrado neste filtro ainda.'}
            </p>
            <button
              type="button"
              onClick={abrirModalCriar}
              className="bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Plus size={16} /> Adicionar Contato
            </button>
          </div>
        ) : (
          <>
            {/* VISÃO DESKTOP */}
            <div className="hidden md:block overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/65 border-b border-slate-200/80 dark:border-slate-800">
                    <th className="px-5 py-3 text-[11px] font-bold tracking-wider !text-slate-500 dark:!text-slate-400 uppercase">
                      Nome / Cargo
                    </th>
                    <th className="px-5 py-3 text-[11px] font-bold tracking-wider !text-slate-500 dark:!text-slate-400 uppercase">
                      Empresa
                    </th>
                    <th className="px-5 py-3 text-[11px] font-bold tracking-wider !text-slate-500 dark:!text-slate-400 uppercase">
                      E-mail
                    </th>
                    <th className="px-5 py-3 text-[11px] font-bold tracking-wider !text-slate-500 dark:!text-slate-400 uppercase">
                      Telefone
                    </th>
                    <th className="px-5 py-3 text-[11px] font-bold tracking-wider !text-slate-500 dark:!text-slate-400 uppercase">
                      Observações
                    </th>
                    <th className="px-5 py-3 text-[11px] font-bold tracking-wider !text-slate-500 dark:!text-slate-400 uppercase">
                      Status
                    </th>
                    <th className="px-5 py-3 text-[11px] font-bold tracking-wider !text-slate-500 dark:!text-slate-400 uppercase text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {contatosPaginados.map((contato) => {
                    const visual = obterVisualStatusContato(contato);
                    return (
                      <tr
                        key={contato.id}
                        className="hover:bg-emerald-50/35 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/70 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                              {contato.nome?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold !text-slate-900 dark:!text-white truncate">
                                  {contato.nome}
                                </p>
                                {visual.mostrarFlagLead && (
                                  <span
                                    className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${visual.classeFlag}`}
                                  >
                                    {visual.ehNovoLead && (
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                                      </span>
                                    )}
                                    {visual.labelFlag}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs !text-slate-500 dark:!text-slate-400 truncate">
                                {contato.cargo || 'Sem cargo'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3 text-sm !text-slate-600 dark:!text-slate-300">
                          {contato.empresa || '-'}
                        </td>

                        <td className="px-5 py-3 text-sm !text-slate-600 dark:!text-slate-300">
                          {contato.email || '-'}
                        </td>

                        <td className="px-5 py-3 text-sm !text-slate-600 dark:!text-slate-300 tabular-nums">
                          {contato.telefone || '-'}
                        </td>

                        <td
                          className="px-5 py-3 text-sm !text-slate-600 dark:!text-slate-300 max-w-xs"
                          title={contato.observacoes || ''}
                        >
                          <p className="line-clamp-2">
                            {contato.observacoes
                              ? contato.observacoes.replace(/^Interesse via WhatsApp:\s*/i, '')
                              : '-'}
                          </p>
                        </td>

                        <td className="px-5 py-3">
                          {visual.ehCliente && (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${visual.classeStatus}`}
                            >
                              {visual.labelStatus}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditar(contato)}
                              title="Editar contato"
                              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletar(contato.id)}
                              title="Excluir contato"
                              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* VISÃO MOBILE */}
            <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
              {contatosPaginados.map((contato) => {
                const visual = obterVisualStatusContato(contato);
                return (
                  <div key={contato.id} className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/70 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {contato.nome?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-sm !text-slate-900 dark:!text-white truncate">
                              {contato.nome}
                            </h3>
                            {visual.mostrarFlagLead && (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${visual.classeFlag}`}
                              >
                                {visual.ehNovoLead && (
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600" />
                                  </span>
                                )}
                                {visual.labelFlag}
                              </span>
                            )}
                          </div>
                          <p className="text-xs !text-slate-500 dark:!text-slate-400 truncate flex items-center gap-1">
                            <Building2 size={11} className="shrink-0" />
                            <span>
                              {contato.cargo ? `${contato.cargo} • ` : ''}
                              {contato.empresa || 'Sem empresa'}
                            </span>
                          </p>
                        </div>
                      </div>

                      {visual.ehCliente && (
                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${visual.classeStatus}`}
                        >
                          {visual.labelStatus}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 pt-1 text-xs !text-slate-600 dark:!text-slate-300">
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{contato.email || '-'}</span>
                      </p>
                      {contato.telefone && (
                        <p className="flex items-center gap-1.5 tabular-nums">
                          <Phone size={12} className="text-slate-400 shrink-0" />
                          <span>{contato.telefone}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2.5 mt-1 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleEditar(contato)}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/70 dark:border-emerald-500/25 rounded-lg w-1/2 transition-colors"
                      >
                        <Pencil size={13} /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletar(contato.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-red-700 dark:text-red-300 font-semibold bg-red-50 dark:bg-red-500/15 border border-red-200/70 dark:border-red-500/25 rounded-lg w-1/2 transition-colors"
                      >
                        <Trash2 size={13} /> Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAGINAÇÃO */}
            <div className="px-4 sm:px-5 py-3 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs !text-slate-500 dark:!text-slate-400 tabular-nums">
                Mostrando <span className="font-semibold text-slate-700 dark:text-slate-200">{indiceInicioExibido}</span>–
                <span className="font-semibold text-slate-700 dark:text-slate-200">{indiceFimExibido}</span> de{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{contatosFiltrados.length}</span>{' '}
                contato{contatosFiltrados.length === 1 ? '' : 's'}
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  disabled={paginaSegura <= 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-45 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft size={14} /> Anterior
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPaginas }, (_, idx) => idx + 1).map((numPag) => (
                    <button
                      key={numPag}
                      type="button"
                      onClick={() => setPaginaAtual(numPag)}
                      className={`min-w-[30px] h-[30px] px-2 text-xs font-semibold rounded-lg border transition-colors tabular-nums ${
                        numPag === paginaSegura
                          ? 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:text-slate-950 dark:border-emerald-500'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {numPag}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaSegura >= totalPaginas}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-45 disabled:pointer-events-none transition-colors"
                >
                  Próxima <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Criar / Editar Contato */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={contatoEditando ? 'Editar Contato' : 'Novo Contato'}
        icon={contatoEditando ? <Pencil size={18} /> : <Plus size={18} />}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider !text-slate-500 dark:!text-slate-400 mb-2.5 pb-1 border-b border-slate-200/80 dark:border-slate-800">
              Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nome Completo *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={inputClass}
                  placeholder="Ex: João Silva"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>E-mail *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="joao@empresa.com"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Telefone</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className={inputClass}
                  placeholder="(75) 99999-9999"
                />
              </div>
              <div>
                <label className={labelClass}>Cargo</label>
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className={inputClass}
                  placeholder="Ex: Gerente Comercial"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider !text-slate-500 dark:!text-slate-400 mb-2.5 pb-1 border-b border-slate-200/80 dark:border-slate-800">
              Dados Profissionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Empresa</label>
                <input
                  type="text"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className={inputClass}
                  placeholder="Ex: Agro Plus"
                />
              </div>
              <div>
                <label className={labelClass}>Endereço</label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className={inputClass}
                  placeholder="Ex: Feira de Santana - BA"
                />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={inputClass}
                >
                  <option value="Novo">Novo</option>
                  <option value="Em Atendimento">Em Atendimento</option>
                  <option value="Cliente">Cliente</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider !text-slate-500 dark:!text-slate-400 mb-2.5 pb-1 border-b border-slate-200/80 dark:border-slate-800">
              Anotações
            </h3>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Anotações relevantes sobre este contato..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800 mt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium !text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:!text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-lg font-semibold transition-colors disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : contatoEditando ? 'Salvar Alterações' : 'Criar Contato'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmarDelecao}
        message="Tem certeza que deseja excluir este contato?"
      />
    </div>
  );
}