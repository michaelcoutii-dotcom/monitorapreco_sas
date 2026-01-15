import { useState, useCallback } from 'react';

/**
 * Custom hook for managing toast notifications.
 */
const useToasts = (timeout = 4000) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        if (timeout) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, timeout);
        }
    }, [timeout]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, addToast, removeToast };
};

export default useToasts;
