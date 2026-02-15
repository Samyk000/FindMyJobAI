"use client";

import React from "react";
import { MapPin, Clock, Building2, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { JobRow } from '@/types';
import SkeletonJobRow from './SkeletonJobRow';

// Dynamic imports
const EmptyState = dynamic(() => import("./EmptyState"), { ssr: false });
const JobCard = dynamic(() => import("./JobCard"), { ssr: false });

interface JobListProps {
  isDark: boolean;
  displayJobs: JobRow[];
  viewStatus: "new" | "saved" | "rejected";
  activeTabId: string;
  isPipelineRunning: boolean;
  onSave: (id: string) => void;
  onReject: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function JobList({
  isDark,
  displayJobs,
  viewStatus,
  activeTabId,
  isPipelineRunning,
  onSave,
  onReject,
  onRestore,
  onDelete
}: JobListProps) {
  // Show skeleton loading when pipeline is running
  if (isPipelineRunning) {
    return (
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
    );
  }

  // Show empty state for new tab with no search yet
  if (activeTabId.startsWith('new-')) {
    return (
      <EmptyState 
        type="ready-search" 
        isDark={isDark}
        title="Ready to Search"
        description="Configure your search parameters and click Fetch to begin finding jobs"
      />
    );
  }

  // Show empty state for no jobs
  if (displayJobs.length === 0) {
    return (
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
    );
  }

  // Show job list
  return (
    <div className={`divide-y stagger-children job-list-container ${isDark ? 'divide-zinc-900' : 'divide-gray-100'}`}>
      {displayJobs.map(j => (
        <JobCard
          key={j.id}
          job={j}
          viewStatus={viewStatus}
          isDark={isDark}
          onSave={onSave}
          onReject={onReject}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
