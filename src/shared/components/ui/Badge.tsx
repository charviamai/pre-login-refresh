import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary' | 'secondary';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variantClasses: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
    info: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    default: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300',
    primary: 'bg-slate-700 text-white dark:bg-indigo-600 dark:text-white',
    secondary: 'bg-gray-200 text-gray-600 dark:bg-slate-600 dark:text-gray-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
