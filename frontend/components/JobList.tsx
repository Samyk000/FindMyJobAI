"use client";

import React from "react";
import { MapPin, Clock, Building2, Sparkles, Loader2, Search } from "lucide-react";
import dynamic from "next/dynamic";
import { JobRow } from '@/types';
import SkeletonJobRow from './SkeletonJobRow';
import { openUrl } from '@/lib/tauri';

// Dynamic imports
const EmptyState = dynamic(() => import("./EmptyState"), { ssr: false });
const JobCard = dynamic(() => import("./JobCard"), { ssr: false });

interface JobListProps {
  isDark: boolean;
  displayJobs: JobRow[];
  viewStatus: "new" | "saved" | "rejected";
  activeTabId: string;
  isPipelineRunning: boolean;
  fetchingTabId: string | null;  // ID of the tab that initiated the fetch
  newJobIds: Set<string>;  // Set of newly fetched job IDs for highlighting
  notification: string | null;  // Toast notification message
  onJobClick: (id: string) => void;  // Open job detail modal
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
  fetchingTabId,
  newJobIds,
  notification,
  onJobClick,
  onSave,
  onReject,
  onRestore,
  onDelete
}: JobListProps) {
  // Show skeleton loading ONLY on the tab that initiated the fetch AND has no existing jobs
  // Other tabs (including "All History", Saved, Rejected) should show their content normally
  const isFetchingOnCurrentTab = isPipelineRunning && 
    fetchingTabId === activeTabId && 
    viewStatus === 'new';
  
  // Only show skeleton if fetching on current tab AND no existing jobs
  const showSkeleton = isFetchingOnCurrentTab && displayJobs.length === 0;
  
  // Show "loading more" indicator if fetching on current tab but jobs already exist
  const showLoadingMore = isFetchingOnCurrentTab && displayJobs.length > 0;

  // Show empty state for new tab with no search yet
  if (activeTabId.startsWith('new-') && !isFetchingOnCurrentTab) {
    return (
      <EmptyState 
        type="ready-search" 
        isDark={isDark}
        title="Ready to Search"
        description="Configure your search parameters and click Fetch to begin finding jobs"
      />
    );
  }

  // Show skeleton only when fetching with no existing jobs
  if (showSkeleton) {
    return (
      <div className={`divide-y ${isDark ? 'divide-zinc-900' : 'divide-gray-100'}`}>
        {[...Array(8)].map((_, i) => <SkeletonJobRow key={`skeleton-${i}`} isDark={isDark} />)}
      </div>
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

  // Show job list with optional loading indicator and notification
  return (
    <>
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-top-2 ${
          isDark 
            ? 'bg-teal-900/90 border-teal-700 text-teal-100' 
            : 'bg-teal-50 border-teal-200 text-teal-800'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-500" />
            <span className="font-medium">{notification}</span>
          </div>
        </div>
      )}
      
      <div className={`divide-y stagger-children job-list-container ${isDark ? 'divide-zinc-900' : 'divide-gray-100'}`}>
        {/* Loading more indicator at the top */}
        {showLoadingMore && (
          <div className={`wave-bar mx-2 mt-2 mb-1 rounded-xl px-4 py-3 ${isDark ? 'bg-zinc-900/90' : 'bg-gray-50'}`}>
            <div className="relative z-10 flex items-center justify-center gap-3">
              <Loader2 className={`w-4 h-4 animate-spin ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                Scanning for new jobs...
              </span>
              <span className={`text-xs font-medium ml-4 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                {displayJobs.length} found
              </span>
            </div>
          </div>
        )}
        
        {displayJobs.map(j => {
          const isNewJob = newJobIds.has(j.id);
          return (
            <JobCard
              key={j.id}
              job={j}
              viewStatus={viewStatus}
              isDark={isDark}
              isNewJob={isNewJob}
              onJobClick={onJobClick}
              onSave={onSave}
              onReject={onReject}
              onRestore={onRestore}
              onDelete={onDelete}
            />
          );
        })}
      </div>
    </>
  );
}
