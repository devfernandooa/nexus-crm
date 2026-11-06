import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase-config';
import AuthLayout from '../components/layouts/AuthLayout';
import { Mail, Lock, Eye, EyeOff, Globe, Building, MessageCircle } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setErro('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, senha);
            navigate('/app');
        } catch (error) {
            setErro('E-mail ou senha incorretos.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            leftTitle="Bem-vindo!"
            leftDescription="Ainda não possui uma conta? Junte-se a nós e comece a gerenciar seus relacionamentos."
            linkText="Cadastre-se"
            linkTo="/cadastro"
        >
            <div className="mb-14">
                <h3 className="text-3xl font-bold text-white mb-2">Login</h3>
                <p className="text-slate-400 text-sm">Use seu usuário e senha para acessar.</p>
            </div>

            {/* Botões Sociais (Exemplo visual) */}
            <div className="flex gap-3 mb-6">
                <button className="flex-1 flex justify-center py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors text-white">
                    <Globe size={18} />
                </button>
                <button className="flex-1 flex justify-center py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors text-white">
                    <Building size={18} />
                </button>
                <button className="flex-1 flex justify-center py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors text-white">
                    <MessageCircle size={18} />
                </button>
            </div>

            <div className="relative flex items-center justify-center mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
                <span className="relative bg-[#0B1120] px-4 text-xs text-slate-500 uppercase">Ou</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">E-mail</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type={showPassword ? "text" : "password"}
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            // Novas classes para corrigir o fundo no foco e o autofill amarelo:
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 pl-9 pr-9 text-sm text-white placeholder-slate-500 
               focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-900
               autofill:bg-slate-900 autofill:text-white transition-all"
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div className="flex justify-end">
                    <a href="#" className="text-sm text-blue-500 hover:text-blue-400">Esqueceu sua senha?</a>
                </div>

                {erro && <p className="text-red-400 text-sm">{erro}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors mt-2"
                >
                    {loading ? 'Entrando...' : 'ENTRAR'}
                </button>
            </form>
        </AuthLayout>
    );
}