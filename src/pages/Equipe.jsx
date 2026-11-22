import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    escutarEquipe,
    escutarConvites,
    escutarNomeEquipe,
    salvarNomeEquipe,
    criarConvite,
    adicionarMembroEquipe,
    cancelarConvite,
    atualizarDadosMembro,
    removerMembroEquipe,
} from '@/services/equipeService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PageHeader from '@/components/ui/PageHeader';
import toast from 'react-hot-toast';
import {
    Users,
    UserPlus,
    Mail,
    Trash2,
    Shield,
    User,
    Pencil,
    Search,
    Clock,
    Check,
    X,
    Phone,
    Briefcase,
} from 'lucide-react';

function formatarRole(role) {
    const r = String(role || '').toLowerCase();
    if (r === 'admin' || r === 'administrador') return 'Admin';
    if (r === 'vendedor') return 'Vendedor';
    if (r === 'leitor') return 'Leitor';
    return role || 'Membro';
}

export default function Equipe() {
    const { dadosUsuario } = useAuth();
    const [membros, setMembros] = useState([]);
    const [convites, setConvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');

    // Nome da Equipe
    const [nomeEquipe, setNomeEquipe] = useState('');
    const [editandoNomeEquipe, setEditandoNomeEquipe] = useState(false);
    const [rascunhoNomeEquipe, setRascunhoNomeEquipe] = useState('');
    const [salvandoNomeEquipe, setSalvandoNomeEquipe] = useState(false);

    // Modal Adicionar Membro Direto
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [novoMembro, setNovoMembro] = useState({
        nome: '',
        email: '',
        telefone: '',
        cargo: '',
        role: 'vendedor',
    });
    const [adicionandoMembro, setAdicionandoMembro] = useState(false);

    // Modal Convite por E-mail
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [emailConvite, setEmailConvite] = useState('');
    const [roleConvite, setRoleConvite] = useState('vendedor');
    const [enviandoConvite, setEnviandoConvite] = useState(false);

    // Modal Edição de Dados do Membro
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [membroEditando, setMembroEditando] = useState(null);
    const [formEdicao, setFormEdicao] = useState({
        nome: '',
        email: '',
        telefone: '',
        cargo: '',
        role: 'vendedor',
    });
    const [salvandoEdicao, setSalvandoEdicao] = useState(false);

    // Modal Confirmação (Membro ou Convite)
    const [confirmacao, setConfirmacao] = useState({
        aberto: false,
        tipo: null, // 'membro' | 'convite'
        id: null,
        titulo: '',
        mensagem: '',
        textoBotao: 'Confirmar',
    });

    useEffect(() => {
        if (!dadosUsuario?.empresaId) return;

        let ativo = true;
        setLoading(true);

        const unsubNome = escutarNomeEquipe(dadosUsuario.empresaId, (nomeSalvo) => {
            if (ativo) {
                const valorPadrao = nomeSalvo || dadosUsuario?.nomeEmpresa || 'Equipe Principal';
                setNomeEquipe(valorPadrao);
                setRascunhoNomeEquipe(valorPadrao);
            }
        });

        const unsubEquipe = escutarEquipe(dadosUsuario.empresaId, (lista) => {
            if (ativo) setMembros(lista);
        });

        const unsubConvites = escutarConvites(dadosUsuario.empresaId, (lista) => {
            if (ativo) {
                setConvites(lista);
                setLoading(false);
            }
        });

        return () => {
            ativo = false;
            unsubNome();
            unsubEquipe();
            unsubConvites();
        };
    }, [dadosUsuario?.empresaId, dadosUsuario?.nomeEmpresa]);

    const membrosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        if (!termo) return membros;
        return membros.filter((m) => {
            const nome = String(m.nome || m.email?.split('@')[0] || '').toLowerCase();
            const mail = String(m.email || '').toLowerCase();
            const tel = String(m.telefone || '').toLowerCase();
            const cargoFuncao = `${m.cargo || ''} ${m.role || ''}`.toLowerCase();
            return (
                nome.includes(termo) ||
                mail.includes(termo) ||
                tel.includes(termo) ||
                cargoFuncao.includes(termo)
            );
        });
    }, [membros, busca]);

    const convitesFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        if (!termo) return convites;
        return convites.filter((c) => {
            const mail = String(c.email || '').toLowerCase();
            const cargo = String(c.role || '').toLowerCase();
            return mail.includes(termo) || cargo.includes(termo);
        });
    }, [convites, busca]);

    const totalAdmins = useMemo(
        () => membros.filter((m) => String(m.role || '').toLowerCase() === 'admin').length,
        [membros]
    );

    // Salvar nome da equipe
    async function handleSalvarNomeEquipe(e) {
        e?.preventDefault?.();
        if (!rascunhoNomeEquipe.trim()) {
            toast.error('Digite um nome para a equipe.');
            return;
        }
        setSalvandoNomeEquipe(true);
        const res = await salvarNomeEquipe(dadosUsuario.empresaId, rascunhoNomeEquipe);
        if (res.sucesso) {
            setNomeEquipe(rascunhoNomeEquipe.trim());
            setEditandoNomeEquipe(false);
            toast.success('Nome da equipe atualizado!');
        } else {
            toast.error(res.erro || 'Erro ao salvar nome da equipe.');
        }
        setSalvandoNomeEquipe(false);
    }

    // Adicionar membro diretamente
    async function handleAdicionarMembro(e) {
        e.preventDefault();
        setAdicionandoMembro(true);
        const res = await adicionarMembroEquipe(dadosUsuario.empresaId, novoMembro);
        if (res.sucesso) {
            toast.success('Membro adicionado à equipe!');
            setNovoMembro({
                nome: '',
                email: '',
                telefone: '',
                cargo: '',
                role: 'vendedor',
            });
            setIsAddModalOpen(false);
        } else {
            toast.error(res.erro || 'Erro ao adicionar membro.');
        }
        setAdicionandoMembro(false);
    }

    // Enviar convite por e-mail
    async function handleConvidar(e) {
        e.preventDefault();
        setEnviandoConvite(true);
        const resultado = await criarConvite(emailConvite, dadosUsuario.empresaId, roleConvite);

        if (resultado.sucesso) {
            toast.success('Convite gerado com sucesso!');
            setEmailConvite('');
            setRoleConvite('vendedor');
            setIsInviteModalOpen(false);
        } else {
            toast.error(resultado.erro || 'Não foi possível criar o convite.');
        }
        setEnviandoConvite(false);
    }

    function solicitarCancelarConvite(convite) {
        setConfirmacao({
            aberto: true,
            tipo: 'convite',
            id: convite.id,
            titulo: 'Cancelar Convite',
            mensagem: `Deseja cancelar o convite pendente para ${convite.email}?`,
            textoBotao: 'Sim, cancelar',
        });
    }

    function abrirEditarMembro(membro) {
        setMembroEditando(membro);
        setFormEdicao({
            nome: membro.nome || membro.email?.split('@')[0] || '',
            email: membro.email || '',
            telefone: membro.telefone || '',
            cargo: membro.cargo || '',
            role: membro.role || 'vendedor',
        });
        setIsEditModalOpen(true);
    }

    async function handleSalvarEdicao(e) {
        e.preventDefault();
        if (!membroEditando?.id) return;

        if (!formEdicao.nome.trim() || !formEdicao.email.trim()) {
            toast.error('Nome e e-mail são obrigatórios.');
            return;
        }

        setSalvandoEdicao(true);
        const resultado = await atualizarDadosMembro(membroEditando.id, formEdicao);

        if (resultado.sucesso) {
            toast.success('Dados do membro atualizados!');
            setIsEditModalOpen(false);
            setMembroEditando(null);
        } else {
            toast.error('Erro ao atualizar dados do membro.');
        }
        setSalvandoEdicao(false);
    }

    function solicitarRemoverMembro(membro) {
        if (membro.id === dadosUsuario?.uid) {
            toast.error('Você não pode remover a sua própria conta da equipe.');
            return;
        }

        setConfirmacao({
            aberto: true,
            tipo: 'membro',
            id: membro.id,
            titulo: 'Remover Membro',
            mensagem: `Tem certeza que deseja remover ${membro.nome || membro.email} da equipe? Ele perderá o acesso aos dados da empresa.`,
            textoBotao: 'Sim, remover',
        });
    }

    async function handleConfirmarAcao() {
        if (!confirmacao.id || !confirmacao.tipo) return;

        if (confirmacao.tipo === 'membro') {
            const resultado = await removerMembroEquipe(confirmacao.id);
            if (resultado.sucesso) {
                toast.success('Membro removido da equipe!');
            } else {
                toast.error('Erro ao remover membro.');
            }
        } else if (confirmacao.tipo === 'convite') {
            const resultado = await cancelarConvite(confirmacao.id);
            if (resultado.sucesso) {
                toast.success('Convite cancelado.');
            } else {
                toast.error('Erro ao cancelar convite.');
            }
        }

        setConfirmacao((prev) => ({ ...prev, aberto: false, id: null, tipo: null }));
    }

    const containerClass =
        'w-full max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:overflow-y-auto max-md:overscroll-y-contain md:min-h-full md:h-auto md:overflow-visible overflow-x-hidden touch-pan-y flex flex-col px-4 sm:px-6 lg:px-7 py-4 sm:py-5 pb-28 md:pb-8 bg-slate-50/60 dark:bg-slate-950 transition-colors text-left space-y-4';

    const inputClass =
        'w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all';

    return (
        <div className={containerClass}>
            <PageHeader
                icon={<Users size={18} />}
                title="Gestão de Equipe"
                subtitle={`Equipe: ${nomeEquipe} — Gerencie membros, cargos e convites no Nexus Hub.`}
                action={
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <button
                            type="button"
                            onClick={() => setIsInviteModalOpen(true)}
                            className="bg-white dark:bg-[#0b192c] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors flex-1 sm:flex-initial shadow-2xs"
                        >
                            <Mail size={15} /> Convidar
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors flex-1 sm:flex-initial shadow-2xs"
                        >
                            <UserPlus size={16} /> Adicionar Membro
                        </button>
                    </div>
                }
            />

            {/* Faixa do Nome da Equipe */}
            <div className="bg-white dark:bg-[#0b192c] px-4 py-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
                {editandoNomeEquipe ? (
                    <form
                        onSubmit={handleSalvarNomeEquipe}
                        className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-1"
                    >
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            Nome da Equipe:
                        </span>
                        <input
                            type="text"
                            value={rascunhoNomeEquipe}
                            onChange={(e) => setRascunhoNomeEquipe(e.target.value)}
                            placeholder="Ex.: Time Comercial Sul"
                            className="px-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-emerald-400 dark:border-emerald-500/60 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-1 min-w-[200px]"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={salvandoNomeEquipe}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60 transition-colors"
                        >
                            <Check size={14} /> {salvandoNomeEquipe ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setRascunhoNomeEquipe(nomeEquipe);
                                setEditandoNomeEquipe(false);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X size={14} /> Cancelar
                        </button>
                    </form>
                ) : (
                    <>
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                                Nome da Equipe:
                            </span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {nomeEquipe}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setRascunhoNomeEquipe(nomeEquipe);
                                setEditandoNomeEquipe(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 border border-emerald-200/70 dark:border-emerald-500/25 transition-colors"
                        >
                            <Pencil size={13} /> Editar Nome
                        </button>
                    </>
                )}
            </div>

            {/* Resumo Rápido */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
                <div className="bg-white dark:bg-[#0b192c] px-4 py-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Membros da Equipe
                        </p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                            {membros.length}
                        </p>
                    </div>
                    <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        <Users size={16} />
                    </span>
                </div>

                <div className="bg-white dark:bg-[#0b192c] px-4 py-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Convites Pendentes
                        </p>
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
                            {convites.length}
                        </p>
                    </div>
                    <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        <Clock size={16} />
                    </span>
                </div>

                <div className="bg-white dark:bg-[#0b192c] px-4 py-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Administradores
                        </p>
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
                            {totalAdmins}
                        </p>
                    </div>
                    <span className="p-2 rounded-lg bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300">
                        <Shield size={16} />
                    </span>
                </div>
            </div>

            {/* Barra de Pesquisa */}
            <div className="relative shrink-0">
                <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por nome, e-mail, telefone, cargo ou função..."
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-[#0b192c] border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs transition-all"
                />
            </div>

            {/* Colunas: Membros Ativos e Convites Pendentes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
                {/* Membros Ativos */}
                <div className="bg-white dark:bg-[#0b192c] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col min-w-0">
                    <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                            Membros da Equipe ({membrosFiltrados.length})
                        </h2>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80 flex-1">
                        {loading ? (
                            <div className="p-4 space-y-3 animate-pulse">
                                <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                                <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                            </div>
                        ) : membrosFiltrados.length === 0 ? (
                            <p className="p-8 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                Nenhum membro encontrado.
                            </p>
                        ) : (
                            membrosFiltrados.map((membro) => {
                                const isAdmin = String(membro.role || '').toLowerCase() === 'admin';
                                return (
                                    <div
                                        key={membro.id}
                                        className="px-4 py-3 flex items-center justify-between gap-3 group hover:bg-emerald-50/40 dark:hover:bg-emerald-500/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/70 dark:border-emerald-500/25 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                                                <User size={17} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                        {membro.nome || membro.email?.split('@')[0] || 'Membro'}
                                                    </p>
                                                    {membro.cargo && (
                                                        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                                            {membro.cargo}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                    {membro.email}
                                                    {membro.telefone ? ` • ${membro.telefone}` : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span
                                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase inline-flex items-center gap-1 ${isAdmin
                                                        ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/25'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                                    }`}
                                            >
                                                <Shield size={11} /> {formatarRole(membro.role)}
                                            </span>

                                            <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => abrirEditarMembro(membro)}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                                    title="Editar dados do membro"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => solicitarRemoverMembro(membro)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                    title="Remover membro"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Convites Pendentes */}
                <div className="bg-white dark:bg-[#0b192c] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col min-w-0">
                    <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                            Convites Pendentes ({convitesFiltrados.length})
                        </h2>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80 flex-1">
                        {loading ? (
                            <div className="p-4 space-y-3 animate-pulse">
                                <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                            </div>
                        ) : convitesFiltrados.length === 0 ? (
                            <p className="p-8 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                Nenhum convite pendente.
                            </p>
                        ) : (
                            convitesFiltrados.map((convite) => (
                                <div
                                    key={convite.id}
                                    className="px-4 py-3 flex items-center justify-between gap-3 group hover:bg-emerald-50/40 dark:hover:bg-emerald-500/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-200/70 dark:border-amber-500/25 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                                            <Mail size={17} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                {convite.email}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                Função: <span className="font-medium">{formatarRole(convite.role)}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => solicitarCancelarConvite(convite)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 shrink-0"
                                        title="Cancelar convite"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: Adicionar Membro Diretamente */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Adicionar Membro à Equipe"
                icon={<UserPlus size={18} />}
            >
                <form onSubmit={handleAdicionarMembro} className="space-y-3.5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Nome Completo *
                        </label>
                        <input
                            type="text"
                            value={novoMembro.nome}
                            onChange={(e) => setNovoMembro((prev) => ({ ...prev, nome: e.target.value }))}
                            className={inputClass}
                            required
                            placeholder="Ex.: Ana Paula Costa"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                E-mail *
                            </label>
                            <input
                                type="email"
                                value={novoMembro.email}
                                onChange={(e) => setNovoMembro((prev) => ({ ...prev, email: e.target.value }))}
                                className={inputClass}
                                required
                                placeholder="ana@empresa.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                Telefone
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={novoMembro.telefone}
                                    onChange={(e) => setNovoMembro((prev) => ({ ...prev, telefone: e.target.value }))}
                                    className={inputClass}
                                    placeholder="(75) 99999-9999"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                Cargo / Especialidade
                            </label>
                            <input
                                type="text"
                                value={novoMembro.cargo}
                                onChange={(e) => setNovoMembro((prev) => ({ ...prev, cargo: e.target.value }))}
                                className={inputClass}
                                placeholder="Ex.: Consultor Comercial"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                Função (Permissão)
                            </label>
                            <select
                                value={novoMembro.role}
                                onChange={(e) => setNovoMembro((prev) => ({ ...prev, role: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="vendedor">Vendedor</option>
                                <option value="admin">Administrador</option>
                                <option value="leitor">Somente Leitura</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={adicionandoMembro}
                            className="px-4 py-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-lg font-semibold disabled:opacity-60 transition-colors"
                        >
                            {adicionandoMembro ? 'Adicionando...' : 'Adicionar Membro'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Convidar por E-mail */}
            <Modal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                title="Convidar por E-mail"
                icon={<Mail size={18} />}
            >
                <form onSubmit={handleConvidar} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            E-mail do Convidado
                        </label>
                        <input
                            type="email"
                            value={emailConvite}
                            onChange={(e) => setEmailConvite(e.target.value)}
                            className={inputClass}
                            required
                            placeholder="email@exemplo.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Função (Permissão)
                        </label>
                        <select
                            value={roleConvite}
                            onChange={(e) => setRoleConvite(e.target.value)}
                            className={inputClass}
                        >
                            <option value="vendedor">Vendedor</option>
                            <option value="admin">Administrador</option>
                            <option value="leitor">Somente Leitura</option>
                        </select>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        O convidado deverá se cadastrar usando este mesmo e-mail para ser vinculado à sua empresa.
                    </p>

                    <div className="flex justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsInviteModalOpen(false)}
                            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={enviandoConvite}
                            className="px-4 py-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-lg font-semibold disabled:opacity-60 transition-colors"
                        >
                            {enviandoConvite ? 'Gerando...' : 'Gerar Convite'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Editar Dados do Membro */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Editar Dados do Membro"
                icon={<Pencil size={18} />}
            >
                <form onSubmit={handleSalvarEdicao} className="space-y-3.5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Nome Completo *
                        </label>
                        <input
                            type="text"
                            value={formEdicao.nome}
                            onChange={(e) => setFormEdicao((prev) => ({ ...prev, nome: e.target.value }))}
                            className={inputClass}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                E-mail *
                            </label>
                            <input
                                type="email"
                                value={formEdicao.email}
                                onChange={(e) => setFormEdicao((prev) => ({ ...prev, email: e.target.value }))}
                                className={inputClass}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                <span className="inline-flex items-center gap-1">
                                    <Phone size={11} /> Telefone
                                </span>
                            </label>
                            <input
                                type="text"
                                value={formEdicao.telefone}
                                onChange={(e) => setFormEdicao((prev) => ({ ...prev, telefone: e.target.value }))}
                                className={inputClass}
                                placeholder="(75) 99999-9999"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                <span className="inline-flex items-center gap-1">
                                    <Briefcase size={11} /> Cargo / Especialidade
                                </span>
                            </label>
                            <input
                                type="text"
                                value={formEdicao.cargo}
                                onChange={(e) => setFormEdicao((prev) => ({ ...prev, cargo: e.target.value }))}
                                className={inputClass}
                                placeholder="Ex.: Vendedor Sênior"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                Função (Permissão)
                            </label>
                            <select
                                value={formEdicao.role}
                                onChange={(e) => setFormEdicao((prev) => ({ ...prev, role: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="vendedor">Vendedor</option>
                                <option value="admin">Administrador</option>
                                <option value="leitor">Somente Leitura</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={salvandoEdicao}
                            className="px-4 py-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-lg font-semibold disabled:opacity-60 transition-colors"
                        >
                            {salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal de Confirmação */}
            <ConfirmModal
                isOpen={confirmacao.aberto}
                onClose={() => setConfirmacao((prev) => ({ ...prev, aberto: false }))}
                onConfirm={handleConfirmarAcao}
                title={confirmacao.titulo}
                message={confirmacao.mensagem}
                confirmText={confirmacao.textoBotao}
            />
        </div>
    );
}