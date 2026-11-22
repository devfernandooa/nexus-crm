import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../contexts/ThemeToggle';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Kanban,
  Palette,
  Users,
  BarChart3,
  Layers,
  ShieldCheck,
  TrendingUp,
  MessageCircle,
  Send,
  ListChecks,
  Sparkles,
  Building2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

// Substitua pelo número real com DDI + DDD (ex.: 5575999999999)
const WHATSAPP_NUMBER = '5575999999999';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Olá! Gostaria de conhecer melhor o Nexus Hub.'
)}`;

const SLIDES_SISTEMA = [
  {
    id: 'kanban',
    tag: 'Funil Kanban & Cores',
    titulo: 'Pipeline visual com etapas coloridas',
    subtitulo: 'Acompanhe negócios em aberto, ganhos e perdidos em tempo real.',
    kpi1Label: 'Em Aberto',
    kpi1Valor: 'R$ 24.185,80',
    kpi2Label: 'Ganhos',
    kpi2Valor: 'R$ 18.400,00',
    kpi3Label: 'Conversão',
    kpi3Valor: '34,8%',
    colunas: [
      {
        nome: 'Prospecção',
        corHeader: 'bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100',
        cardTitulo: 'Plano Corporativo',
        cardValor: 'R$ 6.897,00',
        cardMeta: 'Rural Master • 2 itens',
      },
      {
        nome: 'Qualificação',
        corHeader: 'bg-teal-100/80 dark:bg-teal-950/80 text-teal-950 dark:text-teal-100',
        cardTitulo: 'Expansão Comercial',
        cardValor: 'R$ 11.200,00',
        cardMeta: 'Asficol • 1 item',
      },
      {
        nome: 'Ganhos',
        corHeader: 'bg-emerald-200/75 dark:bg-emerald-900/70 text-emerald-950 dark:text-emerald-100',
        cardTitulo: 'Contrato Anual',
        cardValor: 'R$ 18.400,00',
        cardMeta: 'Fechado hoje',
      },
    ],
  },
  {
    id: 'lista-metricas',
    tag: 'Visão em Lista & Indicadores',
    titulo: 'Leitura rápida para decisões diárias',
    subtitulo: 'Alterne entre Kanban e Lista sem perder o contexto da operação.',
    kpi1Label: 'Oportunidades',
    kpi1Valor: '42 ativas',
    kpi2Label: 'Ticket Médio',
    kpi2Valor: 'R$ 4.320,00',
    kpi3Label: 'Meta Mensal',
    kpi3Valor: '82% atingida',
    colunas: [
      {
        nome: 'Prioridade Alta',
        corHeader: 'bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100',
        cardTitulo: 'Proposta Haras',
        cardValor: 'R$ 8.990,00',
        cardMeta: 'Retorno hoje às 15h',
      },
      {
        nome: 'Em Análise',
        corHeader: 'bg-cyan-100/80 dark:bg-cyan-950/80 text-cyan-950 dark:text-cyan-100',
        cardTitulo: 'Pacote Serviços',
        cardValor: 'R$ 3.450,00',
        cardMeta: 'Aguardando aprovação',
      },
      {
        nome: 'Concluídos',
        corHeader: 'bg-emerald-200/75 dark:bg-emerald-900/70 text-emerald-950 dark:text-emerald-100',
        cardTitulo: 'Renovação Trimestral',
        cardValor: 'R$ 5.960,00',
        cardMeta: 'Pagamento confirmado',
      },
    ],
  },
  {
    id: 'equipe-multi-tenant',
    tag: 'Multi-Tenant & Equipe',
    titulo: 'Cada empresa com seu espaço isolado',
    subtitulo: 'Gerencie equipe, contatos, produtos, tarefas e relatórios em um só lugar.',
    kpi1Label: 'Membros Ativos',
    kpi1Valor: '8 usuários',
    kpi2Label: 'Contatos',
    kpi2Valor: '310 registros',
    kpi3Label: 'Tarefas Hoje',
    kpi3Valor: '14 pendentes',
    colunas: [
      {
        nome: 'Novos Leads',
        corHeader: 'bg-lime-100/80 dark:bg-lime-950/80 text-lime-950 dark:text-lime-100',
        cardTitulo: 'Lead Indústria',
        cardValor: 'R$ 9.200,00',
        cardMeta: 'Responsável: Marina',
      },
      {
        nome: 'Follow-up',
        corHeader: 'bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100',
        cardTitulo: 'Reunião Técnica',
        cardValor: 'R$ 5.400,00',
        cardMeta: 'Responsável: Lucas',
      },
      {
        nome: 'Aprovado',
        corHeader: 'bg-emerald-200/75 dark:bg-emerald-900/70 text-emerald-950 dark:text-emerald-100',
        cardTitulo: 'Implantação Completa',
        cardValor: 'R$ 14.600,00',
        cardMeta: 'Início imediato',
      },
    ],
  },
];

const PASSOS = [
  {
    numero: '01',
    icon: Palette,
    titulo: 'Monte seu funil e suas cores',
    descricao:
      'Crie etapas sob medida, defina cores suaves para cada fase e mantenha o quadro fácil de escanear.',
  },
  {
    numero: '02',
    icon: ListChecks,
    titulo: 'Conduza negócios e tarefas',
    descricao:
      'Vincule contatos e produtos, acompanhe prazos e mova oportunidades entre etapas com poucos cliques.',
  },
  {
    numero: '03',
    icon: BarChart3,
    titulo: 'Acompanhe resultados e relatórios',
    descricao:
      'Veja o que está em aberto ou fechado e exporte relatórios para apoiar decisões da equipe.',
  },
];

const RECURSOS = [
  {
    icon: Kanban,
    titulo: 'Funil Kanban e Lista',
    descricao:
      'Visualize oportunidades em colunas ou em tabela, alternando o modo de trabalho quando precisar.',
  },
  {
    icon: Palette,
    titulo: 'Paleta de Cores por Etapa',
    descricao:
      'Escolha entre cores suaves pré-definidas ou restaure o padrão inicial sem perder a identidade visual.',
  },
  {
    icon: TrendingUp,
    titulo: 'KPIs em Tempo Real',
    descricao:
      'Acompanhe valores em aberto, ganhos e perdas com números claros e alinhamento responsivo.',
  },
  {
    icon: Users,
    titulo: 'Contatos e Gestão de Equipe',
    descricao:
      'Centralize clientes, leads, permissões e convites em um ambiente multi-tenant seguro.',
  },
  {
    icon: Layers,
    titulo: 'Produtos, Serviços e Tarefas',
    descricao:
      'Calcule valores com itens selecionados e mantenha compromissos ligados a cada negociação.',
  },
  {
    icon: ShieldCheck,
    titulo: 'Tema Claro, Escuro e Mobile',
    descricao:
      'Experiência consistente no desktop e no mobile, com suporte nativo ao tema claro e escuro.',
  },
];

const DIFERENCIAIS = [
  'Isolamento de dados por empresa com regras de acesso multi-tenant',
  'Visual limpo em tons de verde esmeralda com excelente contraste em modo claro e escuro',
  'Layout responsivo pensado para telas amplas, tablets e smartphones',
  'Fluxos diretos para reduzir cliques desnecessários no dia a dia comercial',
];

function useRevealOnScroll(scrollContainerRef) {
  const [visivel, setVisivel] = useState(false);
  const elementoRef = useRef(null);

  useEffect(() => {
    const alvo = elementoRef.current;
    if (!alvo) return;

    const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduzMovimento) {
      setVisivel(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisivel(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: scrollContainerRef?.current || null,
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(alvo);
    return () => observer.disconnect();
  }, [scrollContainerRef]);

  return { elementoRef, visivel };
}

function RevealSection({ id, className = '', scrollContainerRef, children }) {
  const { elementoRef, visivel } = useRevealOnScroll(scrollContainerRef);

  return (
    <section
      id={id}
      ref={elementoRef}
      className={`transition-all duration-700 ease-out will-change-transform ${visivel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        } ${className}`}
    >
      {children}
    </section>
  );
}

export default function LandingPage() {
  const scrollContainerRef = useRef(null);
  const [slideAtual, setSlideAtual] = useState(0);
  const [pausarAutoplay, setPausarAutoplay] = useState(false);

  // Estado do formulário de contato
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviadoSucesso, setEnviadoSucesso] = useState(false);

  useEffect(() => {
    if (pausarAutoplay) return;
    const timer = setInterval(() => {
      setSlideAtual((prev) => (prev + 1) % SLIDES_SISTEMA.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [pausarAutoplay]);

  const irParaSlide = (index) => {
    setSlideAtual((index + SLIDES_SISTEMA.length) % SLIDES_SISTEMA.length);
  };

  const handleContatoSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !mensagem.trim()) {
      toast.error('Preencha nome, e-mail e mensagem.');
      return;
    }

    setEnviando(true);
    setTimeout(() => {
      setEnviando(false);
      setEnviadoSucesso(true);
      toast.success('Mensagem enviada! Em breve nossa equipe entrará em contato.');
      setNome('');
      setEmail('');
      setEmpresa('');
      setMensagem('');
    }, 500);
  };

  const slideAtivo = SLIDES_SISTEMA[slideAtual];

  return (
    <div
      ref={scrollContainerRef}
      className="h-screen w-full overflow-y-auto scrollbar-thin scroll-smooth flex flex-col bg-slate-50 font-sans text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white relative"
    >
      {/* Header Sticky */}
      <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-[#0b192c]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/90 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold text-lg flex items-center justify-center shadow-2xs transition-transform duration-200 group-hover:scale-105">
              N
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Nexus Hub
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a
              href="#como-funciona"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Como Funciona
            </a>
            <a
              href="#recursos"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Recursos
            </a>
            <a
              href="#diferenciais"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Diferenciais
            </a>
            <a
              href="#contato"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Contato
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

            <Link
              to="/login"
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80 transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 inline-flex items-center gap-1.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5"
            >
              <span>Criar conta</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1">
        {/* Seção 1: Hero + Carrossel do Sistema */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 lg:pt-14 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-6 space-y-5 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>CRM & Operação Comercial • Nexus Hub</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] !text-slate-900 dark:!text-white">
                Gerencie seus clientes com{' '}
                <span className="text-emerald-600 dark:text-emerald-400">
                  inteligência.
                </span>
              </h1>

              <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Organize seu funil de vendas, contatos, produtos, tarefas e relatórios em um ambiente
                rápido, responsivo e pronto para acompanhar o ritmo da sua equipe.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Link
                  to="/cadastro"
                  className="px-6 py-3 rounded-lg text-sm sm:text-base font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 inline-flex items-center justify-center gap-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5"
                >
                  <span>Criar minha conta</span>
                  <ArrowRight size={17} />
                </Link>
                <a
                  href="#contato"
                  className="px-6 py-3 rounded-lg text-sm sm:text-base font-semibold bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 inline-flex items-center justify-center transition-colors"
                >
                  Falar com a equipe
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Kanban & Lista
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Cores por etapa
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Claro & Escuro
                </span>
              </div>
            </div>

            {/* Carrossel Interativo com Telas Ilustrativas do Nexus Hub */}
            <div
              className="lg:col-span-6"
              onMouseEnter={() => setPausarAutoplay(true)}
              onMouseLeave={() => setPausarAutoplay(false)}
            >
              <div className="rounded-2xl bg-white dark:bg-[#0b192c] border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
                {/* Barra Superior do Carrossel */}
                <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {slideAtivo.tag}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => irParaSlide(slideAtual - 1)}
                      aria-label="Slide anterior"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => irParaSlide(slideAtual + 1)}
                      aria-label="Próximo slide"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Conteúdo do Slide */}
                <div key={slideAtivo.id} className="p-4 sm:p-5 space-y-3.5 text-left transition-opacity duration-300">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {slideAtivo.titulo}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {slideAtivo.subtitulo}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      Prévia do sistema
                    </span>
                  </div>

                  {/* Mini KPIs do Slide */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/75 border border-slate-200/70 dark:border-slate-800">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                        {slideAtivo.kpi1Label}
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 truncate">
                        {slideAtivo.kpi1Valor}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 truncate">
                        {slideAtivo.kpi2Label}
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5 truncate">
                        {slideAtivo.kpi2Valor}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/75 border border-slate-200/70 dark:border-slate-800">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                        {slideAtivo.kpi3Label}
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 truncate">
                        {slideAtivo.kpi3Valor}
                      </p>
                    </div>
                  </div>

                  {/* Mini Colunas Ilustrativas */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {slideAtivo.colunas.map((col) => (
                      <div
                        key={col.nome}
                        className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/40"
                      >
                        <div className={`px-3 py-2 border-b border-slate-200/70 dark:border-slate-800 ${col.corHeader}`}>
                          <p className="text-[11px] font-semibold truncate">{col.nome}</p>
                        </div>
                        <div className="p-2.5">
                          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {col.cardTitulo}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {col.cardMeta}
                            </p>
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 tabular-nums">
                              {col.cardValor}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Indicadores do Carrossel */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      {SLIDES_SISTEMA.map((item, idx) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => irParaSlide(idx)}
                          aria-label={`Ir para ${item.tag}`}
                          className={`h-2 rounded-full transition-all duration-200 ${idx === slideAtual
                            ? 'w-6 bg-emerald-600 dark:bg-emerald-400'
                            : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {slideAtual + 1} / {SLIDES_SISTEMA.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 2: Como Funciona (3 Passos) */}
        <RevealSection
          id="como-funciona"
          scrollContainerRef={scrollContainerRef}
          className="border-t border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0b192c]/60 py-14 lg:py-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="max-w-2xl text-left space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Como Funciona
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Do primeiro contato ao fechamento em três passos
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Fluxo simples e visual para sua equipe ganhar ritmo sem perder o controle das etapas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PASSOS.map(({ numero, icon: Icon, titulo, descricao }) => (
                <div
                  key={numero}
                  className="p-6 rounded-xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400/70 dark:hover:border-emerald-500/40 transition-all duration-200 hover:-translate-y-0.5 text-left space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100/85 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                      <Icon size={19} />
                    </div>
                    <span className="text-xs font-extrabold tracking-widest text-emerald-600/80 dark:text-emerald-400/80">
                      {numero}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{titulo}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {descricao}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>

        {/* Seção 3: Recursos do Sistema */}
        <RevealSection
          id="recursos"
          scrollContainerRef={scrollContainerRef}
          className="border-t border-slate-200/80 dark:border-slate-800/90 py-14 lg:py-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="max-w-2xl text-left space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Recursos
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Tudo o que você precisa para conduzir suas vendas
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Ferramentas integradas para acompanhar negócios, contatos, equipe e métricas em um único lugar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {RECURSOS.map(({ icon: Icon, titulo, descricao }) => (
                <div
                  key={titulo}
                  className="p-5 rounded-xl bg-white dark:bg-[#0b192c] border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400/75 dark:hover:border-emerald-500/45 transition-all duration-200 hover:-translate-y-0.5 text-left space-y-2.5 shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{titulo}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {descricao}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>

        {/* Seção 4: Diferenciais & Operação */}
        <RevealSection
          id="diferenciais"
          scrollContainerRef={scrollContainerRef}
          className="border-t border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0b192c]/60 py-14 lg:py-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 text-left space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Diferenciais
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Feito para manter clareza mesmo quando a operação cresce
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Cada tela foi pensada para evitar excessos visuais, destacar o que importa e
                  funcionar com consistência tanto em computadores quanto em dispositivos móveis.
                </p>

                <ul className="space-y-2.5 pt-2">
                  {DIFERENCIAIS.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                    >
                      <CheckCircle2
                        size={17}
                        className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-6">
                <div className="rounded-2xl bg-emerald-600 dark:bg-emerald-500/15 border border-emerald-500/30 p-6 sm:p-8 text-left space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white dark:text-emerald-200">
                    <Building2 size={14} />
                    <span>Pronto para sua empresa</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white dark:text-emerald-100">
                    Comece agora e leve o padrão Nexus Hub para sua rotina
                  </h3>
                  <p className="text-sm text-emerald-50/90 dark:text-emerald-200/80 leading-relaxed">
                    Crie sua conta em poucos passos ou entre para explorar o painel e organizar suas
                    oportunidades.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Link
                      to="/cadastro"
                      className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-white text-emerald-700 hover:bg-emerald-50 transition-colors"
                    >
                      Criar minha conta
                    </Link>
                    <Link
                      to="/login"
                      className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-700/65 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 border border-white/20 dark:border-transparent transition-colors"
                    >
                      Fazer Login
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>

        {/* Seção 5: Formulário de Contato */}
        <RevealSection
          id="contato"
          scrollContainerRef={scrollContainerRef}
          className="border-t border-slate-200/80 dark:border-slate-800/90 py-14 lg:py-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 text-left space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Contato
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Fale com a gente
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Tem dúvidas sobre o fluxo do sistema, implantação para sua equipe ou planos?
                  Envie uma mensagem ou chame direto no WhatsApp.
                </p>

                <div className="space-y-3 pt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <Mail size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>contato@nexushub.com.br</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Atendimento comercial e suporte</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Feira de Santana • Bahia</span>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 dark:text-emerald-300 dark:border-emerald-500/30 transition-colors"
                  >
                    <MessageCircle size={16} />
                    <span>Chamar no WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-7">
                <form
                  onSubmit={handleContatoSubmit}
                  className="rounded-2xl bg-white dark:bg-[#0b192c] border border-slate-200/90 dark:border-slate-800 p-6 space-y-4 text-left shadow-2xs"
                >
                  {enviadoSucesso && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>Recebemos sua mensagem! Retornaremos em breve.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Nome *
                      </label>
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Seu nome completo"
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="voce@empresa.com"
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={empresa}
                      onChange={(e) => setEmpresa(e.target.value)}
                      placeholder="Nome da sua empresa"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Mensagem *
                    </label>
                    <textarea
                      rows={4}
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      placeholder="Como podemos ajudar sua equipe?"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={enviando}
                      className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 inline-flex items-center gap-2 transition-colors disabled:opacity-60"
                    >
                      <Send size={15} />
                      <span>{enviando ? 'Enviando...' : 'Enviar mensagem'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </RevealSection>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#0b192c] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold text-sm flex items-center justify-center">
                  N
                </div>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  Nexus Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestão comercial, funil configurável e visão clara para sua equipe.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
              <a href="#como-funciona" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Como Funciona
              </a>
              <a href="#recursos" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Recursos
              </a>
              <a href="#contato" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Contato
              </a>
              <Link to="/login" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Entrar
              </Link>
              <Link to="/cadastro" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Criar Conta
              </Link>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <p>© {new Date().getFullYear()} Nexus Hub. Todos os direitos reservados.</p>
            <span>Versão 1.0 • Pro</span>
          </div>
        </div>
      </footer>


      {/* Botões Flutuantes (Tema + WhatsApp com efeito sonar) */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-center gap-3">
        <div
          className="w-11 h-11 rounded-full bg-white/95 dark:bg-[#0b192c]/95 border border-slate-200/90 dark:border-slate-700/90 text-slate-700 dark:text-slate-200 flex items-center justify-center"
        >
          <ThemeToggle />
        </div>

        <div className="relative flex items-center justify-center w-12 h-12">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full bg-emerald-500/40 dark:bg-emerald-400/35 animate-ping"
          />
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Falar no WhatsApp"
            title="Falar no WhatsApp"
            className="relative z-10 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
          >
            <MessageCircle size={22} />
          </a>
        </div>
      </div>
    </div>
  );
}