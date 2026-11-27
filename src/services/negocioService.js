import { db } from '@/firebase-config';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs,
  arrayUnion,
} from 'firebase/firestore';

function ehEtapaGanha(status = '') {
  const s = String(status || '').trim().toLowerCase();
  return (
    s === 'ganho' ||
    s === 'ganhos' ||
    s === 'fechado ganho' ||
    s === 'fechado_ganho' ||
    s === 'venda_finalizada' ||
    s === 'concluido' ||
    s.includes('ganh')
  );
}

export function normalizarPedidos(produtos = [], pedidosExistentes = []) {
  if (Array.isArray(pedidosExistentes) && pedidosExistentes.length > 0 && (!produtos || produtos.length === 0)) {
    return pedidosExistentes.map((item, idx) => {
      const quantidade = Number(item.quantidade) || 1;
      const valorUnitario = Number(item.valorUnitario ?? item.preco ?? 0);
      return {
        id: item.id || `ped_${Date.now()}_${idx}`,
        produto: item.produto || item.nome || 'Item',
        quantidade,
        valorUnitario,
        subtotal: Number(item.subtotal ?? quantidade * valorUnitario),
        origem: item.origem || 'crm',
        dataSolicitacao: item.dataSolicitacao || new Date().toISOString(),
      };
    });
  }

  return (produtos || []).map((p, idx) => {
    const quantidade = Number(p.quantidade) || 1;
    const valorUnitario = Number(p.preco ?? p.valorUnitario ?? 0);
    return {
      id: p.pedidoId || p.id || `ped_${Date.now()}_${idx}`,
      produto: p.nome || p.produto || 'Produto/Serviço',
      quantidade,
      valorUnitario,
      subtotal: Number(p.subtotal ?? quantidade * valorUnitario),
      origem: p.origem || 'crm',
      dataSolicitacao: p.dataSolicitacao || new Date().toISOString(),
    };
  });
}

async function promoverContatoParaCliente(contatoId, pedidos = [], valorNegocio = 0) {
  if (!contatoId) return;

  const nomesProdutos = (pedidos || [])
    .map((item) => item.produto)
    .filter(Boolean);

  const payloadCliente = {
    tipo: 'cliente',
    status: 'Cliente',
    ultimaCompraEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  };

  if (nomesProdutos.length > 0) {
    payloadCliente.produtosAdquiridos = arrayUnion(...nomesProdutos);
  }

  if (Number(valorNegocio) > 0) {
    payloadCliente.ultimoValorCompra = Number(valorNegocio);
  }

  await updateDoc(doc(db, 'contatos', contatoId), payloadCliente);
}

export async function adicionarNegocio(dados, empresaId) {
  try {
    const pedidosFormatados = normalizarPedidos(dados.produtos, dados.pedidos);
    const totalPedidos = pedidosFormatados.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
    const valorFinal =
      Number(dados.valor) > 0 ? Number(dados.valor) : totalPedidos;

    const tipoNegocio =
      dados.tipoNegocio || (dados.contatoExistente ? 'recompra' : 'primeiro_negocio');

    const ref = collection(db, 'negocios');
    const docRef = await addDoc(ref, {
      ...dados,
      empresaId,
      tipoNegocio,
      pedidos: pedidosFormatados,
      valor: valorFinal,
      valorTotal: totalPedidos || valorFinal,
      dataCriacao: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });

    if (ehEtapaGanha(dados.status) && dados.contatoId) {
      await promoverContatoParaCliente(dados.contatoId, pedidosFormatados, valorFinal);
    }

    return { sucesso: true, id: docRef.id };
  } catch (error) {
    console.error('Erro ao criar negócio:', error);
    return { sucesso: false, erro: error.message };
  }
}

export async function atualizarNegocio(id, dados) {
  try {
    const pedidosFormatados =
      dados.produtos || dados.pedidos
        ? normalizarPedidos(dados.produtos, dados.pedidos)
        : undefined;

    const totalPedidos = pedidosFormatados
      ? pedidosFormatados.reduce((acc, item) => acc + Number(item.subtotal || 0), 0)
      : undefined;

    const payload = {
      ...dados,
      ...(pedidosFormatados ? { pedidos: pedidosFormatados } : {}),
      ...(totalPedidos !== undefined ? { valorTotal: totalPedidos } : {}),
      atualizadoEm: serverTimestamp(),
    };

    const ref = doc(db, 'negocios', id);
    await updateDoc(ref, payload);

    if (ehEtapaGanha(dados.status) && dados.contatoId) {
      await promoverContatoParaCliente(
        dados.contatoId,
        pedidosFormatados || dados.pedidos || [],
        dados.valor ?? totalPedidos ?? 0
      );
    }

    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao atualizar negócio:', error);
    return { sucesso: false, erro: error.message };
  }
}

export async function deletarNegocio(id) {
  try {
    const ref = doc(db, 'negocios', id);
    await deleteDoc(ref);
    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao deletar negócio:', error);
    return { sucesso: false, erro: error.message };
  }
}

export function escutarNegocios(empresaId, userRole, userId, callback) {
  if (!empresaId) {
    callback([]);
    return () => { };
  }

  const roleNormalizada = String(userRole || '').trim().toLowerCase();

  // Vendedor precisa ter userId para filtrar os próprios negócios; se ainda não carregou, aguarda sem erro
  if (roleNormalizada === 'vendedor' && !userId) {
    callback([]);
    return () => { };
  }

  const ref = collection(db, 'negocios');
  const constraints = [where('empresaId', '==', empresaId)];

  if (roleNormalizada === 'vendedor') {
    constraints.push(where('responsavelId', '==', userId));
  }

  const q = query(ref, ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const lista = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      lista.sort((a, b) => (b.dataCriacao?.toMillis() || 0) - (a.dataCriacao?.toMillis() || 0));
      callback(lista);
    },
    (error) => {
      console.error('Erro de permissão no listener de negócios:', error);
      callback([]);
    }
  );
}

export async function buscarContagemNegociosPorEtapa(empresaId, userRole = '', userId = '') {
  try {
    if (!empresaId) return { sucesso: true, dados: {} };

    const roleNormalizada = String(userRole || '').trim().toLowerCase();
    const ref = collection(db, 'negocios');
    const constraints = [where('empresaId', '==', empresaId)];

    if (roleNormalizada === 'vendedor' && userId) {
      constraints.push(where('responsavelId', '==', userId));
    }

    const q = query(ref, ...constraints);
    const snapshot = await getDocs(q);

    const contagem = {};
    snapshot.forEach((docSnap) => {
      const status = docSnap.data().status;
      if (status) {
        contagem[status] = (contagem[status] || 0) + 1;
      }
    });

    return { sucesso: true, dados: contagem };
  } catch (error) {
    console.error('Erro ao buscar contagem de negócios por etapa:', error);
    return { sucesso: false, erro: error.message, dados: {} };
  }
}