import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
    LayoutDashboard, Users, Briefcase, BarChart3, Settings,
    ChevronDown, ChevronRight, LogOut, Building2,
    CheckSquare, Package, HelpCircle
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
        if (window.confirm('Deseja realmente sair do sistema?')) {
            await signOut(auth);
        }
    }

    const iniciais = (dadosUsuario?.nome || user?.email || 'U')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    // Fonte reduzida para text-xs
    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isActive
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`;

    const subLinkClass = ({ isActive }) =>
        `block px-3 py-1.5 rounded-lg text-xs transition-colors ${isActive ? 'text-blue-400 bg-slate-800/50 font-medium' : 'text-slate-500 hover:text-white'
        }`;

    return (
        <aside className="w-64 bg-[#0B1120] border-r border-slate-800 flex flex-col h-screen text-slate-300 transition-colors duration-300">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800 overflow-hidden">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-blue-600/30">
                    N
                </div>
                <div className="flex flex-col min-w-0">
                    <h3 className="text-sm font-bold tracking-wide text-white whitespace-nowrap">Nexus CRM</h3>
                    <span className="text-[10px] text-slate-500 font-medium -mt-0.5">v1.0 • Pro</span>
                </div>
            </div>

            {/* Card do Usuário */}
            <div className="px-4 py-4 border-b border-slate-800">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ring-2 ring-slate-800">
                            {iniciais}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-white truncate">
                                {dadosUsuario?.nome || user?.email?.split('@')[0] || 'Usuário'}
                            </span>
                            <div className="flex items-center gap-1">
                                <Building2 size={9} className="text-slate-500 flex-shrink-0" />
                                <span className="text-[10px] text-slate-500 truncate">
                                    {dadosUsuario?.empresa?.nome || 'Admin'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1 hover:bg-red-500/10 rounded-md flex-shrink-0"
                        title="Sair"
                    >
                        <LogOut size={14} />
                    </button>
                </div>
            </div>

            {/* Navegação com fonte menor e mais links */}
            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
                <p className="px-3 text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Principal</p>

                <NavLink to="/app" end className={linkClass}>
                    <LayoutDashboard size={15} /> Dashboard
                </NavLink>

                {/* Contatos */}
                <div>
                    <button
                        onClick={() => toggleSubmenu('contatos')}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <div className="flex items-center gap-3"><Users size={15} /> Contatos</div>
                        {menuAberto === 'contatos' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {menuAberto === 'contatos' && (
                        <div className="pl-9 mt-1 space-y-0.5">
                            <NavLink to="/app/contatos/leads" className={subLinkClass}>Leads</NavLink>
                            <NavLink to="/app/contatos/clientes" className={subLinkClass}>Clientes</NavLink>
                        </div>
                    )}
                </div>

                {/* Negócios */}
                <div>
                    <button
                        onClick={() => toggleSubmenu('negocios')}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <div className="flex items-center gap-3"><Briefcase size={15} /> Negócios</div>
                        {menuAberto === 'negocios' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {menuAberto === 'negocios' && (
                        <div className="pl-9 mt-1 space-y-0.5">
                            <NavLink to="/app/negocios/funil" className={subLinkClass}>Funil de Vendas</NavLink>
                        </div>
                    )}
                </div>

                {/* Tarefas (NOVO) */}
                <NavLink to="/app/tarefas" className={linkClass}>
                    <CheckSquare size={15} /> Tarefas
                </NavLink>

                <p className="px-3 text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 mt-5">Gestão</p>

                {/* Produtos (NOVO) */}
                <NavLink to="/app/produtos" className={linkClass}>
                    <Package size={15} /> Produtos / Serviços
                </NavLink>

                <NavLink to="/app/relatorios" className={linkClass}>
                    <BarChart3 size={15} /> Relatórios
                </NavLink>

                <p className="px-3 text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 mt-5">Sistema</p>

                {/* Configurações */}
                <div>
                    <button
                        onClick={() => toggleSubmenu('configuracoes')}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <div className="flex items-center gap-3"><Settings size={15} /> Configurações</div>
                        {menuAberto === 'configuracoes' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {menuAberto === 'configuracoes' && (
                        <div className="pl-9 mt-1 space-y-0.5">
                            <button onClick={toggleTheme} className="w-full text-left block px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-white hover:bg-slate-800/30 transition-colors">
                                Tema {theme === 'light' ? 'Escuro' : 'Claro'}
                            </button>
                            <NavLink to="/app/configuracoes/equipe" className={subLinkClass}>Equipe</NavLink>
                            <NavLink to="/app/configuracoes/integracoes" className={subLinkClass}>Integrações</NavLink>
                        </div>
                    )}
                </div>

                {/* Ajuda (NOVO) */}
                <NavLink to="/app/ajuda" className={linkClass}>
                    <HelpCircle size={15} /> Central de Ajuda
                </NavLink>
            </nav>
        </aside>
    );
}