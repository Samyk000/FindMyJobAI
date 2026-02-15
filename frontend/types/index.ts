// Job Types
export type JobRow = {
  id: string;
  title: string;
  company: string;
  location: string;
  job_url: string;
  is_remote: boolean;
  date_posted: string;
  source_site: string;
  status: "new" | "saved" | "rejected";
  batch_id: string;
  fetched_at: string;
};

// Settings Types
export type SettingsModel = {
  titles: string;
  locations: string;
  country: string;
  include_keywords: string;
  exclude_keywords: string;
  sites: string[];
  results_per_site: number;
  hours_old: number;
  connected: boolean;
};

// Tab Types
export type SearchTab = {
  id: string;
  label: string;
  type: 'static' | 'new' | 'result';
  query?: {
    title: string;
    location: string;
    country: string;
    keywordsInc: string;
    keywordsExc: string;
  };
};

// Pipeline Types
export type PipelineStatus = {
  state: "unknown" | "running" | "done" | "failed";
  logs: string[];
  stats: Record<string, unknown>;
};

// Theme Types
export type ThemeMode = 'dark' | 'light';

// Pipeline Stats Type (for ProgressBar)
export type PipelineStats = {
  new_jobs: number;
  duplicates: number;
  filtered: number;
  total_queries: number;
  current_query: number;
  current_site: string;
  batch_id: string;
  started_at: number;
};
