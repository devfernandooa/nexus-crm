import { db } from '@/firebase-config';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

// 1. Criar um novo convite
export async function criarConvite(email, empresaId, role) {
    try {
        const convitesRef = collection(db, 'convites');
        // Verifica se já existe um convite pendente para esse e-mail
        const q = query(convitesRef, where('email', '==', email), where('empresaId', '==', empresaId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return { sucesso: false, erro: 'Este e-mail já possui um convite pendente.' };
        }

        await addDoc(convitesRef, {
            email,
            empresaId,
            role,
            status: 'pendente',
            dataCriacao: new Date()
        });
        return { sucesso: true };
    } catch (error) {
        return { sucesso: false, erro: error.message };
    }
}

// 2. Escutar os membros da equipe em tempo real
export function escutarEquipe(empresaId, callback) {
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('empresaId', '==', empresaId));

    return onSnapshot(q, (snapshot) => {
        const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(lista);
    });
}

// 3. Escutar os convites pendentes em tempo real
export function escutarConvites(empresaId, callback) {
    const convitesRef = collection(db, 'convites');
    const q = query(convitesRef, where('empresaId', '==', empresaId));

    return onSnapshot(q, (snapshot) => {
        const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(lista);
    });
}

// 4. Cancelar um convite
export async function cancelarConvite(id) {
    try {
        await deleteDoc(doc(db, 'convites', id));
        return { sucesso: true };
    } catch (error) {
        return { sucesso: false, erro: error.message };
    }
}