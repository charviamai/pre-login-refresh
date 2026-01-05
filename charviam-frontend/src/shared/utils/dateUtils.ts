/**
 * Date Utility Functions
 * Provides consistent, timezone-aware week calculations for timesheet management
 * Using proven formulas from admin portal (EmployeeSchedule.tsx)
 */

/**
 * Get current date in YYYY-MM-DD format
 * @param _shopTimezone Shop's IANA timezone (reserved for future use)
 * @returns Date string in YYYY-MM-DD format
 */
 
export const getTodayInTimezone = (_shopTimezone: string = 'UTC'): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get the Monday (start) of the week for any given date
 * Uses proven formula from admin portal
 * @param dateStr Date in YYYY-MM-DD format
 * @param _shopTimezone Shop's IANA timezone (reserved for future use)
 * @returns Monday of that week in YYYY-MM-DD format
 */
 
export const getWeekStart = (dateStr: string, _shopTimezone: string = 'UTC'): string => {
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Create date
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay();
    
    // Use proven formula from admin portal: adjust to get Monday
    // If Sunday (0), go back 6 days; otherwise, calculate days to Monday (1)
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    d.setDate(diff);
    
    // Return in YYYY-MM-DD format
    const mondayYear = d.getFullYear();
    const mondayMonth = String(d.getMonth() + 1).padStart(2, '0');
    const mondayDay = String(d.getDate()).padStart(2, '0');
    
    return `${mondayYear}-${mondayMonth}-${mondayDay}`;
};

/**
 * Get the Sunday (end) of the week for any given date
 * @param dateStr Date in YYYY-MM-DD format
 * @param _shopTimezone Shop's IANA timezone (reserved for future use)
 * @returns Sunday of that week in YYYY-MM-DD format
 */
 
export const getWeekEnd = (dateStr: string, _shopTimezone: string = 'UTC'): string => {
    const weekStart = getWeekStart(dateStr, _shopTimezone);
    const [year, month, day] = weekStart.split('-').map(Number);
    const monday = new Date(year, month - 1, day);
    
    // Add 6 days to get Sunday
    monday.setDate(monday.getDate() + 6);
    
    const sundayYear = monday.getFullYear();
    const sundayMonth = String(monday.getMonth() + 1).padStart(2, '0');
    const sundayDay = String(monday.getDate()).padStart(2, '0');
    
    return `${sundayYear}-${sundayMonth}-${sundayDay}`;
};

/**
 * Get an array of dates for a week starting from Monday
 * @param weekStartDate Monday date in YYYY-MM-DD format
 * @param _shopTimezone Shop's IANA timezone (reserved for future use)
 * @returns Array of 7 dates (Mon-Sun) in YYYY-MM-DD format
 */
 
export const getWeekDates = (weekStartDate: string, _shopTimezone: string = 'UTC'): string[] => {
    const [year, month, day] = weekStartDate.split('-').map(Number);
    const monday = new Date(year, month - 1, day);
    
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
    }
    
    return dates;
};

/**
 * Get Monday of current week
 * @param _shopTimezone Shop's IANA timezone (reserved for future use)
 * @returns Monday date in YYYY-MM-DD format
 */
 
export const getCurrentWeekStart = (_shopTimezone: string = 'UTC'): string => {
    const todayStr = getTodayInTimezone(_shopTimezone);
    return getWeekStart(todayStr, _shopTimezone);
};

/**
 * Get Monday of week with offset (for navigation)
 * @param weekOffset Number of weeks to offset (0 = current, -1 = last week, 1 = next week)
 * @param _shopTimezone Shop's IANA timezone (reserved for future use)
 * @returns Monday date in YYYY-MM-DD format
 */
 
export const getWeekStartWithOffset = (weekOffset: number, _shopTimezone: string = 'UTC'): string => {
    // Get today's Monday
    const todayStr = getTodayInTimezone(_shopTimezone);
    const thisWeekMonday = getWeekStart(todayStr, _shopTimezone);
    
    // If no offset, return this week's Monday
    if (weekOffset === 0) {
        return thisWeekMonday;
    }
    
    // Apply week offset by adding/subtracting weeks from Monday
    const [year, month, day] = thisWeekMonday.split('-').map(Number);
    const monday = new Date(year, month - 1, day);
    monday.setDate(monday.getDate() + (weekOffset * 7));
    
    const targetYear = monday.getFullYear();
    const targetMonth = String(monday.getMonth() + 1).padStart(2, '0');
    const targetDay = String(monday.getDate()).padStart(2, '0');
    
    return `${targetYear}-${targetMonth}-${targetDay}`;
};

/**
 * Format date for display
 * @param dateStr Date string in YYYY-MM-DD format
 * @param _formatStr Format string (reserved for future use)
 * @param _shopTimezone Shop's IANA timezone (reserved for future use)
 * @returns Formatted date string
 */
 
export const formatDateInTimezone = (
    dateStr: string,
    _formatStr: string = 'MMM d, yyyy',
    _shopTimezone: string = 'UTC'
): string => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Simple formatter
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
};
