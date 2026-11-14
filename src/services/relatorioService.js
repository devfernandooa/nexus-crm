import { db } from '@/firebase-config';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function buscarDadosRelatorio(empresaId) {
  try {
    // Buscar Negócios
    const negociosRef = collection(db, 'negocios');
    const qNegocios = query(negociosRef, where('empresaId', '==', empresaId));
    const snapshotNegocios = await getDocs(qNegocios);
    const negocios = snapshotNegocios.docs.map(doc => doc.data());

    // Buscar Contatos (apenas para contar o total)
    const contatosRef = collection(db, 'contatos');
    const qContatos = query(contatosRef, where('empresaId', '==', empresaId));
    const snapshotContatos = await getDocs(qContatos);
    const totalContatos = snapshotContatos.size;

    // Processar dados para os gráficos
    const ganhos = negocios.filter(n => n.status === 'Ganho');
    const perdidos = negocios.filter(n => n.status === 'Perdido');
    const abertos = negocios.filter(n => n.status === 'Aberto');

    const valorGanho = ganhos.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
    const valorPerdido = perdidos.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
    const valorAberto = abertos.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

    const taxaConversao = negocios.length > 0
      ? ((ganhos.length / negocios.length) * 100).toFixed(1)
      : 0;

    // Dados para o Gráfico de Pizza (Status)
    const dadosPizza = [
      { name: 'Ganhos', value: ganhos.length, color: '#10b981' },
      { name: 'Em Aberto', value: abertos.length, color: '#3b82f6' },
      { name: 'Perdidos', value: perdidos.length, color: '#ef4444' },
    ].filter(item => item.value > 0);

    return {
      sucesso: true,
      dados: {
        totalContatos,
        totalNegocios: negocios.length,
        valorGanho,
        valorPerdido,
        valorAberto,
        taxaConversao,
        dadosPizza
      }
    };
  } catch (error) {
    console.error("Erro ao buscar dados do relatório:", error);
    return { sucesso: false, erro: error.message };
  }
}

// NOVA FUNÇÃO: Busca a lista bruta de negócios para exportação (CSV/PDF)
export async function buscarNegociosParaExportacao(empresaId) {
  try {
    const negociosRef = collection(db, 'negocios');
    const q = query(negociosRef, where('empresaId', '==', empresaId));
    const snapshot = await getDocs(q);

    // Retorna os dados formatados para a tabela de exportação
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        titulo: data.titulo,
        valor: data.valor,
        status: data.status,
        contato: data.contato || 'Sem contato',
        dataCriacao: data.dataCriacao ? data.dataCriacao.toDate().toLocaleDateString('pt-BR') : 'N/A'
      };
    });
  } catch (error) {
    console.error("Erro ao buscar negócios para exportação:", error);
    return [];
  }
}