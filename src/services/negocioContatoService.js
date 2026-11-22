import { db } from '@/firebase-config';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export async function garantirContatoVinculado({
    empresaId,
    nomeContato,
    telefoneOuEmail,
    tipo = 'lead',
}) {
    const nomeLimpo = String(nomeContato || '').trim();
    const infoLimpa = String(telefoneOuEmail || '').trim();
    if (!empresaId || (!nomeLimpo && !infoLimpa)) return null;

    const contatosRef = collection(db, 'contatos');
    const q = query(contatosRef, where('empresaId', '==', empresaId));
    const snap = await getDocs(q);

    const digitsBusca = infoLimpa.replace(/\D/g, '');

    const existente = snap.docs.find((d) => {
        const data = d.data();
        const telDigits = String(data.telefone || data.contato || '').replace(/\D/g, '');
        const matchTel = digitsBusca && telDigits && telDigits === digitsBusca;
        const matchEmail =
            infoLimpa &&
            data.email &&
            String(data.email).toLowerCase() === infoLimpa.toLowerCase();
        const matchNome =
            nomeLimpo &&
            data.nome &&
            String(data.nome).trim().toLowerCase() === nomeLimpo.toLowerCase();
        return matchTel || matchEmail || matchNome;
    });

    if (existente) {
        return existente.id;
    }

    const apenasNumeros = /^\d{8,15}$/.test(digitsBusca) && !infoLimpa.includes('@');
    const novoContato = await addDoc(contatosRef, {
        empresaId,
        nome: nomeLimpo || infoLimpa,
        telefone: apenasNumeros ? infoLimpa : '',
        email: infoLimpa.includes('@') ? infoLimpa : '',
        tipo,
        origem: 'negocio',
        dataCriacao: new Date(),
    });

    return novoContato.id;
}