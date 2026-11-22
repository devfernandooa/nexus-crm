import { useEffect, useRef } from 'react';

export function useInactivityLogout(onLogout, timeoutMs = 30 * 60 * 1000) {
    const timerRef = useRef(null);

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            onLogout();
        }, timeoutMs);
    };

    useEffect(() => {
        // Eventos que indicam atividade do usuário
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

        // Registra os listeners
        events.forEach((event) => window.addEventListener(event, resetTimer));

        // Inicia o timer na montagem
        resetTimer();

        // Limpeza ao desmontar
        return () => {
            events.forEach((event) => window.removeEventListener(event, resetTimer));
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [onLogout, timeoutMs]);

    return null;
}