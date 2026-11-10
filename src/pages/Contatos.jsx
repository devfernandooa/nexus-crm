import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { escutarContatos, adicionarContato, atualizarContato, deletarContato } from '@/services/contatoService';
import Modal from '@/components/ui/Modal';
import { Plus, Search, Users, Pencil, Trash2 } from 'lucide-react'; // Novos ícones

export default function Contatos() {
  const { dadosUsuario } = useAuth();
  const [contatos, setContatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados do Formulário
  const [contatoEditando, setContatoEditando] = useState(null); // Se for null, estamos criando. Se tiver ID, estamos editando.
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
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

  // Abre o modal para criar
  function abrirModalCriar() {
    setContatoEditando(null);
    setNome(''); setEmail(''); setTelefone(''); setStatus('Novo');
    setIsModalOpen(true);
  }

  // Abre o modal para editar
  function handleEditar(contato) {
    setContatoEditando(contato.id);
    setNome(contato.nome);
    setEmail(contato.email);
    setTelefone(contato.telefone || '');
    setStatus(contato.status || 'Novo');
    setIsModalOpen(true);
  }

  // Excluir contato
  async function handleDeletar(id) {
    if (window.confirm("Tem certeza que deseja excluir este contato?")) {
      const resultado = await deletarContato(id);
      if (!resultado.sucesso) alert("Erro ao excluir: " + resultado.erro);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSalvando(true);
    
    const dados = { nome, email, telefone, status };

    let resultado;
    if (contatoEditando) {
      // Se tem ID, estamos editando
      resultado = await atualizarContato(contatoEditando, dados);
    } else {
      // Se não tem ID, estamos criando
      resultado = await adicionarContato(dados, dadosUsuario.empresaId);
    }

    if (resultado.sucesso) {
      setIsModalOpen(false);
    } else {
      alert("Erro ao salvar contato: " + resultado.erro);
    }
    setSalvando(false);
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Contatos</h1>
          <p className="text-sm text-slate-500">Gerencie os leads e clientes da sua empresa.</p>
        </div>
        <button 
          onClick={abrirModalCriar}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Novo Contato
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar contatos..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando contatos...</div>
        ) : contatos.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-blue-500 mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Nenhum contato ainda</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">Comece adicionando seu primeiro contato para gerenciar seus relacionamentos e oportunidades.</p>
            <button 
              onClick={abrirModalCriar}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus size={18} /> Adicionar Contato
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">E-mail</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Telefone</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contatos.map((contato) => (
                <tr key={contato.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-200">{contato.nome}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{contato.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{contato.telefone}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">
                      {contato.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEditar(contato)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDeletar(contato.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={contatoEditando ? "Editar Contato" : "Adicionar Novo Contato"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
            <input 
              type="text" 
              value={nome} onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
            <input 
              type="email" 
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
            <input 
              type="text" 
              value={telefone} onChange={(e) => setTelefone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <select 
              value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <option value="Novo">Novo</option>
              <option value="Em Atendimento">Em Atendimento</option>
              <option value="Cliente">Cliente</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={salvando}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              {salvando ? 'Salvando...' : (contatoEditando ? 'Atualizar Contato' : 'Salvar Contato')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}