import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
    LayoutDashboard, Users, Briefcase, BarChart3, Settings,
    ChevronDown, ChevronRight, LogOut, UserCircle
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase-config';

export default function Sidebar() {
    const { user, dadosUsuario } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [menuAberto, setMenuAberto] = useState(null);

    function toggleSubmenu(nomeMenu) {
        setMenuAberto(menuAberto === nomeMenu ? null : nomeMenu);
    }

    async function handleLogout() {
        await signOut(auth);
    }

    // Classes para os links
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

            {/* Logo e Nome - Alinhados e com tamanho controlado */}
            {/* Logo e Nome */}
            <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800 overflow-hidden">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0">
                    N
                </div>
                <h3 className="text-base font-bold tracking-wide text-white whitespace-nowrap truncate">
                    Nexus CRM
                </h3>
            </div>

            {/* Card do Usuário - Mais separado do logo e com margem */}
            <div className="px-4 py-6 border-b border-slate-800">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                            <UserCircle size={20} />
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
                        className="text-slate-500 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                        title="Sair"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Navegação */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto text-amber-950">
                <NavLink to="/app" end className={linkClass}>
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
                            <NavLink to="/app/contatos/leads" className={subLinkClass}>Leads</NavLink>
                            <NavLink to="/app/contatos/clientes" className={subLinkClass}>Clientes</NavLink>
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
                            <NavLink to="/app/negocios/funil" className={subLinkClass}>Funil de Vendas</NavLink>
                        </div>
                    )}
                </div>

                <NavLink to="/app/relatorios" className={linkClass}>
                    <BarChart3 size={18} /> Relatórios
                </NavLink>

                {/* Configurações */}
                <div>
                    <button
                        onClick={() => toggleSubmenu('configuracoes')}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Settings size={18} /> Configurações
                        </div>
                        {menuAberto === 'configuracoes' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {menuAberto === 'configuracoes' && (
                        <div className="pl-10 mt-1 space-y-1">
                            <button onClick={toggleTheme} className="w-full text-left block px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-white transition-colors">
                                Mudar Tema ({theme === 'light' ? 'Escuro' : 'Claro'})
                            </button>
                        </div>
                    )}
                </div>
            </nav>
        </aside>
    );
}