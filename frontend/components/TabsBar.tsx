"use client";

import React from "react";
import { Plus, X, Search, Settings } from "lucide-react";
import { SearchTab } from '@/types';

interface TabsBarProps {
  isDark: boolean;
  tabs: SearchTab[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onAddTab: () => void;
  onCloseTab: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  isMobile?: boolean;
  jobCount?: number;
}

export default function TabsBar({
  isDark,
  tabs,
  activeTabId,
  onTabClick,
  onAddTab,
  onCloseTab,
  onOpenSettings,
  isMobile = false,
  jobCount
}: TabsBarProps) {
  if (isMobile) {
    return (
      <div className={`lg:hidden border-b flex items-center justify-between px-2 py-1.5 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`} role="tablist" aria-label="Search tabs">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabClick(tab.id)}
              role="tab"
              aria-selected={activeTabId === tab.id}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                activeTabId === tab.id
                  ? isDark
                    ? 'bg-teal-500/20 text-teal-400'
                    : 'bg-teal-50 text-teal-700'
                  : isDark
                    ? 'text-zinc-500 hover:text-white'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={onAddTab}
            aria-label="Add new search tab"
            className={`p-1 rounded-md transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {jobCount !== undefined && (
          <span className={`text-[10px] font-medium px-2 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`} aria-live="polite">{jobCount} jobs</span>
        )}
      </div>
    );
  }

  // Desktop version
  return (
    <div className={`hidden lg:flex h-14 items-end border-b px-4 gap-1 ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'}`} role="tablist" aria-label="Search tabs">
      <div className="flex items-end h-full gap-2 overflow-x-auto no-scrollbar flex-1">
        {tabs.map(tab => (
          <div 
            key={tab.id} 
            onClick={() => onTabClick(tab.id)}
            role="tab"
            aria-selected={activeTabId === tab.id}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onTabClick(tab.id);
              }
            }}
            className={`group flex items-center gap-2 px-4 h-9 rounded-t-lg text-xs font-bold border-t border-x cursor-pointer transition-all min-w-[120px] max-w-[200px] select-none flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${activeTabId === tab.id
              ? isDark
                ? 'bg-zinc-900 border-zinc-700 text-white translate-y-[1px] z-10'
                : 'bg-gray-100 border-gray-300 text-gray-900 translate-y-[1px] z-10'
              : isDark
                ? 'bg-zinc-950 border-transparent text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 mb-1'
                : 'bg-white border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700 mb-1'
              }`}>
            <span className="truncate flex-1">{tab.label}</span>
            {tab.id !== 'all' && (
              <button 
                onClick={(e) => onCloseTab(tab.id, e)} 
                aria-label={`Close ${tab.label} tab`}
                className={`opacity-0 group-hover:opacity-100 p-0.5 rounded-full focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'hover:bg-zinc-800 hover:text-red-400' : 'hover:bg-gray-200 hover:text-red-500'}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button 
          onClick={onAddTab} 
          aria-label="Add new search tab"
          className={`h-9 w-9 flex items-center justify-center rounded-t-lg transition-colors flex-shrink-0 mb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-900' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <button 
        onClick={onOpenSettings} 
        aria-label="Open settings"
        className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors mb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'}`}
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  );
}

// Mobile Header Component
export function MobileHeader({ 
  isDark, 
  onMenuOpen, 
  onSettingsOpen 
}: { 
  isDark: boolean; 
  onMenuOpen: () => void; 
  onSettingsOpen: () => void;
}) {
  return (
    <header className={`h-14 flex items-center justify-between px-4 border-b flex-shrink-0 lg:hidden fixed top-0 left-0 right-0 z-30 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'}`}>
      <button
        onClick={onMenuOpen}
        aria-label="Open navigation menu"
        className={`p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
      >
        <Search className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600">
          <Search className="w-4 h-4 text-white" />
        </div>
        <span className={`font-bold tracking-tight font-display ${isDark ? 'text-white' : 'text-gray-900'}`}>
          FindMyJob<span className="text-teal-500">AI</span>
        </span>
      </div>
      <button
        onClick={onSettingsOpen}
        aria-label="Open settings"
        className={`p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
      >
        <Settings className="w-5 h-5" />
      </button>
    </header>
  );
}
