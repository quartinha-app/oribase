import { useEffect, useRef } from 'react';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useInactivityTimeout = (onTimeout: () => void) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(onTimeout, INACTIVITY_TIMEOUT);
    };

    useEffect(() => {
        // Events that indicate user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        // Set initial timer
        resetTimer();

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [onTimeout]);
};
