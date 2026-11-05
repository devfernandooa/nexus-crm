import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase-config';

export default function Layout() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate('/login');
  }

  return (
    <div className="flex w-full h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <aside className="w-64 bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex flex-col transition-colors duration-300">
        <div className="p-6">
          <h1 className="text-2xl font-extrabold tracking-wider text-orange-500">NEXUS</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Gestão inteligente</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link to="/app" className="block px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
            Dashboard
          </Link>
          <Link to="/app/contatos" className="block px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
            Contatos
          </Link>
          <Link to="/app/negocios" className="block px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
            Negócios
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
              {user?.email}
            </p>
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          <button onClick={handleLogout} className="w-full text-left text-sm text-red-500 hover:text-red-600 dark:text-red-400 font-medium">
            Sair da conta
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-colors duration-300"></header>
        <main className="flex-1 overflow-y-auto p-8 w-full">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}