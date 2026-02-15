"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";

import {
  Briefcase,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
  Search,
  Plus,
  X,
  MapPin,
  Clock,
  Building2,
  Globe,
  Linkedin,
  Loader2,
  Settings2,
  ChevronDown,
  ChevronUp,
  FileText,
  Filter,
  Play,
  AlertCircle,
  RefreshCw,
  Settings,
  Sun,
  Moon,
  Sparkles,
  Menu,
  ExternalLink,
  Zap
} from "lucide-react";

// Dynamic import for MobileNav to avoid SSR issues
const MobileNav = dynamic(() => import("../components/MobileNav"), { ssr: false });
// Dynamic import for EmptyState to avoid SSR issues
const EmptyState = dynamic(() => import("../components/EmptyState"), { ssr: false });
// Dynamic import for ProgressBar to avoid SSR issues
const ProgressBar = dynamic(() => import("../components/ProgressBar"), { ssr: false });
// Dynamic import for JobCard to enable code splitting
const JobCard = dynamic(() => import("../components/JobCard"), { ssr: false });

// --- TYPES ---

type JobRow = {
  id: string;
  title: string;
  company: string;
  location: string;
  job_url: string;
  is_remote: boolean;
  date_posted: string;
  source_site: string;
  status: "new" | "saved" | "rejected";
  scored: boolean;
  score: number | null;
  batch_id: string;
  fetched_at: string;
};

type SettingsModel = {
  titles: string;
  locations: string;
  country: string;
  include_keywords: string;
  exclude_keywords: string;
  sites: string[];
  results_per_site: number;
  hours_old: number;
  candidate_profile: string;
  connected: boolean;
};

type SearchTab = {
  id: string;
  label: string;
  type: 'static' | 'new' | 'result';
  query?: {
    title: string;
    location: string;
    country: string;
    keywordsInc: string;
    keywordsExc: string;
    profile: string;
  };
};

type PipelineStatus = {
  state: "unknown" | "running" | "done" | "failed";
  logs: string[];
  stats: Record<string, unknown>;
};

// --- CONSTANTS ---

const DEFAULT_BACKEND = "http://localhost:8000";
const TABS_STORAGE_KEY = "job-bot-tabs";
const ACTIVE_TAB_STORAGE_KEY = "job-bot-active-tab";
const THEME_STORAGE_KEY = "job-bot-theme";
const DEFAULT_TABS: SearchTab[] = [{ id: 'all', label: 'All History', type: 'static' }];

const SUPPORTED_COUNTRIES = [
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

type ThemeMode = 'dark' | 'light';

function loadThemeFromStorage(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (e) {
    console.error('Failed to load theme:', e);
  }
  return 'dark'; // Default
}

function saveThemeToStorage(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.error('Failed to save theme:', e);
  }
}

// --- HELPER FUNCTIONS ---

function loadTabsFromStorage(): { tabs: SearchTab[]; activeTabId: string } {
  if (typeof window === 'undefined') return { tabs: DEFAULT_TABS, activeTabId: 'all' };
  try {
    const savedTabs = localStorage.getItem(TABS_STORAGE_KEY);
    const savedActiveTab = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    if (savedTabs) {
      const parsed = JSON.parse(savedTabs) as SearchTab[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasAllTab = parsed.some(t => t.id === 'all');
        const validTabs = hasAllTab ? parsed : [DEFAULT_TABS[0], ...parsed];
        const activeId = savedActiveTab && validTabs.some(t => t.id === savedActiveTab)
          ? savedActiveTab : 'all';
        return { tabs: validTabs, activeTabId: activeId };
      }
    }
  } catch (e) {
    console.error('Failed to load tabs:', e);
  }
  return { tabs: DEFAULT_TABS, activeTabId: 'all' };
}

function saveTabsToStorage(tabs: SearchTab[], activeTabId: string): void {
  try {
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabs));
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTabId);
  } catch (e) {
    console.error('Failed to save tabs:', e);
  }
}

// --- COMPONENT: ERROR TOAST ---

function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 toast-enter"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 max-w-md dark:bg-red-900/90 dark:border-red-800 dark:text-red-100">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-200" aria-hidden="true" />
        <p className="text-sm font-medium flex-1">{message}</p>
        <button 
          onClick={onClose} 
          aria-label="Dismiss error message"
          className="btn-icon hover:opacity-75 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// --- COMPONENT: SKELETON LOADER (Compact with Shimmer) ---

function SkeletonJobRow({ isDark }: { isDark: boolean }) {
  const shimmerStyle = {
    background: isDark 
      ? 'linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)'
      : 'linear-gradient(90deg, #e4e4e7 25%, #f4f4f5 50%, #e4e4e7 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s linear infinite',
  };

  return (
    <div className={`flex items-center gap-4 p-3 border-l-2 border-transparent ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
      {/* Icon skeleton */}
      <div className="w-9 h-9 rounded-lg flex-shrink-0" style={shimmerStyle}></div>
      
      {/* Content skeleton */}
      <div className="flex-1 grid grid-cols-12 gap-4 items-center">
        <div className="col-span-4 space-y-2">
          <div className="h-4 rounded w-3/4" style={shimmerStyle}></div>
          <div className="h-3 rounded w-1/2" style={shimmerStyle}></div>
        </div>
        <div className="col-span-2 h-3 rounded w-20" style={shimmerStyle}></div>
        <div className="col-span-2 h-3 rounded w-16" style={shimmerStyle}></div>
        <div className="col-span-2 h-3 rounded w-20" style={shimmerStyle}></div>
        <div className="col-span-2 h-5 rounded w-16 ml-auto" style={shimmerStyle}></div>
      </div>
    </div>
  );
}

// --- COMPONENT: LOADING SCREEN ---

function LoadingScreen({ isDark }: { isDark: boolean }) {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center gap-6 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
      {/* Animated Logo Icon */}
      <div className="relative">
        <div className={`absolute inset-0 rounded-2xl blur-xl ${isDark ? 'bg-teal-500/20' : 'bg-teal-500/10'}`}></div>
        <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? 'bg-gradient-to-br from-teal-500 to-teal-600 shadow-teal-500/20' : 'bg-gradient-to-br from-teal-500 to-teal-600 shadow-teal-500/30'}`}>
          <Search className="w-7 h-7 text-white animate-pulse" />
        </div>
      </div>
      
      {/* Brand Name */}
      <div className="flex flex-col items-center gap-1">
        <h1 className={`text-2xl font-bold tracking-tight font-display ${isDark ? 'text-white' : 'text-gray-900'}`}>
          FindMyJob<span className="text-teal-500">AI</span>
        </h1>
        <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>AI-Powered Job Search</p>
      </div>
      
      {/* Loading Dots */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-teal-500 animate-[dotPulse_1.4s_ease-in-out_infinite]"></div>
        <div className="w-2 h-2 rounded-full bg-teal-500 animate-[dotPulse_1.4s_ease-in-out_0.2s_infinite]"></div>
        <div className="w-2 h-2 rounded-full bg-teal-500 animate-[dotPulse_1.4s_ease-in-out_0.4s_infinite]"></div>
      </div>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---

export default function Page() {
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND;

  // -- STATE --
  const [isClient, setIsClient] = useState(false);

  // -- CONSTANTS --
  useEffect(() => { setIsClient(true); }, []);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [settings, setSettings] = useState<SettingsModel | null>(null);

  // Tabs
  const [tabs, setTabs] = useState<SearchTab[]>(() => loadTabsFromStorage().tabs);
  const [activeTabId, setActiveTabId] = useState<string>(() => loadTabsFromStorage().activeTabId);

  // Inputs
  const [inputTitle, setInputTitle] = useState("");
  const [inputLocation, setInputLocation] = useState("");
  const [inputCountry, setInputCountry] = useState("india");
  const [inputSites, setInputSites] = useState<string[]>([]);
  const [inputLimit, setInputLimit] = useState(20);
  const [inputHours, setInputHours] = useState(72);
  const [inputProfile, setInputProfile] = useState("");
  const [inputKeywordsInc, setInputKeywordsInc] = useState("");
  const [inputKeywordsExc, setInputKeywordsExc] = useState("");

  const [activeJob, setActiveJob] = useState<JobRow | null>(null);

  const [filterPortal, setFilterPortal] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [viewStatus, setViewStatus] = useState<"new" | "saved" | "rejected">("new");

  const [pipeline, setPipeline] = useState<PipelineStatus | null>(null);
  const [pipelineJobId, setPipelineJobId] = useState<string>("");
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);

  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    return loadThemeFromStorage();
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearingData, setClearingData] = useState(false);

  // Mobile state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Accessibility - Refs for focus management
  const profileModalRef = useRef<HTMLDivElement>(null);
  const settingsModalRef = useRef<HTMLDivElement>(null);
  const clearConfirmModalRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Debounce tracking for rapid clicks
  const debounceRef = useRef<Record<string, number>>({});

  // -- EFFECTS --

  useEffect(() => { saveTabsToStorage(tabs, activeTabId); }, [tabs, activeTabId]);

  useEffect(() => {
    saveThemeToStorage(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setPortalDropdownOpen(false);
      setLocationDropdownOpen(false);
    };
    if (portalDropdownOpen || locationDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [portalDropdownOpen, locationDropdownOpen]);

  // Keyboard navigation - Escape to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showClearConfirmModal) {
          setShowClearConfirmModal(false);
        } else if (showSettingsModal) {
          setShowSettingsModal(false);
        } else if (showProfileModal) {
          setShowProfileModal(false);
        } else if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        } else if (portalDropdownOpen) {
          setPortalDropdownOpen(false);
        } else if (locationDropdownOpen) {
          setLocationDropdownOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showClearConfirmModal, showSettingsModal, showProfileModal, isMobileMenuOpen, portalDropdownOpen, locationDropdownOpen]);

  // Focus management for modals
  useEffect(() => {
    if (showProfileModal && profileModalRef.current) {
      profileModalRef.current.focus();
    }
  }, [showProfileModal]);

  useEffect(() => {
    if (showSettingsModal && settingsModalRef.current) {
      settingsModalRef.current.focus();
    }
  }, [showSettingsModal]);

  useEffect(() => {
    if (showClearConfirmModal && clearConfirmModalRef.current) {
      clearConfirmModalRef.current.focus();
    }
  }, [showClearConfirmModal]);

  // Request timeout constant (30 seconds)
  const REQUEST_TIMEOUT = 30000;

  // Simple request cache for GET requests
  const requestCacheRef = useRef<Map<string, { data: unknown; timestamp: number }>>(new Map());
  const CACHE_TTL = 5000; // 5 seconds cache TTL

  const fetchWithError = useCallback(async (url: string, options?: RequestInit) => {
    // Check cache for GET requests
    const isGetRequest = !options?.method || options.method === 'GET';
    const cacheKey = isGetRequest ? url : null;
    
    if (cacheKey) {
      const cached = requestCacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        
        // Handle specific HTTP status codes
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        if (response.status === 503) {
          throw new Error('Service temporarily unavailable. Please try again later.');
        }
        if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        throw new Error(data.detail || data.message || `Request failed with status ${response.status}`);
      }
      
      const result = await response.json();
      
      // Cache successful GET requests
      if (cacheKey) {
        requestCacheRef.current.set(cacheKey, { data: result, timestamp: Date.now() });
      }
      
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      
      // Handle timeout
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      
      // Handle network errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error('Cannot connect to backend. Is the server running?');
      }
      throw err;
    }
  }, []);

  // Sync inputs with active tab
  useEffect(() => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab?.query) {
      setInputTitle(tab.query.title || "");
      setInputLocation(tab.query.location || "");
      setInputCountry(tab.query.country || "india");
      setInputKeywordsInc(tab.query.keywordsInc || "");
      setInputKeywordsExc(tab.query.keywordsExc || "");
      if (tab.query.profile) setInputProfile(tab.query.profile);
    } else if (tab?.type === 'new') {
      // Clear inputs for fresh search, but perhaps keep country/profile as they are sticky?
      // Let's clear main search inputs to avoid confusion.
      setInputTitle("");
      setInputLocation("");
      setInputKeywordsInc("");
      setInputKeywordsExc("");
    }
  }, [activeTabId, tabs]);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await fetchWithError(`${BACKEND}/settings`);
      setSettings(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      return null;
    }
  }, [BACKEND, fetchWithError]);

  const fetchJobs = useCallback(async (batchId?: string) => {
    try {
      const data = await fetchWithError(`${BACKEND}/jobs/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: viewStatus === 'new' ? 'active' : viewStatus,
          limit: 500,
          batch_id: batchId || undefined
        }),
      });
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    }
  }, [BACKEND, fetchWithError, viewStatus]);

  useEffect(() => {
    async function bootstrap() {
      setIsLoading(true);
      try {
        await fetchSettings();
        await fetchJobs();
      } finally {
        setIsLoading(false);
      }
    }
    bootstrap();
  }, []);

  useEffect(() => { if (!isLoading) fetchJobs(); }, [viewStatus]);

  useEffect(() => {
    if (!settings) return;
    const validSites = Array.isArray(settings.sites) ? settings.sites : (typeof settings.sites === 'string' ? (settings.sites as string).split(',') : []);
    setInputSites(validSites.length > 0 ? validSites : []);
    setInputLimit(settings.results_per_site || 20);
    setInputHours(settings.hours_old || 72);
    setInputProfile(settings.candidate_profile || "");
    setInputKeywordsInc(settings.include_keywords || "");
    setInputKeywordsExc(settings.exclude_keywords || "");
    setInputCountry(settings.country || "india");

    if (activeTabId === 'all') {
      setInputTitle(settings.titles || "");
      setInputLocation(settings.locations || "");
    }
  }, [settings, activeTabId]);

  useEffect(() => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab?.type === 'new') {
      if (inputTitle === settings?.titles) setInputTitle("");
      if (inputLocation === settings?.locations) setInputLocation("");
    }
    setFilterPortal("all");
    setFilterLocation("all");
  }, [activeTabId]);

  useEffect(() => {
    if (!pipelineJobId) return;
    const tick = setInterval(async () => {
      try {
        const data = await fetchWithError(`${BACKEND}/logs/${pipelineJobId}`);
        console.log('🐰 Pipeline poll data:', data.state, data.stats);
        setPipeline(data);
        if (data.state === "running" && data.stats?.batch_id) {
          setCurrentBatchId(data.stats.batch_id as string);
          await fetchJobs(data.stats.batch_id as string);
        }
        if (data.state === "done" || data.state === "failed") {
          console.log('🐰 Pipeline completed:', data.state);
          setPipelineJobId("");
          setCurrentBatchId(null);
          if (data.state === "done" && data.stats?.batch_id) {
            handleSearchComplete(data.stats.batch_id as string);
          }
          if (data.state === "failed") setError("Job search failed. Check console.");
          await fetchJobs();
        }
      } catch (err) { console.error('Poll error:', err); }
    }, 1000);
    return () => clearInterval(tick);
  }, [pipelineJobId, BACKEND, fetchWithError, fetchJobs]);

  // -- ACTIONS --

  function toggleTheme() {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }

  // Debounce helper for rapid clicks
  function withDebounce<T extends (...args: unknown[]) => unknown>(actionId: string, action: T, delay = 500): T {
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      const lastCall = debounceRef.current[actionId] || 0;
      if (now - lastCall < delay) {
        return; // Skip if called too recently
      }
      debounceRef.current[actionId] = now;
      return action(...args);
    }) as T;
  }

  async function clearAllData() {
    setClearingData(true);
    setShowClearConfirmModal(false);
    setShowSettingsModal(false);
    try {
      // Clear all jobs AND reset settings on backend
      await fetchWithError(`${BACKEND}/jobs/clear-all?reset_settings=true`, { method: "DELETE" });
      // Clear local storage (except theme preference)
      localStorage.removeItem(TABS_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_TAB_STORAGE_KEY);
      // Reset local state immediately for fresh start
      setTabs(DEFAULT_TABS);
      setActiveTabId('all');
      setJobs([]);
      setInputTitle("");
      setInputLocation("");
      setInputKeywordsInc("");
      setInputKeywordsExc("");
      setInputProfile("");
      setPipeline(null);
      setPipelineJobId("");
      setCurrentBatchId(null);
      // Fetch fresh settings
      await fetchSettings();
      setClearingData(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear data');
      setClearingData(false);
    }
  }

  function handleAddTab() {
    const newId = `new-${Date.now()}`;
    setTabs([...tabs, { id: newId, label: "New Search", type: 'new' }]);
    setActiveTabId(newId);
    setInputTitle("");
    setInputLocation("");
  }

  function handleCloseTab(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id && newTabs.length > 0) setActiveTabId(newTabs[newTabs.length - 1].id);
  }

  function handleSearchComplete(batchId: string) {
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        const titles = inputTitle.split(',').map(s => s.trim()).filter(Boolean);
        let tabLabel = titles[0] || "Results";
        if (tabLabel.length > 18) tabLabel = tabLabel.substring(0, 15) + '...';
        if (titles.length > 1) tabLabel += ` +${titles.length - 1}`;
        return {
          id: batchId,
          label: tabLabel,
          type: 'result',
          query: t.query // Preserve query data
        };
      }
      return t;
    }));
    setActiveTabId(batchId);
  }

  async function runScrape() {
    if (!inputTitle.trim()) { setError("Enter a job title"); return; }
    if (!inputLocation.trim()) { setError("Enter a location"); return; }
    if (inputSites.length === 0) { setError("Select a platform"); return; }

    // Save query params to active tab now
    if (activeTabId) {
      setTabs(prev => prev.map(t => {
        if (t.id === activeTabId) {
          return {
            ...t,
            query: {
              title: inputTitle,
              location: inputLocation,
              country: inputCountry,
              keywordsInc: inputKeywordsInc,
              keywordsExc: inputKeywordsExc,
              profile: inputProfile
            }
          };
        }
        return t;
      }));
    }

    setActionLoading('scrape');
    try {
      await fetchWithError(`${BACKEND}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titles: inputTitle, locations: inputLocation, country: inputCountry,
          sites: inputSites, results_per_site: inputLimit, hours_old: inputHours,
          candidate_profile: inputProfile, include_keywords: inputKeywordsInc, exclude_keywords: inputKeywordsExc
        }),
      });
      // Initialize stats with proper default values for immediate display
      console.log('🐰 runScrape: Setting pipeline state to running');
      setPipeline({ 
        state: "running", 
        logs: ["Initializing..."], 
        stats: {
          new_jobs: 0,
          duplicates: 0,
          filtered: 0,
          total_queries: 1,
          current_query: 0,
          current_site: inputSites.join(','),
          batch_id: '',
          started_at: Date.now()
        } 
      });
      const data = await fetchWithError(`${BACKEND}/run/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titles: inputTitle, locations: inputLocation, country: inputCountry, hours_old: inputHours }),
      });
      setPipelineJobId(data.job_id);
    } catch (err) {
      setPipeline({ state: "failed", logs: ["Failed."], stats: {} });
      setError(err instanceof Error ? err.message : 'Error starting search');
    } finally { setActionLoading(null); }
  }

  async function updateStatus(id: string, st: "new" | "saved" | "rejected") {
    // Debounce rapid clicks
    const now = Date.now();
    const lastCall = debounceRef.current[`status-${id}`] || 0;
    if (now - lastCall < 500) return;
    debounceRef.current[`status-${id}`] = now;

    setJobs(jobs.map(j => j.id === id ? { ...j, status: st } : j));
    try {
      await fetchWithError(`${BACKEND}/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: st }),
      });
    } catch (err) {
      setJobs(jobs);
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function deleteJob(id: string) {
    // Debounce rapid clicks
    const now = Date.now();
    const lastCall = debounceRef.current[`delete-${id}`] || 0;
    if (now - lastCall < 500) return;
    debounceRef.current[`delete-${id}`] = now;

    if (!confirm("Delete this job?")) return;
    const old = jobs;
    setJobs(jobs.filter(j => j.id !== id));
    try { await fetchWithError(`${BACKEND}/jobs/${id}`, { method: "DELETE" }); }
    catch (err) { setJobs(old); setError(err instanceof Error ? err.message : 'Delete failed'); }
  }

  async function saveProfile() {
    setActionLoading('profile');
    try {
      await fetchWithError(`${BACKEND}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, candidate_profile: inputProfile }),
      });
      setShowProfileModal(false);
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed'); }
    finally { setActionLoading(null); }
  }

  // -- FILTER LOGIC --

  const baseJobs = useMemo(() => {
    // Special case: Real-time results during scraping on a "new" tab
    if (activeTabId.startsWith('new-')) {
      if (pipeline?.state === 'running' && currentBatchId) {
        return jobs.filter(j => j.batch_id === currentBatchId);
      }
      return [];
    }

    return jobs.filter(j => {
      if (viewStatus === 'new' && j.status !== 'new') return false;
      if (viewStatus === 'saved' && j.status !== 'saved') return false;
      if (viewStatus === 'rejected' && j.status !== 'rejected') return false;
      if (activeTabId !== 'all' && j.batch_id !== activeTabId) return false;
      return true;
    });
  }, [jobs, viewStatus, activeTabId, pipeline?.state, currentBatchId]);

  const uniquePortals = useMemo(() => Array.from(new Set(baseJobs.map(j => j.source_site).filter(Boolean))).sort(), [baseJobs]);
  const uniqueLocations = useMemo(() => Array.from(new Set(baseJobs.map(j => j.location).filter(Boolean))).sort(), [baseJobs]);

  const displayJobs = useMemo(() => {
    return baseJobs.filter(j => {
      if (filterPortal !== "all" && j.source_site !== filterPortal) return false;
      if (filterLocation !== "all" && j.location !== filterLocation) return false;
      return true;
    });
  }, [baseJobs, filterPortal, filterLocation]);

  // -- RENDER CONSTANTS FOR THEME --
  const isDark = theme === 'dark';

  if (isLoading) {
    return <LoadingScreen isDark={isDark} />;
  }

  if (!settings) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
        <EmptyState 
          type="error" 
          isDark={isDark}
          title="Connection Error"
          description={`Cannot connect to backend at ${BACKEND}`}
          action={{
            label: "Retry Connection",
            onClick: () => window.location.reload()
          }}
        />
      </div>
    );
  }

  return (
    <div className={`flex h-screen font-sans overflow-hidden theme-transition ${isDark ? 'bg-zinc-950 text-zinc-300' : 'bg-white text-gray-700'}`}>
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}

      {/* --- MOBILE NAV DRAWER --- */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isDark={isDark}
        inputTitle={inputTitle}
        setInputTitle={setInputTitle}
        inputLocation={inputLocation}
        setInputLocation={setInputLocation}
        inputCountry={inputCountry}
        setInputCountry={setInputCountry}
        inputSites={inputSites}
        setInputSites={setInputSites}
        inputLimit={inputLimit}
        setInputLimit={setInputLimit}
        inputHours={inputHours}
        setInputHours={setInputHours}
        inputProfile={inputProfile}
        setInputProfile={setInputProfile}
        inputKeywordsInc={inputKeywordsInc}
        setInputKeywordsInc={setInputKeywordsInc}
        inputKeywordsExc={inputKeywordsExc}
        setInputKeywordsExc={setInputKeywordsExc}
        onFetch={runScrape}
        onOpenProfile={() => setShowProfileModal(true)}
        isFetching={pipeline?.state === 'running' || actionLoading === 'scrape'}
        showMoreOptions={showMoreOptions}
        setShowMoreOptions={setShowMoreOptions}
        jobCount={displayJobs.length}
        viewStatus={viewStatus}
      />

      {/* --- MOBILE HEADER --- */}
      <header className={`h-14 flex items-center justify-between px-4 border-b flex-shrink-0 lg:hidden fixed top-0 left-0 right-0 z-30 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'}`}>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          className={`p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600">
            <Search className="w-4 h-4 text-white" />
          </div>
          <span className={`font-bold tracking-tight font-display ${isDark ? 'text-white' : 'text-gray-900'}`}>
            FindMyJob<span className="text-teal-500">AI</span>
          </span>
        </div>
        <button
          onClick={() => setShowSettingsModal(true)}
          aria-label="Open settings"
          className={`p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* --- SIDEBAR (Desktop Only) --- */}
      <aside className={`hidden lg:flex w-80 border-r flex-col flex-shrink-0 z-20 ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}>
        <div className={`h-14 flex items-center px-6 border-b flex-shrink-0 ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-2.5 bg-gradient-to-br from-teal-500 to-teal-600`}>
            <Search className="w-4 h-4 text-white" />
          </div>
          <span className={`font-bold tracking-tight font-display ${isDark ? 'text-white' : 'text-gray-900'}`}>
            FindMyJob<span className="text-teal-500">AI</span>
          </span>
        </div>

        <div className="flex-1 p-5 space-y-6 overflow-y-auto scrollbar-thin">
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="job-title-input" className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Job Titles *</label>
              <div className="relative group">
                <Search className={`absolute left-3 top-2.5 w-4 h-4 transition-colors ${isDark ? 'text-zinc-600 group-focus-within:text-teal-400' : 'text-gray-400 group-focus-within:text-teal-600'}`} />
                <input
                  id="job-title-input"
                  className={`w-full border rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-black border-zinc-800 text-white focus:border-teal-500 focus:bg-zinc-900' : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'}`}
                  placeholder="Python Developer..."
                  value={inputTitle}
                  onChange={e => setInputTitle(e.target.value)}
                  aria-required="true"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="location-input" className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Locations *</label>
              <div className="relative group">
                <MapPin className={`absolute left-3 top-2.5 w-4 h-4 transition-colors ${isDark ? 'text-zinc-600 group-focus-within:text-teal-400' : 'text-gray-400 group-focus-within:text-teal-600'}`} />
                <input
                  id="location-input"
                  className={`w-full border rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-black border-zinc-800 text-white focus:border-teal-500 focus:bg-zinc-900' : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'}`}
                  placeholder="Remote, NY..."
                  value={inputLocation}
                  onChange={e => setInputLocation(e.target.value)}
                  aria-required="true"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="country-select" className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                Country <span className="text-teal-500">(Remote)</span>
              </label>
              <div className="relative">
                <select
                  id="country-select"
                  value={inputCountry}
                  onChange={e => setInputCountry(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none appearance-none cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-black border-zinc-800 text-white focus:border-teal-500' : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'}`}
                >
                  {SUPPORTED_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
                <ChevronDown className={`absolute right-3 top-2.5 w-4 h-4 pointer-events-none ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} />
              </div>
            </div>
          </div>

          <div className={`h-px ${isDark ? 'bg-zinc-800/50' : 'bg-gray-200'}`} />

          <div className="space-y-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Platforms</span>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Select job platforms">
              {['linkedin', 'indeed', 'glassdoor', 'zip_recruiter'].map(site => (
                <label key={site} className={`flex items-center gap-2 cursor-pointer p-2 rounded border text-xs font-medium transition-colors select-none focus-within:ring-2 focus-within:ring-teal-500 ${inputSites.includes(site)
                  ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400'
                  : isDark
                    ? 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
                  }`}>
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={inputSites.includes(site)} 
                    onChange={e => {
                      const newSites = e.target.checked ? [...inputSites, site] : inputSites.filter(s => s !== site);
                      setInputSites(newSites);
                    }}
                    aria-label={`${site.replace('_', ' ')} platform`}
                  />
                  {site === 'linkedin' && <Linkedin className="w-3 h-3" />}
                  {site === 'indeed' && <Briefcase className="w-3 h-3" />}
                  {site === 'glassdoor' && <Globe className="w-3 h-3" />}
                  <span className="capitalize truncate">{site.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Search Settings</span>
            <div className="grid grid-cols-2 gap-3">
              <div className={`border rounded-lg p-2.5 ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-300'}`}>
                <label htmlFor="max-results-input" className={`text-[10px] block mb-1 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Max Results</label>
                <input 
                  id="max-results-input"
                  type="number" 
                  className={`w-full bg-transparent text-sm outline-none font-medium focus-visible:ring-2 focus-visible:ring-teal-500 rounded ${isDark ? 'text-white' : 'text-gray-900'}`}
                  value={inputLimit} 
                  min={5} 
                  max={100}
                  onChange={e => setInputLimit(Math.max(5, Math.min(100, parseInt(e.target.value) || 20)))} 
                />
              </div>
              <div className={`border rounded-lg p-2.5 ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-300'}`}>
                <label htmlFor="age-hours-input" className={`text-[10px] block mb-1 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Age (Hours)</label>
                <input 
                  id="age-hours-input"
                  type="number" 
                  className={`w-full bg-transparent text-sm outline-none font-medium focus-visible:ring-2 focus-visible:ring-teal-500 rounded ${isDark ? 'text-white' : 'text-gray-900'}`}
                  value={inputHours} 
                  min={1} 
                  max={720}
                  onChange={e => setInputHours(Math.max(1, Math.min(720, parseInt(e.target.value) || 72)))} 
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button 
              onClick={() => setShowProfileModal(true)} 
              aria-label="Edit candidate profile"
              className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors text-xs font-bold group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-black border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white' : 'bg-white border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-900'}`}
            >
              <span className="flex items-center gap-2"><FileText className="w-3 h-3 group-hover:text-teal-500" /> Candidate Profile</span>
              <Settings2 className="w-3 h-3" />
            </button>

            <div className={`border rounded-lg overflow-hidden ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-300'}`}>
              <button 
                onClick={() => setShowMoreOptions(!showMoreOptions)} 
                aria-expanded={showMoreOptions}
                aria-controls="filter-keywords-panel"
                className={`w-full flex items-center justify-between p-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <span className="flex items-center gap-2"><Filter className="w-3 h-3" /> Filter Keywords</span>
                {showMoreOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showMoreOptions && (
                <div id="filter-keywords-panel" className={`p-2 space-y-2 border-t ${isDark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200 bg-gray-50'}`}>
                  <label htmlFor="include-keywords" className="sr-only">Include keywords (comma separated)</label>
                  <input 
                    id="include-keywords"
                    className={`w-full border rounded px-3 py-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} 
                    placeholder="Include (comma sep)" 
                    value={inputKeywordsInc} 
                    onChange={e => setInputKeywordsInc(e.target.value)} 
                  />
                  <label htmlFor="exclude-keywords" className="sr-only">Exclude keywords (comma separated)</label>
                  <input 
                    id="exclude-keywords"
                    className={`w-full border rounded px-3 py-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} 
                    placeholder="Exclude (comma sep)" 
                    value={inputKeywordsExc} 
                    onChange={e => setInputKeywordsExc(e.target.value)} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN AREA --- */}
      <div className={`flex-1 flex flex-col min-w-0 pt-14 lg:pt-0 ${isDark ? 'bg-zinc-950' : 'bg-gray-100'}`}>

        {/* HEADER: TABS + SETTINGS (Desktop Only) */}
        <div className={`hidden lg:flex h-14 items-end border-b px-4 gap-1 ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'}`} role="tablist" aria-label="Search tabs">
          <div className="flex items-end h-full gap-2 overflow-x-auto no-scrollbar flex-1">
            {tabs.map(tab => (
              <div 
                key={tab.id} 
                onClick={() => setActiveTabId(tab.id)}
                role="tab"
                aria-selected={activeTabId === tab.id}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveTabId(tab.id);
                  }
                }}
                className={`group flex items-center gap-2 px-4 h-9 rounded-t-lg text-xs font-bold border-t border-x cursor-pointer transition-all min-w-[120px] max-w-[200px] select-none flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${activeTabId === tab.id
                  ? isDark
                    ? 'bg-zinc-900 border-zinc-700 text-white translate-y-[1px] z-10'
                    : 'bg-gray-100 border-gray-300 text-gray-900 translate-y-[1px] z-10'
                  : isDark
                    ? 'bg-zinc-950 border-transparent text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 mb-1'
                    : 'bg-white border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700 mb-1'
                  }`}>
                <span className="truncate flex-1">{tab.label}</span>
                {tab.id !== 'all' && (
                  <button 
                    onClick={(e) => handleCloseTab(tab.id, e)} 
                    aria-label={`Close ${tab.label} tab`}
                    className={`opacity-0 group-hover:opacity-100 p-0.5 rounded-full focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'hover:bg-zinc-800 hover:text-red-400' : 'hover:bg-gray-200 hover:text-red-500'}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <button 
              onClick={handleAddTab} 
              aria-label="Add new search tab"
              className={`h-9 w-9 flex items-center justify-center rounded-t-lg transition-colors flex-shrink-0 mb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-900' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => setShowSettingsModal(true)} 
            aria-label="Open settings"
            className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors mb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'}`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* MOBILE TABS - Compact with job count */}
        <div className={`lg:hidden border-b flex items-center justify-between px-2 py-1.5 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`} role="tablist" aria-label="Search tabs">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                role="tab"
                aria-selected={activeTabId === tab.id}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  activeTabId === tab.id
                    ? isDark
                      ? 'bg-teal-500/20 text-teal-400'
                      : 'bg-teal-50 text-teal-700'
                    : isDark
                      ? 'text-zinc-500 hover:text-white'
                      : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={handleAddTab}
              aria-label="Add new search tab"
              className={`p-1 rounded-md transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className={`text-[10px] font-medium px-2 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`} aria-live="polite">{displayJobs.length} jobs</span>
        </div>

        {/* SUB HEADER: FILTERS */}
        <div className={`h-auto lg:h-14 border-b flex items-center py-2 lg:py-0 px-3 lg:px-6 flex-shrink-0 ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-1.5 lg:gap-3 w-full lg:w-auto lg:flex-1">
            {/* Status Tabs - Grouped in one background */}
            <div className={`flex items-center rounded-md p-0.5 lg:p-0 lg:gap-3 flex-shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-gray-100 lg:bg-transparent'}`} role="tablist" aria-label="Job status filter">
              <button 
                onClick={() => setViewStatus('new')} 
                role="tab"
                aria-selected={viewStatus === 'new'}
                className={`tab-button h-7 lg:h-9 px-3 lg:px-4 text-[11px] lg:text-xs font-medium capitalize rounded flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  viewStatus === 'new'
                    ? isDark 
                      ? 'bg-white text-zinc-900' 
                      : 'bg-white text-zinc-900 shadow-sm'
                    : isDark 
                      ? 'text-zinc-400 hover:text-white' 
                      : 'text-gray-500 hover:text-gray-700'
                }`}>
                new
              </button>
              <button 
                onClick={() => setViewStatus('saved')} 
                role="tab"
                aria-selected={viewStatus === 'saved'}
                className={`tab-button h-7 lg:h-9 px-3 lg:px-4 text-[11px] lg:text-xs font-medium capitalize rounded flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  viewStatus === 'saved'
                    ? isDark 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-emerald-500 text-white'
                    : isDark 
                      ? 'text-zinc-400 hover:text-white' 
                      : 'text-gray-500 hover:text-gray-700'
                }`}>
                saved
              </button>
              <button 
                onClick={() => setViewStatus('rejected')} 
                role="tab"
                aria-selected={viewStatus === 'rejected'}
                className={`tab-button h-7 lg:h-9 px-3 lg:px-4 text-[11px] lg:text-xs font-medium capitalize rounded flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  viewStatus === 'rejected'
                    ? isDark 
                      ? 'bg-red-500 text-white' 
                      : 'bg-red-500 text-white'
                    : isDark 
                      ? 'text-zinc-400 hover:text-white' 
                      : 'text-gray-500 hover:text-gray-700'
                }`}>
                rejected
              </button>
            </div>

            {/* Divider */}
            <div className={`w-px h-5 lg:hidden flex-shrink-0 ${isDark ? 'bg-zinc-700' : 'bg-gray-300'}`} aria-hidden="true"></div>

            {/* Portal Filter */}
            {uniquePortals.length > 0 && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setPortalDropdownOpen(!portalDropdownOpen); }}
                  aria-haspopup="listbox"
                  aria-expanded={portalDropdownOpen}
                  aria-label={`Filter by portal: ${filterPortal === 'all' ? 'All Portals' : filterPortal}`}
                  className={`flex items-center gap-1 h-7 lg:h-8 px-2.5 lg:px-3 rounded text-[10px] lg:text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  <span>{filterPortal === 'all' ? 'All Portals' : filterPortal}</span>
                  <ChevronDown className={`w-2.5 h-2.5 ${portalDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {portalDropdownOpen && (
                  <ul 
                    className={`absolute left-0 top-full mt-0.5 z-50 min-w-full max-w-[150px] max-h-36 overflow-y-auto rounded shadow-lg ${
                      isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-200'
                    }`}
                    role="listbox"
                    aria-label="Select portal"
                  >
                    <li
                      onClick={() => { setFilterPortal('all'); setPortalDropdownOpen(false); }}
                      role="option"
                      aria-selected={filterPortal === 'all'}
                      className={`px-2 py-1 text-[10px] lg:text-[11px] cursor-pointer ${
                        filterPortal === 'all'
                          ? isDark ? 'bg-teal-600 text-white' : 'bg-teal-500 text-white'
                          : isDark ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}>
                      All Portals
                    </li>
                    {uniquePortals.map(p => (
                      <li
                        key={p}
                        onClick={() => { setFilterPortal(p); setPortalDropdownOpen(false); }}
                        role="option"
                        aria-selected={filterPortal === p}
                        className={`px-2 py-1 text-[10px] lg:text-[11px] cursor-pointer ${
                          filterPortal === p
                            ? isDark ? 'bg-teal-600 text-white' : 'bg-teal-500 text-white'
                            : isDark ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}>
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {/* Location Filter */}
            {uniqueLocations.length > 0 && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setLocationDropdownOpen(!locationDropdownOpen); }}
                  aria-haspopup="listbox"
                  aria-expanded={locationDropdownOpen}
                  aria-label={`Filter by location: ${filterLocation === 'all' ? 'All Locations' : filterLocation}`}
                  className={`flex items-center gap-1 h-7 lg:h-8 px-2.5 lg:px-3 rounded text-[10px] lg:text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  <span>{filterLocation === 'all' ? 'All Locations' : filterLocation}</span>
                  <ChevronDown className={`w-2.5 h-2.5 ${locationDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {locationDropdownOpen && (
                  <ul 
                    className={`absolute right-0 lg:left-0 top-full mt-0.5 z-50 min-w-full max-w-[150px] max-h-36 overflow-y-auto rounded shadow-lg ${
                      isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-200'
                    }`}
                    role="listbox"
                    aria-label="Select location"
                  >
                    <li
                      onClick={() => { setFilterLocation('all'); setLocationDropdownOpen(false); }}
                      role="option"
                      aria-selected={filterLocation === 'all'}
                      className={`px-2 py-1 text-[10px] lg:text-[11px] cursor-pointer ${
                        filterLocation === 'all'
                          ? isDark ? 'bg-teal-600 text-white' : 'bg-teal-500 text-white'
                          : isDark ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}>
                      All Locations
                    </li>
                    {uniqueLocations.map(l => (
                      <li
                        key={l}
                        onClick={() => { setFilterLocation(l); setLocationDropdownOpen(false); }}
                        role="option"
                        aria-selected={filterLocation === l}
                        className={`px-2 py-1 text-[10px] lg:text-[11px] cursor-pointer truncate ${
                          filterLocation === l
                            ? isDark ? 'bg-teal-600 text-white' : 'bg-teal-500 text-white'
                            : isDark ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}>
                        {l}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Desktop Job Count + Fetch Button */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Job Count Badge - shows count based on current tab */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              isDark 
                ? 'bg-zinc-900 border-zinc-800 text-zinc-400' 
                : 'bg-gray-100 border-gray-200 text-gray-600'
            }`}>
              <span className="text-xs font-medium">
                {viewStatus === 'new' ? 'New' : viewStatus === 'saved' ? 'Saved' : 'Rejected'}
              </span>
              <span className={`text-sm font-bold tabular-nums ${
                viewStatus === 'new' 
                  ? isDark ? 'text-teal-400' : 'text-teal-600'
                  : viewStatus === 'saved'
                  ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                  : isDark ? 'text-red-400' : 'text-red-600'
              }`}>
                {displayJobs.length}
              </span>
            </div>
            
            {/* Fetch Button */}
            <button 
              onClick={runScrape} 
              disabled={pipeline?.state === 'running' || actionLoading === 'scrape'}
              aria-busy={pipeline?.state === 'running' || actionLoading === 'scrape'}
              className={`btn-primary px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-white text-black' : 'bg-teal-600 text-white'}`}>
              {(pipeline?.state === 'running' || actionLoading === 'scrape') ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              Fetch Jobs
            </button>
          </div>
        </div>

        {/* LIST AREA */}
        <div id="main-content" className={`flex-1 overflow-y-auto p-0 scrollbar-thin ${isDark ? 'bg-black' : 'bg-white'}`} tabIndex={-1}>
          {/* Show skeleton loading when pipeline is running */}
          {pipeline?.state === 'running' ? (
            <div className={`divide-y ${isDark ? 'divide-zinc-900' : 'divide-gray-100'}`}>
              {/* Show existing jobs if any, followed by skeleton rows */}
              {displayJobs.map(j => (
                <div key={j.id} className={`group flex items-start lg:items-center gap-3 lg:gap-4 p-3 transition-colors border-l-2 border-transparent hover:border-teal-500 ${isDark ? 'hover:bg-zinc-900/40' : 'hover:bg-gray-50'}`}>
                  {/* Icon - Hidden on mobile */}
                  <div className={`hidden lg:flex w-9 h-9 items-center justify-center rounded-lg border transition-colors flex-shrink-0 ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-500 group-hover:border-zinc-700' : 'bg-gray-100 border-gray-200 text-gray-500 group-hover:border-gray-300'}`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  
                  {/* Mobile Layout */}
                  <div className="flex-1 min-w-0 lg:hidden">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-bold truncate ${isDark ? 'text-zinc-200' : 'text-gray-800'}`}>
                          <a href={j.job_url} target="_blank" rel="noopener noreferrer" className="hover:underline">{j.title}</a>
                        </h4>
                        <div className={`text-xs truncate mt-0.5 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>{j.company || 'Unknown Company'}</div>
                       </div>
                       <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border flex-shrink-0 ${j.source_site.includes('linkedin')
                         ? 'border-blue-500/20 text-blue-600 bg-blue-500/5'
                         : isDark ? 'border-zinc-700 text-zinc-500 bg-zinc-800' : 'border-gray-300 text-gray-500 bg-gray-100'}`}>
                         {j.source_site}
                       </span>
                     </div>
                     <div className="flex items-center gap-3 mt-2">
                       <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                         <MapPin className={`w-3 h-3 ${isDark ? 'text-zinc-600' : 'text-gray-400'}`} />
                         <span className="truncate max-w-[120px]">{j.location || 'Location N/A'}</span>
                       </div>
                      {j.is_remote && <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-500 border border-teal-500/20 text-[9px] font-bold uppercase">Remote</span>}
                      <span className={`text-[10px] px-2 py-1 rounded ml-auto ${isDark ? 'bg-teal-900/40 text-teal-400 border border-teal-500/20' : 'bg-teal-50 text-teal-600 border border-teal-200'}`}>
                        <Sparkles className="w-3 h-3 inline mr-1" />New
                      </span>
                    </div>
                  </div>
                  
                  {/* Desktop Content - Compact Grid */}
                  <div className="hidden lg:flex flex-1 min-w-0 grid-cols-12 gap-4 items-center">
                    <div className="col-span-4 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-bold truncate group-hover:text-teal-500 transition-colors ${isDark ? 'text-zinc-200' : 'text-gray-800'}`}>
                          <a href={j.job_url} target="_blank" rel="noopener noreferrer" className="hover:underline">{j.title}</a>
                        </h4>
                        {j.is_remote && <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-500 border border-teal-500/20 text-[9px] font-bold uppercase">Remote</span>}
                      </div>
                      <div className={`text-xs truncate mt-0.5 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>{j.company || 'Unknown Company'}</div>
                    </div>
                    <div className={`col-span-3 flex items-center gap-1.5 text-xs truncate ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                      <MapPin className={`w-3 h-3 ${isDark ? 'text-zinc-600' : 'text-gray-400'}`} />
                      <span className="truncate">{j.location || 'Location N/A'}</span>
                    </div>
                    <div className={`col-span-2 flex items-center gap-1.5 text-xs ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                      <Clock className={`w-3 h-3 ${isDark ? 'text-zinc-700' : 'text-gray-400'}`} />
                      <span title={j.date_posted || 'Recently posted'}>{j.date_posted || 'Recently'}</span>
                    </div>
                    <div className="col-span-3 flex justify-end">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${j.source_site.includes('linkedin')
                        ? 'border-blue-500/20 text-blue-600 bg-blue-500/5'
                        : isDark ? 'border-zinc-700 text-zinc-500 bg-zinc-800' : 'border-gray-300 text-gray-500 bg-gray-100'}`}>
                        {j.source_site}
                      </span>
                    </div>
                  </div>
                  {/* Desktop Mini status indicator for in-progress jobs */}
                  <div className={`hidden lg:flex items-center gap-2 pl-4 border-l ${isDark ? 'border-zinc-900' : 'border-gray-200'}`}>
                    <span className={`text-[10px] px-2 py-1 rounded ${isDark ? 'bg-teal-900/40 text-teal-400 border border-teal-500/20' : 'bg-teal-50 text-teal-600 border border-teal-200'}`}>
                      <Sparkles className="w-3 h-3 inline mr-1" />New
                    </span>
                  </div>
                </div>
              ))}
              {/* Skeleton rows for loading */}
              {[...Array(Math.max(3, 8 - displayJobs.length))].map((_, i) => <SkeletonJobRow key={`skeleton-${i}`} isDark={isDark} />)}
            </div>
          ) : activeTabId.startsWith('new-') ? (
            <EmptyState 
              type="ready-search" 
              isDark={isDark}
              title="Ready to Search"
              description="Configure your search parameters and click Fetch to begin finding jobs"
            />
          ) : displayJobs.length === 0 ? (
            <EmptyState 
              type={viewStatus === 'saved' ? 'no-saved' : viewStatus === 'rejected' ? 'no-rejected' : 'no-jobs'} 
              isDark={isDark}
              title={viewStatus === 'saved' ? 'No Saved Jobs Yet' : viewStatus === 'rejected' ? 'No Rejected Jobs' : 'No Jobs Found'}
              description={
                viewStatus === 'saved' 
                  ? 'Jobs you save will appear here for easy access' 
                  : viewStatus === 'rejected' 
                  ? 'Jobs you decline will be moved here. Your queue is clean!' 
                  : 'Start a new search to discover opportunities'
              }
            />
          ) : (
            <div className={`divide-y stagger-children job-list-container ${isDark ? 'divide-zinc-900' : 'divide-gray-100'}`}>
              {displayJobs.map(j => (
                <JobCard
                  key={j.id}
                  job={j}
                  viewStatus={viewStatus}
                  isDark={isDark}
                  onSave={(id) => updateStatus(id, 'saved')}
                  onReject={(id) => updateStatus(id, 'rejected')}
                  onRestore={(id) => updateStatus(id, 'new')}
                  onDelete={deleteJob}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PROGRESS BAR - Fixed at bottom during job fetching */}
      {pipeline?.state === 'running' && (
        <ProgressBar
          stats={{
            new_jobs: (pipeline.stats?.new_jobs as number) || 0,
            duplicates: (pipeline.stats?.duplicates as number) || 0,
            filtered: (pipeline.stats?.filtered as number) || 0,
            total_queries: (pipeline.stats?.total_queries as number) || 1,
            current_query: (pipeline.stats?.current_query as number) || 0,
            current_site: (pipeline.stats?.current_site as string) || '',
            batch_id: (pipeline.stats?.batch_id as string) || '',
            started_at: (pipeline.stats?.started_at as number) || Date.now(),
          }}
          logs={pipeline.logs}
          isDark={isDark}
        />
      )}

      {/* --- PROFILE MODAL --- */}
      {showProfileModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
        >
          <div 
            ref={profileModalRef}
            tabIndex={-1}
            className={`modal-enter border rounded-xl w-full max-w-lg p-6 shadow-2xl focus-visible:outline-none ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 id="profile-modal-title" className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}><FileText className="w-4 h-4 text-teal-500" /> Candidate Profile</h3>
              <button 
                onClick={() => setShowProfileModal(false)}
                aria-label="Close profile modal"
                className={`p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500`}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} />
              </button>
            </div>
            <label htmlFor="profile-textarea" className="sr-only">Candidate profile text</label>
            <textarea
              id="profile-textarea"
              className={`w-full h-40 border rounded-lg p-3 text-xs outline-none mb-4 font-mono resize-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-black border-zinc-800 text-white focus:border-teal-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-500'}`}
              placeholder="Paste your resume..." value={inputProfile} onChange={e => setInputProfile(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowProfileModal(false)} 
                className={`px-4 py-2 rounded-lg text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-zinc-800 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                Cancel
              </button>
              <button 
                onClick={saveProfile} 
                disabled={actionLoading === 'profile'} 
                aria-busy={actionLoading === 'profile'}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                {actionLoading === 'profile' && <Loader2 className="w-3 h-3 animate-spin" />} Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SETTINGS MODAL --- */}
      {showSettingsModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
        >
          <div 
            ref={settingsModalRef}
            tabIndex={-1}
            className={`modal-enter border rounded-xl w-full max-w-md p-6 shadow-2xl focus-visible:outline-none ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 id="settings-modal-title" className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Settings className="w-5 h-5 text-teal-500" /> App Settings
              </h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                aria-label="Close settings modal"
                className={`p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500`}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} />
              </button>
            </div>
            <div className="space-y-6">
              <div className={`p-4 rounded-lg border flex justify-between items-center ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-50 border-gray-200'}`}>
                <div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Appearance</h4>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                </div>
                <button 
                  onClick={toggleTheme}
                  aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                  className={`p-2 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-zinc-700 text-white border-zinc-600' : 'bg-white text-gray-900 border-gray-300'}`}
                >
                  {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>
              </div>
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-red-950/20 border-red-900/30' : 'bg-red-50 border-red-200'}`}>
                <h4 className="text-sm font-bold text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Danger Zone
                </h4>
                <p className={`text-xs mt-2 mb-3 ${isDark ? 'text-red-400/70' : 'text-red-500/80'}`}>
                  Permanently delete all data including:
                </p>
                <ul className={`text-xs mb-4 space-y-1 ${isDark ? 'text-red-400/60' : 'text-red-500/70'}`}>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-red-500" aria-hidden="true"></span>All saved jobs (new, saved, rejected)</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-red-500" aria-hidden="true"></span>All search tabs and history</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-red-500" aria-hidden="true"></span>All search settings and preferences</li>
                </ul>
                <button 
                  onClick={() => setShowClearConfirmModal(true)} 
                  disabled={clearingData}
                  aria-busy={clearingData}
                  className="w-full px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 flex justify-center items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  {clearingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Clear All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CLEAR CONFIRMATION MODAL --- */}
      {showClearConfirmModal && (
        <div 
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="clear-modal-title"
          aria-describedby="clear-modal-description"
        >
          <div 
            ref={clearConfirmModalRef}
            tabIndex={-1}
            className={`modal-enter border rounded-xl w-full max-w-sm p-6 shadow-2xl focus-visible:outline-none ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}
          >
            <div className="flex flex-col items-center text-center">
              {/* Warning Icon */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-red-950/50' : 'bg-red-100'}`} aria-hidden="true">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>

              <h3 id="clear-modal-title" className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Delete All Data?
              </h3>

              <p id="clear-modal-description" className={`text-sm mb-4 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                This will permanently delete all your jobs, search history, tabs, and settings. This action cannot be undone.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setShowClearConfirmModal(false)}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={clearAllData}
                  disabled={clearingData}
                  aria-busy={clearingData}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors flex justify-center items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  {clearingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}