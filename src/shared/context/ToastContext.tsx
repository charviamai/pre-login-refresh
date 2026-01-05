import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastType, ToastAction } from '../components/ui/Toast';

export interface ToastOptions {
    duration?: number;
    action?: ToastAction;
    persistent?: boolean;
}

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    action?: ToastAction;
    persistent?: boolean;
}

interface ToastContextValue {
    showToast: (message: string, type: ToastType, options?: ToastOptions) => void;
    hideToast: (id: string) => void;
    // FUTURE: Can add without breaking changes
    // showPersistent: (toast: PersistentToast) => void;
    // getHistory: () => ToastItem[];
    // clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * ToastProvider Component
 * 
 * Manages global toast state and provides toast API to entire app.
 * Essential for PWA user feedback throughout the application.
 * 
 * Features:
 * - Max 3 toasts at once (FIFO queue)
 * - Auto-dismiss support
 * - Stacking toasts (top-right position)
 * - Future-ready for notification center integration
 */
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const MAX_TOASTS = 3;

    const showToast = useCallback((message: string, type: ToastType, options?: ToastOptions) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newToast: ToastItem = {
            id,
            message,
            type,
            duration: options?.duration,
            action: options?.action,
            persistent: options?.persistent,
        };

        setToasts((prevToasts) => {
            // If we're at max, remove oldest toast
            const updatedToasts = prevToasts.length >= MAX_TOASTS
                ? prevToasts.slice(1)
                : prevToasts;

            return [...updatedToasts, newToast];
        });
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, []);

    const value: ToastContextValue = {
        showToast,
        hideToast,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast
                            id={toast.id}
                            message={toast.message}
                            type={toast.type}
                            duration={toast.duration}
                            onClose={hideToast}
                            action={toast.action}
                            persistent={toast.persistent}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

/**
 * useToast Hook
 * 
 * Access toast API from any component
 * 
 * @example
 * const { showToast } = useToast();
 * showToast('Settings saved!', 'success');
 * showToast('Error occurred', 'error');
 * showToast('Update available', 'info', {
 *   action: { label: 'Update', onClick: () => updateApp() }
 * });
 */
export const useToast = (): ToastContextValue => {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    return context;
};

export default ToastProvider;
