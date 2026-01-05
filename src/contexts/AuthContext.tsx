import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../shared/utils/api-client';
import { authApi } from '../shared/utils/api-service';
import type { AuthUser, LoginCredentials } from '../shared/types';

// ============================================================================
// AUTH CONTEXT TYPES
// ============================================================================

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// AUTH CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============================================================================
// AUTH PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // Load Current User on Mount
  // --------------------------------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const token = apiClient.getAccessToken();
      if (token) {
        try {
          await loadCurrentUser();
        } catch (err) {

          apiClient.clearTokens();
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // --------------------------------------------------------------------------
  // Load Current User
  // --------------------------------------------------------------------------

  const loadCurrentUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to load user data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Login
  // --------------------------------------------------------------------------

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      // Call login API
      const tokens = await authApi.login(credentials);

      apiClient.setAccessToken(tokens.access_token);
      if ((tokens as any).refresh_token) {
        apiClient.setRefreshToken((tokens as any).refresh_token);
      }

      // Optimization: If login response includes user data, use it directly
      if (tokens.user) {
        setUser(tokens.user);
      } else {
        // Fallback: Load user data
        await loadCurrentUser();
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Logout
  // --------------------------------------------------------------------------

  const logout = async () => {
    // Call backend logout endpoint to create audit log
    try {
      await apiClient.post('/auth/logout/');
    } catch (err) {
      // Even if backend call fails, still clear tokens locally

    }
    apiClient.clearTokens();
    setUser(null);
    setError(null);
  };

  // --------------------------------------------------------------------------
  // Clear Error
  // --------------------------------------------------------------------------

  const clearError = () => {
    setError(null);
  };

  // --------------------------------------------------------------------------
  // Context Value
  // --------------------------------------------------------------------------

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    loadCurrentUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
