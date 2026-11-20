import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { buscarDadosDashboard, buscarContatosRecentes } from '@/services/dashboardService';
import PageHeader from '@/components/ui/PageHeader';
import {
  Users, Briefcase, DollarSign, TrendingUp, Plus, ArrowRight,
  Calendar, LayoutDashboard, CheckSquare, Mail, Phone
} from 'lucide-react';

export default function Dashboard() {
  const { user, dadosUsuario, dadosEmpresa } = useAuth();
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

    async function carregarDados() {
      const resultado = await buscarDadosDashboard(dadosUsuario.empresaId);
      if (resultado.sucesso) {
        setDados(resultado.dados);
      }

      const contatos = await buscarContatosRecentes(dadosUsuario.empresaId);
      setContatosRecentes(contatos);

      setLoading(false);
    }

    carregarDados();
  }, [dadosUsuario?.empresaId]);

  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  if (loading) {
    return <div className="p-8 !text-slate-500">Carregando dashboard...</div>;
  }

  return (
    <div className="w-full h-full flex flex-col">

      <PageHeader
        icon={<LayoutDashboard size={18} />}
        title="Dashboard"
        subtitle={`Bem-vindo de volta, ${dadosUsuario?.nome?.split(' ')[0] || 'Usuário'}!`}
        action={
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => navigate('/app/tarefas')} className="flex-1 md:flex-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm text-sm">
              <Calendar size={16} /> Agendar
            </button>
            <button onClick={() => navigate('/app/contatos')} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm text-sm">
              <Plus size={16} /> Novo Contato
            </button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold !text-slate-500 uppercase tracking-wider">Total de Contatos</p>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-md"><Users size={16} /></div>
          </div>
          <div>
            <p className="text-2xl font-bold !text-slate-900 dark:!text-white">{dados.totalContatos}</p>
            <p className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1"><TrendingUp size={10} /> +0% vs. mês anterior</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold !text-slate-500 uppercase tracking-wider">Negócios Abertos</p>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-md"><Briefcase size={16} /></div>
          </div>
          <div>
            <p className="text-2xl font-bold !text-slate-900 dark:!text-white">{dados.negociosAbertos}</p>
            <p className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1"><TrendingUp size={10} /> +0% vs. mês anterior</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold !text-slate-500 uppercase tracking-wider">Tarefas Pendentes</p>
            <div className="p-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-md"><Calendar size={16} /></div>
          </div>
          <div>
            <p className="text-2xl font-bold !text-slate-900 dark:!text-white">{dados.tarefasPendentes}</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">0 vs. mês anterior</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold !text-slate-500 uppercase tracking-wider">Receita Ganha</p>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-md"><DollarSign size={16} /></div>
          </div>
          <div>
            <p className="text-2xl font-bold !text-slate-900 dark:!text-white">{formatarMoeda(dados.receitaGanha)}</p>
            <p className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1"><TrendingUp size={10} /> +0% vs. mês anterior</p>
          </div>
        </div>
      </div>

      {/* Layout Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Contatos Recentes */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="font-bold !text-slate-900 dark:!text-white">Contatos Recentes</h2>
            <button onClick={() => navigate('/app/contatos')} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={14} />
            </button>
          </div>

          <div className="flex-1">
            {contatosRecentes.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-blue-500 mb-4">
                  <Users size={32} />
                </div>
                <h3 className="text-lg font-bold !text-slate-900 dark:!text-white mb-2">Nenhum contato ainda</h3>
                <p className="!text-slate-500 mb-6 max-w-xs text-sm">Comece adicionando seu primeiro contato para gerenciar seus relacionamentos.</p>
                <button onClick={() => navigate('/app/contatos')} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                  <Plus size={18} /> Adicionar Contato
                </button>
              </div>
            ) : (
              <>
                {/* CABEÇALHO DA LISTA */}
                <div className="flex items-center gap-4 px-4 py-2 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex-1 text-[10px] font-bold uppercase tracking-wider !text-slate-500">Nome / Cargo</div>
                  <div className="w-32 text-center text-[10px] font-bold uppercase tracking-wider !text-slate-500">Status</div>
                  <div className="w-48 text-right text-[10px] font-bold uppercase tracking-wider !text-slate-500 hidden md:block">Contato</div>
                </div>

                {/* LISTA DE CONTATOS */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {contatosRecentes.map(contato => (
                    <div key={contato.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors gap-4">

                      {/* Avatar + Nome + Cargo */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">
                          {contato.nome?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold !text-slate-900 dark:!text-white truncate">{contato.nome}</p>
                          <p className="text-xs !text-slate-500 truncate">{contato.cargo || 'Sem cargo'} {contato.empresa ? `na ${contato.empresa}` : ''}</p>
                        </div>
                      </div>

                      {/* Status (Centralizado) */}
                      <div className="w-32 flex justify-center shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${contato.status === 'Cliente'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : contato.status === 'Em Atendimento'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'
                          }`}>
                          {contato.status || 'Novo'}
                        </span>
                      </div>

                      {/* Contato (Email/Telefone) */}
                      <div className="flex flex-col items-end gap-1 w-48 shrink-0 hidden md:flex">
                        <span className="text-xs !text-slate-500 flex items-center gap-1 truncate max-w-full"><Mail size={12} /> {contato.email}</span>
                        {contato.telefone && (
                          <span className="text-xs !text-slate-500 flex items-center gap-1"><Phone size={12} /> {contato.telefone}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        {/* Coluna da Direita */}
        <div className="flex flex-col gap-6">

          {/* Resumo da Empresa */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <h2 className="font-bold !text-slate-900 dark:!text-white mb-4">Resumo da Empresa</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="!text-slate-500 flex items-center gap-2"><Briefcase size={14} /> Empresa</span>
                <span className="font-semibold !text-slate-900 dark:!text-white truncate max-w-[150px]">{dadosEmpresa?.nome || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="!text-slate-500 flex items-center gap-2"><Users size={14} /> Total de Usuários</span>
                <span className="font-semibold !text-slate-900 dark:!text-white">{dados.totalUsuarios}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="!text-slate-500 flex items-center gap-2"><TrendingUp size={14} /> Negócios Ganhos</span>
                <span className="font-semibold !text-emerald-600">{dados.negociosGanhos}</span>
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="bg-blue-600 rounded-xl shadow-sm p-5 text-white">
            <h2 className="font-bold mb-4">Ações Rápidas</h2>
            <div className="space-y-2">
              <button onClick={() => navigate('/app/negocios')} className="w-full bg-white/10 hover:bg-white/20 transition-colors px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 text-left">
                <Briefcase size={16} /> Novo Negócio
              </button>
              <button onClick={() => navigate('/app/tarefas')} className="w-full bg-white/10 hover:bg-white/20 transition-colors px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 text-left">
                <Calendar size={16} /> Agendar Reunião
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}