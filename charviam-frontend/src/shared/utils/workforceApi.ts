/**
 * Workforce API Service
 * Handles all workforce-related API calls (schedules, timesheet, payroll)
 */

import { apiClient } from './api-client';

// ============================================================================
// TYPES
// ============================================================================

export interface WorkforceSettings {
  id: string;
  tenant: string;
  shop: string | null;
  shop_name: string | null;
  timesheet_mode: 'MANUAL' | 'CLOCK_IN_OUT';
  clock_mode: 'KIOSK' | 'MANUAL';
  auto_approve_timesheet: boolean;
  auto_submit_timesheet: boolean;
  overtime_enabled: boolean;
  overtime_threshold_hours: string;
  overtime_rate_multiplier: string;
  payroll_cycle: 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY';
  created_at: string;
  updated_at: string;
}

export interface ShiftSchedule {
  id: string;
  tenant: string;
  employee: string;
  employee_name: string;
  shop: string;
  shop_name: string;
  date: string;
  start_time: string;
  end_time: string;
  scheduled_hours: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface TimesheetEntry {
  id: string;
  tenant: string;
  employee: string;
  employee_name: string;
  shop: string;
  shop_name: string;
  date: string;
  entry_mode: 'MANUAL' | 'CLOCK';
  start_time: string | null;
  end_time: string | null;
  hours_worked: string;
  clock_in: string | null;
  clock_out: string | null;
  submitted_by: string;
  submitted_by_name: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes: string;
  shift_schedule: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeePayRate {
  id: string;
  tenant: string;
  employee: string;
  employee_name: string;
  hourly_rate: string;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollEntry {
  id: string;
  payroll_run: string;
  employee: string;
  employee_name: string;
  regular_hours: string;
  overtime_hours: string;
  total_hours: string;
  hourly_rate: string;
  regular_pay: string;
  overtime_pay: string;
  gross_pay: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollRun {
  id: string;
  tenant: string;
  shop: string | null;  // Shop ID this payroll is for (null = all shops)
  shop_name: string | null;  // Shop name for display
  period_type: 'DAILY' | 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY';
  period_start: string;
  period_end: string;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  total_hours: string;
  total_amount: string;
  generated_by: string;
  generated_by_name: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  notes: string;
  entries: PayrollEntry[];
  entry_count: number;
  created_at: string;
  updated_at: string;
}

export interface HoursReportData {
  group_by: 'employee' | 'shop' | 'date';
  filters: {
    shop_id: string | null;
    employee_id: string | null;
    date_from: string | null;
    date_to: string | null;
    status: string | null;
  };
  data: Array<{
    employee_id?: string;
    employee_name?: string;
    shop_id?: string;
    shop_name?: string;
    date?: string;
    total_hours: string;
  }>;
}

export interface WeekScheduleResponse {
  week_start: string;
  week_end: string;
  schedules: ShiftSchedule[];
}

export interface ClockStatusResponse {
  clocked_in: boolean;
  clock_in_time?: string;
  entry_id?: string;
  shop_id?: string;
}

export interface Employee {
  id: string;
  email: string;
  name_first: string;
  name_last: string;
  full_name: string;
  role: string;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_overnight: boolean;
  is_active: boolean;
  display_order: number;
}

export interface TimesheetPeriod {
  id: string;
  tenant: string;
  employee: string;
  employee_name: string;
  shop: string;
  shop_name: string;
  period_type: 'DAILY' | 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY';
  period_start: string;
  period_end: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  total_hours: string;
  submitted_at: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejection_reason: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// WORKFORCE API
// ============================================================================

export const workforceApi = {
  // Employees (for dropdowns)
  getEmployees: (shopId?: string) =>
    apiClient.get<Employee[]>('/workforce/employees/', { 
      params: shopId ? { shop_id: shopId } : {} 
    }),
    
  // Shift Templates (from existing admin API)
  getShiftTemplates: () =>
    apiClient.get<ShiftTemplate[]>('/admin/shift-templates/'),
  // Settings
  getSettings: (shopId?: string) =>
    apiClient.get<WorkforceSettings>('/workforce/settings/current/', { params: shopId ? { shop_id: shopId } : {} }),
  
  updateSettings: (id: string, data: Partial<WorkforceSettings>) =>
    apiClient.patch<WorkforceSettings>(`/workforce/settings/${id}/`, data),
  
  createSettings: (data: Partial<WorkforceSettings>) =>
    apiClient.post<WorkforceSettings>('/workforce/settings/', data),

  // Shift Schedules
  getSchedules: (params?: { shop_id?: string; employee_id?: string; date_from?: string; date_to?: string }) =>
    apiClient.get<ShiftSchedule[]>('/workforce/schedules/', { params }),
  
  getWeekSchedule: (date?: string, shopId?: string) =>
    apiClient.get<WeekScheduleResponse>('/workforce/schedules/week/', { 
      params: { date, shop_id: shopId } 
    }),
  
  createSchedule: (data: Partial<ShiftSchedule>) =>
    apiClient.post<ShiftSchedule>('/workforce/schedules/', data),
  
  updateSchedule: (id: string, data: Partial<ShiftSchedule>) =>
    apiClient.patch<ShiftSchedule>(`/workforce/schedules/${id}/`, data),
  
  deleteSchedule: (id: string) =>
    apiClient.delete(`/workforce/schedules/${id}/`),

  copyWeekSchedule: (data: { source_week_start: string; target_week_start: string; shop: string }) =>
    apiClient.post<{ message: string; created_count: number; skipped_count: number }>('/workforce/schedules/copy_week/', data),

  bulkAssignSchedules: (data: { employee_ids: string[]; shop: string; date: string; start_time: string; end_time: string }) =>
    apiClient.post<{ message: string; created: Array<{ id: string; employee_id: string; employee_name: string }>; skipped: Array<{ employee_id: string; reason: string }>; errors: Array<{ employee_id: string; error: string }> }>(
      '/workforce/schedules/bulk_assign/', 
      data
    ),

  bulkDeleteSchedules: (ids: string[]) =>
    apiClient.post<{ message: string; deleted: number }>(
      '/workforce/schedules/bulk_delete/',
      { ids }
    ),

  // Timesheet
  getTimesheetEntries: (params?: { 
    shop_id?: string; 
    employee_id?: string; 
    date_from?: string; 
    date_to?: string;
    status?: string;
    page?: number;
  }) =>
    apiClient.get<TimesheetEntry[]>('/workforce/timesheet/', { params }),
  
  createTimesheetEntry: (data: Partial<TimesheetEntry>) =>
    apiClient.post<TimesheetEntry>('/workforce/timesheet/', data),
  
  updateTimesheetEntry: (id: string, data: Partial<TimesheetEntry>) =>
    apiClient.patch<TimesheetEntry>(`/workforce/timesheet/${id}/`, data),
  
  deleteTimesheetEntry: (id: string) =>
    apiClient.delete(`/workforce/timesheet/${id}/`),
  
  approveTimesheetEntry: (id: string) =>
    apiClient.post<TimesheetEntry>(`/workforce/timesheet/${id}/approve/`),
  
  rejectTimesheetEntry: (id: string, notes?: string) =>
    apiClient.post<TimesheetEntry>(`/workforce/timesheet/${id}/reject/`, { notes }),
  
  clockIn: (shopId: string) =>
    apiClient.post<TimesheetEntry>('/workforce/timesheet/clock_in/', { shop_id: shopId }),
  
  clockOut: () =>
    apiClient.post<TimesheetEntry>('/workforce/timesheet/clock_out/'),
  
  getClockStatus: () =>
    apiClient.get<ClockStatusResponse>('/workforce/timesheet/current_status/'),

  getTimesheetHistory: (params?: { employee_id?: string; date_from?: string; date_to?: string }) =>
    apiClient.get<Array<{
      id: string;
      timestamp: string;
      action: string;
      user: string;
      resource_id: string;
      details: Record<string, unknown>;
    }>>('/workforce/timesheet/history/', { params }),

  // Timesheet Periods (pay period approval workflow)
  getTimesheetPeriods: (params?: { shop_id?: string; employee_id?: string; status?: string }) =>
    apiClient.get<TimesheetPeriod[]>('/workforce/timesheet-periods/', { params }),

  getPendingApprovals: (shopId?: string) =>
    apiClient.get<TimesheetPeriod[]>('/workforce/timesheet-periods/pending_approvals/', {
      params: shopId ? { shop_id: shopId } : {}
    }),

  submitTimesheetPeriod: (data: {
    employee_id: string;
    shop_id: string;
    period_type: string;
    period_start: string;
    period_end: string;
  }) =>
    apiClient.post<TimesheetPeriod>('/workforce/timesheet-periods/submit_period/', data),

  approveTimesheetPeriod: (id: string) =>
    apiClient.post<TimesheetPeriod>(`/workforce/timesheet-periods/${id}/approve_period/`),

  rejectTimesheetPeriod: (id: string, rejectionReason?: string) =>
    apiClient.post<TimesheetPeriod>(`/workforce/timesheet-periods/${id}/reject_period/`, {
      rejection_reason: rejectionReason
    }),

  // Pay Rates
  getPayRates: (employeeId?: string) =>
    apiClient.get<EmployeePayRate[]>('/workforce/pay-rates/', { 
      params: employeeId ? { employee_id: employeeId } : {} 
    }),
  
  getCurrentPayRate: (employeeId: string) =>
    apiClient.get<EmployeePayRate>('/workforce/pay-rates/current/', { 
      params: { employee_id: employeeId } 
    }),
  
  createPayRate: (data: Partial<EmployeePayRate>) =>
    apiClient.post<EmployeePayRate>('/workforce/pay-rates/', data),
  
  updatePayRate: (id: string, data: Partial<EmployeePayRate>) =>
    apiClient.patch<EmployeePayRate>(`/workforce/pay-rates/${id}/`, data),

  bulkUpdatePayRates: (data: { employee_ids: string[]; hourly_rate: string; effective_from?: string }) =>
    apiClient.post<{ message: string; updated: number; errors: Array<{ employee_id: string; error: string }> }>(
      '/workforce/pay-rates/bulk_update/',
      data
    ),

  // Payroll
  getPayrollRuns: (params?: { status?: string; period_type?: string; page?: number }) =>
    apiClient.get<PayrollRun[]>('/workforce/payroll/', { params }),
  
  getPayrollRun: (id: string) =>
    apiClient.get<PayrollRun>(`/workforce/payroll/${id}/`),
  
  generatePayroll: (data: { period_type: string; period_start: string; period_end: string; shop_id?: string; employee_id?: string; force?: boolean }) =>
    apiClient.post<PayrollRun>('/workforce/payroll/generate/', data),
  
  getPendingGeneration: (shopId?: string) =>
    apiClient.get<{
      count: number;
      results: Array<{
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
      }>;
    }>('/workforce/payroll/pending_generation/', { params: shopId ? { shop_id: shopId } : {} }),
  
  approvePayroll: (id: string) =>
    apiClient.post<PayrollRun>(`/workforce/payroll/${id}/approve/`),
  
  markPayrollPaid: (id: string) =>
    apiClient.post<PayrollRun>(`/workforce/payroll/${id}/mark_paid/`),

  deletePayrollRun: (id: string) =>
    apiClient.delete(`/workforce/payroll/${id}/`),

  revertPayrollToDraft: (id: string) =>
    apiClient.post<PayrollRun>(`/workforce/payroll/${id}/revert_to_draft/`),

  // Hours Report
  getHoursReport: (params: {
    group_by: 'employee' | 'shop' | 'date';
    shop_id?: string;
    employee_id?: string;
    date_from?: string;
    date_to?: string;
    status?: string;
  }) =>
    apiClient.get<HoursReportData>('/workforce/hours-report/', { params }),
};
