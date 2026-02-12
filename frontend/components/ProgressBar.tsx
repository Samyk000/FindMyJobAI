"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Linkedin, Briefcase, Globe, Zap } from "lucide-react";

// --- TYPES ---

export type ProgressStats = {
  new_jobs?: number;
  duplicates?: number;
  filtered?: number;
  total_queries?: number;
  current_query?: number;
  current_site?: string;
  batch_id?: string;
  started_at?: number;
};

type ProgressBarProps = {
  stats: ProgressStats;
  logs: string[];
  isDark: boolean;
};

// --- HELPER FUNCTIONS ---

function getSiteIcon(site: string | undefined, isDark: boolean) {
  const siteName = site?.toLowerCase() || "";
  const iconClass = "w-3.5 h-3.5";
  
  if (siteName.includes("linkedin")) {
    return <Linkedin className={`${iconClass} text-blue-500`} />;
  }
  if (siteName.includes("indeed")) {
    return <Briefcase className={`${iconClass} text-purple-500`} />;
  }
  if (siteName.includes("glassdoor")) {
    return <Globe className={`${iconClass} text-green-500`} />;
  }
  return <Zap className={`${iconClass} ${isDark ? 'text-zinc-400' : 'text-gray-500'}`} />;
}

function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `~${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `~${minutes}m ${secs}s`;
}

function extractSiteFromLog(log: string): string | null {
  const sitePatterns = [
    { pattern: /linkedin/i, name: "LinkedIn" },
    { pattern: /indeed/i, name: "Indeed" },
    { pattern: /glassdoor/i, name: "Glassdoor" },
    { pattern: /zip.?recruiter/i, name: "ZipRecruiter" },
  ];
  
  for (const { pattern, name } of sitePatterns) {
    if (pattern.test(log)) {
      return name;
    }
  }
  return null;
}

// --- COMPONENT ---

export default function ProgressBar({ stats, logs, isDark }: ProgressBarProps) {
  // State to store current time, updated via interval only
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  
  // Update time via interval callback (async, not sync in effect body)
  useEffect(() => {
    // Update every second via interval callback
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Calculate progress percentage
  const progress = useMemo(() => {
    const total = stats.total_queries || 1;
    const current = stats.current_query || 0;
    return Math.min(100, Math.round((current / total) * 100));
  }, [stats.total_queries, stats.current_query]);

  // Calculate estimated time remaining
  const timeRemaining = useMemo(() => {
    if (!stats.started_at || !stats.current_query || currentTime === null) return null;
    
    const elapsed = (currentTime - stats.started_at) / 1000; // seconds
    const queriesCompleted = stats.current_query || 1;
    const totalQueries = stats.total_queries || 1;
    
    if (queriesCompleted === 0) return null;
    
    const avgTimePerQuery = elapsed / queriesCompleted;
    const remainingQueries = totalQueries - queriesCompleted;
    const estimatedSeconds = avgTimePerQuery * remainingQueries;
    
    return formatTimeRemaining(estimatedSeconds);
  }, [currentTime, stats.started_at, stats.current_query, stats.total_queries]);

  // Get current action text
  const currentAction = useMemo(() => {
    const lastLog = logs[logs.length - 1] || "";
    const site = stats.current_site || extractSiteFromLog(lastLog);
    
    if (site) {
      return `Scraping ${site}...`;
    }
    
    // Extract meaningful action from log
    if (lastLog.toLowerCase().includes("query")) {
      return "Processing queries...";
    }
    if (lastLog.toLowerCase().includes("init")) {
      return "Initializing...";
    }
    
    return "Fetching jobs...";
  }, [logs, stats.current_site]);

  // Get current site for icon
  const currentSite = useMemo(() => {
    const lastLog = logs[logs.length - 1] || "";
    return stats.current_site || extractSiteFromLog(lastLog) || "";
  }, [logs, stats.current_site]);

  // Calculate counts
  const newJobs = stats.new_jobs || 0;
  const skipped = stats.duplicates || 0;
  const filtered = stats.filtered || 0;
  const total = newJobs + skipped + filtered;
  const currentQuery = stats.current_query || 0;
  const totalQueries = stats.total_queries || 0;

  return (
    <div 
      className={`progress-bar-enter border-t ${isDark ? 'bg-zinc-900/95 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}
      role="status"
      aria-live="polite"
      aria-label="Job fetching progress"
    >
      {/* Main Progress Row */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Current Action */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Animated Indicator */}
            <div className="relative flex-shrink-0">
              <div className={`w-2 h-2 rounded-full animate-ping absolute ${isDark ? 'bg-teal-400' : 'bg-teal-500'}`}></div>
              <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-teal-400' : 'bg-teal-500'}`}></div>
            </div>
            
            {/* Site Icon */}
            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
              isDark ? 'bg-zinc-800' : 'bg-gray-200'
            }`}>
              {getSiteIcon(currentSite, isDark)}
            </div>
            
            {/* Action Text */}
            <span className={`text-xs font-medium truncate ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
              {currentAction}
            </span>
          </div>

          {/* Right: Progress Count */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs font-bold tabular-nums ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
              {currentQuery}
            </span>
            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>/</span>
            <span className={`text-xs font-medium tabular-nums ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              {totalQueries}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`h-1 w-full rounded-full mt-3 overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}>
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${progress}%`,
              background: isDark 
                ? 'linear-gradient(90deg, #14b8a6, #2dd4bf, #14b8a6)'
                : 'linear-gradient(90deg, #0d9488, #14b8a6, #0d9488)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className={`px-4 pb-3 pt-0`}>
        <div className={`flex items-center gap-2 text-[10px]`}>
          {/* New Jobs */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded ${
            isDark ? 'bg-teal-500/10' : 'bg-teal-50'
          }`}>
            <span className={`font-bold tabular-nums ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
              {newJobs}
            </span>
            <span className={isDark ? 'text-teal-500/70' : 'text-teal-500'}>new</span>
          </div>

          {/* Skipped */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded ${
            isDark ? 'bg-zinc-800' : 'bg-gray-100'
          }`}>
            <span className={`font-bold tabular-nums ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              {skipped}
            </span>
            <span className={isDark ? 'text-zinc-500' : 'text-gray-500'}>skipped</span>
          </div>

          {/* Filtered */}
          {filtered > 0 && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${
              isDark ? 'bg-zinc-800' : 'bg-gray-100'
            }`}>
              <span className={`font-bold tabular-nums ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                {filtered}
              </span>
              <span className={isDark ? 'text-zinc-500' : 'text-gray-500'}>filtered</span>
            </div>
          )}

          {/* Time Remaining */}
          {timeRemaining && (
            <>
              <div className={`w-px h-3 ${isDark ? 'bg-zinc-700' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                isDark ? 'bg-zinc-800' : 'bg-gray-100'
              }`}>
                <span className={isDark ? 'text-zinc-400' : 'text-gray-600'}>
                  {timeRemaining}
                </span>
                <span className={isDark ? 'text-zinc-500' : 'text-gray-500'}>left</span>
              </div>
            </>
          )}

          {/* Total */}
          <div className={`ml-auto flex items-center gap-1 px-2 py-1 rounded ${
            isDark ? 'bg-zinc-800/50' : 'bg-gray-50'
          }`}>
            <span className={`font-bold tabular-nums ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
              {total}
            </span>
            <span className={isDark ? 'text-zinc-500' : 'text-gray-500'}>total</span>
          </div>
        </div>
      </div>
    </div>
  );
}
