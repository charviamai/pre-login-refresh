import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Modal, Input, Select, Badge, useConfirm, Pagination } from '../../../shared/components/ui';
import { Table } from '../../../shared/components/ui/Table';
import { PageContainer } from '../../../shared/components/layout/PageContainer';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Loading } from '../../../shared/components/Loading';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { adminApi } from '../../../shared/utils/api-service';
import { useShop } from '../../../shared/context/ShopContext';
import type { Device, Shop, User } from '../../../shared/types';
import { EditButton, DeleteButton, ActivateButton, DeactivateButton } from '../../../shared/components/ActionIcons';

export const DevicesList: React.FC = () => {
  const confirm = useConfirm();
  const { selectedShopId, isAllShopsSelected } = useShop();
  const [devices, setDevices] = useState<Device[]>([]);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newDevice, setNewDevice] = useState({
    shop: '',
    device_name: '',
    device_model: '',
    notes: '',
    employee_ids: [] as string[],
  });

  const [editDevice, setEditDevice] = useState<{
    id: string;
    shop_id: string;
    device_name: string;
    device_model: string;
    notes: string;
    employee_ids: string[];
  } | null>(null);

  // Employee Access Modal State
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessModalDevice, setAccessModalDevice] = useState<Device | null>(null);
  const [accessData, setAccessData] = useState<{
    employees: Array<{
      employee_id: string;
      employee_name: string;
      employee_email: string;
      has_access: boolean;
      is_auto_assigned: boolean;
      admin_revoked: boolean;
    }>;
  }>({ employees: [] });
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessUpdating, setAccessUpdating] = useState<string | null>(null);

  // URL-based pagination state
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 25;

  useEffect(() => {
    loadData(initialPage);
  }, []);

  // Reload and filter devices when global shop selection changes
  useEffect(() => {
    if (isAllShopsSelected) {
      setDevices(allDevices);
    } else {
      setDevices(allDevices.filter(d => d.shop_id === selectedShopId));
    }
  }, [selectedShopId, allDevices, isAllShopsSelected]);

  const loadData = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const [devicesData, shopsData, employeesData] = await Promise.all([
        adminApi.getDevices(page),
        adminApi.getShops(),
        adminApi.getEmployees(),
      ]);
      // Handle paginated response
      const devResponse = devicesData as any;
      let loadedDevices: Device[];
      if (devResponse?.results) {
        loadedDevices = devResponse.results;
        setTotalCount(devResponse.count || 0);
        setTotalPages(Math.ceil((devResponse.count || 0) / PAGE_SIZE));
      } else {
        loadedDevices = Array.isArray(devicesData) ? devicesData : [];
        setTotalCount(loadedDevices.length);
        setTotalPages(1);
      }
      setAllDevices(loadedDevices);

      // Apply global shop filter
      if (isAllShopsSelected) {
        setDevices(loadedDevices);
      } else {
        setDevices(loadedDevices.filter((d: Device) => d.shop_id === selectedShopId));
      }

      const loadedShops = Array.isArray(shopsData) ? shopsData : ((shopsData as any)?.results || []);
      setShops(loadedShops);
      setEmployees(Array.isArray(employeesData) ? employeesData : ((employeesData as any)?.results || []));

      // Auto-select shop if only one exists
      if (loadedShops.length === 1) {
        setNewDevice(prev => ({ ...prev, shop: loadedShops[0].id }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load devices');
      // Set empty arrays on error to prevent crashes
      setDevices([]);
      setShops([]);
      setEmployees([]);
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

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await adminApi.createDevice(newDevice);
      setShowAddModal(false);
      setNewDevice({
        shop: '',
        device_name: '',
        device_model: '',
        notes: '',
        employee_ids: [],
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create device');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (deviceId: string) => {
    try {
      await adminApi.activateDevice(deviceId);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to activate device');
    }
  };

  const handleDeactivate = async (deviceId: string) => {
    const confirmed = await confirm({
      title: 'Deactivate Device',
      message: 'Are you sure you want to deactivate this device?',
      confirmText: 'Deactivate',
      variant: 'warning',
    });
    if (!confirmed) return;

    try {
      await adminApi.deactivateDevice(deviceId);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate device');
    }
  };

  const handleEdit = (device: Device) => {
    setEditDevice({
      id: device.id,
      shop_id: device.shop_id,
      device_name: device.device_name || device.name || '',
      device_model: device.device_model || '',
      notes: device.notes || '',
      employee_ids: device.permitted_employee_ids || [],
    });
    setShowEditModal(true);
  };

  const handleUpdateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDevice) return;

    setSubmitting(true);
    try {
      await adminApi.updateDevice(editDevice.id, {
        device_name: editDevice.device_name,
        device_model: editDevice.device_model,
        notes: editDevice.notes,
        employee_ids: editDevice.employee_ids,
      } as Partial<Device>);
      setShowEditModal(false);
      setEditDevice(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update device');
    } finally {
      setSubmitting(false);
    }
  };

  const getShopName = (shopId: string) => {
    return shops.find((s) => s.id === shopId)?.name || 'Unknown';
  };

  // Open employee access modal
  const handleManageAccess = async (device: Device) => {
    setAccessModalDevice(device);
    setShowAccessModal(true);
    setAccessLoading(true);

    try {
      const data = await adminApi.getDeviceEmployeeAccess(device.id);
      setAccessData({ employees: data.employees || [] });
    } catch (err: any) {
      setError(err.message || 'Failed to load employee access');
      setAccessData({ employees: [] });
    } finally {
      setAccessLoading(false);
    }
  };

  // Toggle employee access
  const handleToggleAccess = async (employeeId: string, currentlyHasAccess: boolean) => {
    if (!accessModalDevice) return;

    setAccessUpdating(employeeId);
    try {
      if (currentlyHasAccess) {
        await adminApi.revokeDeviceAccess(accessModalDevice.id, employeeId);
      } else {
        await adminApi.grantDeviceAccess(accessModalDevice.id, employeeId);
      }
      // Refresh access data
      const data = await adminApi.getDeviceEmployeeAccess(accessModalDevice.id);
      setAccessData({ employees: data.employees || [] });
    } catch (err: any) {
      setError(err.message || 'Failed to update access');
    } finally {
      setAccessUpdating(null);
    }
  };

  const columns = [
    { key: 'name', header: 'Device Name' },
    {
      key: 'shop_id',
      header: 'Shop',
      render: (device: Device) => getShopName(device.shop_id),
    },
    {
      key: 'device_type',
      header: 'Type',
      render: (device: Device) => <Badge variant="info">{device.device_type}</Badge>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (device: Device) => (
        <Badge variant={device.is_active ? 'success' : 'danger'}>
          {device.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'last_seen_at',
      header: 'Last Seen',
      render: (device: Device) =>
        device.last_seen_at ? (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(device.last_seen_at).toLocaleString()}
          </span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">Never</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (device: Device) => (
        <div className="flex space-x-1">
          <button
            onClick={() => handleManageAccess(device)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Manage Employee Access"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
          <EditButton onClick={() => handleEdit(device)} tooltip="Edit Device" />
          {!device.is_active && (
            <ActivateButton onClick={() => handleActivate(device.id)} tooltip="Activate Device" />
          )}
          {device.is_active && (
            <DeactivateButton onClick={() => handleDeactivate(device.id)} tooltip="Deactivate Device" />
          )}
          <DeleteButton
            onClick={async () => {
              const confirmed = await confirm({
                title: 'Delete Device',
                message: 'Delete this device? This will disable it immediately.',
                confirmText: 'Delete',
                variant: 'danger',
              });
              if (!confirmed) return;
              try {
                await adminApi.deleteDevice(device.id);
                await loadData();
              } catch (err: any) {
                setError(err.message || 'Failed to delete device');
              }
            }}
            tooltip="Delete Device"
          />
        </div>
      ),
    },
  ];

  if (loading) return <Loading message="Loading devices..." />;

  return (
    <PageContainer>
      <div className="mt-6">
        <PageHeader
          title="Kiosk Devices"
          subtitle="Manage kiosk devices and activation codes"
          actions={
            <Button
              onClick={() => setShowAddModal(true)}
              size="sm"
              className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md text-xs min-[350px]:text-sm whitespace-nowrap px-3 min-[350px]:px-4"
            >
              Add Device
            </Button>
          }
        />
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      <div className="mt-2">
        <Table
          columns={columns}
          data={devices}
          keyExtractor={(device) => device.id}
          emptyMessage="No devices found. Add your first kiosk device to get started."
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

      {/* Add Device Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Kiosk Device"
        size="xl"
      >
        <form onSubmit={handleAddDevice} className="space-y-4">
          <Select
            label="Shop"
            value={newDevice.shop}
            onChange={(e) => setNewDevice({ ...newDevice, shop: e.target.value })}
            options={[
              { value: '', label: 'Select a Shop' },
              ...(Array.isArray(shops) ? shops.map((shop) => ({ value: shop.id, label: shop.name })) : [])
            ]}
            required
            fullWidth
          />

          <Input
            label="Device Name"
            value={newDevice.device_name}
            onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
            helperText="e.g., 'Front Lobby Kiosk' or 'Main Entrance'"
            required
            fullWidth
          />

          <Input
            label="Device Model (Optional)"
            value={newDevice.device_model}
            onChange={(e) => setNewDevice({ ...newDevice, device_model: e.target.value })}
            helperText="e.g., 'Samsung Galaxy Tab A7'"
            fullWidth
          />

          <Input
            label="Notes (Optional)"
            value={newDevice.notes}
            onChange={(e) => setNewDevice({ ...newDevice, notes: e.target.value })}
            helperText="Any additional notes about this device"
            fullWidth
          />

          {/* Employee Access Permissions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Employee Access Permissions</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Select which employees can log into this kiosk device using their access code
            </p>
            {!newDevice.shop ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic p-3 border border-gray-200 dark:border-slate-600 rounded-md">
                Select a shop first to see available employees.
              </p>
            ) : (
              <>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-slate-600 rounded-md p-3 bg-white dark:bg-slate-700">
                  {(() => {
                    const shopEmployees = employees.filter(emp =>
                      emp.assigned_shops?.some(s => s.shop_id === newDevice.shop)
                    );
                    if (shopEmployees.length === 0) {
                      return <p className="text-sm text-gray-500 dark:text-gray-400 italic">No employees assigned to this shop.</p>;
                    }
                    return shopEmployees.map((employee) => (
                      <label key={employee.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newDevice.employee_ids.includes(employee.id)}
                          onChange={() => {
                            const ids = newDevice.employee_ids.includes(employee.id)
                              ? newDevice.employee_ids.filter((id) => id !== employee.id)
                              : [...newDevice.employee_ids, employee.id];
                            setNewDevice({ ...newDevice, employee_ids: ids });
                          }}
                          className="rounded text-slate-700 focus:ring-slate-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {employee.name_first} {employee.name_last}
                          {employee.access_code && (
                            <span className="ml-2 font-mono text-xs text-gray-500 dark:text-gray-400">({employee.access_code})</span>
                          )}
                        </span>
                      </label>
                    ));
                  })()}
                </div>
                {newDevice.employee_ids.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    {newDevice.employee_ids.length} employee(s) will have access to this device
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Device
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Device Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditDevice(null);
        }}
        title="Edit Kiosk Device"
        size="xl"
      >
        {editDevice && (
          <form onSubmit={handleUpdateDevice} className="space-y-4">
            <Input
              label="Device Name"
              value={editDevice.device_name}
              onChange={(e) => setEditDevice({ ...editDevice, device_name: e.target.value })}
              helperText="e.g., 'Front Lobby Kiosk' or 'Main Entrance'"
              required
              fullWidth
            />

            <Input
              label="Device Model (Optional)"
              value={editDevice.device_model}
              onChange={(e) => setEditDevice({ ...editDevice, device_model: e.target.value })}
              helperText="e.g., 'Samsung Galaxy Tab A7'"
              fullWidth
            />

            <Input
              label="Notes (Optional)"
              value={editDevice.notes}
              onChange={(e) => setEditDevice({ ...editDevice, notes: e.target.value })}
              helperText="Any additional notes about this device"
              fullWidth
            />

            {/* Employee Access Permissions */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Employee Access Permissions</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Select which employees can log into this kiosk device using their access code
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-slate-600 rounded-md p-3 bg-white dark:bg-slate-700">
                {(() => {
                  const shopEmployees = employees.filter(emp =>
                    emp.assigned_shops?.some(s => s.shop_id === editDevice.shop_id)
                  );
                  if (shopEmployees.length === 0) {
                    return <p className="text-sm text-gray-500 dark:text-gray-400 italic">No employees assigned to this shop.</p>;
                  }
                  return shopEmployees.map((employee) => (
                    <label key={employee.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editDevice.employee_ids.includes(employee.id)}
                        onChange={() => {
                          const ids = editDevice.employee_ids.includes(employee.id)
                            ? editDevice.employee_ids.filter((id) => id !== employee.id)
                            : [...editDevice.employee_ids, employee.id];
                          setEditDevice({ ...editDevice, employee_ids: ids });
                        }}
                        className="rounded text-slate-700 focus:ring-slate-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {employee.name_first} {employee.name_last}
                        {employee.access_code && (
                          <span className="ml-2 font-mono text-xs text-gray-500 dark:text-gray-400">({employee.access_code})</span>
                        )}
                      </span>
                    </label>
                  ));
                })()}
              </div>
              {editDevice.employee_ids.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  {editDevice.employee_ids.length} employee(s) will have access to this device
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => {
                setShowEditModal(false);
                setEditDevice(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Update Device
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Employee Access Modal */}
      <Modal
        isOpen={showAccessModal}
        onClose={() => {
          setShowAccessModal(false);
          setAccessModalDevice(null);
          setAccessData({ employees: [] });
        }}
        title={`Employee Access - ${accessModalDevice?.device_name || 'Device'}`}
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage which employees can log into <span className="font-medium dark:text-gray-300">{accessModalDevice?.device_name}</span>.
            Access is auto-assigned based on shop assignment but can be manually overridden here.
          </p>

          {accessLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading employees...</span>
            </div>
          ) : accessData.employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No employees are assigned to this shop.</p>
              <p className="text-sm mt-1">Assign employees to the shop first to manage device access.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 dark:border-slate-600 rounded-lg p-3">
              {accessData.employees.map((emp) => (
                <label
                  key={emp.employee_id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${emp.has_access ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600'
                    } ${accessUpdating === emp.employee_id ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={emp.has_access}
                      disabled={accessUpdating === emp.employee_id}
                      onChange={() => handleToggleAccess(emp.employee_id, emp.has_access)}
                      className="rounded text-slate-700 focus:ring-slate-500 w-5 h-5"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{emp.employee_name}</span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{emp.employee_email}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {emp.is_auto_assigned && emp.has_access && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Auto</span>
                    )}
                    {emp.admin_revoked && (
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">Blocked</span>
                    )}
                    {accessUpdating === emp.employee_id && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-700"></div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAccessModal(false);
                setAccessModalDevice(null);
                setAccessData({ employees: [] });
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};
