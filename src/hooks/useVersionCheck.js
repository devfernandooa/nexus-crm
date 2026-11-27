import { useState, useEffect, useCallback } from 'react';

const VERSAO_ATUAL = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

export function useVersionCheck(intervaloMs = 5 * 60 * 1000) {
    const [novaVersao, setNovaVersao] = useState(null);
    const [dispensada, setDispensada] = useState(false);

    const verificarVersao = useCallback(async () => {
        try {
            const res = await fetch(`/version.json?t=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' },
            });
            if (!res.ok) return;

            const dados = await res.json();
            if (dados?.version && dados.version !== VERSAO_ATUAL) {
                setNovaVersao(dados);
                setDispensada(false);
            }
        } catch {
            // Silencioso em caso de oscilação de rede
        }
    }, []);

    useEffect(() => {
        verificarVersao();

        const timer = setInterval(verificarVersao, intervaloMs);
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') verificarVersao();
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [verificarVersao, intervaloMs]);

    const aplicarAtualizacao = useCallback(async () => {
        try {
            if ('caches' in window) {
                const chaves = await caches.keys();
                await Promise.all(chaves.map((c) => caches.delete(c)));
            }
        } finally {
            window.location.reload();
        }
    }, []);

    return {
        versaoAtual: VERSAO_ATUAL,
        novaVersao,
        exibirAviso: Boolean(novaVersao) && (!dispensada || novaVersao?.obrigatoria),
        dispensarAviso: () => setDispensada(true),
        aplicarAtualizacao,
    };
}