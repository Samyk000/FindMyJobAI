"use client";

import React, { useEffect } from "react";
import { AlertCircle, X } from "lucide-react";

interface ErrorToastProps {
  message: string;
  onClose: () => void;
}

export default function ErrorToast({ message, onClose }: ErrorToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 toast-enter"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 max-w-md dark:bg-red-900/90 dark:border-red-800 dark:text-red-100">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-200" aria-hidden="true" />
        <p className="text-sm font-medium flex-1">{message}</p>
        <button 
          onClick={onClose} 
          aria-label="Dismiss error message"
          className="btn-icon hover:opacity-75 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
