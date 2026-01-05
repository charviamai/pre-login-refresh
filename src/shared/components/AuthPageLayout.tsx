import React from 'react';
import { Link } from 'react-router-dom';
import { PublicThemeToggle } from './layout/PublicThemeToggle';

interface AuthPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackLink?: boolean;
  backLinkTo?: string;
  backLinkText?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showLogo?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({
  children,
  title,
  subtitle,
  showBackLink = true,
  backLinkTo = '/',
  backLinkText = 'Back to Home',
  maxWidth = 'md',
  showLogo = true,
}) => {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{ fontFamily: 'var(--public-font-sans)' }}
    >
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4">
        <PublicThemeToggle />
      </div>

      <div className={`${maxWidthClasses[maxWidth]} w-full`}>
        {/* Header with Logo and Title */}
        {(showLogo || title) && (
          <div className="text-center mb-8">
            {showLogo && (
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="flex items-center space-x-2">
                  <img src="/logo.png" alt="ArcadeX" className="max-h-12" fetchPriority="high" loading="eager" />
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    ArcadeX
                  </h1>
                </div>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-wide mt-1 leading-none">
                  @ Charviam Product
                </span>
              </div>
            )}
            {title && (
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
        )}

        {/* Main Content */}
        {children}

        {/* Back Link */}
        {showBackLink && (
          <div className="mt-6 text-center">
            <Link
              to={backLinkTo}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {backLinkText}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
