import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../shared/components/layout/PageContainer';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card } from '../../../shared/components/ui';

interface SettingsCard {
  title: string;
  description: string;
  path: string;
  icon: string;
}

const settingsCards: SettingsCard[] = [
  {
    title: 'Permission Sets',
    description: 'Create and manage permission templates for employees',
    path: '/client/settings/permission-sets',
    icon: '🔐',
  },
  {
    title: 'Audit Logs',
    description: 'View all user actions for compliance tracking',
    path: '/client/settings/audit-logs',
    icon: '📋',
  },
];

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <div className="mt-6">
        <PageHeader
          title="Settings"
          subtitle="Manage your account and configure system settings"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl">
        {settingsCards.map((card) => (
          <div
            key={card.path}
            className="cursor-pointer group"
            onClick={() => navigate(card.path)}
          >
            <Card className="h-full border border-gray-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-lg transition-all duration-200">
              <div className="p-6 flex items-start gap-4">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-3xl group-hover:bg-slate-700 dark:group-hover:bg-indigo-600 group-hover:scale-105 transition-all duration-200">
                  <span className="group-hover:grayscale group-hover:brightness-200">{card.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-slate-700 dark:group-hover:text-indigo-400">{card.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.description}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-slate-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </PageContainer>
  );
};
