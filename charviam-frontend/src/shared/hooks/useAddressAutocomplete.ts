/**
 * Custom hook for address autocomplete with automatic failover
 * Primary: Geoapify (3,000 req/day, needs API key)
 * Fallback: Photon/OpenStreetMap (free, no API key, but less reliable)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import axios, { AxiosError } from 'axios';

export interface AddressSuggestion {
  id: string;
  formatted: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  stateCode: string;
  postalCode: string;
  country: string;
  countryCode: string;
  provider: 'geoapify' | 'photon';
}

interface UseAddressAutocompleteOptions {
  debounceMs?: number;
  countryCode?: string; // Filter results to specific country (e.g., 'us')
  limit?: number;
}

interface UseAddressAutocompleteReturn {
  suggestions: AddressSuggestion[];
  isLoading: boolean;
  error: string | null;
  activeProvider: 'geoapify' | 'photon' | null;
  search: (query: string) => void;
  clearSuggestions: () => void;
}

// US state name to code mapping
const US_STATE_CODES: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'district of columbia': 'DC', 'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI',
  'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME',
  'maryland': 'MD', 'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN',
  'mississippi': 'MS', 'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE',
  'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM',
  'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX',
  'utah': 'UT', 'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA',
  'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
};

const getStateCode = (stateName: string): string => {
  if (!stateName) return '';
  // If already a code (2 chars), return as-is
  if (stateName.length === 2) return stateName.toUpperCase();
  return US_STATE_CODES[stateName.toLowerCase()] || stateName;
};

// Parse Geoapify response
const parseGeoapifyResult = (feature: any): AddressSuggestion => {
  const props = feature.properties;
  return {
    id: feature.properties.place_id || `geo-${Math.random().toString(36).slice(2)}`,
    formatted: props.formatted || '',
    addressLine1: [props.housenumber, props.street].filter(Boolean).join(' ') || props.name || '',
    addressLine2: props.address_line2 || '',
    city: props.city || props.town || props.village || props.municipality || '',
    state: props.state || '',
    stateCode: props.state_code?.toUpperCase() || getStateCode(props.state || ''),
    postalCode: props.postcode || '',
    country: props.country || '',
    countryCode: props.country_code?.toUpperCase() || '',
    provider: 'geoapify',
  };
};

// Parse Photon/OpenStreetMap response
const parsePhotonResult = (feature: any): AddressSuggestion => {
  const props = feature.properties;
  const name = props.name || '';
  const street = props.street || '';
  const housenumber = props.housenumber || '';
  
  // Build address line 1
  let addressLine1 = '';
  if (housenumber && street) {
    addressLine1 = `${housenumber} ${street}`;
  } else if (street) {
    addressLine1 = street;
  } else if (name) {
    addressLine1 = name;
  }

  // Build formatted address
  const parts = [
    addressLine1,
    props.city || props.town || props.village || '',
    props.state || '',
    props.postcode || '',
    props.country || ''
  ].filter(Boolean);

  return {
    id: props.osm_id?.toString() || `photon-${Math.random().toString(36).slice(2)}`,
    formatted: parts.join(', '),
    addressLine1,
    addressLine2: '',
    city: props.city || props.town || props.village || props.county || '',
    state: props.state || '',
    stateCode: getStateCode(props.state || ''),
    postalCode: props.postcode || '',
    country: props.country || '',
    countryCode: props.countrycode?.toUpperCase() || '',
    provider: 'photon',
  };
};

export const useAddressAutocomplete = (
  options: UseAddressAutocompleteOptions = {}
): UseAddressAutocompleteReturn => {
  const { debounceMs = 300, countryCode = 'us', limit = 5 } = options;

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<'geoapify' | 'photon' | null>(null);
  
  // Track if Geoapify has hit rate limit
  const geoapifyDisabled = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Get API key from environment
  const geoapifyApiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

  // Search with Geoapify (primary)
  const searchGeoapify = async (query: string, signal: AbortSignal): Promise<AddressSuggestion[]> => {
    if (!geoapifyApiKey) {
      throw new Error('NO_API_KEY');
    }

    const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
    url.searchParams.set('text', query);
    url.searchParams.set('apiKey', geoapifyApiKey);
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('format', 'geojson');
    // Filter by country if specified
    if (countryCode) {
      url.searchParams.set('filter', `countrycode:${countryCode.toLowerCase()}`);
    }


    
    try {
      const response = await axios.get(url.toString(), { signal });
      
      if (response.status === 429) {
        throw new Error('RATE_LIMITED');
      }

      const features = response.data?.features || [];

      return features.map(parseGeoapifyResult);
    } catch (err: any) {
      if (axios.isCancel(err)) {
        throw err;
      }
      console.warn('Geoapify search failed:', err.message);
      throw err;
    }
  };

  // Search with Photon/OpenStreetMap (fallback)
  const searchPhoton = async (query: string, signal: AbortSignal): Promise<AddressSuggestion[]> => {
    const url = new URL('https://photon.komoot.io/api/');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', limit.toString());
    if (countryCode) {
      // Photon uses 'lang' for language but filtering by country requires full name
      // We'll filter results client-side for accuracy
    }

    const response = await axios.get(url.toString(), { signal });
    
    let features = response.data?.features || [];
    
    // Filter by country code if specified
    if (countryCode) {
      features = features.filter((f: any) => 
        f.properties?.countrycode?.toLowerCase() === countryCode.toLowerCase()
      );
    }

    return features.map(parsePhotonResult);
  };

  const search = useCallback((query: string) => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }

    // Clear suggestions if query is too short
    if (!query || query.length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    debounceTimer.current = setTimeout(async () => {
      abortController.current = new AbortController();
      const signal = abortController.current.signal;

      try {
        let results: AddressSuggestion[] = [];

        // Try Geoapify first (if not disabled and has API key)
        if (!geoapifyDisabled.current && geoapifyApiKey) {
          try {
            results = await searchGeoapify(query, signal);
            setActiveProvider('geoapify');
          } catch (err) {
            const axiosError = err as AxiosError;
            // Check for rate limit (429) or quota exceeded
            if (axiosError.response?.status === 429 || 
                (axiosError.response?.status === 401 && String(axiosError.response?.data).includes('quota'))) {

              geoapifyDisabled.current = true;
              // Reset after 1 hour
              setTimeout(() => { geoapifyDisabled.current = false; }, 60 * 60 * 1000);
            } else if ((err as Error).message !== 'NO_API_KEY') {
              console.warn('Geoapify error (falling back to Photon):', err);
              // Re-throw if not a rate limit or missing key issue (but we want to fallback anyway?)
              // Actually here we just want to proceed to Photon if possible, unless it's a cancel.
              if (axios.isCancel(err)) {
                 throw err;
              }
              // If we are here, we failed Geoapify but want to try Photon.
              // So we don't throw, we just log and let it fall through.
            }
          }
        }

        // Use Photon as fallback
        if (results.length === 0) {
          results = await searchPhoton(query, signal);
          setActiveProvider('photon');
        }

        setSuggestions(results);
        setError(null);
      } catch (err) {
        if (axios.isCancel(err)) {
          // Request was cancelled, ignore
          return;
        }

        setError('Failed to fetch address suggestions');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);
  }, [debounceMs, countryCode, limit, geoapifyApiKey]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    activeProvider,
    search,
    clearSuggestions,
  };
};
