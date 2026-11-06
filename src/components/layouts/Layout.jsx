import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    return (
        <div className="flex w-full h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header Limpo, só com um badge de status */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-8 gap-4 dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Firestore Conectado</span>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="flex-1 overflow-y-auto p-8 w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}