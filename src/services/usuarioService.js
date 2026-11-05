import { db } from '../firebase-config';
import { doc, getDoc } from 'firebase/firestore';

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