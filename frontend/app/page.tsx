"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";

// Types
import { JobRow, SettingsModel, SearchTab, PipelineStatus, ThemeMode } from "@/types";

// Constants
import { DEFAULT_TABS, REQUEST_TIMEOUT, CACHE_TTL } from "@/lib/constants";
import { CONFIG } from "@/lib/config";

// Utils
import { 
  loadThemeFromStorage, 
  saveThemeToStorage, 
  loadTabsFromStorage, 
  saveTabsToStorage,
  fetchWithError
} from "@/lib/utils";

// Components - Dynamic imports for code splitting
const MobileNav = dynamic(() => import("../components/MobileNav"), { ssr: false });
const EmptyState = dynamic(() => import("../components/EmptyState"), { ssr: false });
const ProgressBar = dynamic(() => import("../components/ProgressBar"), { ssr: false });

// Static imports for components used in every render
import ErrorToast from "../components/ErrorToast";
import LoadingScreen from "../components/LoadingScreen";
import SettingsModal from "../components/SettingsModal";
import ClearConfirmModal from "../components/ClearConfirmModal";
import DesktopSidebar from "../components/DesktopSidebar";
import TabsBar, { MobileHeader } from "../components/TabsBar";
import FilterBar from "../components/FilterBar";
import JobList from "../components/JobList";

// --- MAIN PAGE COMPONENT ---

export default function Page() {
  const BACKEND = CONFIG.API_BASE_URL;

  // -- STATE --
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
  const [inputKeywordsInc, setInputKeywordsInc] = useState("");
  const [inputKeywordsExc, setInputKeywordsExc] = useState("");

  // Multi-select filters: empty array means "all" selected
  const [filterPortal, setFilterPortal] = useState<string[]>([]);
  const [filterLocation, setFilterLocation] = useState<string[]>([]);
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [viewStatus, setViewStatus] = useState<"new" | "saved" | "rejected">("new");

  const [pipeline, setPipeline] = useState<PipelineStatus | null>(null);
  const [pipelineJobId, setPipelineJobId] = useState<string>("");
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [fetchingTabId, setFetchingTabId] = useState<string | null>(null);  // Track which tab initiated fetch
  
  // New job tracking for highlights and notifications
  const [newJobIds, setNewJobIds] = useState<Set<string>>(new Set());  // Newly fetched job IDs for highlighting
  const [notification, setNotification] = useState<string | null>(null);  // Toast notification for new jobs
  const lastFetchTimeRef = useRef<number>(0);  // Rate limiting for fetch clicks

  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    return loadThemeFromStorage();
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearingData, setClearingData] = useState(false);

  // Mobile state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Request cache ref
  const requestCacheRef = useRef<Map<string, { data: unknown; timestamp: number }>>(new Map());

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
  }, [showClearConfirmModal, showSettingsModal, isMobileMenuOpen, portalDropdownOpen, locationDropdownOpen]);

  // Sync inputs with active tab
  useEffect(() => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab?.query) {
      setInputTitle(tab.query.title || "");
      setInputLocation(tab.query.location || "");
      setInputCountry(tab.query.country || "india");
      setInputKeywordsInc(tab.query.keywordsInc || "");
      setInputKeywordsExc(tab.query.keywordsExc || "");
    } else if (tab?.type === 'new') {
      setInputTitle("");
      setInputLocation("");
      setInputKeywordsInc("");
      setInputKeywordsExc("");
    }
  }, [activeTabId, tabs]);

  // Fetch wrapper with caching
  const fetchWithErrorCallback = useCallback(async (url: string, options?: RequestInit) => {
    return fetchWithError(url, options, requestCacheRef.current, CACHE_TTL, REQUEST_TIMEOUT);
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await fetchWithErrorCallback(`${BACKEND}/settings`) as SettingsModel;
      setSettings(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      return null;
    }
  }, [BACKEND, fetchWithErrorCallback]);

  const fetchJobs = useCallback(async (options?: { 
    batchId?: string; 
    merge?: boolean;
    showNotification?: boolean;  // Whether to show notification for new jobs
  }) => {
    const { batchId, merge = false, showNotification = false } = options || {};
    try {
      const data = await fetchWithErrorCallback(`${BACKEND}/jobs/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: viewStatus === 'new' ? 'active' : viewStatus,
          limit: 500,
          batch_id: batchId || undefined
        }),
      }) as { jobs: JobRow[] };
      
      const fetchedJobs = data.jobs || [];
      
      if (merge) {
        // Calculate new jobs BEFORE updating state
        let newJobsCount = 0;
        let newJobIdList: string[] = [];
        
        setJobs(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          const newJobs = fetchedJobs.filter(j => !existingIds.has(j.id));
          newJobsCount = newJobs.length;
          newJobIdList = newJobs.map(j => j.id);
          
          // Merge and sort by date (newest first)
          return [...newJobs, ...prev].sort((a, b) => {
            const dateA = a.date_posted ? new Date(a.date_posted).getTime() : 0;
            const dateB = b.date_posted ? new Date(b.date_posted).getTime() : 0;
            return dateB - dateA;
          });
        });
        
        // Handle notification and highlighting AFTER state update (in next tick)
        if (newJobsCount > 0) {
          // Use requestAnimationFrame to ensure state is updated
          requestAnimationFrame(() => {
            // Set new job IDs for highlighting
            setNewJobIds(new Set(newJobIdList));
            
            // Show notification if requested
            if (showNotification) {
              setNotification(`${newJobsCount} new job${newJobsCount > 1 ? 's' : ''} found!`);
              setTimeout(() => setNotification(null), 3000);
            }
            
            // Clear highlight after 3 seconds
            setTimeout(() => setNewJobIds(new Set()), 3000);
          });
        }
      } else {
        setJobs(fetchedJobs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    }
  }, [BACKEND, fetchWithErrorCallback, viewStatus]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (!isLoading) fetchJobs(); }, [viewStatus, isLoading, fetchJobs]);

  useEffect(() => {
    if (!settings) return;
    const validSites = Array.isArray(settings.sites) ? settings.sites : (typeof settings.sites === 'string' ? (settings.sites as string).split(',') : []);
    setInputSites(validSites.length > 0 ? validSites : []);
    setInputLimit(settings.results_per_site || 20);
    setInputHours(settings.hours_old || 72);
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
    // Reset multi-select filters when switching tabs
    setFilterPortal([]);
    setFilterLocation([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId]);

  const handleSearchComplete = useCallback((batchId: string) => {
    // Track batch IDs per tab to preserve job history when re-fetching
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        const titles = inputTitle.split(',').map(s => s.trim()).filter(Boolean);
        let tabLabel = titles[0] || "Results";
        if (tabLabel.length > 18) tabLabel = tabLabel.substring(0, 15) + '...';
        if (titles.length > 1) tabLabel += ` +${titles.length - 1}`;
        
        // If this is already a result tab, add the new batch ID to the list
        if (t.type === 'result') {
          const existingBatchIds = t.batchIds || [t.id]; // Include original tab ID
          return {
            ...t,
            label: tabLabel, // Update label with new search
            batchIds: [...existingBatchIds, batchId] // Add new batch ID
          };
        }
        
        // For new tabs, create with batch ID tracking
        return {
          id: batchId,
          label: tabLabel,
          type: 'result',
          query: t.query,
          batchIds: [batchId]
        };
      }
      return t;
    }));
    // Only update activeTabId if it was a new tab (not already a result tab)
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab?.type !== 'result') {
      setActiveTabId(batchId);
    }
  }, [activeTabId, inputTitle, tabs]);

  useEffect(() => {
    if (!pipelineJobId) return;
    const tick = setInterval(async () => {
      try {
        const data = await fetchWithErrorCallback(`${BACKEND}/logs/${pipelineJobId}`) as PipelineStatus;
        setPipeline(data);
        if (data.state === "running" && data.stats?.batch_id) {
          setCurrentBatchId(data.stats.batch_id as string);
          // Fetch ALL jobs in merge mode during polling (not just current batch)
          // This ensures other tabs show their jobs while fetching
          await fetchJobs({ merge: true });
        }
        if (data.state === "done" || data.state === "failed") {
          setPipelineJobId("");
          setCurrentBatchId(null);
          setFetchingTabId(null);  // Clear fetching tab when done
          if (data.state === "done" && data.stats?.batch_id) {
            handleSearchComplete(data.stats.batch_id as string);
          }
          if (data.state === "failed") setError("Job search failed. Check console.");
          // Final fetch to get all jobs including the just-completed batch
          // Show notification for any new jobs found
          await fetchJobs({ merge: true, showNotification: true });
        }
      } catch { 
        // Silently handle polling errors
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [pipelineJobId, BACKEND, fetchWithErrorCallback, fetchJobs, handleSearchComplete]);

  // -- ACTIONS --

  function toggleTheme() {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }

  async function clearAllData() {
    setClearingData(true);
    setShowClearConfirmModal(false);
    setShowSettingsModal(false);
    try {
      await fetchWithErrorCallback(`${BACKEND}/jobs/clear-all?reset_settings=true`, { method: "DELETE" });
      localStorage.removeItem('job-bot-tabs');
      localStorage.removeItem('job-bot-active-tab');
      setTabs(DEFAULT_TABS);
      setActiveTabId('all');
      setJobs([]);
      setInputTitle("");
      setInputLocation("");
      setInputKeywordsInc("");
      setInputKeywordsExc("");
      setPipeline(null);
      setPipelineJobId("");
      setCurrentBatchId(null);
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

  async function runScrape() {
    if (!inputTitle.trim()) { setError("Enter a job title"); return; }
    if (!inputLocation.trim()) { setError("Enter a location"); return; }
    if (inputSites.length === 0) { setError("Select a platform"); return; }
    
    // Rate limiting: Prevent rapid clicks (5 second minimum between fetches)
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    if (timeSinceLastFetch < 5000 && lastFetchTimeRef.current > 0) {
      const waitTime = Math.ceil((5000 - timeSinceLastFetch) / 1000);
      setError(`Please wait ${waitTime} second${waitTime > 1 ? 's' : ''} before fetching again`);
      return;
    }
    lastFetchTimeRef.current = now;

    // Track which tab initiated this fetch
    const tabIdThatInitiatedFetch = activeTabId;
    setFetchingTabId(tabIdThatInitiatedFetch);

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
              keywordsExc: inputKeywordsExc
            }
          };
        }
        return t;
      }));
    }

    setActionLoading('scrape');
    try {
      await fetchWithErrorCallback(`${BACKEND}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titles: inputTitle, locations: inputLocation, country: inputCountry,
          sites: inputSites, results_per_site: inputLimit, hours_old: inputHours,
          include_keywords: inputKeywordsInc, exclude_keywords: inputKeywordsExc
        }),
      });
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
      const data = await fetchWithErrorCallback(`${BACKEND}/run/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titles: inputTitle, locations: inputLocation, country: inputCountry, hours_old: inputHours }),
      }) as { job_id: string };
      setPipelineJobId(data.job_id);
    } catch (err) {
      setPipeline({ state: "failed", logs: ["Failed."], stats: {} });
      setFetchingTabId(null);  // Clear on error
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
      await fetchWithErrorCallback(`${BACKEND}/jobs/${id}`, {
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
    try { await fetchWithErrorCallback(`${BACKEND}/jobs/${id}`, { method: "DELETE" }); }
    catch (err) { setJobs(old); setError(err instanceof Error ? err.message : 'Delete failed'); }
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

    // Get the current tab to check for batch IDs
    const currentTab = tabs.find(t => t.id === activeTabId);
    const tabBatchIds = currentTab?.batchIds || (currentTab?.type === 'result' ? [activeTabId] : null);

    return jobs.filter(j => {
      if (viewStatus === 'new' && j.status !== 'new') return false;
      if (viewStatus === 'saved' && j.status !== 'saved') return false;
      if (viewStatus === 'rejected' && j.status !== 'rejected') return false;
      // For result tabs, check if job's batch_id is in the tab's batch IDs list
      if (activeTabId !== 'all' && tabBatchIds && !tabBatchIds.includes(j.batch_id)) return false;
      return true;
    });
  }, [jobs, viewStatus, activeTabId, pipeline?.state, currentBatchId, tabs]);

  const uniquePortals = useMemo(() => Array.from(new Set(baseJobs.map(j => j.source_site).filter(Boolean))).sort(), [baseJobs]);
  const uniqueLocations = useMemo(() => Array.from(new Set(baseJobs.map(j => j.location).filter(Boolean))).sort(), [baseJobs]);

  // Multi-select filter logic: empty array means "all" selected (no filter)
  const displayJobs = useMemo(() => {
    return baseJobs.filter(j => {
      // If filters are empty, show all; otherwise only show matching items
      if (filterPortal.length > 0 && !filterPortal.includes(j.source_site)) return false;
      if (filterLocation.length > 0 && !filterLocation.includes(j.location)) return false;
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
    <>
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
        inputKeywordsInc={inputKeywordsInc}
        setInputKeywordsInc={setInputKeywordsInc}
        inputKeywordsExc={inputKeywordsExc}
        setInputKeywordsExc={setInputKeywordsExc}
        onFetch={runScrape}
        isFetching={pipeline?.state === 'running' || actionLoading === 'scrape'}
        showMoreOptions={showMoreOptions}
        setShowMoreOptions={setShowMoreOptions}
        jobCount={displayJobs.length}
        viewStatus={viewStatus}
      />

      {/* --- MOBILE HEADER --- */}
      <MobileHeader 
        isDark={isDark}
        onMenuOpen={() => setIsMobileMenuOpen(true)}
        onSettingsOpen={() => setShowSettingsModal(true)}
      />

      {/* --- SIDEBAR (Desktop Only) --- */}
      <DesktopSidebar
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
        inputKeywordsInc={inputKeywordsInc}
        setInputKeywordsInc={setInputKeywordsInc}
        inputKeywordsExc={inputKeywordsExc}
        setInputKeywordsExc={setInputKeywordsExc}
        showMoreOptions={showMoreOptions}
        setShowMoreOptions={setShowMoreOptions}
      />

      {/* --- MAIN AREA --- */}
      <div className={`flex-1 flex flex-col min-w-0 pt-14 lg:pt-0 ${isDark ? 'bg-zinc-950' : 'bg-gray-100'}`}>

        {/* HEADER: TABS (Desktop Only) */}
        <TabsBar
          isDark={isDark}
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={setActiveTabId}
          onAddTab={handleAddTab}
          onCloseTab={handleCloseTab}
          onOpenSettings={() => setShowSettingsModal(true)}
        />

        {/* MOBILE TABS */}
        <TabsBar
          isDark={isDark}
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={setActiveTabId}
          onAddTab={handleAddTab}
          onCloseTab={handleCloseTab}
          onOpenSettings={() => setShowSettingsModal(true)}
          isMobile={true}
          jobCount={displayJobs.length}
        />

        {/* SUB HEADER: FILTERS */}
        <FilterBar
          isDark={isDark}
          viewStatus={viewStatus}
          setViewStatus={setViewStatus}
          filterPortal={filterPortal}
          setFilterPortal={setFilterPortal}
          filterLocation={filterLocation}
          setFilterLocation={setFilterLocation}
          portalDropdownOpen={portalDropdownOpen}
          setPortalDropdownOpen={setPortalDropdownOpen}
          locationDropdownOpen={locationDropdownOpen}
          setLocationDropdownOpen={setLocationDropdownOpen}
          uniquePortals={uniquePortals}
          uniqueLocations={uniqueLocations}
          displayJobsCount={displayJobs.length}
          isFetching={pipeline?.state === 'running' || actionLoading === 'scrape'}
          onFetch={runScrape}
        />

        {/* LIST AREA */}
        <div id="main-content" className={`flex-1 overflow-y-auto p-0 scrollbar-thin ${isDark ? 'bg-black' : 'bg-white'}`} tabIndex={-1}>
          <JobList
            isDark={isDark}
            displayJobs={displayJobs}
            viewStatus={viewStatus}
            activeTabId={activeTabId}
            isPipelineRunning={pipeline?.state === 'running'}
            fetchingTabId={fetchingTabId}
            newJobIds={newJobIds}
            notification={notification}
            onSave={(id) => updateStatus(id, 'saved')}
            onReject={(id) => updateStatus(id, 'rejected')}
            onRestore={(id) => updateStatus(id, 'new')}
            onDelete={deleteJob}
          />
        </div>
      </div>

      {/* --- SETTINGS MODAL --- */}
      <SettingsModal
        isOpen={showSettingsModal}
        isDark={isDark}
        onClose={() => setShowSettingsModal(false)}
        onToggleTheme={toggleTheme}
        onClearData={clearAllData}
        onShowClearConfirm={() => setShowClearConfirmModal(true)}
        clearingData={clearingData}
      />

      {/* --- CLEAR CONFIRMATION MODAL --- */}
      <ClearConfirmModal
        isOpen={showClearConfirmModal}
        isDark={isDark}
        onClose={() => setShowClearConfirmModal(false)}
        onConfirm={clearAllData}
        clearingData={clearingData}
      />
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
    </>
  );
}
