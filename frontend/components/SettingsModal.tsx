"use client";

import React from "react";
import { Settings, X, Sun, Moon, AlertCircle, Trash2, Loader2, Search } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface SettingsModalProps {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
  onToggleTheme: () => void;
  onClearData: () => void;
  onClearSearch: () => void;
  onShowClearConfirm: () => void;
  onShowClearSearchConfirm: () => void;
  clearingData: boolean;
}

export default function SettingsModal({
  isOpen,
  isDark,
  onClose,
  onToggleTheme,
  onClearData,
  onClearSearch,
  onShowClearConfirm,
  onShowClearSearchConfirm,
  clearingData
}: SettingsModalProps) {
  // Focus trap for accessibility (WCAG 2.4.3)
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className={`modal-enter-fast border rounded-xl w-full max-w-md p-6 shadow-2xl focus-visible:outline-none ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 id="settings-modal-title" className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Settings className="w-5 h-5 text-teal-500" /> App Settings
          </h3>
          <button type="button" 
            onClick={onClose}
            aria-label="Close settings modal"
            className={`p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} />
          </button>
        </div>
        <div className="space-y-6">
          <div className={`p-4 rounded-lg border flex justify-between items-center ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-50 border-gray-200'}`}>
            <div>
              <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Appearance</h4>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>{isDark ? 'Dark Mode' : 'Light Mode'}</p>
            </div>
            <button type="button" 
              onClick={onToggleTheme}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              className={`p-2 rounded-lg border transition-all duration-300 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-zinc-700 text-amber-400 border-zinc-600 hover:bg-zinc-600' : 'bg-zinc-800 text-blue-400 border-zinc-700 hover:bg-zinc-700'}`}
            >
              <span className={`block transition-transform duration-300 ${isDark ? 'rotate-0' : 'rotate-180'}`}>
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </span>
            </button>
          </div>
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-red-950/20 border-red-900/30' : 'bg-red-50 border-red-200'}`}>
            <h4 className="text-sm font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Danger Zone
            </h4>
            <div className="flex gap-2 mt-3">
              <button type="button" 
                onClick={onShowClearSearchConfirm}
                disabled={clearingData}
                className="flex-1 px-3 py-2.5 rounded-lg border border-orange-300 bg-orange-50 text-orange-700 text-sm font-medium hover:bg-orange-100 flex justify-center items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <Search className="w-4 h-4" /> Clear Search
              </button>
              <button type="button" 
                onClick={onShowClearConfirm} 
                disabled={clearingData}
                aria-busy={clearingData}
                className="flex-1 px-3 py-2.5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 flex justify-center items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                {clearingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Clear All
              </button>
            </div>
            <p className={`text-xs mt-2 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
              <span className="text-orange-600">Clear Search</span> removes new jobs only. <span className="text-red-600">Clear All</span> deletes everything.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
