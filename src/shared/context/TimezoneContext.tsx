/**
 * TimezoneContext - Provides shop timezone across the application
 * All date/time displays and calculations should use these utilities
 */

import React, { createContext, useContext, useMemo } from 'react';

interface TimezoneContextType {
    timezone: string;
    // Get current date string in shop's timezone (YYYY-MM-DD)
    getCurrentDateString: () => string;
    // Get current time string in shop's timezone (HH:MM:SS)
    getCurrentTimeString: () => string;
    // Format a date for display in shop's timezone
    formatDate: (dateStr: string, options?: Intl.DateTimeFormatOptions) => string;
    // Format a datetime for display in shop's timezone
    formatDateTime: (isoString: string, options?: Intl.DateTimeFormatOptions) => string;
    // Format time only for display in shop's timezone
    formatTime: (isoString: string) => string;
    // Parse a local date string and get the Date object in shop's timezone
    parseLocalDate: (dateStr: string) => Date;
    // Check if date is today in shop's timezone
    isToday: (dateStr: string) => boolean;
    // Get today's date string in shop's timezone
    getToday: () => string;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

interface TimezoneProviderProps {
    timezone: string;
    children: React.ReactNode;
}

export const TimezoneProvider: React.FC<TimezoneProviderProps> = ({ timezone, children }) => {
    const value = useMemo<TimezoneContextType>(() => {
        // Default to America/New_York if no timezone provided
        const tz = timezone || 'America/New_York';

        const getCurrentDateString = (): string => {
            const now = new Date();
            const options: Intl.DateTimeFormatOptions = {
                timeZone: tz,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            };
            // Format as YYYY-MM-DD
            const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(now);
            const year = parts.find(p => p.type === 'year')?.value;
            const month = parts.find(p => p.type === 'month')?.value;
            const day = parts.find(p => p.type === 'day')?.value;
            return `${year}-${month}-${day}`;
        };

        const getCurrentTimeString = (): string => {
            const now = new Date();
            return now.toLocaleTimeString('en-US', {
                timeZone: tz,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        };

        const formatDate = (dateStr: string, options?: Intl.DateTimeFormatOptions): string => {
            // Parse YYYY-MM-DD format
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day, 12, 0, 0); // Use noon to avoid DST issues

            const defaultOptions: Intl.DateTimeFormatOptions = {
                timeZone: tz,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                ...options
            };

            return date.toLocaleDateString('en-US', defaultOptions);
        };

        const formatDateTime = (isoString: string, options?: Intl.DateTimeFormatOptions): string => {
            const date = new Date(isoString);
            const defaultOptions: Intl.DateTimeFormatOptions = {
                timeZone: tz,
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                ...options
            };
            return date.toLocaleString('en-US', defaultOptions);
        };

        const formatTime = (isoString: string): string => {
            const date = new Date(isoString);
            return date.toLocaleTimeString('en-US', {
                timeZone: tz,
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        };

        const parseLocalDate = (dateStr: string): Date => {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
        };

        const getToday = (): string => {
            return getCurrentDateString();
        };

        const isToday = (dateStr: string): boolean => {
            return dateStr === getToday();
        };

        return {
            timezone: tz,
            getCurrentDateString,
            getCurrentTimeString,
            formatDate,
            formatDateTime,
            formatTime,
            parseLocalDate,
            isToday,
            getToday
        };
    }, [timezone]);

    return (
        <TimezoneContext.Provider value={value}>
            {children}
        </TimezoneContext.Provider>
    );
};

export const useTimezone = (): TimezoneContextType => {
    const context = useContext(TimezoneContext);
    if (!context) {
        // Return default functions if no provider (for backwards compatibility)
        const defaultTz = 'America/New_York';
        return {
            timezone: defaultTz,
            getCurrentDateString: () => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            },
            getCurrentTimeString: () => new Date().toLocaleTimeString(),
            formatDate: (dateStr) => {
                const [year, month, day] = dateStr.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                return date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            },
            formatDateTime: (isoString) => new Date(isoString).toLocaleString(),
            formatTime: (isoString) => new Date(isoString).toLocaleTimeString(),
            parseLocalDate: (dateStr) => {
                const [year, month, day] = dateStr.split('-').map(Number);
                return new Date(year, month - 1, day);
            },
            isToday: () => false,
            getToday: () => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        };
    }
    return context;
};

export default TimezoneContext;
