/**
 * EmployeeClockWidget - Clock in/out widget for employee portal
 * Shows current clock status and allows employees to clock in/out
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';
import { workforceApi, ClockStatusResponse } from '../../shared/utils/workforceApi';

interface EmployeeClockWidgetProps {
    shopId: string;
    shopName: string;
    canClockInOut?: boolean;
}

export const EmployeeClockWidget: React.FC<EmployeeClockWidgetProps> = ({
    shopId,
    shopName,
    canClockInOut = true
}) => {
    const [clockStatus, setClockStatus] = useState<ClockStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load clock status on mount
    useEffect(() => {
        loadClockStatus();
        // Refresh every minute
        const interval = setInterval(loadClockStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    const loadClockStatus = async () => {
        try {
            const status = await workforceApi.getClockStatus();
            setClockStatus(status);
            setError(null);
        } catch (err) {

            // Don't show error for 404 (no active clock)
        } finally {
            setLoading(false);
        }
    };

    const handleClockIn = async () => {
        setActionLoading(true);
        setError(null);
        try {
            await workforceApi.clockIn(shopId);
            await loadClockStatus();
        } catch (err: unknown) {
            const errorMsg = (err as { message?: string })?.message || 'Failed to clock in';
            setError(errorMsg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleClockOut = async () => {
        setActionLoading(true);
        setError(null);
        try {
            await workforceApi.clockOut();
            await loadClockStatus();
        } catch (err: unknown) {
            const errorMsg = (err as { message?: string })?.message || 'Failed to clock out';
            setError(errorMsg);
        } finally {
            setActionLoading(false);
        }
    };

    // Format time for display
    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Calculate hours worked
    const calculateHoursWorked = (clockInTime: string): string => {
        const start = new Date(clockInTime);
        const now = new Date();
        const diffMs = now.getTime() - start.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    if (!canClockInOut) {
        return null;
    }

    if (loading) {
        return (
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent>
                    <div className="py-3 sm:py-4 text-center animate-pulse text-sm sm:text-base">
                        Loading clock status...
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isClockedIn = clockStatus?.clocked_in;

    return (
        <Card className={`${isClockedIn ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'} text-white`}>
            <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Time Clock
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {error && (
                    <div className="mb-2 sm:mb-3 p-2 bg-red-500/30 rounded text-xs sm:text-sm">
                        {error}
                    </div>
                )}

                {isClockedIn ? (
                    <div className="space-y-2 sm:space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm opacity-90">Status</span>
                            <span className="flex items-center gap-1 text-sm sm:text-base font-medium">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></span>
                                Clocked In
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm opacity-90">Shop</span>
                            <span className="text-sm sm:text-base font-medium truncate max-w-[120px] sm:max-w-none">{shopName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm opacity-90">Since</span>
                            <span className="text-sm sm:text-base font-medium">{formatTime(clockStatus.clock_in_time!)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm opacity-90">Hours</span>
                            <span className="font-bold text-base sm:text-lg">{calculateHoursWorked(clockStatus.clock_in_time!)}</span>
                        </div>
                        <Button
                            variant="secondary"
                            className="w-full mt-1 sm:mt-2 bg-white/20 hover:bg-white/30 text-white border-white/30 text-sm sm:text-base"
                            onClick={handleClockOut}
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Processing...' : 'Clock Out'}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2 sm:space-y-3">
                        <div className="text-center py-3 sm:py-4">
                            <p className="text-lg sm:text-xl font-bold">Not Clocked In</p>
                            <p className="text-xs sm:text-sm opacity-80 mt-0.5 sm:mt-1">Ready to start your shift?</p>
                        </div>
                        <Button
                            variant="secondary"
                            className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 text-sm sm:text-base"
                            onClick={handleClockIn}
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Processing...' : `Clock In at ${shopName}`}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default EmployeeClockWidget;
