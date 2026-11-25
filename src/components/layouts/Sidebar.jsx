import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Users, Briefcase, BarChart3, Settings,
  ChevronDown, ChevronRight, LogOut, UserCircle, CheckSquare, Package, Pencil, Building, Shield
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase-config';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { atualizarPerfilUsuario } from '@/services/usuarioService';
import NotificacoesLeads from '@/components/NotificacoesLeads';

export default function Sidebar({ onClose }) {
  const { user, dadosUsuario, dadosEmpresa } = useAuth();
  const [contatosAberto, setContatosAberto] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isPerfilModalOpen, setIsPerfilModalOpen] = useState(false);
  const [nomePerfil, setNomePerfil] = useState('');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  function abrirModalPerfil() {
    setNomePerfil(dadosUsuario?.nome || '');
    setIsPerfilModalOpen(true);
  }

  async function handleSalvarPerfil(e) {
    e.preventDefault();
    setSalvandoPerfil(true);
    const resultado = await atualizarPerfilUsuario(user.uid, { nome: nomePerfil });
    if (resultado.sucesso) {
      toast.success('Perfil atualizado!');
      setIsPerfilModalOpen(false);
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error('Erro ao atualizar perfil.');
    }
    setSalvandoPerfil(false);
  }

  async function confirmarLogout() {
    await signOut(auth);
    setIsLogoutConfirmOpen(false);
    if (onClose) onClose();
  }

  const linkClass = ({ isActive }) =>
    `group flex items-center px-3 py-2.5 rounded-lg text-[16px] font-medium border transition-all duration-150 ${isActive
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
      : 'border-transparent text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 hover:translate-x-0.5 dark:text-slate-300 dark:hover:bg-slate-800/75 dark:hover:text-white'
    }`;

  const subLinkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-md text-[15px] font-medium transition-all duration-150 ${isActive
      ? 'text-emerald-700 bg-emerald-50/80 dark:text-emerald-300 dark:bg-emerald-500/10'
      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 hover:translate-x-0.5 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
    }`;

  return (
    <>
      <aside className="h-full w-64 lg:w-72 max-w-[85vw] flex-shrink-0 bg-white dark:bg-[#0b192c] border-r border-slate-200/90 dark:border-slate-800/90 flex flex-col text-left select-none">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 px-4 h-16 border-b border-slate-200/80 dark:border-slate-800/90">
          <div className="w-9 h-9 bg-emerald-600 dark:bg-emerald-500 rounded-lg flex items-center justify-center text-white dark:text-slate-950 font-extrabold text-lg shrink-0 shadow-2xs">
            N
          </div>

          <span className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap truncate">
            Nexus <span className="text-emerald-600 dark:text-emerald-400">Hub</span>
          </span>
          <NotificacoesLeads />
        </div>

        {/* Card do Usuário */}
        <div className="px-3.5 py-3 border-b border-slate-200/80 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-900/45">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <UserCircle size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {dadosUsuario?.nome || user?.email?.split('@')[0]}
                </span>
                <span className="text-[12px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                  {user?.email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={abrirModalPerfil}
                className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800"
                title="Editar Perfil"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800"
                title="Sair"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800/80">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Shield size={11} /> {dadosUsuario?.role || 'Admin'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1" title={dadosEmpresa?.nome}>
              <Building size={11} className="shrink-0" /> {dadosEmpresa?.nome || 'Minha Empresa'}
            </span>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto scrollbar-thin">
          <NavLink to="/app" end className={linkClass} onClick={onClose}>
            <LayoutDashboard size={18} className="shrink-0 opacity-85 group-hover:opacity-100" />
            <span className="ml-3 truncate">Dashboard</span>
          </NavLink>

          <NavLink to="/app/relatorios" className={linkClass} onClick={onClose}>
            <BarChart3 size={18} className="shrink-0 opacity-85 group-hover:opacity-100" />
            <span className="ml-3 truncate">Relatórios</span>
          </NavLink>

          {/* Contatos */}
          <div>
            <button
              type="button"
              onClick={() => setContatosAberto((prev) => !prev)}
              className="group w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[16px] font-medium text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 hover:translate-x-0.5 dark:text-slate-300 dark:hover:bg-slate-800/75 dark:hover:text-white transition-all duration-150"
            >
              <div className="flex items-center min-w-0">
                <Users size={18} className="shrink-0 opacity-85 group-hover:opacity-100" />
                <span className="ml-3 truncate">Contatos</span>
              </div>
              {contatosAberto ? (
                <ChevronDown size={16} className="shrink-0 text-slate-400" />
              ) : (
                <ChevronRight size={16} className="shrink-0 text-slate-400" />
              )}
            </button>
            {contatosAberto && (
              <div className="pl-7 pr-1 mt-1 space-y-0.5 border-l border-slate-200 dark:border-slate-800 ml-4">

                <NavLink to="/app/contatos?tipo=leads" className={subLinkClass} onClick={onClose}>
                  Leads
                </NavLink>
                <NavLink to="/app/contatos?tipo=clientes" className={subLinkClass} onClick={onClose}>
                  Clientes
                </NavLink>
              </div>
            )}
          </div>

          {/* Negócios direto (sem submenu) */}
          <NavLink to="/app/negocios" className={linkClass} onClick={onClose}>
            <Briefcase size={18} className="shrink-0 opacity-85 group-hover:opacity-100" />
            <span className="ml-3 truncate">Negócios</span>
          </NavLink>

          <NavLink to="/app/tarefas" className={linkClass} onClick={onClose}>
            <CheckSquare size={18} className="shrink-0 opacity-85 group-hover:opacity-100" />
            <span className="ml-3 truncate">Tarefas</span>
          </NavLink>

          <NavLink to="/app/produtos" className={linkClass} onClick={onClose}>
            <Package size={18} className="shrink-0 opacity-85 group-hover:opacity-100" />
            <span className="ml-3 truncate">Produtos / Serviços</span>
          </NavLink>



          {/* Separador */}
          <div className="pt-3 pb-1.5 border-t border-slate-200/80 dark:border-slate-800/90 mt-3">
            <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Sistema
            </p>
          </div>

          <NavLink to="/app/equipe" className={linkClass} onClick={onClose}>
            <Users size={18} className="shrink-0 opacity-85 group-hover:opacity-100" />
            <span className="ml-3 truncate">Gestão de Equipe</span>
          </NavLink>

          <NavLink to="/app/configuracoes" className={linkClass} onClick={onClose}>
            <Settings size={18} className="shrink-0 opacity-85 group-hover:opacity-100" />
            <span className="ml-3 truncate">Configurações</span>
          </NavLink>

          <NavLink to="/app/ajuda" className={linkClass} onClick={onClose}>
            <UserCircle size={18} className="shrink-0 opacity-85 group-hover:opacity-100" />
            <span className="ml-3 truncate">Central de Ajuda</span>
          </NavLink>
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="px-3 py-2.5 border-t border-slate-200/80 dark:border-slate-800/90 bg-slate-50/40 dark:bg-slate-900/30">
          <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium tracking-wide text-center">
            Versão 1.0 • Pro
          </p>
        </div>
      </aside>

      {/* Modal de Confirmação de Logout */}
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={confirmarLogout}
        title="Sair do Nexus Hub"
        message="Tem certeza que deseja encerrar sua sessão? Você precisará fazer login novamente para acessar o sistema."
        confirmText="Sim, sair"
      />

      {/* Modal de Edição de Perfil */}
      <Modal
        isOpen={isPerfilModalOpen}
        onClose={() => setIsPerfilModalOpen(false)}
        title="Editar Perfil"
        icon={<Pencil size={18} />}
      >
        <form onSubmit={handleSalvarPerfil} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              value={nomePerfil}
              onChange={(e) => setNomePerfil(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              E-mail (Não editável)
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400 cursor-not-allowed"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <button
              type="button"
              onClick={() => setIsPerfilModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvandoPerfil}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-lg font-semibold transition-colors"
            >
              {salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}