import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../shared/utils/api-service';
import { Modal, Button } from '../../../shared/components/ui';
import { Loading } from '../../../shared/components/Loading';
import { useToast } from '../../../shared/context/ToastContext';

interface RestoreCustomerModalProps {
    customerId: string;
    isOpen: boolean;
    onClose: () => void;
    onRestoreSuccess?: () => void;
}

interface DeletedCustomerDetails {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    shop_name: string;
    deleted_at: string;
    deleted_by?: string;
    is_online_gamer: boolean;
}

export const RestoreCustomerModal: React.FC<RestoreCustomerModalProps> = ({
    customerId,
    isOpen,
    onClose,
    onRestoreSuccess,
}) => {
    const { showToast } = useToast();
    const [customerLoading, setLoading] = useState(true);
    const [customer, setCustomer] = useState<DeletedCustomerDetails | null>(null);
    const [restoring, setRestoring] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && customerId) {
            loadCustomer();
        }
    }, [isOpen, customerId]);

    const loadCustomer = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminApi.getDeletedCustomer(customerId);
            setCustomer(data as any);
        } catch (err: any) {
            setError(err.message || 'Failed to load customer details');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        if (!customer) return;

        try {
            setRestoring(true);
            const response = await adminApi.restoreCustomer(customerId);
            showToast(response.message || 'Customer restored successfully', 'success');
            onClose();
            if (onRestoreSuccess) {
                onRestoreSuccess();
            }
        } catch (err: any) {
            showToast(err.message || 'Failed to restore customer', 'error');
        } finally {
            setRestoring(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Restore Deleted Customer"
            size="md"
        >
            {customerLoading ? (
                <div className="py-8">
                    <Loading />
                    <p className="text-center text-sm text-gray-500 mt-4">Loading customer details...</p>
                </div>
            ) : error ? (
                <div className="py-6">
                    <div className="text-center text-red-600 dark:text-red-400">
                        <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>{error}</p>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button onClick={onClose} variant="secondary">Close</Button>
                    </div>
                </div>
            ) : customer ? (
                <div>
                    {/* Customer Details */}
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mb-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {customer.full_name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {customer.phone}
                                    {customer.email && ` • ${customer.email}`}
                                </p>
                            </div>
                            {customer.is_online_gamer && (
                                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                                    Online Gamer
                                </span>
                            )}
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Shop:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{customer.shop_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Deleted:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{formatDate(customer.deleted_at)}</span>
                            </div>
                            {customer.deleted_by && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Deleted by:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{customer.deleted_by}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                        <div className="flex gap-3">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-blue-800 dark:text-blue-300">
                                <p className="font-medium mb-1">Restore this customer?</p>
                                <p>This will reactivate their account and they will be able to access all services again.</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Button
                            onClick={onClose}
                            variant="secondary"
                            disabled={restoring}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRestore}
                            variant="primary"
                            disabled={restoring}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {restoring ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Restoring...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Restore Customer
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
};
