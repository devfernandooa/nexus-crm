import { useAuth } from '../contexts/AuthContext'; // <-- Importação necessária!
import { Users, GraduationCap, UserPlus, DollarSign, Plus, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { dadosUsuario } = useAuth();

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Header do Dashboard */}
      <div>
        {/* Título sozinho no h1/h3 */}
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <LayoutDashboardIcon />
          </div>
          Dashboard
        </h1>

        {/* Parágrafo de boas-vindas separado */}
        <p className="text-slate-500 mt-2">
          Bem-vindo de volta, <span className="font-semibold text-slate-800 dark:text-white">{dadosUsuario?.nome || 'Usuário'}</span>!
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Turmas Ativas" value="0" icon={<GraduationCap size={24} />} color="blue" />
        <KpiCard title="Alunos Matriculados" value="0" icon={<Users size={24} />} color="green" />
        <KpiCard title="Leads Ativos" value="0" icon={<UserPlus size={24} />} color="yellow" />
        <KpiCard title="Receita Total" value="R$ 0,00" icon={<DollarSign size={24} />} color="pink" />
      </div>

      {/* Ações Rápidas */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
          <span className="text-yellow-500">⚡</span> Ações rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg p-4 font-medium transition-colors">
            <Plus size={20} /> Nova Turma
          </button>
          <button className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg p-4 font-medium transition-colors shadow-sm">
            <UserPlus size={20} /> Novo Aluno
          </button>
          <button className="flex items-center justify-center gap-2 bg-white border border-yellow-200 text-yellow-600 hover:bg-yellow-50 rounded-lg p-4 font-medium transition-colors">
            <Users size={20} /> Ver Leads
          </button>
        </div>
      </div>

      {/* Tabela de Últimos Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Últimos leads recebidos</h2>
            <button className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={14} />
            </button>
          </div>
          <div className="p-8 text-center text-slate-500">
            Nenhum lead recebido ainda.
          </div>
        </div>

        {/* Resumo do Sistema */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Resumo do sistema</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Total de cursos</span>
              <span className="font-bold text-slate-800">0</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Total de turmas</span>
              <span className="font-bold text-slate-800">0</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Total de alunos</span>
              <span className="font-bold text-slate-800">0</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// Subcomponente para os Cards de KPI
function KpiCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    pink: 'bg-pink-50 text-pink-600',
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

// Ícone do título do Dashboard
function LayoutDashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}