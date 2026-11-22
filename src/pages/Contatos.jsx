import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { escutarContatos, adicionarContato, atualizarContato, deletarContato } from '@/services/contatoService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PageHeader from '@/components/ui/PageHeader';
import toast from 'react-hot-toast';
import { Plus, Search, Users, Pencil, Trash2, X, Mail, Phone, Building2 } from 'lucide-react';

export default function Contatos() {
  const { dadosUsuario } = useAuth();
  const [searchParams] = useSearchParams();

  const [contatos, setContatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [idParaDeletar, setIdParaDeletar] = useState(null);
  const [busca, setBusca] = useState('');

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFiltro(tipo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!dadosUsuario?.empresaId) return;
    const unsubscribe = escutarContatos(dadosUsuario.empresaId, (lista) => {
      setContatos(lista);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [dadosUsuario?.empresaId]);

  const contadores = useMemo(() => {
    const leads = contatos.filter((c) => c.status !== 'Cliente').length;
    const clientes = contatos.filter((c) => c.status === 'Cliente').length;
    return {
      todos: contatos.length,
      leads,
      clientes,
    };
  }, [contatos]);

  // Lógica de Filtragem (Busca + Aba)
  const contatosFiltrados = contatos.filter((c) => {
    let passaNaAba = true;
    if (filtro === 'leads') passaNaAba = c.status !== 'Cliente';
    if (filtro === 'clientes') passaNaAba = c.status === 'Cliente';

    const termo = busca.trim().toLowerCase();
    if (!termo) return passaNaAba;

    const passaNaBusca =
      c.nome?.toLowerCase().includes(termo) ||
      c.email?.toLowerCase().includes(termo) ||
      c.empresa?.toLowerCase().includes(termo) ||
      c.cargo?.toLowerCase().includes(termo) ||
      c.telefone?.toLowerCase().includes(termo);

    return passaNaAba && passaNaBusca;
  });

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
    setNome(contato.nome);
    setEmail(contato.email);
    setTelefone(contato.telefone || '');
    setStatus(contato.status || 'Novo');
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
    const dados = { nome, email, telefone, status, cargo, empresa, endereco, observacoes };

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

  const getStatusBadgeClass = (contatoStatus) => {
    switch (contatoStatus) {
      case 'Cliente':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30';
      case 'Em Atendimento':
        return 'bg-amber-100 text-amber-800 border border-amber-200/80 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  // Classes reutilizáveis
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
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all inline-flex items-center justify-center gap-1.5 ${filtro === 'todos'
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
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all inline-flex items-center justify-center gap-1.5 ${filtro === 'leads'
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
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all inline-flex items-center justify-center gap-1.5 ${filtro === 'clientes'
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
                      Status
                    </th>
                    <th className="px-5 py-3 text-[11px] font-bold tracking-wider !text-slate-500 dark:!text-slate-400 uppercase text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {contatosFiltrados.map((contato) => (
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
                            <p className="text-sm font-semibold !text-slate-900 dark:!text-white truncate">
                              {contato.nome}
                            </p>
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
                        {contato.email}
                      </td>

                      <td className="px-5 py-3 text-sm !text-slate-600 dark:!text-slate-300 tabular-nums">
                        {contato.telefone || '-'}
                      </td>

                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadgeClass(
                            contato.status
                          )}`}
                        >
                          {contato.status || 'Novo'}
                        </span>
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* VISÃO MOBILE */}
            <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
              {contatosFiltrados.map((contato) => (
                <div key={contato.id} className="p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/70 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {contato.nome?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm !text-slate-900 dark:!text-white truncate">
                          {contato.nome}
                        </h3>
                        <p className="text-xs !text-slate-500 dark:!text-slate-400 truncate flex items-center gap-1">
                          <Building2 size={11} className="shrink-0" />
                          <span>
                            {contato.cargo ? `${contato.cargo} • ` : ''}
                            {contato.empresa || 'Sem empresa'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${getStatusBadgeClass(
                        contato.status
                      )}`}
                    >
                      {contato.status || 'Novo'}
                    </span>
                  </div>

                  <div className="space-y-1 pt-1 text-xs !text-slate-600 dark:!text-slate-300">
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{contato.email}</span>
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
              ))}
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