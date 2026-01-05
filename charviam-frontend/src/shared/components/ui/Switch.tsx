import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
}) => {
  return (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <div
          className={`block w-14 h-8 rounded-full transition-colors pointer-events-none ${checked ? 'bg-slate-700 dark:bg-gradient-to-r dark:from-indigo-600 dark:to-purple-600' : 'bg-gray-300 dark:bg-slate-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        ></div>
        <div
          className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform shadow-sm pointer-events-none ${checked ? 'transform translate-x-6' : ''
            }`}
        ></div>
      </div>
      {label && (
        <div className="ml-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
      )}
    </label>
  );
};
