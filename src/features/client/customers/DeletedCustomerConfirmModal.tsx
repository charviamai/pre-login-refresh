import React from 'react';
import { Modal, Button } from '../../../shared/components/ui';

interface DeletedCustomerConfirmModalProps {
    deletedCustomer: {
        id: string;
        full_name: string;
        phone: string;
        email?: string;
        shop_name: string;
        is_online_gamer: boolean;
        deleted_at: string;
    };
    isOpen: boolean;
    onRestore: () => void;
    onAddNew: () => void;
    onCancel: () => void;
    restoring?: boolean;
}

export const DeletedCustomerConfirmModal: React.FC<DeletedCustomerConfirmModalProps> = ({
    deletedCustomer,
    isOpen,
    onRestore,
    onAddNew,
    onCancel,
    restoring = false,
}) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            title="Customer Already Exists"
            size="md"
        >
            <div>
                {/* Warning Message */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                    <div className="flex gap-3">
                        <svg className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                                This phone number is already registered
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                                A customer with phone <strong>{deletedCustomer.phone}</strong> was previously deleted.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Deleted Customer Details:</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Name:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{deletedCustomer.full_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{deletedCustomer.phone}</span>
                        </div>
                        {deletedCustomer.email && (
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{deletedCustomer.email}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Shop:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{deletedCustomer.shop_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Deleted:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatDate(deletedCustomer.deleted_at)}</span>
                        </div>
                        {deletedCustomer.is_online_gamer && (
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                                    Online Gamer
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>Would you like to restore this customer</strong> instead of creating a new one?
                        <br />
                        Restoring will reactivate their existing account with all previous history.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <Button
                        onClick={onCancel}
                        variant="secondary"
                        disabled={restoring}
                        className="order-3 sm:order-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onAddNew}
                        variant="secondary"
                        disabled={restoring}
                        className="order-2"
                    >
                        Create New Customer
                    </Button>
                    <Button
                        onClick={onRestore}
                        variant="primary"
                        disabled={restoring}
                        className="order-1 sm:order-3 bg-green-600 hover:bg-green-700"
                    >
                        {restoring ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Restoring...
                            </>
                        ) : (
                            'Restore Customer'
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
