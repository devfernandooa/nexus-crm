import { useMemo, useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import {
  HelpCircle,
  Search,
  Users,
  Briefcase,
  BarChart3,
  ShieldCheck,
  Package,
  ChevronDown,
  MessageSquare,
  BookOpen,
} from 'lucide-react';

const CATEGORIAS_AJUDA = [
  {
    id: 'primeiros-passos',
    titulo: 'Primeiros Passos',
    descricao: 'Configure sua conta, dados da empresa e navegue pelos módulos principais.',
    icon: BookOpen,
    badge: 'Essencial',
  },
  {
    id: 'contatos',
    titulo: 'Contatos e Leads',
    descricao: 'Cadastre, filtre e acompanhe leads e clientes vinculados à sua operação.',
    icon: Users,
    badge: 'CRM',
  },
  {
    id: 'negocios',
    titulo: 'Negócios e Funil',
    descricao: 'Movimente oportunidades no Kanban, acompanhe etapas e filtre por responsável.',
    icon: Briefcase,
    badge: 'Vendas',
  },
  {
    id: 'relatorios',
    titulo: 'Relatórios e Exportação',
    descricao: 'Analise receita ganha, conversão, ranking de vendedores e exporte em PDF/CSV.',
    icon: BarChart3,
    badge: 'Indicadores',
  },
  {
    id: 'catalogo',
    titulo: 'Produtos e Serviços',
    descricao: 'Gerencie itens do catálogo e identifique os produtos e serviços mais vendidos.',
    icon: Package,
    badge: 'Catálogo',
  },
  {
    id: 'equipe',
    titulo: 'Equipe e Permissões',
    descricao: 'Entenda as diferenças de acesso entre Admin, Vendedor e Leitor.',
    icon: ShieldCheck,
    badge: 'Acesso',
  },
];

const FAQ_ITENS = [
  {
    id: 'visibilidade-vendedor',
    categoria: 'equipe',
    pergunta: 'Por que o vendedor vê apenas determinados negócios no Kanban e nos relatórios?',
    resposta:
      'Por padrão de segurança e visibilidade do CRM, contas com perfil de vendedor visualizam os negócios atribuídos a elas, enquanto administradores acompanham a visão geral da empresa.',
  },
  {
    id: 'exportar-relatorios',
    categoria: 'relatorios',
    pergunta: 'Como exportar os dados de negócios em CSV ou PDF?',
    resposta:
      'Na tela de Relatórios, aplique os filtros de período, ordenação ou destaque desejados e clique no botão "Exportar" no canto superior direito para baixar em CSV ou gerar o relatório em PDF.',
  },
  {
    id: 'itens-mais-vendidos',
    categoria: 'catalogo',
    pergunta: 'Como os produtos e serviços mais vendidos são contabilizados?',
    resposta:
      'Os rankings consideram os itens vinculados aos negócios marcados como ganhos dentro do período e dos filtros selecionados na tela de Relatórios.',
  },
  {
    id: 'atualizar-dados',
    categoria: 'primeiros-passos',
    pergunta: 'Os indicadores atualizam em tempo real?',
    resposta:
      'Sim. Os painéis escutam as alterações em tempo real no banco de dados e refletem novos cadastros, movimentações de etapa e atualizações assim que salvas.',
  },
];

export default function CentralDeAjuda() {
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('todas');
  const [abertaId, setAbertaId] = useState(FAQ_ITENS[0]?.id || null);

  const faqsFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return FAQ_ITENS.filter((item) => {
      const bateCategoria =
        categoriaAtiva === 'todas' || item.categoria === categoriaAtiva;
      const bateBusca =
        !termo ||
        item.pergunta.toLowerCase().includes(termo) ||
        item.resposta.toLowerCase().includes(termo);
      return bateCategoria && bateBusca;
    });
  }, [busca, categoriaAtiva]);

  return (
    <div className="w-full min-h-full flex flex-col px-4 sm:px-6 lg:px-7 py-3.5 sm:py-4 pb-32 md:pb-12 bg-slate-50/60 dark:bg-slate-950 transition-colors text-left space-y-5 overflow-x-hidden">
      <PageHeader
        icon={<HelpCircle size={18} />}
        title="Central de Ajuda"
        subtitle="Guias rápidos, dúvidas frequentes e orientações para aproveitar o Nexus Hub."
      />

      {/* Busca e Filtro Rápido */}
      <div className="bg-white dark:bg-[#0b192c] p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por dúvida, módulo ou funcionalidade (ex.: relatórios, vendedor, CSV)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCategoriaAtiva('todas')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              categoriaAtiva === 'todas'
                ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            Todos os tópicos
          </button>

          {CATEGORIAS_AJUDA.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                setCategoriaAtiva((prev) => (prev === cat.id ? 'todas' : cat.id))
              }
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                categoriaAtiva === cat.id
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              {cat.titulo}
            </button>
          ))}
        </div>
      </div>

      {/* Grade de Categorias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CATEGORIAS_AJUDA.map((cat) => {
          const IconComponent = cat.icon;
          const selecionada = categoriaAtiva === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                setCategoriaAtiva((prev) => (prev === cat.id ? 'todas' : cat.id))
              }
              className={`text-left bg-white dark:bg-[#0b192c] p-4 rounded-xl border transition-all shadow-2xs flex flex-col justify-between gap-3 ${
                selecionada
                  ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                  : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-400/70'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/25">
                  <IconComponent size={18} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {cat.badge}
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {cat.titulo}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {cat.descricao}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Perguntas Frequentes */}
      <div className="bg-white dark:bg-[#0b192c] p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Perguntas Frequentes
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {faqsFiltradas.length} resposta(s)
          </span>
        </div>

        {faqsFiltradas.length > 0 ? (
          <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
            {faqsFiltradas.map((item) => {
              const aberta = abertaId === item.id;
              return (
                <div key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => setAbertaId((prev) => (prev === item.id ? null : item.id))}
                    className="w-full flex items-center justify-between gap-3 text-left py-1"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {item.pergunta}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 shrink-0 transition-transform ${
                        aberta ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                      }`}
                    />
                  </button>

                  {aberta && (
                    <p className="mt-1.5 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed pr-6">
                      {item.resposta}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
            Nenhuma dúvida encontrada para esse filtro. Tente outro termo ou limpe a busca.
          </p>
        )}
      </div>

      {/* Rodapé / Contato de Suporte */}
      <div className="bg-emerald-50/70 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 shrink-0">
            <MessageSquare size={17} />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Ainda precisa de ajuda?
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Fale com o administrador da conta ou envie os detalhes do que você precisa para evoluirmos esta seção.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}