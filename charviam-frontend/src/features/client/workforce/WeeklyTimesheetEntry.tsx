/**
 * WeeklyTimesheetEntry - Weekly grid timesheet entry form
 * With week navigation and loading of existing entries
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { Modal } from '../../../shared/components/ui/Modal';
import { workforceApi, Employee, TimesheetEntry } from '../../../shared/utils/workforceApi';
import { adminApi } from '../../../shared/utils/api-service';
import type { Shop } from '../../../shared/types';

interface WeeklyTimesheetEntryProps {
    shopId: string;
    shopName: string;
    onClose: () => void;
    onSuccess: () => void;
    preselectedEmployeeId?: string;
    preselectedWeekStart?: string;
}

interface DayEntry {
    date: string;
    dayName: string;
    dayDate: string;
    hours: string;
    originalHours?: string; // Track original hours to detect current edits
    wasEditedBefore?: boolean; // Track if this day was edited before (from notes history)
    existingId?: string; // Track existing entry ID for updates
}

export const WeeklyTimesheetEntry: React.FC<WeeklyTimesheetEntryProps> = ({
    shopId,
    shopName,
    onClose,
    onSuccess,
    preselectedEmployeeId,
    preselectedWeekStart
}) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [_selectedEmployeeName, setSelectedEmployeeName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [loadingEntries, setLoadingEntries] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [totalHoursSubmitted, setTotalHoursSubmitted] = useState<string>('0');
    const modalTopRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to top when error occurs
    useEffect(() => {
        if (error && modalTopRef.current) {
            modalTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [error]);

    // Shop selection for All Shops mode
    const isAllShopsMode = shopId === 'ALL';
    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedShop, setSelectedShop] = useState<string>('');
    const [_selectedShopName, setSelectedShopName] = useState<string>('');

    // Week offset (0 = current week, -1 = last week, 1 = next week)
    const [weekOffset, setWeekOffset] = useState(0);

    // Form state
    const [notes, setNotes] = useState<string>('');
    const [expenses, setExpenses] = useState<string>('0');
    const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);

    // Helper to format date as YYYY-MM-DD in local timezone (avoids UTC shift from toISOString)
    const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Calculate week based on offset
    const weekDates = useMemo(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7)); // Get Monday of current week

        // Apply week offset
        monday.setDate(monday.getDate() + (weekOffset * 7));

        const days: DayEntry[] = [];
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            days.push({
                // Use local date formatting to avoid timezone issues
                date: formatLocalDate(date),
                dayName: dayNames[i],
                dayDate: `${date.getMonth() + 1}/${date.getDate()}`,
                hours: ''
            });
        }

        return days;
    }, [weekOffset]);

    const weekStart = weekDates[0]?.date || '';
    const weekEnd = weekDates[6]?.date || '';

    // Load employees and shops on mount
    useEffect(() => {
        if (isAllShopsMode) {
            loadShops();
        } else {
            loadEmployees(shopId);
        }
    }, [shopId, isAllShopsMode]);

    // Load employees when shop is selected in All Shops mode
    useEffect(() => {
        if (isAllShopsMode && selectedShop) {
            loadEmployees(selectedShop);
        }
    }, [selectedShop, isAllShopsMode]);

    // Initialize from preselected values (edit mode)
    useEffect(() => {
        if (preselectedWeekStart) {
            // Calculate week offset from preselected week start
            const today = new Date();
            const dayOfWeek = today.getDay();
            const currentMonday = new Date(today);
            currentMonday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

            const preselectedDate = new Date(preselectedWeekStart);
            const diffDays = Math.round((preselectedDate.getTime() - currentMonday.getTime()) / (1000 * 60 * 60 * 24));
            const offset = Math.round(diffDays / 7);
            setWeekOffset(offset);
        }
    }, [preselectedWeekStart]);

    // Set preselected employee after employees are loaded
    useEffect(() => {
        if (preselectedEmployeeId && employees.length > 0 && !selectedEmployee) {
            const emp = employees.find(e => e.id === preselectedEmployeeId);
            if (emp) {
                setSelectedEmployee(preselectedEmployeeId);
                setSelectedEmployeeName(emp.full_name || `${emp.name_first} ${emp.name_last}`);
                loadExistingEntries(preselectedEmployeeId);
            }
        }
    }, [preselectedEmployeeId, employees]);

    // Reset entries when week changes
    useEffect(() => {
        setDayEntries(weekDates);
        // If employee is selected, reload their entries for the new week
        if (selectedEmployee) {
            loadExistingEntries(selectedEmployee);
        }
    }, [weekDates]);

    const loadShops = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getShops();
            // Handle both array and paginated response formats
            const shopList = Array.isArray(data) ? data : ((data as unknown as { results?: Shop[] })?.results || []);
            setShops(shopList);
            setLoading(false);
        } catch (err) {

            setError('Failed to load shops');
            setLoading(false);
        }
    };

    const loadEmployees = async (shopIdToLoad?: string) => {
        setLoading(true);
        setEmployees([]);
        setSelectedEmployee('');
        try {
            const data = await workforceApi.getEmployees(shopIdToLoad);
            const empList = Array.isArray(data) ? data : ((data as unknown as { results?: Employee[] })?.results || []);
            setEmployees(empList);
        } catch (err) {

            setError('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const handleShopChange = (newShopId: string) => {
        setSelectedShop(newShopId);
        const shop = shops.find(s => s.id === newShopId);
        setSelectedShopName(shop?.name || '');
        // Reset employee selection when shop changes
        setSelectedEmployee('');
        setEmployees([]);
    };

    // Load existing entries for selected employee and current week
    const loadExistingEntries = useCallback(async (employeeId: string) => {
        if (!employeeId || !weekStart || !weekEnd) return;

        setLoadingEntries(true);
        try {
            const entriesResponse = await workforceApi.getTimesheetEntries({
                employee_id: employeeId,
                shop_id: shopId,
                date_from: weekStart,
                date_to: weekEnd
            });

            // Handle both array and paginated response formats
            const entryList = Array.isArray(entriesResponse)
                ? entriesResponse
                : ((entriesResponse as unknown as { results?: TimesheetEntry[] })?.results || []);

            // Check if all entries are REJECTED - if so, this is a resubmission (show 0s)
            const allRejected = entryList.length > 0 && entryList.every(e => e.status === 'REJECTED');

            // Parse notes to find which days were previously edited
            // Notes format: [EDITED] Mon 12/8: 8h → 0h, Tue 12/9: 8h → 0h
            const editedDays = new Set<string>();
            entryList.forEach(entry => {
                if (entry.notes && entry.notes.includes('[EDITED]')) {
                    // Parse day identifiers from notes - look for patterns like "Mon 12/8:" or "Tue 12/9:"
                    const editedMatches = entry.notes.match(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\d{1,2}\/\d{1,2}:/g);
                    if (editedMatches) {
                        editedMatches.forEach(match => {
                            // Extract the day/date part (e.g., "Mon 12/8")
                            const dayDate = match.replace(':', '').trim();
                            editedDays.add(dayDate);
                        });
                    }
                }
            });

            // Map entries to dayEntries
            setDayEntries(prev => prev.map(day => {
                const existingEntry = entryList.find(e => e.date === day.date);
                // Check if this day was previously edited based on notes
                const dayIdentifier = `${day.dayName} ${day.dayDate}`;
                const wasEditedBefore = editedDays.has(dayIdentifier);

                if (existingEntry) {
                    if (allRejected) {
                        // For rejected timesheets, show 0 (fresh resubmission) but keep the ID for deletion
                        return {
                            ...day,
                            hours: '', // Show empty for fresh entry
                            originalHours: existingEntry.hours_worked?.toString() || '0',
                            wasEditedBefore: false, // Fresh start, no edit history
                            existingId: existingEntry.id // Keep ID so we can delete old entries
                        };
                    } else {
                        const hoursValue = existingEntry.hours_worked?.toString() || '0';
                        return {
                            ...day,
                            hours: hoursValue,
                            originalHours: hoursValue, // Track original for edit detection
                            wasEditedBefore, // Preserve edit history
                            existingId: existingEntry.id
                        };
                    }
                }
                return { ...day, hours: '', originalHours: undefined, wasEditedBefore, existingId: undefined };
            }));

            // Load notes from first entry if available
            if (entryList.length > 0 && entryList[0].notes) {
                setNotes(entryList[0].notes);
            }
        } catch (err) {
            console.error('Failed to load existing entries:', err);
        } finally {
            setLoadingEntries(false);
        }
    }, [shopId, weekStart, weekEnd]);

    const handleEmployeeChange = (employeeId: string) => {
        setSelectedEmployee(employeeId);
        const emp = employees.find(e => e.id === employeeId);
        if (emp) {
            setSelectedEmployeeName(emp.full_name || `${emp.name_first} ${emp.name_last}`);
        }
        // Load existing entries for this employee
        if (employeeId) {
            loadExistingEntries(employeeId);
        } else {
            // Reset entries if no employee selected
            setDayEntries(weekDates);
            setNotes('');
        }
    };

    const handleHoursChange = (index: number, value: string) => {
        const newEntries = [...dayEntries];
        // Allow only valid number inputs
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
        }, 0).toFixed(2);
    }, [dayEntries]);

    const handleSubmit = async () => {
        if (!selectedEmployee) {
            setError('Please select an employee');
            return;
        }

        // Check if at least one day has hours
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
                d.originalHours !== undefined &&
                d.hours !== d.originalHours
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

            // Process entries with hours (create or update)
            for (const entry of entriesWithHours) {
                const hours = parseFloat(entry.hours);
                // Calculate start/end times based on hours (assume 9 AM start)
                const startHour = 9;
                const endHour = startHour + Math.floor(hours);
                const endMinutes = Math.round((hours % 1) * 60);

                const entryData = {
                    employee: selectedEmployee,
                    shop: isAllShopsMode ? selectedShop : shopId,
                    date: entry.date,
                    start_time: `${String(startHour).padStart(2, '0')}:00`,
                    end_time: `${String(endHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`,
                    entry_mode: 'MANUAL' as const,
                    notes: autoNotes,
                    status: 'PENDING' as const // Always set to PENDING so edits require re-approval
                };

                if (entry.existingId) {
                    // Update existing entry - status will be set to PENDING
                    await workforceApi.updateTimesheetEntry(entry.existingId, entryData);
                } else {
                    // Create new entry
                    await workforceApi.createTimesheetEntry(entryData);
                }
            }

            // Delete entries that were set to 0 (had existing ID but now have 0 hours)
            for (const entry of entriesWithExistingToDelete) {
                try {
                    await workforceApi.deleteTimesheetEntry(entry.existingId!);
                } catch (deleteErr) {

                    // Continue even if delete fails
                }
            }

            setTotalHoursSubmitted(totalHours);
            setShowSuccess(true);
            onSuccess();
        } catch (err: unknown) {
            const errorMsg = (err as { message?: string })?.message || 'Failed to submit timesheet';
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Timesheet Submitted!</h2>
                    <p className="text-gray-600 mb-4">
                        <strong>{totalHoursSubmitted} hours</strong> submitted for week<br />
                        {weekStart} to {weekEnd}
                    </p>
                    <Button variant="primary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        );
    }

    // Render using Modal component
    const modalContent = (
        <>
            {/* Week Navigation */}
            <div ref={modalTopRef} className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-slate-700">
                <Button variant="secondary" size="sm" onClick={goToPreviousWeek}>
                    ← Prev
                </Button>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-1 sm:px-2 whitespace-nowrap">
                    {weekStart} - {weekEnd}
                </span>
                <Button variant="secondary" size="sm" onClick={goToNextWeek}>
                    Next →
                </Button>
                {weekOffset !== 0 && (
                    <Button variant="secondary" size="sm" onClick={goToCurrentWeek}>
                        Today
                    </Button>
                )}
            </div>

            {/* Employee & Shop Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Employee *</label>
                    {loading && isAllShopsMode && !selectedShop ? (
                        <div className="text-gray-500 dark:text-gray-400">Loading shops...</div>
                    ) : loading ? (
                        <div className="text-gray-500 dark:text-gray-400">Loading employees...</div>
                    ) : isAllShopsMode && !selectedShop ? (
                        <div className="text-amber-600 dark:text-amber-400 text-sm">Please select a shop first</div>
                    ) : (
                        <Select
                            value={selectedEmployee}
                            onChange={(e) => handleEmployeeChange(e.target.value)}
                            disabled={isAllShopsMode && !selectedShop}
                            options={[
                                { value: '', label: employees.length === 0 ? 'No employees found' : 'Select employee...' },
                                ...employees.map(emp => ({
                                    value: emp.id,
                                    label: emp.full_name || `${emp.name_first} ${emp.name_last}`
                                }))
                            ]}
                        />
                    )}
                </div>
                <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Shop {isAllShopsMode && '*'}</label>
                    {isAllShopsMode ? (
                        <Select
                            value={selectedShop}
                            onChange={(e) => handleShopChange(e.target.value)}
                            options={[
                                { value: '', label: 'Select shop...' },
                                ...shops.map(shop => ({
                                    value: shop.id,
                                    label: shop.name
                                }))
                            ]}
                        />
                    ) : (
                        <div className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-gray-900 dark:text-gray-100 text-sm">
                            {shopName}
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Week</label>
                    <div className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-gray-900 dark:text-gray-100 text-sm">
                        {weekStart} to {weekEnd}
                    </div>
                </div>
            </div>

            {/* Loading indicator for entries */}
            {loadingEntries && (
                <div className="py-2 text-blue-700 text-sm">
                    Loading existing entries...
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Mobile: Table Layout for Days */}
            <div className="md:hidden mb-4 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                {/* Table Header */}
                <div className="flex bg-slate-700 text-white">
                    <div className="flex-1 px-4 py-3 text-sm font-semibold">Day</div>
                    <div className="w-24 px-4 py-3 text-sm font-semibold text-center">Hours</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                    {dayEntries.map((day, index) => {
                        const isCurrentlyEditing = day.originalHours !== undefined && day.hours !== day.originalHours;
                        const showEdited = isCurrentlyEditing || day.wasEditedBefore;
                        return (
                            <div key={index} className={`flex items-center ${day.existingId ? 'bg-green-50 dark:bg-green-900/30' : ''}`}>
                                <div className="flex-1 px-4 py-3">
                                    <span className="text-blue-600 dark:text-blue-400 text-xs">{day.dayName}</span>
                                    <span className="ml-1 text-slate-800 dark:text-gray-200 text-sm font-medium"> - {day.dayDate}</span>
                                    {day.existingId && !showEdited && (
                                        <span className="ml-2 text-xs text-green-600">✓</span>
                                    )}
                                    {showEdited && (
                                        <span className="ml-2 text-xs text-orange-600">✎</span>
                                    )}
                                </div>
                                <div className="w-24 px-2 py-2">
                                    <input
                                        type="text"
                                        value={day.hours}
                                        onChange={(e) => handleHoursChange(index, e.target.value)}
                                        className={`w-full px-2 py-2 text-center text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 dark:text-white ${day.existingId ? 'border-green-300 dark:border-green-600' : 'border-gray-300 dark:border-slate-600'
                                            }`}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Table Footer - Total */}
                <div className="flex bg-slate-700 text-white">
                    <div className="flex-1 px-4 py-3 text-sm font-semibold">Total</div>
                    <div className="w-24 px-4 py-3 text-center text-xl font-bold">{totalHours}</div>
                </div>
            </div>

            {/* Desktop: Horizontal Table for Days */}
            <div className="hidden md:block mb-4">
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900">
                                    <tr>
                                        {dayEntries.map((day, index) => {
                                            const isCurrentlyEditing = day.originalHours !== undefined && day.hours !== day.originalHours;
                                            const showEdited = isCurrentlyEditing || day.wasEditedBefore;
                                            return (
                                                <th key={index} className="px-4 py-3 text-center">
                                                    <div className="text-xs text-blue-200">{day.dayName}</div>
                                                    <div className="text-sm font-medium text-white">{day.dayDate}</div>
                                                    {day.existingId && !showEdited && (
                                                        <div className="text-xs text-green-400">✓ Saved</div>
                                                    )}
                                                    {showEdited && (
                                                        <div className="text-xs text-orange-400">✎ Edited</div>
                                                    )}
                                                </th>
                                            )
                                        })}
                                        <th className="px-4 py-3 text-center bg-slate-900">
                                            <div className="text-xs text-blue-200">TOTAL</div>
                                            <div className="text-sm font-bold text-white">Hours</div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-t border-gray-200 dark:border-slate-700">
                                        {dayEntries.map((day, index) => (
                                            <td key={index} className="px-2 py-3 text-center">
                                                <input
                                                    type="text"
                                                    value={day.hours}
                                                    onChange={(e) => handleHoursChange(index, e.target.value)}
                                                    className={`w-16 px-2 py-2 text-center border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${day.existingId
                                                        ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/30'
                                                        : 'border-gray-300 dark:border-slate-600'
                                                        }`}
                                                    placeholder="0"
                                                />
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 text-center bg-gray-50 dark:bg-slate-700">
                                            <span className="text-xl font-bold text-primary-600">{totalHours}</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Notes Section */}
            <div className="mb-4">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this week's work..."
                />
            </div>

            {/* Expenses Section */}
            <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Expenses</label>
                <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 mr-1">$</span>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenses}
                        onChange={(e) => setExpenses(e.target.value)}
                        className="w-28"
                    />
                </div>
            </div>
        </>
    );

    const modalFooter = (
        <>
            <div className="text-sm text-gray-600 dark:text-gray-400 mr-auto">
                Total: <span className="font-bold text-primary-600">{totalHours}h</span>
                {parseFloat(expenses) > 0 && (
                    <span className="ml-2">+ ${expenses}</span>
                )}
            </div>
            <Button variant="secondary" size="sm" onClick={onClose}>
                Cancel
            </Button>
            <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting || !selectedEmployee || loadingEntries}
                className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white"
            >
                {submitting ? 'Submitting...' : 'Submit'}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Enter Timesheet"
            size="xl"
            footer={modalFooter}
        >
            {modalContent}
        </Modal>
    );
};

export default WeeklyTimesheetEntry;
