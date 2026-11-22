import { db } from '@/firebase-config';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';


export async function buscarContatosRecentes(empresaId) {
    try {
        const contatosRef = collection(db, 'contatos');
        const q = query(contatosRef, where('empresaId', '==', empresaId));
        const snapshot = await getDocs(q);

        const contatos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        contatos.sort((a, b) => {
            const dataA = a.dataCriacao?.toDate?.() || a.dataCriacao || 0;
            const dataB = b.dataCriacao?.toDate?.() || b.dataCriacao || 0;
            return new Date(dataB) - new Date(dataA);
        });

        return contatos.slice(0, 5);
    } catch (error) {
        console.error("Erro ao buscar contatos recentes:", error);
        return [];
    }
}

export function escutarDadosDashboard(empresaId, callback) {
    const unsubContatos = onSnapshot(query(collection(db, 'contatos'), where('empresaId', '==', empresaId)), (snapContatos) => {
        const totalContatos = snapContatos.size;

        const unsubNegocios = onSnapshot(query(collection(db, 'negocios'), where('empresaId', '==', empresaId)), (snapNegocios) => {
            // Aqui está o pulo do gato: usamos o ID exato 'proposta' para os ganhos
            const idGanho = 'proposta';
            const idsAbertos = ['prospeccao', 'demo-online', 'demo-presencial', 'qualificacao'];

            let negociosAbertos = 0;
            let negociosGanhos = 0;
            let receitaGanha = 0;

            snapNegocios.docs.forEach(doc => {
                const negocio = doc.data();
                if (idsAbertos.includes(negocio.status)) {
                    negociosAbertos++;
                } else if (negocio.status === idGanho) {
                    negociosGanhos++;
                    receitaGanha += Number(negocio.valor || 0);
                }
            });

            callback({
                totalContatos,
                negociosAbertos,
                negociosGanhos,
                receitaGanha,
                tarefasPendentes: 0, // Para simplificar o teste agora
                totalUsuarios: 1     // Para simplificar o teste agora
            });

            // Retorna o unsub de negocios
            return () => unsubNegocios();
        });
    });

    return () => unsubContatos();
}