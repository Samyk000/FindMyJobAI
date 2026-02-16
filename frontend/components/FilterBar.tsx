"use client";

import React from "react";
import { ChevronDown, Search, Loader2, Check, X } from "lucide-react";

interface FilterBarProps {
  isDark: boolean;
  viewStatus: "new" | "saved" | "rejected";
  setViewStatus: (status: "new" | "saved" | "rejected") => void;
  filterPortal: string[];
  setFilterPortal: (portals: string[]) => void;
  filterLocation: string[];
  setFilterLocation: (locations: string[]) => void;
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
  // Helper to toggle a value in a multi-select array
  const toggleValue = (currentValues: string[], value: string, setter: (values: string[]) => void) => {
    if (currentValues.includes(value)) {
      setter(currentValues.filter(v => v !== value)); // Remove value
    } else {
      setter([...currentValues, value]); // Add value
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilterPortal([]);
    setFilterLocation([]);
  };

  // Check if any filters are active
  const hasActiveFilters = filterPortal.length > 0 || filterLocation.length > 0;

  // Display text for portal filter button
  const getPortalButtonText = () => {
    if (filterPortal.length === 0) return 'All Portals';
    if (filterPortal.length === 1) return filterPortal[0];
    return `${filterPortal.length} Portals`;
  };

  // Display text for location filter button
  const getLocationButtonText = () => {
    if (filterLocation.length === 0) return 'All Locations';
    if (filterLocation.length === 1) return filterLocation[0];
    return `${filterLocation.length} Locations`;
  };

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

        {/* Portal Filter - Multi-Select */}
        {uniquePortals.length > 0 && (
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setPortalDropdownOpen(!portalDropdownOpen); }}
              aria-haspopup="listbox"
              aria-expanded={portalDropdownOpen}
              aria-label={`Filter by portal: ${getPortalButtonText()}`}
              className={`flex items-center gap-1.5 h-7 lg:h-8 px-2.5 lg:px-3 rounded text-[10px] lg:text-[11px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                filterPortal.length > 0 
                  ? isDark 
                    ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30' 
                    : 'bg-teal-50 text-teal-700 border border-teal-200'
                  : isDark 
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-transparent' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
              }`}>
              <span>{getPortalButtonText()}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${portalDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {portalDropdownOpen && (
              <ul 
                className={`absolute left-0 top-full mt-1 z-50 min-w-[140px] max-w-[180px] max-h-52 overflow-y-auto rounded-lg shadow-xl ${
                  isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-200'
                }`}
                role="listbox"
                aria-label="Select portals"
                aria-multiselectable="true"
              >
                {/* All Portals option */}
                <li
                  onClick={() => setFilterPortal([])}
                  role="option"
                  aria-selected={filterPortal.length === 0}
                  className={`px-3 py-2 text-[11px] cursor-pointer flex items-center gap-2 transition-colors ${
                    filterPortal.length === 0
                      ? isDark ? 'bg-teal-600/30 text-teal-400 font-medium' : 'bg-teal-50 text-teal-700 font-medium'
                      : isDark ? 'text-zinc-300 hover:bg-zinc-700/50' : 'text-gray-700 hover:bg-gray-50'
                  }`}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    filterPortal.length === 0
                      ? 'border-teal-500 bg-teal-500'
                      : isDark ? 'border-zinc-600' : 'border-gray-300'
                  }`}>
                    {filterPortal.length === 0 && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span>All Portals</span>
                </li>
                {/* Divider */}
                <div className={`${isDark ? 'border-zinc-700' : 'border-gray-200'} border-t`} />
                {/* Portal options */}
                {uniquePortals.map(p => (
                  <li
                    key={p}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleValue(filterPortal, p, setFilterPortal);
                    }}
                    role="option"
                    aria-selected={filterPortal.includes(p)}
                    className={`px-3 py-2 text-[11px] cursor-pointer flex items-center gap-2 transition-colors ${
                      filterPortal.includes(p)
                        ? isDark ? 'bg-teal-600/20 text-teal-400' : 'bg-teal-50 text-teal-700'
                        : isDark ? 'text-zinc-300 hover:bg-zinc-700/50' : 'text-gray-700 hover:bg-gray-50'
                    }`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      filterPortal.includes(p)
                        ? 'border-teal-500 bg-teal-500'
                        : isDark ? 'border-zinc-600' : 'border-gray-300'
                    }`}>
                      {filterPortal.includes(p) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="capitalize">{p}</span>
                  </li>
                ))}
                {/* Footer with close button */}
                <li className={`border-t ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
                  <button
                    onClick={() => setPortalDropdownOpen(false)}
                    className={`w-full px-3 py-2 text-[10px] font-semibold text-center transition-colors ${
                      isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {filterPortal.length === 0 ? 'All selected' : `${filterPortal.length} selected`} · Close
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}
        
        {/* Location Filter - Multi-Select */}
        {uniqueLocations.length > 0 && (
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setLocationDropdownOpen(!locationDropdownOpen); }}
              aria-haspopup="listbox"
              aria-expanded={locationDropdownOpen}
              aria-label={`Filter by location: ${getLocationButtonText()}`}
              className={`flex items-center gap-1.5 h-7 lg:h-8 px-2.5 lg:px-3 rounded text-[10px] lg:text-[11px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                filterLocation.length > 0 
                  ? isDark 
                    ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30' 
                    : 'bg-teal-50 text-teal-700 border border-teal-200'
                  : isDark 
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-transparent' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
              }`}>
              <span className="max-w-[80px] truncate">{getLocationButtonText()}</span>
              <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${locationDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {locationDropdownOpen && (
              <ul 
                className={`absolute right-0 lg:left-0 top-full mt-1 z-50 min-w-[140px] max-w-[180px] max-h-52 overflow-y-auto rounded-lg shadow-xl ${
                  isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-200'
                }`}
                role="listbox"
                aria-label="Select locations"
                aria-multiselectable="true"
              >
                {/* All Locations option */}
                <li
                  onClick={() => setFilterLocation([])}
                  role="option"
                  aria-selected={filterLocation.length === 0}
                  className={`px-3 py-2 text-[11px] cursor-pointer flex items-center gap-2 transition-colors ${
                    filterLocation.length === 0
                      ? isDark ? 'bg-teal-600/30 text-teal-400 font-medium' : 'bg-teal-50 text-teal-700 font-medium'
                      : isDark ? 'text-zinc-300 hover:bg-zinc-700/50' : 'text-gray-700 hover:bg-gray-50'
                  }`}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    filterLocation.length === 0
                      ? 'border-teal-500 bg-teal-500'
                      : isDark ? 'border-zinc-600' : 'border-gray-300'
                  }`}>
                    {filterLocation.length === 0 && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span>All Locations</span>
                </li>
                {/* Divider */}
                <div className={`${isDark ? 'border-zinc-700' : 'border-gray-200'} border-t`} />
                {/* Location options */}
                {uniqueLocations.map(l => (
                  <li
                    key={l}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleValue(filterLocation, l, setFilterLocation);
                    }}
                    role="option"
                    aria-selected={filterLocation.includes(l)}
                    className={`px-3 py-2 text-[11px] cursor-pointer flex items-center gap-2 transition-colors ${
                      filterLocation.includes(l)
                        ? isDark ? 'bg-teal-600/20 text-teal-400' : 'bg-teal-50 text-teal-700'
                        : isDark ? 'text-zinc-300 hover:bg-zinc-700/50' : 'text-gray-700 hover:bg-gray-50'
                    }`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      filterLocation.includes(l)
                        ? 'border-teal-500 bg-teal-500'
                        : isDark ? 'border-zinc-600' : 'border-gray-300'
                    }`}>
                      {filterLocation.includes(l) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="truncate">{l}</span>
                  </li>
                ))}
                {/* Footer with close button */}
                <li className={`border-t ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
                  <button
                    onClick={() => setLocationDropdownOpen(false)}
                    className={`w-full px-3 py-2 text-[10px] font-semibold text-center transition-colors ${
                      isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {filterLocation.length === 0 ? 'All selected' : `${filterLocation.length} selected`} · Close
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}

        {/* Clear All Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className={`flex items-center gap-1 h-7 lg:h-8 px-2 rounded text-[10px] lg:text-[11px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
              isDark 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
            }`}
          >
            <X className="w-3 h-3" />
            <span>Clear</span>
          </button>
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
