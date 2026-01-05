import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToast } from '../context/ToastContext';

/**
 * ServiceWorkerUpdateHandler Component
 * 
 * Detects when a new version of the service worker is available
 * and shows a toast notification prompting the user to update.
 * 
 * Essential for PWA lifecycle management.
 */
export function ServiceWorkerUpdateHandler() {
    const { showToast } = useToast();

    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(_registration: ServiceWorkerRegistration | undefined) {

        },
        onRegisterError(_error: Error) {

        },
        onNeedRefresh() {

        },
        onOfflineReady() {

        },
    });

    useEffect(() => {
        if (needRefresh) {
            // Show persistent toast with action button to update
            showToast(
                'New version available! Click Update to refresh.',
                'info',
                {
                    persistent: true,
                    action: {
                        label: 'Update Now',
                        onClick: () => {

                            updateServiceWorker(true);
                        },
                    },
                }
            );
        }
    }, [needRefresh, showToast, updateServiceWorker]);

    // This component doesn't render anything
    return null;
}

export default ServiceWorkerUpdateHandler;
