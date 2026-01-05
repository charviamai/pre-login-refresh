/**
 * AddressAutocomplete Component
 * A reusable address input with live suggestions dropdown
 * Uses Geoapify (primary) with automatic fallback to Photon/OpenStreetMap
 */

import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { useAddressAutocomplete, AddressSuggestion } from '../hooks/useAddressAutocomplete';

interface AddressAutocompleteProps {
  name: string;
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddressSelect?: (address: AddressSuggestion) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
  countryCode?: string;
  className?: string;
  disabled?: boolean;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  name,
  label,
  value,
  onChange,
  onAddressSelect,
  error,
  helperText,
  required = false,
  fullWidth = false,
  placeholder = 'Start typing an address...',
  countryCode = 'us',
  className = '',
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Generate unique id for accessibility
  const generatedId = useId();
  const inputId = `address-${name || generatedId}`;

  const { suggestions, isLoading, search, clearSuggestions, activeProvider } = useAddressAutocomplete({
    countryCode,
    debounceMs: 300,
    limit: 5,
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    search(e.target.value);
    setShowDropdown(true);
    setHighlightedIndex(-1);
  };

  // Handle suggestion selection
  const handleSelect = useCallback((suggestion: AddressSuggestion) => {
    // Create a synthetic event to update the value
    const syntheticEvent = {
      target: {
        name,
        value: suggestion.formatted,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
    
    // Notify parent of full address data
    if (onAddressSelect) {
      onAddressSelect(suggestion);
    }
    
    setShowDropdown(false);
    clearSuggestions();
    inputRef.current?.blur();
  }, [name, onChange, onAddressSelect, clearSuggestions]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        clearSuggestions();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Input styling (matching Input.tsx)
  const inputClasses = `
    block w-full px-3 py-2 border rounded-md shadow-sm
    min-h-[40px] text-base transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:bg-gray-100 disabled:cursor-not-allowed
    bg-white text-gray-900 placeholder-gray-400
    ${error
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-400'
    }
    ${fullWidth ? 'w-full' : ''}
    pr-10
    ${className}
  `;

  return (
    <div ref={containerRef} className={`relative ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700 mb-1 transition-colors duration-200">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative group">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          name={name}
          value={value}
          autoComplete="street-address"
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            if (value.length >= 3) {
              setShowDropdown(true);
            }
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={inputClasses}
        />

        {/* Loading/Search Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-fadeIn">
            {/* Provider indicator */}
            <div className="px-3 py-1.5 text-xs text-gray-400 border-b border-gray-100 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>
                {activeProvider === 'geoapify' ? 'Powered by Geoapify' : 'Powered by OpenStreetMap'}
              </span>
            </div>
            
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                className={`
                  w-full px-4 py-3 text-left text-sm transition-colors duration-150
                  flex flex-col gap-0.5
                  ${index === highlightedIndex 
                    ? 'bg-indigo-50 text-indigo-900' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                  ${index < suggestions.length - 1 ? 'border-b border-gray-100' : ''}
                `}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="font-medium">{suggestion.addressLine1 || suggestion.formatted}</span>
                {suggestion.city && (
                  <span className="text-xs text-gray-500">
                    {[suggestion.city, suggestion.stateCode, suggestion.postalCode].filter(Boolean).join(', ')}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* No results state - with manual entry instructions */}
        {showDropdown && !isLoading && value.length >= 3 && suggestions.length === 0 && isFocused && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-amber-200 rounded-lg shadow-lg p-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-700 mb-1">Address not found</p>
                <p className="text-gray-500">
                  You can manually type your complete address including:
                </p>
                <ul className="text-gray-500 mt-1 ml-4 list-disc">
                  <li>Street address</li>
                  <li>City, State, and Postal Code</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error/Helper Text */}
      <div className="min-h-0 mt-0.5">
        {error && (
          <p className="text-xs font-semibold text-red-600 animate-slideDown">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs font-medium text-gray-500">{helperText}</p>
        )}
      </div>
    </div>
  );
};

export default AddressAutocomplete;
