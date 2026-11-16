import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, Briefcase, BarChart3, Settings,
  ChevronDown, ChevronRight, LogOut, UserCircle, CheckSquare, Package,
  Pencil // <-- Ícone de lápis
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase-config';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast'; // <-- Importar o toast
import { atualizarPerfilUsuario } from '@/services/usuarioService'; // <-- Importar o serviço

export default function Sidebar({ onClose }) {
  const { user, dadosUsuario } = useAuth();
  const [menuAberto, setMenuAberto] = useState(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isPerfilModalOpen, setIsPerfilModalOpen] = useState(false);
  const [nomePerfil, setNomePerfil] = useState('');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  function toggleSubmenu(nomeMenu) {
    setMenuAberto(menuAberto === nomeMenu ? null : nomeMenu);
  }

  function abrirModalPerfil() {
    setNomePerfil(dadosUsuario?.nome || '');
    setIsPerfilModalOpen(true);
  }

  async function handleSalvarPerfil(e) {
    e.preventDefault();
    setSalvandoPerfil(true);
    const resultado = await atualizarPerfilUsuario(user.uid, { nome: nomePerfil });
    if (resultado.sucesso) {
      toast.success('Perfil atualizado!');
      setIsPerfilModalOpen(false);
      setTimeout(() => window.location.reload(), 1000); // Recarrega para atualizar o AuthContext
    } else {
      toast.error('Erro ao atualizar perfil.');
    }
    setSalvandoPerfil(false);
  }

  async function confirmarLogout() {
    await signOut(auth);
    setIsLogoutConfirmOpen(false);
    if (onClose) onClose();
  }

  // Classes padrão para os links
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
      ? 'bg-blue-600 text-white'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;

  const subLinkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'text-blue-400 bg-slate-800/50' : 'text-slate-500 hover:text-white'
    }`;

  return (
    <>
      <aside className="w-64 bg-[#0B1120] border-r border-slate-800 flex flex-col h-screen text-slate-300 transition-colors duration-300">

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            N
          </div>
          <h3 className="text-lg font-bold tracking-wide text-white whitespace-nowrap truncate">
            Nexus CRM
          </h3>
        </div>

        {/* Card do Usuário (Com botão de editar) */}
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 group hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <UserCircle size={22} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white truncate">
                  {dadosUsuario?.nome || user?.email?.split('@')[0]}
                </span>
                <span className="text-xs text-slate-500 capitalize flex items-center gap-1">
                  {dadosUsuario?.role || 'Admin'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={abrirModalPerfil}
                className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors rounded-md hover:bg-slate-800"
                title="Editar Perfil"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-md hover:bg-slate-800"
                title="Sair"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLink to="/app" end className={linkClass} onClick={onClose}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>

          <div>
            <button onClick={() => toggleSubmenu('contatos')} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              <div className="flex items-center gap-3"><Users size={18} /> Contatos</div>
              {menuAberto === 'contatos' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {menuAberto === 'contatos' && (
              <div className="pl-10 mt-1 space-y-1">
                <NavLink to="/app/contatos" className={subLinkClass} onClick={onClose}>Meus Contatos</NavLink>
                {/* Adiciona o parâmetro na URL */}
                <NavLink to="/app/contatos?tipo=leads" className={subLinkClass} onClick={onClose}>Leads</NavLink>
                <NavLink to="/app/contatos?tipo=clientes" className={subLinkClass} onClick={onClose}>Clientes</NavLink>
              </div>
            )}
          </div>

          <div>
            <button onClick={() => toggleSubmenu('negocios')} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              <div className="flex items-center gap-3"><Briefcase size={18} /> Negócios</div>
              {menuAberto === 'negocios' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {menuAberto === 'negocios' && (
              <div className="pl-10 mt-1 space-y-1">
                <NavLink to="/app/negocios" className={subLinkClass} onClick={onClose}>Meus Negócios</NavLink>
              </div>
            )}
          </div>

          <NavLink to="/app/tarefas" className={linkClass} onClick={onClose}>
            <CheckSquare size={18} /> Tarefas
          </NavLink>
          <NavLink to="/app/produtos" className={linkClass} onClick={onClose}>
            <Package size={18} /> Produtos / Serviços
          </NavLink>
          <NavLink to="/app/relatorios" className={linkClass} onClick={onClose}>
            <BarChart3 size={18} /> Relatórios
          </NavLink>

          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sistema</p>
          </div>

          <NavLink to="/app/equipe" className={linkClass} onClick={onClose}>
            <Users size={18} /> Gestão de Equipe
          </NavLink>
          <NavLink to="/app/configuracoes" className={linkClass} onClick={onClose}>
            <Settings size={18} /> Configurações
          </NavLink>
          <NavLink to="/app/ajuda" className={linkClass} onClick={onClose}>
            <UserCircle size={18} /> Central de Ajuda
          </NavLink>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center font-medium tracking-wide">
            Versão 1.0 • Pro
          </p>
        </div>
      </aside>

      {/* Modal de Confirmação de Logout */}
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={confirmarLogout}
        title="Sair do Nexus"
        message="Tem certeza que deseja encerrar sua sessão? Você precisará fazer login novamente para acessar o sistema."
        confirmText="Sim, sair"
      />

      {/* Modal de Edição de Perfil (Faltava este bloco) */}
      <Modal
        isOpen={isPerfilModalOpen}
        onClose={() => setIsPerfilModalOpen(false)}
        title="Editar Perfil"
        icon={<Pencil size={18} />}
      >
        <form onSubmit={handleSalvarPerfil} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold !text-slate-600 dark:!text-slate-400 mb-1">Nome Completo</label>
            <input
              type="text"
              value={nomePerfil}
              onChange={(e) => setNomePerfil(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold !text-slate-600 dark:!text-slate-400 mb-1">E-mail (Não editável)</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400 cursor-not-allowed"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <button type="button" onClick={() => setIsPerfilModalOpen(false)} className="px-4 py-2 text-sm font-medium !text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:!text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
            <button type="submit" disabled={salvandoPerfil} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
              {salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}