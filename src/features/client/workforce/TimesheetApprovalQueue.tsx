/**
 * TimesheetApprovalQueue - Component for reviewing and approving pending timesheets
 * Groups entries by employee + week for easier approval workflow
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, useConfirm } from '../../../shared/components/ui';
import { workforceApi, TimesheetEntry } from '../../../shared/utils/workforceApi';
import { getWeekStart, getWeekEnd } from '../../../shared/utils/dateUtils';

interface TimesheetApprovalQueueProps {
    shopId: string;
    onRefresh?: () => void;
    refreshTrigger?: number;
}

interface WeeklyPendingGroup {
    key: string;
    employeeId: string;
    employeeName: string;
    weekStart: string;
    weekEnd: string;
    totalHours: number;
    daysCount: number;
    entryIds: string[];
}

export const TimesheetApprovalQueue: React.FC<TimesheetApprovalQueueProps> = ({ shopId, onRefresh, refreshTrigger }) => {
    const confirm = useConfirm();
    const [pendingEntries, setPendingEntries] = useState<TimesheetEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);
    const [shopTimezone, setShopTimezone] = useState<string>('UTC');

    useEffect(() => {
        loadPendingTimesheets();
        fetchShopTimezone();
    }, [shopId, refreshTrigger]);

    const fetchShopTimezone = async () => {
        if (!shopId || shopId === 'ALL') {
            setShopTimezone('UTC');
            return;
        }
        try {
            const response = await fetch(`/api/admin/shops/${shopId}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
            });
            if (response.ok) {
                const shopData = await response.json();
                setShopTimezone(shopData.timezone || 'UTC');
            }
        } catch (err) {
            console.warn('Could not fetch shop timezone, defaulting to UTC:', err);
            setShopTimezone('UTC');
        }
    };

    const loadPendingTimesheets = async () => {
        try {
            setLoading(true);
            setError(null);
            // Convert 'ALL' to undefined so API doesn't receive invalid shop_id
            const shopIdParam = shopId && shopId !== 'ALL' ? shopId : undefined;

            const response = await workforceApi.getTimesheetEntries({
                shop_id: shopIdParam,
                status: 'PENDING'
            });
            // Handle both array and paginated response formats
            const entries = Array.isArray(response)
                ? response
                : ((response as unknown as { results?: TimesheetEntry[] })?.results || []);

            setPendingEntries(entries);
        } catch (err: any) {
            setError(err.message || 'Failed to load pending timesheets');
        } finally {
            setLoading(false);
        }
    };

    // Group pending entries by employee + week (using shop timezone)
    const weeklyGroups = useMemo(() => {
        console.log('🕐 Grouping with timezone:', shopTimezone);
        const groups: Record<string, WeeklyPendingGroup> = {};

        pendingEntries.forEach(entry => {
            const weekStart = getWeekStart(entry.date, shopTimezone);
            console.log(`📅 Entry date: ${entry.date} -> Week start: ${weekStart} (tz: ${shopTimezone})`);
            const key = `${entry.employee}-${weekStart}`;

            if (!groups[key]) {
                groups[key] = {
                    key,
                    employeeId: entry.employee,
                    employeeName: entry.employee_name,
                    weekStart,
                    weekEnd: getWeekEnd(weekStart, shopTimezone),
                    totalHours: 0,
                    daysCount: 0,
                    entryIds: []
                };
            }

            groups[key].entryIds.push(entry.id);
            groups[key].totalHours += parseFloat(entry.hours_worked) || 0;
            groups[key].daysCount += 1;
        });

        // Sort by week (newest first), then by employee name
        const sorted = Object.values(groups).sort((a, b) => {
            const weekDiff = b.weekStart.localeCompare(a.weekStart);
            if (weekDiff !== 0) return weekDiff;
            return a.employeeName.localeCompare(b.employeeName);
        });

        console.log('📊 Final groups:', sorted);
        return sorted;
    }, [pendingEntries, shopTimezone]);

    const handleApproveWeek = async (group: WeeklyPendingGroup) => {
        try {
            setProcessing(group.key);

            // Approve all entries in the week
            for (const entryId of group.entryIds) {
                await workforceApi.approveTimesheetEntry(entryId);
            }

            await loadPendingTimesheets();
            onRefresh?.();
        } catch (err: any) {
            setError(err.message || 'Failed to approve');
        } finally {
            setProcessing(null);
        }
    };

    const handleRejectWeek = async (group: WeeklyPendingGroup) => {
        const reason = prompt('Rejection reason (optional):');
        try {
            setProcessing(group.key);
            // Reject all entries in the week
            for (const entryId of group.entryIds) {
                await workforceApi.rejectTimesheetEntry(entryId, reason || undefined);
            }
            await loadPendingTimesheets();
            onRefresh?.();
        } catch (err: any) {
            setError(err.message || 'Failed to reject');
        } finally {
            setProcessing(null);
        }
    };

    const handleApproveAll = async () => {
        const totalEntries = pendingEntries.length;
        if (totalEntries === 0) return;

        const confirmed = await confirm({
            title: 'Approve All Timesheets',
            message: `Approve all ${totalEntries} pending timesheet entries across ${weeklyGroups.length} group(s)?`,
            confirmText: 'Approve All'
        });

        if (!confirmed) return;

        try {
            setProcessing('all');
            let successCount = 0;
            let failCount = 0;
            const errors: string[] = [];

            for (const entry of pendingEntries) {
                try {
                    await workforceApi.approveTimesheetEntry(entry.id);
                    successCount++;
                } catch (entryErr: any) {
                    failCount++;
                    const errMsg = entryErr?.message || entryErr?.detail || 'Unknown error';
                    errors.push(`${entry.employee_name}: ${errMsg}`);
                    // Continue with other entries instead of stopping
                }
            }

            if (failCount > 0) {
                setError(`Approved ${successCount}/${totalEntries}. Failed: ${errors.join('; ')}`);
            }

            await loadPendingTimesheets();
            onRefresh?.();
        } catch (err: any) {
            setError(err.message || 'Failed to approve all');
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent>
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">Loading pending timesheets...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        Pending Approvals
                        {weeklyGroups.length > 0 && (
                            <Badge variant="warning">{weeklyGroups.length}</Badge>
                        )}
                    </CardTitle>
                    {pendingEntries.length > 0 && (
                        <Button
                            size="sm"
                            onClick={() => handleApproveAll()}
                            disabled={processing === 'all'}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {processing === 'all' ? 'Approving...' : 'Approve All'}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-sm rounded-md">
                        {error}
                        <button onClick={() => setError(null)} className="ml-2 text-red-600">✕</button>
                    </div>
                )}

                {weeklyGroups.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <span className="text-2xl">✓</span>
                        <p className="mt-2 text-sm sm:text-base">No pending timesheets</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {weeklyGroups.map(group => (
                            <div key={group.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{group.employeeName}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-1">
                                        <span>{group.weekStart} to {group.weekEnd}</span>
                                        <span>•</span>
                                        <span>{group.daysCount} days</span>
                                        <span>•</span>
                                        <span className="font-medium">{group.totalHours.toFixed(2)}h</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end sm:flex-shrink-0">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleRejectWeek(group)}
                                        disabled={processing === group.key}
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleApproveWeek(group)}
                                        disabled={processing === group.key}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {processing === group.key ? '...' : 'Approve'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
