import React, { useState, useId } from 'react';
import { COUNTRY_CODES } from './CountryCodePicker';

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  countryCode: string;
  onCountryChange: (code: string) => void;
  isAvailable?: boolean | null; // true = available (green check), false = taken (error), null = checking/neutral
  isValid?: boolean; // Basic format validation
  isLoading?: boolean; // Show loading spinner
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, helperText, countryCode, onCountryChange, className = '', isAvailable, isValid: _isValid, isLoading = false, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    // Generate unique id if not provided
    const generatedId = useId();
    const inputId = id || `phone-${props.name || generatedId}`;
    const countrySelectId = `country-${inputId}`;

    // Find selected country details
    const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

    // wrapper style to match Input.tsx exactly - thin border only
    const wrapperClasses = `
      relative flex items-center
      border rounded-md shadow-sm bg-white dark:bg-slate-800
      min-h-[40px] transition-all duration-200 ease-in-out
      ${error
        ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500 focus-within:ring-offset-0'
        : isAvailable === true
          ? 'border-green-500 focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-0'
          : isFocused
            ? 'border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-0'
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-400'
      }
      ${className}
    `;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className={wrapperClasses}>
          {/* Country Select Area (Prefix) */}
          <div className="relative flex items-center pl-2 pr-1 h-[40px]">
            <span className="flex items-center gap-0.5 text-sm text-slate-700 dark:text-slate-200 font-medium cursor-pointer">
              <span className="text-lg leading-none">{selectedCountry.flag}</span>
              <span>{selectedCountry.dial_code}</span>
              <svg className="w-3 h-3 text-gray-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>

            {/* Hidden native select for functionality */}
            <select
              id={countrySelectId}
              name="country_code"
              aria-label="Country code"
              value={countryCode}
              onChange={(e) => onCountryChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.dial_code})
                </option>
              ))}
            </select>
          </div>

          {/* Phone Input Area */}
          <input
            ref={ref}
            id={inputId}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            autoComplete="tel-national"
            className="flex-1 block w-full px-3 py-2 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-none focus:ring-0 focus:outline-none outline-none shadow-none"
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              if (props.onBlur) props.onBlur(e);
            }}
            onKeyDown={(e) => {
              // Allow: backspace, delete, tab, escape, enter, arrows
              if ([8, 9, 13, 27, 46, 37, 38, 39, 40].includes(e.keyCode)) {
                return;
              }
              // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
              if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
                return;
              }
              // Block non-numeric characters
              if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
              }
            }}
            {...props}
          />

          {/* Validation Icon (Suffix) */}
          <div className="pr-4 flex items-center">
            {/* Loading Spinner */}
            {isLoading && (
              <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}

            {!isLoading && isAvailable === true && (
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

        {/* Helpers / Errors - Updated to match Input.tsx */}
        <div className="min-h-0 mt-0.5">
          {error && (
            <p className="text-xs font-semibold text-red-600">{error}</p>
          )}
          {helperText && !error && (
            <p className="text-xs font-medium text-gray-500">{helperText}</p>
          )}
        </div>
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
