import { useState, useEffect, useMemo } from 'react';
import { escutarNegocios, atualizarNegocio, deletarNegocio } from '@/services/negocioService';
import { buscarConfiguracoesEmpresa } from '@/services/empresaService';
import { migrarFunilAntigo } from '@/utils/funilUtils'; // <-- IMPORTANTE
import toast from 'react-hot-toast';

export function useNegociosKanban(empresaId) {
    const [negocios, setNegocios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [negocioDetalhes, setNegocioDetalhes] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [idParaDeletar, setIdParaDeletar] = useState(null);
    const [colunasDinamicas, setColunasDinamicas] = useState([]);
    const [loadingFunil, setLoadingFunil] = useState(true);

    // O ID (slug) agora define a cor. O tipo define o comportamento.
    const coresPorTipo = {
        'aberto': ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-yellow-500', 'bg-teal-500', 'bg-cyan-500'],
        'ganho': 'bg-emerald-500',
        'perdido': 'bg-red-500'
    };

    // Carregar Funil Dinâmico
    useEffect(() => {
        if (!empresaId) return;
        const carregarFunil = async () => {
            try {
                const res = await buscarConfiguracoesEmpresa(empresaId);
                let etapasBrutas = res.dados?.etapasFunil || [];

                // Aplica a migração se necessário
                const etapasFormatadas = migrarFunilAntigo(etapasBrutas);

                let indexAberto = 0;
                const colunas = etapasFormatadas.map((etapa) => {
                    let cor = coresPorTipo[etapa.tipo];
                    if (etapa.tipo === 'aberto') {
                        cor = coresPorTipo.aberto[indexAberto % coresPorTipo.aberto.length];
                        indexAberto++;
                    }

                    return {
                        id: etapa.id,
                        titulo: etapa.nome,
                        tipo: etapa.tipo, // 'aberto', 'ganho' ou 'perdido'
                        cor: cor
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
        if (!empresaId) return;
        const unsubscribe = escutarNegocios(empresaId, (lista) => { setNegocios(lista); setLoading(false); });
        return () => unsubscribe();
    }, [empresaId]);

    // NOVO: Migração Automática de status por nome para slug
    useEffect(() => {
        if (colunasDinamicas.length === 0 || negocios.length === 0) return;

        // Mapeia do nome da etapa para o ID (slug) dela
        const mapaMigracao = {};
        colunasDinamicas.forEach(c => {
            mapaMigracao[c.titulo] = c.id; // Ex: "Prospecção" -> "prospeccao"
            mapaMigracao[c.id] = c.id;    // Ex: "prospeccao" -> "prospeccao" (para manter os que já migraram)
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

        // Procura as colunas marcadas com o tipo. 
        // Se não achar, usa a penúltima como ganho e a última como perdido (Fallback)
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
                id: 'sem-etapa', titulo: '⚠️ Sem Etapa', tipo: 'erro', cor: 'bg-red-500', isVirtual: true, cards: negociosOrfaos
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