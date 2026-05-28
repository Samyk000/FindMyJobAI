/**
 * Centralized API client for the Job Bot frontend.
 * Provides typed API calls with error handling, timeouts, and caching.
 */

import { CONFIG } from './config';
import { JobRow, SettingsModel, PipelineStatus } from '@/types';

// API configuration
const API_BASE_URL = CONFIG.API_BASE_URL;
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const SEARCH_TIMEOUT = 120000; // 2 minutes for search operations
const DEFAULT_CACHE_TTL = 60000; // 1 minute cache TTL

// Types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  detail?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  detail?: string;
  status?: number;
}

// Request cache for GET requests
const requestCache = new Map<string, { data: unknown; timestamp: number }>();

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  code?: string;
  detail?: string;
  status?: number;

  constructor(message: string, options?: { code?: string; detail?: string; status?: number }) {
    super(message);
    this.name = 'ApiClientError';
    this.code = options?.code;
    this.detail = options?.detail;
    this.status = options?.status;
  }
}

/**
 * Clear the API cache (useful after mutations)
 */
export function clearApiCache(): void {
  requestCache.clear();
}

/**
 * Clear a specific cache key
 */
export function clearCacheKey(key: string): void {
  requestCache.delete(key);
}

/**
 * Make a fetch request with timeout, error handling, and optional caching
 */
async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT,
  useCache: boolean = true
): Promise<T> {
  // Check cache for GET requests
  const isGetRequest = !options.method || options.method === 'GET';
  const cacheKey = isGetRequest && useCache ? url : null;
  
  if (cacheKey) {
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < DEFAULT_CACHE_TTL) {
      return cached.data as T;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    // Parse response
    const data = await response.json().catch(() => ({}));

    // Handle non-OK responses
    if (!response.ok) {
      const errorMessage = data.error || data.detail || data.message || `Request failed with status ${response.status}`;
      throw new ApiClientError(errorMessage, {
        code: data.code,
        detail: data.detail,
        status: response.status,
      });
    }

    // Cache successful GET requests
    if (cacheKey) {
      requestCache.set(cacheKey, { data, timestamp: Date.now() });
    }

    return data as T;
  } catch (err) {
    clearTimeout(timeoutId);

    // Handle timeout
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiClientError('Request timed out. Please check your connection and try again.', {
        code: 'TIMEOUT',
      });
    }

    // Handle network errors
    if (err instanceof TypeError) {
      throw new ApiClientError('Cannot connect to server. Please ensure the backend is running.', {
        code: 'NETWORK_ERROR',
      });
    }

    // Re-throw ApiClientError
    if (err instanceof ApiClientError) {
      throw err;
    }

    // Unknown error
    throw new ApiClientError(err instanceof Error ? err.message : 'An unknown error occurred', {
      code: 'UNKNOWN_ERROR',
    });
  }
}

/**
 * API Client class with typed methods for all endpoints
 */
export const apiClient = {
  // --- JOBS ENDPOINTS ---

  /**
   * Get all jobs with filters
   */
  async getJobs(params: {
    status?: string;
    limit?: number;
    offset?: number;
    batch_id?: string;
    source_site?: string;
    location?: string;
  } = {}): Promise<{ jobs: JobRow[]; total: number; limit: number; offset: number }> {
    const url = `${API_BASE_URL}/jobs/search`;
    return fetchWithTimeout(url, {
      method: 'POST',
      body: JSON.stringify({
        status: params.status,
        limit: params.limit,
        offset: params.offset,
        batch_id: params.batch_id,
        source_site: params.source_site,
        location: params.location,
      }),
    });
  },

  /**
   * Get a single job by ID
   */
  async getJob(jobId: string): Promise<JobRow> {
    return fetchWithTimeout(`${API_BASE_URL}/jobs/${jobId}`);
  },

  /**
   * Update a job's status
   */
  async updateJobStatus(jobId: string, status: 'new' | 'saved' | 'rejected'): Promise<JobRow> {
    const result = await fetchWithTimeout<JobRow>(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    // Clear jobs cache after mutation
    clearCacheKey(`${API_BASE_URL}/jobs/search`);
    return result;
  },

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<void> {
    await fetchWithTimeout(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'DELETE',
    });
    // Clear jobs cache after mutation
    clearCacheKey(`${API_BASE_URL}/jobs/search`);
  },

  /**
   * Clear all jobs
   */
  async clearAllJobs(resetSettings: boolean = false): Promise<{ ok: boolean; message: string; count: number }> {
    const url = `${API_BASE_URL}/jobs/clear-all?reset_settings=${resetSettings}`;
    const result = await fetchWithTimeout<{ ok: boolean; message: string; count: number }>(url, {
      method: 'DELETE',
    });
    // Clear all cache after clearing jobs
    clearApiCache();
    return result;
  },

  /**
   * Clear search jobs (keeps saved and rejected)
   */
  async clearSearchJobs(): Promise<{ ok: boolean; message: string; count: number }> {
    const url = `${API_BASE_URL}/jobs/clear-search`;
    const result = await fetchWithTimeout<{ ok: boolean; message: string; count: number }>(url, {
      method: 'DELETE',
    });
    clearApiCache();
    return result;
  },

  // --- SEARCH ENDPOINTS ---

  /**
   * Start a scrape job
   */
  async startScrape(params: {
    titles?: string;
    locations?: string;
    country?: string;
    hours_old?: number;
  } = {}): Promise<{ job_id: string; batch_id: string; message: string }> {
    return fetchWithTimeout(
      `${API_BASE_URL}/run/scrape`,
      {
        method: 'POST',
        body: JSON.stringify(params),
      },
      SEARCH_TIMEOUT
    );
  },

  /**
   * Cancel a scrape job
   */
  async cancelScrape(jobId: string): Promise<{ ok: boolean; message: string }> {
    return fetchWithTimeout(`${API_BASE_URL}/run/cancel/${jobId}`, {
      method: 'POST',
    });
  },

  /**
   * Get pipeline logs
   */
  async getPipelineLogs(jobId: string): Promise<PipelineStatus> {
    return fetchWithTimeout(`${API_BASE_URL}/logs/${jobId}`);
  },

  // --- SETTINGS ENDPOINTS ---

  /**
   * Get current settings
   */
  async getSettings(): Promise<SettingsModel> {
    return fetchWithTimeout(`${API_BASE_URL}/settings`);
  },

  /**
   * Update settings
   */
  async updateSettings(settings: Partial<SettingsModel>): Promise<SettingsModel> {
    const result = await fetchWithTimeout<SettingsModel>(`${API_BASE_URL}/settings`, {
      method: 'POST',
      body: JSON.stringify(settings),
    });
    // Clear settings cache after mutation
    clearCacheKey(`${API_BASE_URL}/settings`);
    return result;
  },

  // --- STATS ENDPOINT ---

  /**
   * Get job statistics
   */
  async getStats(): Promise<{ total: number; new: number; saved: number; rejected: number }> {
    return fetchWithTimeout(`${API_BASE_URL}/stats`);
  },
};

export default apiClient;
