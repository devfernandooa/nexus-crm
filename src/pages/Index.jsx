import { Link } from 'react-router-dom';
import {
    ArrowRight,
    CheckCircle2,
    Kanban,
    Palette,
    ShieldCheck,
    TrendingUp,
    Users,
    BarChart3,
    Layers,
} from 'lucide-react';

const DESTAQUES = [
    {
        icon: Kanban,
        titulo: 'Funil Kanban e Lista',
        descricao:
            'Acompanhe oportunidades em tempo real, alterne entre Kanban e Lista e avance etapas com facilidade.',
    },
    {
        icon: Palette,
        titulo: 'Etapas com Cores Sob Medida',
        descricao:
            'Escolha cores suaves para cada fase do funil, restaure o padrão quando quiser e mantenha tudo organizado.',
    },
    {
        icon: TrendingUp,
        titulo: 'KPIs Claros em Tempo Real',
        descricao:
            'Visualize valores em aberto, ganhos e perdas com leitura rápida e sem poluição visual.',
    },
    {
        icon: Users,
        titulo: 'Multi-tenant e Equipe',
        descricao:
            'Dados isolados por empresa, gestão de equipe, contatos, tarefas e catálogo de produtos integrados.',
    },
    {
        icon: BarChart3,
        titulo: 'Relatórios e Exportação',
        descricao:
            'Acompanhe o desempenho comercial e exporte dados sempre que precisar para análises externas.',
    },
    {
        icon: ShieldCheck,
        titulo: 'Responsivo e Pronto para o Dia a Dia',
        descricao:
            'Interface adaptada para desktop e mobile, com suporte a temas claro e escuro.',
    },
];

export default function Index() {
    return (
        <div className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors duration-200">
            {/* Cabeçalho Superior */}
            <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0b192c]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/90">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    <Link to="/" className="flex items-center gap-2.5 shrink-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold text-lg flex items-center justify-center shadow-xs">
                            N
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                            Nexus Hub
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <a href="#funcionalidades" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                            Funcionalidades
                        </a>
                        <a href="#pipeline" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                            Pipeline
                        </a>
                        <a href="#beneficios" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                            Benefícios
                        </a>
                    </nav>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <Link
                            to="/login"
                            className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80 transition-colors"
                        >
                            Entrar
                        </Link>
                        <Link
                            to="/cadastro"
                            className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 inline-flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                            <span>Começar agora</span>
                            <ArrowRight size={15} />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Conteúdo Principal */}
            <main className="flex-1">
                {/* Hero */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-14 lg:pt-16 lg:pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                        <div className="lg:col-span-6 space-y-5 text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>CRM & Operação Comercial Multi-Tenant</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                                Seu funil de vendas organizado, claro e{' '}
                                <span className="text-emerald-600 dark:text-emerald-400">pronto para crescer</span>.
                            </h1>

                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                                Centralize negócios, contatos, produtos, tarefas e relatórios em uma interface direta,
                                responsiva e adaptável ao estilo da sua empresa.
                            </p>

                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                <Link
                                    to="/cadastro"
                                    className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 inline-flex items-center gap-2 shadow-xs transition-colors"
                                >
                                    <span>Criar conta gratuita</span>
                                    <ArrowRight size={16} />
                                </Link>
                                <Link
                                    to="/app"
                                    className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 transition-colors"
                                >
                                    Acessar workspace
                                </Link>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center gap-1.5">
                                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                                    Funil personalizável
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                                    Modo claro e escuro
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                                    Desktop e mobile
                                </span>
                            </div>
                        </div>

                        {/* Prévia Visual do Pipeline */}
                        <div id="pipeline" className="lg:col-span-6">
                            <div className="rounded-2xl bg-white dark:bg-[#0b192c] border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Layers size={15} className="text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                            Visão Geral do Funil
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                        Tempo real
                                    </span>
                                </div>

                                <div className="p-4 space-y-3">
                                    <div className="grid grid-cols-3 gap-2.5 text-left">
                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Em Aberto
                                            </p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                                                R$ 24.185
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/35 border border-emerald-200/80 dark:border-emerald-800/60">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                                Ganhos
                                            </p>
                                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 tabular-nums mt-1">
                                                R$ 18.400
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Etapas
                                            </p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                                                5 ativas
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                                        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                                            <div className="px-3 py-2 bg-emerald-100/70 dark:bg-emerald-950/70 border-b border-emerald-200/70 dark:border-emerald-800/60">
                                                <p className="text-[11px] font-semibold text-emerald-950 dark:text-emerald-100">
                                                    Prospecção
                                                </p>
                                            </div>
                                            <div className="p-2.5 space-y-2 bg-slate-50/50 dark:bg-slate-900/40">
                                                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                                                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                                        Plano Corporativo
                                                    </p>
                                                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                                                        R$ 6.890,00
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                                            <div className="px-3 py-2 bg-teal-100/70 dark:bg-teal-950/70 border-b border-teal-200/70 dark:border-teal-800/60">
                                                <p className="text-[11px] font-semibold text-teal-950 dark:text-teal-100">
                                                    Negociação
                                                </p>
                                            </div>
                                            <div className="p-2.5 space-y-2 bg-slate-50/50 dark:bg-slate-900/40">
                                                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                                                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                                        Expansão de Equipe
                                                    </p>
                                                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                                                        R$ 11.200,00
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                                            <div className="px-3 py-2 bg-emerald-200/60 dark:bg-emerald-900/60 border-b border-emerald-300/70 dark:border-emerald-700/60">
                                                <p className="text-[11px] font-semibold text-emerald-950 dark:text-emerald-100">
                                                    Fechado
                                                </p>
                                            </div>
                                            <div className="p-2.5 space-y-2 bg-slate-50/50 dark:bg-slate-900/40">
                                                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                                                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                                        Contrato Anual
                                                    </p>
                                                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                                                        R$ 18.400,00
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Funcionalidades */}
                <section id="funcionalidades" className="border-t border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0b192c]/60 py-14">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                        <div className="max-w-2xl text-left space-y-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Funcionalidades
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Tudo o que sua operação comercial precisa sem excessos
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Construído com foco em clareza, velocidade e consistência visual em todas as telas.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {DESTAQUES.map(({ icon: Icon, titulo, descricao }) => (
                                <div
                                    key={titulo}
                                    className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-900/75 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400/70 dark:hover:border-emerald-500/40 transition-colors text-left space-y-2.5"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                                        <Icon size={18} />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{titulo}</h3>
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {descricao}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Chamada Final */}
                <section id="beneficios" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                    <div className="rounded-2xl bg-emerald-600 dark:bg-emerald-500/15 border border-emerald-500/30 dark:border-emerald-500/30 px-6 py-8 sm:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-1.5 text-left">
                            <h2 className="text-xl sm:text-2xl font-bold text-white dark:text-emerald-100">
                                Pronto para padronizar o visual e o fluxo do seu CRM?
                            </h2>
                            <p className="text-sm text-emerald-50/90 dark:text-emerald-200/80">
                                Comece agora mesmo no Nexus Hub e leve o mesmo padrão para todas as páginas.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <Link
                                to="/cadastro"
                                className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                                Criar conta
                            </Link>
                            <Link
                                to="/login"
                                className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-700/60 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 border border-white/20 dark:border-transparent transition-colors"
                            >
                                Fazer login
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Rodapé */}
            <footer className="border-t border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0b192c] py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                        Nexus Hub • Gestão Comercial
                    </span>
                    <span>Versão 1.0 • Tema Claro & Escuro</span>
                </div>
            </footer>
        </div>
    );
}