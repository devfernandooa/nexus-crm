import { db } from '@/firebase-config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

// ... (função buscarDadosDashboard existente)
export async function buscarContatosRecentes(empresaId) {
    try {
        const contatosRef = collection(db, 'contatos');
        const q = query(contatosRef, where('empresaId', '==', empresaId));
        const snapshot = await getDocs(q);

        const contatos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Ordena no cliente pela data de criação (mais recente primeiro)
        // Usa fallback para dataCriacao ou timestamp do Firestore
        contatos.sort((a, b) => {
            const dataA = a.dataCriacao?.toDate?.() || a.dataCriacao || 0;
            const dataB = b.dataCriacao?.toDate?.() || b.dataCriacao || 0;
            return new Date(dataB) - new Date(dataA);
        });

        return contatos.slice(0, 5); // Retorna apenas os 5 mais recentes
    } catch (error) {
        console.error("Erro ao buscar contatos recentes:", error);
        return [];
    }
}

export async function buscarDadosDashboard(empresaId) {
    try {
        // 1. Buscar Contatos
        const contatosRef = collection(db, 'contatos');
        const qContatos = query(contatosRef, where('empresaId', '==', empresaId));
        const snapshotContatos = await getDocs(qContatos);
        const totalContatos = snapshotContatos.size;

        // 2. Buscar Negócios (todos para calcular KPIs)
        const negociosRef = collection(db, 'negocios');
        const qNegocios = query(negociosRef, where('empresaId', '==', empresaId));
        const snapshotNegocios = await getDocs(qNegocios);
        const negocios = snapshotNegocios.docs.map(doc => doc.data());

        const negociosAbertos = negocios.filter(n => n.status === 'Aberto').length;
        const negociosGanhos = negocios.filter(n => n.status === 'Ganho').length;
        const receitaGanha = negocios
            .filter(n => n.status === 'Ganho')
            .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

        // 3. Buscar Tarefas Pendentes
        const tarefasRef = collection(db, 'tarefas');
        const qTarefas = query(tarefasRef, where('empresaId', '==', empresaId), where('concluida', '==', false));
        const snapshotTarefas = await getDocs(qTarefas);
        const tarefasPendentes = snapshotTarefas.size;

        // 4. Total de Usuários da Empresa
        const usuariosRef = collection(db, 'usuarios');
        const qUsuarios = query(usuariosRef, where('empresaId', '==', empresaId));
        const snapshotUsuarios = await getDocs(qUsuarios);
        const totalUsuarios = snapshotUsuarios.size;

        return {
            sucesso: true,
            dados: {
                totalContatos,
                negociosAbertos,
                negociosGanhos,
                receitaGanha,
                tarefasPendentes,
                totalUsuarios,
            }
        };
    } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        return { sucesso: false, erro: error.message };
    }
}