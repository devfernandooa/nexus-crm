import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // Importante para ler a URL
import { useAuth } from '@/hooks/useAuth';
import { escutarContatos, adicionarContato, atualizarContato, deletarContato } from '@/services/contatoService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PageHeader from '@/components/ui/PageHeader';
import toast from 'react-hot-toast';
import { Plus, Search, Users, Pencil, Trash2 } from 'lucide-react';

export default function Contatos() {
  const { dadosUsuario } = useAuth();
  const [searchParams] = useSearchParams(); // Lê os parâmetros da URL

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

  // Lógica de Filtragem (Busca + Aba)
  const contatosFiltrados = contatos.filter(c => {
    // 1. Filtro da Aba
    let passaNaAba = true;
    if (filtro === 'leads') passaNaAba = c.status !== 'Cliente';
    if (filtro === 'clientes') passaNaAba = c.status === 'Cliente';

    // 2. Filtro da Busca
    const termo = busca.toLowerCase();
    const passaNaBusca = c.nome.toLowerCase().includes(termo) || c.email.toLowerCase().includes(termo);

    return passaNaAba && passaNaBusca;
  });

  function abrirModalCriar() {
    setContatoEditando(null);
    setNome(''); setEmail(''); setTelefone(''); setStatus('Novo');
    setCargo(''); setEmpresa(''); setEndereco(''); setObservacoes('');
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
      toast.error("Erro: " + resultado.erro);
    }
    setSalvando(false);
  }

  // Classes reutilizáveis
  const inputClass = "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white";
  const labelClass = "block text-xs font-semibold !text-slate-600 dark:!text-slate-400 mb-1";

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader
        icon={<Users size={18} />}
        title="Contatos"
        subtitle="Gerencie os leads e clientes da sua empresa."
        action={
          <button onClick={abrirModalCriar} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors w-full md:w-auto justify-center shadow-sm">
            <Plus size={18} /> Novo Contato
          </button>
        }
      />

      {/* Barra de Filtros (Abas) e Busca */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg w-full md:w-auto">
          <button onClick={() => setFiltro('todos')} className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filtro === 'todos' ? 'bg-white dark:bg-slate-700 shadow-sm !text-slate-900 dark:!text-white' : '!text-slate-500 hover:text-slate-700'}`}>Todos</button>
          <button onClick={() => setFiltro('leads')} className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filtro === 'leads' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : '!text-slate-500 hover:text-slate-700'}`}>Leads</button>
          <button onClick={() => setFiltro('clientes')} className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filtro === 'clientes' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : '!text-slate-500 hover:text-slate-700'}`}>Clientes</button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar contatos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            // Adicionado pl-10 (padding-left) para o ícone não sobrepor o texto
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col flex-1">
        {loading ? (
          <div className="p-8 text-center !text-slate-500">Carregando contatos...</div>
        ) : contatosFiltrados.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center flex-1">
            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-blue-500 mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold !text-slate-900 dark:!text-white mb-2">Nenhum contato encontrado</h3>
            <p className="!text-slate-500 mb-6 max-w-md">Nenhum contato corresponde a este filtro.</p>
            <button onClick={abrirModalCriar} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
              <Plus size={18} /> Adicionar Contato
            </button>
          </div>
        ) : (
          <>
            {/* VISÃO DESKTOP */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-3 text-xs font-semibold !text-slate-500 uppercase">Nome / Cargo</th>
                    <th className="px-6 py-3 text-xs font-semibold !text-slate-500 uppercase">Empresa</th>
                    <th className="px-6 py-3 text-xs font-semibold !text-slate-500 uppercase">E-mail</th>
                    <th className="px-6 py-3 text-xs font-semibold !text-slate-500 uppercase">Telefone</th>
                    <th className="px-6 py-3 text-xs font-semibold !text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold !text-slate-500 uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contatosFiltrados.map((contato) => (
                    <tr key={contato.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium !text-slate-900 dark:!text-white">{contato.nome}</p>
                        <p className="text-xs !text-slate-500">{contato.cargo || 'Sem cargo'}</p>
                      </td>
                      <td className="px-6 py-3 text-sm !text-slate-600 dark:!text-slate-400">{contato.empresa || '-'}</td>
                      <td className="px-6 py-3 text-sm !text-slate-600 dark:!text-slate-400">{contato.email}</td>
                      <td className="px-6 py-3 text-sm !text-slate-600 dark:!text-slate-400">{contato.telefone || '-'}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${contato.status === 'Cliente'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'
                          }`}>
                          {contato.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right space-x-1">
                        <button onClick={() => handleEditar(contato)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"><Pencil size={16} /></button>
                        <button onClick={() => handleDeletar(contato.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* VISÃO MOBILE */}
            <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {contatosFiltrados.map((contato) => (
                <div key={contato.id} className="p-4 flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold !text-slate-900 dark:!text-white">{contato.nome}</h3>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${contato.status === 'Cliente'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'
                      }`}>
                      {contato.status}
                    </span>
                  </div>
                  <p className="text-xs !text-slate-500">{contato.cargo ? `${contato.cargo} na ` : ''}{contato.empresa || 'Sem empresa'}</p>
                  <p className="text-sm !text-slate-600 dark:!text-slate-400 mt-1">{contato.email}</p>
                  <p className="text-sm !text-slate-600 dark:!text-slate-400">{contato.telefone}</p>

                  <div className="flex gap-3 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => handleEditar(contato)} className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-blue-700 font-medium bg-blue-50 dark:bg-blue-500/10 rounded-lg w-1/2"><Pencil size={14} /> Editar</button>
                    <button onClick={() => handleDeletar(contato.id)} className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-red-700 font-medium bg-red-50 dark:bg-red-500/10 rounded-lg w-1/2"><Trash2 size={14} /> Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={contatoEditando ? "Editar Contato" : "Novo Contato"}
        icon={contatoEditando ? <Pencil size={18} /> : <Plus size={18} />}
        size="lg" // <-- Adicione o tamanho
      >
        {/* ... o formulário completo (mantido como estava) ... */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider !text-slate-500 dark:!text-slate-400 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className={labelClass}>Nome Completo</label><input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} required /></div>
              <div><label className={labelClass}>E-mail</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required /></div>
              <div><label className={labelClass}>Telefone</label><input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Cargo</label><input type="text" value={cargo} onChange={(e) => setCargo(e.target.value)} className={inputClass} placeholder="Ex: Gerente" /></div>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider !text-slate-500 dark:!text-slate-400 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">Dados Profissionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className={labelClass}>Empresa</label><input type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} className={inputClass} placeholder="Ex: Google" /></div>
              <div><label className={labelClass}>Endereço</label><input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} className={inputClass} placeholder="Ex: São Paulo - SP" /></div>
              <div><label className={labelClass}>Status</label><select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}><option value="Novo">Novo</option><option value="Em Atendimento">Em Atendimento</option><option value="Cliente">Cliente</option></select></div>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider !text-slate-500 dark:!text-slate-400 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">Anotações</h3>
            <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows="2" className={inputClass} placeholder="Anotações..."></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium !text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:!text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
            <button type="submit" disabled={salvando} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">{salvando ? 'Salvando...' : (contatoEditando ? 'Salvar Alterações' : 'Criar Contato')}</button>
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