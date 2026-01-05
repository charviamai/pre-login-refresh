import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiresAuth?: boolean;
  /** Single permission required for CLIENT_ADMIN users (e.g., 'can_manage_shops') */
  requiredPermission?: string;
  /** Multiple permissions for CLIENT_ADMIN users */
  requiredPermissions?: string[];
  /** If true, all permissions in requiredPermissions must be met. If false (default), any one permission grants access. */
  requireAll?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiresAuth = true,
  requiredPermission,
  requiredPermissions,
  requireAll = true,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Require authentication
  if (requiresAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check permission-based access for CLIENT_ADMIN users
  if ((requiredPermission || requiredPermissions) && user && user.role === 'CLIENT_ADMIN') {
    const permissions = user.permissions || {};
    const isOwner = permissions.is_owner === true;

    // Owners have all permissions
    if (!isOwner) {
      let hasRequiredPermission = true;

      // Check single permission
      if (requiredPermission) {
        hasRequiredPermission = permissions[requiredPermission as keyof typeof permissions] === true;
      }

      // Check array of permissions
      if (requiredPermissions && requiredPermissions.length > 0) {
        if (requireAll) {
          // All permissions must be true
          hasRequiredPermission = requiredPermissions.every(
            perm => permissions[perm as keyof typeof permissions] === true
          );
        } else {
          // Any one permission grants access
          hasRequiredPermission = requiredPermissions.some(
            perm => permissions[perm as keyof typeof permissions] === true
          );
        }
      }

      if (!hasRequiredPermission) {
        // Redirect to dashboard if permission denied
        return <Navigate to="/client/dashboard" replace />;
      }
    }
  }

  return <>{children}</>;
};
