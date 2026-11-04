import { Link } from 'react-router-dom';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans">

            {/* Header da Landing Page */}
            <header className="flex justify-between items-center p-6 max-w-6xl mx-auto">
                <div className="text-2xl font-bold tracking-wider text-blue-400">NEXUS</div>
                <nav className="flex gap-4">
                    <Link to="/login" className="px-4 py-2 rounded-lg text-slate-300 hover:text-white transition-colors">
                        Entrar
                    </Link>
                    <Link to="/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors">
                        Começar Grátis
                    </Link>
                </nav>
            </header>

            {/* Hero Section */}
            <main className="flex flex-col items-center justify-center text-center px-4 mt-20 max-w-3xl mx-auto">
                <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
                    Gerencie seus clientes com <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">inteligência.</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 mb-10">
                    O CRM completo para a sua equipe vender mais e se organizar melhor. Simples, rápido e feito para você.
                </p>

                <Link
                    to="/login"
                    className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-lg text-lg transition-transform transform hover:scale-105"
                >
                    Criar minha conta agora
                </Link>
            </main>

        </div>
    );
}