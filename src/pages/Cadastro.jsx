import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { criarContaComEmpresa } from '../services/authService';
import AuthLayout from '../components/layouts/AuthLayout';
import { Mail, Lock, Eye, EyeOff, Building, User, CheckCircle2, AlertCircle } from 'lucide-react';

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

    const senhasDiferentes = confirmarSenha.length > 0 && senha !== confirmarSenha;
    const senhasIguais = confirmarSenha.length > 0 && senha === confirmarSenha;

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

    const inputClass =
        'w-full bg-slate-50/70 dark:bg-slate-900/65 border border-slate-300 dark:border-slate-700/90 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all';
    const labelClass = 'block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1';
    const iconClass = 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500';

    const confirmInputClass = senhasDiferentes
        ? 'w-full bg-slate-50/70 dark:bg-slate-900/65 border border-red-400 dark:border-red-500/80 rounded-lg py-2 pl-9 pr-9 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 transition-all'
        : senhasIguais
            ? 'w-full bg-slate-50/70 dark:bg-slate-900/65 border border-emerald-400 dark:border-emerald-500/80 rounded-lg py-2 pl-9 pr-9 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all'
            : `${inputClass} pr-9`;

    return (
        <AuthLayout
            leftTitle="Crie sua Conta"
            leftDescription="Já tem uma conta? Faça login para acessar todos os seus recursos e continuar de onde parou."
            linkText="Fazer Login"
            linkTo="/login"
        >
            <div className="mb-5 text-left">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    Preencha os dados abaixo
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                    Cadastre-se para começar a usar o Nexus Hub.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-left">
                <div>
                    <label className={labelClass}>Nome Completo</label>
                    <div className="relative">
                        <User className={iconClass} size={16} />
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className={inputClass}
                            placeholder="Seu nome completo"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Nome da Empresa</label>
                    <div className="relative">
                        <Building className={iconClass} size={16} />
                        <input
                            type="text"
                            value={nomeEmpresa}
                            onChange={(e) => setNomeEmpresa(e.target.value)}
                            className={inputClass}
                            placeholder="Nome da sua empresa"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>E-mail</label>
                    <div className="relative">
                        <Mail className={iconClass} size={16} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={inputClass}
                            placeholder="seu@email.com"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Senha</label>
                    <div className="relative">
                        <Lock className={iconClass} size={16} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            className={`${inputClass} pr-9`}
                            placeholder="Mínimo 6 caracteres"
                            required
                            minLength={6}
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

                <div>
                    <label className={labelClass}>Confirmar Senha</label>
                    <div className="relative">
                        <Lock className={iconClass} size={16} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            className={confirmInputClass}
                            placeholder="Repita a senha"
                            required
                            minLength={6}
                        />
                        {senhasDiferentes && (
                            <AlertCircle
                                size={15}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 dark:text-red-400"
                            />
                        )}
                        {senhasIguais && (
                            <CheckCircle2
                                size={15}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400"
                            />
                        )}
                    </div>
                    {senhasDiferentes && (
                        <p className="text-red-500 dark:text-red-400 text-[11px] font-medium mt-1">
                            As senhas não coincidem.
                        </p>
                    )}
                    {senhasIguais && (
                        <p className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium mt-1">
                            As senhas coincidem.
                        </p>
                    )}
                </div>

                {erro && (
                    <p className="text-red-500 dark:text-red-400 text-xs font-medium">{erro}</p>
                )}

                <button
                    type="submit"
                    disabled={loading || senhasDiferentes}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-2xs mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? 'Criando conta...' : 'CRIAR CONTA'}
                </button>
            </form>
        </AuthLayout>
    );
}