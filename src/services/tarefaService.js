import { db } from '@/firebase-config';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';

export async function adicionarTarefa(dados, empresaId) {
    try {
        const ref = collection(db, 'tarefas');
        await addDoc(ref, {
            ...dados,
            empresaId,
            dataCriacao: serverTimestamp(),
        });
        return { sucesso: true };
    } catch (error) {
        console.error("Erro ao criar tarefa:", error);
        return { sucesso: false, erro: error.message };
    }
}

export async function atualizarTarefa(id, dados) {
    try {
        const ref = doc(db, 'tarefas', id);
        await updateDoc(ref, dados);
        return { sucesso: true };
    } catch (error) {
        console.error("Erro ao atualizar tarefa:", error);
        return { sucesso: false, erro: error.message };
    }
}

export async function deletarTarefa(id) {
    try {
        const ref = doc(db, 'tarefas', id);
        await deleteDoc(ref);
        return { sucesso: true };
    } catch (error) {
        console.error("Erro ao deletar tarefa:", error);
        return { sucesso: false, erro: error.message };
    }
}

export function escutarTarefas(empresaId, callback) {
    const ref = collection(db, 'tarefas');
    const q = query(ref, where('empresaId', '==', empresaId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const lista = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Ordena pela data de vencimento (mais próximas primeiro)
        lista.sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));
        callback(lista);
    });

    return unsubscribe;
}