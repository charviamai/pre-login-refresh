import React, { useEffect, useState } from 'react';
import { adminApi } from '../../../../shared/utils/api-service';

interface CampaignAnalyticsModalProps {
  shopId: string;
  campaignId: string;
  campaignName: string;
  onClose: () => void;
}

interface AnalyticsData {
  summary: {
    total_spins: number;
    total_budget_spent: number;
    avg_spins_per_day: number;
    avg_spend_per_day: number;
  };
  daily_breakdown: Array<{
    date: string;
    spins: number;
    budget_spent: number;
    budget_reserved: number;
  }>;
  segment_performance: Array<{
    segment_id: string;
    label: string;
    amount: number;
    total_wins: number;
    total_payout: number;
  }>;
}

export const CampaignAnalyticsModal: React.FC<CampaignAnalyticsModalProps> = ({
  shopId,
  campaignId,
  campaignName,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [shopId, campaignId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getCampaignAnalytics(shopId, campaignId);
      setData(response as AnalyticsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            📊 Analytics: {campaignName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading analytics...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Spins</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data.summary.total_spins || 0}</div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Spent</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${data.summary.total_budget_spent || 0}</div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Avg Spins/Day</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{(data.summary.avg_spins_per_day || 0).toFixed(1)}</div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Avg Spend/Day</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${(data.summary.avg_spend_per_day || 0).toFixed(2)}</div>
                </div>
              </div>

              {/* Segment Performance */}
              {data.segment_performance && data.segment_performance.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Segment Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-slate-700/50">
                          <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-400">Segment</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-600 dark:text-gray-400">Amount</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-600 dark:text-gray-400">Wins</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-600 dark:text-gray-400">Total Payout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.segment_performance.map((seg, idx) => (
                          <tr key={seg.segment_id || idx} className="border-t border-gray-100 dark:border-slate-600">
                            <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{seg.label}</td>
                            <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">${seg.amount}</td>
                            <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">{seg.total_wins}</td>
                            <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white">${seg.total_payout}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Daily Breakdown */}
              {data.daily_breakdown && data.daily_breakdown.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Daily Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-slate-700/50">
                          <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-400">Date</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-600 dark:text-gray-400">Spins</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-600 dark:text-gray-400">Budget Spent</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-600 dark:text-gray-400">Reserved</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.daily_breakdown.slice(-7).reverse().map((day, idx) => (
                          <tr key={idx} className="border-t border-gray-100 dark:border-slate-600">
                            <td className="px-4 py-2 text-gray-900 dark:text-white">{new Date(day.date).toLocaleDateString()}</td>
                            <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">{day.spins}</td>
                            <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white">${day.budget_spent}</td>
                            <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">${day.budget_reserved}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {data.daily_breakdown.length > 7 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Showing last 7 days of {data.daily_breakdown.length} total</p>
                  )}
                </div>
              )}

              {/* Empty State */}
              {(!data.daily_breakdown || data.daily_breakdown.length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No spin data yet for this campaign.</p>
                  <p className="text-sm mt-1">Data will appear after customers start spinning.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
