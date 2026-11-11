import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex w-full h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
      
      {/* Overlay escuro para mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>
      
      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Mobile */}
        <header className="h-16 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">N</div>
            <span className="font-bold text-slate-800 dark:text-white">Nexus CRM</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Área de Conteúdo */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}