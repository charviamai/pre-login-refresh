import React, { useEffect } from 'react';
import { Select } from './ui/Select';

export interface CountryCode {
  code: string;
  name: string;
  dial_code: string;
  flag: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: 'US', name: 'United States', dial_code: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dial_code: '+1', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', dial_code: '+44', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', dial_code: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dial_code: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial_code: '+33', flag: '🇫🇷' },
  { code: 'IN', name: 'India', dial_code: '+91', flag: '🇮🇳' },
  { code: 'JP', name: 'Japan', dial_code: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dial_code: '+86', flag: '🇨🇳' },
  { code: 'BR', name: 'Brazil', dial_code: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dial_code: '+52', flag: '🇲🇽' },
  { code: 'ES', name: 'Spain', dial_code: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', dial_code: '+39', flag: '🇮🇹' },
  { code: 'KR', name: 'South Korea', dial_code: '+82', flag: '🇰🇷' },
  { code: 'NL', name: 'Netherlands', dial_code: '+31', flag: '🇳🇱' },
  { code: 'PH', name: 'Philippines', dial_code: '+63', flag: '🇵🇭' },
  { code: 'SG', name: 'Singapore', dial_code: '+65', flag: '🇸🇬' },
  { code: 'AE', name: 'United Arab Emirates', dial_code: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dial_code: '+966', flag: '🇸🇦' },
  { code: 'ZA', name: 'South Africa', dial_code: '+27', flag: '🇿🇦' },
];

interface CountryCodePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const CountryCodePicker: React.FC<CountryCodePickerProps> = ({
  value,
  onChange,
  className,
  disabled
}) => {
  // Try to detect browser locale on mount if no value set (or default US)
  useEffect(() => {
    if (value === 'US' || !value) {
      try {
        // Get user's region from browser locale (e.g., 'en-US' -> 'US')
        const locale = navigator.language;
        if (locale && locale.includes('-')) {
          const region = locale.split('-')[1].toUpperCase();
          const country = COUNTRY_CODES.find(c => c.code === region);
          if (country && country.code !== value) {
            onChange(country.code);
          }
        }
      } catch (e) {
        // Ignore detection errors
        console.debug('Failed to detect country from locale', e);
      }
    }
  }, []); // Run once on mount

  const options = COUNTRY_CODES.map(country => ({
    value: country.code,
    label: `${country.flag} ${country.name} (${country.dial_code})`
  }));

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={options}
      className={className}
      disabled={disabled}
      label="Country" // Optional label
    />
  );
};
