import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Modal, Input, Badge, useConfirm, Pagination } from '../../../shared/components/ui';
import { Select } from '../../../shared/components/ui/Select';
import { Table } from '../../../shared/components/ui/Table';
import { PageContainer } from '../../../shared/components/layout/PageContainer';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Loading } from '../../../shared/components/Loading';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { machinesApi, adminApi } from '../../../shared/utils/api-service';
import { useShop } from '../../../shared/context/ShopContext';
import type { Shop } from '../../../shared/types';
import { EditButton, DeleteButton } from '../../../shared/components/ActionIcons';
import { useAuth } from '../../../contexts/AuthContext';

interface MachineType {
  id: string;
  name: string;
  created_at: string;
}

interface Machine {
  id: string;
  machine_number: number;
  machine_type: string;
  machine_type_name: string;
  name: string;
  last_reading_date: string | null;
  created_at: string;
}

export const MachinesList: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { user } = useAuth();

  // Get permissions
  const permissions = user?.permissions || {};
  const isOwner = permissions.is_owner === true;
  const canManageMachines = isOwner || permissions.can_manage_machines === true;
  const canManageReadings = isOwner || permissions.can_manage_machine_readings === true;
  const { selectedShopId: globalShopId, isAllShopsSelected } = useShop();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [allMachines, setAllMachines] = useState<Machine[]>([]); // Store all machines
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nextNumber, setNextNumber] = useState<number>(1);

  const [newMachine, setNewMachine] = useState({
    machine_number: '',
    machine_type_id: '',
    new_type_name: '',
    useNewType: false,
    shop_id: '',
  });

  const [editMachine, setEditMachine] = useState<{
    id: string;
    machine_type_id: string;
  } | null>(null);

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

  // Filter machines based on global shop selection
  useEffect(() => {
    if (!isAllShopsSelected && globalShopId) {
      setMachines(allMachines.filter(m => (m as any).shop === globalShopId));
    } else {
      setMachines(allMachines);
    }
  }, [globalShopId, isAllShopsSelected, allMachines]);

  const loadData = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const [machinesData, typesData, shopsData, nextNumData] = await Promise.all([
        machinesApi.getMachines(page),
        machinesApi.getMachineTypes(),
        adminApi.getShops(),
        machinesApi.getNextMachineNumber(),
      ]);
      // Handle paginated response
      const machineResponse = machinesData as any;
      let machinesList: Machine[];
      if (machineResponse?.results) {
        machinesList = machineResponse.results;
        setTotalCount(machineResponse.count || 0);
        setTotalPages(Math.ceil((machineResponse.count || 0) / PAGE_SIZE));
      } else {
        machinesList = Array.isArray(machinesData) ? machinesData : [];
        setTotalCount(machinesList.length);
        setTotalPages(1);
      }
      setAllMachines(machinesList);
      setMachines(machinesList);
      setMachineTypes(Array.isArray(typesData) ? typesData : ((typesData as any)?.results || []));
      const shopsList = Array.isArray(shopsData) ? shopsData : ((shopsData as any)?.results || []);
      setShops(shopsList);

      // Auto-select first shop if only one
      // (No longer needed - global shop context handles this)

      setNextNumber(nextNumData.next_number || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      setMachines([]);
      setAllMachines([]);
      setMachineTypes([]);
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

  const handleOpenAddModal = async () => {
    try {
      const shopId = (!isAllShopsSelected && globalShopId) ? globalShopId : (shops.length > 0 ? shops[0].id : '');
      const nextNumData = await machinesApi.getNextMachineNumber(shopId ? { shop_id: shopId } : undefined);
      setNextNumber(nextNumData.next_number || 1);
      setNewMachine({
        machine_number: String(nextNumData.next_number || 1),
        machine_type_id: machineTypes.length > 0 ? machineTypes[0].id : '',
        new_type_name: '',
        useNewType: machineTypes.length === 0,
        shop_id: shopId,
      });
      setShowAddModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to get next machine number');
    }
  };

  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!newMachine.shop_id) {
        setError('Please select a shop');
        setSubmitting(false);
        return;
      }

      const payload: any = {
        machine_number: parseInt(newMachine.machine_number) || undefined,
        shop_id: newMachine.shop_id,
      };

      if (newMachine.useNewType && newMachine.new_type_name.trim()) {
        payload.new_type_name = newMachine.new_type_name.trim();
      } else if (newMachine.machine_type_id) {
        payload.machine_type_id = newMachine.machine_type_id;
      } else {
        setError('Please select a machine type or create a new one');
        setSubmitting(false);
        return;
      }

      await machinesApi.createMachine(payload);
      setShowAddModal(false);
      setNewMachine({
        machine_number: '',
        machine_type_id: '',
        new_type_name: '',
        useNewType: false,
        shop_id: (!isAllShopsSelected && globalShopId) ? globalShopId : (shops.length > 0 ? shops[0].id : ''),
      });
      await loadData();
    } catch (err: any) {
      // Check for authentication errors
      if (err.status_code === 401 || err.error?.includes('Authentication credentials')) {
        setError('Your session has expired. Please log in again.');
        // Redirect will be handled by API client's handleUnauthorized
        return;
      }

      // Extract error message from response
      const errorMessage = err.machine_number || err.error || err.message || 'Failed to create machine';
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMachine = (machine: Machine) => {
    setEditMachine({
      id: machine.id,
      machine_type_id: machine.machine_type,
    });
    setShowEditModal(true);
  };

  const handleUpdateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMachine) return;

    setSubmitting(true);
    setError(null);

    try {
      await machinesApi.updateMachine(editMachine.id, {
        machine_type_id: editMachine.machine_type_id,
      });
      setShowEditModal(false);
      setEditMachine(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update machine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMachine = async (machineId: string) => {
    const confirmed = await confirm({
      title: 'Delete Machine',
      message: 'Are you sure you want to delete this machine? All its readings will also be deleted.',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await machinesApi.deleteMachine(machineId);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete machine');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Machine Name',
      isPrimaryOnMobile: true,
      render: (machine: Machine) => machine.name,
    },
    {
      key: 'machine_type_name',
      header: 'Type',
      render: (machine: Machine) => (
        <Badge variant="info">{machine.machine_type_name}</Badge>
      ),
    },
    {
      key: 'last_reading_date',
      header: 'Last Reading',
      render: (machine: Machine) =>
        machine.last_reading_date ? (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(machine.last_reading_date).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">No readings</span>
        ),
    },
    {
      key: 'created_at',
      header: 'Added On',
      render: (machine: Machine) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(machine.created_at).toLocaleDateString()}
        </span>
      ),
    },
    // Only show actions column if user can manage machines
    ...(canManageMachines ? [{
      key: 'actions',
      header: 'Actions',
      render: (machine: Machine) => (
        <div className="flex space-x-1">
          <EditButton onClick={() => handleEditMachine(machine)} tooltip="Edit Machine" />
          <DeleteButton onClick={() => handleDeleteMachine(machine.id)} tooltip="Delete Machine" />
        </div>
      ),
    }] : []),
  ];

  if (loading) {
    return (
      <PageContainer>
        <Loading message="Loading machines..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mt-6">
        <PageHeader
          title="Game Machines"
          subtitle="Manage your game machines and track readings"
          actions={
            canManageMachines ? (
              <Button
                onClick={handleOpenAddModal}
                size="sm"
                className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md text-xs min-[350px]:text-sm whitespace-nowrap"
              >
                Add Machine
              </Button>
            ) : undefined
          }
        />

        {/* Readings button - uses global shop filter */}
        {canManageReadings && (
          <div className="mt-4 flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/client/machines/readings${!isAllShopsSelected && globalShopId ? `?shop_id=${globalShopId}` : ''}`)}
              disabled={isAllShopsSelected}
              className="text-xs min-[350px]:text-sm whitespace-nowrap"
            >
              Enter Readings
            </Button>
            {isAllShopsSelected && (
              <span className="text-sm text-amber-600 dark:text-amber-400">
                Select a specific shop in the header to enter readings
              </span>
            )}
          </div>
        )}
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {machines.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Machines Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{canManageMachines ? 'Add your first game machine to get started.' : 'No machines have been added yet.'}</p>
          {canManageMachines && <Button onClick={handleOpenAddModal}>Add Machine</Button>}
        </div>
      ) : (
        <div className="mt-2">
          <Table data={machines} columns={columns} keyExtractor={(machine) => machine.id} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </div>
      )}

      {/* Add Machine Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Machine"
        size="xl"
      >
        <form onSubmit={handleAddMachine} className="space-y-4">
          <Select
            label="Shop"
            value={newMachine.shop_id}
            onChange={(e) => {
              const shopId = e.target.value;
              setNewMachine({ ...newMachine, shop_id: shopId });
              // Update next number when shop changes
              if (shopId) {
                machinesApi.getNextMachineNumber({ shop_id: shopId }).then(data => {
                  setNextNumber(data.next_number || 1);
                  setNewMachine(prev => ({ ...prev, machine_number: String(data.next_number || 1) }));
                }).catch(() => {
                  // Silently fail - suggested number is optional
                });
              }
            }}
            options={[
              { value: '', label: 'Select a shop...' },
              ...shops.map(shop => ({
                value: shop.id,
                label: shop.name
              }))
            ]}
            required
            fullWidth
          />
          <Input
            label="Machine Number"
            type="number"
            value={newMachine.machine_number}
            onChange={(e) => setNewMachine({ ...newMachine, machine_number: e.target.value })}
            helperText={`Suggested: ${nextNumber}. Leave as is for auto-increment.`}
            min={1}
            required
            fullWidth
          />

          {machineTypes.length > 0 && !newMachine.useNewType && (
            <>
              <Select
                label="Machine Type"
                value={newMachine.machine_type_id}
                onChange={(e) => setNewMachine({ ...newMachine, machine_type_id: e.target.value })}
                options={machineTypes.map((type) => ({
                  value: type.id,
                  label: type.name,
                }))}
                required={!newMachine.useNewType}
                fullWidth
              />
              <button
                type="button"
                onClick={() => setNewMachine({ ...newMachine, useNewType: true })}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
              >
                + Create new type
              </button>
            </>
          )}

          {(machineTypes.length === 0 || newMachine.useNewType) && (
            <>
              <Input
                label="New Type Name"
                value={newMachine.new_type_name}
                onChange={(e) => setNewMachine({ ...newMachine, new_type_name: e.target.value })}
                placeholder="e.g., Slot Machine, Video Poker"
                required={newMachine.useNewType || machineTypes.length === 0}
                fullWidth
              />
              {machineTypes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setNewMachine({ ...newMachine, useNewType: false, new_type_name: '' })}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
                >
                  ← Select existing type
                </button>
              )}
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Add Machine
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Machine Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditMachine(null);
        }}
        title="Edit Machine"
        size="xl"
      >
        {editMachine && (
          <form onSubmit={handleUpdateMachine} className="space-y-4">
            <Select
              label="Machine Type"
              value={editMachine.machine_type_id}
              onChange={(e) =>
                setEditMachine({ ...editMachine, machine_type_id: e.target.value })
              }
              options={machineTypes.map((type) => ({
                value: type.id,
                label: type.name,
              }))}
              required
              fullWidth
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setEditMachine(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Update Machine
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </PageContainer>
  );
};

