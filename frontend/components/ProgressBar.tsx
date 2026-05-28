"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Clock, Zap } from "lucide-react";

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

// --- HELPERS ---

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

// --- MAIN COMPONENT ---

export default function ProgressBar({ stats, logs, isDark }: ProgressBarProps) {
  const [elapsed, setElapsed] = useState(0);
  
  // Extract values with defaults
  const newJobs = stats.new_jobs || 0;
  const duplicates = stats.duplicates || 0;
  const currentQuery = stats.current_query || 0;
  const totalQueries = stats.total_queries || 1;
  const sitesStr = stats.current_site || "";
  const startedAt = stats.started_at || Date.now();
  
  // Parse sites
  const sites = sitesStr.split(',').map(s => s.trim()).filter(Boolean);
  
  // Calculate progress percentage
  const progress = totalQueries > 0 ? Math.round((currentQuery / totalQueries) * 100) : 0;
  
  // Calculate elapsed and estimated time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - startedAt;
      setElapsed(elapsedMs / 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  
  // Estimate remaining time based on progress
  const estimatedTotal = progress > 0 ? (elapsed / progress) * 100 : 0;
  const remaining = Math.max(0, estimatedTotal - elapsed);
  
  // Determine status message
  const getStatusMessage = () => {
    if (currentQuery === 0) return "Initializing search...";
    if (progress < 100) return `Searching across ${sites.length} platform${sites.length !== 1 ? 's' : ''}...`;
    return "Finalizing results...";
  };

  return (
    <output 
      className={`fixed bottom-0 left-0 right-0 z-[100] ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border-t shadow-lg`}
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Content */}
      <div className="px-4 py-3">
        {/* Row 1: Status + Stats */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Spinner + Text */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-teal-500/20' : 'bg-teal-100'}`}>
              <Loader2 className={`w-4 h-4 animate-spin ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
            </div>
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {getStatusMessage()}
              </p>
              <div className="flex items-center gap-3">
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                  Query {currentQuery} of {totalQueries}
                </p>
                {elapsed > 0 && (
                  <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                    <Clock className="w-3 h-3" />
                    {formatTime(elapsed)} elapsed
                  </p>
                )}
                {progress > 10 && progress < 100 && (
                  <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                    <Zap className="w-3 h-3" />
                    ~{formatTime(remaining)} left
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="flex items-center gap-4">
            {/* Sites */}
            {sites.length > 0 && (
              <div className="hidden md:flex items-center gap-1.5">
                {sites.map(site => (
                  <span 
                    key={site}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                      isDark 
                        ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {site.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
            
            {/* New Jobs Count */}
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                {newJobs}
              </span>
              <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                found
              </span>
            </div>
            
            {/* Duplicates */}
            {duplicates > 0 && (
              <div className="flex items-baseline gap-1">
                <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                  +{duplicates}
                </span>
                <span className={`text-xs ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>
                  dup
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Progress Bar */}
        <div className="mt-3 flex items-center gap-3">
          <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${isDark ? 'bg-teal-500' : 'bg-teal-600'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={`text-xs font-medium w-8 text-right ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
            {progress}%
          </span>
        </div>
      </div>
    </output>
  );
}
