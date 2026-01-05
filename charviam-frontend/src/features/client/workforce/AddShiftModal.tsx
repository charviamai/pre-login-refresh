/**
 * AddShiftModal - Modal for creating/editing shift schedules
 */

import { useState, useEffect } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { workforceApi, Employee, ShiftSchedule } from '../../../shared/utils/workforceApi';
import { useTimezone } from '../../../shared/context/TimezoneContext';

interface AddShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (shift: Partial<ShiftSchedule>) => Promise<void>;
    shopId: string;
    editingShift?: ShiftSchedule | null;
}

export const AddShiftModal: React.FC<AddShiftModalProps> = ({
    isOpen,
    onClose,
    onSave,
    shopId,
    editingShift
}) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { getToday } = useTimezone();

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
        }
    }, [isOpen, shopId]);

    // Populate form when editing
    useEffect(() => {
        if (editingShift) {
            setFormData({
                employee: editingShift.employee,
                date: editingShift.date,
                start_time: editingShift.start_time,
                end_time: editingShift.end_time,
                notes: editingShift.notes || ''
            });
        } else {
            // Reset form for new shift
            setFormData({
                employee: '',
                date: getToday(), // Today's date in shop's timezone
                start_time: '09:00',
                end_time: '17:00',
                notes: ''
            });
        }
    }, [editingShift, isOpen]);

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

        setSaving(true);
        try {
            await onSave({
                employee: formData.employee,
                shop: shopId,
                date: formData.date,
                start_time: formData.start_time,
                end_time: formData.end_time,
                notes: formData.notes
            });
            onClose();
        } catch (err: unknown) {
            const errorMsg = (err as { message?: string })?.message || 'Failed to save shift';
            setError(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {editingShift ? 'Edit Shift' : 'Add New Shift'}
                    </h2>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Optional notes..."
                                />
                            </div>
                        </>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading || saving}>
                            {saving ? 'Saving...' : (editingShift ? 'Update Shift' : 'Add Shift')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddShiftModal;
