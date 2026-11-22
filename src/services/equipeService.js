import { db } from '@/firebase-config';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    onSnapshot,
    updateDoc,
    getDoc,
    setDoc,
} from 'firebase/firestore';

// 0. Escutar e atualizar Nome da Equipe na empresa
export function escutarNomeEquipe(empresaId, callback) {
    if (!empresaId) return () => { };
    const empresaRef = doc(db, 'empresas', empresaId);

    return onSnapshot(empresaRef, (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            callback(data.nomeEquipe || data.nome || '');
        } else {
            callback('');
        }
    });
}

export async function salvarNomeEquipe(empresaId, nomeEquipe) {
    try {
        if (!empresaId) return { sucesso: false, erro: 'Empresa não identificada.' };
        const nomeLimpo = String(nomeEquipe || '').trim();
        if (!nomeLimpo) return { sucesso: false, erro: 'Informe um nome para a equipe.' };

        const empresaRef = doc(db, 'empresas', empresaId);
        const snap = await getDoc(empresaRef);

        if (snap.exists()) {
            await updateDoc(empresaRef, {
                nomeEquipe: nomeLimpo,
                atualizadoEm: new Date(),
            });
        } else {
            await setDoc(
                empresaRef,
                {
                    nomeEquipe: nomeLimpo,
                    criadoEm: new Date(),
                },
                { merge: true }
            );
        }

        return { sucesso: true };
    } catch (error) {
        return { sucesso: false, erro: error.message };
    }
}

// 1. Criar um novo convite
export async function criarConvite(email, empresaId, role) {
    try {
        const emailLimpo = String(email || '').trim().toLowerCase();
        const convitesRef = collection(db, 'convites');
        const q = query(
            convitesRef,
            where('email', '==', emailLimpo),
            where('empresaId', '==', empresaId)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return { sucesso: false, erro: 'Este e-mail já possui um convite pendente.' };
        }

        await addDoc(convitesRef, {
            email: emailLimpo,
            empresaId,
            role,
            status: 'pendente',
            dataCriacao: new Date(),
        });
        return { sucesso: true };
    } catch (error) {
        return { sucesso: false, erro: error.message };
    }
}

// 1b. Adicionar membro diretamente na equipe (coleção usuarios)
export async function adicionarMembroEquipe(empresaId, dadosMembro) {
    try {
        if (!empresaId) return { sucesso: false, erro: 'Empresa não identificada.' };

        const nomeLimpo = String(dadosMembro?.nome || '').trim();
        const emailLimpo = String(dadosMembro?.email || '').trim().toLowerCase();
        const telefoneLimpo = String(dadosMembro?.telefone || '').trim();
        const cargoLimpo = String(dadosMembro?.cargo || '').trim();
        const roleLimpo = dadosMembro?.role || 'vendedor';

        if (!nomeLimpo) return { sucesso: false, erro: 'Informe o nome do membro.' };
        if (!emailLimpo) return { sucesso: false, erro: 'Informe o e-mail do membro.' };

        const usuariosRef = collection(db, 'usuarios');
        const q = query(
            usuariosRef,
            where('email', '==', emailLimpo),
            where('empresaId', '==', empresaId)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return { sucesso: false, erro: 'Já existe um membro com este e-mail nesta equipe.' };
        }

        const docRef = await addDoc(usuariosRef, {
            nome: nomeLimpo,
            email: emailLimpo,
            telefone: telefoneLimpo,
            cargo: cargoLimpo,
            role: roleLimpo,
            empresaId,
            ativo: true,
            dataCriacao: new Date(),
        });

        return { sucesso: true, id: docRef.id };
    } catch (error) {
        return { sucesso: false, erro: error.message };
    }
}

// 2. Escutar os membros da equipe em tempo real
export function escutarEquipe(empresaId, callback) {
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('empresaId', '==', empresaId));

    return onSnapshot(q, (snapshot) => {
        const lista = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(lista);
    });
}

// 3. Escutar os convites pendentes em tempo real
export function escutarConvites(empresaId, callback) {
    const convitesRef = collection(db, 'convites');
    const q = query(convitesRef, where('empresaId', '==', empresaId));

    return onSnapshot(q, (snapshot) => {
        const lista = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
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

// 5. Editar dados completos do membro (e manter compatibilidade com atualizarCargoMembro)
export async function atualizarDadosMembro(uid, dadosAtualizados) {
    try {
        const userRef = doc(db, 'usuarios', uid);
        const payload = {
            ...(dadosAtualizados?.nome !== undefined
                ? { nome: String(dadosAtualizados.nome).trim() }
                : {}),
            ...(dadosAtualizados?.email !== undefined
                ? { email: String(dadosAtualizados.email).trim().toLowerCase() }
                : {}),
            ...(dadosAtualizados?.telefone !== undefined
                ? { telefone: String(dadosAtualizados.telefone).trim() }
                : {}),
            ...(dadosAtualizados?.cargo !== undefined
                ? { cargo: String(dadosAtualizados.cargo).trim() }
                : {}),
            ...(dadosAtualizados?.role !== undefined ? { role: dadosAtualizados.role } : {}),
            atualizadoEm: new Date(),
        };

        await updateDoc(userRef, payload);
        return { sucesso: true };
    } catch (error) {
        return { sucesso: false, erro: error.message };
    }
}

export async function atualizarCargoMembro(uid, novoRole) {
    return atualizarDadosMembro(uid, { role: novoRole });
}

// 6. Remover membro
export async function removerMembroEquipe(uid) {
    try {
        const userRef = doc(db, 'usuarios', uid);
        await deleteDoc(userRef);
        return { sucesso: true };
    } catch (error) {
        return { sucesso: false, erro: error.message };
    }
}