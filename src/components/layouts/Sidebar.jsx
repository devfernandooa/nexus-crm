import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LayoutDashboard, Users, Briefcase, BarChart3, Settings,
  ChevronDown, ChevronRight, LogOut, UserCircle, CheckSquare, Package
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase-config';

export default function Sidebar({ onClose }) {
  const { user, dadosUsuario } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuAberto, setMenuAberto] = useState(null);

  function toggleSubmenu(nomeMenu) {
    setMenuAberto(menuAberto === nomeMenu ? null : nomeMenu);
  }

  async function handleLogout() {
    await signOut(auth);
    if (onClose) onClose();
  }

  // Classes padrão para os links
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
      ? 'bg-blue-600 text-white'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;

  const subLinkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'text-blue-400 bg-slate-800/50' : 'text-slate-500 hover:text-white'
    }`;

  return (
    <aside className="w-64 bg-[#0B1120] border-r border-slate-800 flex flex-col h-screen text-slate-300 transition-colors duration-300">

      {/* Logo (Versão final) */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          N
        </div>
        <h3 className="text-lg font-bold tracking-wide text-white whitespace-nowrap truncate">
          Nexus CRM
        </h3>
      </div>

      {/* Card do Usuário */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <UserCircle size={18} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate">
                {user?.email?.split('@')[0]}
              </span>
              <span className="text-xs text-slate-500 capitalize">
                {dadosUsuario?.role || 'Admin'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-400 transition-colors p-1 shrink-0"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavLink to="/app" end className={linkClass} onClick={onClose}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>

        {/* Contatos */}
        <div>
          <button
            onClick={() => toggleSubmenu('contatos')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users size={18} /> Contatos
            </div>
            {menuAberto === 'contatos' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {menuAberto === 'contatos' && (
            <div className="pl-10 mt-1 space-y-1">
              <NavLink to="/app/contatos" className={subLinkClass} onClick={onClose}>Meus Contatos</NavLink>
              <NavLink to="/app/contatos/leads" className={subLinkClass} onClick={onClose}>Leads</NavLink>
              <NavLink to="/app/contatos/clientes" className={subLinkClass} onClick={onClose}>Clientes</NavLink>
            </div>
          )}
        </div>

        {/* Negócios */}
        <div>
          <button
            onClick={() => toggleSubmenu('negocios')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <Briefcase size={18} /> Negócios
            </div>
            {menuAberto === 'negocios' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {menuAberto === 'negocios' && (
            <div className="pl-10 mt-1 space-y-1">
              <NavLink to="/app/negocios" className={subLinkClass} onClick={onClose}>Meus Negócios</NavLink>
            </div>
          )}
        </div>

        {/* Outros Menus Simples */}
        <NavLink to="/app/tarefas" className={linkClass} onClick={onClose}>
          <CheckSquare size={18} /> Tarefas
        </NavLink>
        <NavLink to="/app/produtos" className={linkClass} onClick={onClose}>
          <Package size={18} /> Produtos / Serviços
        </NavLink>
        <NavLink to="/app/relatorios" className={linkClass} onClick={onClose}>
          <BarChart3 size={18} /> Relatórios
        </NavLink>

        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sistema</p>
        </div>
        <NavLink to="/app/equipe" className={linkClass} onClick={onClose}>
          <Users size={18} /> Gestão de Equipe
        </NavLink>
        {/* Configurações (Link Direto) */}
        <NavLink to="/app/configuracoes" className={linkClass} onClick={onClose}>
          <Settings size={18} /> Configurações
        </NavLink>

        <NavLink to="/app/ajuda" className={linkClass} onClick={onClose}>
          <UserCircle size={18} /> Central de Ajuda
        </NavLink>
      </nav>

      {/* Rodapé da Sidebar - Versão */}
      <div className="p-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center font-medium tracking-wide">
          Versão 1.0 • Pro
        </p>
      </div>

    </aside>
  );
}