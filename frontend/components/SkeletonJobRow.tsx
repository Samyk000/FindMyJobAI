"use client";

import React from "react";

interface SkeletonJobRowProps {
  isDark: boolean;
  /** Row index — used to vary widths so the list looks organic, not robotic. */
  index?: number;
}

// Varied widths keyed by row index so consecutive skeletons don't look identical.
const TITLE_WIDTHS = ["w-3/5", "w-1/2", "w-2/3", "w-2/5", "w-[55%]"];
const COMPANY_WIDTHS = ["w-1/3", "w-2/5", "w-1/4", "w-1/3", "w-[30%]"];
const LOCATION_WIDTHS = ["w-24", "w-20", "w-28", "w-16", "w-24"];

/**
 * Loading placeholder that mirrors the real JobCard layout so the swap from
 * skeleton → content is seamless (same heights, columns, and spacing).
 */
export default function SkeletonJobRow({ index = 0 }: SkeletonJobRowProps) {
  const titleW = TITLE_WIDTHS[index % TITLE_WIDTHS.length];
  const companyW = COMPANY_WIDTHS[index % COMPANY_WIDTHS.length];
  const locW = LOCATION_WIDTHS[index % LOCATION_WIDTHS.length];

  return (
    <div
      className="flex items-center gap-2 lg:gap-4 p-2 lg:p-3 border-l-2 border-transparent select-none"
      aria-hidden="true"
    >
      {/* Leading icon — matches JobCard's 9x9 desktop icon / 7x7 mobile portal icon */}
      <div className="hidden lg:block w-9 h-9 rounded-lg skeleton-line flex-shrink-0" />
      <div className="lg:hidden w-7 h-7 rounded-md skeleton-line flex-shrink-0" />

      {/* Title + company */}
      <div className="flex-1 min-w-0 lg:max-w-[35%] space-y-2">
        <div className={`h-3.5 skeleton-line ${titleW}`} />
        <div className={`h-2.5 skeleton-line ${companyW}`} />
      </div>

      {/* Location (desktop only) — dot stands in for the MapPin icon */}
      <div className="hidden lg:flex items-center gap-1.5 min-w-[20%]">
        <div className="w-3 h-3 rounded-full skeleton-line flex-shrink-0" />
        <div className={`h-2.5 skeleton-line ${locW}`} />
      </div>

      {/* Time + portal badge (desktop only) */}
      <div className="hidden lg:flex items-center justify-end gap-3 ml-auto flex-shrink-0">
        <div className="h-2.5 w-14 skeleton-line" />
        <div className="h-4 w-16 rounded skeleton-line" />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-shrink-0 lg:pl-4 lg:ml-0 ml-auto">
        <div className="w-7 h-7 rounded skeleton-line" />
        <div className="hidden lg:block w-7 h-7 rounded skeleton-line" />
      </div>
    </div>
  );
}
