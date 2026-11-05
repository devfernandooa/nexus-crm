import { db } from '../firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export function escutarContatos(empresaId, setContatos) {
  try {
    // 1. Aponta para a coleção 'contatos'
    const contatosRef = collection(db, 'contatos');
    
    // 2. Cria a query filtrando pelo ID da empresa (Multi-tenant)
    const q = query(contatosRef, where('empresaId', '==', empresaId));

    // 3. Escuta em tempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setContatos(lista);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Erro ao buscar contatos:", error);
    return () => {};
  }
}

// Prócimas etapas: Funcções adicionar, editar e deletar