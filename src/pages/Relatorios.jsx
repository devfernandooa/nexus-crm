import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { buscarDadosRelatorio } from '@/services/relatorioService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import PageHeader from '@/components/ui/PageHeader';
import { Users, Briefcase, TrendingUp, Target, Download, FileText, Printer, ChevronDown, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Relatorios() {
  const { dadosUsuario } = useAuth();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuExportarAberto, setMenuExportarAberto] = useState(false);

  useEffect(() => {
    if (!dadosUsuario?.empresaId) return;

    async function carregarDados() {
      const resultado = await buscarDadosRelatorio(dadosUsuario.empresaId);
      if (resultado.sucesso) {
        setDados(resultado.dados);
      }
      setLoading(false);
    }

    carregarDados();
  }, [dadosUsuario?.empresaId]);

  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  function handleExportar(tipo) {
    setMenuExportarAberto(false);
    toast.success(`Exportação em ${tipo.toUpperCase()} iniciada...`);
  }

  if (loading) return <div className="p-8 !text-slate-500">Carregando relatórios...</div>;
  if (!dados) return <div className="p-8 !text-slate-500">Nenhum dado encontrado.</div>;

  const dadosBarras = [
    { name: 'Em Aberto', valor: dados.valorAberto, fill: '#3b82f6' },
    { name: 'Ganhos', valor: dados.valorGanho, fill: '#10b981' },
    { name: 'Perdidos', valor: dados.valorPerdido, fill: '#ef4444' },
  ];

  return (
    <div className="w-full h-full flex flex-col">

      <PageHeader
        icon={<BarChart3 size={18} />}
        title="Relatórios"
        subtitle="Visão geral do desempenho da sua empresa."
        action={
          <div className="relative w-full md:w-auto">
            <button
              onClick={() => setMenuExportarAberto(!menuExportarAberto)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors w-full md:w-auto shadow-sm"
            >
              <Download size={16} /> Exportar <ChevronDown size={14} />
            </button>

            {menuExportarAberto && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10 py-1">
                <button onClick={() => handleExportar('pdf')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                  <Printer size={14} /> Imprimir / PDF
                </button>
                <button onClick={() => handleExportar('csv')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                  <FileText size={14} /> Exportar CSV
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* KPIs: Mobile First (1 coluna no mobile, 2 no tablet, 4 no desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg"><Users size={20} /></div>
          <div>
            <p className="text-[10px] font-bold !text-slate-500 uppercase tracking-wider">Total de Contatos</p>
            <p className="text-xl font-bold !text-slate-900 dark:!text-white">{dados.totalContatos}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-lg"><Briefcase size={20} /></div>
          <div>
            <p className="text-[10px] font-bold !text-slate-500 uppercase tracking-wider">Total de Negócios</p>
            <p className="text-xl font-bold !text-slate-900 dark:!text-white">{dados.totalNegocios}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
          <div>
            <p className="text-[10px] font-bold !text-slate-500 uppercase tracking-wider">Receita Ganha</p>
            <p className="text-xl font-bold text-emerald-600">{formatarMoeda(dados.valorGanho)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-lg"><Target size={20} /></div>
          <div>
            <p className="text-[10px] font-bold !text-slate-500 uppercase tracking-wider">Taxa de Conversão</p>
            <p className="text-xl font-bold !text-slate-900 dark:!text-white">{dados.taxaConversao}%</p>
          </div>
        </div>
      </div>

      {/* Gráficos: 1 coluna no mobile, 2 no desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">

        {/* Gráfico de Pizza */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold !text-slate-900 dark:!text-white mb-2">Status dos Negócios</h2>
          {dados.dadosPizza.length > 0 ? (
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dados.dadosPizza}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}  // Ajustado para mobile
                    outerRadius={75}  // Ajustado para mobile
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {dados.dadosPizza.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center !text-slate-500 py-10 text-sm">Nenhum negócio cadastrado.</p>
          )}
        </div>

        {/* Gráfico de Barras */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold !text-slate-900 dark:!text-white mb-2">Comparativo Financeiro (R$)</h2>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosBarras} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(value) => formatarMoeda(value)}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {dadosBarras.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}