import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

interface SubNavItem {
  name: string;
  path: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  subItems?: SubNavItem[];
}

// Chevron icons for expandable items
const ChevronDown = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronRight = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/client/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Shops',
    path: '/client/shops',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    name: 'Devices',
    path: '/client/devices',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: 'Employees',
    path: '/client/employees',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    name: 'Admin Users',
    path: '/client/admins',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    name: 'Customers',
    path: '/client/customers',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    name: 'Game Machines',
    path: '/client/machines',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: 'Reports',
    path: '/client/reports',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    subItems: [
      { name: 'Kiosk Reports', path: '/client/reports/kiosk' },
      { name: 'Shift Reports', path: '/client/reports/shift' },
      { name: 'Machine Reports', path: '/client/reports/machine' },
    ],
  },
  {
    name: 'Workforce',
    path: '/client/workforce',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    subItems: [
      { name: 'Schedule', path: '/client/workforce/schedule' },
      { name: 'Timesheet', path: '/client/workforce/timesheet' },
      { name: 'Hours Report', path: '/client/workforce/hours' },
      { name: 'Payroll', path: '/client/workforce/payroll' },
      { name: 'Templates', path: '/client/workforce/templates' },
    ],
  },
  {
    name: 'Settings',
    path: '/client/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    subItems: [
      { name: 'Permission Sets', path: '/client/settings/permission-sets' },
      { name: 'Audit Logs', path: '/client/settings/audit-logs' },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Get user permissions from auth context
  const { user } = useAuth();
  const permissions = user?.permissions || {};
  const isOwner = permissions.is_owner === true;

  // Filter nav items based on permissions
  const getFilteredNavItems = () => {
    // Permission mapping for each nav item
    // Note: Game Machines uses a special check (either permission)
    const permissionMap: Record<string, string | string[]> = {
      '/client/shops': 'can_manage_shops',
      '/client/devices': 'can_manage_devices',
      '/client/employees': 'can_manage_employees',
      '/client/admins': 'can_manage_admin_users',
      '/client/customers': 'can_manage_customers',
      '/client/machines': ['can_manage_machines', 'can_manage_machine_readings'], // Either permission grants access
      '/client/reports': 'can_view_reports',
      '/client/workforce': 'can_manage_employees', // Workforce requires employee management permission
    };

    // Sub-item permission mapping
    const subItemPermissionMap: Record<string, string> = {
      '/client/settings/permission-sets': 'can_manage_admin_users',
      '/client/settings/audit-logs': 'can_manage_admin_users',
    };

    return navItems
      .filter(item => {
        // Dashboard is always visible
        if (item.path === '/client/dashboard') {
          return true;
        }

        // Owners see everything
        if (isOwner) {
          return true;
        }

        // Check permission for this nav item
        const requiredPermission = permissionMap[item.path];
        if (requiredPermission) {
          // Handle array of permissions (any one grants access)
          if (Array.isArray(requiredPermission)) {
            return requiredPermission.some(perm => permissions[perm] === true);
          }
          return permissions[requiredPermission] === true;
        }

        // Settings menu is visible but sub-items are filtered
        if (item.path === '/client/settings') {
          return true;
        }

        // Default: show the item
        return true;
      })
      .map(item => {
        // Filter sub-items based on permissions
        if (item.subItems && !isOwner) {
          const filteredSubItems = item.subItems.filter(sub => {
            const requiredPerm = subItemPermissionMap[sub.path];
            if (requiredPerm) {
              return permissions[requiredPerm] === true;
            }
            return true; // Keep items without specific permission requirements
          });
          return { ...item, subItems: filteredSubItems };
        }
        return item;
      });
  };

  const filteredNavItems = getFilteredNavItems();

  // Auto-expand parent if on child route
  React.useEffect(() => {
    filteredNavItems.forEach(item => {
      if (item.subItems?.some(sub => location.pathname.startsWith(sub.path))) {
        setExpandedItems(prev => new Set([...prev, item.path]));
      }
    });
  }, [location.pathname]);

  const toggleExpand = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const isItemActive = (item: NavItem) => {
    if (item.subItems) {
      return item.subItems.some(sub => location.pathname.startsWith(sub.path)) ||
        location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

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
            aria-label="Close sidebar menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)]">
          {filteredNavItems.map((item) => (
            <div key={item.path}>
              {/* Parent item */}
              {item.subItems ? (
                // Expandable item with sub-menu
                <>
                  <button
                    onClick={() => {
                      // Navigate to the parent page AND expand
                      navigate(item.path);
                      // Also expand the submenu
                      setExpandedItems(prev => new Set([...prev, item.path]));
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${isItemActive(item)
                      ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-white'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span
                      className="text-slate-400 p-1 hover:bg-slate-700 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(item.path, e);
                      }}
                    >
                      {expandedItems.has(item.path) ? <ChevronDown /> : <ChevronRight />}
                    </span>
                  </button>

                  {/* Sub-items */}
                  {expandedItems.has(item.path) && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-700 pl-4">
                      {item.subItems.map((sub) => (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `block px-3 py-2 rounded-md text-sm transition-all ${isActive
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                            }`
                          }
                        >
                          {sub.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Regular nav item
                <NavLink
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
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
};
