import React from 'react';

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  isOpen,
  onToggle,
  children,
  className = '',
}) => {
  return (
    <div 
      className={`rounded-xl shadow-sm overflow-hidden ${className}`}
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* Header - dark navy style like Quick Actions */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 hover:bg-slate-600 transition-colors text-left"
        style={{ backgroundColor: '#334155' }}
      >
        <span className="text-base sm:text-lg font-semibold text-white">
          {title}
        </span>
        <svg
          className={`w-5 h-5 text-gray-300 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Content - collapsible with white background */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 sm:p-6" style={{ backgroundColor: '#ffffff' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
