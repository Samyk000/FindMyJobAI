"use client";

import React from "react";
import { AlertCircle, Trash2, Loader2 } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface ClearConfirmModalProps {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clearingData: boolean;
}

export default function ClearConfirmModal({
  isOpen,
  isDark,
  onClose,
  onConfirm,
  clearingData
}: ClearConfirmModalProps) {
  // Focus trap for accessibility (WCAG 2.4.3)
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="clear-modal-title"
      aria-describedby="clear-modal-description"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className={`modal-enter border rounded-xl w-full max-w-sm p-6 shadow-2xl focus-visible:outline-none ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}
      >
        <div className="flex flex-col items-center text-center">
          {/* Warning Icon */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-red-950/50' : 'bg-red-100'}`} aria-hidden="true">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>

          <h3 id="clear-modal-title" className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Delete All Data?
          </h3>

          <p id="clear-modal-description" className={`text-sm mb-4 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
            This will permanently delete all your jobs, search history, tabs, and settings. This action cannot be undone.
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={clearingData}
              aria-busy={clearingData}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors flex justify-center items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              {clearingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
