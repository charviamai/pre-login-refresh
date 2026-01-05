import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Modal, Badge, Input } from '../../shared/components/ui';
import { Table } from '../../shared/components/ui/Table';
import { PageContainer } from '../../shared/components/layout/PageContainer';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Loading } from '../../shared/components/Loading';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { platformApi } from '../../shared/utils/api-service';
import { useAuth } from '../../contexts/AuthContext';
import type { Tenant, TenantStatus } from '../../shared/types';

const PAGE_SIZE = 25;
const STATUS_FILTERS: Array<{ label: string; value: TenantStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Deleted', value: 'DELETED' },
];

const STATUS_BADGE_VARIANTS: Record<TenantStatus, 'success' | 'warning' | 'danger' | 'default'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  SUSPENDED: 'danger',
  DELETED: 'default',
};

export const PlatformTenants: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TenantStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ count: number; next: string | null; previous: string | null }>({
    count: 0,
    next: null,
    previous: null,
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  const fetchTenants = useCallback(
    async (pageToLoad: number) => {
      try {
        setLoading(true);
        setError(null);
        const response = await platformApi.getTenants({
          page: pageToLoad,
          page_size: PAGE_SIZE,
          status: filterStatus === 'ALL' ? undefined : filterStatus,
          search: searchQuery ? searchQuery : undefined,
        });
        setTenants(response.results);
        setPagination({
          count: response.count,
          next: response.next,
          previous: response.previous,
        });
      } catch (err: any) {
        setError(getErrorMessage(err, 'Failed to load tenants'));
      } finally {
        setLoading(false);
      }
    },
    [filterStatus, searchQuery]
  );

  // Fetch global status counts (only when not searching, as search filters the results)
  const fetchStatusCounts = useCallback(async () => {
    if (searchQuery) {
      // When searching, don't show status counts as they would be misleading
      setStatusCounts({});
      return;
    }

    try {
      const statuses: TenantStatus[] = ['PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED'];
      const counts: Record<string, number> = {};

      // Fetch count for each status with minimal page_size to get the total count
      await Promise.all(
        statuses.map(async (status) => {
          try {
            const response = await platformApi.getTenants({
              page: 1,
              page_size: 1,
              status,
            });
            counts[status] = response.count;
          } catch (err) {
            // If a status fetch fails, set count to 0
            counts[status] = 0;
          }
        })
      );

      setStatusCounts(counts);
    } catch (err) {
      // If fetching counts fails, just don't show them
      setStatusCounts({});
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchTenants(page);
  }, [fetchTenants, page]);

  useEffect(() => {
    setPage(1);
  }, [filterStatus, searchQuery]);

  // Fetch status counts when component mounts or search query changes
  useEffect(() => {
    fetchStatusCounts();
  }, [fetchStatusCounts]);

  const totalPages = Math.max(1, Math.ceil((pagination.count || 0) / PAGE_SIZE));

  const handleStatusChange = (status: TenantStatus | 'ALL') => {
    setFilterStatus(status);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && page > 1) {
      setPage(page - 1);
      return;
    }
    if (direction === 'next' && page < totalPages) {
      setPage(page + 1);
    }
  };

  const handleViewDetails = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowDetailsModal(true);
  };

  const handleApproveTenant = async (tenantId: string) => {
    if (!confirm('Are you sure you want to approve this signup request? This will send a welcome email and create the first shop.')) return;

    setActionLoading(true);
    try {
      await platformApi.approveSignupRequest(tenantId, {
        send_email: true,
        auto_create_first_shop: true,
      });
      await fetchTenants(page);
      await fetchStatusCounts();
      setShowDetailsModal(false);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to approve signup request'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectTenant = async (tenantId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setActionLoading(true);
    try {
      await platformApi.rejectSignupRequest(tenantId, { reason });
      await fetchTenants(page);
      await fetchStatusCounts();
      setShowDetailsModal(false);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to reject signup request'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendTenant = async (tenantId: string) => {
    const reason = prompt('Enter suspension reason:');
    if (!reason) return;

    setActionLoading(true);
    try {
      await platformApi.suspendTenant(tenantId, { reason });
      await fetchTenants(page);
      await fetchStatusCounts();
      setShowDetailsModal(false);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to suspend tenant'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeTenant = async (tenantId: string) => {
    setActionLoading(true);
    try {
      await platformApi.resumeTenant(tenantId);
      await fetchTenants(page);
      await fetchStatusCounts();
      setShowDetailsModal(false);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to resume tenant'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (typeof err === 'object' && err !== null) {
      const apiErr = err as { error?: string; message?: string };
      return apiErr.error || apiErr.message || fallback;
    }
    return fallback;
  };

  const formatStatusLabel = (status: string) =>
    status
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const columns = [
    {
      key: 'name',
      header: 'Tenant',
      render: (tenant: Tenant) => (
        <div>
          <p className="font-semibold text-gray-900">{tenant.name}</p>
          <p className="text-sm text-gray-600">{tenant.full_domain}</p>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Primary Contact',
      render: (tenant: Tenant) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{tenant.primary_contact_name}</p>
          <p className="text-sm text-gray-600">{tenant.primary_contact_email}</p>
          <p className="text-xs text-gray-500">{tenant.primary_contact_phone || '—'}</p>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan / Usage',
      render: (tenant: Tenant) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{tenant.plan}</p>
          <p className="text-xs text-gray-600">
            Shops: {tenant.shops_count ?? 0} · Users: {tenant.users_count ?? 0} · Devices:{' '}
            {tenant.devices_count ?? 0}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (tenant: Tenant) => (
        <Badge variant={STATUS_BADGE_VARIANTS[tenant.status]}>
          {formatStatusLabel(tenant.status)}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (tenant: Tenant) => (
        <span className="text-sm text-gray-600">
          {new Date(tenant.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (tenant: Tenant) => (
        <Button size="sm" variant="outline" onClick={() => handleViewDetails(tenant)}>
          View Details
        </Button>
      ),
    },
  ];

  if (loading) return <Loading message="Loading tenants..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container-custom flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ArcadeX-Platform : <span className="text-primary-600">{user?.email || 'admin'}</span>
            </h1>
            <p className="text-sm text-gray-600">Tenant Management</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => navigate('/internal-admin/dashboard')}>
              Dashboard
            </Button>
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
          title="Tenant Management"
          subtitle="Review and manage all tenant accounts"
        />

        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleStatusChange(value)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${filterStatus === value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
              >
                {label}
                {value !== 'ALL' && (
                  <span className="ml-2 text-xs">
                    ({statusCounts[value] ?? 0})
                  </span>
                )}
              </button>
            ))}
          </div>

          <form className="flex w-full max-w-md items-center gap-2" onSubmit={handleSearchSubmit}>
            <Input
              name="tenant-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name, email, or domain"
              fullWidth
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
            {searchQuery && (
              <Button type="button" variant="secondary" onClick={handleClearSearch}>
                Clear
              </Button>
            )}
          </form>
        </div>

        <Card>
          <Table
            columns={columns}
            data={tenants}
            keyExtractor={(tenant) => tenant.id}
            emptyMessage="No tenants found matching the selected filter."
          />
        </Card>

        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-600">
            Showing {tenants.length} of {pagination.count} tenants
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => handlePageChange('prev')}>
              Previous
            </Button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages || totalPages === 0}
              onClick={() => handlePageChange('next')}
            >
              Next
            </Button>
          </div>
        </div>

        {/* Tenant Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Tenant Details"
          size="xl"
        >
          {selectedTenant && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedTenant.name}
                </h3>
                <Badge variant={STATUS_BADGE_VARIANTS[selectedTenant.status]}>
                  {formatStatusLabel(selectedTenant.status)}
                </Badge>
              </div>

              {/* Client Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Client Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-gray-600">Contact Name</p>
                    <p className="font-medium text-gray-900">{selectedTenant.primary_contact_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedTenant.primary_contact_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">
                      {selectedTenant.primary_contact_phone || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Domain</p>
                    <p className="font-medium text-gray-900 break-words">{selectedTenant.full_domain}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Login URL</p>
                    <a
                      href={selectedTenant.login_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary-600 hover:underline break-words"
                    >
                      {selectedTenant.login_url}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Plan</p>
                    <p className="font-medium text-gray-900">{selectedTenant.plan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Auto-approve new shops</p>
                    <p className="font-medium text-gray-900">
                      {selectedTenant.auto_approve_new_shops ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedTenant.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedTenant.approved_at && (
                    <div>
                      <p className="text-sm text-gray-600">Approved At</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedTenant.approved_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedTenant.suspended_at && (
                    <div>
                      <p className="text-sm text-gray-600">Suspended At</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedTenant.suspended_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Usage Snapshot */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Usage Snapshot
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-gray-600">
                    Shops:{' '}
                    <span className="font-semibold text-gray-900">
                      {selectedTenant.shops_count ?? 0}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Users:{' '}
                    <span className="font-semibold text-gray-900">
                      {selectedTenant.users_count ?? 0}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Devices:{' '}
                    <span className="font-semibold text-gray-900">
                      {selectedTenant.devices_count ?? 0}
                    </span>
                  </p>
                </div>
              </div>

              {/* Account Activity */}
              {selectedTenant.last_login_at && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Account Activity
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Last Login</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedTenant.last_login_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Actions</h4>
                <div className="flex flex-wrap gap-3">
                  {selectedTenant.status === 'PENDING' && (
                    <>
                      <Button
                        onClick={() => handleApproveTenant(selectedTenant.id)}
                        loading={actionLoading}
                      >
                        Approve Tenant
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleRejectTenant(selectedTenant.id)}
                        loading={actionLoading}
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {selectedTenant.status === 'ACTIVE' && (
                    <Button
                      variant="danger"
                      onClick={() => handleSuspendTenant(selectedTenant.id)}
                      loading={actionLoading}
                    >
                      Suspend Tenant
                    </Button>
                  )}

                  {selectedTenant.status === 'SUSPENDED' && (
                    <Button onClick={() => handleResumeTenant(selectedTenant.id)} loading={actionLoading}>
                      Resume Tenant
                    </Button>
                  )}

                  <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </PageContainer>
    </div>
  );
};
