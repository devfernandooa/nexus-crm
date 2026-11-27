import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase-config';

const EMPRESA_PADRAO =
  import.meta.env.VITE_DEFAULT_EMPRESA_ID ||
  'agrotec-produtos-servicos-agropecuarios';

export function escutarContatos(empresaId, callback) {
  const alvo = empresaId || EMPRESA_PADRAO;
  const q = query(collection(db, 'contatos'), where('empresaId', '==', alvo));
  return onSnapshot(q, (snapshot) => {
    const lista = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(lista);
  });
}

export async function adicionarContato(dados, empresaId) {
  try {
    const alvo = empresaId || EMPRESA_PADRAO;
    const docRef = await addDoc(collection(db, 'contatos'), {
      ...dados,
      empresaId: alvo,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    return { sucesso: true, id: docRef.id };
  } catch (erro) {
    console.error('Erro ao criar contato:', erro);
    return { sucesso: false, erro: erro.message || 'Erro ao criar contato.' };
  }
}

export async function atualizarContato(id, dados) {
  try {
    if (!id) {
      return { sucesso: false, erro: 'ID do contato inválido.' };
    }
    await updateDoc(doc(db, 'contatos', id), {
      ...dados,
      atualizadoEm: serverTimestamp(),
    });
    return { sucesso: true };
  } catch (erro) {
    console.error('Erro ao atualizar contato:', erro);
    return { sucesso: false, erro: erro.message || 'Erro ao atualizar contato.' };
  }
}

export async function deletarContato(id) {
  try {
    if (!id) {
      return { sucesso: false, erro: 'ID do contato inválido.' };
    }
    await deleteDoc(doc(db, 'contatos', id));
    return { sucesso: true };
  } catch (erro) {
    console.error('Erro ao excluir contato:', erro);
    return { sucesso: false, erro: erro.message || 'Erro ao excluir contato.' };
  }
}

export async function assumirAtendimentoContato(contato, usuario) {
  try {
    if (!contato?.id) {
      return { sucesso: false, erro: 'Contato inválido.' };
    }

    const vendedorId = usuario?.uid || usuario?.id;
    if (!vendedorId) {
      return { sucesso: false, erro: 'Usuário vendedor não identificado.' };
    }

    const empresaId = contato.empresaId || usuario.empresaId || EMPRESA_PADRAO;
    const vendedorNome =
      usuario.nome || usuario.displayName || usuario.email || 'Vendedor';

    await updateDoc(doc(db, 'contatos', contato.id), {
      status: 'Em Atendimento',
      tipo: contato.tipo || 'lead',
      vendedorResponsavelId: vendedorId,
      vendedorResponsavelNome: vendedorNome,
      atendimentoIniciadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });

    let negocioIdExistente = null;
    if (empresaId) {
      const qNegocios = query(
        collection(db, 'negocios'),
        where('empresaId', '==', empresaId),
        where('contatoId', '==', contato.id)
      );
      const snapNegocios = await getDocs(qNegocios);
      const aberto = snapNegocios.docs.find((d) => {
        const st = String(d.data()?.status || '').toLowerCase();
        return (
          st === 'aberto' ||
          st === 'em_andamento' ||
          st === 'em andamento'
        );
      });
      if (aberto) {
        negocioIdExistente = aberto.id;
      }
    }

    if (!negocioIdExistente && empresaId) {
      const novoNegocio = await addDoc(collection(db, 'negocios'), {
        empresaId,
        contatoId: contato.id,
        contatoNome: contato.nome || 'Lead',
        contatoTelefone: contato.telefone || '',
        contatoEmail: contato.email || '',
        titulo: `Atendimento — ${contato.nome || 'Lead'}`,
        tipoNegocio: 'primeiro_negocio',
        etapaFunil: 'prospeccao',
        status: 'aberto',
        responsavelId: vendedorId,
        responsavelNome: vendedorNome,
        vendedorId,
        vendedorNome,
        observacoes: contato.observacoes || '',
        pedidos: [],
        valor: 0,
        valorTotal: 0,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });
      negocioIdExistente = novoNegocio.id;
    }

    return { sucesso: true, negocioId: negocioIdExistente };
  } catch (erro) {
    console.error('Erro ao assumir atendimento:', erro);
    return {
      sucesso: false,
      erro: erro.message || 'Falha ao assumir atendimento.',
    };
  }
}