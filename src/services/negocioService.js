import { db } from '@/firebase-config';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';

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
    console.error("Erro ao criar negócio:", error);
    return { sucesso: false, erro: error.message };
  }
}

export async function atualizarNegocio(id, dados) {
  try {
    const ref = doc(db, 'negocios', id);
    await updateDoc(ref, dados);
    return { sucesso: true };
  } catch (error) {
    console.error("Erro ao atualizar negócio:", error);
    return { sucesso: false, erro: error.message };
  }
}

export async function deletarNegocio(id) {
  try {
    const ref = doc(db, 'negocios', id);
    await deleteDoc(ref);
    return { sucesso: true };
  } catch (error) {
    console.error("Erro ao deletar negócio:", error);
    return { sucesso: false, erro: error.message };
  }
}

export function escutarNegocios(empresaId, callback) {
  const ref = collection(db, 'negocios');
  const q = query(ref, where('empresaId', '==', empresaId));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const lista = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Ordena do mais recente para o mais antigo (opcional)
    lista.sort((a, b) => (b.dataCriacao?.toMillis() || 0) - (a.dataCriacao?.toMillis() || 0));
    callback(lista);
  });

  return unsubscribe;
}