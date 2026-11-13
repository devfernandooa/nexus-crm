import { db } from '@/firebase-config';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';

export async function adicionarProduto(dados, empresaId) {
    try {
        const ref = collection(db, 'produtos');
        await addDoc(ref, {
            ...dados,
            empresaId,
            dataCriacao: serverTimestamp(),
        });
        return { sucesso: true };
    } catch (error) {
        console.error("Erro ao criar produto:", error);
        return { sucesso: false, erro: error.message };
    }
}

export async function atualizarProduto(id, dados) {
    try {
        const ref = doc(db, 'produtos', id);
        await updateDoc(ref, dados);
        return { sucesso: true };
    } catch (error) {
        return { sucesso: false, erro: error.message };
    }
}

export async function deletarProduto(id) {
    try {
        const ref = doc(db, 'produtos', id);
        await deleteDoc(ref);
        return { sucesso: true };
    } catch (error) {
        return { sucesso: false, erro: error.message };
    }
}

export function escutarProdutos(empresaId, callback) {
    const ref = collection(db, 'produtos');
    const q = query(ref, where('empresaId', '==', empresaId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const lista = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Ordena alfabeticamente pelo nome
        lista.sort((a, b) => a.nome.localeCompare(b.nome));
        callback(lista);
    });

    return unsubscribe;
}