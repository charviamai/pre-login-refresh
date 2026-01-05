import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { UserDropdown } from '../../../shared/components/UserDropdown';
import { NotificationBell } from '../../../shared/components/NotificationBell';
import { NotificationPanel } from '../../../shared/components/NotificationPanel';
import { pushNotificationService } from '../../../shared/services/pushNotificationService';
import { useToast } from '../../../shared/context/ToastContext';
import { useInstallPrompt } from '../../../shared/hooks/useInstallPrompt';
import { useNotifications, UserNotification } from '../../../shared/hooks/useNotifications';

interface EmployeeHeaderProps {
    onMenuClick?: () => void;
}

// Get selected shop from sessionStorage
const getSelectedShop = (): { id: string; name: string } | null => {
    const stored = sessionStorage.getItem('employee_selected_shop');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (error) {
            console.warn('Failed to parse selected shop:', error);
            return null;
        }
    }
    return null;
};

export const EmployeeHeader: React.FC<EmployeeHeaderProps> = ({ onMenuClick }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const selectedShop = getSelectedShop();

    // Temperature state
    const [temperatureF, setTemperatureF] = useState<number | null>(null);
    const [isCelsius, setIsCelsius] = useState(false);
    const [location, setLocation] = useState<string>('');
    const { showToast } = useToast();
    const { isInstallable, promptInstall } = useInstallPrompt();

    // Notifications
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        isLoading: notificationsLoading
    } = useNotifications();

    const [showNotificationPanel, setShowNotificationPanel] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotificationPanel(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInstallClick = async () => {
        const accepted = await promptInstall();
        if (accepted) {
            showToast('App installed successfully!', 'success');
        }
    };

    const handleNotificationClick = () => {
        // Toggle panel
        setShowNotificationPanel(prev => !prev);

        // Check/Request push permission
        if (pushNotificationService.isSupported()) {
            const permission = pushNotificationService.getPermissionStatus();
            if (permission === 'default') {
                pushNotificationService.subscribe().then(sub => {
                    if (sub) {
                        showToast('Notifications Enabled. You will now receive important updates.', 'success');
                    } else {
                        // Don't show error for default simply ignoring
                    }
                });
            }
        }
    };

    const handleNotificationItemClick = (notification: UserNotification) => {
        // Handle navigation based on action_url
        if (notification.action_url) {
            // Check if it's an internal link
            if (notification.action_url.startsWith('/')) {
                navigate(notification.action_url);
            } else {
                window.location.href = notification.action_url;
            }
            setShowNotificationPanel(false);
        }
    };

    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        return hour < 12 ? 'Good morning' : 'Good evening';
    };

    // Get formatted date
    const getFormattedDate = () => {
        const date = new Date();
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
    };

    // Fetch weather data based on geolocation
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                if (!navigator.geolocation) return;

                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;

                        try {
                            const weatherResponse = await fetch(
                                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit`
                            );
                            const weatherData = await weatherResponse.json();

                            if (weatherData.current_weather) {
                                setTemperatureF(Math.round(weatherData.current_weather.temperature));
                            }

                            try {
                                const locationResponse = await fetch(
                                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                                );
                                const locationData = await locationResponse.json();
                                const city = locationData.address?.city || locationData.address?.town || locationData.address?.state || '';
                                setLocation(city);
                            } catch (locErr) {
                                // Ignore location data failure
                                console.debug('Failed to fetch location name', locErr);
                            }
                        } catch (weatherErr) {
                            // Ignore weather data failure
                            console.debug('Failed to fetch weather', weatherErr);
                        }
                    },
                    () => { },
                    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
                );
            } catch (err) {
                // Ignore general failure
                console.debug('Weather fetch setup failed', err);
            }
        };

        fetchWeather();
    }, []);

    const toggleTemperature = () => setIsCelsius(!isCelsius);

    const getTemperature = () => {
        if (temperatureF === null) return null;
        if (isCelsius) {
            const celsius = Math.round((temperatureF - 32) * (5 / 9));
            return `${celsius}°C`;
        }
        return `${temperatureF}°F`;
    };

    const handleChangeShop = () => {
        sessionStorage.removeItem('employee_selected_shop');
        navigate('/employee/select-shop');
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 h-[72px] flex items-center justify-between px-3 sm:px-4 lg:px-6 shadow-sm">
            {/* Left: Hamburger + Greeting */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Hamburger - mobile only */}
                <button
                    className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
                    onClick={onMenuClick}
                    aria-label="Open menu"
                >
                    <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Greeting */}
                <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                    <span className="hidden sm:inline">{getGreeting()}</span>
                    <span className="sm:hidden">Hi</span>
                    {user?.name_first ? `, ${user.name_first}` : ''}
                </h2>
            </div>

            {/* Center: Shop Name (prominently displayed) */}
            {selectedShop && (
                <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200">
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-sm font-semibold text-blue-700">{selectedShop.name}</span>
                    </div>
                </div>
            )}

            {/* Mobile: Shop name below */}
            {selectedShop && (
                <div className="md:hidden absolute left-1/2 transform -translate-x-1/2">
                    <span className="text-xs font-medium text-blue-600">{selectedShop.name}</span>
                </div>
            )}

            {/* Right: Weather, Date, Refresh, Profile */}
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                {/* Weather */}
                {temperatureF !== null && (
                    <button
                        onClick={toggleTemperature}
                        className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
                        title={`${location || 'Location'}`}
                    >
                        <span className="text-amber-500 text-sm">☀️</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{getTemperature()}</span>
                        {location && <span className="text-xs text-gray-400 hidden lg:inline">{location}</span>}
                    </button>
                )}

                {/* Date */}
                <span className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">{getFormattedDate()}</span>

                {/* Notification Bell with Panel */}
                <div ref={notificationRef} className="relative">
                    <NotificationBell
                        count={unreadCount}
                        onClick={handleNotificationClick}
                    />
                    {showNotificationPanel && (
                        <NotificationPanel
                            notifications={notifications}
                            onMarkAsRead={markAsRead}
                            onMarkAllAsRead={markAllAsRead}
                            onDelete={deleteNotification}
                            onClearAll={clearAll}
                            onClose={() => setShowNotificationPanel(false)}
                            isLoading={notificationsLoading}
                            onNotificationClick={handleNotificationItemClick}
                        />
                    )}
                </div>

                {/* Install App Button - PWA */}
                {isInstallable && (
                    <button
                        onClick={handleInstallClick}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                        title="Install App"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Install</span>
                    </button>
                )}

                {/* Refresh - Chrome style like Admin Portal */}
                <button
                    onClick={handleRefresh}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    title="Refresh"
                >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path
                            d="M21.5 12.5c-.5 4.5-4.5 8-9 8-5 0-9-4-9-9s4-9 9-9c2.5 0 4.8 1 6.5 2.7L21.5 7.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M21.5 3v4.5h-4.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>

                {/* Profile with Change Shop option */}
                <UserDropdown
                    firstName={user?.name_first || ''}
                    lastName={user?.name_last || ''}
                    extraItems={[
                        {
                            label: 'Change Shop',
                            onClick: handleChangeShop,
                            icon: (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
                                </svg>
                            )
                        }
                    ]}
                />
            </div>
        </header>
    );
};
