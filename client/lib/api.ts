interface AuthTokens {
  access: string;
  refresh: string;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl = 'https://melbminds-production.up.railway.app/api';
  private tokens: AuthTokens | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;

  setTokens(tokens: AuthTokens | null) {
    this.tokens = tokens;
  }

  private async refreshTokens(): Promise<AuthTokens> {
    if (!this.tokens?.refresh) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: this.tokens.refresh,
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const newTokens = await response.json();
      this.tokens = newTokens;
      
      // Update tokens in localStorage
      localStorage.setItem('tokens', JSON.stringify(newTokens));
      
      return newTokens;
    } catch (error) {
      // Clear tokens on refresh failure
      this.tokens = null;
      localStorage.removeItem('tokens');
      localStorage.removeItem('user');
      throw error;
    }
  }

  private async getValidAccessToken(): Promise<string> {
    if (!this.tokens?.access) {
      throw new Error('No access token available');
    }

    // Check if token is expired (simple check - in production you'd decode the JWT)
    try {
      const response = await fetch(`${this.baseUrl}/profile/`, {
        headers: {
          'Authorization': `Bearer ${this.tokens.access}`,
        },
      });

      if (response.status === 401) {
        // Token is expired, refresh it
        if (!this.refreshPromise) {
          this.refreshPromise = this.refreshTokens();
        }
        
        const newTokens = await this.refreshPromise;
        this.refreshPromise = null;
        return newTokens.access;
      }

      return this.tokens.access;
    } catch (error) {
      throw new Error('Token validation failed');
    }
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Add authorization header if we have tokens
      if (this.tokens?.access) {
        try {
          const accessToken = await this.getValidAccessToken();
          options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${accessToken}`,
          };
        } catch (error) {
          // If token refresh fails, redirect to login
          window.location.href = '/auth';
          return { error: 'Authentication failed' };
        }
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMsg = errorData?.error || errorData?.detail || null;
        
        if (!errorMsg && typeof errorData === 'object') {
          for (const key in errorData) {
            if (typeof errorData[key] === 'string') {
              errorMsg = errorData[key];
              break;
            }
            if (Array.isArray(errorData[key]) && typeof errorData[key][0] === 'string') {
              errorMsg = errorData[key][0];
              break;
            }
          }
        }

        if (response.status === 401) {
          // Unauthorized - redirect to login
          window.location.href = '/auth';
        }

        return { error: errorMsg || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: 'Network error' };
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint);
  }

  async post<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // File upload method
  async uploadFile<T = any>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    try {
      if (this.tokens?.access) {
        try {
          const accessToken = await this.getValidAccessToken();
          formData.append('Authorization', `Bearer ${accessToken}`);
        } catch (error) {
          window.location.href = '/auth';
          return { error: 'Authentication failed' };
        }
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.tokens?.access}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMsg = errorData?.error || errorData?.detail || null;
        
        if (!errorMsg && typeof errorData === 'object') {
          for (const key in errorData) {
            if (typeof errorData[key] === 'string') {
              errorMsg = errorData[key];
              break;
            }
            if (Array.isArray(errorData[key]) && typeof errorData[key][0] === 'string') {
              errorMsg = errorData[key][0];
              break;
            }
          }
        }

        if (response.status === 401) {
          window.location.href = '/auth';
        }

        return { error: errorMsg || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: 'Network error' };
    }
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Legacy apiRequest for compatibility with flashcards and AuthenticatedImage
export async function apiRequest(
  url: string,
  options: RequestInit = {},
  tokens: { access: string; refresh: string } | null,
  refreshToken: () => Promise<boolean>
): Promise<Response> {
  // Add authorization header if we have tokens
  const headers = {
    ...options.headers,
    ...(tokens?.access && { Authorization: `Bearer ${tokens.access}` }),
  }

  // Make the initial request
  let response = await fetch(url, {
    ...options,
    headers,
  })

  // If we get a 401 and have a refresh token, try to refresh
  if (response.status === 401 && tokens?.refresh) {
    const refreshSuccess = await refreshToken()
    if (refreshSuccess) {
      // Get the updated tokens from localStorage since the context has been updated
      const updatedTokensStr = localStorage.getItem('tokens')
      const updatedTokens = updatedTokensStr ? JSON.parse(updatedTokensStr) : null
      if (updatedTokens?.access) {
        // Retry the request with the new token
        const newHeaders = {
          ...options.headers,
          Authorization: `Bearer ${updatedTokens.access}`,
        }
        response = await fetch(url, {
          ...options,
          headers: newHeaders,
        })
      }
    }
  }

  return response
}

// Simple client-side cache for API responses
export function getCachedApiData<T>(key: string, maxAgeMs: number = 60000): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < maxAgeMs) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export function setCachedApiData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

// Export the interface for use in other files
export type { AuthTokens, ApiResponse };
