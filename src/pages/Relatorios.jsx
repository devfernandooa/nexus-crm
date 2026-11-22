import { db } from '@/firebase-config';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNegociosKanban } from '@/features/negocios/useNegociosKanban';
import { buscarDadosRelatorio, buscarNegociosParaExportacao } from '@/services/relatorioService';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import PageHeader from '@/components/ui/PageHeader';
import {
  Users,
  Briefcase,
  TrendingUp,
  Target,
  Download,
  FileText,
  Printer,
  ChevronDown,
  BarChart3,
  Award,
  Package,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function parseValorNumerico(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  if (typeof valor === 'string') {
    const limpo = valor.replace(/\s+/g, '').replace('R$', '').trim();
    const normalizado =
      limpo.includes(',') && limpo.includes('.')
        ? limpo.replace(/\./g, '').replace(',', '.')
        : limpo.replace(',', '.');
    const num = Number(normalizado.replace(/[^\d.-]/g, ''));
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
}

function extrairDataMillis(item) {
  const candidato = item?.dataCriacao ?? item?.criadoEm ?? item?.createdAt ?? null;
  if (!candidato) return 0;
  if (typeof candidato.toMillis === 'function') return candidato.toMillis();
  if (typeof candidato.toDate === 'function') return candidato.toDate().getTime();
  if (candidato instanceof Date) return candidato.getTime();
  const parsed = Date.parse(String(candidato));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizarTexto(texto) {
  return String(texto || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function identificarTipoPorTexto(texto) {
  const s = normalizarTexto(texto);
  if (!s) return null;

  if (
    s.includes('perd') ||
    s.includes('cancel') ||
    s === 'lost' ||
    s === 'perdido' ||
    s === 'perdidos'
  ) {
    return 'perdido';
  }

  if (
    s.includes('ganh') ||
    s.includes('won') ||
    s.includes('fechad') ||
    s.includes('concluid') ||
    s === 'ganho' ||
    s === 'ganhos'
  ) {
    return 'ganho';
  }

  return null;
}

function extrairNomeVendedor(negocio, mapaUsuarios, fallbackNome) {
  const direto =
    negocio?.vendedorNome ||
    negocio?.responsavelNome ||
    negocio?.responsavel ||
    negocio?.vendedor ||
    negocio?.criadoPorNome;

  if (direto && String(direto).trim()) return String(direto).trim();

  const uid =
    negocio?.vendedorId ||
    negocio?.responsavelId ||
    negocio?.usuarioId ||
    negocio?.criadoPor;

  if (uid && mapaUsuarios[String(uid)]) {
    return mapaUsuarios[String(uid)];
  }

  return fallbackNome || 'Equipe Comercial';
}

export default function Relatorios() {
  const { dadosUsuario } = useAuth();
  const { negocios: negociosKanban, colunas, loading: loadingKanban } = useNegociosKanban(
    dadosUsuario?.empresaId
  );

  const [totalContatos, setTotalContatos] = useState(0);
  const [produtosCatalogo, setProdutosCatalogo] = useState([]);
  const [membrosEquipe, setMembrosEquipe] = useState([]);
  const [loadingExtra, setLoadingExtra] = useState(true);

  const [filtroDestaque, setFiltroDestaque] = useState('todos');
  const [ordenacao, setOrdenacao] = useState('data_desc');
  const [periodo, setPeriodo] = useState('todos');

  const [menuExportarAberto, setMenuExportarAberto] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    if (!dadosUsuario?.empresaId) return;

    let ativo = true;
    setLoadingExtra(true);

    buscarDadosRelatorio(dadosUsuario.empresaId).then((res) => {
      if (ativo && res?.sucesso && res.dados) {
        setTotalContatos(Number(res.dados.totalContatos) || 0);
      }
    });

    const qContatos = query(
      collection(db, 'contatos'),
      where('empresaId', '==', dadosUsuario.empresaId)
    );
    const unsubContatos = onSnapshot(qContatos, (snap) => {
      if (ativo) setTotalContatos(snap.size);
    });

    const qProdutos = query(
      collection(db, 'produtos'),
      where('empresaId', '==', dadosUsuario.empresaId)
    );
    const unsubProdutos = onSnapshot(qProdutos, (snap) => {
      if (ativo) {
        setProdutosCatalogo(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    });

    const qUsuarios = query(
      collection(db, 'usuarios'),
      where('empresaId', '==', dadosUsuario.empresaId)
    );
    const unsubUsuarios = onSnapshot(
      qUsuarios,
      (snap) => {
        if (ativo) {
          setMembrosEquipe(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoadingExtra(false);
        }
      },
      () => {
        if (ativo) setLoadingExtra(false);
      }
    );

    return () => {
      ativo = false;
      unsubContatos();
      unsubProdutos();
      unsubUsuarios();
    };
  }, [dadosUsuario?.empresaId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setMenuExportarAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatarMoeda = (valor) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      Number(valor) || 0
    );

  const mapaColunas = useMemo(() => {
    const porId = {};
    (colunas || []).forEach((col) => {
      if (col?.id) {
        porId[String(col.id)] = col.titulo || String(col.id);
      }
    });
    return porId;
  }, [colunas]);

  const mapaUsuarios = useMemo(() => {
    const map = {};
    (membrosEquipe || []).forEach((m) => {
      if (m?.id) map[String(m.id)] = m.nome || m.email?.split('@')[0] || 'Membro';
      if (m?.uid) map[String(m.uid)] = m.nome || m.email?.split('@')[0] || 'Membro';
    });
    if (dadosUsuario?.uid) {
      map[String(dadosUsuario.uid)] =
        dadosUsuario.nome || dadosUsuario.email?.split('@')[0] || 'Usuário';
    }
    return map;
  }, [membrosEquipe, dadosUsuario]);

  const mapaTipoProduto = useMemo(() => {
    const map = {};
    (produtosCatalogo || []).forEach((p) => {
      if (p?.id) map[String(p.id)] = p.tipo || 'Produto';
      if (p?.nome) map[normalizarTexto(p.nome)] = p.tipo || 'Produto';
    });
    return map;
  }, [produtosCatalogo]);

  const negociosFiltradosEOrdenados = useMemo(() => {
    const base = Array.isArray(negociosKanban) ? [...negociosKanban] : [];
    const agora = Date.now();
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const filtradosPorData = base.filter((n) => {
      if (periodo === 'todos') return true;
      const ms = extrairDataMillis(n);
      if (!ms) return true;
      if (periodo === '7d') return ms >= agora - 7 * 24 * 60 * 60 * 1000;
      if (periodo === '30d') return ms >= agora - 30 * 24 * 60 * 60 * 1000;
      if (periodo === 'mes') return ms >= inicioMes.getTime();
      return true;
    });

    filtradosPorData.sort((a, b) => {
      if (ordenacao === 'valor_desc') {
        return parseValorNumerico(b.valor) - parseValorNumerico(a.valor);
      }
      if (ordenacao === 'valor_asc') {
        return parseValorNumerico(a.valor) - parseValorNumerico(b.valor);
      }
      if (ordenacao === 'data_asc') {
        return extrairDataMillis(a) - extrairDataMillis(b);
      }
      return extrairDataMillis(b) - extrairDataMillis(a);
    });

    return filtradosPorData;
  }, [negociosKanban, periodo, ordenacao]);

  const metricas = useMemo(() => {
    let valorAberto = 0;
    let valorGanho = 0;
    let valorPerdido = 0;
    let qtdGanhos = 0;

    const contagemPorCategoria = {};
    const porVendedor = {};
    const porItemCatalogo = {};

    const fallbackVendedor =
      dadosUsuario?.nome || dadosUsuario?.email?.split('@')[0] || 'Equipe Comercial';

    negociosFiltradosEOrdenados.forEach((n) => {
      const valor = parseValorNumerico(n.valor);
      const statusBruto = String(n.status || 'Aberto').trim();
      const tituloColuna = mapaColunas[statusBruto] || statusBruto;

      const situacao =
        identificarTipoPorTexto(tituloColuna) || identificarTipoPorTexto(statusBruto) || 'aberto';

      let rotuloCategoria = tituloColuna || 'Em Aberto';
      if (situacao === 'ganho') {
        rotuloCategoria = 'Ganhos';
        valorGanho += valor;
        qtdGanhos += 1;
      } else if (situacao === 'perdido') {
        rotuloCategoria = 'Perdidos';
        valorPerdido += valor;
      } else {
        valorAberto += valor;
      }

      contagemPorCategoria[rotuloCategoria] = (contagemPorCategoria[rotuloCategoria] || 0) + 1;

      const nomeVendedor = extrairNomeVendedor(n, mapaUsuarios, fallbackVendedor);
      if (!porVendedor[nomeVendedor]) {
        porVendedor[nomeVendedor] = {
          nome: nomeVendedor,
          valorGanho: 0,
          valorTotal: 0,
          qtdVendas: 0,
          qtdNegocios: 0,
        };
      }
      porVendedor[nomeVendedor].valorTotal += valor;
      porVendedor[nomeVendedor].qtdNegocios += 1;
      if (situacao === 'ganho') {
        porVendedor[nomeVendedor].valorGanho += valor;
        porVendedor[nomeVendedor].qtdVendas += 1;
      }

      const listaItens = Array.isArray(n.produtos) ? n.produtos : [];
      if (listaItens.length > 0) {
        const rateioValor = situacao === 'ganho' ? valor / listaItens.length : 0;
        const rateioQtd = situacao === 'ganho' ? 1 : 0;

        listaItens.forEach((item) => {
          const nomeItem =
            typeof item === 'string'
              ? item
              : item?.nome || item?.titulo || 'Item sem nome';
          const tipoItem =
            item?.tipo ||
            mapaTipoProduto[String(item?.id || '')] ||
            mapaTipoProduto[normalizarTexto(nomeItem)] ||
            'Produto';
          const qtdItem = Number(item?.quantidade) > 0 ? Number(item.quantidade) : 1;
          const precoUnit = parseValorNumerico(item?.preco);
          const receitaItem =
            situacao === 'ganho'
              ? precoUnit > 0
                ? precoUnit * qtdItem
                : rateioValor
              : 0;

          const chave = `${normalizarTexto(nomeItem)}__${normalizarTexto(tipoItem)}`;
          if (!porItemCatalogo[chave]) {
            porItemCatalogo[chave] = {
              nome: nomeItem,
              tipo: tipoItem,
              quantidadeVendida: 0,
              receita: 0,
            };
          }
          if (situacao === 'ganho') {
            porItemCatalogo[chave].quantidadeVendida += qtdItem * (rateioQtd || 1);
            porItemCatalogo[chave].receita += receitaItem;
          }
        });
      }
    });

    const coresAberto = ['#0d9488', '#059669', '#14b8a6', '#0f766e'];
    let idxAberto = 0;

    const dadosPizza = Object.entries(contagemPorCategoria)
      .map(([name, value]) => {
        let color = '#0d9488';
        if (name === 'Ganhos') color = '#10b981';
        else if (name === 'Perdidos') color = '#ef4444';
        else {
          color = coresAberto[idxAberto % coresAberto.length];
          idxAberto += 1;
        }
        return { name, value, color };
      })
      .filter((item) => item.value > 0);

    const dadosBarras = [
      { name: 'Em Aberto', valor: valorAberto, fill: '#0d9488' },
      { name: 'Ganhos', valor: valorGanho, fill: '#10b981' },
      { name: 'Perdidos', valor: valorPerdido, fill: '#ef4444' },
    ];

    const rankingVendedores = Object.values(porVendedor).sort((a, b) => {
      if (b.valorGanho !== a.valorGanho) return b.valorGanho - a.valorGanho;
      return b.valorTotal - a.valorTotal;
    });

    const todosItensVendidos = Object.values(porItemCatalogo).sort(
      (a, b) => b.quantidadeVendida - a.quantidadeVendida || b.receita - a.receita
    );

    const produtosMaisVendidos = todosItensVendidos.filter(
      (i) => normalizarTexto(i.tipo) !== 'servico'
    );
    const servicosMaisVendidos = todosItensVendidos.filter(
      (i) => normalizarTexto(i.tipo) === 'servico'
    );

    const itensExibidos =
      filtroDestaque === 'produto'
        ? produtosMaisVendidos
        : filtroDestaque === 'servico'
          ? servicosMaisVendidos
          : todosItensVendidos;

    const totalNegocios = negociosFiltradosEOrdenados.length;
    const taxaConversao =
      totalNegocios > 0 ? ((qtdGanhos / totalNegocios) * 100).toFixed(1) : '0.0';

    const campeaoVendas = rankingVendedores[0] || null;
    const campeaoProduto = produtosMaisVendidos[0] || null;
    const campeaoServico = servicosMaisVendidos[0] || null;

    return {
      totalContatos,
      totalNegocios,
      valorGanho,
      taxaConversao,
      dadosPizza,
      dadosBarras,
      rankingVendedores,
      itensExibidos,
      campeaoVendas,
      campeaoProduto,
      campeaoServico,
    };
  }, [
    negociosFiltradosEOrdenados,
    mapaColunas,
    mapaUsuarios,
    mapaTipoProduto,
    totalContatos,
    dadosUsuario,
    filtroDestaque,
  ]);

  async function handleExportar(tipo) {
    setMenuExportarAberto(false);
    toast.loading('Gerando arquivo...', { id: 'export-toast' });

    const listaBase =
      negociosFiltradosEOrdenados.length > 0
        ? negociosFiltradosEOrdenados.map((n) => {
          let dataFormatada = 'N/A';
          if (n.dataCriacao?.toDate) {
            dataFormatada = n.dataCriacao.toDate().toLocaleDateString('pt-BR');
          } else if (n.dataCriacao instanceof Date) {
            dataFormatada = n.dataCriacao.toLocaleDateString('pt-BR');
          } else if (n.dataCriacao) {
            dataFormatada = String(n.dataCriacao);
          }

          const statusBruto = String(n.status || 'Aberto').trim();
          const tipoDetectado = identificarTipoPorTexto(mapaColunas[statusBruto] || statusBruto);
          const labelStatus =
            tipoDetectado === 'ganho'
              ? 'Ganhos'
              : tipoDetectado === 'perdido'
                ? 'Perdidos'
                : mapaColunas[statusBruto] || statusBruto;

          return {
            id: n.id,
            titulo: n.titulo,
            valor: parseValorNumerico(n.valor),
            status: labelStatus,
            contato: n.contato || 'Sem contato',
            vendedor: extrairNomeVendedor(n, mapaUsuarios, dadosUsuario?.nome),
            dataCriacao: dataFormatada,
          };
        })
        : await buscarNegociosParaExportacao(dadosUsuario.empresaId);

    if (!listaBase || listaBase.length === 0) {
      toast.error('Nenhum dado para exportar.', { id: 'export-toast' });
      return;
    }

    if (tipo === 'csv') {
      const dadosCSV = listaBase.map((n) => ({
        Título: n.titulo,
        'Valor (R$)': n.valor,
        Status: n.status,
        Vendedor: n.vendedor || '-',
        Contato: n.contato || 'Sem contato',
        'Data de Criação': n.dataCriacao || '',
      }));

      const csv = Papa.unparse(dadosCSV);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio_negocios_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success('CSV exportado com sucesso!', { id: 'export-toast' });
    } else if (tipo === 'pdf') {
      const docPdf = new jsPDF();

      let nomeEmpresa = dadosUsuario?.nomeEmpresa;

      if (!nomeEmpresa && dadosUsuario?.empresaId) {
        const empresaRef = doc(db, 'empresas', dadosUsuario.empresaId);
        const empresaSnap = await getDoc(empresaRef);
        if (empresaSnap.exists()) {
          nomeEmpresa = empresaSnap.data().nome;
        }
      }

      docPdf.setFontSize(18);
      docPdf.text('Nexus Hub - Relatório Gerencial', 14, 22);
      docPdf.setFontSize(11);
      docPdf.setTextColor(100);
      docPdf.text(`Empresa: ${nomeEmpresa || 'Nexus Hub'}`, 14, 30);
      docPdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 36);

      const tableData = listaBase.map((n) => [
        n.titulo,
        formatarMoeda(n.valor),
        n.status,
        n.vendedor || '-',
        n.contato || '-',
      ]);

      autoTable(docPdf, {
        startY: 45,
        head: [['Título', 'Valor', 'Status', 'Vendedor', 'Contato']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [5, 150, 105] },
        styles: { fontSize: 9 },
      });

      docPdf.save(`relatorio_negocios_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exportado com sucesso!', { id: 'export-toast' });
    }
  }

  const containerClass =
    'w-full max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:overflow-y-auto max-md:overscroll-y-contain md:min-h-full md:h-auto md:overflow-visible overflow-x-hidden touch-pan-y flex flex-col px-4 sm:px-6 lg:px-7 py-3.5 sm:py-4 pb-32 md:pb-8 bg-slate-50/60 dark:bg-slate-950 transition-colors text-left space-y-3.5';

  if (loadingKanban || loadingExtra) {
    return (
      <div className={`${containerClass} animate-pulse`}>
        <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3 shrink-0" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 shrink-0">
          <div className="h-56 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-56 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const selectClass =
    'px-2.5 py-1.5 text-xs sm:text-[13px] bg-white dark:bg-[#0b192c] border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs transition-all';

  return (
    <div className={containerClass}>
      <PageHeader
        icon={<BarChart3 size={18} />}
        title="Relatórios"
        subtitle="Desempenho comercial, vendas por equipe e catálogo de produtos/serviços."
        action={
          <div ref={exportMenuRef} className="relative w-full md:w-auto mr-1">
            <button
              type="button"
              onClick={() => setMenuExportarAberto((prev) => !prev)}
              className="bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors w-full md:w-auto shadow-2xs"
            >
              <Download size={15} /> Exportar <ChevronDown size={14} />
            </button>

            {menuExportarAberto && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0b192c] rounded-xl shadow-lg border border-slate-200/90 dark:border-slate-800 z-20 py-1 overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleExportar('pdf')}
                  className="w-full text-left px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-2 transition-colors"
                >
                  <Printer size={14} /> Imprimir / PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleExportar('csv')}
                  className="w-full text-left px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-2 transition-colors"
                >
                  <FileText size={14} /> Exportar CSV
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-0.5">
            <Filter size={12} className="text-emerald-600 dark:text-emerald-400" /> Filtros:
          </span>

          <select
            value={filtroDestaque}
            onChange={(e) => setFiltroDestaque(e.target.value)}
            className={selectClass}
            aria-label="Tipo de filtro"
          >
            <option value="todos">Visão Geral</option>
            <option value="vendedores">Quem mais vendeu (Vendedores)</option>
            <option value="produto">Produto mais vendido</option>
            <option value="servico">Serviço mais vendido</option>
          </select>

          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value)}
            className={selectClass}
            aria-label="Ordenação"
          >
            <option value="data_desc">Data: mais recentes primeiro</option>
            <option value="data_asc">Data: mais antigos primeiro</option>
            <option value="valor_desc">Valor: maior para menor</option>
            <option value="valor_asc">Valor: menor para maior</option>
          </select>

          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className={selectClass}
            aria-label="Período"
          >
            <option value="todos">Todo o período</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="mes">Este mês</option>
          </select>
        </div>

        <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
          <ArrowUpDown size={12} />
          <span>{metricas.totalNegocios} negócio(s) considerado(s)</span>
        </div>
      </div>

      {/* Linha 1 de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <div className="bg-white dark:bg-[#0b192c] px-3.5 py-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3 min-w-0">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200/70 dark:border-emerald-500/25 shrink-0">
            <Users size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold !text-slate-500 dark:!text-slate-400 uppercase tracking-wider truncate">
              Total de Contatos
            </p>
            <p className="text-lg font-bold !text-slate-900 dark:!text-white tabular-nums leading-tight mt-0.5">
              {metricas.totalContatos}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0b192c] px-3.5 py-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3 min-w-0">
          <div className="p-2 bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 rounded-lg border border-teal-200/70 dark:border-teal-500/25 shrink-0">
            <Briefcase size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold !text-slate-500 dark:!text-slate-400 uppercase tracking-wider truncate">
              Total de Negócios
            </p>
            <p className="text-lg font-bold !text-slate-900 dark:!text-white tabular-nums leading-tight mt-0.5">
              {metricas.totalNegocios}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0b192c] px-3.5 py-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3 min-w-0">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200/70 dark:border-emerald-500/25 shrink-0">
            <TrendingUp size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold !text-slate-500 dark:!text-slate-400 uppercase tracking-wider truncate">
              Receita Ganha
            </p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums truncate leading-tight mt-0.5">
              {formatarMoeda(metricas.valorGanho)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0b192c] px-3.5 py-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3 min-w-0">
          <div className="p-2 bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200/70 dark:border-amber-500/25 shrink-0">
            <Target size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold !text-slate-500 dark:!text-slate-400 uppercase tracking-wider truncate">
              Taxa de Conversão
            </p>
            <p className="text-lg font-bold !text-slate-900 dark:!text-white tabular-nums leading-tight mt-0.5">
              {metricas.taxaConversao}%
            </p>
          </div>
        </div>
      </div>

      {/* Linha 2 de KPIs: Destaques de Vendedor, Produto e Serviço */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        <div className="bg-white dark:bg-[#0b192c] px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2.5 min-w-0">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Quem mais vendeu
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {metricas.campeaoVendas ? metricas.campeaoVendas.nome : 'Sem dados'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
              {metricas.campeaoVendas
                ? `${formatarMoeda(metricas.campeaoVendas.valorGanho)} (${metricas.campeaoVendas.qtdVendas} ganho(s))`
                : 'R$ 0,00'}
            </p>
          </div>
          <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0">
            <Award size={16} />
          </span>
        </div>

        <div className="bg-white dark:bg-[#0b192c] px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2.5 min-w-0">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Produto mais vendido
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {metricas.campeaoProduto ? metricas.campeaoProduto.nome : 'Nenhum produto vendido'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
              {metricas.campeaoProduto
                ? `${metricas.campeaoProduto.quantidadeVendida} un. • ${formatarMoeda(metricas.campeaoProduto.receita)}`
                : '0 un.'}
            </p>
          </div>
          <span className="p-2 rounded-lg bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 shrink-0">
            <Package size={16} />
          </span>
        </div>

        <div className="bg-white dark:bg-[#0b192c] px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2.5 min-w-0">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Serviço mais vendido
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {metricas.campeaoServico ? metricas.campeaoServico.nome : 'Nenhum serviço vendido'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
              {metricas.campeaoServico
                ? `${metricas.campeaoServico.quantidadeVendida} un. • ${formatarMoeda(metricas.campeaoServico.receita)}`
                : '0 un.'}
            </p>
          </div>
          <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0">
            <TrendingUp size={16} />
          </span>
        </div>
      </div>

      {/* Grade Principal de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 shrink-0">
        {/* 1. Status dos Negócios */}
        <div className="bg-white dark:bg-[#0b192c] p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col shrink-0 min-w-0">
          <h2 className="text-xs sm:text-sm font-bold !text-slate-900 dark:!text-white mb-1.5">
            Status dos Negócios
          </h2>
          {metricas.dadosPizza.length > 0 ? (
            <div className="h-52 xl:h-56 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metricas.dadosPizza}
                    cx="50%"
                    cy="48%"
                    innerRadius={44}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {metricas.dadosPizza.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value, name) => [`${value} negócio(s)`, name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={28}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 xl:h-56 flex items-center justify-center text-center !text-slate-500 dark:!text-slate-400 text-sm">
              Nenhum negócio cadastrado.
            </div>
          )}
        </div>

        {/* 2. Comparativo Financeiro (R$) */}
        <div className="bg-white dark:bg-[#0b192c] p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col shrink-0 min-w-0">
          <h2 className="text-xs sm:text-sm font-bold !text-slate-900 dark:!text-white mb-1.5">
            Comparativo Financeiro (R$)
          </h2>
          <div className="h-52 xl:h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metricas.dadosBarras}
                margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#334155"
                  strokeOpacity={0.25}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={72}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    new Intl.NumberFormat('pt-BR', {
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(Number(v) || 0)
                  }
                />
                <Tooltip
                  cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [formatarMoeda(value), 'Valor']}
                />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {metricas.dadosBarras.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Gráfico de Desempenho por Vendedor */}
        <div
          className={`bg-white dark:bg-[#0b192c] p-3.5 rounded-xl border shadow-2xs flex flex-col shrink-0 min-w-0 ${filtroDestaque === 'vendedores'
              ? 'border-emerald-400 dark:border-emerald-500/60 ring-1 ring-emerald-500/20'
              : 'border-slate-200/90 dark:border-slate-800'
            }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h2 className="text-xs sm:text-sm font-bold !text-slate-900 dark:!text-white">
              Desempenho por Vendedor (Receita Ganha)
            </h2>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded-full">
              {metricas.rankingVendedores.length} vendedor(es)
            </span>
          </div>

          {metricas.rankingVendedores.length > 0 ? (
            <div className="h-52 xl:h-56 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metricas.rankingVendedores}
                  margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#334155"
                    strokeOpacity={0.25}
                  />
                  <XAxis
                    dataKey="nome"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    width={72}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat('pt-BR', {
                        notation: 'compact',
                        compactDisplay: 'short',
                      }).format(Number(v) || 0)
                    }
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [formatarMoeda(value), 'Receita Ganha']}
                  />
                  <Bar dataKey="valorGanho" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 xl:h-56 flex items-center justify-center text-center !text-slate-500 dark:!text-slate-400 text-sm">
              Nenhum dado de vendedor disponível.
            </div>
          )}
        </div>

        {/* 4. Gráfico de Produtos e Serviços Mais Vendidos */}
        <div
          className={`bg-white dark:bg-[#0b192c] p-3.5 rounded-xl border shadow-2xs flex flex-col shrink-0 min-w-0 ${filtroDestaque === 'produto' || filtroDestaque === 'servico'
              ? 'border-emerald-400 dark:border-emerald-500/60 ring-1 ring-emerald-500/20'
              : 'border-slate-200/90 dark:border-slate-800'
            }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h2 className="text-xs sm:text-sm font-bold !text-slate-900 dark:!text-white">
              {filtroDestaque === 'produto'
                ? 'Produtos Mais Vendidos (Unidades)'
                : filtroDestaque === 'servico'
                  ? 'Serviços Mais Vendidos (Unidades)'
                  : 'Produtos e Serviços Mais Vendidos'}
            </h2>
            <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-500/15 px-2 py-0.5 rounded-full">
              {metricas.itensExibidos.length} item(ns)
            </span>
          </div>

          {metricas.itensExibidos.length > 0 ? (
            <div className="h-52 xl:h-56 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metricas.itensExibidos}
                  margin={{ top: 8, right: 12, left: -14, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#334155"
                    strokeOpacity={0.25}
                  />
                  <XAxis
                    dataKey="nome"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(13, 148, 136, 0.08)' }}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value, _name, props) => [
                      `${value} un. (${formatarMoeda(props?.payload?.receita || 0)})`,
                      props?.payload?.tipo || 'Item',
                    ]}
                  />
                  <Bar
                    dataKey="quantidadeVendida"
                    fill="#0d9488"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 xl:h-56 flex items-center justify-center text-center !text-slate-500 dark:!text-slate-400 text-sm px-4">
              Vincule produtos ou serviços aos negócios ganhos para visualizar o ranking aqui.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}