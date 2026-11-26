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
} from 'firebase/firestore';

export async function adicionarNegocio(dados, empresaId) {
  try {
    const ref = collection(db, 'negocios');
    await addDoc(ref, {
      ...dados,
      empresaId,
      dataCriacao: serverTimestamp(),
    });
    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao criar negócio:', error);
    return { sucesso: false, erro: error.message };
  }
}

export async function atualizarNegocio(id, dados) {
  try {
    const ref = doc(db, 'negocios', id);
    await updateDoc(ref, dados);
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