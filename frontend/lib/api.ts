/**
 * Centralized API client for the Job Bot frontend.
 * Provides typed API calls with error handling and timeouts.
 */

import { CONFIG } from './config';

// API configuration
const API_BASE_URL = CONFIG.API_BASE_URL;
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const SEARCH_TIMEOUT = 120000; // 2 minutes for search operations

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
 * Make a fetch request with timeout and error handling
 */
async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
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
  } = {}): Promise<{ jobs: unknown[]; total: number; limit: number; offset: number }> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());
    if (params.batch_id) searchParams.set('batch_id', params.batch_id);
    if (params.source_site) searchParams.set('source_site', params.source_site);
    if (params.location) searchParams.set('location', params.location);

    const url = `${API_BASE_URL}/jobs/search?${searchParams.toString()}`;
    return fetchWithTimeout(url);
  },

  /**
   * Get a single job by ID
   */
  async getJob(jobId: string): Promise<unknown> {
    return fetchWithTimeout(`${API_BASE_URL}/jobs/${jobId}`);
  },

  /**
   * Update a job's status
   */
  async updateJobStatus(jobId: string, status: string): Promise<unknown> {
    return fetchWithTimeout(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<void> {
    return fetchWithTimeout(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Clear all jobs
   */
  async clearAllJobs(): Promise<{ ok: boolean; message: string; count: number }> {
    return fetchWithTimeout(`${API_BASE_URL}/jobs/clear`, {
      method: 'POST',
    });
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
   * Get pipeline logs
   */
  async getPipelineLogs(jobId: string): Promise<{
    state: string;
    logs: string[];
    stats: Record<string, unknown>;
  }> {
    return fetchWithTimeout(`${API_BASE_URL}/logs/${jobId}`);
  },

  // --- SETTINGS ENDPOINTS ---

  /**
   * Get current settings
   */
  async getSettings(): Promise<unknown> {
    return fetchWithTimeout(`${API_BASE_URL}/settings`);
  },

  /**
   * Update settings
   */
  async updateSettings(settings: Record<string, unknown>): Promise<unknown> {
    return fetchWithTimeout(`${API_BASE_URL}/settings`, {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  /**
   * Connect API key
   */
  async connectApiKey(apiKey: string): Promise<{ ok: boolean; message: string }> {
    return fetchWithTimeout(`${API_BASE_URL}/connect`, {
      method: 'POST',
      body: JSON.stringify({ api_key: apiKey }),
    });
  },

  /**
   * Disconnect API key
   */
  async disconnectApiKey(): Promise<{ ok: boolean; message: string }> {
    return fetchWithTimeout(`${API_BASE_URL}/disconnect`, {
      method: 'POST',
    });
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
