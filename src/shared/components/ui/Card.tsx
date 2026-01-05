import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
}) => {
  // Responsive padding - smaller on mobile, grows on larger screens
  const paddingClasses = {
    none: '',
    sm: 'p-2 sm:p-3',
    md: 'p-3 sm:p-4',
    lg: 'p-4 sm:p-6',
  };

  const hoverClass = hover ? 'card-hover hover:shadow-lg' : '';

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-all overflow-hidden ${paddingClasses[padding]} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>
      {children}
    </h3>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

/**
 * Inner section within a card - for grouping related form fields
 * Used for sections like "Custom Amount Settings", "Cooldown Settings" etc.
 */
interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardSection: React.FC<CardSectionProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Row item within a card - for inline form elements like match items
 * Used for individual row items with inputs and actions
 */
interface CardRowProps {
  children: React.ReactNode;
  className?: string;
}

export const CardRow: React.FC<CardRowProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-700 rounded-lg px-4 py-3 border border-gray-200 dark:border-slate-600 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Section title/label text - theme-aware muted text
 */
interface CardLabelProps {
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'p' | 'h3' | 'h4';
}

export const CardLabel: React.FC<CardLabelProps> = ({ children, className = '', as: Component = 'span' }) => {
  return (
    <Component className={`text-gray-500 dark:text-gray-400 ${className}`}>
      {children}
    </Component>
  );
};
