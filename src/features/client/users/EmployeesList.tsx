import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Modal, Input, Switch, Badge, useConfirm, Pagination } from '../../../shared/components/ui';
import { Table } from '../../../shared/components/ui/Table';
import { PageContainer } from '../../../shared/components/layout/PageContainer';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Loading } from '../../../shared/components/Loading';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { PhoneInput } from '../../../shared/components/PhoneInput';
import { adminApi } from '../../../shared/utils/api-service';
import { useShop } from '../../../shared/context/ShopContext';
import type { User, Shop, PermissionSetListItem } from '../../../shared/types';
import { workforceApi } from '../../../shared/utils/workforceApi';
import { validators } from '../../../shared/utils/validators';
import { EditButton, DeleteButton } from '../../../shared/components/ActionIcons';

interface EmployeeFormData {
  name_first: string;
  name_last: string;
  email: string;
  phone: string;
  country_code: string;
  access_code: string;
  shop_ids: string[];
  // Original permissions
  can_redeem_tickets: boolean;
  can_onboard_customers: boolean;
  can_view_shop_reports: boolean;
  // Extended permissions
  can_access_dashboard: boolean;
  // Customers
  can_view_customers: boolean;
  can_add_customers: boolean;
  can_edit_customers: boolean;
  can_delete_customers: boolean;
  // Reports
  can_view_all_reports: boolean;
  can_view_kiosk_reports: boolean;
  can_view_shift_reports: boolean;
  can_view_machine_reports: boolean;
  // Machine Readings
  can_view_machine_readings: boolean;
  can_add_machine_readings: boolean;
  // Shift Summary
  can_view_shift_summary: boolean;
  // Phase 3: Field-level visibility
  can_view_total_in: boolean;
  can_view_total_out: boolean;
  can_view_today_in: boolean;
  can_view_today_out: boolean;
  // Phase 4: Workforce permissions
  can_view_own_schedule: boolean;
  can_enter_timesheet: boolean;
  can_view_own_hours: boolean;
  can_clock_in_out: boolean;
  // Compensation
  hourly_rate: string;
}

// Generate a random 6-character alphanumeric access code
const generateAccessCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Define permission groups for the individual permissions UI
interface PermissionGroup {
  name: string;
  permissions: { key: keyof EmployeeFormData; label: string }[];
}

const EMPLOYEE_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'Dashboard',
    permissions: [{ key: 'can_access_dashboard', label: 'Access Dashboard' }],
  },
  {
    name: 'Tickets & Redemption',
    permissions: [
      { key: 'can_redeem_tickets', label: 'Redeem Tickets' },
      { key: 'can_onboard_customers', label: 'Onboard Customers' },
    ],
  },
  {
    name: 'Customers',
    permissions: [
      { key: 'can_view_customers', label: 'View Customers' },
      { key: 'can_add_customers', label: 'Add Customers' },
      { key: 'can_edit_customers', label: 'Edit Customers' },
      { key: 'can_delete_customers', label: 'Delete Customers' },
    ],
  },
  {
    name: 'Reports',
    permissions: [
      { key: 'can_view_kiosk_reports', label: 'Kiosk Reports' },
      { key: 'can_view_shift_reports', label: 'Shift Reports' },
      { key: 'can_view_machine_reports', label: 'Machine Reports' },
    ],
  },
  {
    name: 'Machine Readings',
    permissions: [
      { key: 'can_view_machine_readings', label: 'View Readings' },
      { key: 'can_add_machine_readings', label: 'Add Readings' },
      { key: 'can_view_total_in', label: 'View Total In' },
      { key: 'can_view_total_out', label: 'View Total Out' },
      { key: 'can_view_today_in', label: 'View Today In' },
      { key: 'can_view_today_out', label: 'View Today Out' },
      { key: 'can_view_shift_summary', label: 'View Shift Summary' },
    ],
  },
  {
    name: 'Workforce',
    permissions: [
      { key: 'can_view_own_schedule', label: 'View Schedule' },
      { key: 'can_view_own_hours', label: 'View Hours' },
      { key: 'can_enter_timesheet', label: 'Enter Timesheet' },
      { key: 'can_clock_in_out', label: 'Clock In/Out' },
    ],
  },
];

export const EmployeesList: React.FC = () => {
  const confirm = useConfirm();
  const { selectedShopId, isAllShopsSelected } = useShop();
  const [employees, setEmployees] = useState<User[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendingInvite, setResendingInvite] = useState<string | null>(null);
  const [permissionSets, setPermissionSets] = useState<PermissionSetListItem[]>([]);
  const [usePermissionSets, setUsePermissionSets] = useState(true);
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [reactivateUserId, setReactivateUserId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-scroll to top of modal when error occurs
  useEffect(() => {
    if (error && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [error]);

  // URL-based pagination state
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 25;

  const [formData, setFormData] = useState<EmployeeFormData>({
    name_first: '',
    name_last: '',
    email: '',
    phone: '',
    country_code: 'US',
    access_code: '',
    shop_ids: [],
    // Original permissions
    can_redeem_tickets: true,
    can_onboard_customers: false,
    can_view_shop_reports: false,
    // Extended permissions
    can_access_dashboard: true,
    can_view_customers: false,
    can_add_customers: false,
    can_edit_customers: false,
    can_delete_customers: false,
    can_view_all_reports: false,
    can_view_kiosk_reports: false,
    can_view_shift_reports: false,
    can_view_machine_reports: false,
    can_view_machine_readings: false,
    can_add_machine_readings: false,
    can_view_shift_summary: false,
    // Phase 3: Field-level visibility (default all visible)
    can_view_total_in: true,
    can_view_total_out: true,
    // Phase 4: Workforce permissions
    can_view_own_schedule: true,
    can_enter_timesheet: false,
    can_view_own_hours: true,
    can_clock_in_out: true,
    // Compensation
    hourly_rate: '',
    can_view_today_in: true,
    can_view_today_out: true,
  });

  // Track the initial shop ID to detect actual shop changes vs initial load
  const initialShopIdRef = React.useRef<string | undefined>(selectedShopId);
  const hasLoadedRef = React.useRef(false);

  // Initial load - use page from URL
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadData(initialPage);
    }
  }, []);

  // Reload employees when global shop selection changes (only if it's a real change)
  useEffect(() => {
    // Skip if we haven't loaded yet
    if (!hasLoadedRef.current) {
      return;
    }
    // Only reset if the shop actually changed from what was initially set
    if (initialShopIdRef.current !== selectedShopId) {
      initialShopIdRef.current = selectedShopId;
      setCurrentPage(1);
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('page');
        return newParams;
      });
      loadData(1);
    }
  }, [selectedShopId]);

  const loadData = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      // Pass shop_id filter if a specific shop is selected
      const shopIdFilter = isAllShopsSelected ? undefined : selectedShopId;
      const [employeesResponse, shopsData, permissionSetsData] = await Promise.all([
        adminApi.getEmployees(shopIdFilter, page),
        adminApi.getShops(),
        adminApi.getPermissionSets(),
      ]);
      // Handle paginated response
      const empData = employeesResponse as any;
      if (empData?.results) {
        setEmployees(empData.results);
        setTotalCount(empData.count || 0);
        setTotalPages(Math.ceil((empData.count || 0) / PAGE_SIZE));
      } else {
        setEmployees(Array.isArray(employeesResponse) ? employeesResponse : []);
        setTotalCount(Array.isArray(employeesResponse) ? employeesResponse.length : 0);
        setTotalPages(1);
      }
      setShops(Array.isArray(shopsData) ? shopsData : ((shopsData as any)?.results || []));
      setPermissionSets(Array.isArray(permissionSetsData) ? permissionSetsData : ((permissionSetsData as any)?.results || []));
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
      setEmployees([]);
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (page === 1) {
        newParams.delete('page');
      } else {
        newParams.set('page', String(page));
      }
      return newParams;
    });
    loadData(page);
  };

  const handleOpenModal = async (employee?: User) => {
    if (employee) {
      setEditingEmployee(employee);
      // Get shop IDs from assigned_shops
      const shopIds = employee.assigned_shops?.map(shop => shop.shop_id) || [];
      const perms = employee.permissions as Record<string, boolean> | undefined;

      // Load current hourly rate for this employee
      let currentHourlyRate = '';
      try {
        const payRateData = await workforceApi.getCurrentPayRate(employee.id);
        currentHourlyRate = payRateData.hourly_rate || '';
      } catch (err) {
        // No pay rate set yet, that's fine

      }

      setFormData({
        name_first: employee.name_first,
        name_last: employee.name_last,
        email: employee.email,
        phone: employee.phone || '',
        country_code: 'US',
        access_code: employee.access_code || '',
        shop_ids: shopIds,
        // Original permissions
        can_redeem_tickets: perms?.can_redeem_tickets ?? true,
        can_onboard_customers: perms?.can_onboard_customers ?? false,
        can_view_shop_reports: perms?.can_view_shop_reports ?? false,
        // Extended permissions
        can_access_dashboard: perms?.can_access_dashboard ?? true,
        can_view_customers: perms?.can_view_customers ?? false,
        can_add_customers: perms?.can_add_customers ?? false,
        can_edit_customers: perms?.can_edit_customers ?? false,
        can_delete_customers: perms?.can_delete_customers ?? false,
        can_view_all_reports: perms?.can_view_all_reports ?? false,
        can_view_kiosk_reports: perms?.can_view_kiosk_reports ?? false,
        can_view_shift_reports: perms?.can_view_shift_reports ?? false,
        can_view_machine_reports: perms?.can_view_machine_reports ?? false,
        can_view_machine_readings: perms?.can_view_machine_readings ?? false,
        can_add_machine_readings: perms?.can_add_machine_readings ?? false,
        can_view_shift_summary: perms?.can_view_shift_summary ?? false,
        // Phase 3: Field-level visibility
        can_view_total_in: perms?.can_view_total_in ?? true,
        can_view_total_out: perms?.can_view_total_out ?? true,
        can_view_today_in: perms?.can_view_today_in ?? true,
        can_view_today_out: perms?.can_view_today_out ?? true,
        // Phase 4: Workforce permissions
        can_view_own_schedule: perms?.can_view_own_schedule ?? true,
        can_enter_timesheet: perms?.can_enter_timesheet ?? false,
        can_view_own_hours: perms?.can_view_own_hours ?? true,
        can_clock_in_out: perms?.can_clock_in_out ?? true,
        // Compensation - loaded from API
        hourly_rate: currentHourlyRate,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name_first: '',
        name_last: '',
        email: '',
        phone: '',
        country_code: 'US',
        access_code: '',
        shop_ids: [],
        // Original permissions
        can_redeem_tickets: true,
        can_onboard_customers: false,
        can_view_shop_reports: false,
        // Extended permissions - defaults
        can_access_dashboard: true,
        can_view_customers: false,
        can_add_customers: false,
        can_edit_customers: false,
        can_delete_customers: false,
        can_view_all_reports: false,
        can_view_kiosk_reports: false,
        can_view_shift_reports: false,
        can_view_machine_reports: false,
        can_view_machine_readings: false,
        can_add_machine_readings: false,
        can_view_shift_summary: false,
        // Phase 3: Field-level visibility (default all visible)
        can_view_total_in: true,
        can_view_total_out: true,
        can_view_today_in: true,
        can_view_today_out: true,
        // Phase 4: Workforce permissions
        can_view_own_schedule: true,
        can_enter_timesheet: false,
        can_view_own_hours: true,
        can_clock_in_out: true,
        // Compensation
        hourly_rate: '',
      });
    }
    setShowModal(true);
  };


  const handleReactivate = async (userId: string) => {
    try {
      setSubmitting(true);
      setError(null);
      await adminApi.reactivateEmployee(userId);
      setShowModal(false);
      setShowReactivateModal(false);
      setReactivateUserId(null);
      setEditingEmployee(null);
      await loadData();
      // Invitation URL is printed to backend terminal only
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate shop_ids is not empty
    if (formData.shop_ids.length === 0) {
      setError('Employee must be assigned to at least one shop');
      return;
    }

    // Validate access code length
    if (formData.access_code && formData.access_code.length !== 6) {
      setError('Access code must be exactly 6 characters');
      return;
    }

    // Validate phone number (10-11 digits)
    if (formData.phone) {
      const phoneValidation = validators.phone(formData.phone);
      if (!phoneValidation.isValid) {
        setError(phoneValidation.error || 'Please enter a valid phone number');
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        name_first: formData.name_first,
        name_last: formData.name_last,
        email: formData.email,
        phone: formData.phone,
        shop_ids: formData.shop_ids,
        role: 'EMPLOYEE' as const,
        use_permission_sets: usePermissionSets,
      };

      // Include permission set IDs OR individual permissions based on mode
      if (usePermissionSets) {
        payload.permission_set_ids = selectedSetIds;
      } else {
        payload.permissions = {
          // Original permissions
          can_redeem_tickets: formData.can_redeem_tickets,
          can_onboard_customers: formData.can_onboard_customers,
          can_view_shop_reports: formData.can_view_shop_reports,
          can_view_limited_customer_info: true,
          can_edit_own_profile: true,
          // Extended permissions
          can_access_dashboard: formData.can_access_dashboard,
          can_view_customers: formData.can_view_customers,
          can_add_customers: formData.can_add_customers,
          can_edit_customers: formData.can_edit_customers,
          can_delete_customers: formData.can_delete_customers,
          can_view_all_reports: formData.can_view_all_reports,
          can_view_kiosk_reports: formData.can_view_kiosk_reports,
          can_view_shift_reports: formData.can_view_shift_reports,
          can_view_machine_reports: formData.can_view_machine_reports,
          can_view_machine_readings: formData.can_view_machine_readings,
          can_add_machine_readings: formData.can_add_machine_readings,
          can_view_shift_summary: formData.can_view_shift_summary,
          // Phase 3: Field-level visibility
          can_view_total_in: formData.can_view_total_in,
          can_view_total_out: formData.can_view_total_out,
          can_view_today_in: formData.can_view_today_in,
          can_view_today_out: formData.can_view_today_out,
          // Phase 4: Workforce permissions
          can_view_own_schedule: formData.can_view_own_schedule,
          can_enter_timesheet: formData.can_enter_timesheet,
          can_view_own_hours: formData.can_view_own_hours,
          can_clock_in_out: formData.can_clock_in_out,
        };
      }

      // Only include access_code if it has a value
      if (formData.access_code) {
        payload.access_code = formData.access_code;
      }

      let employeeId: string;
      if (editingEmployee) {
        await adminApi.updateEmployee(editingEmployee.id, payload);
        employeeId = editingEmployee.id;
      } else {
        const result = await adminApi.createEmployee(payload) as { id: string };
        employeeId = result.id;
      }

      // Save pay rate if provided
      if (formData.hourly_rate && parseFloat(formData.hourly_rate) > 0) {
        try {
          await workforceApi.createPayRate({
            employee: employeeId,
            hourly_rate: formData.hourly_rate,
            effective_from: new Date().toISOString().split('T')[0], // Today's date
          });
        } catch (payRateErr) {

          // Don't fail the whole operation, employee is already saved
        }
      }

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      // Check for disabled user collision
      if (err.status_code === 409 && (err as any).code === 'DISABLED_USER_EXISTS') {
        const userId = (err as any).user_id;
        setReactivateUserId(userId);
        setShowReactivateModal(true);
        return;
      }
      // Extract error message - check field_errors first for specific field validation errors
      let errorMessage = 'Failed to save employee';
      if (err.field_errors) {
        // Get the first field error message
        const firstField = Object.keys(err.field_errors)[0];
        if (firstField && err.field_errors[firstField]) {
          const fieldError = err.field_errors[firstField];
          errorMessage = Array.isArray(fieldError) ? fieldError[0] : fieldError;
        }
      } else if (err.error && err.error !== 'Error') {
        errorMessage = err.error;
      } else if (err.message && err.message !== 'Error') {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (employeeId: string) => {
    const confirmed = await confirm({
      title: 'Delete Employee',
      message: 'Are you sure you want to delete this employee?',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await adminApi.deleteEmployee(employeeId);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete employee');
    }
  };

  const handleResendInvitation = async (employee: User) => {
    try {
      setResendingInvite(employee.id);
      setError(null);
      const response = await adminApi.resendEmployeeInvitation(employee.id);

      // Show invitation URL in console for local development
      if (response.invitation_url) {



        setSuccess(`Invitation resent! For local dev, check console for the invitation URL.`);
      } else {
        setSuccess('Invitation resent successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend invitation');
    } finally {
      setResendingInvite(null);
    }
  };

  const toggleShop = (shopId: string) => {
    setFormData((prev) => ({
      ...prev,
      shop_ids: prev.shop_ids.includes(shopId)
        ? prev.shop_ids.filter((id) => id !== shopId)
        : [...prev.shop_ids, shopId],
    }));
  };

  // Helper: Check if all permissions in a group are enabled
  const areAllInGroupEnabled = (group: PermissionGroup): boolean => {
    return group.permissions.every((perm) => !!formData[perm.key]);
  };

  // Helper: Toggle all permissions in a group
  const toggleAllInGroup = (group: PermissionGroup, enabled: boolean) => {
    setFormData((prev) => {
      const updates: Partial<EmployeeFormData> = {};
      group.permissions.forEach((perm) => {
        (updates as any)[perm.key] = enabled;
      });
      return { ...prev, ...updates };
    });
  };

  // Bulk action handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === employees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employees.map(e => e.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedIds.size === 0) return;

    const actionLabels = { activate: 'activate', deactivate: 'deactivate', delete: 'delete' };
    const confirmed = await confirm({
      title: `Bulk ${actionLabels[action].charAt(0).toUpperCase() + actionLabels[action].slice(1)}`,
      message: `Are you sure you want to ${actionLabels[action]} ${selectedIds.size} employee(s)?`,
      confirmText: actionLabels[action].charAt(0).toUpperCase() + actionLabels[action].slice(1),
      variant: action === 'delete' ? 'danger' : 'warning',
    });
    if (!confirmed) return;

    try {
      setBulkLoading(true);
      setError(null);
      const result = await adminApi.bulkEmployeeAction(Array.from(selectedIds), action);
      setSelectedIds(new Set());
      await loadData();
      setSuccess(`${result.processed} employee(s) ${action}d successfully.${result.skipped > 0 ? ` ${result.skipped} skipped.` : ''}`);
    } catch (err: any) {
      setError(err.message || `Failed to ${action} employees`);
    } finally {
      setBulkLoading(false);
    }
  };

  const columns: any[] = [
    {
      key: 'select',
      header: '',
      width: '4%',
      hideOnMobile: true,
      render: (employee: User, _index: number, isHeader?: boolean) => (
        isHeader ? (
          <input
            type="checkbox"
            checked={employees.length > 0 && selectedIds.size === employees.length}
            onChange={toggleSelectAll}
            className="rounded text-primary-600 focus:ring-primary-500"
          />
        ) : (
          <input
            type="checkbox"
            checked={selectedIds.has(employee.id)}
            onChange={() => toggleSelectOne(employee.id)}
            className="rounded text-slate-700 focus:ring-slate-500"
          />
        )
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (employee: User) => `${employee.name_first} ${employee.name_last}`,
      width: '15%',
      isPrimaryOnMobile: true,
    },
    { key: 'email', header: 'Email', width: '20%' },
    { key: 'phone', header: 'Phone', width: '12%' },
    {
      key: 'access_code',
      header: 'Access Code',
      width: '12%',
      render: (employee: User) => (
        employee.access_code ? (
          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
            {employee.access_code}
          </span>
        ) : (
          <span className="text-gray-400">Not set</span>
        )
      ),
    },
    {
      key: 'last_login_at',
      header: 'Last Login',
      width: '12%',
      render: (employee: User) =>
        employee.last_login_at ? (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(employee.last_login_at).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-gray-400">Never</span>
        ),
    },
    {
      key: 'assigned_shops',
      header: 'Shop Assigned',
      width: '15%',
      render: (employee: User) => {
        const assignedShops = employee.assigned_shops || [];
        if (assignedShops.length === 0) {
          return <span className="text-gray-400">No shops assigned</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {assignedShops.map((shop) => (
              <Badge key={shop.shop_id} variant="primary">
                {shop.shop_name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '12%',
      render: (employee: User) => (
        <div className="flex items-center gap-1">
          <EditButton onClick={() => handleOpenModal(employee)} tooltip="Edit Employee" />
          <DeleteButton onClick={() => handleDelete(employee.id)} tooltip="Delete Employee" />
        </div>
      ),
    },
  ];

  if (loading) return <Loading message="Loading employees..." />;

  return (
    <PageContainer>
      <div className="mt-6">
        <PageHeader
          title="Employee Management"
          subtitle="Manage employee accounts and permissions"
          actions={
            <Button
              onClick={() => handleOpenModal()}
              size="sm"
              className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md text-xs min-[350px]:text-sm whitespace-nowrap px-3 min-[350px]:px-4"
            >
              Add Employee
            </Button>
          }
        />
      </div>

      {error && !showModal && <ErrorBanner message={error} onClose={() => setError(null)} />}
      {success && (
        <div className="my-3 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-green-800">{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="mt-2">
        {/* Bulk Action Toolbar */}
        {selectedIds.size > 0 && (
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-t-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-medium text-slate-800">
              {selectedIds.size} employee(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => handleBulkAction('deactivate')}
                disabled={bulkLoading}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs"
              >
                {bulkLoading ? 'Processing...' : 'Deactivate'}
              </Button>
              <Button
                size="sm"
                onClick={() => handleBulkAction('delete')}
                disabled={bulkLoading}
                className="bg-red-500 hover:bg-red-600 text-white text-xs"
              >
                {bulkLoading ? 'Processing...' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
        <Table
          columns={columns}
          data={employees}
          keyExtractor={(employee) => employee.id}
          emptyMessage="No employees found. Add your first employee to get started."
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
          loading={loading}
        />
      </div>

      {/* Reactivation Confirmation Modal - higher z-index to appear above other modals */}
      <div className="relative z-[60]">
        <Modal
          isOpen={showReactivateModal}
          onClose={() => setShowReactivateModal(false)}
          title="Reactivate Employee?"
          size="xl"
        >
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-md border border-amber-200">
              <p className="text-amber-800 text-sm">
                An employee record with this email already exists but is currently disabled.
              </p>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Would you like to reactivate this employee? This will restore their account and they will need to set their password again via invitation link.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                variant="secondary"
                onClick={() => setShowReactivateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => reactivateUserId && handleReactivate(reactivateUserId)}
                loading={submitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Yes, Reactivate
              </Button>
            </div>
          </div>
        </Modal>
      </div>

      {/* Add/Edit Employee Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        size="xl"
      >
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert inside the form */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.name_first}
                onChange={(e) => setFormData({ ...formData, name_first: e.target.value })}
                required
                fullWidth
              />
              <Input
                label="Last Name"
                value={formData.name_last}
                onChange={(e) => setFormData({ ...formData, name_last: e.target.value })}
                required
                fullWidth
              />
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                fullWidth
              />
              <PhoneInput
                name="phone"
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                countryCode={formData.country_code}
                onCountryChange={(code) => setFormData({ ...formData, country_code: code })}
                required
                placeholder="0000000000"
              />
            </div>
          </div>

          {/* Access Code */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Kiosk Access Code (Optional)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Optional 6-character code for kiosk login. Click "Generate" to create one, or leave blank.
            </p>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Access Code"
                  value={formData.access_code}
                  onChange={(e) => {
                    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    if (value.length > 6) value = value.slice(0, 6);
                    setFormData({ ...formData, access_code: value });
                  }}
                  placeholder="e.g., ABC123"
                  maxLength={6}
                  className="font-mono text-lg tracking-wider"
                  fullWidth
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setFormData({ ...formData, access_code: generateAccessCode() })}
                className="mb-0"
              >
                Generate
              </Button>
            </div>
            {formData.access_code && formData.access_code.length !== 6 && (
              <p className="text-xs text-amber-600 mt-1">Access code must be exactly 6 characters</p>
            )}
          </div>

          {/* Compensation */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Compensation</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Set the hourly pay rate for this employee. Required for payroll generation.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Hourly Rate ($)"
                type="number"
                step="0.01"
                min="0"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                placeholder="e.g., 15.00"
                fullWidth
              />
              <div className="flex items-end pb-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">per hour</span>
              </div>
            </div>
          </div>

          {/* Shop Assignments */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Shop Access <span className="text-red-500">*</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Select at least one shop this employee can access
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
              {Array.isArray(shops) && shops.map((shop) => (
                <label key={shop.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.shop_ids.includes(shop.id)}
                    onChange={() => toggleShop(shop.id)}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{shop.name}</span>
                </label>
              ))}
            </div>
            {formData.shop_ids.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs font-medium text-blue-900 mb-2">Shop Assigned:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.shop_ids.map(shopId => {
                    const shop = shops.find(s => s.id === shopId);
                    return shop ? (
                      <Badge key={shopId} variant="primary">
                        {shop.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            {formData.shop_ids.length === 0 && (
              <p className="text-xs text-red-500 mt-1">At least one shop is required</p>
            )}
          </div>

          {/* Permissions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Permissions</h3>

            {/* Permission Mode Toggle */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-md mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="permissionMode"
                  checked={usePermissionSets}
                  onChange={() => setUsePermissionSets(true)}
                  className="mr-2 text-primary-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Permission Sets</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="permissionMode"
                  checked={!usePermissionSets}
                  onChange={() => setUsePermissionSets(false)}
                  className="mr-2 text-primary-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Individual Permissions</span>
              </label>
            </div>

            {/* Permission Sets Mode */}
            {usePermissionSets && (
              <div className="space-y-3 mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Select one or more permission sets. Permissions combine from all selected sets.</p>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {permissionSets.map((set) => (
                    <label key={set.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSetIds.includes(set.id)}
                        onChange={() => {
                          if (selectedSetIds.includes(set.id)) {
                            setSelectedSetIds(selectedSetIds.filter(id => id !== set.id));
                          } else {
                            setSelectedSetIds([...selectedSetIds, set.id]);
                          }
                        }}
                        className="rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{set.name}</span>
                      {set.is_system && <Badge variant="info" className="text-xs">System</Badge>}
                      <span className="text-xs text-gray-400">({set.permission_count} permissions)</span>
                    </label>
                  ))}
                  {permissionSets.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No permission sets available. Create one in Settings.</p>
                  )}
                </div>
                {selectedSetIds.length > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-xs font-medium text-green-900 mb-2">Assigned Permission Sets:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSetIds.map(setId => {
                        const set = permissionSets.find(s => s.id === setId);
                        return set ? (
                          <Badge key={setId} variant="success" className="flex items-center gap-1">
                            {set.name}
                            <button
                              type="button"
                              onClick={() => setSelectedSetIds(selectedSetIds.filter(id => id !== setId))}
                              className="ml-1 text-green-600 hover:text-green-800"
                            >
                              ×
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Individual Permissions Mode */}
            {!usePermissionSets && (
              <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-md p-4">
                {EMPLOYEE_PERMISSION_GROUPS.map((group) => (
                  <div key={group.name} className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-slate-600 pb-2">
                      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        {group.name}
                      </h4>
                      <Switch
                        checked={areAllInGroupEnabled(group)}
                        onChange={(checked) => toggleAllInGroup(group, checked)}
                        label="All"
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {group.permissions.map((perm) => (
                        <Switch
                          key={perm.key}
                          checked={!!formData[perm.key]}
                          onChange={(checked) => setFormData({ ...formData, [perm.key]: checked })}
                          label={perm.label}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-slate-700">
            {/* Resend Invitation - only show when editing an employee who hasn't activated yet */}
            <div>
              {editingEmployee && editingEmployee.status === 'INVITED' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleResendInvitation(editingEmployee)}
                  loading={resendingInvite === editingEmployee.id}
                >
                  Resend Invitation
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                {editingEmployee ? 'Update Employee' : 'Create Employee'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
