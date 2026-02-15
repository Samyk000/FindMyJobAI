"use client";

import React, { useRef, useEffect } from "react";
import { FileText, X, Loader2 } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  isDark: boolean;
  inputProfile: string;
  setInputProfile: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  isLoading: boolean;
}

export default function ProfileModal({
  isOpen,
  isDark,
  inputProfile,
  setInputProfile,
  onClose,
  onSave,
  isLoading
}: ProfileModalProps) {
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
      aria-labelledby="profile-modal-title"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className={`modal-enter border rounded-xl w-full max-w-lg p-6 shadow-2xl focus-visible:outline-none ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id="profile-modal-title" className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <FileText className="w-4 h-4 text-teal-500" /> Candidate Profile
          </h3>
          <button 
            onClick={onClose}
            aria-label="Close profile modal"
            className={`p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} />
          </button>
        </div>
        <label htmlFor="profile-textarea" className="sr-only">Candidate profile text</label>
        <textarea
          id="profile-textarea"
          className={`w-full h-40 border rounded-lg p-3 text-xs outline-none mb-4 font-mono resize-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-black border-zinc-800 text-white focus:border-teal-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-500'}`}
          placeholder="Paste your resume..." 
          value={inputProfile} 
          onChange={e => setInputProfile(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button 
            onClick={onClose} 
            className={`px-4 py-2 rounded-lg text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isDark ? 'bg-zinc-800 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Cancel
          </button>
          <button 
            onClick={onSave} 
            disabled={isLoading} 
            aria-busy={isLoading}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            {isLoading && <Loader2 className="w-3 h-3 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}
