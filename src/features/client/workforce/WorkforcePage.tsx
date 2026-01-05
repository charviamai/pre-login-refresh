/**
 * WorkforcePage - Main workforce management page with tabs
 * Includes: Shift Schedule, Timesheet, Hours Report, Payroll
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Select } from '../../../shared/components/ui/Select';
import { Badge, Pagination } from '../../../shared/components/ui';
import { Loading } from '../../../shared/components/Loading';
import { PageContainer } from '../../../shared/components/layout/PageContainer';
import { workforceApi, ShiftSchedule, TimesheetEntry, HoursReportData, PayrollRun, WorkforceSettings } from '../../../shared/utils/workforceApi';
import { useTimezone } from '../../../shared/context/TimezoneContext';
import { useShop } from '../../../shared/context/ShopContext';
import { AddShiftModal } from './AddShiftModal';
import { AddTimesheetModal } from './AddTimesheetModal';
import { WeeklyTimesheetEntry } from './WeeklyTimesheetEntry';
import { GanttShiftSchedule } from './GanttShiftSchedule';
import { ShiftTemplatesTab } from './ShiftTemplates';
import { GeneratePayrollModal } from './GeneratePayrollModal';
import { PayrollDetailModal } from './PayrollDetailModal';
import { TimesheetApprovalQueue } from './TimesheetApprovalQueue';
import { ViewButton, EditButton, DeleteButton, ApproveButton, RevertButton } from '../../../shared/components/ActionIcons';

// Tab icons
const ScheduleIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const TimesheetIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const HoursIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const PayrollIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const TemplatesIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
);

type TabType = 'schedule' | 'timesheet' | 'hours' | 'payroll' | 'templates';

export const WorkforcePage: React.FC = () => {
    // URL-based tab navigation
    const { tab } = useParams<{ tab?: string }>();
    const navigate = useNavigate();
    const validTabs: TabType[] = ['schedule', 'timesheet', 'hours', 'payroll', 'templates'];
    const activeTab: TabType = validTabs.includes(tab as TabType) ? (tab as TabType) : 'schedule';

    // Use global shop context
    const { shops, selectedShopId: selectedShop, loading: shopsLoading } = useShop();

    const setActiveTab = (newTab: TabType) => {
        navigate(`/client/workforce/${newTab}`);
    };
    const [loading, setLoading] = useState(true);
    const [_error, _setError] = useState<string | null>(null);

    // Data states for each tab
    const [_schedules, setSchedules] = useState<ShiftSchedule[]>([]);
    const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
    const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
    const [workforceSettings, setWorkforceSettings] = useState<WorkforceSettings | null>(null);

    // Modal states
    const [showAddShiftModal, setShowAddShiftModal] = useState(false);
    const [showAddTimesheetModal, setShowAddTimesheetModal] = useState(false);
    const [showWeeklyTimesheet, setShowWeeklyTimesheet] = useState(false);
    const [showGeneratePayrollModal, setShowGeneratePayrollModal] = useState(false);
    const [editTimesheetData, setEditTimesheetData] = useState<{ employeeId: string; weekStart: string } | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // URL-based pagination for timesheets
    const [searchParams, setSearchParams] = useSearchParams();
    const PAGE_SIZE = 25;

    // Timesheet pagination
    const initialTimesheetPage = parseInt(searchParams.get('ts_page') || '1', 10);
    const [timesheetPage, setTimesheetPage] = useState(initialTimesheetPage);
    const [timesheetTotalPages, setTimesheetTotalPages] = useState(1);
    const [timesheetTotalCount, setTimesheetTotalCount] = useState(0);

    // Payroll pagination
    const initialPayrollPage = parseInt(searchParams.get('pr_page') || '1', 10);
    const [payrollPage, setPayrollPage] = useState(initialPayrollPage);
    const [payrollTotalPages, setPayrollTotalPages] = useState(1);
    const [payrollTotalCount, setPayrollTotalCount] = useState(0);

    // Local shop selection for Schedule tab (independent of global shop)
    const [scheduleShopId, setScheduleShopId] = useState<string>('');

    // Set loading to false when shops are loaded from context
    useEffect(() => {
        if (!shopsLoading && shops.length > 0) {
            setLoading(false);
        }
    }, [shopsLoading, shops]);

    // Load workforce settings when shop changes
    useEffect(() => {
        // Don't load settings if ALL shops selected
        if (!selectedShop || selectedShop === 'ALL') return;

        const loadSettings = async () => {
            try {
                const settings = await workforceApi.getSettings(selectedShop);
                setWorkforceSettings(settings);
            } catch (err) {

                setWorkforceSettings(null);
                console.log('Using default workforce settings (failed to load custom):', err);
            }
        };
        loadSettings();
    }, [selectedShop]);

    // Load tab data when shop or tab changes
    useEffect(() => {
        // For schedule tab, require a specific shop
        if (activeTab === 'schedule' && (!selectedShop || selectedShop === 'ALL')) return;

        const loadTabData = async () => {
            try {
                // Determine shop filter - undefined means all shops
                const shopFilter = selectedShop && selectedShop !== 'ALL' ? selectedShop : undefined;

                switch (activeTab) {
                    case 'schedule':
                        // Schedule requires specific shop (guard above ensures we have one)
                        const scheduleData = await workforceApi.getWeekSchedule(undefined, selectedShop);
                        setSchedules(scheduleData.schedules);
                        break;
                    case 'timesheet':
                        // Timesheet can work with all shops (shop_id is optional)
                        const timesheetData = await workforceApi.getTimesheetEntries({
                            shop_id: shopFilter,
                            page: timesheetPage
                        });
                        // Handle both array and paginated response formats
                        const tsResponse = timesheetData as any;
                        if (tsResponse?.results) {
                            setTimesheets(tsResponse.results);
                            setTimesheetTotalCount(tsResponse.count || 0);
                            setTimesheetTotalPages(Math.ceil((tsResponse.count || 0) / PAGE_SIZE));
                        } else {
                            const entries = Array.isArray(timesheetData) ? timesheetData : [];
                            setTimesheets(entries);
                            setTimesheetTotalCount(entries.length);
                            setTimesheetTotalPages(1);
                        }
                        break;
                    case 'payroll':
                        // Payroll works with all shops (no shop filter needed)
                        const payrollData = await workforceApi.getPayrollRuns({ page: payrollPage });
                        // Handle both array and paginated response formats
                        const prResponse = payrollData as any;
                        if (prResponse?.results) {
                            setPayrollRuns(prResponse.results);
                            setPayrollTotalCount(prResponse.count || 0);
                            setPayrollTotalPages(Math.ceil((prResponse.count || 0) / PAGE_SIZE));
                        } else {
                            const runs = Array.isArray(payrollData) ? payrollData : [];
                            setPayrollRuns(runs);
                            setPayrollTotalCount(runs.length);
                            setPayrollTotalPages(1);
                        }
                        break;
                }
            } catch (err: unknown) {
                // error handling removed
            }
        };
        loadTabData();
    }, [activeTab, selectedShop, refreshTrigger, timesheetPage, payrollPage]);

    // Refresh data
    const refreshData = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    // Pagination handlers
    const handleTimesheetPageChange = (page: number) => {
        setTimesheetPage(page);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (page === 1) {
                newParams.delete('ts_page');
            } else {
                newParams.set('ts_page', String(page));
            }
            return newParams;
        });
    };

    const handlePayrollPageChange = (page: number) => {
        setPayrollPage(page);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (page === 1) {
                newParams.delete('pr_page');
            } else {
                newParams.set('pr_page', String(page));
            }
            return newParams;
        });
    };

    // Create shift handler
    const handleCreateShift = async (shiftData: Partial<ShiftSchedule>) => {
        await workforceApi.createSchedule(shiftData);
        refreshData();
    };

    // Create timesheet entry handler
    const handleCreateTimesheet = async (entryData: Partial<TimesheetEntry>) => {
        await workforceApi.createTimesheetEntry(entryData);
        refreshData();
    };

    // Approve timesheet entry
    const handleApproveTimesheet = async (id: string) => {
        try {

            await workforceApi.approveTimesheetEntry(id);

            refreshData();
        } catch (err: unknown) {
            console.error('Failed to approve timesheet:', err);
        }
    };

    // Reject timesheet entry
    const handleRejectTimesheet = async (id: string) => {
        try {

            await workforceApi.rejectTimesheetEntry(id);

            refreshData();
        } catch (err: unknown) {
            console.error('Failed to reject timesheet:', err);
        }
    };

    const tabs = [
        { id: 'schedule' as TabType, name: 'Shift Schedule', icon: ScheduleIcon },
        { id: 'timesheet' as TabType, name: 'Timesheet', icon: TimesheetIcon },
        { id: 'hours' as TabType, name: 'Hours Report', icon: HoursIcon },
        { id: 'payroll' as TabType, name: 'Payroll', icon: PayrollIcon },
        { id: 'templates' as TabType, name: 'Shift Templates', icon: TemplatesIcon },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loading />
            </div>
        );
    }

    return (
        <PageContainer>
            {/* ShopRequiredModal removed - using inline shop selection in Schedule tab */}

            <div className="mt-6">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Workforce</h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage shifts, timesheets, and payroll</p>
                </div>

                {/* Mobile Tab Selector - visible on mobile, hidden on desktop */}
                <div className="mb-4 md:hidden">
                    <Select
                        label="Select Tab"
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value as TabType)}
                        options={tabs.map(tab => ({ value: tab.id, label: tab.name }))}
                    />
                </div>

                {/* Desktop Tabs - hidden on mobile, visible on desktop */}
                <div className="border-b border-gray-200 dark:border-slate-700 mb-6 hidden md:block">
                    <nav className="flex space-x-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-4 py-2 border-b-2 text-base font-semibold transition-colors ${activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-500'
                                    }`}
                            >
                                <tab.icon />
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Error Banner - Commented out as errors are shown in individual tabs */}
                {/* {error && <ErrorBanner message={error} onClose={() => setError(null)} />} */}

                {/* Tab Content */}
                <div>
                    {activeTab === 'schedule' && scheduleShopId && (
                        <>
                            {/* Shop Selection Bar */}
                            <div className="mb-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Managing schedule for:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {shops.find(s => s.id === scheduleShopId)?.name || 'Shop'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={scheduleShopId}
                                        onChange={(e) => setScheduleShopId(e.target.value)}
                                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                    >
                                        {shops.map(shop => (
                                            <option key={shop.id} value={shop.id}>{shop.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <GanttShiftSchedule
                                shopId={scheduleShopId}
                                shopName={shops.find(s => s.id === scheduleShopId)?.name || 'Shop'}
                                onRefresh={refreshData}
                            />
                        </>
                    )}
                    {activeTab === 'schedule' && !scheduleShopId && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Shift Schedule</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-6">
                                    <div className="mb-4">
                                        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">First, select a shop to manage the shift schedule</p>
                                    <div className="max-w-xs mx-auto">
                                        <Select
                                            label="Select Shop"
                                            value={scheduleShopId}
                                            onChange={(e) => setScheduleShopId(e.target.value)}
                                            options={[
                                                { value: '', label: 'Choose a shop...' },
                                                ...shops.map(shop => ({ value: shop.id, label: shop.name }))
                                            ]}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {activeTab === 'timesheet' && (
                        <div className="space-y-4">
                            {/* Approval Queue - collapsible on mobile */}
                            <div className="block">
                                <TimesheetApprovalQueue shopId={selectedShop} onRefresh={refreshData} refreshTrigger={refreshTrigger} />
                            </div>
                            <TimesheetTab
                                entries={timesheets}
                                onRefresh={refreshData}
                                onAddEntry={() => {
                                    setEditTimesheetData(null);
                                    setShowWeeklyTimesheet(true);
                                }}
                                onApprove={handleApproveTimesheet}
                                onReject={handleRejectTimesheet}
                                onEdit={(employeeId, weekStart) => {
                                    setEditTimesheetData({ employeeId, weekStart });
                                    setShowWeeklyTimesheet(true);
                                }}
                                overtimeSettings={{
                                    enabled: workforceSettings?.overtime_enabled ?? false,
                                    threshold: parseFloat(String(workforceSettings?.overtime_threshold_hours ?? '40'))
                                }}
                                timesheetMode={workforceSettings?.timesheet_mode ?? 'MANUAL'}
                            />
                            <Pagination
                                currentPage={timesheetPage}
                                totalPages={timesheetTotalPages}
                                totalCount={timesheetTotalCount}
                                pageSize={PAGE_SIZE}
                                onPageChange={handleTimesheetPageChange}
                                loading={loading}
                            />
                        </div>
                    )}
                    {activeTab === 'hours' && (
                        <HoursTab
                            shopId={selectedShop}
                            overtimeSettings={{
                                enabled: workforceSettings?.overtime_enabled ?? false,
                                threshold: parseFloat(String(workforceSettings?.overtime_threshold_hours ?? '40'))
                            }}
                        />
                    )}
                    {activeTab === 'payroll' && (
                        <>
                            <PayrollTab runs={payrollRuns} onRefresh={refreshData} />
                            <Pagination
                                currentPage={payrollPage}
                                totalPages={payrollTotalPages}
                                totalCount={payrollTotalCount}
                                pageSize={PAGE_SIZE}
                                onPageChange={handlePayrollPageChange}
                                loading={loading}
                            />
                        </>
                    )}
                    {activeTab === 'templates' && (
                        <ShiftTemplatesTab />
                    )}
                </div>

                {/* Modals */}
                <AddShiftModal
                    isOpen={showAddShiftModal}
                    onClose={() => setShowAddShiftModal(false)}
                    onSave={handleCreateShift}
                    shopId={selectedShop}
                />
                <AddTimesheetModal
                    isOpen={showAddTimesheetModal}
                    onClose={() => setShowAddTimesheetModal(false)}
                    onSave={handleCreateTimesheet}
                    shopId={selectedShop}
                />
                {showWeeklyTimesheet && selectedShop && (
                    <WeeklyTimesheetEntry
                        shopId={selectedShop}
                        shopName={shops.find(s => s.id === selectedShop)?.name || 'Shop'}
                        onClose={() => {
                            setShowWeeklyTimesheet(false);
                            setEditTimesheetData(null);
                        }}
                        onSuccess={refreshData}
                        preselectedEmployeeId={editTimesheetData?.employeeId}
                        preselectedWeekStart={editTimesheetData?.weekStart}
                    />
                )}
                <GeneratePayrollModal
                    isOpen={showGeneratePayrollModal}
                    onClose={() => setShowGeneratePayrollModal(false)}
                    onSuccess={() => {
                        setShowGeneratePayrollModal(false);
                        refreshData();
                    }}
                    shopId={selectedShop && selectedShop !== 'ALL' ? selectedShop : undefined}
                />
            </div>
        </PageContainer>
    );
};

// ============================================================================
// Tab Components
// ============================================================================

// Note: ScheduleTab was replaced by GanttShiftSchedule component

interface TimesheetTabProps {
    entries: TimesheetEntry[];
    onRefresh: () => void;
    onAddEntry: () => void;
    onApprove: (id: string) => Promise<void>;
    onReject: (id: string) => Promise<void>;
    onEdit?: (employeeId: string, weekStart: string) => void;
    overtimeSettings?: {
        enabled: boolean;
        threshold: number;
    };
    timesheetMode?: 'MANUAL' | 'CLOCK_IN_OUT';
}

// Helper to get week start (Monday) from a date
const getWeekStart = (dateStr: string): string => {
    // Parse date parts to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    const dayOfWeek = date.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday goes back 6, others go to Monday
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
};

// Helper to get week end (Sunday) from week start
const getWeekEnd = (weekStart: string): string => {
    // Parse date parts to avoid timezone issues
    const [year, month, day] = weekStart.split('-').map(Number);
    const monday = new Date(year, month - 1, day);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
};

interface WeeklyGroup {
    key: string;
    employeeId: string;
    employeeName: string;
    weekStart: string;
    weekEnd: string;
    totalHours: number;
    entryIds: string[];
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MIXED';
    wasEdited: boolean; // Track if any entry has [EDITED] in notes
    entries: TimesheetEntry[];
}

const TimesheetTab: React.FC<TimesheetTabProps> = ({ entries, onAddEntry, onApprove, onReject, onEdit, overtimeSettings, timesheetMode }) => {
    // Extract overtime settings with defaults
    const overtimeEnabled = overtimeSettings?.enabled ?? false;
    const overtimeThreshold = overtimeSettings?.threshold ?? 40;
    const isClockMode = timesheetMode === 'CLOCK_IN_OUT';

    // Use timezone context for date handling
    const { getToday, formatDate, isToday: isTodayCheck, parseLocalDate } = useTimezone();

    // Helper to get local date in YYYY-MM-DD format
    const getLocalDateString = (date: Date = new Date()): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // State for clock mode date navigation - use timezone-aware today
    const [selectedDate, setSelectedDate] = React.useState<string>(getToday());

    // Group entries by employee + week
    const weeklyGroups = React.useMemo(() => {
        const groups: Record<string, WeeklyGroup> = {};

        entries.forEach(entry => {
            const weekStart = getWeekStart(entry.date);
            const key = `${entry.employee}-${weekStart}`;

            if (!groups[key]) {
                groups[key] = {
                    key,
                    employeeId: entry.employee,
                    employeeName: entry.employee_name,
                    weekStart,
                    weekEnd: getWeekEnd(weekStart),
                    totalHours: 0,
                    entryIds: [],
                    status: 'PENDING',
                    wasEdited: false,
                    entries: []
                };
            }

            groups[key].entries.push(entry);
            groups[key].entryIds.push(entry.id);
            groups[key].totalHours += parseFloat(entry.hours_worked) || 0;
            // Check if this entry was edited (notes contain [EDITED])
            if (entry.notes && entry.notes.includes('[EDITED]')) {
                groups[key].wasEdited = true;
            }
        });

        // Determine group status
        Object.values(groups).forEach(group => {
            const statuses = new Set(group.entries.map(e => e.status));
            if (statuses.size === 1) {
                group.status = group.entries[0].status as 'PENDING' | 'APPROVED' | 'REJECTED';
            } else {
                group.status = 'MIXED';
            }
        });

        // Sort by week (newest first), then by employee name
        return Object.values(groups).sort((a, b) => {
            const weekDiff = b.weekStart.localeCompare(a.weekStart);
            if (weekDiff !== 0) return weekDiff;
            return a.employeeName.localeCompare(b.employeeName);
        });
    }, [entries]);

    // Date navigation helpers for clock mode
    const goToPreviousDay = () => {
        const date = parseLocalDate(selectedDate);
        date.setDate(date.getDate() - 1);
        setSelectedDate(getLocalDateString(date));
    };

    const goToNextDay = () => {
        const date = parseLocalDate(selectedDate);
        date.setDate(date.getDate() + 1);
        setSelectedDate(getLocalDateString(date));
    };

    const goToToday = () => {
        setSelectedDate(getToday());
    };

    const isToday = isTodayCheck(selectedDate);
    const isFuture = (() => {
        const selected = parseLocalDate(selectedDate);
        const today = parseLocalDate(getToday());
        return selected > today;
    })();

    // Format date for display - use timezone-aware formatting
    const formatDisplayDate = (dateStr: string) => {
        return formatDate(dateStr);
    };

    // For clock mode, show a different view
    if (isClockMode) {
        // Filter entries by selected date
        const dateEntries = entries.filter(e => e.date === selectedDate);

        return (
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Clock In/Out Mode
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4 mb-4">
                        <p className="text-sm sm:text-base text-blue-700 dark:text-blue-400">
                            <strong>Clock Mode Enabled:</strong> Employees clock in/out via their Employee Portal.
                            <span className="hidden sm:inline"> Time entries are automatically created when they clock in and completed when they clock out.</span>
                        </p>
                    </div>

                    {/* Date Navigation - Mobile Responsive */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={goToPreviousDay}
                        >
                            <span className="sm:hidden">← Prev</span>
                            <span className="hidden sm:inline">← Previous Day</span>
                        </Button>

                        <div className="flex items-center justify-center gap-2 order-first sm:order-none">
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base">{formatDisplayDate(selectedDate)}</span>
                            {isToday && (
                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Today</span>
                            )}
                        </div>

                        <div className="flex gap-2 justify-end">
                            {!isToday && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={goToToday}
                                >
                                    Today
                                </Button>
                            )}
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={goToNextDay}
                                disabled={isFuture}
                            >
                                <span className="sm:hidden">Next →</span>
                                <span className="hidden sm:inline">Next Day →</span>
                            </Button>
                        </div>
                    </div>

                    {dateEntries.length > 0 ? (
                        <div className="space-y-2">
                            <h3 className="font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">Clock Activity ({dateEntries.length} {dateEntries.length === 1 ? 'entry' : 'entries'})</h3>

                            {/* Desktop Table */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                    <thead className="bg-gray-50 dark:bg-slate-800">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employee</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Clock In</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Clock Out</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Hours</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                        {dateEntries.map((entry) => (
                                            <tr key={entry.id}>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{entry.employee_name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{entry.clock_in ? new Date(entry.clock_in).toLocaleTimeString() : entry.start_time || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{entry.clock_out ? new Date(entry.clock_out).toLocaleTimeString() : (entry.end_time || <span className="text-green-600 font-medium">Active</span>)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{parseFloat(entry.hours_worked).toFixed(2)}h</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${entry.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                        entry.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {entry.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="sm:hidden space-y-3">
                                {dateEntries.map((entry) => (
                                    <div key={entry.id} className="p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium text-gray-900 dark:text-gray-100">{entry.employee_name}</div>
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${entry.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                entry.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {entry.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">In</div>
                                                <div className="text-gray-900 dark:text-gray-100">{entry.clock_in ? new Date(entry.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : entry.start_time || '-'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Out</div>
                                                <div className="text-gray-900 dark:text-gray-100">{entry.clock_out ? new Date(entry.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (entry.end_time || <span className="text-green-600 font-medium">Active</span>)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Hours</div>
                                                <div className="font-semibold text-gray-900 dark:text-gray-100">{parseFloat(entry.hours_worked).toFixed(2)}h</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <TimesheetIcon />
                            <p className="mt-2 text-sm sm:text-base">No clock activity on {formatDisplayDate(selectedDate)}</p>
                            <p className="text-xs sm:text-sm">Use the navigation above to browse other dates</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }
    // Group entries by employee + week


    // Approve all entries in a week (only pending/rejected ones)
    const handleApproveWeek = async (group: WeeklyGroup) => {
        // Only approve entries that aren't already approved
        const entriesToApprove = group.entries.filter(e => e.status !== 'APPROVED');
        for (const entry of entriesToApprove) {
            await onApprove(entry.id);
        }
    };

    // Reject all entries in a week (only pending/approved ones)
    const handleRejectWeek = async (group: WeeklyGroup) => {
        // Only reject entries that aren't already rejected
        const entriesToReject = group.entries.filter(e => e.status !== 'REJECTED');
        for (const entry of entriesToReject) {
            await onReject(entry.id);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <CardTitle className="text-base sm:text-lg">Weekly Timesheets</CardTitle>
                    <Button variant="primary" size="sm" onClick={onAddEntry}>
                        + Add Entry
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {weeklyGroups.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <TimesheetIcon />
                        <p className="mt-2 text-sm sm:text-base">No timesheet entries found</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                <thead className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Employee</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Week</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Days</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Total Hours</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                    {weeklyGroups.map((group) => (
                                        <tr key={group.key}>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{group.employeeName}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                {group.weekStart} to {group.weekEnd}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{group.entries.length} days</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {group.status === 'REJECTED' ? (
                                                    <span>
                                                        <span className="text-gray-400 line-through">{group.totalHours.toFixed(2)}h</span>
                                                        <span className="text-red-600 ml-1">0h</span>
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        <span>{group.totalHours.toFixed(2)}h</span>
                                                        {overtimeEnabled && group.totalHours > overtimeThreshold && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded border border-orange-200">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                OT +{(group.totalHours - overtimeThreshold).toFixed(1)}h
                                                            </span>
                                                        )}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 text-xs rounded-full ${group.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                    group.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                        group.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                            'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {group.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex space-x-1">
                                                    {onEdit && (
                                                        <ViewButton
                                                            onClick={() => onEdit(group.employeeId, group.weekStart)}
                                                            tooltip="View Timesheet"
                                                        />
                                                    )}
                                                    {onEdit && (
                                                        <EditButton
                                                            onClick={() => onEdit(group.employeeId, group.weekStart)}
                                                            tooltip="Edit Timesheet"
                                                        />
                                                    )}
                                                    {(group.status === 'PENDING' || group.status === 'MIXED') && (
                                                        <>
                                                            <ApproveButton
                                                                onClick={() => handleApproveWeek(group)}
                                                                tooltip="Approve Timesheet"
                                                            />
                                                            <DeleteButton
                                                                onClick={() => handleRejectWeek(group)}
                                                                tooltip="Reject Timesheet"
                                                            />
                                                        </>
                                                    )}
                                                    {group.status === 'REJECTED' && onEdit && (
                                                        <RevertButton
                                                            onClick={() => onEdit(group.employeeId, group.weekStart)}
                                                            tooltip="Resubmit Timesheet"
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="sm:hidden space-y-3">
                            {weeklyGroups.map((group) => (
                                <div key={group.key} className="p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-medium text-gray-900 dark:text-gray-100">{group.employeeName}</div>
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${group.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                            group.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                group.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>
                                            {group.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        {group.weekStart} to {group.weekEnd} • {group.entries.length} days
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                                            {group.status === 'REJECTED' ? (
                                                <span>
                                                    <span className="text-gray-400 line-through">{group.totalHours.toFixed(2)}h</span>
                                                    <span className="text-red-600 ml-1">0h</span>
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <span>{group.totalHours.toFixed(2)}h</span>
                                                    {overtimeEnabled && group.totalHours > overtimeThreshold && (
                                                        <span className="text-xs text-orange-600">+OT</span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex space-x-1">
                                            {onEdit && (
                                                <ViewButton
                                                    onClick={() => onEdit(group.employeeId, group.weekStart)}
                                                    tooltip="View"
                                                />
                                            )}
                                            {(group.status === 'PENDING' || group.status === 'MIXED') && (
                                                <>
                                                    <ApproveButton
                                                        onClick={() => handleApproveWeek(group)}
                                                        tooltip="Approve"
                                                    />
                                                    <DeleteButton
                                                        onClick={() => handleRejectWeek(group)}
                                                        tooltip="Reject"
                                                    />
                                                </>
                                            )}
                                            {group.status === 'REJECTED' && onEdit && (
                                                <RevertButton
                                                    onClick={() => onEdit(group.employeeId, group.weekStart)}
                                                    tooltip="Resubmit"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};


interface HoursTabProps {
    shopId: string;
    overtimeSettings?: {
        enabled: boolean;
        threshold: number;
    };
}

// Helper to get Monday of the week (for Hours tab)
const getHoursWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Helper to format date as YYYY-MM-DD
const formatDateYMD = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const HoursTab: React.FC<HoursTabProps> = ({ shopId, overtimeSettings }) => {
    const [report, setReport] = useState<HoursReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Week navigation state
    const [weekStart, setWeekStart] = useState<Date>(() => getHoursWeekStart(new Date()));
    const [viewMode, setViewMode] = useState<'week' | 'custom'>('week');

    // Custom date range
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    // Derive dates
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const dateFrom = viewMode === 'week' ? formatDateYMD(weekStart) : customFrom;
    const dateTo = viewMode === 'week' ? formatDateYMD(weekEnd) : customTo;

    // OT settings
    const overtimeEnabled = overtimeSettings?.enabled ?? false;
    const overtimeThreshold = overtimeSettings?.threshold ?? 40;

    const isOvertime = (hours: string) => overtimeEnabled && parseFloat(hours) > overtimeThreshold;

    // Load report data
    const loadReport = useCallback(async () => {
        if (!dateFrom || !dateTo) return;

        setLoading(true);
        setError(null);
        try {
            // Convert 'ALL' to undefined so API doesn't receive invalid shop_id
            const shopIdParam = shopId && shopId !== 'ALL' ? shopId : undefined;
            const data = await workforceApi.getHoursReport({
                group_by: 'employee',
                shop_id: shopIdParam,
                date_from: dateFrom,
                date_to: dateTo
            });
            setReport(data);
        } catch (err: unknown) {
            setError((err as { message?: string })?.message || 'Failed to load hours report');
        } finally {
            setLoading(false);
        }
    }, [shopId, dateFrom, dateTo]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    // Navigation handlers
    const goToPreviousWeek = () => {
        const newStart = new Date(weekStart);
        newStart.setDate(newStart.getDate() - 7);
        setWeekStart(newStart);
        setViewMode('week');
    };

    const goToNextWeek = () => {
        const newStart = new Date(weekStart);
        newStart.setDate(newStart.getDate() + 7);
        setWeekStart(newStart);
        setViewMode('week');
    };

    const goToCurrentWeek = () => {
        setWeekStart(getHoursWeekStart(new Date()));
        setViewMode('week');
    };

    const isCurrentWeek = formatDateYMD(getHoursWeekStart(new Date())) === formatDateYMD(weekStart);

    // Format date range for display
    const formatWeekRange = () => {
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        return `${weekStart.toLocaleDateString('en-US', options)} - ${weekEnd.toLocaleDateString('en-US', options)}, ${weekEnd.getFullYear()}`;
    };

    return (
        <Card className="overflow-visible">
            <CardHeader className="space-y-3">
                {/* Row 1: Title + View Mode Toggle */}
                <div className="flex items-center justify-between gap-3">
                    {/* Title - Left side */}
                    <CardTitle className="text-lg sm:text-xl">Hours Report</CardTitle>

                    {/* Mobile: Compact toggle buttons for view mode */}
                    <div className="sm:hidden flex items-center gap-1">
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-2.5 py-1 text-xs font-medium rounded-l-md border ${viewMode === 'week'
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600'
                                }`}
                        >
                            Weekly
                        </button>
                        <button
                            onClick={() => setViewMode('custom')}
                            className={`px-2.5 py-1 text-xs font-medium rounded-r-md border-t border-b border-r ${viewMode === 'custom'
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600'
                                }`}
                        >
                            Custom
                        </button>
                    </div>

                    {/* Desktop: Buttons for view mode + navigation */}
                    <div className="hidden sm:flex items-center gap-2">
                        <Button
                            variant={viewMode === 'week' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setViewMode('week')}
                        >
                            Weekly
                        </Button>
                        <Button
                            variant={viewMode === 'custom' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setViewMode('custom')}
                        >
                            Custom
                        </Button>
                        {viewMode === 'week' && (
                            <>
                                <Button variant="secondary" size="sm" onClick={goToPreviousWeek}>
                                    ← Prev
                                </Button>
                                {!isCurrentWeek && (
                                    <Button variant="secondary" size="sm" onClick={goToCurrentWeek}>
                                        Today
                                    </Button>
                                )}
                                <Button variant="secondary" size="sm" onClick={goToNextWeek}>
                                    Next →
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Row 2: OT Legend (if enabled) */}
                {overtimeEnabled && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-block w-3 h-3 bg-orange-500 rounded-full"></span>
                        <span>Overtime (&gt;{overtimeThreshold}h/week)</span>
                    </div>
                )}

                {/* Row 3: Week Range + Mobile Navigation (only in week mode) */}
                {viewMode === 'week' && (
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                            {formatWeekRange()}
                        </div>
                        {/* Mobile: Navigation buttons on separate row */}
                        <div className="sm:hidden flex items-center gap-2">
                            <Button variant="secondary" size="sm" onClick={goToPreviousWeek}>
                                ← Prev
                            </Button>
                            {!isCurrentWeek && (
                                <Button variant="secondary" size="sm" onClick={goToCurrentWeek}>
                                    Today
                                </Button>
                            )}
                            <Button variant="secondary" size="sm" onClick={goToNextWeek}>
                                Next →
                            </Button>
                        </div>
                    </div>
                )}

                {/* Custom Date Range - shown in custom mode */}
                {viewMode === 'custom' && (
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="flex-1 min-w-[100px]">
                            <label className="block text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From</label>
                            <input
                                type="date"
                                value={customFrom}
                                onChange={(e) => setCustomFrom(e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="flex-1 min-w-[100px]">
                            <label className="block text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">To</label>
                            <input
                                type="date"
                                value={customTo}
                                onChange={(e) => setCustomTo(e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={loadReport}
                            disabled={!customFrom || !customTo}
                            className="whitespace-nowrap"
                        >
                            Apply
                        </Button>
                    </div>
                )}
            </CardHeader>

            <CardContent>
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-800 text-sm rounded-md flex justify-between items-center">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">✕</button>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : !report || report.data.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <HoursIcon />
                        <p className="mt-2">No hours data for this period</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {viewMode === 'week' ? formatWeekRange() : `${customFrom || '?'} to ${customTo || '?'}`}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
                            <table className="min-w-full">
                                <thead className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Employee</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Total Hours</th>
                                        {overtimeEnabled && (
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700">
                                    {report.data.map((row, idx) => {
                                        const overtime = isOvertime(row.total_hours);
                                        return (
                                            <tr key={idx} className={`${overtime ? 'bg-orange-50 dark:bg-orange-900/20' : ''} ${idx % 2 === 1 ? 'bg-gray-50/50 dark:bg-slate-700/50' : ''}`}>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {row.employee_name || row.shop_name || row.date}
                                                </td>
                                                <td className={`px-4 py-3 text-sm font-semibold ${overtime ? 'text-orange-700 dark:text-orange-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                                    {row.total_hours}h
                                                </td>
                                                {overtimeEnabled && (
                                                    <td className="px-4 py-3 text-sm">
                                                        {overtime ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-medium">
                                                                ⏰ Overtime
                                                            </span>
                                                        ) : (
                                                            <span className="text-green-600 text-xs">✓ Normal</span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Table */}
                        <div className="sm:hidden border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                            {/* Table Header */}
                            <div className="flex bg-slate-700 text-white">
                                <div className="flex-1 px-4 py-3 text-sm font-semibold">Employee</div>
                                <div className="w-20 px-3 py-3 text-sm font-semibold text-center">Hours</div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-gray-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                                {report.data.map((row, idx) => {
                                    const overtime = isOvertime(row.total_hours);
                                    return (
                                        <div key={idx} className={`flex items-center ${overtime ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                                            <div className="flex-1 px-4 py-3">
                                                <span className="text-sm font-medium text-slate-800 dark:text-gray-200">
                                                    {row.employee_name || row.shop_name || row.date}
                                                </span>
                                                {overtimeEnabled && overtime && (
                                                    <span className="ml-2 text-xs text-orange-600">OT</span>
                                                )}
                                            </div>
                                            <div className="w-20 px-3 py-3 text-center">
                                                <span className={`text-sm font-bold ${overtime ? 'text-orange-700 dark:text-orange-400' : 'text-slate-800 dark:text-gray-200'}`}>
                                                    {row.total_hours}h
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Table Footer - Total */}
                            <div className="flex bg-slate-700 text-white">
                                <div className="flex-1 px-4 py-3 text-sm font-semibold">Total: {report.data.length} Employees</div>
                                <div className="w-20 px-3 py-3 text-center text-lg font-bold">{report.data.reduce((sum, row) => sum + parseFloat(row.total_hours), 0).toFixed(0)}h</div>
                            </div>
                        </div>

                        {/* Summary - Desktop only */}
                        <div className="hidden sm:block mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                            <div className="flex justify-between gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <span>Total: {report.data.length} Employees</span>
                                <span>{report.data.reduce((sum, row) => sum + parseFloat(row.total_hours), 0).toFixed(1)}h</span>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

interface PayrollTabProps {
    runs: PayrollRun[];
    onRefresh: () => void;
}

const PayrollTab: React.FC<PayrollTabProps> = ({ runs, onRefresh }) => {
    const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);
    const [markingPaid, setMarkingPaid] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);



    const handleMarkPaid = async (id: string) => {
        setMarkingPaid(id);
        try {
            await workforceApi.markPayrollPaid(id);
            onRefresh();
        } catch (err) {

            setError('Failed to mark payroll as paid');
        } finally {
            setMarkingPaid(null);
        }
    };



    // Filter for pending payrolls (DRAFT or APPROVED status - not yet paid)
    const pendingPayrolls = runs.filter(r => r.status === 'DRAFT' || r.status === 'APPROVED');
    const pendingTotal = pendingPayrolls.reduce((sum, r) => sum + parseFloat(r.total_amount || '0'), 0);

    // Filter for paid payrolls
    const paidPayrolls = runs.filter(r => r.status === 'PAID');
    const paidTotal = paidPayrolls.reduce((sum, r) => sum + parseFloat(r.total_amount || '0'), 0);

    const [approving, setApproving] = useState<string | null>(null);

    // Pending generation - grouped by employee + shop + week
    const [pendingGeneration, setPendingGeneration] = useState<Array<{
        id: string;  // Unique group ID: employee_shop_weekstart
        timesheet_ids: string[];
        employee_id: string;
        employee_name: string;
        shop_id: string | null;
        shop_name: string | null;
        week_start: string;
        week_end: string;
        total_hours: number;
        entry_count: number;
    }>>([]);
    const [loadingPendingGen, setLoadingPendingGen] = useState(false);

    // Fetch pending generation data
    useEffect(() => {
        const fetchPendingGeneration = async () => {
            setLoadingPendingGen(true);
            try {
                const response = await workforceApi.getPendingGeneration();
                setPendingGeneration(response.results || []);
            } catch (err) {
                console.log('Failed to fetch pending payroll generation:', err);
            } finally {
                setLoadingPendingGen(false);
            }
        };
        fetchPendingGeneration();
    }, [runs]); // Refetch when runs change

    const handleApprove = async (id: string) => {
        setApproving(id);
        try {
            await workforceApi.approvePayroll(id);
            onRefresh();
        } catch (err) {

            setError('Failed to approve payroll');
        } finally {
            setApproving(null);
        }
    };

    // Selection state for bulk generation - using group IDs
    const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
    const [generatingBulk, setGeneratingBulk] = useState(false);

    const toggleGroupSelection = (id: string) => {
        const newSet = new Set(selectedGroups);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedGroups(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedGroups.size === pendingGeneration.length) {
            setSelectedGroups(new Set());
        } else {
            setSelectedGroups(new Set(pendingGeneration.map(g => g.id)));
        }
    };

    const handleBulkGenerate = async () => {
        if (selectedGroups.size === 0) return;

        setGeneratingBulk(true);
        try {
            // Get selected groups
            const selectedList = pendingGeneration.filter(g => selectedGroups.has(g.id));

            // Generate payroll for each group (already grouped by employee+shop+week)
            for (const group of selectedList) {
                await workforceApi.generatePayroll({
                    period_type: 'WEEKLY',
                    period_start: group.week_start,
                    period_end: group.week_end,
                    shop_id: group.shop_id || undefined,
                    employee_id: group.employee_id  // Generate only for this specific employee
                });
            }

            setSelectedGroups(new Set());
            onRefresh();
        } catch (err) {

            setError('Failed to generate payroll for some periods');
        } finally {
            setGeneratingBulk(false);
        }
    };

    return (
        <>
            {/* Pending Generation Section - Grouped by Employee + Shop + Week */}
            {pendingGeneration.length > 0 && (
                <Card className="mb-4 border-blue-200 dark:border-blue-800">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <div className="flex items-center gap-3">
                                {/* Select All Checkbox */}
                                <input
                                    type="checkbox"
                                    checked={selectedGroups.size === pendingGeneration.length && pendingGeneration.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Ready for Payroll Generation
                                    <Badge variant="info">{pendingGeneration.length}</Badge>
                                </CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedGroups.size > 0 && (
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {selectedGroups.size} selected
                                    </span>
                                )}
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleBulkGenerate}
                                    disabled={selectedGroups.size === 0 || generatingBulk}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {generatingBulk ? 'Generating...' : `Generate Payroll${selectedGroups.size > 0 ? ` (${selectedGroups.size})` : ''}`}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loadingPendingGen ? (
                            <div className="text-center py-4 text-gray-500">Loading...</div>
                        ) : (
                            <div className="space-y-2">
                                {pendingGeneration.map((group) => (
                                    <div
                                        key={group.id}
                                        className={`flex flex-col sm:flex-row sm:items-center p-3 border rounded-lg gap-3 cursor-pointer transition-colors ${selectedGroups.has(group.id)
                                            ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600'
                                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                                            }`}
                                        onClick={() => toggleGroupSelection(group.id)}
                                    >
                                        {/* Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={selectedGroups.has(group.id)}
                                            onChange={() => toggleGroupSelection(group.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {group.employee_name}
                                                </span>
                                                {group.shop_name && (
                                                    <Badge variant="secondary" className="text-xs">{group.shop_name}</Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-1">
                                                <span>{new Date(group.week_start).toLocaleDateString()} - {new Date(group.week_end).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>{group.entry_count} {group.entry_count === 1 ? 'entry' : 'entries'}</span>
                                                <span>•</span>
                                                <span className="font-medium">{group.total_hours}h</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Pending Payrolls Section - DRAFT and APPROVED payrolls */}
            {pendingPayrolls.length > 0 && (
                <Card className="mb-4">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                Pending Payrolls
                                <Badge variant="warning">{pendingPayrolls.length}</Badge>
                            </CardTitle>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Total: <span className="font-semibold text-amber-600 dark:text-amber-400">${pendingTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pendingPayrolls.map(run => (
                                <div key={run.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {run.period_type.replace('_', '-')} Payroll
                                            </span>
                                            <Badge variant={run.status === 'DRAFT' ? 'secondary' : 'info'} className="text-xs">
                                                {run.status}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-1">
                                            <span>{new Date(run.period_start).toLocaleDateString()} - {new Date(run.period_end).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{run.entry_count} employees</span>
                                            <span>•</span>
                                            <span className="font-medium">${parseFloat(run.total_amount || '0').toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end sm:flex-shrink-0">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => setSelectedPayrollId(run.id)}
                                        >
                                            View
                                        </Button>
                                        {run.status === 'DRAFT' && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleApprove(run.id)}
                                                disabled={approving === run.id}
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                {approving === run.id ? '...' : 'Approve'}
                                            </Button>
                                        )}
                                        {run.status === 'APPROVED' && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleMarkPaid(run.id)}
                                                disabled={markingPaid === run.id}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                {markingPaid === run.id ? '...' : 'Mark Paid'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Paid Payroll Section - Green theme */}
            <Card className="border-green-200 dark:border-green-800">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Paid Payroll
                            {paidPayrolls.length > 0 && <Badge variant="success">{paidPayrolls.length}</Badge>}
                        </CardTitle>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Total Paid: <span className="font-semibold text-green-600 dark:text-green-400">${paidTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {paidPayrolls.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm sm:text-base">No paid payrolls yet</p>
                            <p className="text-xs sm:text-sm">Payrolls will appear here after being marked as paid</p>
                        </div>
                    ) : (
                        <>
                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-sm rounded-md flex justify-between items-center">
                                    <span>{error}</span>
                                    <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">✕</button>
                                </div>
                            )}

                            {/* Desktop Table - Individual PayrollRuns with Shop */}
                            <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
                                <table className="min-w-full">
                                    <thead className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Shop</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Period</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Employees</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Total Hours</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Total Amount</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700">
                                        {paidPayrolls.map((run, idx) => (
                                            <tr key={run.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700 ${idx % 2 === 1 ? 'bg-gray-50/50 dark:bg-slate-700/30' : ''}`}>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                    <Badge variant="secondary">{run.shop_name || 'All Shops'}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{run.period_start} - {run.period_end}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{run.period_type}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{run.entry_count}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{run.total_hours}h</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">${run.total_amount}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                                        PAID
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="flex gap-1">
                                                        <ViewButton onClick={() => setSelectedPayrollId(run.id)} tooltip="View Payroll Details" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards - Individual PayrollRuns with Shop */}
                            <div className="sm:hidden space-y-4">
                                {paidPayrolls.map((run) => (
                                    <div key={run.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-md">
                                        {/* Card Header */}
                                        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-slate-700">
                                            <div>
                                                <div className="font-semibold text-white text-sm">{run.shop_name || 'All Shops'}</div>
                                                <div className="text-xs text-slate-300">{run.period_start} - {run.period_end}</div>
                                            </div>
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-500 text-white">
                                                PAID
                                            </span>
                                        </div>
                                        {/* Card Body */}
                                        <div className="p-4">
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                <div>
                                                    <div className="text-blue-600 text-[11px] font-medium">Employees</div>
                                                    <div className="text-slate-800 dark:text-slate-200 font-medium">{run.entry_count}</div>
                                                </div>
                                                <div>
                                                    <div className="text-blue-600 text-[11px] font-medium">Hours</div>
                                                    <div className="text-slate-800 dark:text-slate-200 font-medium">{run.total_hours}h</div>
                                                </div>
                                                <div>
                                                    <div className="text-blue-600 text-[11px] font-medium">Amount</div>
                                                    <div className="font-bold text-green-600">${run.total_amount}</div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Card Actions */}
                                        <div className="flex justify-end gap-1 px-4 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                                            <ViewButton onClick={() => setSelectedPayrollId(run.id)} tooltip="View" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Payroll Detail Modal */}
            <PayrollDetailModal
                isOpen={selectedPayrollId !== null}
                onClose={() => setSelectedPayrollId(null)}
                payrollId={selectedPayrollId}
                onStatusChange={onRefresh}
            />
        </>
    );
};

export default WorkforcePage;
