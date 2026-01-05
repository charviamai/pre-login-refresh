import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../../shared/components/ui/Modal';
import type { SpinCampaign, CampaignSegment } from '../../../../shared/types';

interface CampaignFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaign: Partial<SpinCampaign>) => Promise<void>;
  campaign?: SpinCampaign;
  shopId: string;
}

// Default color palette for wheel segments (auto-assigned by index)
const DEFAULT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA15E', '#BC6C25', '#9B59B6'];

const DEFAULT_SEGMENTS: Omit<CampaignSegment, 'id'>[] = [
  { segment_order: 0, label: '$50', amount: 50, daily_win_limit: 5, is_active: true },
  { segment_order: 1, label: '$25', amount: 25, daily_win_limit: 10, is_active: true },
  { segment_order: 2, label: '$10', amount: 10, daily_win_limit: 20, is_active: true },
  { segment_order: 3, label: '$5', amount: 5, daily_win_limit: 40, is_active: true },
  { segment_order: 4, label: 'Better luck!', amount: 0, daily_win_limit: null, is_active: true },
];

// Helper to get datetime-local input value - MUST use local time, not UTC!
const toDatetimeLocal = (isoString?: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  // Format as YYYY-MM-DDTHH:MM in local time (required by datetime-local input)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper to get default datetime values
const getDefaultDatetimes = () => {
  const now = new Date();
  const start = toDatetimeLocal(now.toISOString());
  const end = toDatetimeLocal(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString());
  return { start, end };
};

// Wheel Preview Component
const WheelPreview: React.FC<{ segments: CampaignSegment[] }> = ({ segments }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 200;
    const radius = size / 2 - 10;
    const centerX = size / 2;
    const centerY = size / 2;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    const activeSegments = segments.filter(s => s.is_active);
    if (activeSegments.length === 0) return;

    const anglePerSegment = (2 * Math.PI) / activeSegments.length;
    let startAngle = -Math.PI / 2;

    activeSegments.forEach((segment, index) => {
      const endAngle = startAngle + anglePerSegment;
      const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length];

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label
      const labelAngle = startAngle + anglePerSegment / 2;
      const labelRadius = radius * 0.65;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;

      ctx.save();
      ctx.translate(labelX, labelY);
      ctx.rotate(labelAngle + Math.PI / 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(segment.label.slice(0, 8), 0, 0);
      ctx.restore();

      startAngle = endAngle;
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#1f2937';
    ctx.fill();
  }, [segments]);

  return <canvas ref={canvasRef} width={200} height={200} className="mx-auto" />;
};

export const CampaignForm: React.FC<CampaignFormProps> = ({ isOpen, onClose, onSave, campaign, shopId }) => {
  const [formData, setFormData] = useState<Partial<SpinCampaign>>({});
  const [segments, setSegments] = useState<CampaignSegment[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minStartDate, setMinStartDate] = useState<string>(''); // For validation

  useEffect(() => {
    if (isOpen) {
      if (campaign) {
        setFormData({ ...campaign, shop: shopId });
        setSegments([...campaign.segments].sort((a, b) => a.segment_order - b.segment_order));
        // For edit: can't go before original start date
        setMinStartDate(campaign.start_datetime || '');
      } else {
        const { start, end } = getDefaultDatetimes();
        setFormData({
          shop: shopId,
          name: '',
          status: 'DRAFT',
          start_datetime: start,
          end_datetime: end,
          daily_budget_total: 100,
          enable_pacing: true,
          pacing_interval_minutes: 60,
          spin_cooldown_hours: 24,
        });
        setSegments(DEFAULT_SEGMENTS.map((s, i) => ({ ...s, id: `temp-${i}` } as CampaignSegment)));
        // For new: can't go before now
        setMinStartDate(new Date().toISOString());
      }
      setError(null);
    }
  }, [isOpen, campaign, shopId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate: at least one segment
    if (segments.length === 0) {
      setError('Please add at least one segment');
      return;
    }

    // Validate: must have $0 segment
    const hasZeroSegment = segments.some(s => s.amount === 0);
    if (!hasZeroSegment) {
      setError('A "Better luck" segment ($0) is required');
      return;
    }

    // Validate: start date must be >= minimum allowed date
    if (formData.start_datetime && minStartDate) {
      const startDate = new Date(formData.start_datetime);
      const minDate = new Date(minStartDate);
      if (startDate < minDate) {
        const formattedMin = minDate.toLocaleString();
        setError(campaign
          ? `Start date cannot be before the original date: ${formattedMin}`
          : `Start date must be in the future`);
        return;
      }
    }

    // Validate: end date must be after start date
    if (formData.start_datetime && formData.end_datetime) {
      if (new Date(formData.end_datetime) <= new Date(formData.start_datetime)) {
        setError('End date must be after start date');
        return;
      }
    }

    try {
      setSaving(true);
      await onSave({
        ...formData,
        segments: segments.map((s, idx) => ({ ...s, segment_order: idx })),
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSegment = () => {
    const newSegment: CampaignSegment = {
      id: `temp-${Date.now()}`,
      segment_order: segments.length,
      label: `Prize ${segments.length + 1}`,
      amount: 10,
      daily_win_limit: 10,
      is_active: true,
    };
    setSegments([...segments, newSegment]);
  };

  const removeSegment = (index: number) => {
    // Must keep at least one segment, and must keep at least one $0 segment
    const zeroSegments = segments.filter(s => s.amount === 0);
    if (segments[index].amount === 0 && zeroSegments.length === 1) {
      setError('Must keep at least one "Better luck" ($0) segment');
      return;
    }
    if (segments.length <= 1) {
      setError('Must have at least one segment');
      return;
    }
    setError(null);
    setSegments(segments.filter((_, i) => i !== index));
  };

  const updateSegment = (index: number, field: string, value: any) => {
    setSegments(segments.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  // Auto-suggest daily limits based on budget and segment amounts
  const autoSuggestLimits = () => {
    const dailyBudget = formData.daily_budget_total || 100;
    const paidSegments = segments.filter(s => s.amount > 0);

    if (paidSegments.length === 0) return;

    // Strategy: Allocate budget proportionally, favoring lower-value prizes (more wins)
    // Higher prizes get fewer wins, lower prizes get more wins
    // Formula: limit = (budget_share / amount), where budget_share is inversely proportional to amount

    const totalInverseWeight = paidSegments.reduce((sum, s) => sum + (1 / s.amount), 0);

    // First pass: calculate suggested limits using Math.round for better accuracy
    let newSegments = segments.map(seg => {
      if (seg.amount === 0) return seg; // $0 segment stays unlimited

      // Each segment gets budget share inversely proportional to its amount
      const inverseWeight = 1 / seg.amount;
      const budgetShare = (inverseWeight / totalInverseWeight) * dailyBudget;
      const suggestedLimit = Math.max(1, Math.round(budgetShare / seg.amount));

      return { ...seg, daily_win_limit: suggestedLimit };
    });

    // Second pass: calculate total and adjust to fill remaining budget
    let currentTotal = newSegments.reduce((sum, seg) => {
      if (seg.amount === 0) return sum;
      return sum + (seg.amount * (seg.daily_win_limit || 0));
    }, 0);

    // If under budget, add to the lowest-value paid segment
    const sortedByAmount = [...paidSegments].sort((a, b) => a.amount - b.amount);
    while (currentTotal < dailyBudget && sortedByAmount.length > 0) {
      const lowestSeg = sortedByAmount[0];
      if (currentTotal + lowestSeg.amount <= dailyBudget) {
        newSegments = newSegments.map(seg =>
          seg.id === lowestSeg.id
            ? { ...seg, daily_win_limit: (seg.daily_win_limit || 0) + 1 }
            : seg
        );
        currentTotal += lowestSeg.amount;
      } else {
        break;
      }
    }

    setSegments(newSegments);
  };

  // Calculate suggested limit for a single segment (for hints)
  const getSuggestedLimit = (amount: number): number => {
    if (amount === 0) return 0;
    const dailyBudget = formData.daily_budget_total || 100;
    // Simple suggestion: budget / amount / number of paid segments
    const paidSegments = segments.filter(s => s.amount > 0).length || 1;
    return Math.max(1, Math.floor(dailyBudget / amount / paidSegments));
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="campaign-form"
        disabled={saving}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
      >
        {saving ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={campaign ? 'Edit Campaign' : 'Create Campaign'} size="xl" footer={footer}>
      <form id="campaign-form" onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">{error}</div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Basic Information</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Name *</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="e.g., Summer Jackpot 2024"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={toDatetimeLocal(formData.start_datetime)}
                onChange={(e) => updateField('start_datetime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date & Time *</label>
              <input
                type="datetime-local"
                required
                min={toDatetimeLocal(formData.start_datetime) || toDatetimeLocal(new Date().toISOString())}
                value={toDatetimeLocal(formData.end_datetime)}
                onChange={(e) => updateField('end_datetime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Budget & Settings */}
        <div className="space-y-4 border-t border-gray-200 dark:border-slate-600 pt-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Budget & Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily Budget ($) *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.daily_budget_total || 100}
                onChange={(e) => updateField('daily_budget_total', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum amount to give away per day</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Spin Cooldown (hours) *</label>
              <input
                type="number"
                required
                min="0"
                max="168"
                value={formData.spin_cooldown_hours ?? 24}
                onChange={(e) => updateField('spin_cooldown_hours', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">How often each customer can spin (0 = no cooldown)</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.enable_pacing || false}
                onChange={(e) => updateField('enable_pacing', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Prize Pacing</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 -mt-2">Distribute prizes evenly throughout the day</p>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.reset_cooldown_on_open ?? true}
                onChange={(e) => updateField('reset_cooldown_on_open', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reset Cooldown on Shop Open</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 -mt-2">Allow customers to spin again when shop opens for a new day, regardless of cooldown</p>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.require_employee_approval ?? true}
                onChange={(e) => updateField('require_employee_approval', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Require Employee Approval</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 -mt-2">If enabled, an employee must scan the ticket to redeem. If disabled, prize is auto-approved at creation.</p>
          </div>
        </div>

        {/* Peak Hours Settings */}
        <div className="space-y-4 border-t border-gray-200 dark:border-slate-600 pt-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Peak Hours Configuration</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
            Optionally boost prize probability during high-traffic hours to encourage visits during peak times.
          </p>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.enable_peak_hours || false}
                onChange={(e) => updateField('enable_peak_hours', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Peak Hours Multiplier</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 -mt-2">
              Increase prize weights during specified hours
            </p>
          </div>

          {formData.enable_peak_hours && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required={formData.enable_peak_hours}
                    value={formData.peak_start_time || ''}
                    onChange={(e) => updateField('peak_start_time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">e.g., 17:00 (5pm)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time *</label>
                  <input
                    type="time"
                    required={formData.enable_peak_hours}
                    value={formData.peak_end_time || ''}
                    onChange={(e) => updateField('peak_end_time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">e.g., 21:00 (9pm)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Multiplier *</label>
                  <input
                    type="number"
                    required={formData.enable_peak_hours}
                    min="1.0"
                    max="10.0"
                    step="0.1"
                    value={formData.peak_multiplier ?? 1.5}
                    onChange={(e) => updateField('peak_multiplier', parseFloat(e.target.value) || 1.5)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.peak_multiplier ?? 1.5} = {Math.round(((formData.peak_multiplier ?? 1.5) - 1) * 100)}% boost
                  </p>
                </div>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>How it works:</strong> During peak hours ({formData.peak_start_time || '17:00'} - {formData.peak_end_time || '21:00'}),
                  prize weights are multiplied by {formData.peak_multiplier ?? 1.5}x, making customers more likely to win valuable prizes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Wheel Preview + Prize Segments */}
        <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Prize Segments ({segments.length})</h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={autoSuggestLimits}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
              >
                ✨ Auto-Suggest Limits
              </button>
              <button
                type="button"
                onClick={addSegment}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium"
              >
                + Add Segment
              </button>
            </div>
          </div>

          {/* Wheel Preview + Budget Summary - Side by Side */}
          <div className="bg-gray-100 dark:bg-slate-700/50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Wheel */}
              <div className="text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Wheel Preview</p>
                <WheelPreview segments={segments} />
              </div>

              {/* Budget Summary */}
              {(() => {
                const dailyBudget = formData.daily_budget_total || 100;
                const maxPotential = segments.reduce((sum, seg) => {
                  if (seg.amount === 0) return sum;
                  const limit = seg.daily_win_limit || 0;
                  return sum + (seg.amount * limit);
                }, 0);
                const unlimitedSegments = segments.filter(s => s.amount > 0 && !s.daily_win_limit);
                const budgetExceeded = maxPotential > dailyBudget;

                return (
                  <div className={`rounded-lg p-3 border ${budgetExceeded ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' : 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700'}`}>
                    <h5 className={`text-sm font-semibold mb-2 ${budgetExceeded ? 'text-yellow-800 dark:text-yellow-200' : 'text-green-800 dark:text-green-200'}`}>
                      Budget Summary
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Daily Budget</span>
                        <span className="font-bold text-gray-900 dark:text-white">${dailyBudget}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Max Potential</span>
                        <span className={`font-bold ${budgetExceeded ? 'text-yellow-700 dark:text-yellow-300' : 'text-green-700 dark:text-green-300'}`}>
                          ${maxPotential || '∞'}
                          {unlimitedSegments.length > 0 && <span className="text-xs font-normal"> ({unlimitedSegments.length} unlimited)</span>}
                        </span>
                      </div>
                    </div>
                    {budgetExceeded && (
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                        ⚠ Max potential exceeds budget. The daily budget will act as a hard limit - once ${dailyBudget} is spent, only $0 prizes will be given.
                      </p>
                    )}
                    {!budgetExceeded && maxPotential > 0 && (
                      <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                        ✓ Within budget
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {segments.map((segment, index) => (
              <div key={segment.id} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: DEFAULT_COLORS[index % DEFAULT_COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Segment {index + 1}</span>
                  </div>
                  {/* Allow remove if: not the last segment AND (not $0 OR there are multiple $0 segments) */}
                  {(() => {
                    const zeroSegments = segments.filter(s => s.amount === 0);
                    const isLastZeroSegment = segment.amount === 0 && zeroSegments.length === 1;
                    const canRemove = segments.length > 1 && !isLastZeroSegment;
                    return canRemove && (
                      <button
                        type="button"
                        onClick={() => removeSegment(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Label</label>
                    <input
                      type="text"
                      value={segment.label}
                      onChange={(e) => updateSegment(index, 'label', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Amount ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={segment.amount}
                      onChange={(e) => updateSegment(index, 'amount', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 cursor-help"
                      title="Maximum number of times this prize can be won per day. Leave empty for unlimited."
                    >
                      Daily Limit
                      <span className="ml-1 text-gray-400">ⓘ</span>
                      {segment.amount > 0 && (
                        <span className="text-gray-400 font-normal ml-1">
                          (max ${segment.amount * (segment.daily_win_limit || 0)}/day)
                        </span>
                      )}
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        min="1"
                        placeholder="Unlimited"
                        value={segment.daily_win_limit || ''}
                        onChange={(e) => updateSegment(index, 'daily_win_limit', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white disabled:opacity-50"
                        disabled={segment.amount === 0}
                      />
                      {segment.amount > 0 && !segment.daily_win_limit && (
                        <button
                          type="button"
                          onClick={() => updateSegment(index, 'daily_win_limit', getSuggestedLimit(segment.amount))}
                          className="px-2 py-1 text-xs bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-700 dark:text-gray-200 rounded whitespace-nowrap"
                          title={`Suggest: ${getSuggestedLimit(segment.amount)}`}
                        >
                          →{getSuggestedLimit(segment.amount)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
