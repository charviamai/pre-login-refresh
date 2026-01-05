import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { KioskProvider } from './contexts/KioskContext';
import { ThemeProvider } from './shared/context/ThemeContext';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { ConfirmProvider } from './shared/components/ui';

// PWA Dependencies - Critical for stability
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { ToastProvider } from './shared/context/ToastContext';
import { useApiErrorToasts } from './shared/hooks/useApiErrorToasts';

// Services - must be imported eagerly
import { apiClient } from './shared/utils/api-client';
import { offlineService } from './shared/services/offlineService';
import { OfflineIndicator } from './shared/components/ui/OfflineIndicator';
import { InstallPrompt } from './shared/components/ui/InstallPrompt';

// Performance Monitoring - Tier 3 Optimization
import { initPerformanceMonitoring } from './shared/services/performanceMonitor';

// Initialize performance monitoring
initPerformanceMonitoring();

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

// Placeholder components - to be implemented in Phase 2
const UnauthorizedPage = () => <div className="p-8"><h1 className="text-2xl font-bold text-red-600">Unauthorized</h1><p className="mt-4">You do not have permission to access this page.</p></div>;
const NotFoundPage = () => <div className="p-8"><h1 className="text-2xl font-bold">404 - Not Found</h1><p className="mt-4">The page you are looking for does not exist.</p></div>;

// ==========================================
// LAZY LOADED COMPONENTS - Route-based Code Splitting
// ==========================================

// Public & Auth Pages (loaded together as they share a chunk)
const LandingPage = lazy(() => import('./features/public/LandingPage').then(m => ({ default: m.LandingPage })));
const SignupPage = lazy(() => import('./features/public/SignupPage').then(m => ({ default: m.SignupPage })));
const SignupSuccessPage = lazy(() => import('./features/public/SignupSuccessPage').then(m => ({ default: m.SignupSuccessPage })));
const LoginPage = lazy(() => import('./features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const SetPasswordPage = lazy(() => import('./features/auth/SetPasswordPage').then(m => ({ default: m.SetPasswordPage })));
const ChangePasswordPage = lazy(() => import('./features/auth/ChangePasswordPage').then(m => ({ default: m.ChangePasswordPage })));
const ManageLoginAccessPage = lazy(() => import('./features/auth/ManageLoginAccessPage').then(m => ({ default: m.ManageLoginAccessPage })));
const ForgotPasswordPage = lazy(() => import('./features/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./features/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const TermsOfService = lazy(() => import('./features/public/TermsOfService').then(m => ({ default: m.TermsOfService })));
const PrivacyPolicy = lazy(() => import('./features/public/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));

// Client Admin Portal - Core Layout
const ClientLayout = lazy(() => import('./features/client/layout/ClientLayout').then(m => ({ default: m.ClientLayout })));
const ClientDashboard = lazy(() => import('./features/client/Dashboard').then(m => ({ default: m.ClientDashboard })));

// Client Admin - Shops
const ShopsList = lazy(() => import('./features/client/shops/ShopsList').then(m => ({ default: m.ShopsList })));
const ShopSettings = lazy(() => import('./features/client/shops/ShopSettings').then(m => ({ default: m.ShopSettings })));

// Client Admin - Devices
const DevicesList = lazy(() => import('./features/client/devices/DevicesList').then(m => ({ default: m.DevicesList })));

// Client Admin - Users
const EmployeesList = lazy(() => import('./features/client/users/EmployeesList').then(m => ({ default: m.EmployeesList })));
const AdminUsersList = lazy(() => import('./features/client/users/AdminUsersList').then(m => ({ default: m.AdminUsersList })));

// Client Admin - Machines
const MachinesList = lazy(() => import('./features/client/machines/MachinesList').then(m => ({ default: m.MachinesList })));
const MachineReadings = lazy(() => import('./features/client/machines/MachineReadings').then(m => ({ default: m.MachineReadings })));

// Client Admin - Reports & Settings
const ReportsPage = lazy(() => import('./features/client/reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./features/client/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PermissionSetsPage = lazy(() => import('./features/client/settings/PermissionSetsPage').then(m => ({ default: m.PermissionSetsPage })));
const AuditLogPage = lazy(() => import('./features/client/settings/AuditLogPage').then(m => ({ default: m.AuditLogPage })));

// Client Admin - Workforce & Customers
const WorkforcePage = lazy(() => import('./features/client/workforce/WorkforcePage').then(m => ({ default: m.WorkforcePage })));
const CustomersList = lazy(() => import('./features/client/customers/CustomersList').then(m => ({ default: m.CustomersList })));
const DeletedCustomersList = lazy(() => import('./features/client/customers/DeletedCustomersList').then(m => ({ default: m.DeletedCustomersList })));

// Client Admin - Support
const MyIncidents = lazy(() => import('./features/client/support/MyIncidents').then(m => ({ default: m.MyIncidents })));
const IncidentDetail = lazy(() => import('./features/client/support/IncidentDetail').then(m => ({ default: m.IncidentDetail })));

// Employee Portal
const ShopSelection = lazy(() => import('./features/employee/ShopSelection').then(m => ({ default: m.ShopSelection })));
const EmployeeDashboard = lazy(() => import('./features/employee/EmployeeDashboard').then(m => ({ default: m.EmployeeDashboard })));
const TicketRedemption = lazy(() => import('./features/employee/TicketRedemption').then(m => ({ default: m.TicketRedemption })));
const EmployeeLayout = lazy(() => import('./features/employee/EmployeeLayout').then(m => ({ default: m.EmployeeLayout })));
const EmployeeSchedule = lazy(() => import('./features/employee/EmployeeSchedule').then(m => ({ default: m.EmployeeSchedule })));
const EmployeeHours = lazy(() => import('./features/employee/EmployeeHours').then(m => ({ default: m.EmployeeHours })));
const EmployeeTimesheet = lazy(() => import('./features/employee/EmployeeTimesheet').then(m => ({ default: m.EmployeeTimesheet })));

const KioskPortal = lazy(() => import('./features/kiosk/KioskPortal').then(m => ({ default: m.KioskPortal })));

// Platform Admin Portal
const PlatformDashboard = lazy(() => import('./features/platform/PlatformDashboard').then(m => ({ default: m.PlatformDashboard })));
const PlatformTenants = lazy(() => import('./features/platform/PlatformTenants').then(m => ({ default: m.PlatformTenants })));
const PlatformIncidents = lazy(() => import('./features/platform/PlatformIncidents').then(m => ({ default: m.PlatformIncidents })));
const PlatformIncidentDetail = lazy(() => import('./features/platform/PlatformIncidentDetail').then(m => ({ default: m.PlatformIncidentDetail })));

// Initialize offline service
offlineService.setRequestHandler(apiClient);

// Import ServiceWorkerUpdateHandler
import { ServiceWorkerUpdateHandler } from './shared/components/ServiceWorkerUpdateHandler';

/**
 * Component to integrate API error toasts
 * Must be inside ToastProvider
 */
function ApiErrorToastIntegration() {
  useApiErrorToasts();
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <ToastProvider>
          <ApiErrorToastIntegration />
          <ServiceWorkerUpdateHandler />
          <AuthProvider>
            <ConfirmProvider>
              <KioskProvider>
                <BrowserRouter>
                  <OfflineIndicator />
                  <InstallPrompt />
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      {/* Public Routes */}
                      {/* Dev mode: show landing page at root, Preview/Production: show login at root */}
                      <Route
                        path="/"
                        element={import.meta.env.DEV ? <LandingPage /> : <LoginPage />}
                      />
                      <Route path="/signup/" element={<SignupPage />} />
                      <Route path="/signup/success" element={<SignupSuccessPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/set-password" element={<SetPasswordPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/unauthorized" element={<UnauthorizedPage />} />

                      {/* Client Admin Portal */}
                      <Route
                        path="/client"
                        element={
                          <ProtectedRoute allowedRoles={['CLIENT_ADMIN']}>
                            <ClientLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route path="dashboard" element={<ClientDashboard />} />
                        <Route path="shops" element={
                          <ProtectedRoute allowedRoles={['CLIENT_ADMIN']} requiredPermission="can_manage_shops">
                            <ShopsList />
                          </ProtectedRoute>
                        } />
                        <Route path="shops/:shopId/settings" element={
                          <ProtectedRoute allowedRoles={['CLIENT_ADMIN']} requiredPermission="can_manage_shops">
                            <ShopSettings />
                          </ProtectedRoute>
                        } />
                        <Route path="devices" element={
                          <ProtectedRoute allowedRoles={['CLIENT_ADMIN']} requiredPermission="can_manage_devices">
                            <DevicesList />
                          </ProtectedRoute>
                        } />
                        <Route path="employees" element={
                          <ProtectedRoute allowedRoles={['CLIENT_ADMIN']} requiredPermission="can_manage_employees">
                            <EmployeesList />
                          </ProtectedRoute>
                        } />
                        <Route path="admins" element={
                          <ProtectedRoute allowedRoles={['CLIENT_ADMIN']} requiredPermission="can_manage_admin_users">
                            <AdminUsersList />
                          </ProtectedRoute>
                        } />
                        <Route path="customers" element={
                          <ProtectedRoute allowedRoles={['CLIENT_ADMIN']} requiredPermission="can_manage_customers">
                            <CustomersList />
                          </ProtectedRoute>
                        } />
                        <Route path="customers/deleted" element={
                          <ProtectedRoute allowedRoles={['CLIENT_ADMIN']} requiredPermission="can_manage_customers">
                            <DeletedCustomersList />
                          </ProtectedRoute>
                        } />
                        <Route path="machines" element={
                          <ProtectedRoute allowedRoles={['CLIENT_ADMIN']} requiredPermissions={['can_manage_machines', 'can_manage_machine_readings']} requireAll={false}>
                            <MachinesList />
                          </ProtectedRoute>
                        } />
                        <Route path="machines/readings" element={
                          <ProtectedRoute allowedRoles={['CLIENT_ADMIN']} requiredPermission="can_manage_machine_readings">
                            <MachineReadings />
                          </ProtectedRoute>
                        } />
                        <Route path="reports" element={
                          <ProtectedRoute allowedRoles={['CLIENT_ADMIN']} requiredPermission="can_view_reports">
                            <ReportsPage />
                          </ProtectedRoute>
                        } />
                        <Route path="reports/:tab" element={
                          <ProtectedRoute allowedRoles={['CLIENT_ADMIN']} requiredPermission="can_view_reports">
                            <ReportsPage />
                          </ProtectedRoute>
                        } />
                        <Route path="workforce" element={
                          <ProtectedRoute allowedRoles={['CLIENT_ADMIN']} requiredPermission="can_manage_employees">
                            <WorkforcePage />
                          </ProtectedRoute>
                        } />
                        <Route path="workforce/:tab" element={
                          <ProtectedRoute allowedRoles={['CLIENT_ADMIN']} requiredPermission="can_manage_employees">
                            <WorkforcePage />
                          </ProtectedRoute>
                        } />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="settings/permission-sets" element={
                          <ProtectedRoute allowedRoles={['CLIENT_ADMIN']} requiredPermission="can_manage_admin_users">
                            <PermissionSetsPage />
                          </ProtectedRoute>
                        } />
                        <Route path="settings/audit-logs" element={
                          <ProtectedRoute allowedRoles={['CLIENT_ADMIN']} requiredPermission="can_manage_admin_users">
                            <AuditLogPage />
                          </ProtectedRoute>
                        } />
                        <Route path="change-password" element={<ChangePasswordPage />} />
                        <Route path="manage-login-access" element={<ManageLoginAccessPage />} />
                        <Route path="support" element={<MyIncidents />} />
                        <Route path="support/:id" element={<IncidentDetail />} />
                      </Route>

                      {/* Employee Portal */}
                      <Route
                        path="/employee/select-shop"
                        element={
                          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                            <ShopSelection />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/employee/dashboard"
                        element={
                          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                            <EmployeeLayout>
                              <EmployeeDashboard />
                            </EmployeeLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/employee/tickets"
                        element={
                          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                            <EmployeeLayout>
                              <TicketRedemption />
                            </EmployeeLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/employee/customers"
                        element={
                          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                            <EmployeeLayout>
                              <CustomersList />
                            </EmployeeLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/employee/reports"
                        element={
                          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                            <EmployeeLayout>
                              <ReportsPage />
                            </EmployeeLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/employee/reports/:tab"
                        element={
                          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                            <EmployeeLayout>
                              <ReportsPage />
                            </EmployeeLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/employee/machine-readings"
                        element={
                          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                            <EmployeeLayout>
                              <MachineReadings />
                            </EmployeeLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/employee/schedule"
                        element={
                          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                            <EmployeeLayout>
                              <EmployeeSchedule />
                            </EmployeeLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/employee/hours"
                        element={
                          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                            <EmployeeLayout>
                              <EmployeeHours />
                            </EmployeeLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/employee/timesheet"
                        element={
                          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                            <EmployeeLayout>
                              <EmployeeTimesheet />
                            </EmployeeLayout>
                          </ProtectedRoute>
                        }
                      />

                      {/* Kiosk Portal (No user authentication, device token only) */}
                      <Route
                        path="/kiosk/login"
                        element={
                          <ProtectedRoute requiresAuth={false}>
                            <KioskPortal />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/kiosk"
                        element={
                          <ProtectedRoute requiresAuth={false}>
                            <KioskPortal />
                          </ProtectedRoute>
                        }
                      />

                      {/* Company Admin Portal */}
                      <Route
                        path="/internal-admin/dashboard"
                        element={
                          <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
                            <PlatformDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/internal-admin/tenants"
                        element={
                          <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
                            <PlatformTenants />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/internal-admin/incidents"
                        element={
                          <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
                            <PlatformIncidents />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/internal-admin/incidents/:id"
                        element={
                          <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
                            <PlatformIncidentDetail />
                          </ProtectedRoute>
                        }
                      />

                      {/* Catch-all redirect */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </KioskProvider>
            </ConfirmProvider>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
