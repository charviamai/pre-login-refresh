/**
 * WorkforceSettingsTab - Settings configuration for workforce features
 * Includes overtime settings, timesheet mode, auto-approval, etc.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { Loading } from '../../../shared/components/Loading';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { workforceApi, WorkforceSettings } from '../../../shared/utils/workforceApi';

interface WorkforceSettingsTabProps {
    shopId: string;
    shopName: string;
}

export const WorkforceSettingsTab: React.FC<WorkforceSettingsTabProps> = ({ shopId, shopName }) => {
    const [settings, setSettings] = useState<WorkforceSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [overtimeEnabled, setOvertimeEnabled] = useState(false);
    const [overtimeThreshold, setOvertimeThreshold] = useState('40.00');
    const [overtimeMultiplier, setOvertimeMultiplier] = useState('1.50');
    const [timesheetMode, setTimesheetMode] = useState<'MANUAL' | 'CLOCK_IN_OUT'>('MANUAL');
    const [autoApprove, setAutoApprove] = useState(false);
    const [autoSubmit, setAutoSubmit] = useState(true);
    const [payrollCycle, setPayrollCycle] = useState<'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY'>('WEEKLY');

    // Load current settings
    useEffect(() => {
        loadSettings();
    }, [shopId]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await workforceApi.getSettings(shopId);
            setSettings(data);

            // Populate form
            setOvertimeEnabled(data.overtime_enabled ?? false);
            setOvertimeThreshold(data.overtime_threshold_hours ?? '40.00');
            setOvertimeMultiplier(data.overtime_rate_multiplier ?? '1.50');
            setTimesheetMode(data.timesheet_mode ?? 'MANUAL');
            setAutoApprove(data.auto_approve_timesheet ?? false);
            setAutoSubmit(data.auto_submit_timesheet ?? true);
            setPayrollCycle(data.payroll_cycle ?? 'WEEKLY');
        } catch (err) {

            // Use defaults if no settings exist
            setOvertimeEnabled(false);
            setOvertimeThreshold('40.00');
            setOvertimeMultiplier('1.50');
            setTimesheetMode('MANUAL');
            setAutoApprove(false);
            setAutoSubmit(true);
            setPayrollCycle('WEEKLY');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const payload = {
                shop: shopId,
                overtime_enabled: overtimeEnabled,
                overtime_threshold_hours: overtimeThreshold,
                overtime_rate_multiplier: overtimeMultiplier,
                timesheet_mode: timesheetMode,
                auto_approve_timesheet: autoApprove,
                auto_submit_timesheet: autoSubmit,
                payroll_cycle: payrollCycle,
            };

            if (settings?.id) {
                await workforceApi.updateSettings(settings.id, payload);
            } else {
                await workforceApi.createSettings(payload);
            }

            setSuccess('Settings saved successfully!');
            loadSettings();
        } catch (err: unknown) {

            setError((err as { message?: string })?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8">
                    <Loading />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

            {success && (
                <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-400">
                    {success}
                </div>
            )}

            {/* General Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        General Settings for {shopName}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Select
                                label="Timesheet Mode"
                                value={timesheetMode}
                                onChange={(e) => setTimesheetMode(e.target.value as 'MANUAL' | 'CLOCK_IN_OUT')}
                                options={[
                                    { value: 'MANUAL', label: 'Manual Entry' },
                                    { value: 'CLOCK_IN_OUT', label: 'Clock In/Out' }
                                ]}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Manual: Employees enter start/end times. Clock: Employees clock in/out.
                            </p>
                        </div>

                        <div>
                            <Select
                                label="Payroll Cycle"
                                value={payrollCycle}
                                onChange={(e) => setPayrollCycle(e.target.value as 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY')}
                                options={[
                                    { value: 'WEEKLY', label: 'Weekly' },
                                    { value: 'BI_WEEKLY', label: 'Bi-Weekly' },
                                    { value: 'MONTHLY', label: 'Monthly' }
                                ]}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                How often payroll is generated for this shop.
                            </p>
                        </div>

                        <div className="flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={autoApprove}
                                        onChange={(e) => setAutoApprove(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-11 h-6 rounded-full transition-colors ${autoApprove ? 'bg-primary-600' : 'bg-gray-300'}`}>
                                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoApprove ? 'translate-x-5' : ''}`} />
                                    </div>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">Auto-Approve Timesheets</span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Automatically approve submitted timesheets</p>
                                </div>
                            </label>
                        </div>

                        <div className="flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={autoSubmit}
                                        onChange={(e) => setAutoSubmit(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-11 h-6 rounded-full transition-colors ${autoSubmit ? 'bg-primary-600' : 'bg-gray-300'}`}>
                                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoSubmit ? 'translate-x-5' : ''}`} />
                                    </div>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">Auto-Submit Timesheets</span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Auto-submit at pay period end (vs employee manual submit)</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Overtime Settings */}
            <Card className={overtimeEnabled ? 'border-orange-300 dark:border-orange-700 bg-orange-50/30 dark:bg-orange-900/20' : ''}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Overtime Settings
                        </CardTitle>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <span className={`text-sm font-medium ${overtimeEnabled ? 'text-orange-700' : 'text-gray-500'}`}>
                                {overtimeEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={overtimeEnabled}
                                    onChange={(e) => setOvertimeEnabled(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-11 h-6 rounded-full transition-colors ${overtimeEnabled ? 'bg-orange-500' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${overtimeEnabled ? 'translate-x-5' : ''}`} />
                                </div>
                            </div>
                        </label>
                    </div>
                </CardHeader>
                <CardContent>
                    {overtimeEnabled ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Input
                                        type="number"
                                        label="Weekly Hours Threshold"
                                        value={overtimeThreshold}
                                        onChange={(e) => setOvertimeThreshold(e.target.value)}
                                        min="0"
                                        step="0.5"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Hours per week before overtime applies (e.g., 40)
                                    </p>
                                </div>
                                <div>
                                    <Input
                                        type="number"
                                        label="Overtime Rate Multiplier"
                                        value={overtimeMultiplier}
                                        onChange={(e) => setOvertimeMultiplier(e.target.value)}
                                        min="1"
                                        step="0.1"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Multiplier for overtime pay (e.g., 1.5 = time and a half)
                                    </p>
                                </div>
                            </div>

                            {/* Overtime Preview */}
                            <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                                <h4 className="font-medium text-orange-900 dark:text-orange-400 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    How Overtime Works
                                </h4>
                                <ul className="text-sm text-orange-800 dark:text-orange-400 space-y-1">
                                    <li>• First <strong>{overtimeThreshold} hours</strong> per week = Regular pay</li>
                                    <li>• Hours beyond {overtimeThreshold} = <strong>{overtimeMultiplier}x</strong> regular rate</li>
                                    <li>• Example: 45 hours @ $15/hr = (40 × $15) + (5 × $15 × {overtimeMultiplier}) = ${(40 * 15 + 5 * 15 * parseFloat(overtimeMultiplier || '1.5')).toFixed(2)}</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                            <p>Overtime calculation is disabled</p>
                            <p className="text-sm">Enable to calculate overtime pay for hours worked beyond the threshold</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6"
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </div>
    );
};

export default WorkforceSettingsTab;
