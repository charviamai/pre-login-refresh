import React from 'react';
import { UserNotification } from '../hooks/useNotifications';

// Icon components for notification types
const NotificationIcon: React.FC<{ type: string; priority: string }> = ({ type, priority }) => {
    const iconColor = priority === 'HIGH' ? 'text-red-500' : priority === 'MEDIUM' ? 'text-amber-500' : 'text-blue-500';

    // Map notification types to icons
    const iconMap: Record<string, JSX.Element> = {
        TIMESHEET_PENDING: (
            <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
        SHIFT_ASSIGNED: (
            <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        SHIFT_CHANGED: (
            <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
        SCHEDULE_PUBLISHED: (
            <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        ANNOUNCEMENT: (
            <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
        ),
    };

    return iconMap[type] || (
        <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    );
};

interface NotificationPanelProps {
    notifications: UserNotification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onDelete: (id: string) => void;
    onClearAll: () => void;
    onClose: () => void;
    isLoading?: boolean;
    onNotificationClick?: (notification: UserNotification) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
    onClearAll,
    onClose,
    isLoading = false,
    onNotificationClick,
}) => {
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleNotificationClick = (notification: UserNotification) => {
        if (!notification.is_read) {
            onMarkAsRead(notification.id);
        }

        // Use custom handler if provided (for modal opening), otherwise navigate
        if (onNotificationClick) {
            onNotificationClick(notification);
        } else if (notification.action_url) {
            window.location.href = notification.action_url;
            onClose();
        }
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-50 max-h-[480px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Notifications
                    {unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </h3>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={onMarkAllAsRead}
                            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                        >
                            Mark read
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            onClick={onClearAll}
                            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-slate-700">
                        {notifications.map((notification) => (
                            <div key={notification.id} className="relative group">
                                <button
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${!notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        {/* Icon */}
                                        <div className="flex-shrink-0 mt-0.5">
                                            <NotificationIcon type={notification.notification_type} priority={notification.priority} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pr-6">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-medium truncate ${!notification.is_read
                                                    ? 'text-gray-900 dark:text-white'
                                                    : 'text-gray-600 dark:text-gray-300'
                                                    }`}>
                                                    {notification.title}
                                                </p>
                                                {!notification.is_read && (
                                                    <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                {notification.time_ago}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                                {/* Delete Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(notification.id);
                                    }}
                                    className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete notification"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                    <button
                        onClick={onClose}
                        className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};
