import { auth, db } from '../firebase-config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';

export async function criarContaComEmpresa(nomeEmpresa, nomeResponsavel, segmento, email, senha) {
    try {
        // 1. Verifica se existe um convite pendente para este e-mail
        const convitesRef = collection(db, 'convites');
        const q = query(convitesRef, where('email', '==', email));
        const snapshotConvite = await getDocs(q);

        // 2. Cria o usuário no Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        if (!snapshotConvite.empty) {
            // --- FLUXO DE CONVITE ---
            const convite = snapshotConvite.docs[0];
            const dadosConvite = convite.data();

            // Vincula o usuário à empresa do convite
            const usuarioRef = doc(db, 'usuarios', user.uid);
            await setDoc(usuarioRef, {
                email: user.email,
                nome: nomeResponsavel, // O convidado digita o nome dele no cadastro
                empresaId: dadosConvite.empresaId,
                role: dadosConvite.role,
                dataCriacao: new Date(),
            });

            // Apaga o convite (já foi usado)
            await deleteDoc(convite.ref);

            // (Opcional: buscar o nome da empresa para salvar no perfil do usuário)

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
                nomeEmpresa: nomeEmpresa,
                empresaId: empresaId,
                role: 'admin',
                dataCriacao: new Date(),
            });

            return { sucesso: true };
        }
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        return { sucesso: false, erro: error.code };
    }
}