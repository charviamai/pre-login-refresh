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
import { useAuth } from '../../../contexts/AuthContext';
import type { User, Shop, AdminPermissions } from '../../../shared/types';
import { EditButton, DeleteButton } from '../../../shared/components/ActionIcons';
import { validators } from '../../../shared/utils/validators';

interface AdminFormData {
  name_first: string;
  name_last: string;
  email: string;
  phone: string;
  country_code: string;
  shop_ids: string[];
  // New permission structure
  can_manage_shops: boolean;
  can_manage_devices: boolean;
  can_manage_employees: boolean;
  can_manage_admin_users: boolean;
  can_manage_customers: boolean;
  can_manage_machines: boolean;
  can_manage_machine_readings: boolean;
  can_view_reports: boolean;
  is_owner: boolean;
}

export const AdminUsersList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const confirm = useConfirm();
  const [admins, setAdmins] = useState<User[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendingInvite, setResendingInvite] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-scroll to top of modal when error occurs
  useEffect(() => {
    if (error && formRef.current && showModal) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [error, showModal]);

  // URL-based pagination state
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 25;

  const [formData, setFormData] = useState<AdminFormData>({
    name_first: '',
    name_last: '',
    email: '',
    phone: '',
    country_code: 'US',
    shop_ids: [],
    can_manage_shops: false,
    can_manage_devices: false,
    can_manage_employees: false,
    can_manage_admin_users: false,
    can_manage_customers: false,
    can_manage_machines: false,
    can_manage_machine_readings: false,
    can_view_reports: false,
    is_owner: false,
  });

  useEffect(() => {
    loadData(initialPage);
  }, []);

  const loadData = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const [adminsResponse, shopsData] = await Promise.all([
        adminApi.getAdminUsers(page),
        adminApi.getShops(),
      ]);
      // Handle paginated response
      const adminData = adminsResponse as any;
      if (adminData?.results) {
        setAdmins(adminData.results);
        setTotalCount(adminData.count || 0);
        setTotalPages(Math.ceil((adminData.count || 0) / PAGE_SIZE));
      } else {
        setAdmins(Array.isArray(adminsResponse) ? adminsResponse : []);
        setTotalCount(Array.isArray(adminsResponse) ? adminsResponse.length : 0);
        setTotalPages(1);
      }
      setShops(Array.isArray(shopsData) ? shopsData : ((shopsData as any)?.results || []));
    } catch (err: any) {
      setError(err.message || 'Failed to load admin users');
      setAdmins([]);
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

  const handleOpenModal = (admin?: User) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        name_first: admin.name_first,
        name_last: admin.name_last,
        email: admin.email,
        phone: admin.phone,
        country_code: 'US',
        shop_ids: admin.assigned_shops?.map(s => s.shop_id) || [],
        can_manage_shops: (admin as any).permissions?.can_manage_shops || false,
        can_manage_devices: (admin as any).permissions?.can_manage_devices || false,
        can_manage_employees: (admin as any).permissions?.can_manage_employees || false,
        can_manage_admin_users: (admin as any).permissions?.can_manage_admin_users || false,
        can_manage_customers: (admin as any).permissions?.can_manage_customers || false,
        can_manage_machines: (admin as any).permissions?.can_manage_machines || false,
        can_manage_machine_readings: (admin as any).permissions?.can_manage_machine_readings || false,
        can_view_reports: (admin as any).permissions?.can_view_reports || false,
        is_owner: (admin as any).permissions?.is_owner || false,
      });
    } else {
      setEditingAdmin(null);
      setFormData({
        name_first: '',
        name_last: '',
        email: '',
        phone: '',
        country_code: 'US',
        shop_ids: [],
        can_manage_shops: false,
        can_manage_devices: false,
        can_manage_employees: false,
        can_manage_admin_users: false,
        can_manage_customers: false,
        can_manage_machines: false,
        can_manage_machine_readings: false,
        can_view_reports: false,
        is_owner: false,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const payload = {
        ...formData,
        role: 'CLIENT_ADMIN' as const,
        permissions: {
          can_manage_shops: formData.can_manage_shops,
          can_manage_devices: formData.can_manage_devices,
          can_manage_employees: formData.can_manage_employees,
          can_manage_admin_users: formData.can_manage_admin_users,
          can_manage_customers: formData.can_manage_customers,
          can_manage_machines: formData.can_manage_machines,
          can_manage_machine_readings: formData.can_manage_machine_readings,
          can_view_reports: formData.can_view_reports,
          is_owner: formData.is_owner,
        },
      };

      if (editingAdmin) {
        await adminApi.updateAdminUser(editingAdmin.id, payload);
      } else {
        await adminApi.createAdminUser(payload);
      }

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save admin user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (adminId: string) => {
    if (currentUser?.id === adminId) {
      setError('You cannot delete your own account');
      return;
    }

    const confirmed = await confirm({
      title: 'Delete Admin User',
      message: 'Are you sure you want to delete this admin user?',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await adminApi.deleteAdminUser(adminId);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete admin user');
    }
  };

  const handleResendInvitation = async (admin: User) => {
    try {
      setResendingInvite(admin.id);
      setError(null);
      const response = await adminApi.resendAdminInvitation(admin.id);

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

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (admin: User) => (
        <div>
          <span className="font-medium">{`${admin.name_first} ${admin.name_last}`}</span>
          {admin.id === currentUser?.id && (
            <Badge variant="info" className="ml-2">You</Badge>
          )}
        </div>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'status',
      header: 'Status',
      render: (admin: User) => (
        <Badge variant={admin.status === 'ACTIVE' ? 'success' : 'warning'}>
          {admin.status}
        </Badge>
      ),
    },
    {
      key: 'assigned_shops',
      header: 'Assigned Shops',
      render: (admin: User) => {
        const perms = admin.permissions as AdminPermissions | undefined;
        const isOwner = perms?.is_owner;
        const shopAssignments = admin.assigned_shops || [];

        if (isOwner) {
          return <span className="text-sm text-green-600 font-medium">Owner (All Shops)</span>;
        }

        if (shopAssignments.length === 0) {
          return <span className="text-sm text-gray-400">No shops assigned</span>;
        }

        const shopNames = shopAssignments.map((s) => s.shop_name || 'Unknown').join(', ');
        return (
          <span className="text-sm text-gray-700 dark:text-gray-300" title={shopNames}>
            {shopAssignments.length > 2
              ? `${shopAssignments.length} shops`
              : shopNames}
          </span>
        );
      },
    },
    {
      key: 'last_login_at',
      header: 'Last Login',
      render: (admin: User) =>
        admin.last_login_at ? (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(admin.last_login_at).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-gray-400">Never</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (admin: User) => {
        const perms = admin.permissions as AdminPermissions | undefined;
        const isOwnerUser = perms?.is_owner === true;
        const isSelf = admin.id === currentUser?.id;

        // Only the logged-in owner is protected (can't edit/delete yourself as owner)
        if (isSelf && isOwnerUser) {
          return <span className="text-xs text-gray-400">Owner</span>;
        }

        return (
          <div className="flex space-x-1">
            <EditButton onClick={() => handleOpenModal(admin)} tooltip="Edit Admin" />
            {!isSelf && (
              <DeleteButton onClick={() => handleDelete(admin.id)} tooltip="Delete Admin" />
            )}
          </div>
        );
      },
    },
  ];

  if (loading) return <Loading message="Loading admin users..." />;

  return (
    <PageContainer>
      <div className="mt-6">
        <PageHeader
          title="Admin Users"
          subtitle="Manage administrative user accounts and permissions"
          actions={
            <Button
              onClick={() => handleOpenModal()}
              size="sm"
              className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md text-xs min-[350px]:text-sm whitespace-nowrap px-3 min-[350px]:px-4"
            >
              Add Admin
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
        <Table
          columns={columns}
          data={admins}
          keyExtractor={(admin) => admin.id}
          emptyMessage="No admin users found."
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

      {/* Add/Edit Admin Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAdmin ? 'Edit Admin User' : 'Add New Admin User'}
        size="xl"
      >
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert inside the form */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {/* Resend Invitation Banner for INVITED status */}
          {editingAdmin && editingAdmin.status === 'INVITED' && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-sm text-amber-800 mb-2">
                This admin hasn't set their password yet.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleResendInvitation(editingAdmin)}
                loading={resendingInvite === editingAdmin.id}
              >
                Resend Invitation
              </Button>
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

          {/* Shop Assignments */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Shop Access</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Leave unchecked to grant access to all shops
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
              {Array.isArray(shops) && shops.map((shop) => (
                <label key={shop.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.shop_ids.includes(shop.id)}
                    onChange={() => toggleShop(shop.id)}
                    className="rounded text-slate-700 focus:ring-slate-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{shop.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Permissions</h3>
              <Switch
                checked={formData.can_manage_shops && formData.can_manage_devices && formData.can_manage_employees && formData.can_manage_admin_users && formData.can_manage_customers && formData.can_manage_machines && formData.can_manage_machine_readings && formData.can_view_reports}
                onChange={(checked) => setFormData({
                  ...formData,
                  can_manage_shops: checked,
                  can_manage_devices: checked,
                  can_manage_employees: checked,
                  can_manage_admin_users: checked,
                  can_manage_customers: checked,
                  can_manage_machines: checked,
                  can_manage_machine_readings: checked,
                  can_view_reports: checked,
                })}
                label="All"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <Switch
                checked={formData.can_manage_shops}
                onChange={(checked) => setFormData({ ...formData, can_manage_shops: checked })}
                label="Manage Shops"
              />
              <Switch
                checked={formData.can_manage_devices}
                onChange={(checked) => setFormData({ ...formData, can_manage_devices: checked })}
                label="Manage Devices"
              />
              <Switch
                checked={formData.can_manage_employees}
                onChange={(checked) => setFormData({ ...formData, can_manage_employees: checked })}
                label="Manage Employees"
              />
              <Switch
                checked={formData.can_manage_admin_users}
                onChange={(checked) => setFormData({ ...formData, can_manage_admin_users: checked })}
                label="Manage Admin Users"
              />
              <Switch
                checked={formData.can_manage_customers}
                onChange={(checked) => setFormData({ ...formData, can_manage_customers: checked })}
                label="Manage Customers"
              />
              <Switch
                checked={formData.can_manage_machines}
                onChange={(checked) => setFormData({ ...formData, can_manage_machines: checked })}
                label="Manage Game Machines"
              />
              <Switch
                checked={formData.can_manage_machine_readings}
                onChange={(checked) => setFormData({ ...formData, can_manage_machine_readings: checked })}
                label="Manage Machine Readings"
              />
              <Switch
                checked={formData.can_view_reports}
                onChange={(checked) => setFormData({ ...formData, can_view_reports: checked })}
                label="View Reports"
              />
            </div>
            <div className="pt-3 mt-3 border-t">
              <Switch
                checked={formData.is_owner}
                onChange={(checked) => setFormData({ ...formData, is_owner: checked })}
                label="Owner (Full Access)"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-8">
                Owners have all permissions regardless of individual settings
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingAdmin ? 'Update Admin' : 'Create Admin'}
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
