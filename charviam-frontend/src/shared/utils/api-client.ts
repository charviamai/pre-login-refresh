import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError } from '../types';

// ============================================================================
// API CLIENT CONFIGURATION
// ============================================================================

const BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api';

class ApiClient {
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private deviceToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadTokensFromStorage();
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  // --------------------------------------------------------------------------
  // Setup Request & Response Interceptors
  // --------------------------------------------------------------------------

  private setupInterceptors() {
    // Request Interceptor - Add Authorization header
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // For kiosk endpoints, always try to reload device token from storage
        if (config.url?.startsWith('/kiosk')) {
          if (!this.deviceToken) {
            this.loadTokensFromStorage();
          }
        } else {
          // For other endpoints, reload tokens if both are missing
          if (!this.accessToken && !this.deviceToken) {
            this.loadTokensFromStorage();
          }
        }

        // Use device token for kiosk endpoints (except activation which is public)
        if (config.url?.startsWith('/kiosk') && !config.url?.includes('/activate')) {
          if (this.deviceToken) {
            // Backend expects X-Device-Key header for device authentication
            config.headers['X-Device-Key'] = this.deviceToken;
          } else if (import.meta.env.DEV) {
            console.warn('[ApiClient] No device token found for kiosk endpoint:', config.url);
          }
        } else if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        } else if (!config.url?.startsWith('/public') && !config.url?.startsWith('/auth/login') && !config.url?.startsWith('/kiosk/activate')) {
          // Warn if no token for authenticated endpoints (only in dev)
          if (import.meta.env.DEV) {
            console.debug('[ApiClient] Requesting authenticated endpoint without token:', config.url);
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );


    // ... (existing code)

    // Response Interceptor - Handle errors globally
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        // Handle Request Queuing in Offline Mode
        if (!error.response && error.request && !navigator.onLine) {
          // Network error while offline - Queue it!
          // Only queue mutation requests (POST, PUT, PATCH, DELETE)
          // GET requests just fail (UI should handle cache/loading state)
          const config = error.config;
          if (config && config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
            const url = config.url || '';
            // Skip auth endpoints from queuing
            if (!url.includes('/auth/login') && !url.includes('/auth/refresh')) {
              // Dispatch event for OfflineService to handle
              window.dispatchEvent(new CustomEvent('api:offline-error', {
                detail: {
                  url,
                  method: config.method.toUpperCase(),
                  data: config.data ? JSON.parse(config.data) : undefined
                }
              }));

              return Promise.reject({
                ...error,
                message: 'No internet connection. Request queued for sync.',
                code: 'OFFLINE_QUEUED'
              });
            }
          }
        }

        if (error.response) {
          // ... (rest of existing error handling)
          const { status } = error.response;

          // Attempt token refresh on 401 for access-token flows
          if (status === 401) {
            const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

            if (!originalRequest._retry && this.refreshToken) {
              if (this.isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve) => {
                  this.addRefreshSubscriber((token: string) => {
                    originalRequest.headers = {
                      ...(originalRequest.headers || {}),
                      Authorization: `Bearer ${token}`,
                    };
                    resolve(this.axiosInstance.request(originalRequest));
                  });
                });
              }

              originalRequest._retry = true;
              this.isRefreshing = true;

              try {
                const refreshResp = await this.post<{ access: string }>('/auth/refresh/', { refresh: this.refreshToken });
                if ((refreshResp as any)?.access) {
                  const newToken = (refreshResp as any).access;
                  this.setAccessToken(newToken);
                  this.isRefreshing = false;

                  // Notify all queued requests
                  this.onRefreshed(newToken);

                  // Retry the original request
                  originalRequest.headers = {
                    ...(originalRequest.headers || {}),
                    Authorization: `Bearer ${newToken}`,
                  };
                  return this.axiosInstance.request(originalRequest);
                }
              } catch (refreshErr) {
                this.isRefreshing = false;
                this.refreshSubscribers = [];
                // Fall through to unauthorized handler for non-kiosk routes
                if (!originalRequest.url?.startsWith('/kiosk')) {
                  this.handleUnauthorized();
                }
              }
            } else {
              // No refresh token or refresh failed - redirect to login for non-kiosk routes
              if (!error.config?.url?.startsWith('/kiosk')) {
                this.handleUnauthorized();
              }
            }
          }

          // Handle 403 Forbidden
          if (status === 403) {
            console.warn('Access Forbidden:', error.config?.url);
          }

          // Handle 429 Too Many Requests
          if (status === 429) {
            console.warn('Rate Limit Exceeded:', error.config?.url);
          }
        } else if (error.request) {
          // Network error
          console.error('Network Error:', error.message);
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  // --------------------------------------------------------------------------
  // Token Management
  // --------------------------------------------------------------------------

  setAccessToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('access_token', token);
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setDeviceToken(token: string) {
    this.deviceToken = token;
    localStorage.setItem('device_token', token);
  }

  getDeviceToken(): string | null {
    return this.deviceToken;
  }

  setRefreshToken(token: string) {
    this.refreshToken = token;
    localStorage.setItem('refresh_token', token);
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.deviceToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('device_token');
    localStorage.removeItem('refresh_token');
  }

  clearDeviceToken() {
    this.deviceToken = null;
    localStorage.removeItem('device_token');
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('access_token');
    this.deviceToken = localStorage.getItem('device_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private handleUnauthorized() {
    this.clearTokens();
    // Redirect to login if not already there and not on kiosk route
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/login') && !currentPath.includes('/kiosk')) {
      window.location.href = '/login';
    }
  }

  // --------------------------------------------------------------------------
  // Error Normalization
  // --------------------------------------------------------------------------

  private normalizeError(error: AxiosError<ApiError>): ApiError {
    if (error.response?.data) {
      const data: any = error.response.data;

      // Handle field-level errors (like email, phone validation)
      const fieldErrors = data.field_errors || data.errors || {};

      // Check for common field errors and add them to fieldErrors
      if (data.phone) fieldErrors.phone = data.phone;
      if (data.email) fieldErrors.email = data.email;
      if (data.access_code) fieldErrors.access_code = data.access_code;

      // Determine the main error message
      let mainError = data.error || data.detail || data.message;

      // Handle Django REST Framework's non_field_errors (used for login validation)
      if (!mainError && data.non_field_errors) {
        mainError = Array.isArray(data.non_field_errors)
          ? data.non_field_errors[0]
          : data.non_field_errors;
      }

      // If there's no main error but there are field errors, use the first field error as the message
      if (!mainError && Object.keys(fieldErrors).length > 0) {
        const firstField = Object.keys(fieldErrors)[0];
        const firstError = Array.isArray(fieldErrors[firstField])
          ? fieldErrors[firstField][0]
          : fieldErrors[firstField];
        mainError = firstError;
      }

      return {
        error: mainError || 'An error occurred',
        field_errors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
        status_code: error.response.status,
        message: mainError,
        ...(data.code && { code: data.code }),
        ...(data.user_id && { user_id: data.user_id }),
        // Preserve all other custom fields from the response (e.g., deleted_customer_exists)
        ...Object.keys(data).reduce((acc, key) => {
          if (!['error', 'detail', 'message', 'non_field_errors', 'field_errors', 'errors', 'phone', 'email', 'access_code', 'code', 'user_id'].includes(key)) {
            acc[key] = data[key];
          }
          return acc;
        }, {} as Record<string, any>),
      } as ApiError;
    }

    if (error.request) {
      return {
        error: 'Network error. Please check your connection.',
        status_code: 0,
      };
    }

    return {
      error: error.message || 'An unexpected error occurred',
      status_code: 500,
    };
  }

  // --------------------------------------------------------------------------
  // HTTP Methods
  // --------------------------------------------------------------------------

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config);
    return response.data;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
