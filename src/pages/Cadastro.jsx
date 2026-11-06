import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { criarContaComEmpresa } from '../services/authService';
import AuthLayout from '../components/layouts/AuthLayout';
import { Mail, Lock, Eye, EyeOff, Building, User } from 'lucide-react';

export default function Cadastro() {
    const [nome, setNome] = useState('');
    const [nomeEmpresa, setNomeEmpresa] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setErro('');
        if (senha !== confirmarSenha) return setErro('As senhas não coincidem.');

        setLoading(true);
        const resultado = await criarContaComEmpresa(nomeEmpresa, nome, 'Outros', email, senha);
        if (resultado.sucesso) {
            navigate('/app');
        } else {
            setErro('Erro ao criar conta. Verifique os dados.');
        }
        setLoading(false);
    }

    // Classes base para inputs (reutilizáveis)
    const inputClass = "w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-900 autofill:bg-slate-900 transition-all";
    const labelClass = "block text-xs font-medium text-slate-300 mb-1";
    const iconClass = "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500";

    return (
        <AuthLayout
            leftTitle="Crie sua Conta"
            leftDescription="Já tem uma conta? Faça login para acessar todos os seus recursos e continuar de onde parou."
            linkText="Fazer Login"
            linkTo="/login"
        >
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-1">Preencha os dados abaixo</h3>
                <p className="text-slate-400 text-xs">Cadastre-se para começar a usar o Nexus.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className={labelClass}>Nome Completo</label>
                    <div className="relative">
                        <User className={iconClass} size={16} />
                        <input
                            type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                            className={inputClass} placeholder="Seu nome completo" required
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Nome da Empresa</label>
                    <div className="relative">
                        <Building className={iconClass} size={16} />
                        <input
                            type="text" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)}
                            className={inputClass} placeholder="Nome da sua empresa" required
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>E-mail</label>
                    <div className="relative">
                        <Mail className={iconClass} size={16} />
                        <input
                            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            className={inputClass} placeholder="seu@email.com" required
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Senha</label>
                    <div className="relative">
                        <Lock className={iconClass} size={16} />
                        <input
                            type={showPassword ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)}
                            className={inputClass} placeholder="Mínimo 6 caracteres" required minLength={6}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Confirmar Senha</label>
                    <div className="relative">
                        <Lock className={iconClass} size={16} />
                        <input
                            type={showPassword ? "text" : "password"} value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)}
                            className={inputClass} placeholder="Repita a senha" required minLength={6}
                        />
                    </div>
                </div>

                {erro && <p className="text-red-400 text-xs">{erro}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors mt-2"
                >
                    {loading ? 'Criando conta...' : 'CRIAR CONTA'}
                </button>
            </form>
        </AuthLayout>
    );
}