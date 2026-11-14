import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { escutarContatos, adicionarContato, atualizarContato, deletarContato } from '@/services/contatoService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PageHeader from '@/components/ui/PageHeader';
import toast from 'react-hot-toast';
import { Plus, Search, Users, Pencil, Trash2 } from 'lucide-react';


export default function Contatos() {
  const { dadosUsuario } = useAuth();
  const [contatos, setContatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [idParaDeletar, setIdParaDeletar] = useState(null);
  const [busca, setBusca] = useState('');

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

  useEffect(() => {
    if (!dadosUsuario?.empresaId) return;
    const unsubscribe = escutarContatos(dadosUsuario.empresaId, (lista) => {
      setContatos(lista);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [dadosUsuario?.empresaId]);

  const contatosFiltrados = contatos.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.email.toLowerCase().includes(busca.toLowerCase())
  );

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
  // Classes padronizadas para todos os inputs e selects
  const inputBaseClass = "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors";
  const labelClass = "block text-[11px] font-semibold !text-slate-600 dark:!text-slate-400 mb-1.5";
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

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col flex-1">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar contatos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center !text-slate-500">Carregando contatos...</div>
        ) : contatosFiltrados.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center flex-1">
            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-blue-500 mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold !text-slate-900 dark:!text-white mb-2">Nenhum contato encontrado</h3>
            <p className="!text-slate-500 mb-6 max-w-md">Comece adicionando seu primeiro contato para gerenciar seus relacionamentos.</p>
            <button onClick={abrirModalCriar} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
              <Plus size={18} /> Adicionar Contato
            </button>
          </div>
        ) : (
          <>
            {/* VISÃO DESKTOP */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-3 text-xs font-semibold !text-slate-500 uppercase">Nome / Cargo</th>
                    <th className="px-6 py-3 text-xs font-semibold !text-slate-500 uppercase">Empresa</th>
                    <th className="px-6 py-3 text-xs font-semibold !text-slate-500 uppercase">E-mail</th>
                    <th className="px-6 py-3 text-xs font-semibold !text-slate-500 uppercase">Telefone</th>
                    <th className="px-6 py-3 text-xs font-semibold !text-slate-500 uppercase whitespace-nowrap">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold !text-slate-500 uppercase text-right pr-6">Ações</th>
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 whitespace-nowrap">
                          {contato.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right space-x-1 pr-6">
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
                    <span className="text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded-full">{contato.status}</span>
                  </div>
                  <p className="text-xs !text-slate-500">{contato.cargo ? `${contato.cargo} na ` : ''}{contato.empresa || 'Sem empresa'}</p>
                  <p className="text-sm !text-slate-600 dark:!text-slate-400 mt-1">{contato.email}</p>
                  <p className="text-sm !text-slate-600 dark:!text-slate-400">{contato.telefone}</p>

                  <div className="flex justify-end gap-3 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => handleEditar(contato)} className="flex items-center gap-1 text-xs text-blue-600 font-medium"><Pencil size={14} /> Editar</button>
                    <button onClick={() => handleDeletar(contato.id)} className="flex items-center gap-1 text-xs text-red-600 font-medium"><Trash2 size={14} /> Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Otimizado */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={contatoEditando ? "Editar Contato" : "Novo Contato"}
        icon={contatoEditando ? <Pencil size={18} /> : <Plus size={18} />}
      >
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* SEÇÃO 1: Dados Pessoais */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider !text-slate-500 dark:!text-slate-400 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
              Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Nome Completo</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className={inputBaseClass} required />
              </div>
              <div>
                <label className={labelClass}>E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputBaseClass} required />
              </div>
              <div>
                <label className={labelClass}>Cargo</label>
                <input type="text" value={cargo} onChange={(e) => setCargo(e.target.value)} className={inputBaseClass} placeholder="Ex: Gerente" />
              </div>
              <div className="md:col-span-1">
                <label className={labelClass}>Telefone</label>
                <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} className={inputBaseClass} />
              </div>
              {/* 
                Os campos abaixo estão vazios e podem ser preenchidos se você adicionar
                mais inputs no futuro (ex: Data de Nascimento, LinkedIn).
                Deixei o espaço para manter a simetria.
              */}
            </div>
          </div>

          {/* SEÇÃO 2: Dados Profissionais */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider !text-slate-500 dark:!text-slate-400 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
              Dados Profissionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Empresa (Onde trabalha)</label>
                <input type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} className={inputBaseClass} placeholder="Ex: Google" />
              </div>
              <div>
                <label className={labelClass}>Endereço</label>
                <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} className={inputBaseClass} placeholder="Ex: São Paulo - SP" />
              </div>
              <div>
                <label className={labelClass}>Status do Contato</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputBaseClass}>
                  <option value="Novo">Novo</option>
                  <option value="Em Atendimento">Em Atendimento</option>
                  <option value="Cliente">Cliente</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: Anotações */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider !text-slate-500 dark:!text-slate-400 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
              Anotações
            </h3>
            <div>
              <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows="3" className={inputBaseClass} placeholder="Informações adicionais, preferências, histórico..."></textarea>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium !text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:!text-slate-300 dark:hover:bg-slate-800">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-sm">
              {salvando ? 'Salvando...' : (contatoEditando ? 'Salvar Alterações' : 'Criar Contato')}
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