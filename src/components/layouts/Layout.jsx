import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout() {
    const { dadosUsuario } = useAuth();
    const [busca, setBusca] = useState('');

    return (
        <div className="flex w-full h-dvh bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header Profissional */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 dark:bg-slate-900 dark:border-slate-800">

                    {/* Busca Global */}
                    <div className="flex-1 max-w-md hidden md:block">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                placeholder="Buscar contatos, negócios... (⌘K)"
                                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                            />
                        </div>
                    </div>

                    {/* Ações do Header */}
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Badge de Status do Firestore */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hidden sm:inline">
                                Firestore Conectado
                            </span>
                        </div>

                        {/* Notificações */}
                        <button className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" aria-label="Notificações">
                            <Bell size={18} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                        </button>

                        {/* Ajuda */}
                        <button className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors hidden sm:block" aria-label="Ajuda">
                            <HelpCircle size={18} />
                        </button>

                        {/* Perfil Rápido */}
                        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                {dadosUsuario?.nome?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                                    {dadosUsuario?.nome || 'Usuário'}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                                    {dadosUsuario?.empresa?.nome || 'Minha Empresa'}
                                </span>
                                
                            </div>
                            
                        </div>
                    </div>
                </header>

                {/* Conteúdo Principal — Padding Responsivo */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}