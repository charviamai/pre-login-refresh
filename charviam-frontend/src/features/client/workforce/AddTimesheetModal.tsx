/**
 * AddTimesheetModal - Modal for creating timesheet entries (manual mode)
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { workforceApi, Employee, TimesheetEntry } from '../../../shared/utils/workforceApi';
import { useTimezone } from '../../../shared/context/TimezoneContext';

interface AddTimesheetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: Partial<TimesheetEntry>) => Promise<void>;
    shopId: string;
}

export const AddTimesheetModal: React.FC<AddTimesheetModalProps> = ({
    isOpen,
    onClose,
    onSave,
    shopId
}) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { getToday } = useTimezone();
    const modalRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to error
    useEffect(() => {
        if (error && modalRef.current) {
            modalRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [error]);

    // Form state
    const [formData, setFormData] = useState({
        employee: '',
        date: '',
        start_time: '',
        end_time: '',
        notes: ''
    });

    // Load employees when modal opens
    useEffect(() => {
        if (isOpen && shopId) {
            loadEmployees();
            // Set today's date as default
            setFormData(prev => ({
                ...prev,
                date: getToday()
            }));
        }
    }, [isOpen, shopId]);

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const data = await workforceApi.getEmployees(shopId);
            const employeeList = Array.isArray(data) ? data : ((data as unknown as { results?: Employee[] })?.results || []);
            setEmployees(employeeList);
        } catch (err) {

            setError('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.employee || !formData.date || !formData.start_time || !formData.end_time) {
            setError('Please fill in all required fields');
            return;
        }

        // Validate end time is after start time
        if (formData.end_time <= formData.start_time) {
            setError('End time must be after start time');
            return;
        }

        setSaving(true);
        try {
            await onSave({
                employee: formData.employee,
                shop: shopId,
                date: formData.date,
                start_time: formData.start_time,
                end_time: formData.end_time,
                entry_mode: 'MANUAL',
                notes: formData.notes
            });
            // Reset form
            setFormData({
                employee: '',
                date: getToday(),
                start_time: '',
                end_time: '',
                notes: ''
            });
            onClose();
        } catch (err: unknown) {
            const errorMsg = (err as { message?: string })?.message || 'Failed to save timesheet entry';
            setError(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div ref={modalRef} className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Add Timesheet Entry
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Enter hours worked manually
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="py-4 text-center text-gray-500">Loading employees...</div>
                    ) : (
                        <>
                            <Select
                                label="Employee *"
                                value={formData.employee}
                                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                                options={[
                                    { value: '', label: 'Select an employee...' },
                                    ...employees.map(emp => ({
                                        value: emp.id,
                                        label: emp.full_name || `${emp.name_first} ${emp.name_last}`
                                    }))
                                ]}
                            />

                            <Input
                                label="Date *"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Start Time *"
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                />
                                <Input
                                    label="End Time *"
                                    type="time"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                />
                            </div>

                            {/* Calculate hours preview */}
                            {formData.start_time && formData.end_time && formData.end_time > formData.start_time && (
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <span className="text-sm text-gray-600">Hours: </span>
                                    <span className="font-medium">
                                        {calculateHours(formData.start_time, formData.end_time)} hours
                                    </span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Optional notes..."
                                />
                            </div>
                        </>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading || saving}>
                            {saving ? 'Saving...' : 'Add Entry'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Helper function to calculate hours between two times
function calculateHours(start: string, end: string): string {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const diffMinutes = endMinutes - startMinutes;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (minutes === 0) {
        return hours.toString();
    }
    return `${hours}.${Math.round((minutes / 60) * 100)}`;
}

export default AddTimesheetModal;
