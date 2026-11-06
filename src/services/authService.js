import { auth, db } from '../firebase-config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';

export async function criarContaComEmpresa(nomeEmpresa, nomeResponsavel, segmento, email, senha) {
    try {
        // 1. Cria o usuário no Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        // 2. Cria a referência da Empresa
        const empresaRef = doc(collection(db, 'empresas'));
        const empresaId = empresaRef.id;

        // 3. Salva a Empresa com os novos dados
        await setDoc(empresaRef, {
            nome: nomeEmpresa,
            responsavel: nomeResponsavel,
            segmento: segmento,
            dataCriacao: new Date(),
        });

        // 4. Salva o Usuário (Admin) vinculado à empresa
        const usuarioRef = doc(db, 'usuarios', user.uid);
        await setDoc(usuarioRef, {
            email: user.email,
            nome: nomeResponsavel, // Bônus: salvar o nome no perfil também
            empresaId: empresaId,
            role: 'admin',
            dataCriacao: new Date(),
        });

        return { sucesso: true };
    } catch (error) {
        console.error('Erro ao criar conta com empresa:', error);
        return { sucesso: false, erro: error.code };
    }
}