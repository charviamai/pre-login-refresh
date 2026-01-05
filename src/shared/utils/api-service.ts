import { apiClient } from './api-client';
import type {
  // Auth
  LoginCredentials,
  AuthTokens,
  AuthUser,
  PasswordResetRequest as _PasswordResetRequest,
  PasswordResetConfirm,
  // Signup
  SignupRequest,
  SignupResponse,
  ApproveSignupRequestPayload,
  RejectSignupRequestPayload,
  // Kiosk
  ActivationResponse,
  EmployeeLoginResponse,
  SuspendTenantPayload,
  // Tenant
  Tenant,
  // Shop
  Shop,
  ShopSettings,
  MatchGameSettings,
  TermsContent,
  SpinConfigPartition,
  // Device
  Device,
  CreateDeviceRequest,
  // User
  User,
  // Customer
  Customer,
  CustomerRegistration,
  CustomerEligibility,
  BiometricIdentification,
  // Ticket
  TicketLookup,
  SpinResult,
  SpinEligibilityResult,
  MatchResult,
  // Shift
  ShiftSummary,
  // Dashboard
  DashboardStats,
  PlatformStats,
  ReportFilters,
  ReportSummary,
  ReportJob,
  ReportFormat,
  PlaysReportResponse,
  // Kiosk
  KioskConfig,
  // Permission Sets
  PermissionSet,
  PermissionSetListItem,
  CreatePermissionSetRequest,
  // Common
  PaginatedResponse,
} from '../types';

// ============================================================================
// PUBLIC & AUTH APIs
// ============================================================================

export const authApi = {
  // Public signup
  signup: (data: SignupRequest) =>
    apiClient.post<SignupResponse>('/public/signup/', data),

  checkEmail: (email: string) =>
    apiClient.get<{ available: boolean; message: string }>('/public/email/check/', { params: { email } }),

  checkPhone: (phone: string, country: string = 'US') =>
    apiClient.get<{ available: boolean; phone_normalized?: string; message: string }>('/public/phone/check/', { params: { phone, country } }),

  checkSubdomain: (subdomain: string) =>
    apiClient.get<{ available: boolean }>(`/public/subdomain/check/?subdomain=${subdomain}`),

  // Authentication
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthTokens>('/auth/login/', credentials),

  getCurrentUser: () =>
    apiClient.get<AuthUser>('/auth/me/'),

  setPassword: (token: string, newPassword: string) =>
    apiClient.post('/auth/set-password/', { token, new_password: newPassword, confirm_password: newPassword }),

  verifySetPasswordToken: (token: string) =>
    apiClient.post<{ valid: boolean; message?: string }>('/auth/verify-set-password-token/', { token }),

  // Password reset
  requestPasswordReset: (email: string) =>
    apiClient.post<{ message: string }>('/auth/request-password-reset/', { email }),

  resetPassword: (data: PasswordResetConfirm) =>
    apiClient.post<{ message: string }>('/auth/reset-password/', {
      token: data.token,
      new_password: data.new_password,
      confirm_password: data.confirm_password
    }),

  verifyResetToken: (token: string) =>
    apiClient.post<{ valid: boolean; message?: string }>('/auth/verify-reset-token/', { token }),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthTokens>('/auth/refresh/', { refresh: refreshToken }),
};

// ============================================================================
// PLATFORM ADMIN APIs
// ============================================================================

export interface GetTenantsParams {
  page?: number;
  page_size?: number;
  status?: string;
  search?: string;
}

export const platformApi = {
  // Tenant management
  getTenants: (params?: GetTenantsParams) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    const queryString = queryParams.toString();
    return apiClient.get<PaginatedResponse<Tenant>>(
      `/platform/tenants/${queryString ? `?${queryString}` : ''}`
    );
  },

  // Dashboard stats
  getStats: () =>
    apiClient.get<PlatformStats>('/platform/stats/'),

  // Approve signup request (for pending tenants)
  approveSignupRequest: (tenantId: string, payload: ApproveSignupRequestPayload) =>
    apiClient.post(`/platform/tenants/${tenantId}/approve/`, payload),

  // Reject signup request (for pending tenants)
  rejectSignupRequest: (tenantId: string, payload: RejectSignupRequestPayload) =>
    apiClient.post(`/platform/tenants/${tenantId}/reject/`, payload),

  // Legacy methods (for backwards compatibility)
  approveTenant: (tenantId: string) =>
    apiClient.post(`/platform/tenants/${tenantId}/approve/`),

  rejectTenant: (tenantId: string) =>
    apiClient.post(`/platform/tenants/${tenantId}/reject/`),

  suspendTenant: (tenantId: string, payload?: SuspendTenantPayload) =>
    apiClient.post(`/platform/tenants/${tenantId}/suspend/`, payload),

  resumeTenant: (tenantId: string) =>
    apiClient.post(`/platform/tenants/${tenantId}/resume/`),
};

// ============================================================================
// CLIENT ADMIN APIs
// ============================================================================

export const adminApi = {
  // Dashboard (optional date filter YYYY-MM-DD and shop_id filter)
  getDashboard: (date?: string, shopId?: string) =>
    apiClient.get<DashboardStats>('/admin/dashboard/', {
      params: {
        ...(date && { date }),
        ...(shopId && shopId !== 'ALL' && { shop_id: shopId })
      }
    }),
  getDashboardRange: (start_date: string, end_date: string, shopId?: string) =>
    apiClient.get<DashboardStats>('/admin/dashboard/', {
      params: {
        start_date,
        end_date,
        ...(shopId && shopId !== 'ALL' && { shop_id: shopId })
      }
    }),

  // Shops
  getShops: (page?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    const queryString = params.toString();
    return apiClient.get<PaginatedResponse<Shop>>(`/admin/shops/${queryString ? `?${queryString}` : ''}`);
  },

  createShop: (data: Partial<Shop>) =>
    apiClient.post<Shop>('/admin/shops/', data),

  getShop: (shopId: string) =>
    apiClient.get<Shop>(`/admin/shops/${shopId}/`),

  updateShop: (shopId: string, data: Partial<Shop>) =>
    apiClient.put<Shop>(`/admin/shops/${shopId}/`, data),

  // Shop Settings
  getShopSettings: (shopId: string) =>
    apiClient.get<ShopSettings>(`/admin/shops/${shopId}/settings/`),

  updateShopSettings: (shopId: string, data: Partial<ShopSettings>) =>
    apiClient.put<ShopSettings>(`/admin/shops/${shopId}/settings/`, data),

  // Match Game Settings
  getMatchGameSettings: (shopId: string) =>
    apiClient.get<MatchGameSettings>(`/admin/shops/${shopId}/match-game-settings/`),

  updateMatchGameSettings: (shopId: string, data: Partial<MatchGameSettings>) =>
    apiClient.put<MatchGameSettings>(`/admin/shops/${shopId}/match-game-settings/`, data),

  // Terms Content
  getTerms: (shopId: string) =>
    apiClient.get<TermsContent>(`/admin/shops/${shopId}/terms/`),

  updateTerms: (shopId: string, data: Partial<TermsContent>) =>
    apiClient.put<TermsContent>(`/admin/shops/${shopId}/terms/`, data),

  // Spin Config
  getSpinPartitions: (shopId: string) =>
    apiClient.get<SpinConfigPartition[]>(`/admin/shops/${shopId}/spin-partitions/`),

  updateSpinPartitions: (shopId: string, partitions: Partial<SpinConfigPartition>[]) =>
    apiClient.put<SpinConfigPartition[]>(`/admin/shops/${shopId}/spin-partitions/`, { partitions }),

  // Spin Campaigns
  listCampaigns: (shopId: string) =>
    apiClient.get(`/admin/shops/${shopId}/spin-campaigns/`),

  getCampaign: (shopId: string, campaignId: string) =>
    apiClient.get(`/admin/shops/${shopId}/spin-campaigns/${campaignId}/`),

  createCampaign: (shopId: string, data: any) =>
    apiClient.post(`/admin/shops/${shopId}/spin-campaigns/`, data),

  updateCampaign: (shopId: string, campaignId: string, data: any) =>
    apiClient.patch(`/admin/shops/${shopId}/spin-campaigns/${campaignId}/`, data),

  deleteCampaign: (shopId: string, campaignId: string) =>
    apiClient.delete(`/admin/shops/${shopId}/spin-campaigns/${campaignId}/`),

  getCampaignAnalytics: (shopId: string, campaignId: string, params?: any) =>
    apiClient.get(`/admin/shops/${shopId}/spin-campaigns/${campaignId}/analytics/`, { params }),

  // Devices
  getDevices: (page?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    const queryString = params.toString();
    return apiClient.get<PaginatedResponse<Device>>(`/admin/devices/${queryString ? `?${queryString}` : ''}`);
  },

  createDevice: (data: CreateDeviceRequest) =>
    apiClient.post<Device>('/admin/devices/', data),

  updateDevice: (deviceId: string, data: Partial<Device>) =>
    apiClient.put<Device>(`/admin/devices/${deviceId}/`, data),

  activateDevice: (deviceId: string) =>
    apiClient.post(`/admin/devices/${deviceId}/activate/`),

  deactivateDevice: (deviceId: string) =>
    apiClient.post(`/admin/devices/${deviceId}/deactivate/`),
  deleteDevice: (deviceId: string) =>
    apiClient.delete(`/admin/devices/${deviceId}/`),

  // Device Employee Access
  getDeviceEmployeeAccess: (deviceId: string) =>
    apiClient.get<{
      device_id: string;
      device_name: string;
      shop_name: string;
      employees: Array<{
        employee_id: string;
        employee_name: string;
        employee_email: string;
        has_access: boolean;
        is_auto_assigned: boolean;
        admin_revoked: boolean;
      }>;
    }>(`/admin/devices/${deviceId}/employee-access/`),

  grantDeviceAccess: (deviceId: string, employeeId: string) =>
    apiClient.post(`/admin/devices/${deviceId}/grant-employee-access/`, { employee_id: employeeId }),

  revokeDeviceAccess: (deviceId: string, employeeId: string) =>
    apiClient.post(`/admin/devices/${deviceId}/revoke-employee-access/`, { employee_id: employeeId }),

  // Admin Users
  getAdminUsers: (page?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    const queryString = params.toString();
    return apiClient.get<PaginatedResponse<User>>(`/admin/admin-users/${queryString ? `?${queryString}` : ''}`);
  },

  createAdminUser: (data: Partial<User>) =>
    apiClient.post<User>('/admin/admin-users/', data),

  updateAdminUser: (userId: string, data: Partial<User>) =>
    apiClient.put<User>(`/admin/admin-users/${userId}/`, data),

  deleteAdminUser: (userId: string) =>
    apiClient.delete(`/admin/admin-users/${userId}/`),

  resendAdminInvitation: (userId: string) =>
    apiClient.post<{ message: string; invitation_url?: string }>(`/admin/admin-users/${userId}/resend_invitation/`),

  reactivateAdmin: (userId: string) =>
    apiClient.post<User>(`/admin/admin-users/${userId}/activate/`),

  // Employees
  getEmployees: (shopId?: string, page?: number) => {
    const params = new URLSearchParams();
    if (shopId) params.append('shop_id', shopId);
    if (page) params.append('page', String(page));
    const queryString = params.toString();
    return apiClient.get<PaginatedResponse<User>>(`/admin/employees/${queryString ? `?${queryString}` : ''}`);
  },

  createEmployee: (data: Partial<User>) =>
    apiClient.post<User>('/admin/employees/', data),

  updateEmployee: (userId: string, data: Partial<User>) =>
    apiClient.put<User>(`/admin/employees/${userId}/`, data),

  deleteEmployee: (userId: string) =>
    apiClient.delete(`/admin/employees/${userId}/`),

  resendEmployeeInvitation: (userId: string) =>
    apiClient.post<{ message: string; invitation_url?: string }>(`/admin/employees/${userId}/resend_invitation/`),

  reactivateEmployee: (userId: string) =>
    apiClient.post<User>(`/admin/employees/${userId}/activate/`),

  bulkEmployeeAction: (ids: string[], action: 'activate' | 'deactivate' | 'delete') =>
    apiClient.post<{ message: string; processed: number; skipped: number; errors: Array<{ id: string; error: string }> }>(
      '/admin/employees/bulk_action/',
      { ids, action }
    ),

  // Permission Sets
  getPermissionSets: () =>
    apiClient.get<PermissionSetListItem[]>('/admin/permission-sets/'),

  getPermissionSet: (setId: string) =>
    apiClient.get<PermissionSet>(`/admin/permission-sets/${setId}/`),

  createPermissionSet: (data: CreatePermissionSetRequest) =>
    apiClient.post<PermissionSet>('/admin/permission-sets/', data),

  updatePermissionSet: (setId: string, data: Partial<CreatePermissionSetRequest>) =>
    apiClient.put<PermissionSet>(`/admin/permission-sets/${setId}/`, data),

  deletePermissionSet: (setId: string) =>
    apiClient.delete(`/admin/permission-sets/${setId}/`),

  // Customers
  getCustomers: (shopId?: string, page?: number) => {
    const params = new URLSearchParams();
    if (shopId && shopId !== 'ALL') params.append('shop_id', shopId);
    if (page) params.append('page', String(page));
    const queryString = params.toString();
    return apiClient.get<PaginatedResponse<Customer>>(`/admin/customers/${queryString ? `?${queryString}` : ''}`);
  },

  createCustomer: (data: Partial<Customer>) =>
    apiClient.post<Customer>('/admin/customers/', data),

  updateCustomer: (customerId: string, data: Partial<Customer>) =>
    apiClient.put<Customer>(`/admin/customers/${customerId}/`, data),

  deleteCustomer: (customerId: string) =>
    apiClient.delete<{ message: string; deletion_type: 'hard' | 'soft' }>(`/admin/customers/${customerId}/`),

  getDeletedCustomers: (page?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    const queryString = params.toString();
    return apiClient.get<PaginatedResponse<Customer>>(`/admin/customers/deleted/${queryString ? `?${queryString}` : ''}`);
  },

  getDeletedCustomer: (customerId: string) =>
    apiClient.get<Customer>(`/admin/customers/${customerId}/deleted-detail/`),

  restoreCustomer: (customerId: string) =>
    apiClient.post<{ message: string; customer: Customer }>(`/admin/customers/${customerId}/restore/`),

  // Reports
  getReportSummary: (filters: ReportFilters) =>
    apiClient.get<ReportSummary>('/admin/reports/summary/', { params: filters }),

  getPlaysReport: (filters: ReportFilters) =>
    apiClient.get<PlaysReportResponse>('/admin/reports/plays/', { params: filters }),

  getShiftReport: (shiftId: string) =>
    apiClient.get<ShiftSummary>(`/admin/reports/shift/?shift_id=${shiftId}`),

  exportReport: (format: ReportFormat, filters: ReportFilters) =>
    apiClient.post<ReportJob>(`/admin/reports/export/${format.toLowerCase()}/`, filters),

  getReportJob: (jobId: string) =>
    apiClient.get<ReportJob>(`/admin/reports/jobs/${jobId}/`),
};

// ============================================================================
// EMPLOYEE APIs
// ============================================================================

export const employeeApi = {
  // Dashboard
  getDashboard: () =>
    apiClient.get('/employee/dashboard/'),

  // Dashboard Stats with date filter
  getDashboardStats: (shopId: string, dateFilter: 'today' | 'yesterday' | 'this_week' = 'today') =>
    apiClient.get<{
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
      shop: {
        id: string;
        name: string;
      };
    }>(`/workforce/dashboard-stats/?shop_id=${shopId}&date_filter=${dateFilter}`),

  // Shifts - using workforce timesheet endpoints
  getActiveShift: () =>
    apiClient.get<{ clocked_in: boolean; clock_in_time?: string; entry_id?: string; shop_id?: string }>('/workforce/timesheet/current_status/'),

  startShift: (shopId: string) =>
    apiClient.post('/workforce/timesheet/clock_in/', { shop_id: shopId }),

  endShift: () =>
    apiClient.post('/workforce/timesheet/clock_out/'),

  // Tickets - using workforce ticket endpoints
  lookupTicket: (code: string) =>
    apiClient.get<TicketLookup>(`/workforce/tickets/lookup/?code=${code}`),

  redeemTicket: (ticketId: string) =>
    apiClient.post<{ success: boolean; message: string; ticket_id: string; amount: number }>(
      `/workforce/tickets/${ticketId}/redeem/`
    ),

  cancelTicket: (ticketId: string, reason: string) =>
    apiClient.post<{ success: boolean; message: string; ticket_id: string }>(
      `/workforce/tickets/${ticketId}/cancel/`,
      { reason }
    ),

  // Customer info (limited)
  getCustomerActivity: (customerId: string) =>
    apiClient.get(`/employee/customers/${customerId}/recent-activity/`),
};

// ============================================================================
// KIOSK/TICKETS APIs
// ============================================================================

export const kioskApi = {
  // Activate with employee access code only
  // If employee has multiple devices, returns { requires_device_selection: true, devices: [...] }
  activateWithAccessCode: (accessCode: string, deviceId?: string) =>
    apiClient.post<ActivationResponse & { requires_device_selection?: boolean; devices?: Array<{ id: string; name: string; shop_name: string; code: string }> }>(
      '/kiosk/activate/',
      deviceId ? { access_code: accessCode, device_id: deviceId } : { access_code: accessCode }
    ),

  // Bootstrap
  getBootstrap: () =>
    apiClient.get<KioskConfig>('/kiosk/bootstrap/'),

  // Heartbeat
  sendHeartbeat: () =>
    apiClient.post('/kiosk/heartbeat/'),

  // Session status
  getSessionStatus: () =>
    apiClient.get<{ active: boolean }>('/kiosk/session-status/'),

  // Employee login with access code
  employeeLogin: (accessCode: string) =>
    apiClient.post<EmployeeLoginResponse>('/kiosk/employee-login/', { access_code: accessCode }),

  // Employee logout
  employeeLogout: () =>
    apiClient.post('/kiosk/employee-logout/'),

  // Customer identification (biometric)
  identify: (imageData: string) =>
    apiClient.post<BiometricIdentification>('/kiosk/identify/', { image: imageData }),

  // Customer lookup by phone
  lookupByPhone: (phone: string) =>
    apiClient.post<{ found: boolean; customer?: Customer; message?: string }>('/kiosk/customer-lookup/', { phone }),

  // Customer registration
  register: (data: CustomerRegistration) =>
    apiClient.post<Customer>('/kiosk/register/', data),

  // Eligibility
  getEligibility: (customerId: string) =>
    apiClient.get<CustomerEligibility>(`/kiosk/customer/${customerId}/eligibility/`),

  // Spin
  spin: (customerId: string) =>
    apiClient.post<SpinResult>('/kiosk/spin/', { customer_id: customerId }),

  // Match
  match: (customerId: string, amount: number) =>
    apiClient.post<MatchResult>('/kiosk/match/', { customer_id: customerId, amount }),

  // Match Eligibility Check (cooldown)
  matchEligibility: (customerId: string) =>
    apiClient.get<{
      can_play: boolean;
      next_available_at?: string;
      cooldown_remaining_seconds?: number;
      last_ticket_status?: string;
      last_ticket_barcode?: string;
      verification_required?: boolean;
      cooldown_hours?: number;
    }>(`/kiosk/match/eligibility/?customer_id=${customerId}`),

  // New Spin Campaign Endpoints
  spinEligibility: (customerId: string) =>
    apiClient.get<SpinEligibilityResult>(`/kiosk/spin/eligibility/?customer_id=${customerId}`),

  spinExecute: (customerId: string) =>
    apiClient.post<SpinResult>('/kiosk/spin/execute/', { customer_id: customerId }),
};

// ============================================================================
// MACHINES APIs
// ============================================================================

export interface MachineType {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Machine {
  id: string;
  machine_number: number;
  name: string;
  machine_type: string;
  machine_type_name: string;
  notes?: string;
  last_reading_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MachineReading {
  id: string;
  machine: string;
  machine_name: string;
  machine_number: number;
  date: string;
  total_in: string;
  total_out: string;
  today_in: string;
  today_out: string;
  balance: string;
  recorded_by?: string;
  recorded_by_name?: string;
  created_at: string;
}

export interface ReadingsForDate {
  date: string;
  last_reading_datetime: string | null;
  machines: Array<{
    machine_id: string;
    machine_number: number;
    machine_name: string;
    machine_type: string;
    total_in: string | null;
    total_out: string | null;
    previous_total_in: string;
    previous_total_out: string;
    today_in: string | null;
    today_out: string | null;
    has_reading: boolean;
    entered_by_name?: string | null;
  }>;
  employee_name?: string | null;
}

export interface BulkReadingsPayload {
  date: string;
  shift_start?: string;
  shift_end?: string;
  employee_access_code: string;
  readings: Array<{
    machine_id: string;
    total_in: string;
    total_out: string;
  }>;
}

export interface BulkReadingsResponse {
  message: string;
  date: string;
  shift_start?: string;
  shift_end?: string;
  readings_count: number;
  total_today_in: string;
  total_today_out: string;
  balance: string;
  entered_by?: string;
}

export interface NextShiftTimeResponse {
  date: string;
  next_shift_start: string | null;
  shifts_today: number;
  is_first_shift: boolean;
}

export const machinesApi = {
  // Machine Types
  getMachineTypes: () =>
    apiClient.get<MachineType[]>('/admin/machine-types/'),

  createMachineType: (data: { name: string; description?: string }) =>
    apiClient.post<MachineType>('/admin/machine-types/', data),

  updateMachineType: (typeId: string, data: Partial<MachineType>) =>
    apiClient.put<MachineType>(`/admin/machine-types/${typeId}/`, data),

  deleteMachineType: (typeId: string) =>
    apiClient.delete(`/admin/machine-types/${typeId}/`),

  // Machines
  getMachines: (page?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    const queryString = params.toString();
    return apiClient.get<PaginatedResponse<Machine>>(`/admin/machines/${queryString ? `?${queryString}` : ''}`);
  },

  getMachine: (machineId: string) =>
    apiClient.get<Machine>(`/admin/machines/${machineId}/`),

  createMachine: (data: {
    machine_number?: number;
    machine_type_id?: string;
    new_type_name?: string;
  }) =>
    apiClient.post<Machine>('/admin/machines/', data),

  updateMachine: (machineId: string, data: Partial<Machine> & { machine_type_id?: string }) =>
    apiClient.patch<Machine>(`/admin/machines/${machineId}/`, data),

  deleteMachine: (machineId: string) =>
    apiClient.delete(`/admin/machines/${machineId}/`),

  getNextMachineNumber: (params?: { shop_id?: string }) =>
    apiClient.get<{ next_number: number }>('/admin/machines/next_machine_number/', { params }),

  // Machine Readings
  getReadings: (params?: { date?: string; machine_id?: string }) =>
    apiClient.get<MachineReading[]>('/admin/machine-readings/', { params }),

  getReadingsByDate: (date: string, shiftStart?: string, shopId?: string) =>
    apiClient.get<ReadingsForDate>(`/admin/machine-readings/by-date/?date=${date}${shiftStart ? `&shift_start=${shiftStart}` : ''}${shopId ? `&shop_id=${shopId}` : ''}`),

  getNextShiftTime: (date: string) =>
    apiClient.get<NextShiftTimeResponse>(`/admin/machine-readings/next-shift-time/?date=${date}`),

  submitBulkReadings: (data: BulkReadingsPayload) =>
    apiClient.post<BulkReadingsResponse>('/admin/machine-readings/submit_daily_readings/', data),

  getLatestReading: (machineId: string) =>
    apiClient.get<MachineReading>(`/admin/machine-readings/${machineId}/latest_reading/`),

  checkOverlap: (shiftStart: string, shiftEnd: string, shopId?: string) =>
    apiClient.get<OverlapCheckResponse>(`/admin/machine-readings/check-overlap/?shift_start=${shiftStart}&shift_end=${shiftEnd}${shopId ? `&shop_id=${shopId}` : ''}`),

  getMachineReport: (fromDate: string, toDate: string, shopId?: string) =>
    apiClient.get<MachineReportResponse>(`/admin/machine-readings/report/?from_date=${fromDate}&to_date=${toDate}${shopId ? `&shop_id=${shopId}` : ''}`),

  getCustomShifts: (date: string, shopId?: string) =>
    apiClient.get<{ date: string; custom_shifts: Array<{ shift_start: string; shift_end: string; start_time: string; end_time: string; employee_name: string | null }> }>(
      `/admin/machine-readings/custom-shifts/?date=${date}${shopId ? `&shop_id=${shopId}` : ''}`
    ),

  // Shift Templates
  getShiftTemplates: (activeOnly?: boolean) =>
    apiClient.get<ShiftTemplate[] | { results: ShiftTemplate[] }>(`/admin/shift-templates/${activeOnly !== undefined ? `?active=${activeOnly}` : ''}`),

  createShiftTemplate: (data: CreateShiftTemplatePayload) =>
    apiClient.post<ShiftTemplate>('/admin/shift-templates/', data),

  updateShiftTemplate: (templateId: string, data: UpdateShiftTemplatePayload) =>
    apiClient.put<ShiftTemplate>(`/admin/shift-templates/${templateId}/`, data),

  deleteShiftTemplate: (templateId: string) =>
    apiClient.delete(`/admin/shift-templates/${templateId}/`),
};

// Types for Shift Templates
export interface ShiftTemplate {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_overnight: boolean;
  is_active: boolean;
  display_order: number;
  display_time: string;
  created_at: string;
  updated_at: string;
}

export interface CreateShiftTemplatePayload {
  name: string;
  start_time: string;
  end_time: string;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateShiftTemplatePayload {
  name?: string;
  start_time?: string;
  end_time?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface OverlapCheckResponse {
  has_overlap: boolean;
  message: string;
  existing_shift_start?: string;
  existing_shift_end?: string;
}

export interface MachineReportResponse {
  from_date: string;
  to_date: string;
  machines: Array<{
    machine_id: string;
    machine_number: number;
    machine_name: string;
    machine_type: string;
    total_in: string;
    total_out: string;
    net_profit: string;
  }>;
  summary: {
    total_in: string;
    total_out: string;
    net_profit: string;
  };
  error?: string;
  message?: string;
  earliest_date?: string;
}

// ============================================================================
// SUPPORT/INCIDENT APIs
// ============================================================================

export interface Incident {
  id: string;
  incident_number: string;
  subject: string;
  description: string;
  category: 'LOGIN' | 'BILLING' | 'TECHNICAL' | 'ACCOUNT' | 'FEATURE' | 'KIOSK' | 'INTEGRATION' | 'OTHER';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  tenant_name?: string;
  raised_by_name?: string;
  assigned_to_name?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  resolution_notes?: string;
  resolved_by_name?: string;
  resolved_at?: string;
  message_count?: number;
  messages?: IncidentMessage[];
  attachments?: IncidentAttachment[];
  created_at: string;
  updated_at: string;
}

export interface IncidentMessage {
  id: string;
  incident: string;
  sender_name: string;
  message_type: 'TENANT_REPLY' | 'PLATFORM_REPLY' | 'INTERNAL_NOTE' | 'SYSTEM';
  content: string;
  is_from_email: boolean;
  attachments?: IncidentAttachment[];
  created_at: string;
}

export interface IncidentAttachment {
  id: string;
  incident: string;
  message?: string;
  file: string;
  filename: string;
  file_size: number;
  content_type: string;
  uploaded_by_name?: string;
  created_at: string;
}

export interface CreateIncidentRequest {
  subject: string;
  description: string;
  category: Incident['category'];
  priority?: Incident['priority'];
}

export interface IncidentFilters {
  status?: string;
  priority?: string;
  category?: string;
  page?: number;
  search?: string;
}

export const supportApi = {
  // Tenant Admin - List my incidents
  getIncidents: (filters?: IncidentFilters) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.search) params.append('search', filters.search);
    const queryString = params.toString();
    return apiClient.get<PaginatedResponse<Incident>>(`/support/incidents/${queryString ? `?${queryString}` : ''}`);
  },

  // Tenant Admin - Create incident
  createIncident: (data: CreateIncidentRequest) =>
    apiClient.post<Incident>('/support/incidents/', data),

  // Tenant Admin - Get incident detail
  getIncident: (incidentId: string) =>
    apiClient.get<Incident>(`/support/incidents/${incidentId}/`),

  // Tenant Admin - Add message to incident
  addMessage: (incidentId: string, content: string) =>
    apiClient.post<IncidentMessage>(`/support/incidents/${incidentId}/messages/`, { content }),

  // Tenant Admin - Upload attachment
  uploadAttachment: (incidentId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<IncidentAttachment>(
      `/support/incidents/${incidentId}/attachments/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
};

export const platformSupportApi = {
  // Platform Admin - List all incidents
  getIncidents: (filters?: IncidentFilters & { assigned_to?: string; tenant?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to);
    if (filters?.tenant) params.append('tenant', filters.tenant);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.search) params.append('search', filters.search);
    const queryString = params.toString();
    return apiClient.get<PaginatedResponse<Incident>>(`/platform/incidents/${queryString ? `?${queryString}` : ''}`);
  },

  // Platform Admin - Get incident detail
  getIncident: (incidentId: string) =>
    apiClient.get<Incident>(`/platform/incidents/${incidentId}/`),

  // Platform Admin - Update incident (status, priority, assignee)
  updateIncident: (incidentId: string, data: Partial<{ status: string; priority: string; assigned_to: string }>) =>
    apiClient.patch<Incident>(`/platform/incidents/${incidentId}/`, data),

  // Platform Admin - Reply to incident (sends email to tenant)
  replyToIncident: (incidentId: string, content: string) =>
    apiClient.post<IncidentMessage>(`/platform/incidents/${incidentId}/reply/`, { content }),

  // Platform Admin - Add internal note (visible to platform only, triggers notification)
  addNote: (incidentId: string, content: string) =>
    apiClient.post<IncidentMessage>(`/platform/incidents/${incidentId}/notes/`, { content }),

  // Platform Admin - Resolve incident
  resolveIncident: (incidentId: string, resolutionNotes: string) =>
    apiClient.post<Incident>(`/platform/incidents/${incidentId}/resolve/`, { resolution_notes: resolutionNotes }),

  // Platform Admin - Close incident
  closeIncident: (incidentId: string) =>
    apiClient.post<Incident>(`/platform/incidents/${incidentId}/close/`),
};

