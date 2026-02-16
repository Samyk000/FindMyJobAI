/**
 * Application configuration.
 * 
 * API_BASE_URL: Where the backend server runs.
 * In both development and Tauri desktop mode, this is localhost:8000.
 * The backend always runs locally (either manually or as a Tauri sidecar).
 */
export const CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
} as const;
