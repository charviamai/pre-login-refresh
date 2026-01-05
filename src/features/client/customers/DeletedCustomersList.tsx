import React, { useEffect, useState } from 'react';
import { Button, Badge, Pagination } from '../../../shared/components/ui';
import { Table } from '../../../shared/components/ui/Table';
import { PageContainer } from '../../../shared/components/layout/PageContainer';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Loading } from '../../../shared/components/Loading';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { adminApi } from '../../../shared/utils/api-service';
import { useToast } from '../../../shared/context/ToastContext';

interface CustomerRecord {
    id: string;
    full_name: string;
    name_first: string;
    name_last: string;
    phone: string;
    email: string;
    age: number;
    shop_name: string;
    status: string;
    updated_at: string;
    deleted_at: string;
    deleted_by: string;
    is_online_gamer: boolean;
}

export const DeletedCustomersList: React.FC = () => {
    const { showToast } = useToast();
    const [customers, setCustomers] = useState<CustomerRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 25;

    const loadDeletedCustomers = async (page: number = 1) => {
        try {
            setLoading(true);
            setError(null);
            const response: any = await adminApi.getDeletedCustomers(page);

            if ('results' in response) {
                setCustomers((response.results || []) as CustomerRecord[]);
                setTotalCount(response.count || 0);
                setTotalPages(Math.ceil((response.count || 0) / PAGE_SIZE));
            } else {
                setCustomers((Array.isArray(response) ? response : []) as CustomerRecord[]);
                setTotalCount(Array.isArray(response) ? response.length : 0);
                setTotalPages(1);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load deleted customers');
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDeletedCustomers();
    }, []);

    const handleRestore = async (customer: CustomerRecord) => {
        if (!confirm(`Restore ${customer.full_name}? This will reactivate their account.`)) {
            return;
        }

        try {
            const response = await adminApi.restoreCustomer(customer.id);
            showToast(response.message || 'Customer restored successfully', 'success');
            loadDeletedCustomers(currentPage);
        } catch (err: any) {
            showToast(err.message || 'Failed to restore customer', 'error');
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadDeletedCustomers(page);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 90) return `${Math.floor(diffDays / 30)} months ago`;
        return date.toLocaleDateString();
    };

    const columns = [
        {
            key: 'name',
            header: 'Name',
            render: (customer: CustomerRecord) => (
                <div>
                    <div className="font-medium">{customer.full_name}</div>
                    <div className="text-xs text-gray-500">{customer.phone}</div>
                </div>
            ),
        },
        {
            key: 'shop',
            header: 'Shop',
            render: (customer: CustomerRecord) => customer.shop_name,
        },
        {
            key: 'deleted',
            header: 'Deleted',
            render: (customer: CustomerRecord) => (
                <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(customer.deleted_at)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                        by {customer.deleted_by}
                    </div>
                </div>
            ),
        },
        {
            key: 'type',
            header: 'Type',
            render: (customer: CustomerRecord) => (
                <Badge variant={customer.is_online_gamer ? 'primary' : 'secondary'}>
                    {customer.is_online_gamer ? 'Online Gamer' : 'Regular'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (customer: CustomerRecord) => (
                <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleRestore(customer)}
                >
                    Restore
                </Button>
            ),
        },
    ];

    if (loading) return <Loading message="Loading deleted customers..." />;

    return (
        <PageContainer>
            <div className="mt-6">
                <PageHeader
                    title="Deleted Customers"
                    subtitle="View and restore soft-deleted online customer accounts"
                />
            </div>

            {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

            {customers.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        No deleted online customers found.
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                        Deleted online customers will appear here for 90 days before permanent removal.
                    </p>
                </div>
            ) : (
                <>
                    <div className="mt-4">
                        <Table
                            columns={columns}
                            data={customers}
                            keyExtractor={(customer) => customer.id}
                            emptyMessage="No deleted customers found"
                        />
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCount={totalCount}
                        pageSize={PAGE_SIZE}
                        onPageChange={handlePageChange}
                        loading={loading}
                    />
                </>
            )}
        </PageContainer>
    );
};
