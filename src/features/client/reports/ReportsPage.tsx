import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../shared/components/layout/PageContainer';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { KioskReports } from './KioskReports';
import { ShiftReport } from './ShiftReport';
import { MachineReport } from './MachineReport';
import { useAuth } from '../../../contexts/AuthContext';

type ReportTab = 'kiosk' | 'shift' | 'machine';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { tab: urlTab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  // Permission checks - CLIENT_ADMIN has full access, employees check permissions
  const isAdmin = user?.role === 'CLIENT_ADMIN';
  const permissions = user?.permissions as Record<string, boolean> | undefined;

  const canViewKiosk = isAdmin || permissions?.can_view_all_reports || permissions?.can_view_kiosk_reports;
  const canViewShift = isAdmin || permissions?.can_view_all_reports || permissions?.can_view_shift_reports;
  const canViewMachine = isAdmin || permissions?.can_view_all_reports || permissions?.can_view_machine_reports;

  // Determine available tabs based on permissions
  const availableTabs: ReportTab[] = [];
  if (canViewKiosk) availableTabs.push('kiosk');
  if (canViewShift) availableTabs.push('shift');
  if (canViewMachine) availableTabs.push('machine');

  // Read active tab from URL or default to first available
  const validTabs: ReportTab[] = ['kiosk', 'shift', 'machine'];
  const getActiveTab = (): ReportTab | null => {
    if (urlTab && validTabs.includes(urlTab as ReportTab) && availableTabs.includes(urlTab as ReportTab)) {
      return urlTab as ReportTab;
    }
    const tabParam = searchParams.get('tab') as ReportTab | null;
    if (tabParam && availableTabs.includes(tabParam)) {
      return tabParam;
    }
    return availableTabs[0] || null;
  };

  const [activeTab, setActiveTabState] = useState<ReportTab | null>(null);

  const setActiveTab = (tab: ReportTab) => {
    // Use employee path if user is an employee, otherwise use client path
    const basePath = user?.role === 'EMPLOYEE' ? '/employee/reports' : '/client/reports';
    navigate(`${basePath}/${tab}`);
  };

  useEffect(() => {
    setActiveTabState(getActiveTab());
  }, [urlTab, searchParams, availableTabs.length]);

  return (
    <PageContainer>
      <div className="mt-6">
        <PageHeader
          title="Reports"
          subtitle="View and generate reports for your business"
        />
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-4 min-[500px]:space-x-8">
          {canViewKiosk && (
            <button
              onClick={() => setActiveTab('kiosk')}
              className={`py-3 min-[500px]:py-4 px-1 border-b-2 text-base font-semibold transition-colors whitespace-nowrap ${activeTab === 'kiosk'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-500'
                }`}
            >
              <div className="flex items-center space-x-1 min-[500px]:space-x-2">
                <svg className="w-4 h-4 min-[500px]:w-5 min-[500px]:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Kiosk</span>
              </div>
            </button>
          )}
          {canViewShift && (
            <button
              onClick={() => setActiveTab('shift')}
              className={`py-3 min-[500px]:py-4 px-1 border-b-2 text-base font-semibold transition-colors whitespace-nowrap ${activeTab === 'shift'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-500'
                }`}
            >
              <div className="flex items-center space-x-1 min-[500px]:space-x-2">
                <svg className="w-4 h-4 min-[500px]:w-5 min-[500px]:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Shift</span>
              </div>
            </button>
          )}
          {canViewMachine && (
            <button
              onClick={() => setActiveTab('machine')}
              className={`py-3 min-[500px]:py-4 px-1 border-b-2 text-base font-semibold transition-colors whitespace-nowrap ${activeTab === 'machine'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-500'
                }`}
            >
              <div className="flex items-center space-x-1 min-[500px]:space-x-2">
                <svg className="w-4 h-4 min-[500px]:w-5 min-[500px]:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Machine</span>
              </div>
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'kiosk' && canViewKiosk && <KioskReports />}
      {activeTab === 'shift' && canViewShift && <ShiftReport />}
      {activeTab === 'machine' && canViewMachine && <MachineReport />}

      {availableTabs.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>You don't have permission to view any reports.</p>
        </div>
      )}
    </PageContainer>
  );
};
