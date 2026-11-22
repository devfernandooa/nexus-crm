import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase-config';
import AuthLayout from '../components/layouts/AuthLayout';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import ModalRecuperarSenha from '@/components/ui/ModalRecuperarSenha';

export default function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [isModalRecuperarOpen, setIsModalRecuperarOpen] = useState(false);


    async function handleSubmit(e) {
        e.preventDefault();
        setErro('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, senha);
            navigate('/app');
        } catch {
            setErro('E-mail ou senha incorretos.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            leftTitle="Bem-vindo ao Nexus Hub!"
            leftDescription="Ainda não possui uma conta? Junte-se a nós e comece a gerenciar seus relacionamentos."
            linkText="Cadastre-se"
            linkTo="/cadastro"
        >
            <div className="mb-8 text-left">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1.5">Login</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Use seu usuário e senha para acessar o workspace.
                </p>
            </div>

            {/* Botões Sociais / Atalhos Visuais */}
            {/* Botões de Acesso Rápido / Canais com Ícones Reais */}
            <div className="flex gap-3 mb-6">
                {/* Google */}
                <button
                    type="button"
                    aria-label="Continuar com Google"
                    title="Google"
                    className="flex-1 flex justify-center items-center py-2.5 bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-500/10 dark:hover:border-emerald-500/40 transition-colors"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                            fill="#4285F4"
                            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.5-1.14 2.77-2.4 3.62v3.01h3.88c2.27-2.09 3.54-5.17 3.54-8.87z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.01c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.26v3.1C3.23 21.3 7.31 24 12 24z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.28 15.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V7.63H1.26A11.97 11.97 0 0 0 0 13c0 1.93.46 3.75 1.26 5.37l4.02-3.1z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.82 15.24.75 12 .75 7.31.75 3.23 3.45 1.26 7.37l4.02 3.1c.95-2.85 3.6-4.96 6.72-4.96z"
                        />
                    </svg>
                </button>

                {/* GitHub */}
                <button
                    type="button"
                    aria-label="Continuar com GitHub"
                    title="GitHub"
                    className="flex-1 flex justify-center items-center py-2.5 bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-500/10 dark:hover:border-emerald-500/40 transition-colors text-slate-800 dark:text-white"
                >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        />
                    </svg>
                </button>

                {/* WhatsApp */}
                <button
                    type="button"
                    aria-label="Suporte via WhatsApp"
                    title="WhatsApp"
                    className="flex-1 flex justify-center items-center py-2.5 bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-500/10 dark:hover:border-emerald-500/40 transition-colors text-emerald-600 dark:text-emerald-400"
                >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20.52 3.48A11.82 11.82 0 0012.06 0C5.49 0 .14 5.34.14 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.9 11.9 0 005.76 1.47h.01c6.57 0 11.92-5.34 11.92-11.9 0-3.18-1.24-6.17-3.47-8.44zm-8.45 18.33h-.01a9.88 9.88 0 01-5.04-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.85 9.85 0 01-1.51-5.25c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 012.9 6.99c0 5.45-4.44 9.89-9.89 9.89zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
                    </svg>
                </button>
            </div>
            <div className="relative flex items-center justify-center mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <span className="relative bg-white dark:bg-[#0b192c] px-4 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase">
                    Ou
                </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-left">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        E-mail
                    </label>
                    <div className="relative">
                        <Mail
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                            size={18}
                        />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50/70 dark:bg-slate-900/65 border border-slate-300 dark:border-slate-700/90 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Senha
                    </label>
                    <div className="relative">
                        <Lock
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                            size={16}
                        />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            className="w-full bg-slate-50/70 dark:bg-slate-900/65 border border-slate-300 dark:border-slate-700/90 rounded-lg py-2.5 pl-10 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 transition-colors"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setIsModalRecuperarOpen(true)}
                        className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                        Esqueceu sua senha?
                    </button>
                </div>

                {erro && (
                    <p className="text-red-500 dark:text-red-400 text-sm font-medium">{erro}</p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-2xs disabled:opacity-60"
                >
                    {loading ? 'Entrando...' : 'ENTRAR'}
                </button>
            </form>
            <ModalRecuperarSenha
                isOpen={isModalRecuperarOpen}
                onClose={() => setIsModalRecuperarOpen(false)}
            />
        </AuthLayout>


    );
}