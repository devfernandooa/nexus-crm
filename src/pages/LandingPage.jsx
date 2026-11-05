import { Link } from 'react-router-dom';
import ThemeToggle from '../contexts/ThemeToggle';

export default function LandingPage() {
  return (
    // Fundo branco por padrão, escuro no dark mode
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white">

      {/* Header simples */}
      <header className="flex items-center justify-between px-6 py-6 max-w-6xl mx-auto w-full">
        <Link to="/" className="text-2xl font-extrabold tracking-wider text-blue-600 dark:text-blue-500">
          
        </Link>
<ThemeToggle />
        <div className="flex items-center gap-4">
          
          <Link
            to="/login"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero Section - O centro da página */}
      <main className="flex flex-1 flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto w-full">

        {/* Adicionado text-slate-900 dark:text-white explicitamente */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 !text-slate-900 dark:!text-white">
          Gerencie seus clientes com{' '}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400">
            inteligência.
          </span>
        </h1>

        {/* Adicionado a cor para o subtítulo também */}
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl">
          O CRM completo para a sua equipe vender mais e se organizar melhor. Simples, rápido e feito para você.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/cadastro"
            className="rounded-lg  bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-lg m-5 shadow-blue-600/20 transition-all hover:scale-105 hover:bg-blue-500"
          >
            Criar minha conta
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-slate-300 px-8 py-3 m-5 text-lg font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Fazer Login
          </Link>
        </div>
      </main>

      {/* Rodapé simples */}
      <footer className="py-6 text-center text-sm text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800">
        <p>© {new Date().getFullYear()} Nexus CRM. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}