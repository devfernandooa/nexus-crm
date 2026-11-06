import { db } from '@/firebase-config';

import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';

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


export async function adicionarContato(dadosContato, empresaId) {
  try {
    const contatosRef = collection(db, 'contatos');
    
    // Adiciona o documento incluindo o empresaId para o isolamento Multi-tenant
    const docRef = await addDoc(contatosRef, {
      ...dadosContato,
      empresaId: empresaId,
      dataCriacao: new Date(),
    });
    
    return { sucesso: true, id: docRef.id };
  } catch (error) {
    console.error("Erro ao adicionar contato:", error);
    return { sucesso: false, erro: error.message };
  }
}

// Próximas etapas: Funcções adicionar, editar e deletar