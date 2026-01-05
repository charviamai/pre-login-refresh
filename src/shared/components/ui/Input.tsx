import { InputHTMLAttributes, forwardRef, useState, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  showPasswordToggle?: boolean; // Enable password visibility toggle
  isAvailable?: boolean | null; // true = available (green check), false = taken (error), null = checking/neutral
  isLoading?: boolean; // Show loading spinner
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth = false, className = '', type = 'text', showPasswordToggle = false, isAvailable, isLoading = false, id, autoComplete, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === 'password' || showPasswordToggle;
    const inputType = isPasswordType && showPassword ? 'text' : type;

    // Generate unique id if not provided
    const generatedId = useId();
    const inputId = id || `input-${props.name || generatedId}`;

    // Determine autocomplete value based on field type/name
    const getAutoComplete = (): string => {
      if (autoComplete) return autoComplete;
      if (props.name === 'email' || type === 'email') return 'email';
      if (props.name === 'name_first') return 'given-name';
      if (props.name === 'name_last') return 'family-name';
      if (props.name === 'password' || type === 'password') return 'new-password';
      if (props.name === 'password_confirm') return 'new-password';
      if (props.name === 'phone' || type === 'tel') return 'tel';
      return 'off';
    };

    const inputClasses = `
      block w-full max-w-full box-border px-3 py-2 border rounded-lg shadow-sm
      min-h-[40px] sm:min-h-[44px]
      text-xs sm:text-sm md:text-base
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:bg-gray-100 disabled:cursor-not-allowed disabled:dark:bg-slate-600
      bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400
      ${error
        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' // Error state
        : isAvailable === true
          ? 'border-green-500 focus:ring-green-500 focus:border-green-500' // Success state
          : 'border-gray-300 dark:border-slate-600 focus:ring-slate-500 focus:border-slate-500 hover:border-slate-400 dark:hover:border-slate-500' // Default state
      }
      ${fullWidth ? 'w-full' : ''}
      ${(isPasswordType && showPasswordToggle) || isAvailable !== undefined || isLoading ? 'pr-6' : ''}
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
        <div className="relative group">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            autoComplete={getAutoComplete()}
            className={inputClasses}
            {...props}
          />

          {/* Suffix Icons Area */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2 pointer-events-none">

            {/* Loading Spinner */}
            {isLoading && (
              <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}

            {/* Password Toggle (interactive, needs pointer-events-auto) */}
            {!isLoading && isPasswordType && showPasswordToggle && (
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200 pointer-events-auto cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            )}

            {/* Validation Icons */}
            {!isLoading && isAvailable === true && !error && (
              <svg className="w-5 h-5 text-green-500 transform transition-transform duration-300 scale-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {!isLoading && error && (
              <svg className="w-5 h-5 text-red-500 transform transition-transform duration-300 scale-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
        </div>

        <div className="min-h-0 mt-0.5">
          {error && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 animate-slideDown">{error}</p>
          )}
          {helperText && !error && (
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 animate-fadeIn">{helperText}</p>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';
