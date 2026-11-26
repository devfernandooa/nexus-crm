import { auth, db } from '@/firebase-config';
import {
    createUserWithEmailAndPassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    signOut
} from 'firebase/auth';
import { collection, doc, setDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export async function criarContaComEmpresa(nomeEmpresa, nomeResponsavel, segmento, email, senha) {
    try {
        // 1. Cria o usuário no Auth PRIMEIRO
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        try {
            // 2. Verifica se existe um convite pendente
            const convitesRef = collection(db, 'convites');
            const q = query(convitesRef, where('email', '==', email));
            const snapshotConvite = await getDocs(q);

            if (!snapshotConvite.empty) {
                // --- FLUXO DE CONVITE ---
                const convite = snapshotConvite.docs[0];
                const dadosConvite = convite.data();

                // 3. Salva o documento do usuário
                const usuarioRef = doc(db, 'usuarios', user.uid);
                await setDoc(usuarioRef, {
                    email: user.email,
                    nome: nomeResponsavel,
                    empresaId: dadosConvite.empresaId,
                    role: dadosConvite.role,
                    dataCriacao: new Date(),
                });

                // 4. Apaga o convite
                await deleteDoc(convite.ref);

                return { sucesso: true };
            } else {
                // --- FLUXO NORMAL (Criar nova empresa) ---
                const empresaRef = doc(collection(db, 'empresas'));
                const empresaId = empresaRef.id;

                await setDoc(empresaRef, {
                    nome: nomeEmpresa,
                    responsavel: nomeResponsavel,
                    segmento: segmento,
                    dataCriacao: new Date(),
                });

                const usuarioRef = doc(db, 'usuarios', user.uid);
                await setDoc(usuarioRef, {
                    email: user.email,
                    nome: nomeResponsavel,
                    empresaId: empresaId,
                    role: 'admin',
                    dataCriacao: new Date(),
                });

                return { sucesso: true };
            }
        } catch (innerError) {
            // SE QUALQUER COISA FALHAR NO FIRESTORE, DELETA O USUÁRIO DO AUTH
            console.error('Erro no Firestore, revertendo criação de usuário:', innerError);
            try {
                await user.delete(); // Reverte a criação do usuário
            } catch (deleteError) {
                console.error('Erro ao reverter usuário do Auth:', deleteError);
            }
            throw innerError; // Repassa o erro
        }

    } catch (error) {
        console.error('Erro ao criar conta:', error);
        return { sucesso: false, erro: error.code || error.message };
    }
}

/**
 * Altera a senha do usuário logado.
 * Requer reautenticação por segurança do Firebase.
 */
export async function alterarSenha(senhaAtual, novaSenha) {
    const user = auth.currentUser;

    if (!user) {
        toast.error('Usuário não autenticado.');
        return { sucesso: false, erro: 'Usuário não autenticado' };
    }

    try {
        // 1. Reautentica (Firebase exige para trocar senha)
        const credential = EmailAuthProvider.credential(user.email, senhaAtual);
        await reauthenticateWithCredential(user, credential);

        // 2. Atualiza a senha
        await updatePassword(user, novaSenha);

        // 3. Faz o logout para "limpar" a sessão
        await signOut(auth);

        toast.success('Senha alterada com sucesso! Faça login novamente.');
        return { sucesso: true };

    } catch (error) {
        console.error("Erro ao alterar senha:", error);

        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            toast.error('A senha atual está incorreta.');
            return { sucesso: false, erro: 'Senha atual incorreta' };
        } else {
            toast.error('Erro ao alterar senha: ' + error.message);
            return { sucesso: false, erro: error.message };
        }
    }
}