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

        if (senha.length < 6) {
            return setErro('A senha deve ter no mínimo 6 caracteres.');
        }
        if (senha !== confirmarSenha) {
            return setErro('As senhas não coincidem.');
        }

        setLoading(true);
        try {
            const resultado = await criarContaComEmpresa(
                nomeEmpresa.trim(),
                nome.trim(),
                'Outros',
                email.trim(),
                senha
            );
            if (resultado?.sucesso) {
                navigate('/app');
            } else {
                setErro(resultado?.mensagem || resultado?.erro || 'Erro ao criar conta. Verifique os dados.');
            }
        } catch {
            setErro('Erro ao criar conta. Verifique os dados e tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    const inputBase =
        'min-h-[44px] w-full bg-slate-50/70 dark:bg-slate-900/65 border rounded-lg py-2.5 pl-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all';
    const inputNormal = `${inputBase} pr-4 border-slate-300 dark:border-slate-700/90 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900`;
    const labelClass = 'block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1';
    const iconClass = 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none';

    const confirmInputClass = senhasDiferentes
        ? `${inputBase} pr-10 border-red-400 dark:border-red-500/80 focus:ring-red-500/40 focus:border-red-500 focus:bg-white dark:focus:bg-slate-900`
        : senhasIguais
            ? `${inputBase} pr-10 border-emerald-400 dark:border-emerald-500/80 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900`
            : `${inputBase} pr-10 border-slate-300 dark:border-slate-700/90 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900`;

    return (
        <AuthLayout
            leftTitle="Crie sua Conta"
            leftDescription="Já tem uma conta? Faça login para acessar todos os seus recursos e continuar de onde parou."
            linkText="Fazer Login"
            linkTo="/login"
        >
            <div className="mb-4 sm:mb-5 text-left min-w-0">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    Preencha os dados abaixo
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                    Cadastre-se para começar a usar o Nexus Hub.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5 text-left">
                <div>
                    <label className={labelClass}>Nome Completo</label>
                    <div className="relative">
                        <User className={iconClass} size={16} />
                        <input
                            type="text"
                            autoComplete="name"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className={inputNormal}
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
                            autoComplete="organization"
                            value={nomeEmpresa}
                            onChange={(e) => setNomeEmpresa(e.target.value)}
                            className={inputNormal}
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
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={inputNormal}
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
                            autoComplete="new-password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            className={`${inputBase} pr-11 border-slate-300 dark:border-slate-700/90 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900`}
                            placeholder="Mínimo 6 caracteres"
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 transition-colors rounded-md"
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
                            autoComplete="new-password"
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
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 dark:text-red-400 pointer-events-none"
                            />
                        )}
                        {senhasIguais && (
                            <CheckCircle2
                                size={15}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 pointer-events-none"
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
                    <p className="text-red-500 dark:text-red-400 text-xs font-medium break-words">
                        {erro}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading || senhasDiferentes}
                    className="min-h-[44px] w-full bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-2xs mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? 'Criando conta...' : 'CRIAR CONTA'}
                </button>
            </form>
        </AuthLayout>
    );
}