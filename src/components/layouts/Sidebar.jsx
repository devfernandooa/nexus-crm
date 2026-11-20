import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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


export default function Sidebar({ onClose }) {
  const { user, dadosUsuario, dadosEmpresa } = useAuth();
  const [menuAberto, setMenuAberto] = useState(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isPerfilModalOpen, setIsPerfilModalOpen] = useState(false);
  const [nomePerfil, setNomePerfil] = useState('');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  function toggleSubmenu(nomeMenu) {
    setMenuAberto(menuAberto === nomeMenu ? null : nomeMenu);
  }

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

  // Classes adaptadas do código de referência
  const linkClass = ({ isActive }) =>
    `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
      ? 'bg-blue-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
    }`;

  const subLinkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-lg text-sm transition-colors ${isActive
      ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10'
      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
    }`;

  return (
    <>
      <aside className="w-64 bg-white dark:bg-[#0B1120] border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen transition-colors duration-300">

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0">
            N
          </div>
          <h3 className="text-lg font-bold tracking-wide text-slate-900 dark:text-white whitespace-nowrap truncate">
            Nexus CRM
          </h3>
        </div>

        {/* Card do Usuário */}
        <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between gap-2">

            {/* Informações */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <UserCircle size={22} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {dadosUsuario?.nome || user?.email?.split('@')[0]}
                </span>
                <span className="text-xs text-slate-500 truncate">
                  {user?.email}
                </span>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={abrirModalPerfil} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Editar Perfil">
                <Pencil size={14} />
              </button>
              <button onClick={() => setIsLogoutConfirmOpen(true)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Sair">
                <LogOut size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200 dark:border-slate-800/50">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <Shield size={10} /> {dadosUsuario?.role || 'Admin'}
            </span>
            <span className="text-[10px] text-slate-500 truncate flex items-center gap-1">
              <Building size={10} /> {dadosEmpresa?.nome || 'Minha Empresa'}
            </span>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

          {/* Dashboard */}
          <NavLink to="/app" end className={linkClass} onClick={onClose}>
            <LayoutDashboard size={18} className="shrink-0" />
            <span className="ml-3">Dashboard</span>
          </NavLink>

          {/* Contatos (Com submenu) */}
          <div>
            <button
              onClick={() => toggleSubmenu('contatos')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center">
                <Users size={18} className="shrink-0" />
                <span className="ml-3">Contatos</span>
              </div>
              {menuAberto === 'contatos' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {menuAberto === 'contatos' && (
              <div className="pl-10 mt-1 space-y-1">
                <NavLink to="/app/contatos" className={subLinkClass} onClick={onClose}>Meus Contatos</NavLink>
                <NavLink to="/app/contatos?tipo=leads" className={subLinkClass} onClick={onClose}>Leads</NavLink>
                <NavLink to="/app/contatos?tipo=clientes" className={subLinkClass} onClick={onClose}>Clientes</NavLink>
              </div>
            )}
          </div>

          {/* Negócios (Com submenu) */}
          <div>
            <button
              onClick={() => toggleSubmenu('negocios')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center">
                <Briefcase size={18} className="shrink-0" />
                <span className="ml-3">Negócios</span>
              </div>
              {menuAberto === 'negocios' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {menuAberto === 'negocios' && (
              <div className="pl-10 mt-1 space-y-1">
                <NavLink to="/app/negocios" className={subLinkClass} onClick={onClose}>Meus Negócios</NavLink>
              </div>
            )}
          </div>

          {/* Tarefas */}
          <NavLink to="/app/tarefas" className={linkClass} onClick={onClose}>
            <CheckSquare size={18} className="shrink-0" />
            <span className="ml-3">Tarefas</span>
          </NavLink>

          {/* Produtos */}
          <NavLink to="/app/produtos" className={linkClass} onClick={onClose}>
            <Package size={18} className="shrink-0" />
            <span className="ml-3">Produtos / Serviços</span>
          </NavLink>

          {/* Relatórios */}
          <NavLink to="/app/relatorios" className={linkClass} onClick={onClose}>
            <BarChart3 size={18} className="shrink-0" />
            <span className="ml-3">Relatórios</span>
          </NavLink>

          {/* Separador */}
          <div className="pt-4 pb-2 border-t border-slate-200 dark:border-slate-800 mt-4">
            <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sistema</p>
          </div>

          {/* Gestão de Equipe */}
          <NavLink to="/app/equipe" className={linkClass} onClick={onClose}>
            <Users size={18} className="shrink-0" />
            <span className="ml-3">Gestão de Equipe</span>
          </NavLink>

          {/* Configurações */}
          <NavLink to="/app/configuracoes" className={linkClass} onClick={onClose}>
            <Settings size={18} className="shrink-0" />
            <span className="ml-3">Configurações</span>
          </NavLink>

          {/* Central de Ajuda */}
          <NavLink to="/app/ajuda" className={linkClass} onClick={onClose}>
            <UserCircle size={18} className="shrink-0" />
            <span className="ml-3">Central de Ajuda</span>
          </NavLink>
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide text-center">
            Versão 1.0 • Pro
          </p>
        </div>
      </aside>

      {/* Modal de Confirmação de Logout */}
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={confirmarLogout}
        title="Sair do Nexus"
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
            <label className="block text-xs font-semibold !text-slate-600 dark:!text-slate-400 mb-1">Nome Completo</label>
            <input
              type="text"
              value={nomePerfil}
              onChange={(e) => setNomePerfil(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold !text-slate-600 dark:!text-slate-400 mb-1">E-mail (Não editável)</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400 cursor-not-allowed"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <button type="button" onClick={() => setIsPerfilModalOpen(false)} className="px-4 py-2 text-sm font-medium !text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:!text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
            <button type="submit" disabled={salvandoPerfil} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
              {salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}