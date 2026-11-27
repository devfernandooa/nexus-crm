import { db } from '@/firebase-config';
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';

function parseValorSeguro(valor) {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : 0;
  }
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

function extrairData(candidato) {
  if (!candidato) return null;
  if (typeof candidato.toDate === 'function') {
    const d = candidato.toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (candidato instanceof Date) {
    return Number.isNaN(candidato.getTime()) ? null : candidato;
  }
  const d = new Date(candidato);
  return Number.isNaN(d.getTime()) ? null : d;
}

function obterChaveAnoMes(date = new Date()) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}`;
}

function pertenceAoMes(date, ano, mesIndex) {
  if (!date) return false;
  return date.getFullYear() === ano && date.getMonth() === mesIndex;
}

function ehNegocioGanho(status) {
  const s = String(status || '').trim().toLowerCase();
  if (!s) return false;
  if (s === 'proposta') return true;
  return (
    ['ganho', 'ganhos', 'fechado', 'fechados', 'won', 'concluido', 'concluído'].includes(s) ||
    s.includes('ganh') ||
    s.includes('fechad')
  );
}

function calcularComparativoPercentual(atual, anterior, { inverterSinal = false } = {}) {
  const numAtual = parseValorSeguro(atual);
  const numAnterior = parseValorSeguro(anterior);

  let variacaoPct = 0;
  let rotulo = '0% vs. mês anterior';
  let status = 'neutro'; // 'positivo' | 'negativo' | 'neutro'

  if (numAnterior > 0) {
    variacaoPct = ((numAtual - numAnterior) / numAnterior) * 100;
    const arredondado = Number(variacaoPct.toFixed(1));
    const sinal = arredondado > 0 ? '+' : '';
    rotulo = `${sinal}${arredondado}% vs. mês anterior`;
    if (arredondado > 0) {
      status = inverterSinal ? 'negativo' : 'positivo';
    } else if (arredondado < 0) {
      status = inverterSinal ? 'positivo' : 'negativo';
    }
  } else if (numAtual > 0) {
    variacaoPct = 100;
    rotulo = '+100% vs. mês anterior';
    status = inverterSinal ? 'negativo' : 'positivo';
  }

  return {
    variacaoPct,
    rotulo,
    status,
    atual: numAtual,
    anterior: numAnterior,
  };
}

export async function atualizarMetaMensalEmpresa(empresaId, novaMeta, dataRef = new Date()) {
  const valorMeta = parseValorSeguro(novaMeta);
  if (!empresaId) {
    return { sucesso: false, erro: 'Empresa não identificada.' };
  }
  if (!Number.isFinite(valorMeta) || valorMeta <= 0) {
    return { sucesso: false, erro: 'Informe um valor de meta maior que zero.' };
  }

  try {
    const chaveMes = obterChaveAnoMes(dataRef);
    const empresaRef = doc(db, 'empresas', empresaId);
    await updateDoc(empresaRef, {
      metaMensal: valorMeta,
      [`metasMensais.${chaveMes}`]: valorMeta,
    });
    return { sucesso: true, meta: valorMeta, chaveMes };
  } catch (error) {
    console.error('Erro ao atualizar meta mensal:', error);
    return { sucesso: false, erro: error.message || 'Erro ao salvar meta.' };
  }
}

export async function buscarContatosRecentes(empresaId) {
  try {
    const contatosRef = collection(db, 'contatos');
    const q = query(contatosRef, where('empresaId', '==', empresaId));
    const snapshot = await getDocs(q);

    const contatos = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));

    contatos.sort((a, b) => {
      const dataA = extrairData(a.dataCriacao || a.criadoEm)?.getTime() || 0;
      const dataB = extrairData(b.dataCriacao || b.criadoEm)?.getTime() || 0;
      return dataB - dataA;
    });

    return contatos.slice(0, 5);
  } catch (error) {
    console.error('Erro ao buscar contatos recentes:', error);
    return [];
  }
}

export function escutarDadosDashboard(empresaId, callback) {
  if (!empresaId) return () => {};

  const idsAbertos = ['prospeccao', 'demo-online', 'demo-presencial', 'qualificacao', 'aberto'];

  let docsContatos = [];
  let docsNegocios = [];
  let docsTarefas = [];
  let totalUsuarios = 1;
  let empresaDocData = null;

  const emitirResumo = () => {
    const agora = new Date();
    const anoAtual = agora.getFullYear();
    const mesAtual = agora.getMonth();

    const mesAnteriorDate = new Date(anoAtual, mesAtual - 1, 1);
    const anoAnterior = mesAnteriorDate.getFullYear();
    const mesAnterior = mesAnteriorDate.getMonth();
    const chaveMesAtual = obterChaveAnoMes(agora);

    // Contatos
    const totalContatos = docsContatos.length;
    const contatosMesAtual = docsContatos.filter((c) =>
      pertenceAoMes(extrairData(c.dataCriacao || c.criadoEm), anoAtual, mesAtual)
    ).length;
    const contatosMesAnterior = docsContatos.filter((c) =>
      pertenceAoMes(extrairData(c.dataCriacao || c.criadoEm), anoAnterior, mesAnterior)
    ).length;

    // Negócios
    let negociosAbertos = 0;
    let negociosGanhos = 0;
    let receitaGanhaTotal = 0;
    let receitaGanhaMesAtual = 0;
    let receitaGanhaMesAnterior = 0;
    let abertosMesAtual = 0;
    let abertosMesAnterior = 0;

    docsNegocios.forEach((negocio) => {
      const status = String(negocio.status || '').trim();
      const statusLower = status.toLowerCase();
      const valor = parseValorSeguro(negocio.valor);
      const dataCriacao = extrairData(negocio.dataCriacao || negocio.criadoEm);
      const dataFechamento =
        extrairData(negocio.dataFechamento || negocio.atualizadoEm) || dataCriacao;

      const ehGanho = ehNegocioGanho(status);
      const ehPerdido =
        statusLower.includes('perd') || statusLower.includes('cancel') || statusLower === 'lost';
      const ehAberto = !ehGanho && !ehPerdido && (idsAbertos.includes(statusLower) || Boolean(status));

      if (ehAberto) {
        negociosAbertos += 1;
        if (pertenceAoMes(dataCriacao, anoAtual, mesAtual)) abertosMesAtual += 1;
        if (pertenceAoMes(dataCriacao, anoAnterior, mesAnterior)) abertosMesAnterior += 1;
      } else if (ehGanho) {
        negociosGanhos += 1;
        receitaGanhaTotal += valor;
        if (pertenceAoMes(dataFechamento, anoAtual, mesAtual)) {
          receitaGanhaMesAtual += valor;
        }
        if (pertenceAoMes(dataFechamento, anoAnterior, mesAnterior)) {
          receitaGanhaMesAnterior += valor;
        }
      }
    });

    // Tarefas pendentes
    const tarefasPendentesDocs = docsTarefas.filter((t) => !t.concluida && t.status !== 'concluida');
    const tarefasPendentes = tarefasPendentesDocs.length;
    const tarefasPendMesAtual = tarefasPendentesDocs.filter((t) =>
      pertenceAoMes(extrairData(t.dataCriacao || t.criadoEm || t.dataVencimento), anoAtual, mesAtual)
    ).length;
    const tarefasPendMesAnterior = tarefasPendentesDocs.filter((t) =>
      pertenceAoMes(
        extrairData(t.dataCriacao || t.criadoEm || t.dataVencimento),
        anoAnterior,
        mesAnterior
      )
    ).length;

    // Meta mensal (por mês ou padrão da empresa; fallback 10000)
    const metaConfigurada = parseValorSeguro(
      empresaDocData?.metasMensais?.[chaveMesAtual] ?? empresaDocData?.metaMensal ?? 10000
    );
    const metaMensal = metaConfigurada > 0 ? metaConfigurada : 10000;
    const receitaMetaAlcance = receitaGanhaMesAtual > 0 ? receitaGanhaMesAtual : receitaGanhaTotal;
    const percentualMetaReal = metaMensal > 0 ? (receitaMetaAlcance / metaMensal) * 100 : 0;
    const percentualMetaBarra = Math.max(0, Math.min(percentualMetaReal, 100));

    callback({
      totalContatos,
      negociosAbertos,
      negociosGanhos,
      receitaGanha: receitaGanhaTotal,
      receitaGanhaMesAtual,
      tarefasPendentes,
      totalUsuarios,
      metaMensal,
      chaveMesAtual,
      receitaMetaAlcance,
      percentualMetaReal,
      percentualMetaBarra,
      comparativos: {
        contatos: calcularComparativoPercentual(contatosMesAtual, contatosMesAnterior),
        negociosAbertos: calcularComparativoPercentual(abertosMesAtual, abertosMesAnterior),
        tarefasPendentes: calcularComparativoPercentual(tarefasPendMesAtual, tarefasPendMesAnterior, {
          inverterSinal: true,
        }),
        receitaGanha: calcularComparativoPercentual(receitaGanhaMesAtual, receitaGanhaMesAnterior),
      },
    });
  };

  const unsubContatos = onSnapshot(
    query(collection(db, 'contatos'), where('empresaId', '==', empresaId)),
    (snap) => {
      docsContatos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emitirResumo();
    }
  );

  const unsubNegocios = onSnapshot(
    query(collection(db, 'negocios'), where('empresaId', '==', empresaId)),
    (snap) => {
      docsNegocios = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emitirResumo();
    }
  );

  const unsubTarefas = onSnapshot(
    query(collection(db, 'tarefas'), where('empresaId', '==', empresaId)),
    (snap) => {
      docsTarefas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emitirResumo();
    },
    () => {
      docsTarefas = [];
      emitirResumo();
    }
  );

  const unsubUsuarios = onSnapshot(
    query(collection(db, 'usuarios'), where('empresaId', '==', empresaId)),
    (snap) => {
      totalUsuarios = Math.max(1, snap.size);
      emitirResumo();
    },
    () => {
      totalUsuarios = 1;
      emitirResumo();
    }
  );

  const unsubEmpresa = onSnapshot(
    doc(db, 'empresas', empresaId),
    (snap) => {
      empresaDocData = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      emitirResumo();
    },
    () => {
      empresaDocData = null;
      emitirResumo();
    }
  );

  return () => {
    unsubContatos();
    unsubNegocios();
    unsubTarefas();
    unsubUsuarios();
    unsubEmpresa();
  };
}