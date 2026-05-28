"use client";

import React from "react";
import { AlertCircle, Trash2, Search, Loader2, CheckCircle2 } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface ClearConfirmModalProps {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clearingData: boolean;
  clearType: "all" | "search";
}

export default function ClearConfirmModal({
  isOpen,
  isDark,
  onClose,
  onConfirm,
  clearingData,
  clearType
}: ClearConfirmModalProps) {
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  const isSearch = clearType === "search";

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="clear-modal-title"
      aria-describedby="clear-modal-description"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className={`modal-enter-fast border rounded-xl w-full max-w-sm p-6 shadow-2xl 
focus-visible:outline-none ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}
      >
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? (isSearch ? 'bg-orange-950/50' : 'bg-red-950/50') : (isSearch ? 'bg-orange-100' : 'bg-red-100')}`} aria-hidden="true">
            {isSearch ? <Search className="w-8 h-8 text-orange-500" /> : <AlertCircle className="w-8 h-8 text-red-500" />}
          </div>

          <h3 id="clear-modal-title" className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isSearch ? "Clear Search Results?" : "Delete All Data?"}
          </h3>

          {isSearch ? (
            <div className={`text-sm text-left space-y-2 mb-4 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              <p>This will delete:</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  All new/unread job listings
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Search history and tabs
                </li>
              </ul>
              <p className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Saved and rejected jobs will be kept
              </p>
            </div>
          ) : (
            <p id="clear-modal-description" className={`text-sm mb-4 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              This will permanently delete all your jobs, search history, tabs, and settings. This action cannot be undone.
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 w-full mt-2">
            <button type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Cancel
            </button>
            <button type="button"
              onClick={onConfirm}
              disabled={clearingData}
              aria-busy={clearingData}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex justify-center items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                isSearch 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {clearingData ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSearch ? <Search className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />)}
              {isSearch ? "Clear Search" : "Delete All"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
