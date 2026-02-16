import { SearchTab } from '@/types';

// API Configuration
import { CONFIG } from './config';
export const DEFAULT_BACKEND = CONFIG.API_BASE_URL;

// Storage Keys
export const TABS_STORAGE_KEY = "job-bot-tabs";
export const ACTIVE_TAB_STORAGE_KEY = "job-bot-active-tab";
export const THEME_STORAGE_KEY = "job-bot-theme";

// Default Values
export const DEFAULT_TABS: SearchTab[] = [{ id: 'all', label: 'All History', type: 'static' }];

// Supported Countries for Job Search
export const SUPPORTED_COUNTRIES = [
  { code: "india", name: "India" },
  { code: "usa", name: "United States" },
  { code: "uk", name: "United Kingdom" },
  { code: "canada", name: "Canada" },
  { code: "australia", name: "Australia" },
  { code: "germany", name: "Germany" },
  { code: "france", name: "France" },
  { code: "netherlands", name: "Netherlands" },
  { code: "singapore", name: "Singapore" },
  { code: "uae", name: "UAE" },
];

// Job Platforms
export const JOB_PLATFORMS = ['linkedin', 'indeed', 'glassdoor'] as const;
export type JobPlatform = typeof JOB_PLATFORMS[number];

// Request Configuration
export const REQUEST_TIMEOUT = 30000; // 30 seconds
export const CACHE_TTL = 5000; // 5 seconds cache TTL
