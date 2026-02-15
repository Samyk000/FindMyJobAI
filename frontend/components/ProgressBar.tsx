"use client";

import React from "react";
import { Loader2 } from "lucide-react";

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

// --- MAIN COMPONENT ---

export default function ProgressBar({ stats, logs, isDark }: ProgressBarProps) {
  // Extract values with defaults
  const newJobs = stats.new_jobs || 0;
  const duplicates = stats.duplicates || 0;
  const currentQuery = stats.current_query || 0;
  const totalQueries = stats.total_queries || 1;
  const sitesStr = stats.current_site || "";
  
  // Parse sites
  const sites = sitesStr.split(',').map(s => s.trim()).filter(Boolean);
  
  // Calculate progress percentage
  const progress = totalQueries > 0 ? Math.round((currentQuery / totalQueries) * 100) : 0;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-[100] ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'} border-t shadow-lg`}
      role="status"
      aria-live="polite"
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
                Searching jobs...
              </p>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                {currentQuery} of {totalQueries} queries
              </p>
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
    </div>
  );
}
