import { auth, db } from '../firebase-config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';

export async function criarContaComEmpresa(nomeEmpresa, email, senha) {
    try {
        // 1. Cria o usuário no Auth (O Firebase já faz a validação de e-mail único)
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            senha,
        );
        const user = userCredential.user;

        /* 2. Cria um "Documento" na coleção 'empresas' (gerando um ID automático)
           Prepara a referência da Empresa (Gera um ID vazio, mas único)
           O ideal é que o documento da empresa tenha o nome dela.
           (Como gerar um ID único? Dica: use a função `doc(collection(db, 'empresas'))` para pré-gerar um ID).
        */
        const empresaRef = doc(collection(db, "empresas"));
        const empresaId = empresaRef.id; // ID gerado automaticamente, o "número do apartamento"
        await setDoc(empresaRef, { nome: nomeEmpresa });

        await setDoc(empresaRef, {
            nome: nomeEmpresa,
            createdAt: new Date(),
        });
        // 3. Cria o documento na coleção 'usuarios' com o mesmo UID do Auth.
        // Salvando: o email, o empresaId (gerado no passo 2) e o role: 'admin'.
        const usuarioRef = doc(db, "usuarios", user.uid);
        await setDoc(usuarioRef, {
            email: user.email,
            empresaId: empresaId, // <-- O vínculo mágico entre o usuário e a empresa
            role: "admin", // <-- O primeiro usuário é o administrador
            dataCriacao: new Date(),
        });

        return { sucesso: true };
    } catch (error) {
        console.error('Erro ao criar conta com empresa:', error);
        // Tratar erros (ex: email já em uso)
        return { sucesso: false, erro: error.code };
    }
}