import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { escutarEquipe, escutarConvites, criarConvite, cancelarConvite, atualizarCargoMembro, removerMembroEquipe } from '@/services/equipeService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PageHeader from '@/components/ui/PageHeader';
import toast from 'react-hot-toast';
import { Users, UserPlus, Mail, Trash2, Shield, User, Pencil } from 'lucide-react';

export default function Equipe() {
    const { dadosUsuario } = useAuth();
    const [membros, setMembros] = useState([]);
    const [convites, setConvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [idParaDeletar, setIdParaDeletar] = useState(null);

    // Estados do Formulário de Convite
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('vendedor');
    const [enviando, setEnviando] = useState(false);

    // Estados do Modal de Edição
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [membroEditando, setMembroEditando] = useState(null);
    const [novoRole, setNovoRole] = useState('vendedor');
    const [salvandoEdicao, setSalvandoEdicao] = useState(false);

    useEffect(() => {
        if (!dadosUsuario?.empresaId) return;

        const unsubEquipe = escutarEquipe(dadosUsuario.empresaId, setMembros);
        const unsubConvites = escutarConvites(dadosUsuario.empresaId, (lista) => {
            setConvites(lista);
            setLoading(false);
        });

        return () => {
            unsubEquipe();
            unsubConvites();
        };
    }, [dadosUsuario?.empresaId]);

    // Funções de Convite
    async function handleConvidar(e) {
        e.preventDefault();
        setEnviando(true);
        const resultado = await criarConvite(email, dadosUsuario.empresaId, role);

        if (resultado.sucesso) {
            toast.success('Convite gerado com sucesso!');
            setEmail('');
            setIsModalOpen(false);
        } else {
            toast.error(resultado.erro);
        }
        setEnviando(false);
    }

    async function handleCancelarConvite(id) {
        if (window.confirm("Deseja cancelar este convite?")) {
            const resultado = await cancelarConvite(id);
            if (resultado.sucesso) toast.success('Convite cancelado.');
            else toast.error('Erro ao cancelar.');
        }
    }

    // Funções de Edição de Membro
    function abrirEditarMembro(membro) {
        setMembroEditando(membro);
        setNovoRole(membro.role || 'vendedor');
        setIsEditModalOpen(true);
    }

    async function handleSalvarEdicao(e) {
        e.preventDefault();
        setSalvandoEdicao(true);
        const resultado = await atualizarCargoMembro(membroEditando.id, novoRole);

        if (resultado.sucesso) {
            toast.success('Cargo atualizado!');
            setIsEditModalOpen(false);
        } else {
            toast.error('Erro ao atualizar cargo.');
        }
        setSalvandoEdicao(false);
    }

    // Funções de Exclusão de Membro
    function confirmarDeletarMembro(id) {
        setIdParaDeletar(id);
        setIsConfirmOpen(true);
    }

    async function handleDeletarMembro() {
        const resultado = await removerMembroEquipe(idParaDeletar);
        if (resultado.sucesso) {
            toast.success('Membro removido da equipe!');
            setIsConfirmOpen(false);
        } else {
            toast.error('Erro ao remover membro.');
        }
    }

    return (
        <div className="w-full h-full flex flex-col max-w-5xl mx-auto">
            <PageHeader
                icon={<Users size={18} />}
                title="Gestão de Equipe"
                subtitle="Gerencie quem tem acesso à sua empresa no Nexus."
                action={
                    <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors w-full md:w-auto justify-center shadow-sm">
                        <UserPlus size={18} /> Convidar Membro
                    </button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Membros Ativos */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <h2 className="font-bold !text-slate-900 dark:!text-white">Membros da Equipe ({membros.length})</h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
                        {membros.map(membro => (
                            <div key={membro.id} className="p-4 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium !text-slate-900 dark:!text-white">{membro.nome || membro.email.split('@')[0]}</p>
                                        <p className="text-xs !text-slate-500">{membro.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 !text-slate-600 dark:!text-slate-300 uppercase flex items-center gap-1">
                                        <Shield size={12} /> {membro.role}
                                    </span>
                                    {/* Botões de Ação (aparecem no hover) */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <button onClick={() => abrirEditarMembro(membro)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-500/10" title="Editar Cargo">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => confirmarDeletarMembro(membro.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10" title="Remover Membro">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Convites Pendentes */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <h2 className="font-bold !text-slate-900 dark:!text-white">Convites Pendentes ({convites.length})</h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
                        {loading ? (
                            <p className="p-4 text-sm !text-slate-500">Carregando...</p>
                        ) : convites.length === 0 ? (
                            <p className="p-8 text-center text-sm !text-slate-500">Nenhum convite pendente.</p>
                        ) : (
                            convites.map(convite => (
                                <div key={convite.id} className="p-4 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium !text-slate-900 dark:!text-white">{convite.email}</p>
                                            <p className="text-xs !text-slate-500 capitalize">Função: {convite.role}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleCancelarConvite(convite.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100" title="Cancelar convite">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Convite */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Convidar Membro" icon={<UserPlus size={18} />}>
                <form onSubmit={handleConvidar} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold !text-slate-600 dark:!text-slate-400 mb-1">E-mail do Convidado</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500" required placeholder="email@exemplo.com" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold !text-slate-600 dark:!text-slate-400 mb-1">Função (Permissão)</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500">
                            <option value="vendedor">Vendedor</option>
                            <option value="admin">Administrador</option>
                            <option value="leitor">Somente Leitura</option>
                        </select>
                    </div>
                    <p className="text-xs !text-slate-500">O convidado deverá se cadastrar usando este mesmo e-mail para ser vinculado à sua empresa.</p>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium !text-slate-600 hover:bg-slate-100 rounded-lg dark:!text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
                        <button type="submit" disabled={enviando} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium">
                            {enviando ? 'Gerando...' : 'Gerar Convite'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal de Edição de Membro */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Cargo" icon={<Pencil size={18} />}>
                <form onSubmit={handleSalvarEdicao} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold !text-slate-600 dark:!text-slate-400 mb-1">Nome</label>
                        <input type="text" value={membroEditando?.nome || membroEditando?.email || ''} disabled className="w-full px-3 py-2 text-sm border rounded-lg bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold !text-slate-600 dark:!text-slate-400 mb-1">Nova Função</label>
                        <select value={novoRole} onChange={(e) => setNovoRole(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500">
                            <option value="vendedor">Vendedor</option>
                            <option value="admin">Administrador</option>
                            <option value="leitor">Somente Leitura</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium !text-slate-600 hover:bg-slate-100 rounded-lg dark:!text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
                        <button type="submit" disabled={salvandoEdicao} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium">
                            {salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal de Confirmação de Exclusão */}
            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDeletarMembro}
                title="Remover Membro"
                message="Tem certeza que deseja remover este membro da equipe? Ele perderá o acesso aos dados da empresa."
                confirmText="Sim, remover"
            />
        </div>
    );
}