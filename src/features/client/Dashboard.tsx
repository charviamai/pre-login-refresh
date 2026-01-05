import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Select, Modal, Button } from '../../shared/components/ui';
import { PageContainer } from '../../shared/components/layout/PageContainer';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { adminApi } from '../../shared/utils/api-service';
import { useTimezone } from '../../shared/context/TimezoneContext';
import { useShop } from '../../shared/context/ShopContext';
import { useAuth } from '../../contexts/AuthContext';
import type { DashboardStats } from '../../shared/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableActionItem } from '../../shared/components/SortableActionItem';

// Define all available quick actions
interface QuickAction {
  id: string;
  label: string;
  route: string;
  icon: React.ReactNode;
  permission?: string;
}

const ALL_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'add_shop',
    label: 'Add New Shop',
    route: '/client/shops',
    permission: 'can_manage_shops',
    icon: (
      <svg className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'add_device',
    label: 'Add Kiosk Device',
    route: '/client/devices',
    permission: 'can_manage_devices',
    icon: (
      <svg className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'add_employee',
    label: 'Add Employee',
    route: '/client/employees',
    permission: 'can_manage_employees',
    icon: (
      <svg className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    id: 'add_customer',
    label: 'Add Customer',
    route: '/client/customers',
    permission: 'can_add_customers',
    icon: (
      <svg className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: 'view_reports',
    label: 'View Reports',
    route: '/client/reports',
    permission: 'can_view_reports',
    icon: (
      <svg className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'view_audit_logs',
    label: 'View Audit Logs',
    route: '/client/settings/audit_logs',
    permission: 'can_view_audit_logs',
    icon: (
      <svg className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'generate_payroll',
    label: 'Generate Payroll',
    route: '/client/workforce/payroll',
    permission: 'can_manage_payroll',
    icon: (
      <svg className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'view_schedule',
    label: 'View Schedule',
    route: '/client/workforce/schedule',
    icon: (
      <svg className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'machine_readings',
    label: 'Machine Readings',
    route: '/client/machines/readings',
    permission: 'can_manage_machine_readings',
    icon: (
      <svg className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const STORAGE_KEY = 'dashboard_quick_actions';
const DEFAULT_ACTIONS = ['add_shop', 'add_device', 'add_employee', 'view_reports'];

export const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { getToday } = useTimezone();
  const { user } = useAuth();
  const { selectedShopId } = useShop();
  const permissions = user?.permissions || {};
  const isOwner = permissions.is_owner === true;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const getTodayDate = () => getToday();
  const [date, setDate] = useState<string>(getTodayDate);
  const [preset, setPreset] = useState<'TODAY' | 'YESTERDAY' | 'THIS_MONTH' | 'LAST_MONTH'>('TODAY');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [, setRangeStats] = useState<DashboardStats | null>(null);

  // Quick Actions customization state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedActions, setSelectedActions] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_ACTIONS;
  });
  const [tempSelectedActions, setTempSelectedActions] = useState<string[]>([]);

  // DnD Kit sensors - must be at top level (includes TouchSensor for mobile)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const today = getTodayDate();
    if (date !== today && preset === 'TODAY') {
      setDate(today);
    } else {
      loadDashboard();
    }
  }, [date]);

  const loadDashboard = async (overrideDate?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getDashboard(overrideDate ?? date, selectedShopId);
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Reload dashboard when shop selection changes
  useEffect(() => {
    if (preset === 'TODAY' || preset === 'YESTERDAY') {
      loadDashboard(date);
    } else if ((preset === 'THIS_MONTH' || preset === 'LAST_MONTH') && startDate && endDate) {
      (async () => {
        try {
          setLoading(true);
          const data = await adminApi.getDashboardRange(startDate, endDate, selectedShopId);
          setStats(data);
        } catch (err: any) {
          setError(err.message || 'Failed to load data');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [selectedShopId]);

  const hasPermission = (action: QuickAction): boolean => {
    if (isOwner) return true;
    if (!action.permission) return true;
    return permissions[action.permission] === true;
  };

  // Get visible actions in the user's selected order
  const visibleActions = selectedActions
    .map((id) => ALL_QUICK_ACTIONS.find((a) => a.id === id))
    .filter((action): action is QuickAction => action !== undefined && hasPermission(action));

  const availableActions = ALL_QUICK_ACTIONS.filter((action) => hasPermission(action));

  const openEditModal = () => {
    setTempSelectedActions([...selectedActions]);
    setShowEditModal(true);
  };

  const toggleAction = (actionId: string) => {
    setTempSelectedActions((prev) =>
      prev.includes(actionId) ? prev.filter((id) => id !== actionId) : [...prev, actionId]
    );
  };

  const saveQuickActions = () => {
    setSelectedActions(tempSelectedActions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tempSelectedActions));
    setShowEditModal(false);
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="" subtitle="" />
        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg" />
                <div>
                  <div className="h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
                  <div className="h-6 w-12 bg-gray-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 animate-pulse">
            <div className="h-5 w-32 bg-gray-200 dark:bg-slate-700 rounded mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-slate-700 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 animate-pulse">
            <div className="h-5 w-32 bg-gray-200 dark:bg-slate-700 rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 dark:bg-slate-700 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title=""
        subtitle=""
        actions={
          <div className="flex items-center gap-3 mt-3">
            <Select
              value={preset}
              aria-label="Select date range"
              onChange={async (e) => {
                const v = e.target.value as 'TODAY' | 'YESTERDAY' | 'THIS_MONTH' | 'LAST_MONTH';
                const fmt = (d: Date) => d.toLocaleDateString('en-CA');
                setPreset(v);

                if (v === 'TODAY') {
                  const d = getTodayDate();
                  setDate(d);
                  setStartDate('');
                  setEndDate('');
                  await loadDashboard(d);
                } else if (v === 'YESTERDAY') {
                  const t = new Date();
                  t.setDate(t.getDate() - 1);
                  const d = fmt(t);
                  setDate(d);
                  setStartDate('');
                  setEndDate('');
                  await loadDashboard(d);
                } else if (v === 'THIS_MONTH') {
                  const t = new Date();
                  const start = new Date(t.getFullYear(), t.getMonth(), 1);
                  const end = new Date(t.getFullYear(), t.getMonth() + 1, 0);
                  setStartDate(fmt(start));
                  setEndDate(fmt(end));
                  try {
                    setLoading(true);
                    const data = await adminApi.getDashboardRange(fmt(start), fmt(end), selectedShopId);
                    setRangeStats(data);
                    setStats(data);
                  } catch (err: any) {
                    setError(err.message || 'Failed to load data');
                  } finally {
                    setLoading(false);
                  }
                } else if (v === 'LAST_MONTH') {
                  const t = new Date();
                  const start = new Date(t.getFullYear(), t.getMonth() - 1, 1);
                  const end = new Date(t.getFullYear(), t.getMonth(), 0);
                  setStartDate(fmt(start));
                  setEndDate(fmt(end));
                  try {
                    setLoading(true);
                    const data = await adminApi.getDashboardRange(fmt(start), fmt(end), selectedShopId);
                    setStats(data);
                  } catch (err: any) {
                    setError(err.message || 'Failed to load data');
                  } finally {
                    setLoading(false);
                  }
                }
              }}
              options={[
                { value: 'TODAY', label: 'Today' },
                { value: 'YESTERDAY', label: 'Yesterday' },
                { value: 'THIS_MONTH', label: 'This Month' },
                { value: 'LAST_MONTH', label: 'Last Month' },
              ]}
              className="!px-3 !py-2 !border-gray-300 !rounded-md !text-sm !min-h-[38px] !h-auto bg-white"
            />
          </div>
        }
      />

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="group stat-card bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm hover:shadow-lg dark:hover:shadow-indigo-500/10 transition-all duration-300 p-3 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="icon-box w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 dark:bg-gradient-to-br dark:from-indigo-600 dark:to-indigo-800 border border-slate-200 dark:border-indigo-500/30 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-white transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">Shops</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">{stats.shops_count}</p>
                </div>
              </div>
            </div>

            <div className="group stat-card bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm hover:shadow-lg dark:hover:shadow-indigo-500/10 transition-all duration-300 p-3 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="icon-box w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 dark:bg-gradient-to-br dark:from-emerald-600 dark:to-emerald-800 border border-slate-200 dark:border-emerald-500/30 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-white transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">Devices</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">{stats.devices_count}</p>
                </div>
              </div>
            </div>

            <div className="group stat-card bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm hover:shadow-lg dark:hover:shadow-indigo-500/10 transition-all duration-300 p-3 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="icon-box w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 dark:bg-gradient-to-br dark:from-violet-600 dark:to-violet-800 border border-slate-200 dark:border-violet-500/30 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-white transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">Employees</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">{stats.employees_count ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="group stat-card bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm hover:shadow-lg dark:hover:shadow-amber-500/10 transition-all duration-300 p-3 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="icon-box w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 dark:bg-gradient-to-br dark:from-amber-500 dark:to-amber-700 border border-slate-200 dark:border-amber-500/30 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-white transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">Payout</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">${(stats.total_payout ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Plays & Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-8">
            {/* Daily Plays */}
            <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 border-b border-slate-600/50">
                <h2 className="text-sm sm:text-base font-semibold text-white">
                  {preset === 'THIS_MONTH' || preset === 'LAST_MONTH'
                    ? `Plays (${startDate} to ${endDate})`
                    : `Daily Plays (${stats.date || date})`}
                </h2>
              </div>
              <div className="p-3 sm:p-5">
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/80 rounded-lg p-3 sm:p-4 border border-slate-100 dark:border-slate-600 text-center">
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 sm:mb-2">Spins Played</p>
                    <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white">{(stats.spins_count ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/80 rounded-lg p-3 sm:p-4 border border-slate-100 dark:border-slate-600 text-center">
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 sm:mb-2">Matches Played</p>
                    <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white">{(stats.matches_count ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/80 rounded-lg p-3 sm:p-4 border border-slate-100 dark:border-slate-600 text-center">
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 sm:mb-2">Spin Amount</p>
                    <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white">${(stats.total_spin_amount ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/80 rounded-lg p-3 sm:p-4 border border-slate-100 dark:border-slate-600 text-center">
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 sm:mb-2">Match Amount</p>
                    <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white">${(stats.total_match_amount ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2 bg-slate-50 dark:bg-slate-900/80 rounded-lg p-3 sm:p-4 text-center border border-slate-100 dark:border-slate-600 hover:bg-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-default">
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 sm:mb-2">Total Play Amount</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">${(stats.total_play_amount ?? 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions - Customizable */}
            <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-lg overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 border-b border-slate-600/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h2 className="text-base font-semibold text-white">Quick Actions</h2>
                </div>
                <button
                  onClick={openEditModal}
                  className="text-xs text-slate-300 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-slate-700/50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              </div>
              <div className="p-4">
                <div className="space-y-2.5">
                  {visibleActions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className="text-sm text-gray-500 dark:text-slate-400">No quick actions selected.</p>
                      <button onClick={openEditModal} className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                        Click to customize
                      </button>
                    </div>
                  ) : (
                    visibleActions.map((action, index) => (
                      <button
                        key={action.id}
                        onClick={() => navigate(action.route)}
                        className="group w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-900/80 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md dark:hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-0.5"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:shadow-slate-500/30 dark:group-hover:shadow-indigo-500/30 group-hover:scale-110 transition-all duration-300 [&_svg]:text-white [&_svg]:w-5 [&_svg]:h-5">
                            {action.icon}
                          </div>
                          <div className="text-left">
                            <span className="text-sm font-semibold text-slate-700 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{action.label}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tickets */}
          {stats.recent_tickets && stats.recent_tickets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ticket Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mode</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Issued At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {stats.recent_tickets.slice(0, 5).map((ticket) => (
                        <tr key={ticket.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{ticket.ticket_code}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">${ticket.amount}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{ticket.issued_by_mode}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ticket.status === 'REDEEMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{new Date(ticket.issued_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden space-y-3">
                  {stats.recent_tickets.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 border border-gray-200 dark:border-slate-600">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900 font-mono">{ticket.ticket_code}</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ticket.status === 'REDEEMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-gray-500">Amount: </span><span className="font-semibold text-gray-900">${ticket.amount}</span></div>
                        <div><span className="text-gray-500">Mode: </span><span className="text-gray-700">{ticket.issued_by_mode}</span></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">{new Date(ticket.issued_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )
      }

      {/* Edit Quick Actions Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Customize Quick Actions" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Drag to reorder or check/uncheck to add/remove actions.</p>

          {/* Selected Actions - Drag & Drop */}
          {tempSelectedActions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Selected (drag to reorder)</p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event: DragEndEvent) => {
                  const { active, over } = event;
                  if (over && active.id !== over.id) {
                    setTempSelectedActions((items) => {
                      const oldIndex = items.indexOf(active.id as string);
                      const newIndex = items.indexOf(over.id as string);
                      return arrayMove(items, oldIndex, newIndex);
                    });
                  }
                }}
              >
                <SortableContext items={tempSelectedActions} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {tempSelectedActions.map((actionId) => {
                      const action = ALL_QUICK_ACTIONS.find((a) => a.id === actionId);
                      if (!action || !hasPermission(action)) return null;
                      return (
                        <SortableActionItem
                          key={action.id}
                          id={action.id}
                          label={action.label}
                          icon={action.icon}
                          checked={true}
                          onToggle={() => toggleAction(action.id)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Available Actions (not selected) */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Available Actions</p>
            {availableActions.filter((a) => !tempSelectedActions.includes(a.id)).map((action) => (
              <label key={action.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => toggleAction(action.id)}
                  className="w-4 h-4 text-slate-700 rounded focus:ring-slate-500"
                />
                <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">{action.icon}</div>
                <span className="text-sm font-medium text-slate-700">{action.label}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={saveQuickActions} className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white">
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer >
  );
};
