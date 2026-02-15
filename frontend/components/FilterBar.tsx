"use client";

import React from "react";
import { ChevronDown, Search, Loader2 } from "lucide-react";

interface FilterBarProps {
  isDark: boolean;
  viewStatus: "new" | "saved" | "rejected";
  setViewStatus: (status: "new" | "saved" | "rejected") => void;
  filterPortal: string;
  setFilterPortal: (portal: string) => void;
  filterLocation: string;
  setFilterLocation: (location: string) => void;
  portalDropdownOpen: boolean;
  setPortalDropdownOpen: (open: boolean) => void;
  locationDropdownOpen: boolean;
  setLocationDropdownOpen: (open: boolean) => void;
  uniquePortals: string[];
  uniqueLocations: string[];
  displayJobsCount: number;
  isFetching: boolean;
  onFetch: () => void;
}

export default function FilterBar({
  isDark,
  viewStatus,
  setViewStatus,
  filterPortal,
  setFilterPortal,
  filterLocation,
  setFilterLocation,
  portalDropdownOpen,
  setPortalDropdownOpen,
  locationDropdownOpen,
  setLocationDropdownOpen,
  uniquePortals,
  uniqueLocations,
  displayJobsCount,
  isFetching,
  onFetch
}: FilterBarProps) {
  return (
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
            {displayJobsCount}
          </span>
        </div>
        
        {/* Fetch Button */}
        <button 
          onClick={onFetch} 
          disabled={isFetching}
          aria-busy={isFetching}
          className={`btn-primary px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-white text-black' : 'bg-teal-600 text-white'}`}>
          {isFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
          Fetch Jobs
        </button>
      </div>
    </div>
  );
}
