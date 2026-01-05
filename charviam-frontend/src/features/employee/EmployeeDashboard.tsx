import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../shared/components/layout/PageContainer';
import { Loading } from '../../shared/components/Loading';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { useAuth } from '../../contexts/AuthContext';
import { employeeApi } from '../../shared/utils/api-service';
import { ClockModal } from './components/ClockModal';
import { Modal } from '../../shared/components/ui/Modal';
import { Button } from '../../shared/components/ui/Button';
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

// Get selected shop from sessionStorage
const getSelectedShop = (): { id: string; name: string } | null => {
  const stored = sessionStorage.getItem('employee_selected_shop');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

type DateFilter = 'today' | 'yesterday' | 'this_week';

interface DashboardStats {
  date_filter: string;
  start_date: string;
  end_date: string;
  total_plays: number;
  total_play_amount: number;
  spins_count: number;
  matches_count: number;
  total_spin_amount: number;
  total_match_amount: number;
  shop_settings: {
    enable_spin_promotion: boolean;
    enable_match_promotion: boolean;
  };
  active_shift: {
    id: string;
    shift_start: string | null;
    status: string;
  } | null;
  scheduled_shift: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
  } | null;
  shop: {
    id: string;
    name: string;
  };
}

interface QuickAction {
  id: string;
  label: string;
  route: string;
  icon: React.ReactNode;
  permission?: string | string[];
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'schedule',
    label: 'Schedule',
    route: '/employee/schedule',
    permission: 'can_view_own_schedule',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'hours',
    label: 'Hours',
    route: '/employee/hours',
    permission: 'can_view_own_hours',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'timesheet',
    label: 'Timesheet',
    route: '/employee/timesheet',
    permission: 'can_enter_timesheet',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: 'tickets',
    label: 'Tickets',
    route: '/employee/tickets',
    permission: 'can_redeem_tickets',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    id: 'customers',
    label: 'Customers',
    route: '/employee/customers',
    permission: 'can_view_customers',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'reports',
    label: 'Reports',
    route: '/employee/reports',
    permission: ['can_view_all_reports', 'can_view_kiosk_reports', 'can_view_shift_reports'],
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const STORAGE_KEY = 'employee_quick_actions';
const DEFAULT_ACTIONS = ['schedule', 'hours', 'timesheet', 'tickets', 'customers', 'reports'];

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showClockModal, setShowClockModal] = useState(false);
  const [clockLoading, setClockLoading] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [shiftDuration, setShiftDuration] = useState('0h 0m');
  const permissions = user?.permissions as Record<string, boolean> | undefined;

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

  const selectedShop = getSelectedShop();

  // Redirect to shop selection if no shop
  useEffect(() => {
    if (!selectedShop) {
      navigate('/employee/select-shop');
    }
  }, [selectedShop, navigate]);

  // Check active shift on load
  useEffect(() => {
    const checkActiveShift = async () => {
      try {
        const response = await employeeApi.getActiveShift();
        if (response && (response as any).clocked_in) {
          setIsClockedIn(true);
          if ((response as any).clock_in_time) {
            const startTime = new Date((response as any).clock_in_time);
            setClockInTime(startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
          }
        } else {
          setIsClockedIn(false);
          setClockInTime(null);
        }
      } catch {
        setIsClockedIn(false);
      }
    };
    if (selectedShop) {
      checkActiveShift();
    }
  }, [selectedShop]);

  // Update duration every minute when clocked in
  useEffect(() => {
    if (!isClockedIn || !clockInTime) return;

    const updateDuration = () => {
      const now = new Date();
      const today = new Date();
      const [time, period] = clockInTime.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;

      today.setHours(hour24, minutes, 0, 0);
      const diff = now.getTime() - today.getTime();
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setShiftDuration(`${hrs}h ${mins}m`);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000);
    return () => clearInterval(interval);
  }, [isClockedIn, clockInTime]);

  // Fetch stats
  useEffect(() => {
    const controller = new AbortController();

    const fetchStats = async () => {
      if (!selectedShop) return;
      setLoadingStats(true);
      try {
        const response = await employeeApi.getDashboardStats(selectedShop.id, dateFilter);
        if (!controller.signal.aborted) {
          setStats(response as unknown as DashboardStats);
        }
      } catch {
        // Silent fail
      } finally {
        if (!controller.signal.aborted) {
          setLoadingStats(false);
        }
      }
    };

    fetchStats();
    return () => controller.abort();
  }, [selectedShop?.id, dateFilter]);

  const handleClockIn = async () => {
    if (!selectedShop) return;
    setClockLoading(true);
    try {
      const response = await employeeApi.startShift(selectedShop.id);
      if (response) {
        setIsClockedIn(true);
        setClockInTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
        setShowClockModal(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to clock in');
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockLoading(true);
    try {
      await employeeApi.endShift();
      setIsClockedIn(false);
      setClockInTime(null);
      setShowClockModal(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to clock out');
    } finally {
      setClockLoading(false);
    }
  };

  const hasPermission = (action: QuickAction): boolean => {
    if (!action.permission) return true;
    if (!permissions) return false;
    if (Array.isArray(action.permission)) {
      return action.permission.some(perm => permissions[perm] === true);
    }
    return permissions[action.permission] === true;
  };

  // Get visible actions in the user's selected order
  const visibleActions = selectedActions
    .map((id) => QUICK_ACTIONS.find((a) => a.id === id))
    .filter((action): action is QuickAction => action !== undefined && hasPermission(action));

  const availableActions = QUICK_ACTIONS.filter((action) => hasPermission(action));

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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  if (!selectedShop) {
    return <Loading message="Loading..." />;
  }

  return (
    <PageContainer>
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {/* Date Filter Row */}
      <div className="flex items-center justify-between mb-4">
        {/* Left: Clock Status (only if permission enabled) */}
        <div className="text-sm text-gray-500">
          {permissions?.can_clock_in_out && (
            isClockedIn ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Working since {clockInTime}
              </span>
            ) : (
              <span className="text-gray-400">Not clocked in</span>
            )
          )}
        </div>

        {/* Right: Stats Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Stats for:</span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="text-sm border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
          </select>
        </div>
      </div>

      {/* Today's Shift Card - TOP OF PAGE - Only show if user has clock permission */}
      {permissions?.can_clock_in_out && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mb-4">
          <div className={`px-5 py-4 border-b ${isClockedIn ? 'bg-green-600 border-green-500' : 'bg-slate-700 border-slate-600'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Today's Shift</h3>
              <button
                onClick={() => setShowClockModal(true)}
                className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isClockedIn ? 'Clock Out' : 'Clock In'}
              </button>
            </div>
          </div>
          <div className="p-5">
            {isClockedIn ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                  <div>
                    <p className="text-green-700 font-semibold">Currently Working</p>
                    <p className="text-sm text-gray-600">Clocked in at <span className="font-medium">{clockInTime}</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="text-2xl font-bold text-green-700">{shiftDuration}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No active shift</p>
                <button
                  onClick={() => setShowClockModal(true)}
                  className="mt-2 text-blue-600 text-sm font-medium hover:underline"
                >
                  Start your shift →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scheduled Shift Card - Only show if user has schedule permission */}
      {permissions?.can_view_own_schedule && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 bg-slate-700 border-b border-slate-600">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Today's Scheduled Shift</h3>
              <button
                onClick={() => navigate('/employee/schedule')}
                className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View Schedule
              </button>
            </div>
          </div>
          <div className="p-5">
            {stats?.scheduled_shift ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-indigo-700 dark:text-indigo-300 font-semibold">Shift Scheduled</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {stats.scheduled_shift.start_time} - {stats.scheduled_shift.end_time}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                  {stats.scheduled_shift.status}
                </span>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">No shift scheduled for today</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Grid - 2 Column like Admin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Daily Plays Section */}
        {/* Daily Plays Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-700 border-b border-slate-600 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Daily Plays ({dateFilter === 'today' ? 'Today' : dateFilter === 'yesterday' ? 'Yesterday' : 'This Week'})</h3>
            <span className="text-sm font-bold text-white bg-slate-600 px-2 py-1 rounded">
              {loadingStats ? '...' : (stats?.total_plays ?? 0)} Plays
            </span>
          </div>
          <div className="p-5">
            {(() => {
              const showSpin = stats?.shop_settings?.enable_spin_promotion !== false;
              const showMatch = stats?.shop_settings?.enable_match_promotion !== false;
              const showBoth = showSpin && showMatch;

              // Always use 2-column grid for consistent layout
              return (
                <div className="grid grid-cols-2 gap-3">
                  {showBoth ? (
                    // Both enabled: 2x3 grid layout
                    <>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Spins</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{loadingStats ? '...' : (stats?.spins_count ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Matches</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{loadingStats ? '...' : (stats?.matches_count ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Spin Amount</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{loadingStats ? '...' : formatCurrency(stats?.total_spin_amount ?? 0)}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Match Amount</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{loadingStats ? '...' : formatCurrency(stats?.total_match_amount ?? 0)}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Play Amount</p>
                        <p className="text-3xl font-bold text-white">
                          {loadingStats ? '...' : formatCurrency((stats?.total_spin_amount ?? 0) + (stats?.total_match_amount ?? 0))}
                        </p>
                      </div>
                    </>
                  ) : showSpin ? (
                    // Only Spin: 2-column compact layout
                    <>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Spins</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{loadingStats ? '...' : (stats?.spins_count ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Spin Amount</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{loadingStats ? '...' : formatCurrency(stats?.total_spin_amount ?? 0)}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Play Amount</p>
                        <p className="text-3xl font-bold text-white">{loadingStats ? '...' : formatCurrency(stats?.total_spin_amount ?? 0)}</p>
                      </div>
                    </>
                  ) : showMatch ? (
                    // Only Match: 2-column compact layout
                    <>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Matches</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{loadingStats ? '...' : (stats?.matches_count ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Match Amount</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{loadingStats ? '...' : formatCurrency(stats?.total_match_amount ?? 0)}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Play Amount</p>
                        <p className="text-3xl font-bold text-white">{loadingStats ? '...' : formatCurrency(stats?.total_match_amount ?? 0)}</p>
                      </div>
                    </>
                  ) : (
                    // Neither enabled
                    <div className="col-span-2 text-center py-4 text-slate-500">
                      <p>No play types enabled for this shop</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 bg-slate-700 border-b border-slate-600 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Quick Actions</h3>
            <button
              onClick={openEditModal}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
          <div className="p-5 flex-1 flex flex-col">
            {visibleActions.length === 0 ? (
              <div className="text-center py-6 text-slate-500 flex-1 flex flex-col items-center justify-center">
                <p className="text-sm">No quick actions selected.</p>
                <button onClick={openEditModal} className="mt-2 text-sm text-blue-600 hover:underline">
                  Click Edit to add some
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 flex-1 auto-rows-fr">
                {visibleActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => navigate(action.route)}
                    className="group flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 min-h-[80px]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 dark:group-hover:bg-slate-700 transition-colors">
                      {action.icon}
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clock Modal */}
      <ClockModal
        isOpen={showClockModal}
        onClose={() => setShowClockModal(false)}
        isClockedIn={isClockedIn}
        shopName={selectedShop.name}
        clockInTime={clockInTime}
        duration={shiftDuration}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        isLoading={clockLoading}
      />

      {/* Edit Quick Actions Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Customize Quick Actions" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Drag to reorder or check/uncheck to add/remove actions.</p>

          {/* Selected Actions - Drag & Drop */}
          {tempSelectedActions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Selected (drag to reorder)</p>
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
                      const action = QUICK_ACTIONS.find((a) => a.id === actionId);
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
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Available Actions</p>
            {availableActions.filter((a) => !tempSelectedActions.includes(a.id)).map((action) => (
              <label key={action.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => toggleAction(action.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="w-8 h-8 bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-gray-600 dark:text-gray-300">{action.icon}</div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{action.label}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={saveQuickActions} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};
