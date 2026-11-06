import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
    LayoutDashboard, Users, Briefcase, BarChart3, Settings,
<<<<<<< HEAD
    ChevronDown, ChevronRight, LogOut, UserCircle, CheckSquare, Package
=======
    ChevronDown, ChevronRight, LogOut, Building2,
    CheckSquare, Package, HelpCircle
>>>>>>> 20aea7d (feat(ui): refatora telas de autenticação, layout premium e documentação base)
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase-config';

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

<<<<<<< HEAD
    // Classes padrão para os links
=======
    const iniciais = (dadosUsuario?.nome || user?.email || 'U')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    // Fonte reduzida para text-xs
>>>>>>> 20aea7d (feat(ui): refatora telas de autenticação, layout premium e documentação base)
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
<<<<<<< HEAD

            {/* Logo */}
            <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    N
                </div>
                {/* Alterado de h1 para h3 */}
                <h3 className="text-lg font-bold tracking-wide text-white whitespace-nowrap truncate">
                    Nexus CRM
                </h3>
=======
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800 overflow-hidden">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-blue-600/30">
                    N
                </div>
                <div className="flex flex-col min-w-0">
                    <h3 className="text-sm font-bold tracking-wide text-white whitespace-nowrap">Nexus CRM</h3>
                    <span className="text-[10px] text-slate-500 font-medium -mt-0.5">v1.0 • Pro</span>
                </div>
>>>>>>> 20aea7d (feat(ui): refatora telas de autenticação, layout premium e documentação base)
            </div>

            {/* Card do Usuário */}
            <div className="px-4 py-4 border-b border-slate-800">
<<<<<<< HEAD
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                            <UserCircle size={18} />
=======
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ring-2 ring-slate-800">
                            {iniciais}
>>>>>>> 20aea7d (feat(ui): refatora telas de autenticação, layout premium e documentação base)
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
<<<<<<< HEAD
                        className="text-slate-500 hover:text-red-400 transition-colors p-1 shrink-0"
                        title="Sair"
                    >
                        <LogOut size={16} />
=======
                        className="text-slate-500 hover:text-red-400 transition-colors p-1 hover:bg-red-500/10 rounded-md flex-shrink-0"
                        title="Sair"
                    >
                        <LogOut size={14} />
>>>>>>> 20aea7d (feat(ui): refatora telas de autenticação, layout premium e documentação base)
                    </button>
                </div>
            </div>

<<<<<<< HEAD
            {/* Navegação */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
=======
            {/* Navegação com fonte menor e mais links */}
            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
                <p className="px-3 text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Principal</p>

>>>>>>> 20aea7d (feat(ui): refatora telas de autenticação, layout premium e documentação base)
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
<<<<<<< HEAD
                        <div className="pl-10 mt-1 space-y-1">
                            <NavLink to="/app/contatos" className={subLinkClass}>Meus Contatos</NavLink>
                            {/* Exemplo de futuros submenus */}
=======
                        <div className="pl-9 mt-1 space-y-0.5">
>>>>>>> 20aea7d (feat(ui): refatora telas de autenticação, layout premium e documentação base)
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
<<<<<<< HEAD
                        <div className="pl-10 mt-1 space-y-1">
                            <NavLink to="/app/negocios" className={subLinkClass}>Meus Negócios</NavLink>
=======
                        <div className="pl-9 mt-1 space-y-0.5">
                            <NavLink to="/app/negocios/funil" className={subLinkClass}>Funil de Vendas</NavLink>
>>>>>>> 20aea7d (feat(ui): refatora telas de autenticação, layout premium e documentação base)
                        </div>
                    )}
                </div>

<<<<<<< HEAD
                {/* Outros Menus Simples */}
                <NavLink to="/app/tarefas" className={linkClass}>
                    <CheckSquare size={18} /> Tarefas
                </NavLink>
                <NavLink to="/app/produtos" className={linkClass}>
                    <Package size={18} /> Produtos / Serviços
                </NavLink>
                <NavLink to="/app/relatorios" className={linkClass}>
                    <BarChart3 size={18} /> Relatórios
                </NavLink>

                <div className="pt-4 pb-2">
                    <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sistema</p>
                </div>

                {/* Configurações (Link Direto) */}
                <NavLink to="/app/configuracoes" className={linkClass}>
                    <Settings size={18} /> Configurações
                </NavLink>

                <NavLink to="/app/ajuda" className={linkClass}>
                    <UserCircle size={18} /> Central de Ajuda
=======
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
>>>>>>> 20aea7d (feat(ui): refatora telas de autenticação, layout premium e documentação base)
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