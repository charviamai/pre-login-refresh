import React, { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Modal } from '../../../shared/components/ui';
import { Table } from '../../../shared/components/ui/Table';
import { Loading } from '../../../shared/components/Loading';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { machinesApi, ShiftTemplate } from '../../../shared/utils/api-service';
import { EditButton, DeleteButton } from '../../../shared/components/ActionIcons';

export const ShiftSettings: React.FC = () => {
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    start_time: '06:00',
    end_time: '14:00',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadShiftTemplates();
  }, []);

  const loadShiftTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await machinesApi.getShiftTemplates();
      // Handle both array and paginated response formats
      const templates = Array.isArray(data) ? data : (data?.results || []);
      setShiftTemplates(templates);
    } catch (err: any) {
      setError(err.message || 'Failed to load shift templates');
      setShiftTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      start_time: '06:00',
      end_time: '14:00',
      display_order: shiftTemplates.length,
      is_active: true,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (template: ShiftTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      start_time: template.start_time,
      end_time: template.end_time,
      display_order: template.display_order,
      is_active: template.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingTemplate) {
        await machinesApi.updateShiftTemplate(editingTemplate.id, {
          name: formData.name,
          start_time: formData.start_time,
          end_time: formData.end_time,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });
        setSuccess('Shift template updated successfully');
      } else {
        await machinesApi.createShiftTemplate({
          name: formData.name,
          start_time: formData.start_time,
          end_time: formData.end_time,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });
        setSuccess('Shift template created successfully');
      }
      setShowModal(false);
      await loadShiftTemplates();
    } catch (err: any) {
      const errorMsg = err.name || err.error || err.message || 'Failed to save shift template';
      setError(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (template: ShiftTemplate) => {
    if (!window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      setError(null);
      await machinesApi.deleteShiftTemplate(template.id);
      setSuccess('Shift template deleted successfully');
      await loadShiftTemplates();
    } catch (err: any) {
      setError(err.error || err.message || 'Failed to delete shift template');
    }
  };

  const handleToggleActive = async (template: ShiftTemplate) => {
    try {
      setError(null);
      await machinesApi.updateShiftTemplate(template.id, {
        is_active: !template.is_active,
      });
      await loadShiftTemplates();
    } catch (err: any) {
      setError(err.message || 'Failed to update shift template');
    }
  };

  // Format time for display (convert 24h to 12h format)
  const formatTime = (time24: string): string => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const columns = [
    {
      key: 'display_order',
      header: '#',
      render: (template: ShiftTemplate) => (
        <span className="text-gray-500 dark:text-gray-400">{template.display_order + 1}</span>
      ),
    },
    {
      key: 'name',
      header: 'Shift Name',
      render: (template: ShiftTemplate) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">{template.name}</span>
      ),
    },
    {
      key: 'time',
      header: 'Time',
      render: (template: ShiftTemplate) => (
        <span className="text-gray-700 dark:text-gray-300">
          {formatTime(template.start_time)} - {formatTime(template.end_time)}
          {template.is_overnight && (
            <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-400 px-2 py-0.5 rounded">
              Overnight
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (template: ShiftTemplate) => (
        <button
          onClick={() => handleToggleActive(template)}
          className={`px-3 py-1 rounded-full text-xs font-medium ${template.is_active
            ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60'
            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
        >
          {template.is_active ? 'Active' : 'Inactive'}
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (template: ShiftTemplate) => (
        <div className="flex space-x-1">
          <EditButton onClick={() => handleOpenEditModal(template)} tooltip="Edit Shift" />
          <DeleteButton onClick={() => handleDelete(template)} tooltip="Delete Shift" />
        </div>
      ),
    },
  ];

  if (loading) {
    return <Loading message="Loading shift templates..." />;
  }

  return (
    <div>
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-green-800 dark:text-green-400">{success}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Shift Templates</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Define shift schedules with default start and end times. Employees can use these as templates when recording readings.
              </p>
            </div>
            <Button onClick={handleOpenAddModal}>Add Shift</Button>
          </div>
        </CardHeader>
        <CardContent>
          {shiftTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No shift templates defined yet.</p>
              <p className="text-sm mt-2">Click "Add Shift" to create your first shift template.</p>
            </div>
          ) : (
            <Table
              data={shiftTemplates}
              columns={columns}
              keyExtractor={(template) => template.id}
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTemplate ? 'Edit Shift Template' : 'Add Shift Template'}
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="shift-form" loading={submitting} disabled={submitting}>
              {editingTemplate ? 'Save Changes' : 'Create Shift'}
            </Button>
          </div>
        }
      >
        <form id="shift-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Shift Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Morning Shift"
            required
            fullWidth
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatTime(formData.start_time)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatTime(formData.end_time)}</p>
            </div>
          </div>

          {/* Overnight indicator */}
          {formData.end_time < formData.start_time && (
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-md">
              <p className="text-sm text-purple-800 dark:text-purple-400">
                <strong>Overnight Shift:</strong> This shift crosses midnight. It will start on one day and end on the next.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Display Order"
              type="number"
              value={formData.display_order.toString()}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              min="0"
              fullWidth
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

