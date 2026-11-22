import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
  const [emailPerfil, setEmailPerfil] = useState('');
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

  useEffect(() => {
    if (user?.email) {
      setEmailPerfil(user.email);
    }
    if (dadosUsuario) {
      setNomePerfil(dadosUsuario.nome || '');
    }
    if (dadosEmpresa) {
      setNomeEmpresa(dadosEmpresa.nome || '');
      setResponsavel(dadosEmpresa.responsavel || '');
      setSegmento(dadosEmpresa.segmento || '');
    }
  }, [user, dadosUsuario, dadosEmpresa]);

  async function handleSalvarPerfil(e) {
    e.preventDefault();
    if (!user?.uid) return;
    setSalvandoPerfil(true);

    const resultadoUser = await atualizarPerfilUsuario(user.uid, { nome: nomePerfil.trim() });

    let resultadoEmpresa = { sucesso: true };
    if (dadosUsuario?.role === 'admin' && dadosUsuario?.empresaId) {
      resultadoEmpresa = await atualizarEmpresa(dadosUsuario.empresaId, {
        responsavel: nomePerfil.trim(),
      });
    }

    if (resultadoUser.sucesso && resultadoEmpresa.sucesso) {
      toast.success('Perfil atualizado!');
    } else {
      toast.error('Erro ao atualizar perfil.');
    }
    setSalvandoPerfil(false);
  }

  async function handleSalvarEmpresa(e) {
    e.preventDefault();
    if (!dadosUsuario?.empresaId) return;
    setSalvandoEmpresa(true);

    const resultado = await atualizarEmpresa(dadosUsuario.empresaId, {
      nome: nomeEmpresa.trim(),
      responsavel: responsavel.trim(),
      segmento,
    });

    if (resultado.sucesso) {
      toast.success('Dados da empresa atualizados!');
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

  function handleSelecionarTema(temaDesejado) {
    if (theme !== temaDesejado) {
      toggleTheme();
    }
  }

  const containerClass =
    'w-full max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:overflow-y-auto max-md:overscroll-y-contain md:min-h-full md:h-auto md:overflow-visible overflow-x-hidden touch-pan-y flex flex-col px-4 sm:px-6 lg:px-7 py-4 sm:py-5 pb-28 md:pb-8 bg-slate-50/60 dark:bg-slate-950 transition-colors text-left space-y-4';

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all';

  const labelClass =
    'block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1';

  const btnPrimaryClass =
    'bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-2xs';

  const abas = [
    { id: 'conta', label: 'Conta', icon: <User size={15} /> },
    { id: 'empresa', label: 'Empresa', icon: <Building size={15} /> },
    { id: 'seguranca', label: 'Segurança', icon: <Shield size={15} /> },
    { id: 'preferencias', label: 'Preferências', icon: <Settings size={15} /> },
  ];

  return (
    <div className={containerClass}>
      <PageHeader
        icon={<Settings size={18} />}
        title="Configurações"
        subtitle="Gerencie sua conta, informações da empresa e preferências do sistema."
      />

      {/* Abas */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 bg-slate-100 dark:bg-[#0b192c] border border-slate-200/80 dark:border-slate-800 p-1 rounded-xl w-full md:w-fit shrink-0">
        {abas.map((aba) => {
          const ativa = abaAtiva === aba.id;
          return (
            <button
              key={aba.id}
              type="button"
              onClick={() => setAbaAtiva(aba.id)}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${ativa
                  ? 'bg-white dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-2xs border border-emerald-200/70 dark:border-emerald-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              {aba.icon} {aba.label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo da Aba */}
      <div className="bg-white dark:bg-[#0b192c] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-2xs shrink-0">
        {/* ABA: Conta */}
        {abaAtiva === 'conta' && (
          <form onSubmit={handleSalvarPerfil} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nome Completo</label>
                <input
                  type="text"
                  value={nomePerfil}
                  onChange={(e) => setNomePerfil(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>E-mail (Não editável)</label>
                <input
                  type="email"
                  value={emailPerfil}
                  disabled
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button
                type="button"
                onClick={() =>
                  toast('Para excluir a conta definitivamente, entre em contato com o suporte.')
                }
                className="text-red-600 hover:text-red-500 dark:text-red-400 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 size={15} /> Excluir Conta
              </button>
              <button type="submit" disabled={salvandoPerfil} className={btnPrimaryClass}>
                <Save size={15} /> {salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}
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
                <input
                  type="text"
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Nome do Responsável</label>
                <input
                  type="text"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Segmento</label>
                <select
                  value={segmento}
                  onChange={(e) => setSegmento(e.target.value)}
                  className={inputClass}
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

            <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button
                type="button"
                onClick={() =>
                  toast('A exclusão da empresa deve ser confirmada pelo administrador principal.')
                }
                className="text-red-600 hover:text-red-500 dark:text-red-400 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 size={15} /> Excluir Empresa
              </button>
              <button type="submit" disabled={salvandoEmpresa} className={btnPrimaryClass}>
                <Save size={15} /> {salvandoEmpresa ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        )}

        {/* ABA: Segurança */}
        {abaAtiva === 'seguranca' && (
          <form onSubmit={handleSalvarSenha} className="space-y-4 max-w-md">
            <div>
              <label className={labelClass}>Nova Senha</label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className={inputClass}
                required
                minLength={6}
                placeholder="Mínimo de 6 caracteres"
              />
            </div>
            <div>
              <label className={labelClass}>Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className={inputClass}
                required
                minLength={6}
                placeholder="Repita a nova senha"
              />
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button type="submit" disabled={salvandoSenha} className={btnPrimaryClass}>
                <Save size={15} /> {salvandoSenha ? 'Salvando...' : 'Atualizar Senha'}
              </button>
            </div>
          </form>
        )}

        {/* ABA: Preferências */}
        {abaAtiva === 'preferencias' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Aparência
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Escolha o tema do sistema.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-lg">
                <button
                  type="button"
                  onClick={() => handleSelecionarTema('light')}
                  className={`py-3.5 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${theme === 'light'
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 text-slate-600 dark:text-slate-400'
                    }`}
                >
                  <Sun
                    size={22}
                    className={
                      theme === 'light'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'
                    }
                  />
                  <span className="text-xs sm:text-sm font-semibold">Claro</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelecionarTema('dark')}
                  className={`py-3.5 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${theme === 'dark'
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 text-slate-600 dark:text-slate-400'
                    }`}
                >
                  <Moon
                    size={22}
                    className={
                      theme === 'dark'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'
                    }
                  />
                  <span className="text-xs sm:text-sm font-semibold">Escuro</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}