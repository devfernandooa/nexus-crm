import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '../../contexts/ThemeToggle';

export default function AuthLayout({ children, leftTitle, leftDescription, linkText, linkTo }) {
    const { pathname } = useLocation();
    const prevPathRef = useRef(pathname);

    // Determina o sentido da transição entre /login e /cadastro
    const direcao = pathname === '/cadastro' ? 'to-register' : 'to-login';

    useEffect(() => {
        prevPathRef.current = pathname;
    }, [pathname]);

    return (
        <div className="relative h-screen w-full overflow-y-auto flex items-center justify-center bg-[#e7efe9] dark:bg-[#050b14] p-4 sm:p-6 font-sans transition-colors duration-300">
            {/* Plano de Fundo Rico em Camadas (Tema Claro & Escuro) */}
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
                {/* Base gradiente */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.16),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(13,148,136,0.14),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.18),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(5,150,105,0.12),transparent_55%)]" />

                {/* Malha geométrica sutil */}
                <div
                    className="absolute inset-0 opacity-55 dark:opacity-20"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, rgba(16, 185, 129, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.08) 1px, transparent 1px)',
                        backgroundSize: '44px 44px',
                    }}
                />

                {/* Orbes de luz ambiente com movimento suave */}
                <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-emerald-400/20 dark:bg-emerald-500/12 blur-3xl animate-pulse" style={{ animationDuration: '7s' }} />
                <div className="absolute -bottom-28 -right-20 w-[26rem] h-[26rem] rounded-full bg-teal-500/15 dark:bg-emerald-400/10 blur-3xl animate-pulse" style={{ animationDuration: '9s' }} />
            </div>

            <style>{`
                @keyframes slideFromRight {
                    0% {
                        opacity: 0;
                        transform: translateX(22px) translateY(4px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0) translateY(0);
                    }
                }
                @keyframes slideFromLeft {
                    0% {
                        opacity: 0;
                        transform: translateX(-22px) translateY(4px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0) translateY(0);
                    }
                }
                @keyframes panelCrossfade {
                    0% {
                        opacity: 0.35;
                        transform: scale(0.985);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .auth-anim-to-register {
                    animation: slideFromRight 0.36s cubic-bezier(0.22, 1, 0.36, 1) both;
                }
                .auth-anim-to-login {
                    animation: slideFromLeft 0.36s cubic-bezier(0.22, 1, 0.36, 1) both;
                }
                .auth-panel-enter {
                    animation: panelCrossfade 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
                }
            `}</style>

            {/* Container Principal com altura fixa idêntica no desktop para Login e Cadastro */}
            <div className="relative z-10 flex w-full max-w-5xl md:h-[650px] flex-col md:flex-row overflow-hidden rounded-2xl shadow-2xl bg-white/95 dark:bg-[#0b192c]/95 backdrop-blur-xs border border-slate-200/90 dark:border-slate-800/90 transition-colors duration-300">
                {/* Lado Esquerdo (Desktop) */}
                <div className="relative hidden w-1/2 h-full flex-col justify-center items-center bg-linear-to-br from-emerald-800 via-[#0b192c] to-[#060e19] p-10 text-center md:flex border-r border-slate-800/80 shrink-0">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-20 -left-20 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl"
                    />

                    {/* Logo no canto superior esquerdo */}
                    <Link
                        to="/"
                        className="absolute top-6 left-6 flex items-center gap-2.5 text-white font-bold text-lg group"
                    >
                        <div className="w-8 h-8 bg-emerald-500 text-slate-950 rounded-xl flex items-center justify-center text-sm font-extrabold shadow-xs transition-transform duration-200 group-hover:scale-105">
                            N
                        </div>
                        <span className="tracking-tight">Nexus Hub</span>
                    </Link>

                    <div
                        key={`left-${pathname}`}
                        className="relative z-10 flex flex-col items-center auth-panel-enter"
                    >
                        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
                            {leftTitle}
                        </h2>
                        <p className="text-slate-300/90 mb-8 text-sm max-w-xs leading-relaxed">
                            {leftDescription}
                        </p>

                        <Link
                            to={linkTo}
                            className="px-6 py-2.5 rounded-lg border border-emerald-400/50 bg-emerald-500/15 text-emerald-200 text-sm font-semibold hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-500 transition-all duration-200"
                        >
                            {linkText}
                        </Link>
                    </div>
                </div>

                {/* Lado Direito (Formulário) */}
                <div className="flex w-full md:w-1/2 md:h-full flex-col justify-between p-6 sm:p-8 overflow-y-auto scrollbar-thin">
                    {/* Topo do Formulário */}
                    <div className="flex items-center justify-between gap-2 mb-4 shrink-0">
                        <Link
                            to="/"
                            className="text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 flex items-center gap-1.5 text-xs font-medium w-max transition-colors"
                        >
                            <ArrowLeft size={14} /> Voltar para o site
                        </Link>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 md:hidden">
                                <div className="w-6 h-6 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 rounded-lg flex items-center justify-center text-xs font-bold">
                                    N
                                </div>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    Nexus Hub
                                </span>
                            </div>

                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors [&_button]:!w-9 [&_button]:!h-9 [&_button]:!rounded-full [&_button]:!border-0 [&_button]:!bg-transparent [&_button]:!shadow-none [&_button]:!p-0 [&_button]:flex [&_button]:items-center [&_button]:justify-center"
                                title="Alternar tema claro/escuro"
                            >
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>

                    {/* Conteúdo (Login / Cadastro) com animação direcional */}
                    <div
                        key={`right-${pathname}`}
                        className={`my-auto ${direcao === 'to-register' ? 'auth-anim-to-register' : 'auth-anim-to-login'
                            }`}
                    >
                        {children}
                    </div>

                    {/* Atalho Mobile para alternar entre Login e Cadastro */}
                    <div className="mt-5 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-center md:hidden shrink-0">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {leftDescription}{' '}
                            <Link
                                to={linkTo}
                                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                                {linkText}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}