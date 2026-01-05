/**
 * GanttShiftSchedule - Weekly Gantt-style shift schedule view
 * Rows: Shift times/templates with custom shift option
 * Columns: Days with dates
 * Inside: Employee name dropdowns
 * Features: Week navigation, batch save
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { useConfirm } from '../../../shared/components/ui';
import { workforceApi, Employee, ShiftSchedule, ShiftTemplate as ApiShiftTemplate } from '../../../shared/utils/workforceApi';
import { useTimezone } from '../../../shared/context/TimezoneContext';

interface GanttShiftScheduleProps {
    shopId: string;
    shopName: string;
    onRefresh: () => void;
}

interface LocalShiftTemplate {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    isCustom?: boolean;
}

interface CellEmployee {
    id: string;
    name: string;
    scheduleId: string | null; // null if newly added (not saved yet)
    toDelete?: boolean; // mark for deletion on save
}

interface ScheduleCell {
    date: string;
    shiftTemplateId: string;
    employees: CellEmployee[]; // Multiple employees per cell
    isDirty?: boolean;
}

export const GanttShiftSchedule: React.FC<GanttShiftScheduleProps> = ({
    shopId,
    shopName,
    onRefresh
}) => {
    const confirm = useConfirm();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [shiftTemplates, setShiftTemplates] = useState<LocalShiftTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [scheduleGrid, setScheduleGrid] = useState<ScheduleCell[][]>([]);
    const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week, -1 = previous week
    const [hasChanges, setHasChanges] = useState(false);
    const [copying, setCopying] = useState(false);

    // Get timezone context
    const { getToday, parseLocalDate } = useTimezone();

    // Calculate week based on offset (Monday-Sunday)
    const weekDays = useMemo(() => {
        const todayStr = getToday();
        const today = parseLocalDate(todayStr);
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + (weekOffset * 7));

        const days: { date: string; dayName: string; dayDate: string }[] = [];
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        // Helper to format date as YYYY-MM-DD
        const formatDate = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            days.push({
                date: formatDate(date),
                dayName: dayNames[i],
                dayDate: `${date.getMonth() + 1}/${date.getDate()}`
            });
        }

        return days;
    }, [weekOffset, getToday, parseLocalDate]);

    const todayStr = getToday();

    const weekStart = weekDays[0].date;
    const weekEnd = weekDays[6].date;

    // Load data when shop or week changes
    useEffect(() => {
        loadData();
    }, [shopId, weekOffset]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        setHasChanges(false);
        try {
            const [employeesData, schedulesData, templatesData] = await Promise.all([
                workforceApi.getEmployees(shopId),
                workforceApi.getWeekSchedule(weekDays[0].date, shopId),
                workforceApi.getShiftTemplates()
            ]);

            const empList = Array.isArray(employeesData)
                ? employeesData
                : ((employeesData as unknown as { results?: Employee[] })?.results || []);
            setEmployees(empList);

            // Map API templates to local format
            const templatesList = Array.isArray(templatesData)
                ? templatesData
                : ((templatesData as unknown as { results?: ApiShiftTemplate[] })?.results || []);

            const localTemplates: LocalShiftTemplate[] = templatesList
                .filter(t => t.is_active)
                .map(t => ({
                    id: t.id,
                    name: t.name,
                    startTime: t.start_time,
                    endTime: t.end_time
                }));

            // Custom shift option removed per user request

            setShiftTemplates(localTemplates);

            // Initialize grid with loaded templates
            const grid: ScheduleCell[][] = localTemplates.map(template =>
                weekDays.map(day => ({
                    date: day.date,
                    shiftTemplateId: template.id,
                    employees: [],
                    isDirty: false
                }))
            );
            setScheduleGrid(grid);

            // Map existing schedules to grid
            updateGridWithSchedules(schedulesData.schedules, localTemplates);
        } catch (err: unknown) {
            const errorMsg = (err as { message?: string })?.message || 'Failed to load data';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const updateGridWithSchedules = (existingSchedules: ShiftSchedule[], templates: LocalShiftTemplate[]) => {
        setScheduleGrid(prevGrid => {
            const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell, employees: [...cell.employees] })));

            existingSchedules.forEach(schedule => {
                // Find matching template by time
                const templateIndex = templates.findIndex((t: LocalShiftTemplate) =>
                    t.startTime === schedule.start_time && t.endTime === schedule.end_time
                );

                const dayIndex = weekDays.findIndex(d => d.date === schedule.date);

                if (templateIndex >= 0 && dayIndex >= 0) {
                    const cell = newGrid[templateIndex][dayIndex];
                    // Add employee to the cell (don't duplicate)
                    if (!cell.employees.find(e => e.id === schedule.employee)) {
                        cell.employees.push({
                            id: schedule.employee,
                            name: schedule.employee_name,
                            scheduleId: schedule.id
                        });
                    }
                }
            });

            return newGrid;
        });
    };

    // Add employee to cell
    const handleAddEmployee = (templateIndex: number, dayIndex: number, employeeId: string) => {
        const template = shiftTemplates[templateIndex];
        if (template.isCustom) return;

        setError(null);
        setSuccess(null);

        const emp = employees.find(e => e.id === employeeId);
        if (!emp) return;

        setScheduleGrid(prevGrid => {
            const newGrid = prevGrid.map(row => row.map(c => ({ ...c, employees: [...c.employees] })));
            const cell = newGrid[templateIndex][dayIndex];

            // Don't add duplicate
            if (cell.employees.find(e => e.id === employeeId)) return newGrid;

            cell.employees.push({
                id: employeeId,
                name: emp.full_name || `${emp.name_first} ${emp.name_last}`,
                scheduleId: null // New, not saved yet
            });
            cell.isDirty = true;
            return newGrid;
        });
        setHasChanges(true);
    };

    // Remove employee from cell
    const handleRemoveEmployee = (templateIndex: number, dayIndex: number, employeeId: string) => {
        setError(null);
        setSuccess(null);

        setScheduleGrid(prevGrid => {
            const newGrid = prevGrid.map(row => row.map(c => ({ ...c, employees: [...c.employees] })));
            const cell = newGrid[templateIndex][dayIndex];
            const empIndex = cell.employees.findIndex(e => e.id === employeeId);

            if (empIndex >= 0) {
                const emp = cell.employees[empIndex];
                if (emp.scheduleId) {
                    // Mark for deletion instead of removing
                    emp.toDelete = true;
                } else {
                    // Not saved yet, just remove
                    cell.employees.splice(empIndex, 1);
                }
                cell.isDirty = true;
            }
            return newGrid;
        });
        setHasChanges(true);
    };

    // Save all changes when Save button is clicked
    const handleSaveAll = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const promises: Promise<unknown>[] = [];
            let saveCount = 0;

            // Find all dirty cells and save them
            for (let templateIndex = 0; templateIndex < scheduleGrid.length; templateIndex++) {
                const template = shiftTemplates[templateIndex];
                if (template.isCustom) continue;

                for (let dayIndex = 0; dayIndex < scheduleGrid[templateIndex].length; dayIndex++) {
                    const cell = scheduleGrid[templateIndex][dayIndex];
                    const day = weekDays[dayIndex];

                    if (!cell.isDirty) continue;

                    // Process each employee in the cell
                    for (const emp of cell.employees) {
                        if (emp.toDelete && emp.scheduleId) {
                            // Delete existing schedule
                            promises.push(workforceApi.deleteSchedule(emp.scheduleId));
                            saveCount++;
                        } else if (!emp.scheduleId && !emp.toDelete) {
                            // Create new schedule
                            promises.push(
                                workforceApi.createSchedule({
                                    employee: emp.id,
                                    shop: shopId,
                                    date: day.date,
                                    start_time: template.startTime,
                                    end_time: template.endTime,
                                    status: 'SCHEDULED'
                                })
                            );
                            saveCount++;
                        }
                        // Note: We don't update existing schedules in multi-employee mode
                        // since employee assignment doesn't change, only add/remove
                    }
                }
            }

            if (promises.length > 0) {
                await Promise.all(promises);
                setSuccess(`Saved ${saveCount} shift(s) successfully!`);
            } else {
                setSuccess('No changes to save');
            }

            setHasChanges(false);
            // Reload to get fresh data with IDs
            await loadData();
            onRefresh();
        } catch (err: unknown) {


            // Extract field_errors from the normalized error
            const apiError = err as {
                error?: string;
                field_errors?: Record<string, string[]>;
                message?: string;
            };



            // Build readable error message from field_errors
            let errorMessage = apiError.error || apiError.message || 'Failed to save schedules';

            if (apiError.field_errors && typeof apiError.field_errors === 'object') {
                const fieldMessages: string[] = [];
                for (const [field, messages] of Object.entries(apiError.field_errors)) {
                    if (Array.isArray(messages)) {
                        fieldMessages.push(`${field}: ${messages.join(', ')}`);
                    } else if (typeof messages === 'string') {
                        fieldMessages.push(`${field}: ${messages}`);
                    }
                }
                if (fieldMessages.length > 0) {
                    errorMessage = fieldMessages.join('; ');
                }
            }

            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    // Week navigation
    const goToPreviousWeek = () => {
        setWeekOffset(prev => prev - 1);
    };

    const goToNextWeek = () => {
        setWeekOffset(prev => prev + 1);
    };

    const goToCurrentWeek = () => {
        setWeekOffset(0);
    };

    // Copy shifts from previous week
    const handleCopyFromPreviousWeek = async () => {
        if (copying) return;

        // Calculate previous week's Monday
        const todayStr = getToday();
        const today = parseLocalDate(todayStr);
        const dayOfWeek = today.getDay();
        const currentMonday = new Date(today);
        currentMonday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + (weekOffset * 7));

        const previousMonday = new Date(currentMonday);
        previousMonday.setDate(currentMonday.getDate() - 7);

        // Format dates
        const formatDate = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const sourceWeekStart = formatDate(previousMonday);
        const targetWeekStart = formatDate(currentMonday);

        const confirmed = await confirm({
            title: 'Copy Shifts from Last Week',
            message: `Copy all shifts from week of ${sourceWeekStart} to week of ${targetWeekStart}?\n\nExisting shifts will not be overwritten.`,
            confirmText: 'Copy Shifts',
            variant: 'info',
        });

        if (!confirmed) {
            return;
        }

        setCopying(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await workforceApi.copyWeekSchedule({
                source_week_start: sourceWeekStart,
                target_week_start: targetWeekStart,
                shop: shopId
            });

            setSuccess(`${response.message}`);
            await loadData();
            onRefresh();
        } catch (err: unknown) {
            const errorMsg = (err as { message?: string; error?: string })?.error ||
                (err as { message?: string })?.message ||
                'Failed to copy shifts';
            setError(errorMsg);
        } finally {
            setCopying(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Loading schedule...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                {/* Title and Navigation in one row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Title Section */}
                    <div>
                        <CardTitle className="text-lg sm:text-xl">Weekly Shift Schedule: {shopName}</CardTitle>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Week: {weekStart} to {weekEnd}
                        </p>
                    </div>

                    {/* Week Navigation - right side */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={goToPreviousWeek}>
                            ← Prev
                        </Button>
                        {weekOffset !== 0 && (
                            <Button variant="secondary" size="sm" onClick={goToCurrentWeek}>
                                Today
                            </Button>
                        )}
                        <Button variant="secondary" size="sm" onClick={goToNextWeek}>
                            Next →
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-400 text-sm">
                        {success}
                    </div>
                )}

                {hasChanges && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md text-yellow-700 dark:text-yellow-400 text-sm">
                        You have unsaved changes. Click "Save Shifts" to save.
                    </div>
                )}

                {/* Mobile Card View - shown only on small screens */}
                <div className="md:hidden space-y-4">
                    {weekDays.map((day, dayIndex) => (
                        <div
                            key={day.date}
                            className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-md ${day.date === todayStr ? 'ring-2 ring-blue-400' : ''}`}
                        >
                            {/* Card Header - light styling to match desktop */}
                            <div className={`flex items-center justify-between gap-3 px-4 py-3 border-b ${day.date === todayStr ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'}`}>
                                <div className={`font-semibold text-sm min-[350px]:text-base ${day.date === todayStr ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                    {day.dayName}, {day.dayDate}
                                </div>
                                {day.date === todayStr && (
                                    <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full">Today</span>
                                )}
                            </div>

                            {/* Card Body */}
                            <div className="p-4 space-y-4">
                                {shiftTemplates.filter(t => !t.isCustom).map((template, templateIndex) => {
                                    const cell = scheduleGrid[templateIndex]?.[dayIndex];
                                    const activeEmployees = cell?.employees?.filter(e => !e.toDelete) || [];

                                    return (
                                        <div key={template.id} className={`p-3 rounded-lg border ${cell?.isDirty ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700' : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'}`}>
                                            {/* Shift Name & Time */}
                                            <div className="mb-2">
                                                <span className="text-blue-600 text-[11px] min-[350px]:text-xs font-medium block mb-1">
                                                    {template.name}
                                                </span>
                                                <div className="text-slate-800 dark:text-slate-200 text-sm font-medium">
                                                    {template.startTime} - {template.endTime}
                                                </div>
                                            </div>

                                            {/* Assigned Employees */}
                                            <div className="mb-2">
                                                <span className="text-blue-600 text-[11px] min-[350px]:text-xs font-medium block mb-1">
                                                    Assigned
                                                </span>
                                                <div className="flex flex-wrap gap-1">
                                                    {activeEmployees.map(emp => (
                                                        <span
                                                            key={emp.id}
                                                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${emp.scheduleId ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                                }`}
                                                        >
                                                            {emp.name}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveEmployee(templateIndex, dayIndex, emp.id)}
                                                                className="hover:text-red-600 font-bold"
                                                                disabled={saving}
                                                            >×</button>
                                                        </span>
                                                    ))}
                                                    {activeEmployees.length === 0 && (
                                                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">No one assigned</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Add Employee Dropdown */}
                                            <select
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-gray-200"
                                                value=""
                                                onChange={(e) => e.target.value && handleAddEmployee(templateIndex, dayIndex, e.target.value)}
                                                disabled={saving}
                                            >
                                                <option value="">+ Add employee</option>
                                                {employees
                                                    .filter(emp => !activeEmployees.find(ae => ae.id === emp.id))
                                                    .map(emp => (
                                                        <option key={emp.id} value={emp.id}>
                                                            {emp.full_name || `${emp.name_first} ${emp.name_last}`}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View - hidden on mobile */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full border border-gray-200 dark:border-slate-700">
                        {/* Header Row - Days */}
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-800">
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-r border-gray-200 dark:border-slate-700 w-40">
                                    Shift Time
                                </th>
                                {weekDays.map((day, index) => (
                                    <th
                                        key={index}
                                        className={`px-3 py-3 text-center text-sm font-medium border-b border-r border-gray-200 dark:border-slate-700 ${day.date === todayStr
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                            : 'text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        <div className="font-bold">{day.dayName}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{day.dayDate}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* Body - Shift Templates */}
                        <tbody>
                            {shiftTemplates.map((template: LocalShiftTemplate, templateIndex: number) => (
                                <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                    {/* Shift Template Label */}
                                    <td className="px-4 py-3 border-b border-r border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                                        <div className="font-medium text-gray-900 dark:text-gray-100">{template.name}</div>
                                        {!template.isCustom && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {template.startTime} - {template.endTime}
                                            </div>
                                        )}
                                    </td>

                                    {/* Day Cells */}
                                    {scheduleGrid[templateIndex]?.map((cell, dayIndex) => (
                                        <td
                                            key={dayIndex}
                                            className={`px-2 py-2 border-b border-r border-gray-200 dark:border-slate-700 min-w-[140px] ${weekDays[dayIndex].date === todayStr
                                                ? 'bg-blue-50/50 dark:bg-blue-900/20'
                                                : ''
                                                } ${cell.isDirty ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                                        >
                                            {template.isCustom ? (
                                                <button
                                                    className="w-full px-2 py-1 text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-slate-600 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                                                >
                                                    + Add Custom
                                                </button>
                                            ) : (
                                                <div className="space-y-1">
                                                    {/* Employee Chips */}
                                                    <div className="flex flex-wrap gap-1">
                                                        {cell.employees
                                                            .filter(emp => !emp.toDelete)
                                                            .map(emp => (
                                                                <span
                                                                    key={emp.id}
                                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${emp.scheduleId
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-yellow-100 text-yellow-800'
                                                                        }`}
                                                                >
                                                                    {emp.name.split(' ')[0]}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveEmployee(templateIndex, dayIndex, emp.id)}
                                                                        className="hover:text-red-600 text-xs font-bold ml-0.5"
                                                                        disabled={saving}
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </span>
                                                            ))}
                                                    </div>

                                                    {/* Add Employee Dropdown */}
                                                    <select
                                                        className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-200"
                                                        value=""
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                handleAddEmployee(templateIndex, dayIndex, e.target.value);
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                        disabled={saving}
                                                    >
                                                        <option value="">+ Add</option>
                                                        {employees
                                                            .filter(emp => !cell.employees.find(ce => ce.id === emp.id && !ce.toDelete))
                                                            .map(emp => (
                                                                <option key={emp.id} value={emp.id}>
                                                                    {emp.full_name || `${emp.name_first} ${emp.name_last}`}
                                                                </option>
                                                            ))}
                                                    </select>
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border border-green-300 bg-green-50 rounded"></div>
                        <span>Assigned</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border border-yellow-400 bg-yellow-50 rounded"></div>
                        <span>Unsaved</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-50 border border-blue-200 rounded"></div>
                        <span>Today</span>
                    </div>
                </div>

                {/* Action Buttons - at bottom */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCopyFromPreviousWeek}
                        disabled={copying}
                        className="w-full sm:w-auto"
                    >
                        <span className="sm:hidden">{copying ? 'Copying...' : 'Copy Last Week'}</span>
                        <span className="hidden sm:inline">{copying ? 'Copying...' : 'Copy Shifts from Last Week'}</span>
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSaveAll}
                        disabled={saving || !hasChanges}
                        className="w-full sm:w-auto bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md"
                    >
                        {saving ? 'Saving...' : 'Save Shifts'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default GanttShiftSchedule;
