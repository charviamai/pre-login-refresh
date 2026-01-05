import React from 'react';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="mb-6">
      {/* Always horizontal layout - fonts and spacing scale based on screen size */}
      <div className="flex items-start justify-between gap-3 min-[350px]:gap-4">
        {/* Title and subtitle - scales with screen size */}
        <div className="min-w-0 flex-1">
          <h1 className="text-base min-[350px]:text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {/* Actions - scales with screen size */}
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
};
