/**
 * PayRatesPage - Admin page for managing employee pay rates
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { Loading } from '../../../shared/components/Loading';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { workforceApi, EmployeePayRate, Employee } from '../../../shared/utils/workforceApi';

interface PayRatesPageProps {
    onClose?: () => void;
}

export const PayRatesPage: React.FC<PayRatesPageProps> = () => {
    const [payRates, setPayRates] = useState<EmployeePayRate[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    // Load pay rates on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ratesData, employeesData] = await Promise.all([
                workforceApi.getPayRates(),
                workforceApi.getEmployees()
            ]);
            setPayRates(Array.isArray(ratesData) ? ratesData : []);
            const empList = Array.isArray(employeesData) ? employeesData : ((employeesData as unknown as { results?: Employee[] })?.results || []);
            setEmployees(empList);
        } catch (err: unknown) {
            const errorMsg = (err as { message?: string })?.message || 'Failed to load data';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePayRate = async (data: { employee: string; hourly_rate: string; effective_from: string }) => {
        await workforceApi.createPayRate(data);
        await loadData();
        setShowAddModal(false);
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Employee Pay Rates</h2>
                    <p className="text-gray-600">Manage hourly pay rates for employees</p>
                </div>
                <Button variant="primary" onClick={() => setShowAddModal(true)}>
                    + Add Pay Rate
                </Button>
            </div>

            {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

            <Card>
                <CardHeader>
                    <CardTitle>Current Pay Rates</CardTitle>
                </CardHeader>
                <CardContent>
                    {payRates.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No pay rates defined yet</p>
                            <p className="text-sm">Click "Add Pay Rate" to set up employee pay rates</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hourly Rate</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective From</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective To</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {payRates.map((rate) => (
                                        <tr key={rate.id}>
                                            <td className="px-4 py-3 text-sm font-medium">{rate.employee_name}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-green-600">${rate.hourly_rate}/hr</td>
                                            <td className="px-4 py-3 text-sm">{rate.effective_from}</td>
                                            <td className="px-4 py-3 text-sm">{rate.effective_to || 'Current'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Pay Rate Modal */}
            {showAddModal && (
                <AddPayRateModal
                    employees={employees}
                    onClose={() => setShowAddModal(false)}
                    onSave={handleSavePayRate}
                />
            )}
        </div>
    );
};

// Add Pay Rate Modal Component
interface AddPayRateModalProps {
    employees: Employee[];
    onClose: () => void;
    onSave: (data: { employee: string; hourly_rate: string; effective_from: string }) => Promise<void>;
}

const AddPayRateModal: React.FC<AddPayRateModalProps> = ({ employees, onClose, onSave }) => {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        employee: '',
        hourly_rate: '',
        effective_from: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.employee || !formData.hourly_rate || !formData.effective_from) {
            setError('Please fill in all required fields');
            return;
        }

        setSaving(true);
        try {
            await onSave(formData);
        } catch (err: unknown) {
            const errorMsg = (err as { message?: string })?.message || 'Failed to save pay rate';
            setError(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Add Pay Rate</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                            {error}
                        </div>
                    )}

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
                        label="Hourly Rate ($) *"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                        placeholder="15.00"
                    />

                    <Input
                        label="Effective From *"
                        type="date"
                        value={formData.effective_from}
                        onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                    />

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Add Pay Rate'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PayRatesPage;
