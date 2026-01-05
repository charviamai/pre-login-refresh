import React, { useEffect, useState } from 'react';
import { offlineService } from '../../services/offlineService';

export const OfflineIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(offlineService.isOnline());
    const [queueLength, setQueueLength] = useState(offlineService.getQueueLength());
    const [isSyncing, setIsSyncing] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);

    useEffect(() => {
        // Subscribe to online status
        const unsubscribe = offlineService.subscribe((online) => {
            setIsOnline(online);

            if (online && queueLength > 0) {
                setIsSyncing(true);
                setSyncError(null);
            }
        });

        // Listen for queue changes
        const handleQueueChange = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setQueueLength(detail.count || 0);

            // If queue becomes 0 while syncing, sync is complete
            if (isSyncing && (detail.count === 0)) {
                setIsSyncing(false);
            }
        };

        // Listen for sync errors
        const handleSyncError = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setSyncError(detail.message || 'Sync failed');
            setIsSyncing(false);
        };

        // Listen for sync success
        const handleSyncSuccess = () => {
            setIsSyncing(false);
            setSyncError(null);
        };

        window.addEventListener('offline-queue-change', handleQueueChange);
        window.addEventListener('offline-sync:error', handleSyncError);
        window.addEventListener('offline-sync:success', handleSyncSuccess);

        return () => {
            unsubscribe();
            window.removeEventListener('offline-queue-change', handleQueueChange);
            window.removeEventListener('offline-sync:error', handleSyncError);
            window.removeEventListener('offline-sync:success', handleSyncSuccess);
        };
    }, [queueLength, isSyncing]);

    const handleClearQueue = () => {
        if (confirm('Clear all pending offline requests? This cannot be undone.')) {
            offlineService.clearQueue();
            setQueueLength(0);
            setIsSyncing(false);
            setSyncError(null);

        }
    };

    const handleViewConsole = () => {


        alert('Check browser console (F12) for detailed sync logs');
    };

    if (isOnline && queueLength === 0 && !isSyncing) {
        return null;
    }

    return (
        <div className={`fixed bottom-4 right-4 z-50 rounded-lg shadow-lg transition-all duration-300 ${isOnline ? 'bg-blue-600' : 'bg-amber-600'
            } text-white`}>
            <div className="p-4 flex items-center justify-between space-x-3">
                <div className="flex flex-col">
                    <span className="font-bold flex items-center">
                        {!isOnline ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                </svg>
                                You are offline
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 animate-spin" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                                Syncing data...
                            </>
                        )}
                    </span>
                    {queueLength > 0 && (
                        <span className="text-xs opacity-90 mt-1">
                            {queueLength} action{queueLength !== 1 ? 's' : ''} pending sync
                        </span>
                    )}
                    {syncError && (
                        <span className="text-xs text-red-200 mt-1">
                            ⚠️ {syncError}
                        </span>
                    )}
                </div>

                {queueLength > 0 && (
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-xs underline hover:no-underline ml-3"
                    >
                        {showDetails ? 'Hide' : 'Details'}
                    </button>
                )}
            </div>

            {showDetails && queueLength > 0 && (
                <div className="border-t border-white/20 p-3 space-y-2">
                    <p className="text-xs">
                        Stuck? Check console (F12) for error details.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={async () => {
                                setIsSyncing(true);
                                try {
                                    await offlineService.syncQueue();
                                } catch (e) {
                                    // Handled by event listener
                                }
                            }}
                            disabled={isSyncing}
                            className={`text-xs px-3 py-1 rounded ${isSyncing ? 'bg-white/10 cursor-not-allowed' : 'bg-green-500/80 hover:bg-green-500'}`}
                        >
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                        <button
                            onClick={handleViewConsole}
                            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded"
                        >
                            View Console
                        </button>
                        <button
                            onClick={handleClearQueue}
                            className="text-xs bg-red-500/80 hover:bg-red-500 px-3 py-1 rounded"
                        >
                            Clear Queue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
