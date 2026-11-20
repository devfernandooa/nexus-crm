import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { atualizarEmpresa } from '@/services/empresaService';
import { atualizarPerfilUsuario } from '@/services/usuarioService';
import PageHeader from '@/components/ui/PageHeader';
import toast from 'react-hot-toast';
import { Building, User, Save, Settings, Trash2, Shield, Sun, Moon } from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { auth } from '@/firebase-config';

export default function Configuracoes() {
  const { user, dadosUsuario, dadosEmpresa } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [abaAtiva, setAbaAtiva] = useState('conta');

  // Estados da Conta
  const [nomePerfil, setNomePerfil] = useState('');
  const [emailPerfil] = useState(user?.email || '');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  // Estados da Empresa
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [segmento, setSegmento] = useState('');
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);

  // Estados de Segurança
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  // EFEITO: Preenche os campos quando os dados chegarem do Firestore

  useEffect(() => {
    if (dadosUsuario) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNomePerfil(dadosUsuario.nome || '');
    }
    if (dadosEmpresa) {

      setNomeEmpresa(dadosEmpresa.nome || '');
      setResponsavel(dadosEmpresa.responsavel || '');
      setSegmento(dadosEmpresa.segmento || '');
    }
  }, [dadosUsuario, dadosEmpresa]);

  async function handleSalvarPerfil(e) {
    e.preventDefault();
    setSalvandoPerfil(true);

    const resultadoUser = await atualizarPerfilUsuario(user.uid, { nome: nomePerfil });

    let resultadoEmpresa = { sucesso: true };
    if (dadosUsuario?.role === 'admin' && dadosUsuario?.empresaId) {
      resultadoEmpresa = await atualizarEmpresa(dadosUsuario.empresaId, { responsavel: nomePerfil });
    }

    if (resultadoUser.sucesso && resultadoEmpresa.sucesso) {
      toast.success('Perfil atualizado!');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error('Erro ao atualizar perfil.');
    }
    setSalvandoPerfil(false);
  }

  async function handleSalvarEmpresa(e) {
    e.preventDefault();
    setSalvandoEmpresa(true);
    const resultado = await atualizarEmpresa(dadosUsuario.empresaId, {
      nome: nomeEmpresa,
      responsavel: responsavel,
      segmento: segmento
    });

    if (resultado.sucesso) {
      toast.success('Dados da empresa atualizados!');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error('Erro ao atualizar empresa.');
    }
    setSalvandoEmpresa(false);
  }

  async function handleSalvarSenha(e) {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) {
      return toast.error('As senhas não coincidem.');
    }
    if (novaSenha.length < 6) {
      return toast.error('A senha deve ter pelo menos 6 caracteres.');
    }

    setSalvandoSenha(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, novaSenha);
        toast.success('Senha atualizada com sucesso!');
        setNovaSenha('');
        setConfirmarSenha('');
      }
    } catch {
      toast.error('Erro ao atualizar senha. Talvez seja necessário fazer login novamente.');
    } finally {
      setSalvandoSenha(false);
    }
  }

  const inputClass = "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white";
  const labelClass = "block text-xs font-semibold !text-slate-600 dark:!text-slate-400 mb-1";

  return (
    <div className="w-full h-full flex flex-col max-w-4xl mx-auto">
      <PageHeader
        icon={<Settings size={18} />}
        title="Configurações"
        subtitle="Gerencie sua conta e as informações da empresa."
      />

      {/* Abas */}
      <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg w-full md:w-auto mb-6">
        <button onClick={() => setAbaAtiva('conta')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${abaAtiva === 'conta' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : '!text-slate-500 hover:text-slate-700'}`}>
          <User size={16} /> Conta
        </button>
        <button onClick={() => setAbaAtiva('empresa')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${abaAtiva === 'empresa' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : '!text-slate-500 hover:text-slate-700'}`}>
          <Building size={16} /> Empresa
        </button>
        <button onClick={() => setAbaAtiva('seguranca')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${abaAtiva === 'seguranca' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : '!text-slate-500 hover:text-slate-700'}`}>
          <Shield size={16} /> Segurança
        </button>
        <button onClick={() => setAbaAtiva('preferencias')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${abaAtiva === 'preferencias' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : '!text-slate-500 hover:text-slate-700'}`}>
          <Settings size={16} /> Preferências
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">

        {/* ABA: Minha Conta */}
        {abaAtiva === 'conta' && (
          <form onSubmit={handleSalvarPerfil} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nome Completo</label>
                <input type="text" value={nomePerfil} onChange={(e) => setNomePerfil(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>E-mail (Não editável)</label>
                <input type="email" value={emailPerfil} disabled className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400 cursor-not-allowed" />
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button type="button" className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-2"><Trash2 size={16} /> Excluir Conta</button>
              <button type="submit" disabled={salvandoPerfil} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <Save size={16} /> {salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        )}

        {/* ABA: Empresa */}
        {abaAtiva === 'empresa' && (
          <form onSubmit={handleSalvarEmpresa} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nome da Empresa</label>
                <input type="text" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Nome do Responsável</label>
                <input type="text" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Segmento</label>
                <select value={segmento} onChange={(e) => setSegmento(e.target.value)} className={inputClass}>
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
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button type="button" className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-2"><Trash2 size={16} /> Excluir Empresa</button>
              <button type="submit" disabled={salvandoEmpresa} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <Save size={16} /> {salvandoEmpresa ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        )}

        {/* ABA: Segurança (Alterar Senha) */}
        {abaAtiva === 'seguranca' && (
          <form onSubmit={handleSalvarSenha} className="space-y-4 max-w-md">
            <div>
              <label className={labelClass}>Nova Senha</label>
              <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className={inputClass} required minLength={6} />
            </div>
            <div>
              <label className={labelClass}>Confirmar Nova Senha</label>
              <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} className={inputClass} required minLength={6} />
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button type="submit" disabled={salvandoSenha} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <Save size={16} /> {salvandoSenha ? 'Salvando...' : 'Atualizar Senha'}
              </button>
            </div>
          </form>
        )}

        {/* ABA: Preferências */}
        {abaAtiva === 'preferencias' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold !text-slate-900 dark:!text-white mb-1">Aparência</h3>
              <p className="text-xs !text-slate-500 mb-4">Escolha o tema do sistema.</p>
              <div className="flex gap-4">
                <button onClick={() => toggleTheme()} className={`flex-1 py-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                  <Sun size={24} className={theme === 'light' ? 'text-blue-600' : 'text-slate-400'} />
                  <span className={`text-sm font-medium ${theme === 'light' ? 'text-blue-600' : 'text-slate-600 dark:text-slate-400'}`}>Claro</span>
                </button>
                <button onClick={() => toggleTheme()} className={`flex-1 py-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                  <Moon size={24} className={theme === 'dark' ? 'text-blue-600' : 'text-slate-400'} />
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-600' : 'text-slate-600 dark:text-slate-400'}`}>Escuro</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}