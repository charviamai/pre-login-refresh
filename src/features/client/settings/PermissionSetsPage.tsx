import React, { useEffect, useState } from 'react';
import { Button, Card, Modal, Input, Switch, Badge, useConfirm } from '../../../shared/components/ui';
import { Table } from '../../../shared/components/ui/Table';
import { PageContainer } from '../../../shared/components/layout/PageContainer';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Loading } from '../../../shared/components/Loading';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { adminApi } from '../../../shared/utils/api-service';
import type { PermissionSetListItem, PermissionSet, CreatePermissionSetRequest } from '../../../shared/types';
import { EditButton, DeleteButton } from '../../../shared/components/ActionIcons';
import { useAuth } from '../../../contexts/AuthContext';

interface PermissionGroup {
    name: string;
    permissions: {
        key: string;
        label: string;
    }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
    {
        name: 'Tickets & Redemption',
        permissions: [
            { key: 'can_redeem_tickets', label: 'Redeem Tickets' },
        ],
    },
    {
        name: 'Dashboard',
        permissions: [{ key: 'can_access_dashboard', label: 'Access Dashboard' }],
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

const getDefaultFormData = (): CreatePermissionSetRequest => ({
    name: '',
    description: '',
    can_redeem_tickets: false,
    can_access_dashboard: false,
    can_view_customers: false,
    can_add_customers: false,
    can_edit_customers: false,
    can_delete_customers: false,
    can_view_kiosk_reports: false,
    can_view_shift_reports: false,
    can_view_machine_reports: false,
    can_view_machine_readings: false,
    can_add_machine_readings: false,
    can_view_shift_summary: false,
    can_view_total_in: false,
    can_view_total_out: false,
    can_view_today_in: false,
    can_view_today_out: false,
    can_view_own_schedule: false,
    can_enter_timesheet: false,
    can_view_own_hours: false,
    can_clock_in_out: false,
});

export const PermissionSetsPage: React.FC = () => {
    const { user } = useAuth();
    const confirm = useConfirm();
    const [permissionSets, setPermissionSets] = useState<PermissionSetListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingSet, setEditingSet] = useState<PermissionSet | null>(null);
    const [formData, setFormData] = useState<CreatePermissionSetRequest>(getDefaultFormData());

    const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminApi.getPermissionSets();
            setPermissionSets(Array.isArray(data) ? data : (data as any)?.results || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load permission sets');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingSet(null);
        setFormData(getDefaultFormData());
        setShowModal(true);
    };

    const handleOpenEdit = async (setId: string) => {
        try {
            setLoading(true);
            const fullSet = await adminApi.getPermissionSet(setId);
            setEditingSet(fullSet);
            setFormData({
                name: fullSet.name,
                description: fullSet.description,
                can_redeem_tickets: fullSet.can_redeem_tickets,
                can_access_dashboard: fullSet.can_access_dashboard,
                can_view_customers: fullSet.can_view_customers,
                can_add_customers: fullSet.can_add_customers,
                can_edit_customers: fullSet.can_edit_customers,
                can_delete_customers: fullSet.can_delete_customers,
                can_view_all_reports: fullSet.can_view_all_reports,
                can_view_kiosk_reports: fullSet.can_view_kiosk_reports,
                can_view_shift_reports: fullSet.can_view_shift_reports,
                can_view_machine_reports: fullSet.can_view_machine_reports,
                can_view_machine_readings: fullSet.can_view_machine_readings,
                can_add_machine_readings: fullSet.can_add_machine_readings,
                can_view_shift_summary: fullSet.can_view_shift_summary,
                can_view_total_in: fullSet.can_view_total_in,
                can_view_total_out: fullSet.can_view_total_out,
                can_view_today_in: fullSet.can_view_today_in,
                can_view_today_out: fullSet.can_view_today_out,
                can_view_own_schedule: fullSet.can_view_own_schedule,
                can_enter_timesheet: fullSet.can_enter_timesheet,
                can_view_own_hours: fullSet.can_view_own_hours,
                can_clock_in_out: fullSet.can_clock_in_out,
            });
            setShowModal(true);
        } catch (err: any) {
            setError(err.message || 'Failed to load permission set');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingSet) {
                await adminApi.updatePermissionSet(editingSet.id, formData);
            } else {
                await adminApi.createPermissionSet(formData);
            }
            setShowModal(false);
            await loadData();
        } catch (err: any) {
            setError(err.message || `Failed to ${editingSet ? 'update' : 'create'} permission set`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (setId: string, isSystem: boolean) => {
        if (isSystem && !isPlatformAdmin) {
            setError('Only platform admins can delete system templates');
            return;
        }

        const confirmed = await confirm({
            title: 'Delete Permission Set',
            message: 'Are you sure you want to delete this permission set? This cannot be undone.',
            confirmText: 'Delete',
            variant: 'danger',
        });
        if (!confirmed) return;

        try {
            await adminApi.deletePermissionSet(setId);
            await loadData();
        } catch (err: any) {
            setError(err.message || 'Failed to delete permission set');
        }
    };

    const togglePermission = (key: string) => {
        setFormData((prev) => ({
            ...prev,
            [key]: !prev[key as keyof CreatePermissionSetRequest],
        }));
    };

    // Helper: Check if all permissions in a group are enabled
    const areAllInGroupEnabled = (group: PermissionGroup): boolean => {
        return group.permissions.every(
            (perm) => !!formData[perm.key as keyof CreatePermissionSetRequest]
        );
    };

    // Helper: Toggle all permissions in a group
    const toggleAllInGroup = (group: PermissionGroup, enabled: boolean) => {
        setFormData((prev) => {
            const updates: Partial<CreatePermissionSetRequest> = {};
            group.permissions.forEach((perm) => {
                (updates as any)[perm.key] = enabled;
            });
            return { ...prev, ...updates };
        });
    };

    const columns = [
        {
            key: 'name',
            header: 'Name',
            isPrimaryOnMobile: true,
            render: (set: PermissionSetListItem) => (
                <div className="flex items-center gap-2 min-w-0">
                    {/* Name - white/bold on mobile, proper contrast on desktop */}
                    <span className="font-bold md:font-semibold text-white md:text-gray-900 dark:md:text-gray-100 truncate">{set.name}</span>
                    {/* Type badge shown in mobile header */}
                    <Badge variant={set.is_system ? 'info' : 'secondary'} className="md:hidden text-[10px] flex-shrink-0">
                        {set.is_system ? 'Sys' : 'Custom'}
                    </Badge>
                </div>
            ),
        },
        {
            key: 'is_system',
            header: 'Type',
            hideOnMobile: true,
            render: (set: PermissionSetListItem) => (
                <Badge variant={set.is_system ? 'info' : 'secondary'}>
                    {set.is_system ? 'System' : 'Custom'}
                </Badge>
            ),
        },
        {
            key: 'description',
            header: 'Description',
            hideOnMobile: true, // Hide on mobile - too long, user can edit to see
        },
        {
            key: 'permission_count',
            header: 'Permissions', // Restored for desktop table header
            hideMobileLabel: true, // Hide the blue label on mobile (we use custom inline format)
            render: (set: PermissionSetListItem) => {
                const count = set.permission_count || 0;
                const variant = count >= 15 ? 'success' : count >= 8 ? 'warning' : 'default';
                return (
                    <div className="flex items-center gap-2">
                        {/* Mobile: inline format */}
                        <span className="md:hidden text-blue-500 dark:text-blue-400 font-medium text-sm">Permissions: </span>
                        <Badge variant={variant}>
                            {count}/21
                        </Badge>
                    </div>
                );
            },
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (set: PermissionSetListItem) => (
                <div className="flex space-x-1">
                    <EditButton onClick={() => handleOpenEdit(set.id)} tooltip="Edit Permission Set" />
                    {(!set.is_system || isPlatformAdmin) && (
                        <DeleteButton
                            onClick={() => handleDelete(set.id, set.is_system)}
                            tooltip="Delete Permission Set"
                        />
                    )}
                </div>
            ),
        },
    ];

    if (loading && !submitting) return <Loading message="Loading permission sets..." />;

    return (
        <PageContainer>
            <div className="mt-6">
                <PageHeader
                    title="Permission Sets"
                    subtitle="Create and manage permission templates for employees"
                    actions={
                        <Button
                            size="sm"
                            onClick={handleOpenCreate}
                            className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md"
                        >
                            <span className="sm:hidden">+ Add</span>
                            <span className="hidden sm:inline">Add Permission Set</span>
                        </Button>
                    }
                />

                {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

                <Card>
                    <Table
                        columns={columns}
                        data={permissionSets}
                        keyExtractor={(set) => set.id}
                        emptyMessage="No permission sets found. Create your first one to get started."
                    />
                </Card>

                {/* Create/Edit Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title={editingSet ? 'Edit Permission Set' : 'Create Permission Set'}
                    size="xl"
                >
                    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
                        <Input
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Cashier, Manager"
                            required
                            fullWidth
                        />

                        <Input
                            label="Description"
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of this permission set"
                            fullWidth
                        />

                        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Permissions</h4>

                            <div className="space-y-4">
                                {PERMISSION_GROUPS.map((group) => (
                                    <div key={group.name} className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-slate-600 pb-2">
                                            <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                                {group.name}
                                            </h5>
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
                                                    checked={!!formData[perm.key as keyof CreatePermissionSetRequest]}
                                                    onChange={() => togglePermission(perm.key)}
                                                    label={perm.label}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-slate-700">
                            <Button type="button" variant="secondary" size="sm" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                loading={submitting}
                                className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white shadow-md"
                            >
                                {editingSet ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </PageContainer>
    );
};
