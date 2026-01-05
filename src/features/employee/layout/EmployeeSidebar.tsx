import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

interface NavItem {
    name: string;
    path: string;
    icon: React.ReactNode;
    permission?: string | string[];
}



interface EmployeeSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({ isOpen = true, onClose }) => {
    const location = useLocation();
    const { user } = useAuth();
    const permissions = user?.permissions as Record<string, boolean> | undefined;
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

    // Workforce sub-items
    const workforceSubItems: NavItem[] = [
        {
            name: 'My Schedule',
            path: '/employee/schedule',
            permission: 'can_view_own_schedule',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            name: 'My Hours',
            path: '/employee/hours',
            permission: 'can_view_own_hours',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            name: 'Enter Timesheet',
            path: '/employee/timesheet',
            permission: 'can_enter_timesheet',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
        },
    ];

    // Reports sub-items
    const reportSubItems: NavItem[] = [
        {
            name: 'Kiosk Reports',
            path: '/employee/reports/kiosk',
            permission: 'can_view_kiosk_reports',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            name: 'Shift Reports',
            path: '/employee/reports/shifts',
            permission: 'can_view_shift_reports',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            name: 'Machine Reports',
            path: '/employee/reports/machines',
            permission: 'can_view_machine_reports',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            name: 'Shop Reports',
            path: '/employee/reports/shop',
            permission: 'can_view_shop_reports',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
        },
    ];

    // Main navigation items (simplified - no workforce items here)
    const navItems: NavItem[] = [
        {
            name: 'Dashboard',
            path: '/employee/dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            name: 'Redeem Tickets',
            path: '/employee/tickets',
            permission: 'can_redeem_tickets',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
            ),
        },
        {
            name: 'Customers',
            path: '/employee/customers',
            permission: 'can_view_customers',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
            ),
        },
        {
            name: 'Machine Readings',
            path: '/employee/machine-readings',
            permission: 'can_view_machine_readings',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
            ),
        },
    ];

    // Filter nav items based on permissions
    const hasPermission = (item: NavItem): boolean => {
        if (!item.permission) return true;
        if (!permissions) return false;

        if (Array.isArray(item.permission)) {
            return item.permission.some(perm => permissions[perm] === true);
        }
        return permissions[item.permission] === true;
    };

    // Get visible sub-items
    const visibleWorkforceSubItems = workforceSubItems.filter(hasPermission);
    const visibleReportSubItems = reportSubItems.filter(hasPermission);
    const hasAnyWorkforcePermission = visibleWorkforceSubItems.length > 0;
    const hasAnyReportPermission = visibleReportSubItems.length > 0 || permissions?.can_view_all_reports;

    const visibleNavItems = navItems.filter(hasPermission);

    const toggleMenu = (menuName: string) => {
        setExpandedMenus(prev =>
            prev.includes(menuName)
                ? prev.filter(m => m !== menuName)
                : [...prev, menuName]
        );
    };

    const isWorkforceExpanded = expandedMenus.includes('workforce') ||
        location.pathname.startsWith('/employee/schedule') ||
        location.pathname.startsWith('/employee/hours') ||
        location.pathname.startsWith('/employee/timesheet');
    const isReportsExpanded = expandedMenus.includes('reports') || location.pathname.startsWith('/employee/reports');

    const renderExpandableMenu = (
        name: string,
        menuKey: string,
        icon: React.ReactNode,
        isExpanded: boolean,
        subItems: NavItem[],
        pathPrefix: string
    ) => (
        <div className="space-y-1">
            <button
                onClick={() => toggleMenu(menuKey)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${location.pathname.startsWith(pathPrefix)
                    ? 'bg-slate-800/70 text-white'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
            >
                <div className="flex items-center space-x-3">
                    {icon}
                    <span className="font-medium">{name}</span>
                </div>
                <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Sub-items */}
            {isExpanded && (
                <div className="ml-4 pl-4 border-l border-slate-700/50 space-y-1">
                    {subItems.map((subItem) => (
                        <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-all ${isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                }`
                            }
                        >
                            {subItem.icon}
                            <span>{subItem.name}</span>
                        </NavLink>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Mobile overlay background */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 min-h-screen
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                {/* Logo + Close button */}
                <div className="h-[72px] px-4 border-b border-slate-700/50 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">ArcadeX</h1>
                        <p className="text-[10px] text-slate-400 mt-0 tracking-wide font-medium">@ Charaviam Product</p>
                    </div>
                    {/* Close button - mobile only */}
                    <button
                        className="lg:hidden p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                        onClick={onClose}
                        aria-label="Close menu"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Shop Badge - Removed as per user request (redundant with header) */}
                {/* 
                {selectedShop && (
                    <div className="px-4 py-3 border-b border-slate-700/50">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30">
                                {selectedShop.name}
                            </span>
                        </div>
                    </div>
                )} 
                */}

                {/* Navigation */}
                <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
                    {/* Regular nav items */}
                    {visibleNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                                }`
                            }
                        >
                            {item.icon}
                            <span className="font-medium">{item.name}</span>
                        </NavLink>
                    ))}

                    {/* Workforce Expandable Menu */}
                    {hasAnyWorkforcePermission && renderExpandableMenu(
                        'Workforce',
                        'workforce',
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>,
                        isWorkforceExpanded,
                        visibleWorkforceSubItems,
                        '/employee/schedule' // Any of the paths
                    )}

                    {/* Reports Expandable Menu */}
                    {hasAnyReportPermission && renderExpandableMenu(
                        'Reports',
                        'reports',
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>,
                        isReportsExpanded,
                        visibleReportSubItems,
                        '/employee/reports'
                    )}
                </nav>

                {/* User Info Footer */}
                <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-slate-700/50 bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                            {user?.name_first?.[0]}{user?.name_last?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user?.name_first} {user?.name_last}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
