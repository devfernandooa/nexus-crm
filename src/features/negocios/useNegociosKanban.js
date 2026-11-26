import { useState, useEffect, useMemo } from 'react';
import { escutarNegocios, atualizarNegocio, deletarNegocio } from '@/services/negocioService';
import { buscarConfiguracoesEmpresa } from '@/services/empresaService';
import { migrarFunilAntigo } from '@/utils/funilUtils';
import { CORES_FUNIL, obterCorPadraoId } from '@/constants/funilCores';
import toast from 'react-hot-toast';

// ATUALIZADO: Agora recebe userRole e userId
export function useNegociosKanban(empresaId, userRole, userId) {
    const [negocios, setNegocios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [negocioDetalhes, setNegocioDetalhes] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [idParaDeletar, setIdParaDeletar] = useState(null);
    const [colunasDinamicas, setColunasDinamicas] = useState([]);
    const [loadingFunil, setLoadingFunil] = useState(true);

    // Carregar Funil Dinâmico
    useEffect(() => {
        if (!empresaId) return;
        const carregarFunil = async () => {
            try {
                const res = await buscarConfiguracoesEmpresa(empresaId);
                const etapasBrutas = res.dados?.etapasFunil || [];

                const etapasFormatadas = migrarFunilAntigo(etapasBrutas);

                const colunas = etapasFormatadas.map((etapa, index) => {
                    const corValida = etapa.cor && CORES_FUNIL[etapa.cor]
                        ? etapa.cor
                        : obterCorPadraoId(etapa, index);

                    return {
                        id: etapa.id,
                        titulo: etapa.nome,
                        tipo: etapa.tipo,
                        cor: corValida
                    };
                });

                setColunasDinamicas(colunas);
            } catch (error) {
                console.error("Erro ao carregar funil:", error);
            } finally {
                setLoadingFunil(false);
            }
        };
        carregarFunil();
    }, [empresaId]);

    // Carregar Negócios
    useEffect(() => {
        if (!empresaId || !userRole || !userId) return;

        //  Passa o role e userId para o service
        const unsubscribe = escutarNegocios(empresaId, userRole, userId, (lista) => {
            setNegocios(lista);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [empresaId, userRole, userId]);

    // Migração Automática de status por nome para slug
    useEffect(() => {
        if (colunasDinamicas.length === 0 || negocios.length === 0) return;

        const mapaMigracao = {};
        colunasDinamicas.forEach(c => {
            mapaMigracao[c.titulo] = c.id;
            mapaMigracao[c.id] = c.id;
        });

        const negociosParaMigrar = negocios.filter(n => mapaMigracao[n.status] && mapaMigracao[n.status] !== n.status);

        if (negociosParaMigrar.length > 0) {
            const executarMigracao = async () => {
                await Promise.all(negociosParaMigrar.map(n => atualizarNegocio(n.id, { status: mapaMigracao[n.status] })));
                toast.success(`${negociosParaMigrar.length} negócios atualizados para o novo funil!`);
            };
            executarMigracao();
        }
    }, [colunasDinamicas, negocios]);

    // KPIs baseados no TIPO da coluna
    const kpiData = useMemo(() => {
        if (colunasDinamicas.length === 0) return { totalAberto: 0, totalGanho: 0, totalPerdido: 0 };

        let idGanho = colunasDinamicas.find(c => c.tipo === 'ganho')?.id;
        let idPerdido = colunasDinamicas.find(c => c.tipo === 'perdido')?.id;

        if (!idGanho) idGanho = colunasDinamicas[colunasDinamicas.length - 2]?.id;
        if (!idPerdido) idPerdido = colunasDinamicas[colunasDinamicas.length - 1]?.id;

        const idsAberto = colunasDinamicas.filter(c => c.id !== idGanho && c.id !== idPerdido).map(c => c.id);

        return {
            totalAberto: negocios.filter(n => idsAberto.includes(n.status)).reduce((acc, c) => acc + Number(c.valor || 0), 0),
            totalGanho: negocios.filter(n => n.status === idGanho).reduce((acc, c) => acc + Number(c.valor || 0), 0),
            totalPerdido: negocios.filter(n => n.status === idPerdido).reduce((acc, c) => acc + Number(c.valor || 0), 0),
        };
    }, [negocios, colunasDinamicas]);

    // Agrupamento de Colunas incluindo os Negócios Órfãos
    const colunasAgrupadas = useMemo(() => {
        if (colunasDinamicas.length === 0) return [];

        const colunas = colunasDinamicas.map(coluna => {
            return { ...coluna, cards: negocios.filter(n => n.status === coluna.id) };
        });

        const negociosOrfaos = negocios.filter(negocio => {
            return !colunasDinamicas.some(coluna => coluna.id === negocio.status);
        });

        if (negociosOrfaos.length > 0) {
            colunas.push({
                id: 'sem-etapa',
                titulo: '⚠️ Sem Etapa',
                tipo: 'erro',
                cor: 'rose',
                isVirtual: true,
                cards: negociosOrfaos
            });
        }

        return colunas;
    }, [negocios, colunasDinamicas]);

    const handleDragEnd = async (result) => {
        const { source, destination, draggableId } = result;
        if (!destination || source.droppableId === destination.droppableId) return;
        if (destination.droppableId === 'sem-etapa') {
            toast.error('Escolha uma etapa válida.'); return;
        }
        await moverStatus(draggableId, destination.droppableId);
    };

    const handleMoverBotao = async (negocioId, direcao, colunaAtualId) => {
        if (colunaAtualId === 'sem-etapa' && direcao === 'prev') {
            const ultimaEtapaAberta = [...colunasDinamicas].reverse().find(c => c.tipo === 'aberto');
            if (ultimaEtapaAberta) await moverStatus(negocioId, ultimaEtapaAberta.id);
            return;
        }
        const indexAtual = colunasDinamicas.findIndex(c => c.id === colunaAtualId);
        if (indexAtual === -1) return;
        let novoIndex = direcao === 'next' ? indexAtual + 1 : indexAtual - 1;
        if (novoIndex >= 0 && novoIndex < colunasDinamicas.length) {
            await moverStatus(negocioId, colunasDinamicas[novoIndex].id);
        }
    };

    const moverStatus = async (id, novoStatus) => {
        const resultado = await atualizarNegocio(id, { status: novoStatus });
        if (resultado.sucesso) {
            const nomeColuna = colunasDinamicas.find(c => c.id === novoStatus)?.titulo || novoStatus;
            toast.success(`Movido para ${nomeColuna}!`);
        } else { toast.error('Erro ao mover.'); }
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
        negocios, loading, colunas: colunasAgrupadas, loadingFunil, kpiData,
        handleDragEnd, handleMoverBotao, handleDeletar, isConfirmOpen, confirmarDelecao,
        negocioDetalhes, handleOpenDetails: (n) => setNegocioDetalhes(n), handleCloseDetails: () => setNegocioDetalhes(null)
    };
}