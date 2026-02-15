"use client";

import React from "react";
import { 
  Search, 
  MapPin, 
  ChevronDown, 
  ChevronUp,
  Settings2,
  Filter,
  Briefcase,
  Globe,
  Linkedin
} from "lucide-react";
import { SUPPORTED_COUNTRIES, JOB_PLATFORMS } from '@/lib/constants';

interface DesktopSidebarProps {
  isDark: boolean;
  inputTitle: string;
  setInputTitle: (value: string) => void;
  inputLocation: string;
  setInputLocation: (value: string) => void;
  inputCountry: string;
  setInputCountry: (value: string) => void;
  inputSites: string[];
  setInputSites: (value: string[]) => void;
  inputLimit: number;
  setInputLimit: (value: number) => void;
  inputHours: number;
  setInputHours: (value: number) => void;
  inputKeywordsInc: string;
  setInputKeywordsInc: (value: string) => void;
  inputKeywordsExc: string;
  setInputKeywordsExc: (value: string) => void;
  showMoreOptions: boolean;
  setShowMoreOptions: (value: boolean) => void;
}

export default function DesktopSidebar({
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
  inputKeywordsInc,
  setInputKeywordsInc,
  inputKeywordsExc,
  setInputKeywordsExc,
  showMoreOptions,
  setShowMoreOptions
}: DesktopSidebarProps) {
  return (
    <aside className={`hidden lg:flex w-80 border-r flex-col flex-shrink-0 z-20 ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}>
      <div className={`h-14 flex items-center px-6 border-b flex-shrink-0 ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-2.5 bg-gradient-to-br from-teal-500 to-teal-600`}>
          <Search className="w-4 h-4 text-white" />
        </div>
        <span className={`font-bold tracking-tight font-display ${isDark ? 'text-white' : 'text-gray-900'}`}>
          FindMyJob<span className="text-teal-500">AI</span>
        </span>
      </div>

      <div className="flex-1 p-5 space-y-6 overflow-y-auto scrollbar-thin">
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="job-title-input" className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Job Titles *</label>
            <div className="relative group">
              <Search className={`absolute left-3 top-2.5 w-4 h-4 transition-colors ${isDark ? 'text-zinc-600 group-focus-within:text-teal-400' : 'text-gray-400 group-focus-within:text-teal-600'}`} />
              <input
                id="job-title-input"
                className={`w-full border rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-black border-zinc-800 text-white focus:border-teal-500 focus:bg-zinc-900' : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'}`}
                placeholder="Python Developer..."
                value={inputTitle}
                onChange={e => setInputTitle(e.target.value)}
                aria-required="true"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="location-input" className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Locations *</label>
            <div className="relative group">
              <MapPin className={`absolute left-3 top-2.5 w-4 h-4 transition-colors ${isDark ? 'text-zinc-600 group-focus-within:text-teal-400' : 'text-gray-400 group-focus-within:text-teal-600'}`} />
              <input
                id="location-input"
                className={`w-full border rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-black border-zinc-800 text-white focus:border-teal-500 focus:bg-zinc-900' : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'}`}
                placeholder="Remote, NY..."
                value={inputLocation}
                onChange={e => setInputLocation(e.target.value)}
                aria-required="true"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="country-select" className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
              Country <span className="text-teal-500">(Remote)</span>
            </label>
            <div className="relative">
              <select
                id="country-select"
                value={inputCountry}
                onChange={e => setInputCountry(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none appearance-none cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-black border-zinc-800 text-white focus:border-teal-500' : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'}`}
              >
                {SUPPORTED_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              <ChevronDown className={`absolute right-3 top-2.5 w-4 h-4 pointer-events-none ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>

        <div className={`h-px ${isDark ? 'bg-zinc-800/50' : 'bg-gray-200'}`} />

        <div className="space-y-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Platforms</span>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Select job platforms">
            {JOB_PLATFORMS.map(site => (
              <label key={site} className={`flex items-center gap-2 cursor-pointer p-2 rounded border text-xs font-medium transition-colors select-none focus-within:ring-2 focus-within:ring-teal-500 ${inputSites.includes(site)
                ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400'
                : isDark
                  ? 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
                }`}>
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={inputSites.includes(site)} 
                  onChange={e => {
                    const newSites = e.target.checked ? [...inputSites, site] : inputSites.filter(s => s !== site);
                    setInputSites(newSites);
                  }}
                  aria-label={`${site.replace('_', ' ')} platform`}
                />
                {site === 'linkedin' && <Linkedin className="w-3 h-3" />}
                {site === 'indeed' && <Briefcase className="w-3 h-3" />}
                {site === 'glassdoor' && <Globe className="w-3 h-3" />}
                <span className="capitalize truncate">{site.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Search Settings</span>
          <div className="grid grid-cols-2 gap-3">
            <div className={`border rounded-lg p-2.5 ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-300'}`}>
              <label htmlFor="max-results-input" className={`text-[10px] block mb-1 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Max Results</label>
              <input 
                id="max-results-input"
                type="number" 
                className={`w-full bg-transparent text-sm outline-none font-medium focus-visible:ring-2 focus-visible:ring-teal-500 rounded ${isDark ? 'text-white' : 'text-gray-900'}`}
                value={inputLimit} 
                min={5} 
                max={100}
                onChange={e => setInputLimit(Math.max(5, Math.min(100, parseInt(e.target.value) || 20)))} 
              />
            </div>
            <div className={`border rounded-lg p-2.5 ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-300'}`}>
              <label htmlFor="age-hours-input" className={`text-[10px] block mb-1 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Age (Hours)</label>
              <input 
                id="age-hours-input"
                type="number" 
                className={`w-full bg-transparent text-sm outline-none font-medium focus-visible:ring-2 focus-visible:ring-teal-500 rounded ${isDark ? 'text-white' : 'text-gray-900'}`}
                value={inputHours} 
                min={1} 
                max={720}
                onChange={e => setInputHours(Math.max(1, Math.min(720, parseInt(e.target.value) || 72)))} 
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className={`border rounded-lg overflow-hidden ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-300'}`}>
            <button 
              onClick={() => setShowMoreOptions(!showMoreOptions)} 
              aria-expanded={showMoreOptions}
              aria-controls="filter-keywords-panel"
              className={`w-full flex items-center justify-between p-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <span className="flex items-center gap-2"><Filter className="w-3 h-3" /> Filter Keywords</span>
              {showMoreOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showMoreOptions && (
              <div id="filter-keywords-panel" className={`p-2 space-y-2 border-t ${isDark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200 bg-gray-50'}`}>
                <label htmlFor="include-keywords" className="sr-only">Include keywords (comma separated)</label>
                <input 
                  id="include-keywords"
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} 
                  placeholder="Include (comma sep)" 
                  value={inputKeywordsInc} 
                  onChange={e => setInputKeywordsInc(e.target.value)} 
                />
                <label htmlFor="exclude-keywords" className="sr-only">Exclude keywords (comma separated)</label>
                <input 
                  id="exclude-keywords"
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} 
                  placeholder="Exclude (comma sep)" 
                  value={inputKeywordsExc} 
                  onChange={e => setInputKeywordsExc(e.target.value)} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
