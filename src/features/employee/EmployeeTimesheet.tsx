/**
 * EmployeeTimesheet - Timesheet entry for employees
 * Similar to admin WeeklyTimesheetEntry but employee is auto-populated
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, Badge } from '../../shared/components/ui';
import { PageContainer } from '../../shared/components/layout/PageContainer';
import { Loading } from '../../shared/components/Loading';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { workforceApi, TimesheetEntry } from '../../shared/utils/workforceApi';
import { useAuth } from '../../contexts/AuthContext';
import { getWeekStartWithOffset, getWeekDates } from '../../shared/utils/dateUtils';

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

interface DayEntry {
    date: string;
    dayName: string;
    dayDate: string;
    hours: string;
    originalHours?: string;
    wasEditedBefore?: boolean;
    existingId?: string;
    entryStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const EmployeeTimesheet: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [shop, setShop] = useState<{ id: string; name: string; timezone?: string } | null>(null);
    const [shopTimezone, setShopTimezone] = useState<string>('UTC');
    const [loading, setLoading] = useState(true);
    const [loadingEntries, setLoadingEntries] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [totalHoursSubmitted, setTotalHoursSubmitted] = useState<string>('0');

    // Week offset (0 = current week, -1 = last week, 1 = next week)
    const [weekOffset, setWeekOffset] = useState(0);

    // Form state
    const [notes, setNotes] = useState<string>('');
    const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);

    // Load shop on mount and fetch timezone
    useEffect(() => {
        const selectedShop = getSelectedShop();
        if (selectedShop) {
            setShop(selectedShop);
            // Fetch full shop details to get timezone
            fetchShopTimezone(selectedShop.id);
        } else {
            navigate('/employee/select-shop');
        }
        setLoading(false);
    }, [navigate]);

    const fetchShopTimezone = async (shopId: string) => {
        try {
            // Import shop API to fetch full details
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

    // Calculate week based on offset using shared utility with shop timezone
    const weekDates = useMemo(() => {
        const weekStartDate = getWeekStartWithOffset(weekOffset, shopTimezone);
        const dates = getWeekDates(weekStartDate, shopTimezone);
        const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return dates.map((dateStr) => {
            // Parse the date and get the actual day of week
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.

            return {
                date: dateStr,
                dayName: dayNamesShort[dayOfWeek], // Use actual day from date
                dayDate: `${month}/${day}`,
                hours: ''
            };
        });
    }, [weekOffset, shopTimezone]);

    const weekStart = weekDates[0]?.date || '';
    const weekEnd = weekDates[6]?.date || '';

    // Reset entries when week changes
    useEffect(() => {
        setDayEntries(weekDates);
        if (shop && user) {
            loadExistingEntries();
        }
    }, [weekDates, shop, user]);

    // Load existing entries for current user and week
    const loadExistingEntries = useCallback(async () => {
        if (!shop || !user || !weekStart || !weekEnd) return;

        setLoadingEntries(true);
        try {
            const entriesResponse = await workforceApi.getTimesheetEntries({
                employee_id: user.id,
                shop_id: shop.id,
                date_from: weekStart,
                date_to: weekEnd
            });

            const entryList = Array.isArray(entriesResponse)
                ? entriesResponse
                : ((entriesResponse as unknown as { results?: TimesheetEntry[] })?.results || []);


            // Map entries to dayEntries - track status for each entry
            setDayEntries(prev => prev.map(day => {
                const existingEntry = entryList.find(e => e.date === day.date);
                if (existingEntry) {
                    const entryStatus = existingEntry.status as 'PENDING' | 'APPROVED' | 'REJECTED';
                    // For rejected entries, show empty so they can resubmit
                    if (entryStatus === 'REJECTED') {
                        return {
                            ...day,
                            hours: '', // Empty for fresh entry
                            originalHours: existingEntry.hours_worked?.toString() || '0',
                            wasEditedBefore: false,
                            existingId: existingEntry.id,
                            entryStatus
                        };
                    } else {
                        // For PENDING or APPROVED, show the hours but mark as non-editable
                        const hoursValue = existingEntry.hours_worked?.toString() || '0';
                        return {
                            ...day,
                            hours: hoursValue,
                            originalHours: hoursValue,
                            wasEditedBefore: false,
                            existingId: existingEntry.id,
                            entryStatus
                        };
                    }
                }
                return { ...day, hours: '', originalHours: undefined, wasEditedBefore: false, existingId: undefined, entryStatus: undefined };
            }));

            if (entryList.length > 0 && entryList[0].notes && !entryList[0].notes.includes('[EDITED]')) {
                setNotes(entryList[0].notes);
            }
        } catch (err) {
            console.error('Failed to load employee timesheet entries:', err);
        } finally {
            setLoadingEntries(false);
        }
    }, [shop, user, weekStart, weekEnd]);

    const handleHoursChange = (index: number, value: string) => {
        const newEntries = [...dayEntries];
        if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
            newEntries[index].hours = value;
            setDayEntries(newEntries);
        }
    };

    // Week navigation
    const goToPreviousWeek = () => setWeekOffset(prev => prev - 1);
    const goToNextWeek = () => setWeekOffset(prev => prev + 1);
    const goToCurrentWeek = () => setWeekOffset(0);

    // Calculate total hours
    const totalHours = useMemo(() => {
        return dayEntries.reduce((sum, day) => {
            const hours = parseFloat(day.hours) || 0;
            return sum + hours;
        }, 0).toFixed(1);
    }, [dayEntries]);

    // Format week range for display
    const formatWeekRange = () => {
        const start = new Date(weekStart);
        const end = new Date(weekEnd);
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    const handleSubmit = async () => {
        if (!user || !shop) {
            setError('User or shop not available');
            return;
        }

        const entriesWithHours = dayEntries.filter(d => d.hours && parseFloat(d.hours) > 0);
        const entriesWithExistingToDelete = dayEntries.filter(d =>
            d.existingId && (!d.hours || parseFloat(d.hours) === 0)
        );

        if (entriesWithHours.length === 0 && entriesWithExistingToDelete.length === 0) {
            setError('Please enter hours for at least one day');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // Build auto-notes for edited entries
            const editedEntries = dayEntries.filter(d =>
                d.originalHours !== undefined && d.hours !== d.originalHours
            );

            let autoNotes = notes;
            if (editedEntries.length > 0) {
                const editDetails = editedEntries.map(e => {
                    const original = parseFloat(e.originalHours || '0');
                    const newHours = parseFloat(e.hours) || 0;
                    return `${e.dayName} ${e.dayDate}: ${original}h → ${newHours}h`;
                }).join(', ');

                const editNote = `[EDITED] ${editDetails}`;
                autoNotes = autoNotes ? `${autoNotes}\n${editNote}` : editNote;
            }

            // Process entries with hours
            for (const entry of entriesWithHours) {
                const hours = parseFloat(entry.hours);
                const startHour = 9;
                const endHour = startHour + Math.floor(hours);
                const endMinutes = Math.round((hours % 1) * 60);

                const entryData = {
                    employee: user.id,
                    shop: shop.id,
                    date: entry.date,
                    start_time: `${String(startHour).padStart(2, '0')}:00`,
                    end_time: `${String(endHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`,
                    entry_mode: 'MANUAL' as const,
                    notes: autoNotes,
                    status: 'PENDING' as const
                };

                if (entry.existingId) {
                    await workforceApi.updateTimesheetEntry(entry.existingId, entryData);
                } else {
                    await workforceApi.createTimesheetEntry(entryData);
                }
            }

            // Delete entries set to 0
            for (const entry of entriesWithExistingToDelete) {
                try {
                    await workforceApi.deleteTimesheetEntry(entry.existingId!);
                } catch (deleteErr) {
                    console.warn('Failed to delete zero-hour entry:', deleteErr);
                }
            }

            setTotalHoursSubmitted(totalHours);
            setShowSuccess(true);
        } catch (err: unknown) {
            const errorMsg = (err as { message?: string })?.message || 'Failed to submit timesheet';
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    // Check if this week has any editable entries (no status or REJECTED status)
    const isWeekEditable = useMemo(() => {
        return dayEntries.some(d => !d.entryStatus || d.entryStatus === 'REJECTED');
    }, [dayEntries]);

    if (loading) {
        return <Loading message="Loading..." />;
    }

    if (!shop) {
        return <Loading message="Redirecting..." />;
    }

    // Success view
    if (showSuccess) {
        return (
            <PageContainer>
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600 dark:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Timesheet Submitted!</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            <strong>{totalHoursSubmitted} hours</strong> submitted for<br />
                            {formatWeekRange()}
                        </p>
                        <div className="flex justify-center gap-3">
                            <Button variant="outline" onClick={() => navigate('/employee/dashboard')}>
                                Dashboard
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowSuccess(false);
                                    setWeekOffset(0);
                                }}
                                className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md"
                            >
                                Enter Another Week
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Enter Timesheet</h1>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">Log your hours at {shop.name}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/employee/dashboard')} className="flex-shrink-0">
                        <span className="sm:hidden">← Back</span>
                        <span className="hidden sm:inline">← Back to Dashboard</span>
                    </Button>
                </div>
            </div>

            {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

            {/* Week Navigation */}
            <Card className="mb-4">
                <CardContent className="py-2.5 sm:py-3">
                    <div className="flex items-center justify-between gap-2">
                        <Button variant="outline" size="sm" onClick={goToPreviousWeek} className="flex-shrink-0 px-2 sm:px-3">
                            <span className="text-xs sm:text-sm">← Prev</span>
                        </Button>
                        <div className="text-center flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-gray-200 text-xs sm:text-sm truncate">{formatWeekRange()}</p>
                            {weekOffset !== 0 && (
                                <button
                                    onClick={goToCurrentWeek}
                                    className="text-[10px] sm:text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
                                >
                                    Current Week
                                </button>
                            )}
                        </div>
                        <Button variant="outline" size="sm" onClick={goToNextWeek} className="flex-shrink-0 px-2 sm:px-3">
                            <span className="text-xs sm:text-sm">Next →</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Timesheet Entry Table */}
            <Card className="mb-4">
                {loadingEntries ? (
                    <CardContent className="py-8 text-center">
                        <Loading message="Loading entries..." />
                    </CardContent>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700">
                        <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900">
                                <tr>
                                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Day
                                    </th>
                                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                                        Hours
                                    </th>
                                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700">
                                {dayEntries.map((day, index) => (
                                    <tr key={day.date} className={index % 2 === 1 ? 'bg-gray-50/50 dark:bg-slate-700/50' : ''}>
                                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                            <span className="text-primary-600 dark:text-primary-400">{day.dayName}</span>
                                            <span className="ml-1 text-gray-600 dark:text-gray-400">{day.dayDate}</span>
                                        </td>
                                        <td className="px-3 sm:px-4 py-2 text-center">
                                            {/* Only allow editing if no entry OR status is REJECTED */}
                                            {day.entryStatus && day.entryStatus !== 'REJECTED' ? (
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{day.hours}h</span>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={day.hours}
                                                    onChange={(e) => handleHoursChange(index, e.target.value)}
                                                    className={`w-16 sm:w-20 px-2 py-1.5 text-center text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white ${day.existingId && day.entryStatus === 'REJECTED'
                                                        ? 'border-red-300 bg-red-50 dark:bg-red-900/30 dark:border-red-700'
                                                        : 'border-gray-300 dark:border-slate-600'
                                                        }`}
                                                    placeholder="0"
                                                />
                                            )}
                                        </td>
                                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                                            {day.entryStatus === 'PENDING' && (
                                                <Badge variant="warning" className="text-[8px] sm:text-[10px]">PENDING</Badge>
                                            )}
                                            {day.entryStatus === 'APPROVED' && (
                                                <Badge variant="success" className="text-[8px] sm:text-[10px]">APPROVED</Badge>
                                            )}
                                            {day.entryStatus === 'REJECTED' && (
                                                <Badge variant="danger" className="text-[8px] sm:text-[10px]">RESUBMIT</Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-100 dark:bg-slate-700">
                                <tr>
                                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-semibold text-gray-900 dark:text-white">
                                        Total
                                    </td>
                                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                                        <span className="text-lg sm:text-xl font-bold text-primary-600 dark:text-primary-400">{totalHours}h</span>
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </Card>

            {/* Notes */}
            <Card className="mb-4">
                <CardContent className="py-3 sm:py-4">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Notes (optional)</label>
                    <textarea
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes about this week's work..."
                    />
                </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => navigate('/employee/dashboard')}>
                    {isWeekEditable ? 'Cancel' : 'Back'}
                </Button>
                {isWeekEditable && (
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || loadingEntries}
                        className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md"
                    >
                        {submitting ? 'Submitting...' : `Submit ${totalHours}h`}
                    </Button>
                )}
            </div>
        </PageContainer>
    );
};

export default EmployeeTimesheet;
