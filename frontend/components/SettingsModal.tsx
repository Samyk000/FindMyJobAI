"use client";

import React, { useRef, useEffect } from "react";
import { Settings, X, Sun, Moon, AlertCircle, Trash2, Loader2 } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
  onToggleTheme: () => void;
  onClearData: () => void;
  onShowClearConfirm: () => void;
  clearingData: boolean;
}

export default function SettingsModal({
  isOpen,
  isDark,
  onClose,
  onToggleTheme,
  onClearData,
  onShowClearConfirm,
  clearingData
}: SettingsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className={`modal-enter border rounded-xl w-full max-w-md p-6 shadow-2xl focus-visible:outline-none ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 id="settings-modal-title" className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Settings className="w-5 h-5 text-teal-500" /> App Settings
          </h3>
          <button 
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
            <button 
              onClick={onToggleTheme}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              className={`p-2 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-zinc-700 text-white border-zinc-600' : 'bg-white text-gray-900 border-gray-300'}`}
            >
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-red-950/20 border-red-900/30' : 'bg-red-50 border-red-200'}`}>
            <h4 className="text-sm font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Danger Zone
            </h4>
            <p className={`text-xs mt-2 mb-3 ${isDark ? 'text-red-400/70' : 'text-red-500/80'}`}>
              Permanently delete all data including:
            </p>
            <ul className={`text-xs mb-4 space-y-1 ${isDark ? 'text-red-400/60' : 'text-red-500/70'}`}>
              <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-red-500" aria-hidden="true"></span>All saved jobs (new, saved, rejected)</li>
              <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-red-500" aria-hidden="true"></span>All search tabs and history</li>
              <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-red-500" aria-hidden="true"></span>All search settings and preferences</li>
            </ul>
            <button 
              onClick={onShowClearConfirm} 
              disabled={clearingData}
              aria-busy={clearingData}
              className="w-full px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 flex justify-center items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              {clearingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
