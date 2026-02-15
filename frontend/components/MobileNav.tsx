"use client";

import React, { useEffect, useRef } from "react";
import {
  Search,
  MapPin,
  ChevronDown,
  FileText,
  Linkedin,
  Briefcase,
  Globe,
  X,
  Loader2,
  Filter,
} from "lucide-react";
import { SUPPORTED_COUNTRIES, JOB_PLATFORMS } from '@/lib/constants';

// --- TYPES ---

type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  // Form inputs
  inputTitle: string;
  setInputTitle: (v: string) => void;
  inputLocation: string;
  setInputLocation: (v: string) => void;
  inputCountry: string;
  setInputCountry: (v: string) => void;
  inputSites: string[];
  setInputSites: (v: string[]) => void;
  inputLimit: number;
  setInputLimit: (v: number) => void;
  inputHours: number;
  setInputHours: (v: number) => void;
  inputProfile: string;
  setInputProfile: (v: string) => void;
  inputKeywordsInc: string;
  setInputKeywordsInc: (v: string) => void;
  inputKeywordsExc: string;
  setInputKeywordsExc: (v: string) => void;
  // Actions
  onFetch: () => void;
  onOpenProfile: () => void;
  // State
  isFetching: boolean;
  showMoreOptions: boolean;
  setShowMoreOptions: (v: boolean) => void;
  // Job count based on current tab
  jobCount: number;
  viewStatus: 'new' | 'saved' | 'rejected';
};

export default function MobileNav({
  isOpen,
  onClose,
  isDark,
  inputTitle,
  setInputTitle,
  inputLocation,
  setInputLocation,
  inputCountry,
  setInputCountry,
  inputSites,
  setInputSites,
  inputLimit,
  setInputLimit,
  inputHours,
  setInputHours,
  inputProfile,
  setInputProfile,
  inputKeywordsInc,
  setInputKeywordsInc,
  inputKeywordsExc,
  setInputKeywordsExc,
  onFetch,
  onOpenProfile,
  isFetching,
  showMoreOptions,
  setShowMoreOptions,
  jobCount = 0,
  viewStatus = 'new',
}: MobileNavProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // Delay adding listener to prevent immediate close
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - with transition */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden modal-backdrop"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed inset-y-0 left-0 z-50 w-[280px] shadow-2xl lg:hidden overflow-y-auto mobile-drawer-enter ${
          isDark ? "bg-zinc-900" : "bg-white"
        }`}
      >
        {/* Drawer Header - Compact */}
        <div
          className={`h-12 flex items-center justify-between px-3 border-b flex-shrink-0 sticky top-0 z-10 ${
            isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600">
              <Search className="w-3.5 h-3.5 text-white" />
            </div>
            <span
              className={`font-bold text-sm tracking-tight font-display ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              FindMyJob<span className="text-teal-500">AI</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className={`btn-icon p-1.5 rounded-md ${
              isDark
                ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content - Compact */}
        <div className="p-3 space-y-2">
          {/* Job Titles - Compact */}
          <div className="space-y-0.5">
            <label
              className={`text-[9px] font-bold uppercase tracking-wider ${
                isDark ? "text-zinc-500" : "text-gray-500"
              }`}
            >
              Job Titles *
            </label>
            <div className="relative group">
              <Search
                className={`absolute left-2.5 top-2 w-3.5 h-3.5 transition-colors ${
                  isDark
                    ? "text-zinc-600 group-focus-within:text-teal-400"
                    : "text-gray-400 group-focus-within:text-teal-600"
                }`}
              />
              <input
                className={`w-full border rounded-md pl-8 pr-2 py-1.5 text-xs outline-none transition-colors ${
                  isDark
                    ? "bg-zinc-800 border-zinc-700 text-white focus:border-teal-500"
                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-500"
                }`}
                placeholder="Python Developer..."
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
              />
            </div>
          </div>

          {/* Locations - Compact */}
          <div className="space-y-0.5">
            <label
              className={`text-[9px] font-bold uppercase tracking-wider ${
                isDark ? "text-zinc-500" : "text-gray-500"
              }`}
            >
              Locations *
            </label>
            <div className="relative group">
              <MapPin
                className={`absolute left-2.5 top-2 w-3.5 h-3.5 transition-colors ${
                  isDark
                    ? "text-zinc-600 group-focus-within:text-teal-400"
                    : "text-gray-400 group-focus-within:text-teal-600"
                }`}
              />
              <input
                className={`w-full border rounded-md pl-8 pr-2 py-1.5 text-xs outline-none transition-colors ${
                  isDark
                    ? "bg-zinc-800 border-zinc-700 text-white focus:border-teal-500"
                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-500"
                }`}
                placeholder="Remote, NY..."
                value={inputLocation}
                onChange={(e) => setInputLocation(e.target.value)}
              />
            </div>
          </div>

          {/* Country - Compact */}
          <div className="space-y-0.5">
            <label
              className={`text-[9px] font-bold uppercase tracking-wider ${
                isDark ? "text-zinc-500" : "text-gray-500"
              }`}
            >
              Country
            </label>
            <div className="relative">
              <select
                value={inputCountry}
                onChange={(e) => setInputCountry(e.target.value)}
                className={`w-full border rounded-md px-2 py-1.5 text-xs outline-none appearance-none cursor-pointer transition-colors ${
                  isDark
                    ? "bg-zinc-800 border-zinc-700 text-white focus:border-teal-500"
                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-500"
                }`}
              >
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`absolute right-2 top-2 w-3.5 h-3.5 pointer-events-none ${
                  isDark ? "text-zinc-500" : "text-gray-400"
                }`}
              />
            </div>
          </div>

          {/* Divider */}
          <div className={`h-px ${isDark ? "bg-zinc-800" : "bg-gray-200"}`} />

          {/* Platforms - Single line icons only, bigger buttons */}
          <div className="space-y-1">
            <label
              className={`text-[9px] font-bold uppercase tracking-wider ${
                isDark ? "text-zinc-500" : "text-gray-500"
              }`}
            >
              Platforms
            </label>
            <div className="flex items-center gap-2">
              {JOB_PLATFORMS.map(
                (site) => (
                  <button
                    key={site}
                    onClick={() => {
                      const newSites = inputSites.includes(site)
                        ? inputSites.filter((s) => s !== site)
                        : [...inputSites, site];
                      setInputSites(newSites);
                    }}
                    className={`flex-1 py-2.5 rounded-md border transition-colors ${
                      inputSites.includes(site)
                        ? "bg-teal-500/20 border-teal-500 text-teal-400"
                        : isDark
                        ? "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600"
                        : "bg-gray-50 border-gray-300 text-gray-500 hover:border-gray-400"
                    }`}
                    title={site.replace("_", " ")}
                  >
                    {site === "linkedin" && <Linkedin className="w-5 h-5 mx-auto" />}
                    {site === "indeed" && <Briefcase className="w-5 h-5 mx-auto" />}
                    {site === "glassdoor" && <Globe className="w-5 h-5 mx-auto" />}
                    {site === "zip_recruiter" && <Search className="w-5 h-5 mx-auto" />}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Divider */}
          <div className={`h-px ${isDark ? "bg-zinc-800" : "bg-gray-200"}`} />

          {/* Search Settings - Row 1: Max and Hrs */}
          <div className="flex items-center gap-2">
            <div
              className={`flex-1 border rounded-md p-2 ${
                isDark
                  ? "bg-zinc-800 border-zinc-700"
                  : "bg-gray-50 border-gray-300"
              }`}
            >
              <span
                className={`text-[9px] block mb-0.5 ${
                  isDark ? "text-zinc-500" : "text-gray-500"
                }`}
              >
                Max
              </span>
              <input
                type="number"
                className={`w-full bg-transparent text-xs outline-none font-medium ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
                value={inputLimit}
                min={5}
                max={100}
                onChange={(e) =>
                  setInputLimit(
                    Math.max(5, Math.min(100, parseInt(e.target.value) || 20))
                  )
                }
              />
            </div>
            <div
              className={`flex-1 border rounded-md p-2 ${
                isDark
                  ? "bg-zinc-800 border-zinc-700"
                  : "bg-gray-50 border-gray-300"
              }`}
            >
              <span
                className={`text-[9px] block mb-0.5 ${
                  isDark ? "text-zinc-500" : "text-gray-500"
                }`}
              >
                Hrs
              </span>
              <input
                type="number"
                className={`w-full bg-transparent text-xs outline-none font-medium ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
                value={inputHours}
                min={1}
                max={720}
                onChange={(e) =>
                  setInputHours(
                    Math.max(1, Math.min(720, parseInt(e.target.value) || 72))
                  )
                }
              />
            </div>
          </div>

          {/* Search Settings - Row 2: Profile and Filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenProfile}
              className={`flex-1 py-2 rounded-md border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                isDark
                  ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-teal-400 hover:border-zinc-600"
                  : "bg-gray-50 border-gray-300 text-gray-500 hover:text-teal-600 hover:border-gray-400"
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Profile
            </button>
            <button
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className={`flex-1 py-2 rounded-md border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                showMoreOptions
                  ? "bg-teal-500/20 border-teal-500 text-teal-400"
                  : isDark
                  ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-teal-400 hover:border-zinc-600"
                  : "bg-gray-50 border-gray-300 text-gray-500 hover:text-teal-600 hover:border-gray-400"
              }`}
            >
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
          </div>

          {/* Filter Keywords - Collapsible */}
          {showMoreOptions && (
            <div
              className={`space-y-2 p-2 rounded-md border ${
                isDark
                  ? "bg-zinc-800/50 border-zinc-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <input
                className={`w-full border rounded-md px-2 py-1.5 text-xs outline-none ${
                  isDark
                    ? "bg-zinc-900 border-zinc-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                placeholder="Include keywords (comma sep)"
                value={inputKeywordsInc}
                onChange={(e) => setInputKeywordsInc(e.target.value)}
              />
              <input
                className={`w-full border rounded-md px-2 py-1.5 text-xs outline-none ${
                  isDark
                    ? "bg-zinc-900 border-zinc-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                placeholder="Exclude keywords (comma sep)"
                value={inputKeywordsExc}
                onChange={(e) => setInputKeywordsExc(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Drawer Footer - Job Count + Fetch Button */}
        <div
          className={`p-3 border-t sticky bottom-0 ${
            isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"
          }`}
        >
          {/* Job Count Badge */}
          <div className={`flex items-center justify-between mb-2 px-2 py-1.5 rounded-lg border ${
            isDark 
              ? "bg-zinc-800 border-zinc-700 text-zinc-400" 
              : "bg-gray-100 border-gray-200 text-gray-600"
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
              {jobCount}
            </span>
          </div>
          
          {/* Fetch Button */}
          <button
            onClick={() => {
              onFetch();
              onClose();
            }}
            disabled={isFetching}
            className={`btn-primary w-full py-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-2 shadow-lg ${
              isDark
                ? "bg-white text-black"
                : "bg-teal-600 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isFetching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            Fetch Jobs
          </button>
        </div>
      </div>
    </>
  );
}
