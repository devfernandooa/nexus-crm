import { db } from '@/firebase-config';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

export async function atualizarEmpresa(empresaId, dadosAtualizados) {
  try {
    const empresaRef = doc(db, 'empresas', empresaId);
    await updateDoc(empresaRef, dadosAtualizados);
    return { sucesso: true };
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    return { sucesso: false, erro: error.message };
  }
}


export async function deletarEmpresa(empresaId) {
  try {
    const empresaRef = doc(db, 'empresas', empresaId);
    await deleteDoc(empresaRef);
    return { sucesso: true };
  } catch (error) {
    console.error("Erro ao deletar empresa:", error);
    return { sucesso: false, erro: error.message };
  }
}