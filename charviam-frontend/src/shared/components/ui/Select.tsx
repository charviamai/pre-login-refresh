import { SelectHTMLAttributes, forwardRef, useId } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, fullWidth = false, options, className = '', id, ...props }, ref) => {
    // Generate unique id if not provided
    const generatedId = useId();
    const selectId = id || `select-${props.name || generatedId}`;

    const selectClasses = `
      block w-full px-3 py-2 pr-10 border rounded-lg shadow-sm
      min-h-[40px] sm:min-h-[44px]
      text-xs sm:text-sm md:text-base
      appearance-none cursor-pointer
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:bg-gray-100 disabled:cursor-not-allowed disabled:dark:bg-slate-600
      bg-white dark:bg-slate-700 text-gray-900 dark:text-white
      truncate
      ${error
        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 dark:border-slate-600 focus:ring-slate-500 focus:border-slate-500 hover:border-slate-400 dark:hover:border-slate-500'
      }
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 transition-colors duration-200">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select ref={ref} id={selectId} className={selectClasses} {...props}>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 sm:px-3 text-gray-500">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div className="min-h-0 mt-0.5">
          {error && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>
          )}
          {helperText && !error && (
            <p className="text-[10px] sm:text-xs font-medium text-gray-500">{helperText}</p>
          )}
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
