/**
 * PlatformIncidents - All incidents list for Platform Admins
 * Similar to PlatformTenants, with search, filters, and pagination
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button, Input, Badge, Pagination } from '../../shared/components/ui';
import { Select } from '../../shared/components/ui/Select';
import { Loading } from '../../shared/components/Loading';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { platformSupportApi, type Incident } from '../../shared/utils/api-service';

// Categories
const CATEGORIES = [
    { value: '', label: 'All Categories' },
    { value: 'LOGIN', label: 'Login Issues' },
    { value: 'BILLING', label: 'Billing & Payments' },
    { value: 'TECHNICAL', label: 'Technical Issue' },
    { value: 'ACCOUNT', label: 'Account Management' },
    { value: 'FEATURE', label: 'Feature Request' },
    { value: 'KIOSK', label: 'Kiosk Hardware/Software' },
    { value: 'INTEGRATION', label: 'Integration Issues' },
    { value: 'OTHER', label: 'Other' },
];

// Priorities
const PRIORITIES = [
    { value: '', label: 'All Priorities' },
    { value: 'P1', label: 'P1 - Urgent' },
    { value: 'P2', label: 'P2 - High' },
    { value: 'P3', label: 'P3 - Normal' },
    { value: 'P4', label: 'P4 - Low' },
];

// Statuses
const STATUSES = [
    { value: '', label: 'All Statuses' },
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'WAITING_ON_CUSTOMER', label: 'Waiting on Customer' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
];

// Badge styling functions
const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'secondary'; label: string }> = {
        OPEN: { variant: 'success', label: 'Open' },
        IN_PROGRESS: { variant: 'info', label: 'In Progress' },
        WAITING_ON_CUSTOMER: { variant: 'warning', label: 'Waiting' },
        RESOLVED: { variant: 'success', label: 'Resolved' },
        CLOSED: { variant: 'secondary', label: 'Closed' },
    };
    return badges[status] || { variant: 'secondary', label: status };
};

const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { variant: 'danger' | 'warning' | 'info' | 'secondary'; label: string }> = {
        P1: { variant: 'danger', label: 'P1' },
        P2: { variant: 'warning', label: 'P2' },
        P3: { variant: 'info', label: 'P3' },
        P4: { variant: 'secondary', label: 'P4' },
    };
    return badges[priority] || { variant: 'secondary', label: priority };
};

export const PlatformIncidents: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // State
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    // Pagination
    const initialPage = parseInt(searchParams.get('page') || '1', 10);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 25;

    // Stats
    const [stats, setStats] = useState({
        open: 0,
        inProgress: 0,
        resolved: 0,
    });

    // Load incidents
    const loadIncidents = useCallback(async (page: number = 1) => {
        try {
            setLoading(true);
            setError(null);

            const response = await platformSupportApi.getIncidents({
                page,
                status: statusFilter || undefined,
                priority: priorityFilter || undefined,
                category: categoryFilter || undefined,
                search: searchQuery || undefined,
            });

            setIncidents(response.results || []);
            setTotalCount(response.count || 0);
            setTotalPages(Math.ceil((response.count || 0) / PAGE_SIZE));

            // Calculate stats from all results (ideally from a dedicated endpoint)
            if (!statusFilter && !priorityFilter && !categoryFilter && !searchQuery) {
                const open = (response.results || []).filter((i: Incident) => i.status === 'OPEN').length;
                const inProgress = (response.results || []).filter((i: Incident) => i.status === 'IN_PROGRESS').length;
                const resolved = (response.results || []).filter((i: Incident) => i.status === 'RESOLVED').length;
                setStats({ open, inProgress, resolved });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load incidents');
            setIncidents([]);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, priorityFilter, categoryFilter, searchQuery]);

    useEffect(() => {
        loadIncidents(currentPage);
    }, [currentPage, loadIncidents]);

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
    };

    const handleSearch = () => {
        setCurrentPage(1);
        loadIncidents(1);
    };

    const handleFilterChange = () => {
        setCurrentPage(1);
        loadIncidents(1);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    if (loading && !incidents.length) {
        return <Loading message="Loading incidents..." />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Support Incidents</h1>
                        <p className="text-gray-400 mt-1">Manage all tenant support requests</p>
                    </div>
                    <Link to="/internal-admin/dashboard">
                        <Button variant="secondary" size="sm">← Back to Dashboard</Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-4 border border-slate-700/50">
                        <div className="text-sm text-gray-400">Open</div>
                        <div className="text-2xl font-bold text-green-400">{stats.open}</div>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-4 border border-slate-700/50">
                        <div className="text-sm text-gray-400">In Progress</div>
                        <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-4 border border-slate-700/50">
                        <div className="text-sm text-gray-400">Resolved</div>
                        <div className="text-2xl font-bold text-gray-400">{stats.resolved}</div>
                    </div>
                </div>

                {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

                {/* Filters */}
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-4 border border-slate-700/50 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <Input
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                fullWidth
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); handleFilterChange(); }}
                            options={STATUSES}
                        />
                        <Select
                            value={priorityFilter}
                            onChange={(e) => { setPriorityFilter(e.target.value); handleFilterChange(); }}
                            options={PRIORITIES}
                        />
                        <Select
                            value={categoryFilter}
                            onChange={(e) => { setCategoryFilter(e.target.value); handleFilterChange(); }}
                            options={CATEGORIES}
                        />
                        <Button onClick={handleSearch} variant="primary">Search</Button>
                    </div>
                </div>

                {/* Incidents Table */}
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Incident</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase hidden md:table-cell">Tenant</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Priority</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase hidden lg:table-cell">Created</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {incidents.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                        No incidents found
                                    </td>
                                </tr>
                            ) : (
                                incidents.map((incident) => (
                                    <tr key={incident.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-mono text-sm text-indigo-400">{incident.incident_number}</div>
                                            <div className="font-medium text-white truncate max-w-xs">{incident.subject}</div>
                                            <div className="text-xs text-gray-400">
                                                {CATEGORIES.find(c => c.value === incident.category)?.label}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <div className="text-white">{incident.tenant_name || 'Unknown'}</div>
                                            <div className="text-xs text-gray-400">{incident.contact_email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={getPriorityBadge(incident.priority).variant}>
                                                {getPriorityBadge(incident.priority).label}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={getStatusBadge(incident.status).variant}>
                                                {getStatusBadge(incident.status).label}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-400">
                                            {formatDate(incident.created_at)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Link to={`/internal-admin/incidents/${incident.id}`}>
                                                <Button size="sm" variant="secondary">View</Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
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
            </div>
        </div>
    );
};

export default PlatformIncidents;
