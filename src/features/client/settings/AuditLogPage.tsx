import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../../shared/components/layout/PageContainer';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Loading } from '../../../shared/components/Loading';
import { Card, Badge, Button, Pagination } from '../../../shared/components/ui';
import { BadgeVariant } from '../../../shared/components/ui/Badge';

interface AuditLogEntry {
    id: string;
    user_username: string | null;
    action: string;
    resource_type: string;
    resource_id: string;
    ip_address: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
}

const ACTION_VARIANTS: Record<string, BadgeVariant> = {
    'LOGIN': 'success',
    'LOGOUT': 'default',
    'CREATE': 'info',
    'UPDATE': 'warning',
    'DELETE': 'danger',
};


const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const AuditLogPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // URL-based pagination state
    const [searchParams, setSearchParams] = useSearchParams();
    const initialPage = parseInt(searchParams.get('page') || '1', 10);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 25;

    // Filters
    const [actionFilter, setActionFilter] = useState('');
    const [resourceFilter, setResourceFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const fetchLogs = async (page: number = 1) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append('page', String(page));
            if (actionFilter) params.append('action', actionFilter);
            if (resourceFilter) params.append('resource_type', resourceFilter);
            if (fromDate) params.append('from_date', fromDate);
            if (toDate) params.append('to_date', toDate);

            const response = await fetch(`/api/admin/audit-logs/?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch audit logs');

            const data = await response.json();
            if (data.results) {
                setLogs(data.results);
                setTotalCount(data.count || 0);
                setTotalPages(Math.ceil((data.count || 0) / PAGE_SIZE));
            } else {
                setLogs(data);
                setTotalCount(data.length);
                setTotalPages(1);
            }
        } catch (err: unknown) {
            const errorMsg = (err as { message?: string })?.message || 'Failed to load audit logs';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(initialPage);
    }, []);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (page === 1) {
                newParams.delete('page');
            } else {
                newParams.set('page', String(page));
            }
            return newParams;
        });
        fetchLogs(page);
    };

    const handleFilter = () => {
        setCurrentPage(1);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('page');
            return newParams;
        });
        fetchLogs(1);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams();
            if (actionFilter) params.append('action', actionFilter);
            if (resourceFilter) params.append('resource_type', resourceFilter);
            if (fromDate) params.append('from_date', fromDate);
            if (toDate) params.append('to_date', toDate);

            const response = await fetch(`/api/admin/audit-logs/export/?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'audit_logs.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: unknown) {
            setError((err as { message?: string })?.message || 'Failed to export');
        } finally {
            setExporting(false);
        }
    };

    const clearFilters = () => {
        setActionFilter('');
        setResourceFilter('');
        setFromDate('');
        setToDate('');
        setCurrentPage(1);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('page');
            return newParams;
        });
        setTimeout(() => fetchLogs(1), 0);
    };

    const hasActiveFilters = actionFilter || resourceFilter || fromDate || toDate;

    return (
        <PageContainer>
            <div className="mt-6">
                <PageHeader
                    title="Audit Logs"
                    subtitle="Track all user actions for compliance and accountability"
                    actions={
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setShowFilters(!showFilters)}
                                variant="secondary"
                                size="sm"
                                className="md:hidden"
                            >
                                {showFilters ? 'Hide' : 'Filter'}
                                {hasActiveFilters && <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>}
                            </Button>
                            <Button
                                onClick={handleExport}
                                disabled={exporting}
                                size="sm"
                                className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md"
                            >
                                <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export CSV'}</span>
                                <span className="sm:hidden">{exporting ? '...' : 'Export'}</span>
                            </Button>
                        </div>
                    }
                />

                {/* Filters - Collapsible on mobile */}
                <Card className={`mb-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
                    <div className="p-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filters</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Action</label>
                                <select
                                    value={actionFilter}
                                    onChange={(e) => setActionFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 dark:text-gray-200"
                                >
                                    <option value="">All</option>
                                    <option value="LOGIN">Login</option>
                                    <option value="LOGOUT">Logout</option>
                                    <option value="CREATE">Create</option>
                                    <option value="UPDATE">Update</option>
                                    <option value="DELETE">Delete</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Resource</label>
                                <select
                                    value={resourceFilter}
                                    onChange={(e) => setResourceFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 dark:text-gray-200"
                                >
                                    <option value="">All</option>
                                    <option value="User">Users</option>
                                    <option value="Customer">Customers</option>
                                    <option value="Ticket">Tickets</option>
                                    <option value="MachineReading">Readings</option>
                                    <option value="Payroll">Payroll</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-full px-2 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 dark:text-gray-200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full px-2 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 dark:text-gray-200"
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1 flex items-end gap-2">
                                <Button onClick={handleFilter} variant="primary" size="sm" className="flex-1 md:flex-none">
                                    Apply
                                </Button>
                                <Button onClick={clearFilters} variant="secondary" size="sm" className="flex-1 md:flex-none">
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Logs Display */}
                {loading ? (
                    <Loading message="Loading audit logs..." />
                ) : error ? (
                    <Card className="p-8 text-center text-red-600">{error}</Card>
                ) : logs.length === 0 ? (
                    <Card className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No audit logs found. Actions will appear here as they occur.
                    </Card>
                ) : (
                    <Card>
                        {/* Table - scrollable on mobile */}
                        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
                            <table className="min-w-full">
                                <thead className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900">
                                    <tr>
                                        <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">Timestamp</th>
                                        <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">User</th>
                                        <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">Action</th>
                                        <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">Resource</th>
                                        <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">IP</th>
                                        <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700">
                                    {logs.map((log, idx) => (
                                        <tr key={log.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700 ${idx % 2 === 1 ? 'bg-gray-50/50 dark:bg-slate-700/30' : ''}`}>
                                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                {formatDateShort(log.created_at)}
                                            </td>
                                            <td className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                {log.user_username || 'System'}
                                            </td>
                                            <td className="px-3 py-2">
                                                <Badge variant={ACTION_VARIANTS[log.action] || 'default'} className="text-[10px] sm:text-xs">
                                                    {log.action}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{log.resource_type}</span>
                                            </td>
                                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {log.ip_address || '-'}
                                            </td>
                                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                {log.metadata && Object.keys(log.metadata).length > 0 ? (
                                                    <span className="text-[10px] sm:text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {Object.entries(log.metadata)
                                                            .map(([k, v]) => `${k}: ${v}`)
                                                            .join(', ')
                                                            .substring(0, 30)}...
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalCount={totalCount}
                            pageSize={PAGE_SIZE}
                            onPageChange={handlePageChange}
                            loading={loading}
                        />
                    </Card>
                )}
            </div>
        </PageContainer>
    );
};
