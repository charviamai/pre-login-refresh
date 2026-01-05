/**
 * GeneratePayrollModal - Modal for generating payroll
 * Uses shop's payroll_cycle setting to determine period type
 */

import { useState, useEffect } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Loading } from '../../../shared/components/Loading';
import { workforceApi, PayrollRun } from '../../../shared/utils/workforceApi';

interface GeneratePayrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (payrollRun: PayrollRun) => void;
    shopId?: string;
}

export const GeneratePayrollModal: React.FC<GeneratePayrollModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    shopId
}) => {
    const [loading, setLoading] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [periodOffset, setPeriodOffset] = useState(0);

    // Calculate dates based on period type and offset
    const calculateDatesForPeriod = (periodType: string, offset: number = 0) => {
        const today = new Date();

        if (periodType === 'WEEKLY') {
            const dayOfWeek = today.getDay();
            const monday = new Date(today);
            monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + (offset * 7));
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            return {
                start: monday.toISOString().split('T')[0],
                end: sunday.toISOString().split('T')[0]
            };
        } else if (periodType === 'BI_WEEKLY') {
            const dayOfWeek = today.getDay();
            const thisMonday = new Date(today);
            thisMonday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
            const biWeeklyStart = new Date(thisMonday);
            biWeeklyStart.setDate(thisMonday.getDate() + (offset * 14));
            const biWeeklyEnd = new Date(biWeeklyStart);
            biWeeklyEnd.setDate(biWeeklyStart.getDate() + 13);
            return {
                start: biWeeklyStart.toISOString().split('T')[0],
                end: biWeeklyEnd.toISOString().split('T')[0]
            };
        } else if (periodType === 'MONTHLY') {
            const targetMonth = new Date(today.getFullYear(), today.getMonth() + offset, 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + offset + 1, 0);
            return {
                start: targetMonth.toISOString().split('T')[0],
                end: lastDay.toISOString().split('T')[0]
            };
        }

        // Default to weekly
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return {
            start: monday.toISOString().split('T')[0],
            end: sunday.toISOString().split('T')[0]
        };
    };

    const [formData, setFormData] = useState(() => {
        const dates = calculateDatesForPeriod('WEEKLY', 0);
        return {
            period_type: 'WEEKLY',
            period_start: dates.start,
            period_end: dates.end
        };
    });

    // Fetch shop settings to get payroll_cycle
    useEffect(() => {
        const fetchSettings = async () => {
            if (!isOpen || !shopId) return;

            setLoadingSettings(true);
            setPeriodOffset(0);
            try {
                const data = await workforceApi.getSettings(shopId);
                const periodType = data.payroll_cycle || 'WEEKLY';
                const dates = calculateDatesForPeriod(periodType, 0);
                setFormData({
                    period_type: periodType,
                    period_start: dates.start,
                    period_end: dates.end
                });
            } catch (err) {
                console.error('Failed to fetch shop payroll settings:', err);
            } finally {
                setLoadingSettings(false);
            }
        };

        fetchSettings();
    }, [isOpen, shopId]);

    // Update dates when period offset changes
    useEffect(() => {
        const dates = calculateDatesForPeriod(formData.period_type, periodOffset);
        setFormData(prev => ({
            ...prev,
            period_start: dates.start,
            period_end: dates.end
        }));
    }, [formData.period_type, periodOffset]);

    const handlePrevious = () => {
        setPeriodOffset(prev => prev - 1);
    };

    const handleNext = () => {
        setPeriodOffset(prev => prev + 1);
    };

    const isCurrentOrFuture = periodOffset >= 0;

    const getPeriodLabel = () => {
        const start = new Date(formData.period_start);
        const end = new Date(formData.period_end);

        if (formData.period_type === 'WEEKLY') {
            return `Week of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else if (formData.period_type === 'BI_WEEKLY') {
            return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else if (formData.period_type === 'MONTHLY') {
            return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
        return '';
    };

    const getPeriodTypeLabel = () => {
        switch (formData.period_type) {
            case 'WEEKLY': return 'Weekly';
            case 'BI_WEEKLY': return 'Bi-Weekly';
            case 'MONTHLY': return 'Monthly';
            default: return 'Weekly';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.period_start || !formData.period_end) {
            setError('Please select period dates');
            return;
        }

        if (formData.period_start > formData.period_end) {
            setError('Start date cannot be after end date');
            return;
        }

        setLoading(true);
        try {
            const result = await workforceApi.generatePayroll({
                period_type: formData.period_type,
                period_start: formData.period_start,
                period_end: formData.period_end
            });
            onSuccess(result);
            onClose();
        } catch (err: unknown) {
            const error = err as {
                response?: { data?: { detail?: string } };
                error?: string;
                message?: string;
                detail?: string;
            };
            const errorMsg = error.error || error.detail || error.response?.data?.detail || error.message || 'Failed to generate payroll';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Payroll</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Create payroll from approved timesheet entries</p>
                </div>

                {loadingSettings ? (
                    <div className="p-6">
                        <Loading />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Period Type - Read-only from shop settings */}
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                Payroll Cycle
                            </label>
                            <div className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white">
                                {getPeriodTypeLabel()}
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(from shop settings)</span>
                            </div>
                        </div>

                        {/* Period Navigation */}
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 p-3 rounded-md">
                            <button
                                type="button"
                                onClick={handlePrevious}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md transition-colors"
                                title="Previous Period"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {getPeriodLabel()}
                            </span>
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={isCurrentOrFuture}
                                className={`p-2 rounded-md transition-colors ${isCurrentOrFuture
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-400'
                                    }`}
                                title={isCurrentOrFuture ? 'Cannot go to future periods' : 'Next Period'}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Date inputs - read-only */}
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Period Start"
                                type="date"
                                value={formData.period_start}
                                disabled
                                className="bg-gray-100"
                            />
                            <Input
                                label="Period End"
                                type="date"
                                value={formData.period_end}
                                disabled
                                className="bg-gray-100"
                            />
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md text-sm text-blue-700 dark:text-blue-400">
                            <strong>Note:</strong> Only approved timesheet entries within the selected period will be included.
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                            <Button type="button" variant="secondary" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" disabled={loading}>
                                {loading ? 'Generating...' : 'Generate Payroll'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default GeneratePayrollModal;
