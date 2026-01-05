import React, { useEffect, useState } from 'react';
import { workforceApi } from '../../../shared/utils/workforceApi';

interface PayrollEntry {
    id: string;
    employee_name: string;
    regular_hours: string;
    overtime_hours: string;
    hourly_rate: string;
    regular_pay: string;
    overtime_pay: string;
    gross_pay: string;
}

interface PayrollRunDetail {
    id: string;
    period_type: string;
    period_start: string;
    period_end: string;
    status: string;
    total_hours: string;
    total_amount: string;
    entries: PayrollEntry[];
}

interface PayrollDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    payrollId: string | null;
    onStatusChange?: () => void;
}

export const PayrollDetailModal: React.FC<PayrollDetailModalProps> = ({
    isOpen,
    onClose,
    payrollId,
    onStatusChange
}) => {
    const [loading, setLoading] = useState(false);
    const [payroll, setPayroll] = useState<PayrollRunDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [markingPaid, setMarkingPaid] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (isOpen && payrollId) {
            loadPayrollDetails();
        }
    }, [isOpen, payrollId]);

    const loadPayrollDetails = async () => {
        if (!payrollId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await workforceApi.getPayrollRun(payrollId);
            setPayroll(data as unknown as PayrollRunDetail);
        } catch (err: unknown) {
            const errorMsg = (err as { message?: string })?.message || 'Failed to load payroll details';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async () => {
        if (!payrollId) return;
        setMarkingPaid(true);
        try {
            await workforceApi.markPayrollPaid(payrollId);
            await loadPayrollDetails();
            onStatusChange?.();
        } catch (err: unknown) {
            const errorMsg = (err as { message?: string })?.message || 'Failed to mark as paid';
            setError(errorMsg);
        } finally {
            setMarkingPaid(false);
        }
    };

    const handleExportCSV = async () => {
        if (!payrollId) return;
        setExporting(true);
        try {
            // Call export endpoint and trigger download
            const response = await fetch(`/api/workforce/payroll/${payrollId}/export/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payroll_${payroll?.period_start}_${payroll?.period_end}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: unknown) {
            const errorMsg = (err as { message?: string })?.message || 'Failed to export CSV';
            setError(errorMsg);
        } finally {
            setExporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Payroll Details</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-500">Loading...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-600">{error}</div>
                    ) : payroll ? (
                        <>
                            {/* Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-500">Period</div>
                                    <div className="text-lg font-semibold">{payroll.period_start} to {payroll.period_end}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-500">Type</div>
                                    <div className="text-lg font-semibold">{payroll.period_type}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-500">Total Hours</div>
                                    <div className="text-lg font-semibold">{payroll.total_hours}h</div>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="text-sm text-blue-600">Total Amount</div>
                                    <div className="text-2xl font-bold text-blue-600">${payroll.total_amount}</div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-4">
                                <span className="text-sm text-gray-500">Status:</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${payroll.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                    payroll.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {payroll.status}
                                </span>
                                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    {payroll.status !== 'PAID' && (
                                        <button
                                            onClick={handleMarkPaid}
                                            disabled={markingPaid}
                                            className="flex-1 sm:flex-none px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                                        >
                                            {markingPaid ? 'Processing...' : 'Mark as Paid'}
                                        </button>
                                    )}
                                    <button
                                        onClick={handleExportCSV}
                                        disabled={exporting}
                                        className="flex-1 sm:flex-none px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="sm:hidden">CSV</span>
                                        <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export CSV'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Employee Breakdown */}
                            <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Employee Breakdown</h3>

                            {/* Desktop Table */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Regular Hours</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">OT Hours</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Regular Pay</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">OT Pay</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Pay</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {payroll.entries?.map((entry) => {
                                            const hasOvertime = parseFloat(entry.overtime_hours) > 0;
                                            return (
                                                <tr key={entry.id} className={hasOvertime ? 'bg-orange-50' : ''}>
                                                    <td className="px-4 py-3 text-sm font-medium">
                                                        {entry.employee_name}
                                                        {hasOvertime && (
                                                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                                                                OT
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{entry.regular_hours}h</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {hasOvertime ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded font-medium">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                {entry.overtime_hours}h
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">0h</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">${entry.hourly_rate}/hr</td>
                                                    <td className="px-4 py-3 text-sm">${entry.regular_pay}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {hasOvertime ? (
                                                            <span className="text-orange-600 font-medium">+${entry.overtime_pay}</span>
                                                        ) : (
                                                            <span className="text-gray-400">$0.00</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-semibold text-green-600">${entry.gross_pay}</td>
                                                </tr>
                                            );
                                        })}
                                        {(!payroll.entries || payroll.entries.length === 0) && (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                                    No employee entries found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="sm:hidden space-y-3">
                                {payroll.entries?.map((entry) => {
                                    const hasOvertime = parseFloat(entry.overtime_hours) > 0;
                                    return (
                                        <div key={entry.id} className={`p-3 rounded-lg border ${hasOvertime ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-medium text-gray-900">{entry.employee_name}</div>
                                                {hasOvertime && (
                                                    <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded">OT</span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <div className="text-xs text-gray-500">Regular</div>
                                                    <div>{entry.regular_hours}h @ ${entry.hourly_rate}/hr</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500">Regular Pay</div>
                                                    <div>${entry.regular_pay}</div>
                                                </div>
                                                {hasOvertime && (
                                                    <>
                                                        <div>
                                                            <div className="text-xs text-gray-500">OT Hours</div>
                                                            <div className="text-orange-600">{entry.overtime_hours}h</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-gray-500">OT Pay</div>
                                                            <div className="text-orange-600">+${entry.overtime_pay}</div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
                                                <span className="text-xs text-gray-500">Gross Pay</span>
                                                <span className="text-lg font-bold text-green-600">${entry.gross_pay}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!payroll.entries || payroll.entries.length === 0) && (
                                    <div className="text-center py-8 text-gray-500">
                                        No employee entries found
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
