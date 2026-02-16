/**
 * Runtime validation utilities for API responses.
 * Provides type guards to validate API data before use.
 */

import { JobRow, SettingsModel, PipelineStatus } from '@/types';

/**
 * Type guard to check if a value is a valid JobRow
 */
export function isJobRow(data: unknown): data is JobRow {
  if (typeof data !== 'object' || data === null) return false;
  const job = data as Record<string, unknown>;
  
  return (
    typeof job.id === 'string' &&
    typeof job.title === 'string' &&
    typeof job.company === 'string' &&
    typeof job.location === 'string' &&
    typeof job.job_url === 'string' &&
    typeof job.is_remote === 'boolean' &&
    typeof job.date_posted === 'string' &&
    typeof job.source_site === 'string' &&
    (job.status === 'new' || job.status === 'saved' || job.status === 'rejected') &&
    typeof job.batch_id === 'string' &&
    typeof job.fetched_at === 'string'
  );
}

/**
 * Type guard to check if an array contains valid JobRow objects
 */
export function isJobRowArray(data: unknown): data is JobRow[] {
  if (!Array.isArray(data)) return false;
  return data.every(isJobRow);
}

/**
 * Type guard to check if a value is a valid SettingsModel
 */
export function isSettingsModel(data: unknown): data is SettingsModel {
  if (typeof data !== 'object' || data === null) return false;
  const settings = data as Record<string, unknown>;
  
  // Check required fields
  if (
    typeof settings.titles !== 'string' ||
    typeof settings.locations !== 'string' ||
    typeof settings.country !== 'string' ||
    typeof settings.include_keywords !== 'string' ||
    typeof settings.exclude_keywords !== 'string' ||
    typeof settings.results_per_site !== 'number' ||
    typeof settings.hours_old !== 'number' ||
    typeof settings.connected !== 'boolean'
  ) {
    return false;
  }
  
  // Check sites is either string[] or string (for backward compatibility)
  if (Array.isArray(settings.sites)) {
    if (!settings.sites.every((s): s is string => typeof s === 'string')) {
      return false;
    }
  } else if (typeof settings.sites !== 'string') {
    return false;
  }
  
  return true;
}

/**
 * Type guard to check if a value is a valid PipelineStatus
 */
export function isPipelineStatus(data: unknown): data is PipelineStatus {
  if (typeof data !== 'object' || data === null) return false;
  const pipeline = data as Record<string, unknown>;
  
  // Check state is valid
  const validStates = ['unknown', 'running', 'done', 'failed'];
  if (!validStates.includes(pipeline.state as string)) {
    return false;
  }
  
  // Check logs is string array
  if (!Array.isArray(pipeline.logs) || 
      !pipeline.logs.every((l): l is string => typeof l === 'string')) {
    return false;
  }
  
  // Stats can be any object
  if (typeof pipeline.stats !== 'object') {
    return false;
  }
  
  return true;
}

/**
 * Type guard for jobs search response
 */
export function isJobsSearchResponse(data: unknown): data is { jobs: JobRow[]; total: number; limit: number; offset: number } {
  if (typeof data !== 'object' || data === null) return false;
  const response = data as Record<string, unknown>;
  
  return (
    isJobRowArray(response.jobs) &&
    typeof response.total === 'number' &&
    typeof response.limit === 'number' &&
    typeof response.offset === 'number'
  );
}

/**
 * Type guard for stats response
 */
export function isStatsResponse(data: unknown): data is { total: number; new: number; saved: number; rejected: number } {
  if (typeof data !== 'object' || data === null) return false;
  const stats = data as Record<string, unknown>;
  
  return (
    typeof stats.total === 'number' &&
    typeof stats.new === 'number' &&
    typeof stats.saved === 'number' &&
    typeof stats.rejected === 'number'
  );
}

/**
 * Type guard for scrape response
 */
export function isScrapeResponse(data: unknown): data is { job_id: string; batch_id: string; message: string } {
  if (typeof data !== 'object' || data === null) return false;
  const response = data as Record<string, unknown>;
  
  return (
    typeof response.job_id === 'string' &&
    typeof response.batch_id === 'string' &&
    typeof response.message === 'string'
  );
}

/**
 * Safe parse function that returns either the validated data or null
 */
export function safeParse<T>(data: unknown, guard: (d: unknown) => d is T): T | null {
  return guard(data) ? data : null;
}

/**
 * Validate and throw if invalid
 */
export function validateOrThrow<T>(data: unknown, guard: (d: unknown) => d is T, message: string): T {
  if (!guard(data)) {
    throw new Error(message);
  }
  return data;
}
