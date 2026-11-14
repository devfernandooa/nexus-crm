import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import {
  Users, Briefcase, DollarSign, TrendingUp, Plus, ArrowRight,
  Calendar, LayoutDashboard
} from 'lucide-react';

export default function Dashboard() {
  const { dadosUsuario } = useAuth();
  const navigate = useNavigate();

  // (Aqui você pode adicionar os estados e useEffect para buscar os dados reais no futuro)

  return (
    <div className="w-full h-full flex flex-col">

      <PageHeader
        icon={<LayoutDashboard size={18} />}
        title="Dashboard"
        subtitle={`Bem-vindo de volta, ${dadosUsuario?.nome?.split(' ')[0] || 'Usuário'}!`}
        action={
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm text-sm">
              <Calendar size={16} /> Agendar
            </button>
            <button onClick={() => navigate('/app/contatos')} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm text-sm">
              <Plus size={16} /> Novo Contato
            </button>
          </div>
        }
      />

      {/* KPIs: 1 coluna no mobile, 2 em tablets, 4 no desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold !text-slate-500 uppercase tracking-wider">Total de Contatos</p>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-md"><Users size={16} /></div>
          </div>
          <div>
            <p className="text-2xl font-bold !text-slate-900 dark:!text-white">0</p>
            <p className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1"><TrendingUp size={10} /> +0% vs. mês anterior</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold !text-slate-500 uppercase tracking-wider">Negócios Abertos</p>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-md"><Briefcase size={16} /></div>
          </div>
          <div>
            <p className="text-2xl font-bold !text-slate-900 dark:!text-white">0</p>
            <p className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1"><TrendingUp size={10} /> +0% vs. mês anterior</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold !text-slate-500 uppercase tracking-wider">Tarefas Pendentes</p>
            <div className="p-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-md"><Calendar size={16} /></div>
          </div>
          <div>
            <p className="text-2xl font-bold !text-slate-900 dark:!text-white">0</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">0 vs. mês anterior</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold !text-slate-500 uppercase tracking-wider">Receita Prevista</p>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-md"><DollarSign size={16} /></div>
          </div>
          <div>
            <p className="text-2xl font-bold !text-slate-900 dark:!text-white">R$ 0,00</p>
            <p className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1"><TrendingUp size={10} /> +0% vs. mês anterior</p>
          </div>
        </div>
      </div>

      {/* Layout Principal: Contatos Recentes e Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Contatos Recentes (Ocupa 2 colunas no desktop) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="font-bold !text-slate-900 dark:!text-white">Contatos Recentes</h2>
            <button onClick={() => navigate('/app/contatos')} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={14} />
            </button>
          </div>

          <div className="p-8 text-center flex flex-col items-center justify-center flex-1">
            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-blue-500 mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold !text-slate-900 dark:!text-white mb-2">Nenhum contato ainda</h3>
            <p className="!text-slate-500 mb-6 max-w-xs text-sm">Comece adicionando seu primeiro contato para gerenciar seus relacionamentos.</p>
            <button onClick={() => navigate('/app/contatos')} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
              <Plus size={18} /> Adicionar Contato
            </button>
          </div>
        </div>

        {/* Coluna da Direita (Resumo e Ações Rápidas) */}
        <div className="flex flex-col gap-6">

          {/* Resumo da Empresa */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <h2 className="font-bold !text-slate-900 dark:!text-white mb-4">Resumo da Empresa</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="!text-slate-500 flex items-center gap-2"><Briefcase size={14} /> Empresa</span>
                <span className="font-semibold !text-slate-900 dark:!text-white">{dadosUsuario?.nomeEmpresa || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="!text-slate-500 flex items-center gap-2"><Users size={14} /> Total de Usuários</span>
                <span className="font-semibold !text-slate-900 dark:!text-white">1</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="!text-slate-500 flex items-center gap-2"><TrendingUp size={14} /> Meta do Mês</span>
                <span className="font-semibold !text-slate-900 dark:!text-white">R$ 0,00</span>
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
              <button className="w-full bg-white/10 hover:bg-white/20 transition-colors px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 text-left">
                <Calendar size={16} /> Agendar Reunião
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}