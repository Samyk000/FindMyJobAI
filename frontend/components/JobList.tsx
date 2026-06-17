"use client";

import React from "react";
import dynamic from "next/dynamic";
import { JobRow } from '@/types';
import SkeletonJobRow from './SkeletonJobRow';

// Dynamic imports
const EmptyState = dynamic(() => import("./EmptyState"), { ssr: false });
const JobCard = dynamic(() => import("./JobCard"), { ssr: false });

// Number of skeleton rows shown at the very top before the first job arrives.
const INITIAL_SKELETON_ROWS = 8;
// Number of skeleton placeholder rows kept below the live results while a fetch
// is still running, representing jobs that are still being fetched.
const TRAILING_SKELETON_ROWS = 4;

interface JobListProps {
  isDark: boolean;
  displayJobs: JobRow[];
  viewStatus: "new" | "saved" | "rejected";
  activeTabId: string;
  isPipelineRunning: boolean;
  fetchingTabId: string | null;
  newJobIds: Set<string>;
  onJobClick: (id: string) => void;
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
  onJobClick,
  onSave,
  onReject,
  onRestore,
  onDelete
}: JobListProps) {
  const isFetchingOnCurrentTab = isPipelineRunning && 
    fetchingTabId === activeTabId && 
    viewStatus === 'new';
  
  const showSkeleton = isFetchingOnCurrentTab && displayJobs.length === 0;
  const showLoadingMore = isFetchingOnCurrentTab && displayJobs.length > 0;

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

  if (showSkeleton) {
    return (
      <div className={`divide-y stagger-children ${isDark ? 'divide-zinc-900' : 'divide-gray-100'}`}>
        {[...Array(INITIAL_SKELETON_ROWS)].map((_, i) => (
          <SkeletonJobRow key={`skeleton-${i}`} isDark={isDark} index={i} />
        ))}
      </div>
    );
  }

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

  return (
    <div className={`divide-y stagger-children job-list-container ${isDark ? 'divide-zinc-900' : 'divide-gray-100'}`}>
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

      {showLoadingMore && [...Array(TRAILING_SKELETON_ROWS)].map((_, i) => (
        <SkeletonJobRow key={`trailing-skeleton-${i}`} isDark={isDark} index={i} />
      ))}
    </div>
  );
}
