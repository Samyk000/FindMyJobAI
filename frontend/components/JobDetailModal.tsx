"use client";

import React, { memo } from "react";
import {
  X,
  MapPin,
  Clock,
  Building2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
  Briefcase,
  Globe,
  Linkedin,
  Search,
} from "lucide-react";

import { JobRow } from "@/types";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { openUrl } from "@/lib/tauri";

// --- TYPES ---

type JobDetailModalProps = {
  job: JobRow | null;
  isOpen: boolean;
  isDark: boolean;
  viewStatus: "new" | "saved" | "rejected";
  onClose: () => void;
  onSave: (id: string) => void;
  onReject: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
};

// --- HELPER FUNCTIONS ---

const getSourceIcon = (sourceSite: string, isDark: boolean) => {
  if (sourceSite.includes("linkedin")) {
    return <Linkedin className="w-4 h-4 text-blue-500" />;
  }
  if (sourceSite.includes("indeed")) {
    return <Briefcase className="w-4 h-4 text-purple-500" />;
  }
  if (sourceSite.includes("glassdoor")) {
    return <Globe className="w-4 h-4 text-green-500" />;
  }
  return <Search className={`w-4 h-4 ${isDark ? "text-zinc-500" : "text-gray-500"}`} />;
};

const getSourceBadgeClasses = (sourceSite: string, isDark: boolean) => {
  if (sourceSite.includes("linkedin")) {
    return "border-blue-500/30 text-blue-400 bg-blue-500/10";
  }
  if (sourceSite.includes("indeed")) {
    return "border-purple-500/30 text-purple-400 bg-purple-500/10";
  }
  if (sourceSite.includes("glassdoor")) {
    return "border-green-500/30 text-green-400 bg-green-500/10";
  }
  return isDark
    ? "border-zinc-700 text-zinc-400 bg-zinc-800"
    : "border-gray-300 text-gray-500 bg-gray-100";
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "Recently posted";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Recently posted";
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Recently posted";
  }
};

// Format description - convert markdown-like syntax to HTML (XSS-safe)
const formatDescription = (text: string): string => {
  if (!text) return "";
  
  // Step 1: Escape ALL HTML entities first (prevents injection)
  let safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  // Step 2: Convert markdown to safe HTML (no attributes, no nested injection)
  // Headers
  safe = safe.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  safe = safe.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  safe = safe.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Bold
  safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Italic
  safe = safe.replace(/\*(.+?)\*/g, '<em>$1</em>');
  safe = safe.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Bullet points - collect consecutive items into <ul>
  safe = safe.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  safe = safe.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul class="ml-4 list-disc">${match}</ul>`);
  
  // Numbered lists - collect consecutive items into <ol>
  safe = safe.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  // Only wrap consecutive <li> not already in a <ul>
  safe = safe.replace(/(?<!<\/ul>)(<li>.*<\/li>\n?)+/g, (match) => {
    if (match.includes('<ul')) return match; // Already wrapped
    return `<ol class="ml-4 list-decimal">${match}</ol>`;
  });
  
  // Line breaks
  safe = safe.replace(/\n\n/g, '</p><p>');
  safe = safe.replace(/\n/g, '<br/>');
  
  // Wrap in paragraph
  safe = `<p>${safe}</p>`;
  
  // Clean up empty paragraphs and br
  safe = safe.replace(/<p>\s*<\/p>/g, '');
  safe = safe.replace(/<p><br\/><\/p>/g, '');
  safe = safe.replace(/<p>\s*<br\/>/g, '<p>');
  
  return safe;
};

// --- COMPONENT ---

const JobDetailModal = memo(function JobDetailModal({
  job,
  isOpen,
  isDark,
  viewStatus,
  onClose,
  onSave,
  onReject,
  onRestore,
  onDelete,
}: JobDetailModalProps) {
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);

  if (!isOpen || !job) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleOpenOriginal = () => {
    openUrl(job.job_url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-detail-title"
      onClick={handleBackdropClick}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`modal-enter-fast relative w-full max-w-2xl max-h-[90vh] 
overflow-hidden rounded-xl border shadow-2xl focus-visible:outline-none flex flex-col ${
          isDark
            ? "bg-zinc-900 border-zinc-700"
            : "bg-white border-gray-200"
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 px-6 py-4 border-b flex-shrink-0 ${
            isDark
              ? "bg-zinc-900 border-zinc-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2
                id="job-detail-title"
                className={`text-xl font-bold leading-tight ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {job.title}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Building2
                  className={`w-4 h-4 flex-shrink-0 ${
                    isDark ? "text-zinc-500" : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm ${
                    isDark ? "text-zinc-400" : "text-gray-600"
                  }`}
                >
                  {job.company || "Unknown Company"}
                </span>
              </div>
            </div>
            <button type="button"
              onClick={onClose}
              aria-label="Close modal"
              className={`p-2 rounded-lg transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                isDark
                  ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Job Meta Info */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Location */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                isDark
                  ? "bg-zinc-800 border-zinc-700 text-zinc-300"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-sm">{job.location || "Location N/A"}</span>
            </div>

            {/* Remote Badge */}
            {job.is_remote && (
              <span className="px-3 py-1.5 rounded-lg border border-teal-500/30 text-teal-400 bg-teal-500/10 text-sm font-medium">
                Remote
              </span>
            )}

            {/* Date Posted */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                isDark
                  ? "bg-zinc-800 border-zinc-700 text-zinc-400"
                  : "bg-gray-50 border-gray-200 text-gray-500"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="text-sm">{formatDate(job.date_posted)}</span>
            </div>

            {/* Source Site */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${getSourceBadgeClasses(
                job.source_site,
                isDark
              )}`}
            >
              {getSourceIcon(job.source_site, isDark)}
              <span className="uppercase">{job.source_site}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3
              className={`text-sm font-bold mb-3 ${
                isDark ? "text-zinc-300" : "text-gray-700"
              }`}
            >
              Job Description
            </h3>
            <div
              className={`rounded-lg border p-4 ${
                isDark
                  ? "bg-zinc-800/50 border-zinc-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              {job.description ? (
                <div 
                  className={`text-sm leading-relaxed description-content ${
                    isDark ? "text-zinc-300" : "text-gray-700"
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatDescription(job.description) }}
                />
              ) : (
                <p
                  className={`italic text-sm m-0 ${
                    isDark ? "text-zinc-500" : "text-gray-400"
                  }`}
                >
                  No description available. Click "Open Original" to view full details on the source site.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Actions */}
        <div
          className={`sticky bottom-0 z-10 px-6 py-4 border-t flex-shrink-0 ${
            isDark
              ? "bg-zinc-900 border-zinc-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex flex-wrap items-center gap-3">
            {/* Open Original Button */}
            <button type="button"
              onClick={handleOpenOriginal}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                isDark
                  ? "bg-teal-600 text-white hover:bg-teal-500"
                  : "bg-teal-500 text-white hover:bg-teal-600"
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              Open Original
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Status Actions */}
            {viewStatus === "new" && (
              <>
                <button type="button"
                  onClick={() => {
                    onSave(job.id);
                    onClose();
                  }}
                  aria-label="Save job"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    isDark
                      ? "bg-emerald-900/50 text-emerald-400 hover:bg-emerald-800 hover:text-white"
                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save
                </button>
                <button type="button"
                  onClick={() => {
                    onReject(job.id);
                    onClose();
                  }}
                  aria-label="Reject job"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    isDark
                      ? "bg-zinc-800 text-zinc-400 hover:bg-orange-900/50 hover:text-orange-400"
                      : "bg-gray-100 text-gray-500 hover:bg-orange-100 hover:text-orange-600"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}

            {viewStatus === "saved" && (
              <button type="button"
                onClick={() => {
                  onReject(job.id);
                  onClose();
                }}
                aria-label="Move to rejected"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  isDark
                    ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                }`}
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            )}

            {viewStatus === "rejected" && (
              <button type="button"
                onClick={() => {
                  onRestore(job.id);
                  onClose();
                }}
                aria-label="Restore job"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  isDark
                    ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                Restore
              </button>
            )}

            {/* Delete Button */}
            <button type="button"
              onClick={() => {
                onDelete(job.id);
                onClose();
              }}
              aria-label="Delete job"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                isDark
                  ? "bg-red-900/30 text-red-400 hover:bg-red-900 hover:text-white"
                  : "bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default JobDetailModal;