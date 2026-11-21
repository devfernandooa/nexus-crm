import { useState, useEffect, useMemo } from 'react';
import { escutarNegocios, atualizarNegocio, deletarNegocio } from '@/services/negocioService';
import { buscarConfiguracoesEmpresa } from '@/services/empresaService';
import toast from 'react-hot-toast';

export function useNegociosKanban(empresaId) {
    const [negocios, setNegocios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [negocioDetalhes, setNegocioDetalhes] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [idParaDeletar, setIdParaDeletar] = useState(null);
    const [colunasDinamicas, setColunasDinamicas] = useState([]);
    const [loadingFunil, setLoadingFunil] = useState(true);

    const coresPadrao = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-yellow-500', 'bg-teal-500', 'bg-cyan-500'];

    // Carregar Funil Dinâmico
    useEffect(() => {
        if (!empresaId) return;
        const carregarFunil = async () => {
            try {
                const res = await buscarConfiguracoesEmpresa(empresaId);
                let etapasBase = ['Prospecção', 'Qualificação', 'Proposta'];
                if (res.sucesso && res.dados?.etapasFunil && res.dados.etapasFunil.length > 0) {
                    etapasBase = res.dados.etapasFunil;
                }
                const colunasFormatadas = etapasBase.map((etapa, index) => ({
                    id: etapa, titulo: etapa, cor: coresPadrao[index % coresPadrao.length], index
                }));
                setColunasDinamicas(colunasFormatadas);
            } catch (error) { console.error("Erro ao carregar funil:", error); } finally { setLoadingFunil(false); }
        };
        carregarFunil();
    }, [empresaId]);

    // Carregar Negócios
    useEffect(() => {
        if (!empresaId) return;
        const unsubscribe = escutarNegocios(empresaId, (lista) => { setNegocios(lista); setLoading(false); });
        return () => unsubscribe();
    }, [empresaId]);

    // Migração Automática de Status Antigos
    useEffect(() => {
        if (colunasDinamicas.length === 0 || negocios.length === 0) return;
        const mapaMigracao = {
            'Aberto': colunasDinamicas[0]?.id,
            'Ganho': colunasDinamicas[colunasDinamicas.length - 2]?.id,
            'Perdido': colunasDinamicas[colunasDinamicas.length - 1]?.id
        };
        const negociosParaMigrar = negocios.filter(n => mapaMigracao[n.status] && mapaMigracao[n.status] !== n.status);
        if (negociosParaMigrar.length > 0) {
            const executarMigracao = async () => {
                await Promise.all(negociosParaMigrar.map(n => atualizarNegocio(n.id, { status: mapaMigracao[n.status] })));
                toast.success(`${negociosParaMigrar.length} negócios migrados para o novo funil!`);
            };
            executarMigracao();
        }
    }, [colunasDinamicas, negocios]);

    // KPIs Adaptativos
    const kpiData = useMemo(() => {
        if (colunasDinamicas.length === 0) return { totalAberto: 0, totalGanho: 0, totalPerdido: 0 };
        const idsAberto = colunasDinamicas.slice(0, -2).map(c => c.id);
        const idGanho = colunasDinamicas[colunasDinamicas.length - 2]?.id || colunasDinamicas[0]?.id;
        const idPerdido = colunasDinamicas[colunasDinamicas.length - 1]?.id || colunasDinamicas[0]?.id;
        return {
            totalAberto: negocios.filter(n => idsAberto.includes(n.status)).reduce((acc, c) => acc + Number(c.valor || 0), 0),
            totalGanho: negocios.filter(n => n.status === idGanho).reduce((acc, c) => acc + Number(c.valor || 0), 0),
            totalPerdido: negocios.filter(n => n.status === idPerdido).reduce((acc, c) => acc + Number(c.valor || 0), 0),
        };
    }, [negocios, colunasDinamicas]);

    const handleDragEnd = async (result) => {
        const { source, destination, draggableId } = result;
        if (!destination || source.droppableId === destination.droppableId) return;
        await moverStatus(draggableId, destination.droppableId);
    };

    const handleMoverBotao = async (negocioId, direcao, colunaAtualId) => {
        const indexAtual = colunasDinamicas.findIndex(c => c.id === colunaAtualId);
        if (indexAtual === -1) return;
        let novoIndex = direcao === 'next' ? indexAtual + 1 : indexAtual - 1;
        if (novoIndex >= 0 && novoIndex < colunasDinamicas.length) {
            await moverStatus(negocioId, colunasDinamicas[novoIndex].id);
        }
    };

    const moverStatus = async (id, novoStatus) => {
        const resultado = await atualizarNegocio(id, { status: novoStatus });
        if (resultado.sucesso) toast.success(`Movido para ${novoStatus}!`);
        else toast.error('Erro ao mover.');
    };

    const handleDeletar = (id) => { setIdParaDeletar(id); setIsConfirmOpen(true); };
    const confirmarDelecao = async () => {
        const resultado = await deletarNegocio(idParaDeletar);
        if (resultado.sucesso) {
            toast.success('Excluído!'); setIsConfirmOpen(false);
            if (negocioDetalhes?.id === idParaDeletar) setNegocioDetalhes(null);
        } else { toast.error('Erro ao excluir.'); }
    };

    return {
        negocios, loading, colunas: colunasDinamicas, loadingFunil, kpiData,
        handleDragEnd, handleMoverBotao, handleDeletar, isConfirmOpen, confirmarDelecao,
        negocioDetalhes, handleOpenDetails: (n) => setNegocioDetalhes(n), handleCloseDetails: () => setNegocioDetalhes(null)
    };
}