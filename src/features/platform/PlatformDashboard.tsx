import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '../../shared/components/ui';
import { PageContainer } from '../../shared/components/layout/PageContainer';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Loading } from '../../shared/components/Loading';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { platformApi } from '../../shared/utils/api-service';
import { useAuth } from '../../contexts/AuthContext';
import type { PlatformStats } from '../../shared/types';

export const PlatformDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [derivedCounts, setDerivedCounts] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (typeof err === 'object' && err !== null) {
      const apiErr = err as { error?: string; message?: string };
      return apiErr.error || apiErr.message || fallback;
    }
    return fallback;
  };

  const deriveCountsFromTenants = async () => {
    try {
      const [allTenants, activeTenants, pendingTenants, suspendedTenants] = await Promise.all([
        platformApi.getTenants({ page: 1, page_size: 1 }),
        platformApi.getTenants({ page: 1, page_size: 1, status: 'ACTIVE' }),
        platformApi.getTenants({ page: 1, page_size: 1, status: 'PENDING' }),
        platformApi.getTenants({ page: 1, page_size: 1, status: 'SUSPENDED' }),
      ]);

      setDerivedCounts({
        total: allTenants.count,
        active: activeTenants.count,
        pending: pendingTenants.count,
        suspended: suspendedTenants.count,
      });
    } catch (deriveErr: any) {
      setError(getErrorMessage(deriveErr, 'Failed to derive tenant metrics'));
    }
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await platformApi.getStats();
      setStats(data);
    } catch (err: any) {
      setStats(null);
      // Silently fall back to derived counts without showing error
      await deriveCountsFromTenants();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalTenantsValue = stats?.total_tenants ?? derivedCounts.total;
  const activeTenantsValue = stats?.active_tenants ?? derivedCounts.active;
  const pendingTenantsValue = stats?.pending_approval ?? derivedCounts.pending;
  const suspendedTenantsValue = derivedCounts.suspended;
  const recentActivity = stats?.recent_activity ?? [];
  const showRevenueCard = typeof stats?.total_revenue === 'number';

  if (loading) return <Loading message="Loading platform dashboard..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container-custom flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ArcadeX-Platform : <span className="text-primary-600">{user?.email || 'admin'}</span>
            </h1>
            <p className="text-sm text-gray-600">
              Welcome, {user?.name_first} {user?.name_last}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="secondary" size="sm" onClick={() => navigate('/login?switch=true')}>
              Switch Account
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <PageContainer>
        <PageHeader
          title="Platform Overview"
          subtitle="Monitor and manage all tenants across the platform"
        />

        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {totalTenantsValue}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-primary-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Tenants</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {activeTenantsValue}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-1">
                      {pendingTenantsValue}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-yellow-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {showRevenueCard ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-3xl font-bold text-primary-600 mt-1">
                        ${stats?.total_revenue?.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-primary-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Suspended Tenants</p>
                      <p className="text-3xl font-bold text-red-600 mt-1">
                        {suspendedTenantsValue}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                      <svg
                        className="w-6 h-6 text-primary-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Manage Tenants</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        View and approve tenant applications
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/internal-admin/tenants')}>
                    View Tenants
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Analytics</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Platform-wide usage and performance metrics
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" disabled>
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tenant Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, idx) => (
                    <div
                      key={`${activity.tenant_name}-${activity.timestamp}-${idx}`}
                      className="flex items-center justify-between py-3 border-b last:border-b-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{activity.tenant_name}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            activity.type === 'signup'
                              ? 'info'
                              : activity.type === 'approved'
                                ? 'success'
                                : 'default'
                          }
                        >
                          {activity.type}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    {stats ? 'No recent activity' : 'Activity feed will appear once the metrics service is enabled.'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      </PageContainer>
    </div>
  );
};
