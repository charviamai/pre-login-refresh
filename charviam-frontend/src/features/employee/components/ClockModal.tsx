import React from 'react';

interface ClockModalProps {
    isOpen: boolean;
    onClose: () => void;
    isClockedIn: boolean;
    shopName: string;
    clockInTime: string | null;
    duration: string;
    onClockIn: () => void;
    onClockOut: () => void;
    isLoading: boolean;
}

export const ClockModal: React.FC<ClockModalProps> = ({
    isOpen,
    onClose,
    isClockedIn,
    shopName,
    clockInTime,
    duration,
    onClockIn,
    onClockOut,
    isLoading,
}) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto transform transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isClockedIn
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Time Clock</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {/* Status */}
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-600">Status</span>
                            <span className={`flex items-center gap-2 font-medium ${isClockedIn ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                                    }`}></span>
                                {isClockedIn ? 'Clocked In' : 'Not Clocked In'}
                            </span>
                        </div>

                        {/* Shop */}
                        <div className="flex items-center justify-between py-2 border-t border-gray-100">
                            <span className="text-gray-600">Shop</span>
                            <span className="font-medium text-gray-900">{shopName}</span>
                        </div>

                        {/* Clock-in time */}
                        {isClockedIn && clockInTime && (
                            <div className="flex items-center justify-between py-2 border-t border-gray-100">
                                <span className="text-gray-600">Since</span>
                                <span className="font-medium text-gray-900">{clockInTime}</span>
                            </div>
                        )}

                        {/* Duration */}
                        {isClockedIn && (
                            <div className="flex items-center justify-between py-2 border-t border-gray-100">
                                <span className="text-gray-600">Duration</span>
                                <span className="font-bold text-xl text-green-600">{duration}</span>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="p-6 pt-0">
                        {isClockedIn ? (
                            <button
                                onClick={onClockOut}
                                disabled={isLoading}
                                className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Processing...' : 'Clock Out'}
                            </button>
                        ) : (
                            <button
                                onClick={onClockIn}
                                disabled={isLoading}
                                className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Processing...' : 'Clock In'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
