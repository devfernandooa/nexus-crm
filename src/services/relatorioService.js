import { db } from '@/firebase-config';
import { collection, query, where, getDocs } from 'firebase/firestore';

function parseValorNumerico(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  if (typeof valor === 'string') {
    const limpo = valor.replace(/[^\d,.-]/g, '').replace(',', '.');
    const num = Number(limpo);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
}

function classificarStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  if (['ganho', 'ganhos', 'fechado', 'fechados', 'won'].includes(s) || s.includes('ganh')) {
    return 'ganho';
  }
  if (['perdido', 'perdidos', 'cancelado', 'cancelados', 'lost'].includes(s) || s.includes('perd')) {
    return 'perdido';
  }
  return 'aberto';
}

export async function buscarDadosRelatorio(empresaId) {
  try {
    // Buscar Negócios da empresa
    const negociosRef = collection(db, 'negocios');
    const qNegocios = query(negociosRef, where('empresaId', '==', empresaId));
    const snapshotNegocios = await getDocs(qNegocios);
    const negocios = snapshotNegocios.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Buscar Contatos (apenas para contar o total)
    const contatosRef = collection(db, 'contatos');
    const qContatos = query(contatosRef, where('empresaId', '==', empresaId));
    const snapshotContatos = await getDocs(qContatos);
    const totalContatos = snapshotContatos.size;

    // Classificar negócios
    const ganhos = negocios.filter((n) => classificarStatus(n.status) === 'ganho');
    const perdidos = negocios.filter((n) => classificarStatus(n.status) === 'perdido');
    const abertos = negocios.filter((n) => classificarStatus(n.status) === 'aberto');

    const valorGanho = ganhos.reduce((acc, curr) => acc + parseValorNumerico(curr.valor), 0);
    const valorPerdido = perdidos.reduce((acc, curr) => acc + parseValorNumerico(curr.valor), 0);
    const valorAberto = abertos.reduce((acc, curr) => acc + parseValorNumerico(curr.valor), 0);

    const taxaConversao =
      negocios.length > 0 ? ((ganhos.length / negocios.length) * 100).toFixed(1) : '0.0';

    // Gráfico de Pizza: agrupa por status/etapa real dos negócios
    const contagemEtapas = {};
    negocios.forEach((n) => {
      const label = String(n.status || 'Aberto').trim() || 'Aberto';
      contagemEtapas[label] = (contagemEtapas[label] || 0) + 1;
    });

    const cores = ['#10b981', '#0d9488', '#059669', '#f59e0b', '#ef4444', '#14b8a6'];
    const dadosPizza = Object.entries(contagemEtapas)
      .map(([name, value], idx) => {
        const tipo = classificarStatus(name);
        let color = cores[idx % cores.length];
        if (tipo === 'ganho') color = '#10b981';
        else if (tipo === 'perdido') color = '#ef4444';
        return { name, value, color };
      })
      .filter((item) => item.value > 0);

    return {
      sucesso: true,
      dados: {
        totalContatos,
        totalNegocios: negocios.length,
        valorGanho,
        valorPerdido,
        valorAberto,
        taxaConversao,
        dadosPizza,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar dados do relatório:', error);
    return { sucesso: false, erro: error.message };
  }
}

export async function buscarNegociosParaExportacao(empresaId) {
  try {
    const negociosRef = collection(db, 'negocios');
    const q = query(negociosRef, where('empresaId', '==', empresaId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data();
      let dataFormatada = 'N/A';
      if (data.dataCriacao) {
        if (typeof data.dataCriacao.toDate === 'function') {
          dataFormatada = data.dataCriacao.toDate().toLocaleDateString('pt-BR');
        } else if (data.dataCriacao instanceof Date) {
          dataFormatada = data.dataCriacao.toLocaleDateString('pt-BR');
        } else {
          dataFormatada = String(data.dataCriacao);
        }
      }

      return {
        id: d.id,
        titulo: data.titulo,
        valor: parseValorNumerico(data.valor),
        status: data.status,
        contato: data.contato || 'Sem contato',
        dataCriacao: dataFormatada,
      };
    });
  } catch (error) {
    console.error('Erro ao buscar negócios para exportação:', error);
    return [];
  }
}