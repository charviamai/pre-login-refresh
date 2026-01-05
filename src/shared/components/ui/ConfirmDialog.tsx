import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context.confirm;
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        setOptions(opts);
        setIsOpen(true);
        return new Promise((resolve) => {
            setResolveRef(() => resolve);
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        resolveRef?.(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        resolveRef?.(false);
    };

    const variantColors = {
        danger: 'bg-red-600 hover:bg-red-700',
        warning: 'bg-amber-600 hover:bg-amber-700',
        info: 'bg-slate-700 hover:bg-slate-800',
    };

    const variantIcons = {
        danger: (
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
        ),
        warning: (
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 sm:mx-0">
                <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        ),
        info: (
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 sm:mx-0">
                <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        ),
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {/* Confirm Dialog Modal */}
            <Modal
                isOpen={isOpen}
                onClose={handleCancel}
                title=""
                size="sm"
            >
                {options && (
                    <div className="sm:flex sm:items-start">
                        {variantIcons[options.variant || 'info']}
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {options.title || 'Confirm Action'}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-600">
                                    {options.message}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-5 sm:mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <Button
                        variant="secondary"
                        onClick={handleCancel}
                        className="w-full sm:w-auto"
                    >
                        {options?.cancelText || 'Cancel'}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className={`w-full sm:w-auto ${variantColors[options?.variant || 'info']}`}
                    >
                        {options?.confirmText || 'Confirm'}
                    </Button>
                </div>
            </Modal>
        </ConfirmContext.Provider>
    );
};
