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
  isDark: boolean;
};

// --- MAIN COMPONENT ---

export default function ProgressBar({ stats, isDark }: ProgressBarProps) {
  const newJobs = stats.new_jobs || 0;
  const duplicates = stats.duplicates || 0;
  const currentQuery = stats.current_query || 0;
  const totalQueries = stats.total_queries || 1;
  const sitesStr = stats.current_site || "";
  
  const sites = sitesStr.split(',').map(s => s.trim()).filter(Boolean);
  const progress = totalQueries > 0 ? Math.round((currentQuery / totalQueries) * 100) : 0;
  
  const getStatusMessage = () => {
    if (currentQuery === 0) return "Initializing search...";
    if (progress < 100) return `Searching across ${sites.length} platform${sites.length !== 1 ? 's' : ''}...`;
    return "Finalizing results...";
  };

  return (
    <output 
      className={`fixed bottom-0 left-0 right-0 z-[100] ${isDark ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-gray-200'} border-t backdrop-blur-sm`}
      role="status"
      aria-atomic="true"
    >
      <div className="px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Loader2 className={`w-3.5 h-3.5 animate-spin flex-shrink-0 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-xs font-medium truncate ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                {getStatusMessage()}
              </span>
              <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                {currentQuery}/{totalQueries}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {sites.length > 0 && (
              <div className="hidden md:flex items-center gap-1">
                {sites.map(site => (
                  <span 
                    key={site}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-medium capitalize ${
                      isDark 
                        ? 'bg-zinc-800 text-zinc-400' 
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {site.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex items-baseline gap-1">
              <span className={`text-lg font-bold tabular-nums ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                {newJobs}
              </span>
              <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                found
              </span>
            </div>
            
            {duplicates > 0 && (
              <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                +{duplicates} dup
              </span>
            )}
          </div>
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <div className={`flex-1 h-1 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${isDark ? 'bg-teal-500' : 'bg-teal-600'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={`text-[10px] font-medium tabular-nums w-7 text-right ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
            {progress}%
          </span>
        </div>
      </div>
    </output>
  );
}
