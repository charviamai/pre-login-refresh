import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Modal, Input, Badge, Pagination } from '../../../shared/components/ui';
import { PhoneInput } from '../../../shared/components/PhoneInput';
import { Select } from '../../../shared/components/ui/Select';
import { Table } from '../../../shared/components/ui/Table';
import { PageContainer } from '../../../shared/components/layout/PageContainer';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Loading } from '../../../shared/components/Loading';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { AddressAutocomplete } from '../../../shared/components/AddressAutocomplete';
import { adminApi } from '../../../shared/utils/api-service';
import type { Shop } from '../../../shared/types';
import { SettingsButton } from '../../../shared/components/ActionIcons';
import type { AddressSuggestion } from '../../../shared/hooks/useAddressAutocomplete';

// US States for dropdown
const US_STATES = [
  { value: '', label: 'Select State' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

// US Timezones for dropdown
const US_TIMEZONES = [
  { value: '', label: 'Select Timezone' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (AZ)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
];

export const ShopsList: React.FC = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // URL-based pagination state
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 25;

  const [newShop, setNewShop] = useState({
    name: '',
    code: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'USA',
    country_code: 'US',
    timezone: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    notes: '',
    // Verification settings (will be applied to shop settings after creation)
    verification_palm_enabled: true,
    verification_nfc_enabled: false,
    verification_phone_enabled: false,
    // Play type
    enable_spin: false,
    enable_match: true,
  });

  useEffect(() => {
    loadShops(initialPage);
  }, []);

  const loadShops = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getShops(page);
      // Handle paginated response
      const shopResponse = data as any;
      if (shopResponse?.results) {
        setShops(shopResponse.results);
        setTotalCount(shopResponse.count || 0);
        setTotalPages(Math.ceil((shopResponse.count || 0) / PAGE_SIZE));
      } else {
        const shopsArray = Array.isArray(data) ? data : [];
        setShops(shopsArray);
        setTotalCount(shopsArray.length);
        setTotalPages(1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load shops');
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
    loadShops(page);
  };

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null); // Clear any previous errors

    try {
      const payload = {
        name: newShop.name,
        code: newShop.code,
        address_line1: newShop.address_line1,
        address_line2: newShop.address_line2,
        city: newShop.city,
        state: newShop.state,
        postal_code: newShop.postal_code,
        country: newShop.country,
        timezone: newShop.timezone || undefined,
        phone: newShop.contact_phone || undefined,
        email: newShop.contact_email || undefined,
        notes: newShop.notes || undefined,
        // Include settings with verification and play type options
        settings: {
          verification_palm_enabled: newShop.verification_palm_enabled,
          verification_nfc_enabled: newShop.verification_nfc_enabled,
          verification_phone_enabled: newShop.verification_phone_enabled,
          enable_spin_promotion: newShop.enable_spin,
          enable_match_promotion: newShop.enable_match,
        },
      };


      await adminApi.createShop(payload);


      // Reset form and close modal immediately after successful creation
      setShowAddModal(false);
      setNewShop({
        name: '',
        code: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'USA',
        country_code: 'US',
        timezone: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        notes: '',
        verification_palm_enabled: true,
        verification_nfc_enabled: false,
        verification_phone_enabled: false,
        enable_spin: false,
        enable_match: true,
      });

      // Reload shops list
      await loadShops();
    } catch (err: any) {


      setError(err.message || err.error || 'Failed to create shop');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Shop Name' },
    {
      key: 'device_count',
      header: 'Active Devices',
      render: (shop: Shop) => <span>{(shop as any).device_count ?? 0}</span>,
    },
    {
      key: 'enable_employee_portal',
      header: 'Employee Portal',
      render: (shop: Shop) => (
        <Badge variant={shop.enable_employee_portal ? 'success' : 'default'}>
          {shop.enable_employee_portal ? 'Enabled' : 'Disabled'}
        </Badge>
      ),
    },
    {
      key: 'enable_kiosk_portal',
      header: 'Kiosk Portal',
      render: (shop: Shop) => (
        <Badge variant={shop.enable_kiosk_portal ? 'success' : 'default'}>
          {shop.enable_kiosk_portal ? 'Enabled' : 'Disabled'}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (shop: Shop) => (
        <Badge variant={shop.is_active ? 'success' : 'danger'}>
          {shop.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (shop: Shop) => (
        <SettingsButton
          onClick={() => navigate(`/client/shops/${shop.id}/settings`)}
          tooltip="Shop Settings"
        />
      ),
    },
  ];

  if (loading) return <Loading message="Loading shops..." />;

  return (
    <PageContainer>
      <div className="mt-6">
        <PageHeader
          title="Shops Management"
          subtitle="Manage your shop locations and settings"
          actions={
            <Button
              onClick={() => setShowAddModal(true)}
              size="sm"
              className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md text-xs min-[350px]:text-sm whitespace-nowrap px-3 min-[350px]:px-4"
            >
              Add Shop
            </Button>
          }
        />
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      <div className="mt-2">
        <Table
          columns={columns}
          data={shops}
          keyExtractor={(shop) => shop.id}
          emptyMessage="No shops found. Add your first shop to get started."
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

      {/* Add Shop Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Shop"
        size="xl"
      >
        <form onSubmit={handleAddShop} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Shop Name"
              value={newShop.name}
              onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
              required
              fullWidth
            />

            <Input
              label="Shop Code"
              value={newShop.code}
              onChange={(e) => setNewShop({ ...newShop, code: e.target.value })}
              helperText="Unique identifier (e.g., SH001)"
              required
              fullWidth
            />
          </div>

          <AddressAutocomplete
            name="address_line1"
            label="Address Line 1"
            value={newShop.address_line1}
            onChange={(e) => setNewShop({ ...newShop, address_line1: e.target.value })}
            onAddressSelect={(address: AddressSuggestion) => {
              // Auto-populate address fields when user selects a suggestion
              setNewShop(prev => ({
                ...prev,
                address_line1: address.addressLine1,
                city: address.city || prev.city,
                state: address.stateCode || prev.state,
                postal_code: address.postalCode || prev.postal_code,
              }));
            }}
            helperText="Start typing to search addresses"
            required
            fullWidth
            countryCode="us"
            placeholder="Street address, P.O. box, company name"
          />

          <Input
            label="Address Line 2 (Optional)"
            value={newShop.address_line2}
            onChange={(e) => setNewShop({ ...newShop, address_line2: e.target.value })}
            helperText="Apartment, suite, unit, building, floor, etc."
            fullWidth
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              value={newShop.city}
              onChange={(e) => setNewShop({ ...newShop, city: e.target.value })}
              required
              fullWidth
            />

            <Select
              label="State"
              value={newShop.state}
              onChange={(e) => setNewShop({ ...newShop, state: e.target.value })}
              options={US_STATES}
              required
              fullWidth
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Postal Code"
              value={newShop.postal_code}
              onChange={(e) => setNewShop({ ...newShop, postal_code: e.target.value })}
              required
              fullWidth
            />

            <Input
              label="Country"
              value={newShop.country}
              onChange={(e) => setNewShop({ ...newShop, country: e.target.value })}
              required
              fullWidth
            />
          </div>

          <Select
            label="Timezone"
            value={newShop.timezone}
            onChange={(e) => setNewShop({ ...newShop, timezone: e.target.value })}
            options={US_TIMEZONES}
            required
            fullWidth
          />

          {/* Verification & Play Type Section */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Kiosk Settings</h4>

            <div className="grid grid-cols-2 gap-6">
              {/* Verification Methods */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Verification Methods
                </label>
                <div className="flex gap-4 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-3 bg-gray-50 dark:bg-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newShop.verification_palm_enabled}
                      onChange={(e) => setNewShop({ ...newShop, verification_palm_enabled: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Palm</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newShop.verification_nfc_enabled}
                      onChange={(e) => setNewShop({ ...newShop, verification_nfc_enabled: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">NFC</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newShop.verification_phone_enabled}
                      onChange={(e) => setNewShop({ ...newShop, verification_phone_enabled: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</span>
                  </label>
                </div>
              </div>

              {/* Play Type */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Play Type
                </label>
                <div className="flex gap-4 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-3 bg-gray-50 dark:bg-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newShop.enable_spin}
                      onChange={(e) => setNewShop({ ...newShop, enable_spin: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Spin</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newShop.enable_match}
                      onChange={(e) => setNewShop({ ...newShop, enable_match: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Match</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Contact Details (Optional)</h4>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Contact Name"
                value={newShop.contact_name}
                onChange={(e) => setNewShop({ ...newShop, contact_name: e.target.value })}
                fullWidth
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={newShop.contact_email}
                  onChange={(e) => setNewShop({ ...newShop, contact_email: e.target.value })}
                  fullWidth
                />

                <PhoneInput
                  label="Phone"
                  value={newShop.contact_phone}
                  onChange={(e) => setNewShop({ ...newShop, contact_phone: e.target.value })}
                  countryCode={newShop.country_code}
                  onCountryChange={(code) => setNewShop({ ...newShop, country_code: code })}
                />
              </div>

              <Input
                label="Notes"
                value={newShop.notes}
                onChange={(e) => setNewShop({ ...newShop, notes: e.target.value })}
                helperText="Any additional notes about this shop"
                fullWidth
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Shop
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
