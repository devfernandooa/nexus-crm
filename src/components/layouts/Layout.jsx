import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex w-full h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-200 overflow-hidden">
      {/* Overlay escuro para mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Header Mobile */}
        <header className="grid grid-cols-[40px_1fr_40px] items-center px-4 h-16 shrink-0 bg-white dark:bg-[#0b192c] border-b border-slate-200/90 dark:border-slate-800 md:hidden">
          <div aria-hidden="true" className="w-10 h-10" />

          <div className="flex items-center justify-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-600 dark:bg-emerald-500 rounded-lg flex items-center justify-center text-white dark:text-slate-950 font-extrabold text-lg shadow-2xs shrink-0">
              N
            </div>
            <span className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Nexus <span className="text-emerald-600 dark:text-emerald-400">Hub</span>
            </span>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        {/* Área de Conteúdo */}
        <main className="flex-1 min-h-0 w-full overflow-y-auto md:overflow-hidden flex flex-col">
          <Outlet />
        </main>

        {/* Rodapé Mobile-First */}
        <footer className="py-2 shrink-0 text-center text-[11px] text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800 md:hidden">
          Nexus Hub v1.0 • Pro
        </footer>
      </div>
    </div>
  );
}