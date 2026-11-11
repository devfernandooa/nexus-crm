import { db } from '@/firebase-config';
import { doc, updateDoc } from 'firebase/firestore';

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