import { db } from '../firebase-config';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export async function buscarDadosUsuario(uid) {
  try {
    // O nome da coleção TEM que ser 'usuarios' (com 's' no final)
    const usuarioRef = doc(db, 'usuarios', uid);
    const docSnap = await getDoc(usuarioRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.error(`Documento não encontrado para o uid: ${uid}`);
      return null;
    }
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    return null;
  }
}

export async function atualizarPerfilUsuario(uid, dados) {
  try {
    const userRef = doc(db, 'usuarios', uid);
    await updateDoc(userRef, dados);
    return { sucesso: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return { sucesso: false, erro: error.message };
  }
}

export async function deletarPerfilUsuario(uid) {
  try {
    const userRef = doc(db, 'usuarios', uid);
    await deleteDoc(userRef);
    return { sucesso: true };
  } catch (error) {
    console.error("Erro ao deletar perfil no Firestore:", error);
    return { sucesso: false, erro: error.message };
  }
}