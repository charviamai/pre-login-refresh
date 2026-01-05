import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../../shared/utils/api-service';
import { CampaignForm } from '../components/CampaignForm';
import { CampaignAnalyticsModal } from '../components/CampaignAnalyticsModal';
import { Select, Card, CardSection, CardLabel } from '../../../../shared/components/ui';
import type { SpinCampaign, CampaignStatus } from '../../../../shared/types';

interface SpinCampaignTabProps {
  shopId: string;
}

export const SpinCampaignTab: React.FC<SpinCampaignTabProps> = ({ shopId }) => {
  const [campaigns, setCampaigns] = useState<SpinCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formModal, setFormModal] = useState<{ isOpen: boolean; campaign?: SpinCampaign }>({ isOpen: false });
  const [analyticsModal, setAnalyticsModal] = useState<{ isOpen: boolean; campaign?: SpinCampaign }>({ isOpen: false });
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadCampaigns();
  }, [shopId]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.listCampaigns(shopId) as { count: number; results: SpinCampaign[] };
      setCampaigns(response.results || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load campaigns');

    } finally {
      setLoading(false);
    }
  };

  const handleSaveCampaign = async (campaignData: Partial<SpinCampaign>) => {
    if (formModal.campaign) {
      await adminApi.updateCampaign(shopId, formModal.campaign.id, campaignData);
    } else {
      await adminApi.createCampaign(shopId, campaignData);
    }
    await loadCampaigns();
  };

  const handleStatusChange = async (campaignId: string, newStatus: CampaignStatus) => {
    try {
      await adminApi.updateCampaign(shopId, campaignId, { status: newStatus });
      await loadCampaigns();
    } catch (err: any) {
      const errorMessage = err.error || err.message || err.response?.data?.error || 'Failed to update campaign status';
      alert(errorMessage);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await adminApi.deleteCampaign(shopId, campaignId);
      await loadCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete campaign');
    }
  };

  const filteredCampaigns = statusFilter === 'ALL'
    ? campaigns
    : campaigns.filter(c => c.status === statusFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <span className="text-xl">❌</span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button and Filters */}
      <div className="flex items-center justify-between gap-4">
        {/* Filter tabs - Desktop: buttons, Mobile: dropdown */}
        <div className="flex items-center gap-2">
          {/* Desktop filter buttons */}
          <div className="hidden sm:flex gap-1">
            {(['ALL', 'ACTIVE', 'DRAFT', 'PAUSED', 'COMPLETED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          {/* Mobile filter dropdown */}
          <div className="sm:hidden">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | 'ALL')}
              options={[
                { value: 'ALL', label: 'All' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'PAUSED', label: 'Paused' },
                { value: 'COMPLETED', label: 'Completed' },
              ]}
            />
          </div>
        </div>
        {/* Create Campaign button */}
        <button
          onClick={() => setFormModal({ isOpen: true })}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        >
          + Create Campaign
        </button>
      </div>

      {filteredCampaigns.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🎰</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6">No Campaigns Found</h3>
          <button onClick={() => setFormModal({ isOpen: true })} className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors">
            Create Campaign
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {filteredCampaigns.map((campaign) => (
            <CampaignCard 
              key={campaign.id} 
              campaign={campaign} 
              setFormModal={setFormModal}
              setAnalyticsModal={setAnalyticsModal}
              handleStatusChange={handleStatusChange}
              handleDeleteCampaign={handleDeleteCampaign}
            />
          ))}
        </div>
      )}

      <CampaignForm
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false })}
        onSave={handleSaveCampaign}
        campaign={formModal.campaign}
        shopId={shopId}
      />

      {analyticsModal.isOpen && analyticsModal.campaign && (
        <CampaignAnalyticsModal
          shopId={shopId}
          campaignId={analyticsModal.campaign.id}
          campaignName={analyticsModal.campaign.name}
          onClose={() => setAnalyticsModal({ isOpen: false })}
        />
      )}
    </div>
  );
};

interface CampaignCardProps {
  campaign: SpinCampaign;
  setFormModal: (data: { isOpen: boolean; campaign?: SpinCampaign }) => void;
  setAnalyticsModal: (data: { isOpen: boolean; campaign?: SpinCampaign }) => void;
  handleStatusChange: (campaignId: string, newStatus: CampaignStatus) => Promise<void>;
  handleDeleteCampaign: (campaignId: string) => Promise<void>;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, setFormModal, setAnalyticsModal, handleStatusChange, handleDeleteCampaign }) => {
  const getStatusBadgeColor = (status: CampaignStatus): string => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      DRAFT: 'bg-gray-100 text-gray-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      ARCHIVED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDateTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Auto-generate colors from palette
  const DEFAULT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA15E', '#BC6C25', '#9B59B6'];

  return (
    <Card className="flex flex-col h-full hover:shadow-md" hover>
      {/* Content area - grows to fill space */}
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{campaign.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(campaign.status)}`}>{campaign.status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <span>📅</span>
            <span>{formatDateTime(campaign.start_datetime)} - {formatDateTime(campaign.end_datetime)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <CardSection className="p-3">
            <CardLabel as="p" className="text-xs font-medium mb-1">Daily Budget</CardLabel>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${campaign.daily_budget_total}</p>
          </CardSection>
          <CardSection className="p-3">
            <CardLabel as="p" className="text-xs font-medium mb-1">Segments</CardLabel>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.segments.length}</p>
          </CardSection>
        </div>

        <div className="mb-4">
          <CardLabel as="p" className="text-xs font-medium mb-2">Prize Segments:</CardLabel>
          <div className="flex flex-wrap gap-2">
            {campaign.segments.slice(0, 6).map((segment, index) => (
              <div key={segment.id} className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: DEFAULT_COLORS[index % DEFAULT_COLORS.length] }}>
                <span>{segment.label}</span>
                <span className="opacity-75">${segment.amount}</span>
              </div>
            ))}
            {campaign.segments.length > 6 && (
              <div className="px-3 py-1 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">+{campaign.segments.length - 6} more</div>
            )}
          </div>
        </div>
      </div>

      {/* Buttons - always at bottom */}
      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-slate-600 mt-auto">
        <button onClick={() => setFormModal({ isOpen: true, campaign })} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors">
          Edit
        </button>
        <button onClick={() => setAnalyticsModal({ isOpen: true, campaign })} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors">Analytics</button>
        {campaign.status === 'DRAFT' && (
          <button onClick={() => handleStatusChange(campaign.id, 'ACTIVE')} className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors">
            Activate
          </button>
        )}
        {campaign.status === 'ACTIVE' && (
          <button onClick={() => handleStatusChange(campaign.id, 'PAUSED')} className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg font-medium transition-colors">
            Pause
          </button>
        )}
        {campaign.status === 'PAUSED' && (
          <button onClick={() => handleStatusChange(campaign.id, 'ACTIVE')} className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors">
            Resume
          </button>
        )}
        {campaign.status !== 'ACTIVE' && (
          <button onClick={() => handleDeleteCampaign(campaign.id)} className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors">
            Delete
          </button>
        )}
      </div>
    </Card>
  );
};
