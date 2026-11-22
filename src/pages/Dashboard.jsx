import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { buscarContatosRecentes, escutarDadosDashboard } from '@/services/dashboardService';
import PageHeader from '@/components/ui/PageHeader';
import {
  Users, Briefcase, DollarSign, TrendingUp, Plus, ArrowRight,
  Calendar, LayoutDashboard, Mail, Phone, Target, ArrowUpRight, Layers
} from 'lucide-react';

// --- COMPONENTES AUXILIARES ---

const KpiCard = ({ title, value, icon, trend, colorClass, bgClass }) => (
  <div className="bg-white dark:bg-[#0b192c] p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between transition-all duration-200 hover:border-emerald-400/60 dark:hover:border-emerald-500/40">
    <div className="flex justify-between items-start gap-2 mb-1.5">
      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-snug">
        {title}
      </p>
      <div className={`p-1.5 rounded-lg shrink-0 ${bgClass} ${colorClass}`}>
        {icon}
      </div>
    </div>
    <div>
      <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
        {value}
      </p>
      {trend && (
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
          <TrendingUp size={11} /> {trend}
        </p>
      )}
    </div>
  </div>
);

const ContatoRecenteItem = ({ contato, onClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Cliente':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300';
      case 'Em Atendimento':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div
      onClick={onClick}
      className="px-4 py-3 flex items-center justify-between hover:bg-emerald-50/40 dark:hover:bg-slate-800/40 transition-colors gap-4 group cursor-pointer"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm shrink-0 border border-emerald-200/70 dark:border-emerald-500/25">
          {contato.nome?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="min-w-0 text-left">
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {contato.nome}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {contato.cargo || 'Sem cargo'} {contato.empresa ? `• ${contato.empresa}` : ''}
          </p>
        </div>
      </div>

      <div className="w-28 sm:w-32 flex justify-center shrink-0">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(
            contato.status
          )}`}
        >
          {contato.status || 'Novo'}
        </span>
      </div>

      <div className="flex flex-col items-end gap-1 w-48 shrink-0 hidden md:flex">
        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate max-w-full">
          <Mail size={12} className="shrink-0" /> {contato.email}
        </span>
        {contato.telefone && (
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Phone size={12} className="shrink-0" /> {contato.telefone}
          </span>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function Dashboard() {
  const { dadosUsuario, dadosEmpresa } = useAuth();
  const navigate = useNavigate();

  const [dados, setDados] = useState({
    totalContatos: 0,
    negociosAbertos: 0,
    negociosGanhos: 0,
    receitaGanha: 0,
    tarefasPendentes: 0,
    totalUsuarios: 0,
  });
  const [contatosRecentes, setContatosRecentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dadosUsuario?.empresaId) return;

    buscarContatosRecentes(dadosUsuario.empresaId).then((contatos) => {
      setContatosRecentes(contatos);
      setLoading(false);
    });

    const unsubscribe = escutarDadosDashboard(dadosUsuario.empresaId, (novosDados) => {
      setDados(novosDados);
    });

    return () => unsubscribe();
  }, [dadosUsuario?.empresaId]);

  const formatarMoeda = (valor) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col px-4 sm:px-6 lg:px-7 py-5 space-y-5 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-full flex flex-col px-4 sm:px-6 lg:px-7 py-4 sm:py-5 space-y-4 text-left bg-slate-50/60 dark:bg-slate-950 transition-colors">
      <PageHeader
        icon={<LayoutDashboard size={18} />}
        title="Dashboard"
        subtitle={`Bem-vindo de volta, ${dadosUsuario?.nome?.split(' ')[0] || 'Usuário'}!`}
        action={
          <div className="flex items-center gap-2 w-full sm:w-auto mr-1">
            <button
              type="button"
              onClick={() => navigate('/app/tarefas')}
              className="flex-1 sm:flex-none bg-white dark:bg-[#0b192c] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs text-xs sm:text-sm"
            >
              <Calendar size={15} /> Agendar
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/contatos')}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 px-3.5 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs text-xs sm:text-sm"
            >
              <Plus size={15} /> Novo Contato
            </button>
          </div>
        }
      />

      {/* KPIs Compactos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <KpiCard
          title="Total de Contatos"
          value={dados.totalContatos}
          icon={<Users size={15} />}
          trend="+0% vs. mês anterior"
          bgClass="bg-emerald-50 dark:bg-emerald-500/15"
          colorClass="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          title="Negócios Abertos"
          value={dados.negociosAbertos}
          icon={<Briefcase size={15} />}
          trend="+0% vs. mês anterior"
          bgClass="bg-teal-50 dark:bg-teal-500/15"
          colorClass="text-teal-700 dark:text-teal-300"
        />
        <KpiCard
          title="Tarefas Pendentes"
          value={dados.tarefasPendentes}
          icon={<Calendar size={15} />}
          trend={null}
          bgClass="bg-amber-50 dark:bg-amber-500/15"
          colorClass="text-amber-600 dark:text-amber-400"
        />
        <KpiCard
          title="Receita Ganha"
          value={formatarMoeda(dados.receitaGanha)}
          icon={<DollarSign size={15} />}
          trend="+0% vs. mês anterior"
          bgClass="bg-emerald-50 dark:bg-emerald-500/15"
          colorClass="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Layout Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start flex-1">
        {/* Coluna Esquerda: Contatos Recentes + Resumo Operacional (preenche a área inferior) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white dark:bg-[#0b192c] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
            <div className="px-4 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Contatos Recentes
              </h2>
              <button
                type="button"
                onClick={() => navigate('/app/contatos')}
                className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                Ver todos <ArrowRight size={14} />
              </button>
            </div>

            <div className="flex-1">
              {contatosRecentes.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/15 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                    <Users size={26} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    Nenhum contato ainda
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-xs text-xs sm:text-sm">
                    Comece adicionando seu primeiro contato para gerenciar seus relacionamentos.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/app/contatos')}
                    className="bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Plus size={16} /> Adicionar Contato
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 px-4 py-2 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Nome / Cargo
                    </div>
                    <div className="w-28 sm:w-32 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Status
                    </div>
                    <div className="w-48 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden md:block">
                      Contato
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {contatosRecentes.map((contato) => (
                      <ContatoRecenteItem
                        key={contato.id}
                        contato={contato}
                        onClick={() => navigate('/app/contatos')}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bloco inferior para preencher o espaço vazio com dados úteis do pipeline */}
          <div className="bg-white dark:bg-[#0b192c] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Pulso Comercial
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/app/negocios')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                Abrir funil <ArrowRight size={13} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Negócios em Andamento
                </p>
                <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {dados.negociosAbertos}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50/75 dark:bg-emerald-950/35 border border-emerald-200/75 dark:border-emerald-800/60">
                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Negócios Ganhos
                </p>
                <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5">
                  {dados.negociosGanhos}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Receita Confirmada
                </p>
                <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {formatarMoeda(dados.receitaGanha)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna da Direita */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Meta Mensal */}
          <div className="bg-white dark:bg-[#0b192c] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Target size={16} className="text-emerald-600 dark:text-emerald-400" /> Meta Mensal
              </h2>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                75%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mb-2 overflow-hidden">
              <div
                className="bg-emerald-600 dark:bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: '75%' }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex justify-between tabular-nums">
              <span>R$ 7.500,00 alcançados</span>
              <span>Meta: R$ 10.000,00</span>
            </p>
          </div>

          {/* Resumo da Empresa */}
          <div className="bg-white dark:bg-[#0b192c] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-4">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
              Resumo da Empresa
            </h2>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Briefcase size={14} /> Empresa
                </span>
                <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[165px]">
                  {dadosEmpresa?.nome || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Users size={14} /> Total de Usuários
                </span>
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                  {dados.totalUsuarios}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <TrendingUp size={14} /> Negócios Ganhos
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {dados.negociosGanhos}
                </span>
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="bg-emerald-600 dark:bg-emerald-600/95 rounded-xl shadow-2xs p-4 text-white border border-emerald-500/40">
            <h2 className="font-bold text-sm mb-3">Ações Rápidas</h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate('/app/negocios')}
                className="w-full bg-white/10 hover:bg-white/20 transition-colors px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-between group"
              >
                <span className="flex items-center gap-2">
                  <Briefcase size={15} /> Novo Negócio
                </span>
                <ArrowUpRight
                  size={15}
                  className="opacity-70 group-hover:opacity-100 transition-opacity"
                />
              </button>
              <button
                type="button"
                onClick={() => navigate('/app/tarefas')}
                className="w-full bg-white/10 hover:bg-white/20 transition-colors px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-between group"
              >
                <span className="flex items-center gap-2">
                  <Calendar size={15} /> Agendar Reunião
                </span>
                <ArrowUpRight
                  size={15}
                  className="opacity-70 group-hover:opacity-100 transition-opacity"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}