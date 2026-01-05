/**
 * EmployeeSchedule - View employee's own scheduled shifts
 * Shows current week and allows navigation to other weeks
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, Badge } from '../../shared/components/ui';
import { PageContainer } from '../../shared/components/layout/PageContainer';
import { Loading } from '../../shared/components/Loading';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { workforceApi, ShiftSchedule } from '../../shared/utils/workforceApi';

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

// Helper to get week start (Monday)
const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Format time for display
const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
};

export const EmployeeSchedule: React.FC = () => {
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState<ShiftSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));

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

    // Load schedules for the current week (only when shopId or week changes)
    useEffect(() => {
        if (!shopId) return;
        loadSchedules(shopId);
    }, [currentWeekStart, shopId]);

    const loadSchedules = async (shopIdParam: string) => {
        try {
            setLoading(true);
            setError(null);

            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            const dateFrom = currentWeekStart.toISOString().split('T')[0];
            const dateTo = weekEnd.toISOString().split('T')[0];



            const rawData = await workforceApi.getSchedules({
                shop_id: shopIdParam,
                date_from: dateFrom,
                date_to: dateTo
            });



            // Handle both array and paginated response formats
            const data = Array.isArray(rawData) ? rawData : ((rawData as any)?.results || []);



            setSchedules(data);
        } catch (err: unknown) {

            setError((err as { message?: string })?.message || 'Failed to load schedule');
        } finally {

            setLoading(false);
        }
    };

    const goToPreviousWeek = () => {
        const newWeekStart = new Date(currentWeekStart);
        newWeekStart.setDate(newWeekStart.getDate() - 7);
        setCurrentWeekStart(newWeekStart);
    };

    const goToNextWeek = () => {
        const newWeekStart = new Date(currentWeekStart);
        newWeekStart.setDate(newWeekStart.getDate() + 7);
        setCurrentWeekStart(newWeekStart);
    };

    const goToCurrentWeek = () => {
        setCurrentWeekStart(getWeekStart(new Date()));
    };

    // Generate week days
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);
        return date;
    });

    // Get status badge variant
    const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
        switch (status) {
            case 'COMPLETED': return 'success';
            case 'SCHEDULED': return 'default';
            case 'MISSED': return 'danger';
            case 'CANCELLED': return 'warning';
            default: return 'default';
        }
    };

    if (!shopId) {
        return <Loading message="Loading..." />;
    }

    const weekEndDate = new Date(currentWeekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekRangeText = `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    return (
        <PageContainer>
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">My Schedule</h1>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">View your scheduled shifts at {shopName}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/employee/dashboard')} className="flex-shrink-0">
                        <span className="sm:hidden">← Back</span>
                        <span className="hidden sm:inline">← Back to Dashboard</span>
                    </Button>
                </div>
            </div>

            {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

            {/* Week Navigation - Always horizontal */}
            <Card className="mb-4">
                <CardContent className="py-2.5 sm:py-3">
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

            {/* Schedule Table */}
            {loading ? (
                <Loading message="Loading schedule..." />
            ) : (
                <Card>
                    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700">
                        <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900">
                                <tr>
                                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Time
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700">
                                {weekDays.map((day, idx) => {
                                    const dateStr = day.toISOString().split('T')[0];
                                    const daySchedules = schedules.filter(s => s.date === dateStr);
                                    const isToday = new Date().toDateString() === day.toDateString();

                                    return (
                                        <tr
                                            key={dateStr}
                                            className={`${isToday ? 'bg-primary-50 dark:bg-primary-900/20' : idx % 2 === 1 ? 'bg-gray-50/50 dark:bg-slate-700/50' : ''}`}
                                        >
                                            {/* Date Column */}
                                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-200 align-top">
                                                <div className="flex items-center gap-1.5 sm:gap-2">
                                                    <span>{day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                                                    {isToday && <Badge variant="primary" className="text-[8px] sm:text-[10px]">Today</Badge>}
                                                </div>
                                            </td>

                                            {/* Time Column - Stack multiple shifts */}
                                            <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                                                {daySchedules.length === 0 ? (
                                                    <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 italic">No Shift</span>
                                                ) : (
                                                    <div className="space-y-1">
                                                        {daySchedules.map((schedule) => (
                                                            <div key={schedule.id} className="flex items-center gap-2">
                                                                <span
                                                                    className={`text-xs sm:text-sm font-medium ${schedule.status === 'COMPLETED' ? 'text-green-700 dark:text-green-400' :
                                                                        schedule.status === 'CANCELLED' ? 'text-red-500 dark:text-red-400 line-through' :
                                                                            'text-gray-900 dark:text-gray-200'
                                                                        }`}>
                                                                    {formatTime(schedule.start_time)} To {formatTime(schedule.end_time)}
                                                                </span>
                                                                {schedule.status !== 'SCHEDULED' && (
                                                                    <Badge
                                                                        variant={getStatusVariant(schedule.status)}
                                                                        className="text-[8px] sm:text-[10px]"
                                                                    >
                                                                        {schedule.status}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    {schedules.length > 0 && (
                        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600">
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Total Shifts</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{schedules.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs sm:text-sm mt-1">
                                <span className="text-gray-600 dark:text-gray-300">Total Hours</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {schedules.reduce((sum, s) => sum + parseFloat(s.scheduled_hours || '0'), 0).toFixed(1)}h
                                </span>
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </PageContainer>
    );
};

export default EmployeeSchedule;
