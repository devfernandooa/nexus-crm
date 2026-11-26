import { useEffect, useRef, useCallback } from 'react';

export function useInactivityLogout(
    onLogout,
    timeoutMs = 30 * 60 * 1000,
    options = {}
) {
    const {
        warningMs = 60 * 1000, // 1 minuto antes de expirar (ajuste para teste se quiser)
        onWarning,
    } = options;

    const onLogoutRef = useRef(onLogout);
    const onWarningRef = useRef(onWarning);
    const lastActivityRef = useRef(Date.now());
    const lastResetCallRef = useRef(0);
    const expiredRef = useRef(false);

    useEffect(() => {
        onLogoutRef.current = onLogout;
    }, [onLogout]);

    useEffect(() => {
        onWarningRef.current = onWarning;
    }, [onWarning]);

    const resetTimer = useCallback(() => {
        if (expiredRef.current) return;

        const now = Date.now();
        // Evita resetar mais de uma vez por segundo em rajadas de eventos
        if (now - lastResetCallRef.current < 1000) return;

        lastResetCallRef.current = now;
        lastActivityRef.current = now;
    }, []);

    useEffect(() => {
        expiredRef.current = false;
        lastActivityRef.current = Date.now();

        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach((event) =>
            window.addEventListener(event, resetTimer, { passive: true })
        );

        const interval = setInterval(() => {
            if (expiredRef.current) return;

            const elapsed = Date.now() - lastActivityRef.current;
            const remainingMs = timeoutMs - elapsed;

            if (remainingMs <= 0) {
                expiredRef.current = true;
                clearInterval(interval);
                onLogoutRef.current?.();
                return;
            }

            if (warningMs > 0 && remainingMs <= warningMs && onWarningRef.current) {
                onWarningRef.current(Math.max(1, Math.ceil(remainingMs / 1000)));
            }
        }, 1000);

        return () => {
            events.forEach((event) => window.removeEventListener(event, resetTimer));
            clearInterval(interval);
        };
    }, [timeoutMs, warningMs, resetTimer]);

    return { resetTimer };
}