import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Select, Switch, Tabs } from '../../../shared/components/ui';
import { PageContainer } from '../../../shared/components/layout/PageContainer';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Loading } from '../../../shared/components/Loading';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { adminApi } from '../../../shared/utils/api-service';
import type { Shop, ShopSettings as ShopSettingsType, ReportSettings, KioskReportFieldConfig, ShiftReportFieldConfig, MachineReportFieldConfig } from '../../../shared/types';
import { WorkforceSettingsTab } from '../workforce/WorkforceSettingsTab';
import { MatchSettingsTab } from './tabs/MatchSettingsTab';
import { SpinCampaignTab } from './tabs/SpinCampaignTab';

export const ShopSettings: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  const [shop, setShop] = useState<Shop | null>(null);
  const [settings, setSettings] = useState<ShopSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [originalValues, setOriginalValues] = useState<Record<string, string>>({});

  // Report Field Visibility state
  const [selectedReportType, setSelectedReportType] = useState<'kiosk' | 'shift' | 'machine'>('kiosk');
  const [reportSettings, setReportSettings] = useState<ReportSettings>({});

  useEffect(() => {
    if (shopId) {
      loadShopData();
    }
  }, [shopId]);

  const loadShopData = async () => {
    if (!shopId) return;

    try {
      setLoading(true);
      setError(null);

      const shopData = await adminApi.getShop(shopId);
      setShop(shopData);

      // Load report_settings from shop if available
      if (shopData.report_settings) {
        setReportSettings(shopData.report_settings);
      }

      try {
        const settingsData = await adminApi.getShopSettings(shopId);
        setSettings(settingsData);
      } catch (settingsErr) {

        setSettings({
          biometric_mode: 'FACE',
          flow_mode: 'SPIN_ONLY',
          spin_reset_type: 'DAILY',
          spin_reset_value: 1,
          spin_cooldown_hours: 0,
          birthday_spin_enabled: true,
          match_max_per_interval: 3,
          match_interval_hours: 24,
          printer_paper_size: '80MM',
          printer_footer_text: 'Thank you for playing!',
        } as any);
      }
    } catch (err: any) {

      setError(err.message || 'Failed to load shop data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllGeneralSettings = async () => {
    if (!shopId || !shop || !settings) return;

    const hasVerification = (settings.verification_palm_enabled ?? true) ||
      (settings.verification_nfc_enabled ?? true) ||
      (settings.verification_phone_enabled ?? true);
    if (!hasVerification) {
      setError('At least one verification method must be enabled');
      return;
    }
    const hasPlayType = (settings.enable_spin_promotion ?? true) ||
      (settings.enable_match_promotion ?? true);
    if (!hasPlayType) {
      setError('At least one play type must be enabled');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Include report_settings in shop update
      const shopDataToSave = {
        ...shop,
        report_settings: reportSettings,
      };
      const updatedShop = await adminApi.updateShop(shopId, shopDataToSave);
      setShop(updatedShop);

      // Update reportSettings state with what was saved
      if (updatedShop.report_settings) {
        setReportSettings(updatedShop.report_settings);
      }

      const updatedSettings = await adminApi.updateShopSettings(shopId, settings);

      setSettings(updatedSettings);

      setSuccess('All settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading message="Loading shop settings..." />;

  if (error && !shop) {
    return (
      <PageContainer>
        <ErrorBanner message={error} onClose={() => setError(null)} />
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Unable to load shop settings</p>
          <Button variant="secondary" onClick={() => navigate('/client/shops')} className="mt-4">
            Back to Shops
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!shop) return <div className="p-8 text-center text-gray-500">Shop not found</div>;
  if (!settings) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;


  // Start editing a field - store original value
  const startEdit = (fieldName: string, currentValue: string) => {
    setEditingField(fieldName);
    setOriginalValues({ ...originalValues, [fieldName]: currentValue });
  };

  // Cancel editing - revert to original value
  const cancelEdit = (fieldName: string) => {
    if (originalValues[fieldName] !== undefined) {
      setShop({ ...shop, [fieldName]: originalValues[fieldName] });
    }
    setEditingField(null);
  };

  // Editable Field Component
  const EditableField = ({
    fieldName,
    label,
    value
  }: {
    fieldName: string;
    label: string;
    value: string;
  }) => {
    const isEditing = editingField === fieldName;

    if (isEditing) {
      return (
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => setShop({ ...shop, [fieldName]: e.target.value })}
              className="w-full px-3 py-2 pr-10 border border-blue-500 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={() => cancelEdit(fieldName)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Cancel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
        <div className="relative">
          <div className="w-full px-3 py-2 pr-10 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white">
            {value !== '' && value !== null && value !== undefined ? value : <span className="text-gray-400">Not set</span>}
          </div>
          <button
            onClick={() => startEdit(fieldName, value)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // General Settings Content
  const GeneralSettingsContent = (
    <div className="space-y-6">
      {/* Combined Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Shop Settings</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Configure your shop details and preferences
              </p>
            </div>
            <Button onClick={handleSaveAllGeneralSettings} loading={saving}>
              Save All Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Row 1: Shop Name + Shop Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EditableField
              fieldName="name"
              label="Shop Name"
              value={shop.name}
            />
            {/* Shop Address - Read Only */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Shop Address
              </label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white">
                {(() => {
                  const s = shop as any;
                  const parts = [
                    s.address_line1 || s.address,
                    s.address_line2,
                    s.city,
                    s.state,
                    s.postal_code
                  ].filter(Boolean);
                  return parts.length > 0 ? parts.join(', ') : <span className="text-gray-400">Not set</span>;
                })()}
              </div>
            </div>
          </div>

          {/* Row 2: Hours + Time Zone */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200 dark:border-slate-700 pt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Opening Time
              </label>
              <input
                type="time"
                value={settings.opening_time || '09:00'}
                onChange={(e) => {

                  setSettings({ ...settings, opening_time: e.target.value });
                }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Closing Time
              </label>
              <input
                type="time"
                value={settings.closing_time || '21:00'}
                onChange={(e) => {

                  setSettings({ ...settings, closing_time: e.target.value });
                }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Select
              label="Time Zone"
              value={shop.timezone || 'America/New_York'}
              onChange={(e) => setShop({ ...shop, timezone: e.target.value })}
              options={[
                { value: 'America/New_York', label: 'Eastern Time (ET)' },
                { value: 'America/Chicago', label: 'Central Time (CT)' },
                { value: 'America/Denver', label: 'Mountain Time (MT)' },
                { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
                { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
                { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
                { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
                { value: 'UTC', label: 'UTC' },
              ]}
              fullWidth
            />
          </div>




          {/* Portal Access Row: 3 items side-by-side */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Portal Access</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Switch
                checked={shop.enable_employee_portal}
                onChange={(checked) => setShop({ ...shop, enable_employee_portal: checked })}
                label="Employee Portal"
              />
              <Switch
                checked={shop.enable_kiosk_portal}
                onChange={(checked) => setShop({ ...shop, enable_kiosk_portal: checked })}
                label="Kiosk Portal"
              />
              <Select
                label="Minimum Age"
                value={String(settings.minimum_age ?? 18)}
                onChange={(e) => setSettings({ ...settings, minimum_age: parseInt(e.target.value) })}
                options={[
                  { value: '18', label: '18 years' },
                  { value: '21', label: '21 years' },
                ]}
                fullWidth
              />
            </div>
          </div>

          {/* Verification Methods - Side by side */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Verification Settings</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Switch
                checked={settings.verification_palm_enabled ?? true}
                onChange={(checked) => setSettings({ ...settings, verification_palm_enabled: checked })}
                label="Palm Verification"
              />
              <Switch
                checked={settings.verification_nfc_enabled ?? true}
                onChange={(checked) => setSettings({ ...settings, verification_nfc_enabled: checked })}
                label="NFC Verification"
              />
              <Switch
                checked={settings.verification_phone_enabled ?? true}
                onChange={(checked) => setSettings({ ...settings, verification_phone_enabled: checked })}
                label="Phone Verification"
              />
            </div>
            {(!(settings.verification_palm_enabled ?? true) &&
              !(settings.verification_nfc_enabled ?? true) &&
              !(settings.verification_phone_enabled ?? true)) && (
                <p className="text-sm text-red-500 mt-3">At least one verification method must be enabled</p>
              )}
          </div>

          {/* Play Types - Side by side */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Play Types</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Switch
                checked={settings.enable_spin_promotion ?? true}
                onChange={(checked) => setSettings({ ...settings, enable_spin_promotion: checked })}
                label="Spin Promotion"
              />
              <Switch
                checked={settings.enable_match_promotion ?? true}
                onChange={(checked) => setSettings({ ...settings, enable_match_promotion: checked })}
                label="Match Promotion"
              />
              <Switch
                checked={settings.birthday_spin_enabled ?? true}
                onChange={(checked) => setSettings({ ...settings, birthday_spin_enabled: checked })}
                label="Birthday Spin Bonus"
              />
            </div>
            {!(settings.enable_spin_promotion ?? true) && !(settings.enable_match_promotion ?? true) && (
              <p className="text-sm text-red-500 mt-3"> At least one play type must be enabled</p>
            )}
          </div>

          {/* Printer Settings */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Printer Settings</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Paper Size"
                value={settings.printer_paper_size ?? '80MM'}
                onChange={(e) => setSettings({ ...settings, printer_paper_size: e.target.value })}
                options={[
                  { value: '58MM', label: '58mm' },
                  { value: '80MM', label: '80mm' },
                ]}
                fullWidth
              />
              <Input
                label="Footer Text"
                value={settings.printer_footer_text ?? 'Thank you!'}
                onChange={(e) => setSettings({ ...settings, printer_footer_text: e.target.value })}
                helperText="Text on printed tickets"
                fullWidth
              />
            </div>
          </div>

          {/* Report Field Visibility */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Report Field Visibility</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Configure which fields appear in each report type for this shop
            </p>

            {/* Report Type Dropdown */}
            <div className="mb-4">
              <Select
                label="Report Type"
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value as 'kiosk' | 'shift' | 'machine')}
                options={[
                  { value: 'kiosk', label: 'Kiosk Report' },
                  { value: 'shift', label: 'Shift Report' },
                  { value: 'machine', label: 'Machine Report' },
                ]}
                fullWidth
              />
            </div>

            {/* Kiosk Report Fields */}
            {selectedReportType === 'kiosk' && (
              <div className="space-y-4">
                {/* Transaction Details Section */}
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Transaction Details</p>
                    <Switch
                      checked={reportSettings.kiosk?.showTransactionDetails ?? true}
                      onChange={(checked) => setReportSettings(prev => ({
                        ...prev,
                        kiosk: { ...prev.kiosk, showTransactionDetails: checked } as KioskReportFieldConfig
                      }))}
                      label="Show Section"
                    />
                  </div>
                  {(reportSettings.kiosk?.showTransactionDetails ?? true) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Switch
                        checked={reportSettings.kiosk?.showRowNumber ?? true}
                        onChange={(checked) => setReportSettings(prev => ({
                          ...prev,
                          kiosk: { ...prev.kiosk, showRowNumber: checked } as KioskReportFieldConfig
                        }))}
                        label="Row #"
                      />
                      <Switch
                        checked={reportSettings.kiosk?.showCustomer ?? true}
                        onChange={(checked) => setReportSettings(prev => ({
                          ...prev,
                          kiosk: { ...prev.kiosk, showCustomer: checked } as KioskReportFieldConfig
                        }))}
                        label="Customer"
                      />
                      <Switch
                        checked={reportSettings.kiosk?.showPhone ?? true}
                        onChange={(checked) => setReportSettings(prev => ({
                          ...prev,
                          kiosk: { ...prev.kiosk, showPhone: checked } as KioskReportFieldConfig
                        }))}
                        label="Phone"
                      />
                      <Switch
                        checked={reportSettings.kiosk?.showType ?? true}
                        onChange={(checked) => setReportSettings(prev => ({
                          ...prev,
                          kiosk: { ...prev.kiosk, showType: checked } as KioskReportFieldConfig
                        }))}
                        label="Type"
                      />
                      <Switch
                        checked={reportSettings.kiosk?.showAmount ?? true}
                        onChange={(checked) => setReportSettings(prev => ({
                          ...prev,
                          kiosk: { ...prev.kiosk, showAmount: checked } as KioskReportFieldConfig
                        }))}
                        label="Amount"
                      />
                      <Switch
                        checked={reportSettings.kiosk?.showStatus ?? true}
                        onChange={(checked) => setReportSettings(prev => ({
                          ...prev,
                          kiosk: { ...prev.kiosk, showStatus: checked } as KioskReportFieldConfig
                        }))}
                        label="Status"
                      />
                      <Switch
                        checked={reportSettings.kiosk?.showDateTime ?? true}
                        onChange={(checked) => setReportSettings(prev => ({
                          ...prev,
                          kiosk: { ...prev.kiosk, showDateTime: checked } as KioskReportFieldConfig
                        }))}
                        label="Date/Time"
                      />
                    </div>
                  )}
                </div>

                {/* Summary Section */}
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Summary Cards</p>
                  <Switch
                    checked={reportSettings.kiosk?.showSummary ?? true}
                    onChange={(checked) => setReportSettings(prev => ({
                      ...prev,
                      kiosk: { ...prev.kiosk, showSummary: checked } as KioskReportFieldConfig
                    }))}
                    label="Show Summary (Total Plays, Spins, Matches, Amounts)"
                  />
                </div>

                {/* Status Breakdown Section */}
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Status Breakdown</p>
                    <Switch
                      checked={reportSettings.kiosk?.showStatusBreakdown ?? true}
                      onChange={(checked) => setReportSettings(prev => ({
                        ...prev,
                        kiosk: { ...prev.kiosk, showStatusBreakdown: checked } as KioskReportFieldConfig
                      }))}
                      label="Show Section"
                    />
                  </div>
                  {(reportSettings.kiosk?.showStatusBreakdown ?? true) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Switch
                        checked={reportSettings.kiosk?.showRedeemed ?? true}
                        onChange={(checked) => setReportSettings(prev => ({
                          ...prev,
                          kiosk: { ...prev.kiosk, showRedeemed: checked } as KioskReportFieldConfig
                        }))}
                        label="Redeemed"
                      />
                      <Switch
                        checked={reportSettings.kiosk?.showUnredeemed ?? true}
                        onChange={(checked) => setReportSettings(prev => ({
                          ...prev,
                          kiosk: { ...prev.kiosk, showUnredeemed: checked } as KioskReportFieldConfig
                        }))}
                        label="Unredeemed"
                      />
                      <Switch
                        checked={reportSettings.kiosk?.showExpired ?? true}
                        onChange={(checked) => setReportSettings(prev => ({
                          ...prev,
                          kiosk: { ...prev.kiosk, showExpired: checked } as KioskReportFieldConfig
                        }))}
                        label="Expired"
                      />
                      <Switch
                        checked={reportSettings.kiosk?.showCancelled ?? true}
                        onChange={(checked) => setReportSettings(prev => ({
                          ...prev,
                          kiosk: { ...prev.kiosk, showCancelled: checked } as KioskReportFieldConfig
                        }))}
                        label="Cancelled"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Shift Report Fields */}
            {selectedReportType === 'shift' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Switch
                  checked={reportSettings.shift?.showRowNumber ?? true}
                  onChange={(checked) => setReportSettings(prev => ({
                    ...prev,
                    shift: { ...prev.shift, showRowNumber: checked } as ShiftReportFieldConfig
                  }))}
                  label="Row #"
                />
                <Switch
                  checked={reportSettings.shift?.showEmployee ?? true}
                  onChange={(checked) => setReportSettings(prev => ({
                    ...prev,
                    shift: { ...prev.shift, showEmployee: checked } as ShiftReportFieldConfig
                  }))}
                  label="Employee"
                />
                <Switch
                  checked={reportSettings.shift?.showStartTime ?? true}
                  onChange={(checked) => setReportSettings(prev => ({
                    ...prev,
                    shift: { ...prev.shift, showStartTime: checked } as ShiftReportFieldConfig
                  }))}
                  label="Start Time"
                />
                <Switch
                  checked={reportSettings.shift?.showEndTime ?? true}
                  onChange={(checked) => setReportSettings(prev => ({
                    ...prev,
                    shift: { ...prev.shift, showEndTime: checked } as ShiftReportFieldConfig
                  }))}
                  label="End Time"
                />
                <Switch
                  checked={reportSettings.shift?.showDuration ?? true}
                  onChange={(checked) => setReportSettings(prev => ({
                    ...prev,
                    shift: { ...prev.shift, showDuration: checked } as ShiftReportFieldConfig
                  }))}
                  label="Duration"
                />
                <Switch
                  checked={reportSettings.shift?.showStatus ?? true}
                  onChange={(checked) => setReportSettings(prev => ({
                    ...prev,
                    shift: { ...prev.shift, showStatus: checked } as ShiftReportFieldConfig
                  }))}
                  label="Status"
                />
              </div>
            )}

            {/* Machine Report Fields */}
            {selectedReportType === 'machine' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Switch
                  checked={reportSettings.machine?.showRowNumber ?? true}
                  onChange={(checked) => setReportSettings(prev => ({
                    ...prev,
                    machine: { ...prev.machine, showRowNumber: checked } as MachineReportFieldConfig
                  }))}
                  label="Row #"
                />
                <Switch
                  checked={reportSettings.machine?.showMachineId ?? true}
                  onChange={(checked) => setReportSettings(prev => ({
                    ...prev,
                    machine: { ...prev.machine, showMachineId: checked } as MachineReportFieldConfig
                  }))}
                  label="Machine ID"
                />
                <Switch
                  checked={reportSettings.machine?.showLocation ?? true}
                  onChange={(checked) => setReportSettings(prev => ({
                    ...prev,
                    machine: { ...prev.machine, showLocation: checked } as MachineReportFieldConfig
                  }))}
                  label="Location"
                />
                <Switch
                  checked={reportSettings.machine?.showStatus ?? true}
                  onChange={(checked) => setReportSettings(prev => ({
                    ...prev,
                    machine: { ...prev.machine, showStatus: checked } as MachineReportFieldConfig
                  }))}
                  label="Status"
                />
                <Switch
                  checked={reportSettings.machine?.showLastActive ?? true}
                  onChange={(checked) => setReportSettings(prev => ({
                    ...prev,
                    machine: { ...prev.machine, showLastActive: checked } as MachineReportFieldConfig
                  }))}
                  label="Last Active"
                />
              </div>
            )}
          </div>

          {/* Bottom Save Button */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-6 flex justify-end">
            <Button onClick={handleSaveAllGeneralSettings} loading={saving}>
              Save All Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workforce Settings - Separate Card (Unchanged) */}
      <Card>
        <CardHeader>
          <CardTitle>Workforce Settings</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage employees and shifts for this shop
          </p>
        </CardHeader>
        <CardContent>
          <WorkforceSettingsTab shopId={shopId!} shopName={shop.name} />
        </CardContent>
      </Card>
    </div >
  );

  // Spin Settings Content
  const SpinSettingsContent = (
    <div>
      {shopId ? <SpinCampaignTab shopId={shopId} /> : <Loading message="Loading..." />}
    </div>
  );

  // Match Settings Content
  const MatchSettingsContent = (
    <MatchSettingsTab
      matchItems={shop?.match_game_settings?.match_items || [5, 10, 20, 30]}
      matchMinItems={shop?.match_game_settings?.match_min_items || 4}
      matchAllowCustomAmount={shop?.match_game_settings?.match_allow_custom_amount || false}
      matchCustomMultiplier={shop?.match_game_settings?.match_custom_multiplier || 5}
      matchCustomAmountMin={shop?.match_game_settings?.match_custom_amount_min || 5}
      matchCustomAmountMax={shop?.match_game_settings?.match_custom_amount_max || 500}
      matchCooldownHours={shop?.match_game_settings?.match_cooldown_hours || 8}
      matchVerificationRequired={shop?.match_game_settings?.match_verification_required ?? true}
      onSave={async (matchSettings) => {
        if (!shopId) return;
        try {
          setSaving(true);
          setError(null);
          await adminApi.updateMatchGameSettings(shopId, matchSettings);
          const updated = await adminApi.getShop(shopId);
          setShop(updated);
          setSuccess('Match settings saved successfully');
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError(err.message || 'Failed to save match settings');
        } finally {
          setSaving(false);
        }
      }}
      saving={saving}
    />
  );

  const settingsTabs = [
    { id: 'general', label: 'General', content: GeneralSettingsContent },
    { id: 'spin', label: 'Spin', content: SpinSettingsContent },
    { id: 'match', label: 'Match', content: MatchSettingsContent },
  ];

  return (
    <PageContainer>
      <div className="mt-6">
        <PageHeader
          title={`${shop.name} Settings`}
          subtitle="Configure shop-specific settings"
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/client/shops')}
              className="text-xs min-[350px]:text-sm"
            >
              ← Shop Management
            </Button>
          }
        />
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
          {success}
        </div>
      )}

      <Tabs tabs={settingsTabs} defaultTab="general" />
    </PageContainer>
  );
};
