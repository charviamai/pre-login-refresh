import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'md:max-w-md',
    md: 'md:max-w-lg',
    lg: 'md:max-w-2xl',
    xl: 'md:max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity"
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-end md:items-center justify-center md:p-4">
        <div
          className={`
            relative bg-white dark:bg-slate-800 shadow-xl w-full
            ${sizeClasses[size]}
            /* Mobile: Full screen from bottom */
            rounded-t-2xl md:rounded-lg
            max-h-[90vh] md:max-h-[85vh]
            flex flex-col
            animate-slide-up md:animate-none
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Sticky on mobile */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-10 rounded-t-2xl md:rounded-t-lg">
            {/* Mobile drag handle indicator */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 dark:bg-slate-600 rounded-full md:hidden" />

            {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-2 md:mt-0">{title}</h3>}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Content - Scrollable */}
          <div className="p-4 overflow-y-auto flex-1">{children}</div>

          {/* Footer - Sticky at bottom */}
          {footer && (
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 md:rounded-b-lg sticky bottom-0">
              {footer}
            </div>
          )}
        </div>
      </div>

      {/* Animation for mobile slide-up */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
