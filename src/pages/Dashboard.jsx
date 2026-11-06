import { useAuth } from '../contexts/AuthContext';
import {
  Users, Briefcase, CheckCircle2, DollarSign, Plus, ArrowRight,
  TrendingUp, MoreHorizontal, Target, Calendar, Building2, Filter, Search
} from 'lucide-react';

export default function Dashboard() {
  const { dadosUsuario } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header de Ações Rápidas (Mantido no topo, mas sem o texto de boas-vindas) */}
      <div className="flex justify-end gap-2">
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          <Calendar size={16} /> Agendar
        </button>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md">
          <Plus size={16} /> Novo Contato
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total de Contatos" value="0" trend="+0%" icon={<Users size={18} />} color="blue" />
        <KpiCard title="Negócios Abertos" value="0" trend="+0%" icon={<Briefcase size={18} />} color="indigo" />
        <KpiCard title="Tarefas Pendentes" value="0" trend="0" icon={<CheckCircle2 size={18} />} color="amber" />
        <KpiCard title="Receita Prevista" value="R$ 0,00" trend="+0%" icon={<DollarSign size={18} />} color="emerald" />
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Lista de Contatos Recentes */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Users size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="font-semibold text-slate-900 dark:text-white">Contatos Recentes</h2>
              </div>
              <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
                Ver todos <ArrowRight size={14} />
              </button>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Buscar contatos..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white" />
              </div>
              <button className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <Filter size={16} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Empty State */}
          <div className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold mb-1">Nenhum contato ainda</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mb-4">
                Comece adicionando seu primeiro contato para gerenciar seus relacionamentos e oportunidades.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  <Plus size={16} /> Adicionar Contato
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">
                  <Building2 size={16} /> Importar CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Painel Lateral */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Resumo da Empresa</h3>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><MoreHorizontal size={16} /></button>
            </div>
            <div className="space-y-3">
              <StatRow icon={<Building2 size={14} />} label="Empresa" value={dadosUsuario?.empresa?.nome || '-'} color="blue" />
              <StatRow icon={<Users size={14} />} label="Total de Usuários" value="1" color="indigo" />
              <StatRow icon={<Target size={14} />} label="Meta do Mês" value="R$ 0,00" color="emerald" />
              <StatRow icon={<TrendingUp size={14} />} label="Conversão" value="0%" color="amber" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg p-4 text-white">
            <h3 className="font-semibold mb-3 text-sm">Ações Rápidas</h3>
            <div className="space-y-2">
              <QuickActionBtn icon={<Briefcase size={14} />} label="Novo Negócio" variant="white" />
              <QuickActionBtn icon={<Calendar size={14} />} label="Agendar Reunião" variant="transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponentes
function KpiCard({ title, value, trend, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  };
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left">{value}</p>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>{icon}</div>
      </div>
      <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <TrendingUp size={12} /> <span>{trend}</span> <span className="text-slate-400 dark:text-slate-500 ml-0.5">vs. mês anterior</span>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  };
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${colors[color]}`}>{icon}</div>
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

function QuickActionBtn({ icon, label, variant }) {
  const baseStyles = "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all";
  const variants = {
    white: "bg-white text-blue-600 hover:bg-blue-50 shadow-sm",
    transparent: "bg-white/10 text-white hover:bg-white/20 border border-white/20",
  };
  return <button className={`${baseStyles} ${variants[variant]}`}>{icon}{label}</button>;
}