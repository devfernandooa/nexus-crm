import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { escutarNegocios, adicionarNegocio, atualizarNegocio, deletarNegocio } from '@/services/negocioService';
import Modal from '@/components/ui/Modal';
import { Plus, Briefcase, DollarSign, TrendingUp, Search, Pencil, Trash2, ArrowUpRight } from 'lucide-react';

export default function Negocios() {
  const { dadosUsuario } = useAuth();
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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

  async function handleDeletar(id) {
    if (window.confirm("Deseja excluir este negócio?")) {
      await deletarNegocio(id);
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
      setIsModalOpen(false);
    } else {
      alert("Erro ao salvar negócio: " + resultado.erro);
    }
    setSalvando(false);
  }

  // Helper para formatar moeda
  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Negócios</h1>
          <p className="text-sm text-slate-500">Acompanhe suas oportunidades e fechamentos.</p>
        </div>
        <button 
          onClick={abrirModalCriar}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Novo Negócio
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Em Aberto</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatarMoeda(totalAberto)}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg">
              <Briefcase size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Ganhos</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatarMoeda(totalGanho)}</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Perdidos</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatarMoeda(totalPerdido)}</p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-lg">
              <DollarSign size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Negócios */}
      {loading ? (
        <p className="text-slate-500">Carregando negócios...</p>
      ) : negocios.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">Nenhum negócio cadastrado ainda.</p>
          <button onClick={abrirModalCriar} className="text-blue-600 hover:underline">Criar primeiro negócio</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {negocios.map(negocio => (
            <div key={negocio.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group relative">
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  negocio.status === 'Ganho' ? 'bg-emerald-100 text-emerald-800' :
                  negocio.status === 'Perdido' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {negocio.status}
                </span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => handleEditar(negocio)} className="p-1 text-slate-400 hover:text-blue-600"><Pencil size={14} /></button>
                  <button onClick={() => handleDeletar(negocio.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-1 truncate">{negocio.titulo}</h3>
              <p className="text-sm text-slate-500 mb-4 truncate">{negocio.contato || 'Sem contato vinculado'}</p>
              
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-sm font-medium text-slate-500">Valor</span>
                <span className="font-bold text-slate-800 dark:text-white">{formatarMoeda(negocio.valor)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={negocioEditando ? "Editar Negócio" : "Novo Negócio"}
      >
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
    </div>
  );
}