/**
 * MyIncidents - Support incidents list page for Tenant Admins
 * Similar to CustomersList, with search, filters, and pagination
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Modal, Input, Badge, Pagination } from '../../../shared/components/ui';
import { Select } from '../../../shared/components/ui/Select';
import { PageContainer } from '../../../shared/components/layout/PageContainer';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Loading } from '../../../shared/components/Loading';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { supportApi, type Incident, type CreateIncidentRequest } from '../../../shared/utils/api-service';
import { useAuth } from '../../../contexts/AuthContext';

// Category options
const CATEGORIES = [
    { value: 'LOGIN', label: 'Login Issues' },
    { value: 'BILLING', label: 'Billing & Payments' },
    { value: 'TECHNICAL', label: 'Technical Issue' },
    { value: 'ACCOUNT', label: 'Account Management' },
    { value: 'FEATURE', label: 'Feature Request' },
    { value: 'KIOSK', label: 'Kiosk Hardware/Software' },
    { value: 'INTEGRATION', label: 'Integration Issues' },
    { value: 'OTHER', label: 'Other' },
];

// Priority options
const PRIORITIES = [
    { value: 'P1', label: 'P1 - Urgent' },
    { value: 'P2', label: 'P2 - High' },
    { value: 'P3', label: 'P3 - Normal' },
    { value: 'P4', label: 'P4 - Low' },
];

// Status options for filter
const STATUSES = [
    { value: '', label: 'All Statuses' },
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'WAITING_ON_CUSTOMER', label: 'Waiting on Customer' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
];

// Status badge colors
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

// Priority badge colors
const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { variant: 'danger' | 'warning' | 'info' | 'secondary'; label: string }> = {
        P1: { variant: 'danger', label: 'P1' },
        P2: { variant: 'warning', label: 'P2' },
        P3: { variant: 'info', label: 'P3' },
        P4: { variant: 'secondary', label: 'P4' },
    };
    return badges[priority] || { variant: 'secondary', label: priority };
};

const initialFormData: CreateIncidentRequest = {
    subject: '',
    description: '',
    category: 'OTHER',
    priority: 'P3',
};

export const MyIncidents: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // State
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [submissionSuccess, setSubmissionSuccess] = useState<{ incidentNumber: string } | null>(null);

    // Form state
    const [formData, setFormData] = useState<CreateIncidentRequest>(initialFormData);

    // Pagination
    const initialPage = parseInt(searchParams.get('page') || '1', 10);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 25;

    // Load incidents
    const loadIncidents = async (page: number = 1) => {
        try {
            setLoading(true);
            setError(null);

            const response = await supportApi.getIncidents({
                page,
                status: statusFilter || undefined,
                search: searchQuery || undefined,
            });

            setIncidents(response.results || []);
            setTotalCount(response.count || 0);
            setTotalPages(Math.ceil((response.count || 0) / PAGE_SIZE));
        } catch (err: any) {
            setError(err.message || 'Failed to load incidents');
            setIncidents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadIncidents(currentPage);
    }, [currentPage, statusFilter]);

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

    // Auto-set priority when category changes
    const handleCategoryChange = (category: string) => {
        const newPriority = category === 'LOGIN' ? 'P1' : formData.priority;
        setFormData(prev => ({
            ...prev,
            category: category as CreateIncidentRequest['category'],
            priority: newPriority as CreateIncidentRequest['priority'],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.subject.trim() || !formData.description.trim()) {
            setError('Subject and description are required');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const incident = await supportApi.createIncident(formData);
            setSubmissionSuccess({ incidentNumber: incident.incident_number });
            setFormData(initialFormData);
            loadIncidents(1);
        } catch (err: any) {
            setError(err.message || 'Failed to create incident');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSubmissionSuccess(null);
        setFormData(initialFormData);
        setError(null);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
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
        <PageContainer>
            <div className="mt-6">
                <PageHeader
                    title="My Incidents"
                    subtitle="View and manage your support incidents"
                    actions={
                        <Button
                            onClick={() => setShowModal(true)}
                            size="sm"
                            className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md"
                        >
                            + Open Incident
                        </Button>
                    }
                />
            </div>

            {error && !showModal && <ErrorBanner message={error} onClose={() => setError(null)} />}

            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Search by incident #, subject..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        fullWidth
                    />
                </div>
                <div className="w-full sm:w-48">
                    <Select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        options={STATUSES}
                    />
                </div>
                <Button onClick={handleSearch} variant="secondary">
                    Search
                </Button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Incident #</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Subject</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Priority</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {incidents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No incidents found. Click "Open Incident" to create your first support request.
                                    </td>
                                </tr>
                            ) : (
                                incidents.map((incident) => (
                                    <tr
                                        key={incident.id}
                                        className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer"
                                        onClick={() => navigate(`/client/support/${incident.id}`)}
                                    >
                                        <td className="px-4 py-3 font-mono text-sm text-indigo-600 dark:text-indigo-400">
                                            {incident.incident_number}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900 dark:text-white">{incident.subject}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {CATEGORIES.find(c => c.value === incident.category)?.label}
                                            </div>
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
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(incident.created_at)}
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

            {/* Mobile List */}
            <div className="md:hidden">
                <div className="space-y-3">
                    {incidents.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center text-gray-500 dark:text-gray-400">
                            No incidents found.
                        </div>
                    ) : (
                        incidents.map((incident) => (
                            <div
                                key={incident.id}
                                className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 cursor-pointer"
                                onClick={() => navigate(`/client/support/${incident.id}`)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400">
                                        {incident.incident_number}
                                    </span>
                                    <Badge variant={getPriorityBadge(incident.priority).variant}>
                                        {getPriorityBadge(incident.priority).label}
                                    </Badge>
                                </div>
                                <h3 className="font-medium text-gray-900 dark:text-white mb-1">{incident.subject}</h3>
                                <div className="flex justify-between items-center">
                                    <Badge variant={getStatusBadge(incident.status).variant}>
                                        {getStatusBadge(incident.status).label}
                                    </Badge>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDate(incident.created_at)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
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

            {/* Open Incident Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={submissionSuccess ? 'Incident Submitted' : 'Open New Incident'}
                size="lg"
            >
                {submissionSuccess ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Your incident has been submitted!
                        </h3>
                        <p className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-4">
                            {submissionSuccess.incidentNumber}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            A confirmation email has been sent to {user?.email}
                        </p>
                        <Button onClick={handleCloseModal}>Done</Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

                        {/* User Info (read-only) */}
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Your Information</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Name:</span>{' '}
                                    <span className="font-medium text-gray-900 dark:text-white">{user?.full_name || `${user?.name_first} ${user?.name_last}`}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Email:</span>{' '}
                                    <span className="font-medium text-gray-900 dark:text-white">{user?.email}</span>
                                </div>
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={formData.category}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                options={CATEGORIES}
                            />
                            {formData.category === 'LOGIN' && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    Login issues are automatically set to P1 - Urgent priority
                                </p>
                            )}
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Priority <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={formData.priority}
                                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as CreateIncidentRequest['priority'] }))}
                                options={PRIORITIES}
                                disabled={formData.category === 'LOGIN'}
                            />
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Subject <span className="text-red-500">*</span>
                            </label>
                            <Input
                                value={formData.subject}
                                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                placeholder="Brief description of your issue"
                                fullWidth
                                maxLength={255}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Please describe your issue in detail..."
                                rows={5}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                            <Button type="button" variant="secondary" onClick={handleCloseModal}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit Incident'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </PageContainer>
    );
};

export default MyIncidents;
