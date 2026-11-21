import { db } from '@/firebase-config';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

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

export async function atualizarFunilVendas(empresaId, novasEtapas) {
  try {
    const ref = doc(db, 'empresas', empresaId);
    await updateDoc(ref, {
      etapasFunil: novasEtapas
    });
    return { sucesso: true };
  } catch (error) {
    console.error("Erro ao atualizar funil:", error);
    return { sucesso: false, erro: error.message };
  }
}

export async function buscarConfiguracoesEmpresa(empresaId) {
  try {
    const ref = doc(db, 'empresas', empresaId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { sucesso: true, dados: snap.data() };
    }
    return { sucesso: false, erro: 'Empresa não encontrada' };
  } catch (error) {
    return { sucesso: false, erro: error.message };
  }
}