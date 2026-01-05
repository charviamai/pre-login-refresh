/**
 * EmployeeHours - View employee's own hours worked
 * Shows timesheet entries with summary
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, Badge } from '../../shared/components/ui';
import { PageContainer } from '../../shared/components/layout/PageContainer';
import { Loading } from '../../shared/components/Loading';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { workforceApi, TimesheetEntry } from '../../shared/utils/workforceApi';

// Get selected shop from sessionStorage
const getSelectedShop = (): { id: string; name: string } | null => {
    const stored = sessionStorage.getItem('employee_selected_shop');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }
    return null;
};

// Get week start (Monday)
const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Format date for display
const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
};

export const EmployeeHours: React.FC = () => {
    const navigate = useNavigate();
    const [entries, setEntries] = useState<TimesheetEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

    // Memoize shop ID to prevent infinite loops
    const [shopId, setShopId] = useState<string | null>(null);
    const [shopName, setShopName] = useState<string>('');

    // Load shop from storage once on mount
    useEffect(() => {
        const shop = getSelectedShop();
        if (shop) {
            setShopId(shop.id);
            setShopName(shop.name);
        } else {
            navigate('/employee/select-shop');
        }
    }, [navigate]);

    // Load hours data (only when shopId or week/view changes)
    useEffect(() => {
        if (!shopId) return;
        loadHours(shopId);
    }, [currentWeekStart, viewMode, shopId]);

    const loadHours = async (shopIdParam: string) => {
        try {
            setLoading(true);
            setError(null);

            let dateFrom: string;
            let dateTo: string;

            if (viewMode === 'week') {
                const weekEnd = new Date(currentWeekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                dateFrom = currentWeekStart.toISOString().split('T')[0];
                dateTo = weekEnd.toISOString().split('T')[0];
            } else {
                // Month view
                const monthStart = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), 1);
                const monthEnd = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth() + 1, 0);
                dateFrom = monthStart.toISOString().split('T')[0];
                dateTo = monthEnd.toISOString().split('T')[0];
            }

            const rawData = await workforceApi.getTimesheetEntries({
                shop_id: shopIdParam,
                date_from: dateFrom,
                date_to: dateTo
            });

            // Handle both array and paginated response formats
            const data = Array.isArray(rawData) ? rawData : ((rawData as any)?.results || []);

            setEntries(data);
        } catch (err: unknown) {

            setError((err as { message?: string })?.message || 'Failed to load hours');
        } finally {
            setLoading(false);
        }
    };

    const goToPreviousWeek = () => {
        const newWeekStart = new Date(currentWeekStart);
        newWeekStart.setDate(newWeekStart.getDate() - (viewMode === 'week' ? 7 : 30));
        setCurrentWeekStart(newWeekStart);
    };

    const goToNextWeek = () => {
        const newWeekStart = new Date(currentWeekStart);
        newWeekStart.setDate(newWeekStart.getDate() + (viewMode === 'week' ? 7 : 30));
        setCurrentWeekStart(newWeekStart);
    };

    const goToCurrentWeek = () => {
        setCurrentWeekStart(getWeekStart(new Date()));
    };

    // Get status badge variant
    const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
        switch (status) {
            case 'APPROVED': return 'success';
            case 'PENDING': return 'warning';
            case 'REJECTED': return 'danger';
            default: return 'default';
        }
    };

    // Calculate totals
    const totalHours = entries.reduce((sum, entry) => sum + parseFloat(entry.hours_worked || '0'), 0);
    const approvedHours = entries
        .filter(e => e.status === 'APPROVED')
        .reduce((sum, entry) => sum + parseFloat(entry.hours_worked || '0'), 0);
    const pendingHours = entries
        .filter(e => e.status === 'PENDING')
        .reduce((sum, entry) => sum + parseFloat(entry.hours_worked || '0'), 0);

    if (!shopId) {
        return <Loading message="Loading..." />;
    }

    const weekEndDate = new Date(currentWeekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekRangeText = viewMode === 'week'
        ? `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <PageContainer>
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">My Hours</h1>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">View your hours worked at {shopName}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/employee/dashboard')} className="flex-shrink-0">
                        <span className="sm:hidden">← Back</span>
                        <span className="hidden sm:inline">← Back to Dashboard</span>
                    </Button>
                </div>
            </div>

            {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <CardContent className="py-3 sm:py-4 px-2 sm:px-4">
                        <p className="text-[10px] sm:text-sm text-blue-100">Total Hours</p>
                        <p className="text-xl sm:text-3xl font-bold">{totalHours.toFixed(1)}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <CardContent className="py-3 sm:py-4 px-2 sm:px-4">
                        <p className="text-[10px] sm:text-sm text-green-100">Approved</p>
                        <p className="text-xl sm:text-3xl font-bold">{approvedHours.toFixed(1)}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                    <CardContent className="py-3 sm:py-4 px-2 sm:px-4">
                        <p className="text-[10px] sm:text-sm text-yellow-100">Pending</p>
                        <p className="text-xl sm:text-3xl font-bold">{pendingHours.toFixed(1)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Period Navigation - Always horizontal */}
            <Card className="mb-4">
                <CardContent className="py-2.5 sm:py-3">
                    {/* View Mode Toggle */}
                    <div className="flex items-center justify-center gap-1 mb-2">
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded ${viewMode === 'week' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded ${viewMode === 'month' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
                        >
                            Month
                        </button>
                    </div>
                    {/* Navigation Row */}
                    <div className="flex items-center justify-between gap-2">
                        <Button variant="outline" size="sm" onClick={goToPreviousWeek} className="flex-shrink-0 px-2 sm:px-3">
                            <span className="text-xs sm:text-sm">← Prev</span>
                        </Button>
                        <div className="text-center flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-gray-200 text-xs sm:text-sm truncate">{weekRangeText}</p>
                            <button
                                onClick={goToCurrentWeek}
                                className="text-[10px] sm:text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
                            >
                                Today
                            </button>
                        </div>
                        <Button variant="outline" size="sm" onClick={goToNextWeek} className="flex-shrink-0 px-2 sm:px-3">
                            <span className="text-xs sm:text-sm">Next →</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Hours Table */}
            {loading ? (
                <Loading message="Loading hours..." />
            ) : entries.length === 0 ? (
                <Card>
                    <CardContent className="py-8 sm:py-12 text-center">
                        <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No Hours Recorded</h3>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No timesheet entries for this period.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700">
                        <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900">
                                <tr>
                                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                                        Hours
                                    </th>
                                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700">
                                {entries.map((entry, idx) => (
                                    <tr key={entry.id} className={idx % 2 === 1 ? 'bg-gray-50/50 dark:bg-slate-700/50' : ''}>
                                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                            {formatDate(entry.date)}
                                        </td>
                                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">
                                            <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                                                {parseFloat(entry.hours_worked).toFixed(1)}h
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">
                                            <Badge variant={getStatusVariant(entry.status)} className="text-[8px] sm:text-[10px]">
                                                {entry.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </PageContainer>
    );
};

export default EmployeeHours;
