import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { atualizarEmpresa } from '@/services/empresaService';
import { Building, User, Briefcase, Save } from 'lucide-react';

export default function Configuracoes() {
  const { dadosUsuario } = useAuth();
  
  // Estados do Formulário
  const [nomeEmpresa, setNomeEmpresa] = useState(dadosUsuario?.nomeEmpresa || '');
  const [responsavel, setResponsavel] = useState(dadosUsuario?.nome || '');
  const [segmento, setSegmento] = useState(dadosUsuario?.segmento || '');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSalvando(true);
    setMensagem('');

    const resultado = await atualizarEmpresa(dadosUsuario.empresaId, {
      nome: nomeEmpresa,
      responsavel: responsavel,
      segmento: segmento
    });

    if (resultado.sucesso) {
      setMensagem('Configurações salvas com sucesso!');
      // Recarrega a página para atualizar o AuthContext (MVP)
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setMensagem('Erro ao salvar as configurações.');
    }
    setSalvando(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações</h1>
        <p className="text-slate-500">Gerencie as informações da sua empresa.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nome da Empresa</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={nomeEmpresa} 
                onChange={(e) => setNomeEmpresa(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nome do Responsável</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={responsavel} 
                onChange={(e) => setResponsavel(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Segmento</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                value={segmento} 
                onChange={(e) => setSegmento(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <option value="">Selecione...</option>
                <option value="Tecnologia">Tecnologia</option>
                <option value="Varejo">Varejo</option>
                <option value="Serviços">Serviços</option>
                <option value="Saúde">Saúde</option>
                <option value="Educação">Educação</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          {mensagem && (
            <div className={`p-3 rounded-lg text-sm ${mensagem.includes('sucesso') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {mensagem}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="submit" 
              disabled={salvando}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Save size={18} /> {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}