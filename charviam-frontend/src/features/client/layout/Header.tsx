import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { UserDropdown } from '../../../shared/components/UserDropdown';
import { NotificationBell } from '../../../shared/components/NotificationBell';
import { NotificationPanel } from '../../../shared/components/NotificationPanel';
import { RestoreCustomerModal } from '../customers/RestoreCustomerModal';
import { useShop } from '../../../shared/context/ShopContext';
import { pushNotificationService } from '../../../shared/services/pushNotificationService';
import { useToast } from '../../../shared/context/ToastContext';
import { useInstallPrompt } from '../../../shared/hooks/useInstallPrompt';
import { useNotifications, UserNotification } from '../../../shared/hooks/useNotifications';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { shops, selectedShopId, setSelectedShopId, loading: shopsLoading } = useShop();
  const [temperatureF, setTemperatureF] = useState<number | null>(null);
  const [isCelsius, setIsCelsius] = useState(false);
  const [location, setLocation] = useState<string>('');
  const { showToast } = useToast();
  const { isInstallable, promptInstall } = useInstallPrompt();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll, isLoading: notificationsLoading, refresh } = useNotifications();
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
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

    // If push not enabled, prompt for permission
    if (pushNotificationService.isSupported()) {
      const permission = pushNotificationService.getPermissionStatus();
      if (permission === 'default') {
        pushNotificationService.subscribe().then(sub => {
          if (sub) {
            showToast('Notifications Enabled!', 'success');
          }
        });
      }
    }
  };

  const handleNotificationItemClick = (notification: UserNotification) => {
    // Check if it's a customer deletion notification
    if (notification.notification_type === 'CUSTOMER_MILESTONE' && notification.action_url?.includes('/client/customers/deleted/')) {
      // Extract customer ID from action_url or metadata
      const customerId = notification.metadata?.customer_id as string || notification.action_url.split('/').pop();
      if (customerId) {
        setSelectedCustomerId(customerId);
        setShowRestoreModal(true);
        setShowNotificationPanel(false);
      }
    } else if (notification.action_url) {
      // Default behavior for other notifications
      window.location.href = notification.action_url;
      setShowNotificationPanel(false);
    }
  };

  const handleRestoreSuccess = () => {
    refresh(); // Refresh notifications
    showToast('Customer restored successfully!', 'success');
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
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Fetch weather data based on user's location
  useEffect(() => {
    const fetchWeather = async () => {
      try {


        // Check if geolocation is available
        if (!navigator.geolocation) {

          return;
        }

        // Request geolocation with explicit options
        navigator.geolocation.getCurrentPosition(
          async (position) => {

            const { latitude, longitude } = position.coords;

            try {
              // Use Open-Meteo API (free, no API key required)

              const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit`
              );
              const weatherData = await weatherResponse.json();


              if (weatherData.current_weather) {
                const temp = Math.round(weatherData.current_weather.temperature);

                setTemperatureF(temp);
              }

              // Get location name
              try {
                const locationResponse = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                );
                const locationData = await locationResponse.json();
                const city = locationData.address?.city || locationData.address?.town || locationData.address?.state || '';

                setLocation(city);
              } catch (err) {
                // Silently fail - location name is optional
                console.log('Could not fetch location name:', err);
              }
            } catch (err) {
              // Silently fail - weather is optional
              console.log('Could not fetch weather data:', err);
            }
          },
          (error) => {

            if (error.code === 1) {
              console.log('Geolocation permission denied');
            } else if (error.code === 2) {
              console.log('Geolocation position unavailable');
            } else if (error.code === 3) {
              console.log('Geolocation timeout');
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000 // Cache for 5 minutes
          }
        );
      } catch (error) {
        // Silently fail - weather is optional
        console.log('Weather fetch error:', error);
      }
    };

    fetchWeather();
  }, []);

  const handleRefresh = () => {
    // Reload the entire page to refresh all dashboard data
    window.location.reload();
  };



  const toggleTemperature = () => {
    setIsCelsius(!isCelsius);
  };

  const getTemperature = () => {
    if (temperatureF === null) return null;
    if (isCelsius) {
      const celsius = Math.round((temperatureF - 32) * (5 / 9));
      return `${celsius}°C`;
    }
    return `${temperatureF}°F`;
  };

  return (
    <header className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-gray-200 dark:border-slate-700/50 h-[72px] flex items-center justify-between px-3 sm:px-4 lg:px-6 shadow-sm dark:shadow-lg dark:shadow-black/20">
      {/* Left side: Hamburger (mobile) + Temperature + Greeting message */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Hamburger menu - mobile only */}
        <button
          className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Temperature display - hidden on very small screens, show when available */}
        {temperatureF !== null && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={toggleTemperature}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600"
              title={`${location || 'Current location'} - Click to toggle F/C`}
            >
              <svg className="w-4 h-4 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <span>{getTemperature()}</span>
            </button>
            <span className="text-gray-300 dark:text-slate-600">|</span>
          </div>
        )}

        <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">
          <span className="hidden sm:inline">{getGreeting()}</span>
          <span className="sm:hidden">Hi</span>
          {user?.name_first ? `, ${user.name_first}` : user?.tenant?.name ? `, ${user.tenant.name}` : ''}
        </h2>
      </div>

      {/* Right side: Shop Selector, Date, Refresh button, and User dropdown */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Global Shop Selector */}
        <div className="flex items-center">
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            disabled={shopsLoading}
            aria-label="Select shop"
            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 max-w-[120px] sm:max-w-[180px] truncate"
          >
            <option value="ALL">All Shops</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Display */}
        <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">
          {getFormattedDate()}
        </div>

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
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm"
            title="Install App"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Install</span>
          </button>
        )}

        {/* Refresh Button - Chrome style circular arrow */}
        <button
          onClick={handleRefresh}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
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

        {/* User Avatar with Dropdown */}
        <UserDropdown
          firstName={user?.name_first || user?.tenant?.name?.split(' ')[0] || ''}
          lastName={user?.name_last || user?.tenant?.name?.split(' ')[1] || ''}
          extraItems={[
            {
              label: 'Help & Support',
              onClick: () => window.location.href = '/client/support',
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )
            }
          ]}
        />
      </div>

      {/* Restore Customer Modal */}
      {showRestoreModal && selectedCustomerId && (
        <RestoreCustomerModal
          customerId={selectedCustomerId}
          isOpen={showRestoreModal}
          onClose={() => {
            setShowRestoreModal(false);
            setSelectedCustomerId(null);
          }}
          onRestoreSuccess={handleRestoreSuccess}
        />
      )}
    </header>
  );
};
