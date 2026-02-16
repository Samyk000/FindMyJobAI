"use client";

import React, { memo } from "react";
import {
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
  Search,
  Linkedin,
  Briefcase,
  Globe,
} from "lucide-react";

import { JobRow } from "@/types";
import { openUrl } from "@/lib/tauri";

// --- TYPES ---

type JobCardProps = {
  job: JobRow;
  viewStatus: "new" | "saved" | "rejected";
  isDark: boolean;
  onSave: (id: string) => void;
  onReject: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
};

// --- HELPER FUNCTIONS ---

const getSourceIcon = (sourceSite: string, isDark: boolean) => {
  if (sourceSite.includes("linkedin")) {
    return <Linkedin className="w-3.5 h-3.5 text-blue-500" />;
  }
  if (sourceSite.includes("indeed")) {
    return <Briefcase className="w-3.5 h-3.5 text-purple-500" />;
  }
  if (sourceSite.includes("glassdoor")) {
    return <Globe className="w-3.5 h-3.5 text-green-500" />;
  }
  return <Search className={`w-3.5 h-3.5 ${isDark ? "text-zinc-500" : "text-gray-500"}`} />;
};

const getSourceIconBg = (sourceSite: string, isDark: boolean) => {
  if (sourceSite.includes("linkedin")) {
    return "bg-blue-500/10 border-blue-500/20";
  }
  if (sourceSite.includes("indeed")) {
    return "bg-purple-500/10 border-purple-500/20";
  }
  if (sourceSite.includes("glassdoor")) {
    return "bg-green-500/10 border-green-500/20";
  }
  return isDark ? "bg-zinc-800 border-zinc-700" : "bg-gray-100 border-gray-200";
};

const getSourceBadgeClasses = (sourceSite: string, isDark: boolean) => {
  if (sourceSite.includes("linkedin")) {
    return "border-blue-500/20 text-blue-600 bg-blue-500/5";
  }
  return isDark
    ? "border-zinc-700 text-zinc-500 bg-zinc-800"
    : "border-gray-300 text-gray-500 bg-gray-100";
};

// --- JOB CARD COMPONENT ---

const JobCard = memo(function JobCard({
  job,
  viewStatus,
  isDark,
  onSave,
  onReject,
  onRestore,
  onDelete,
}: JobCardProps) {
  return (
    <div
      className={`group job-card flex items-start lg:items-center gap-2 lg:gap-4 p-2 lg:p-3 transition-all border-l-2 border-transparent hover:border-teal-500 ${
        isDark ? "hover:bg-zinc-900/40" : "hover:bg-gray-50"
      }`}
    >
      {/* Icon - Hidden on mobile */}
      <div
        className={`hidden lg:flex w-9 h-9 items-center justify-center rounded-lg border transition-colors flex-shrink-0 ${
          isDark
            ? "bg-zinc-900 border-zinc-800 text-zinc-500 group-hover:border-zinc-700"
            : "bg-gray-100 border-gray-200 text-gray-500 group-hover:border-gray-300"
        }`}
      >
        <Building2 className="w-4 h-4" />
      </div>

      {/* Mobile Layout - Minimal */}
      <div className="flex-1 min-w-0 lg:hidden">
        <div className="flex items-start gap-2">
          {/* Portal Icon */}
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 border ${getSourceIconBg(
              job.source_site,
              isDark
            )}`}
          >
            {getSourceIcon(job.source_site, isDark)}
          </div>
          <div className="flex-1 min-w-0">
            <h4
              className={`text-[12px] font-semibold truncate leading-tight ${
                isDark ? "text-zinc-200" : "text-gray-800"
              }`}
            >
              <button
                onClick={() => openUrl(job.job_url)}
                className="hover:underline text-left cursor-pointer"
              >
                {job.title}
              </button>
            </h4>
            <div
              className={`text-[10px] truncate mt-0.5 ${
                isDark ? "text-zinc-500" : "text-gray-500"
              }`}
            >
              {job.company || "Unknown Company"}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[10px] truncate max-w-[100px] ${
                  isDark ? "text-zinc-400" : "text-gray-600"
                }`}
              >
                {job.location || "Location N/A"}
              </span>
              {job.is_remote && (
                <span className="px-1 py-0.5 rounded bg-teal-500/10 text-teal-500 text-[8px] font-bold">
                  Remote
                </span>
              )}
            </div>
          </div>
          {/* Action Buttons - Icon only */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {viewStatus === "new" && (
              <>
                <button
                  onClick={() => onSave(job.id)}
                  aria-label={`Save job: ${job.title}`}
                  className={`btn-accept p-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    isDark
                      ? "text-emerald-400 hover:bg-emerald-900/40"
                      : "text-emerald-600 hover:bg-emerald-100"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onReject(job.id)}
                  aria-label={`Reject job: ${job.title}`}
                  className={`btn-reject p-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    isDark
                      ? "text-zinc-400 hover:text-orange-400 hover:bg-orange-900/40"
                      : "text-gray-400 hover:text-orange-600 hover:bg-orange-100"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}
            {viewStatus === "saved" && (
              <button
                onClick={() => onReject(job.id)}
                aria-label={`Move to rejected: ${job.title}`}
                className={`btn-icon p-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  isDark
                    ? "text-zinc-400 hover:bg-zinc-800"
                    : "text-gray-400 hover:bg-gray-100"
                }`}
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
            {viewStatus === "rejected" && (
              <button
                onClick={() => onRestore(job.id)}
                aria-label={`Restore job: ${job.title}`}
                className={`btn-icon p-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  isDark
                    ? "text-zinc-400 hover:bg-zinc-800"
                    : "text-gray-400 hover:bg-gray-100"
                }`}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(job.id)}
              aria-label={`Delete job: ${job.title}`}
              className={`btn-reject p-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                isDark
                  ? "text-red-400 hover:bg-red-900/40"
                  : "text-red-500 hover:bg-red-100"
              }`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Content - Compact Grid */}
      <div className="hidden lg:flex flex-1 min-w-0 grid-cols-12 gap-4 items-center">
        <div className="col-span-4 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={`text-sm font-bold truncate group-hover:text-teal-500 transition-colors ${
                isDark ? "text-zinc-200" : "text-gray-800"
              }`}
            >
              <button
                onClick={() => openUrl(job.job_url)}
                className="hover:underline text-left cursor-pointer"
              >
                {job.title}
              </button>
            </h4>
            {job.is_remote && (
              <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-500 border border-teal-500/20 text-[9px] font-bold uppercase">
                Remote
              </span>
            )}
          </div>
          <div
            className={`text-xs truncate mt-0.5 ${
              isDark ? "text-zinc-500" : "text-gray-500"
            }`}
          >
            {job.company || "Unknown Company"}
          </div>
        </div>

        <div
          className={`col-span-3 flex items-center gap-1.5 text-xs truncate ${
            isDark ? "text-zinc-400" : "text-gray-600"
          }`}
        >
          <MapPin
            className={`w-3 h-3 ${isDark ? "text-zinc-600" : "text-gray-400"}`}
          />
          <span className="truncate">{job.location || "Location N/A"}</span>
        </div>

        <div
          className={`col-span-2 flex items-center gap-1.5 text-xs ${
            isDark ? "text-zinc-500" : "text-gray-500"
          }`}
        >
          <Clock
            className={`w-3 h-3 ${isDark ? "text-zinc-700" : "text-gray-400"}`}
          />
          <span title={job.date_posted || "Recently posted"}>
            {job.date_posted || "Recently"}
          </span>
        </div>

        <div className="col-span-3 flex justify-end">
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getSourceBadgeClasses(
              job.source_site,
              isDark
            )}`}
          >
            {job.source_site}
          </span>
        </div>
      </div>

      {/* Desktop Actions */}
      <div
        className={`hidden lg:flex items-center gap-2 pl-4 border-l ${
          isDark ? "border-zinc-900" : "border-gray-200"
        }`}
      >
        {viewStatus === "new" && (
          <>
            <button
              onClick={() => onSave(job.id)}
              aria-label={`Save job: ${job.title}`}
              className={`btn-accept p-1.5 rounded shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                isDark
                  ? "bg-emerald-900/50 text-emerald-400 hover:bg-emerald-800 hover:text-white"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onReject(job.id)}
              aria-label={`Reject job: ${job.title}`}
              className={`btn-reject p-1.5 rounded shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                isDark
                  ? "bg-zinc-800 text-zinc-400 hover:bg-orange-900/50 hover:text-orange-400"
                  : "bg-gray-100 text-gray-500 hover:bg-orange-100 hover:text-orange-600"
              }`}
            >
              <XCircle className="w-4 h-4" />
            </button>
          </>
        )}
        {viewStatus === "saved" && (
          <button
            onClick={() => onReject(job.id)}
            aria-label={`Move to rejected: ${job.title}`}
            className={`btn-icon p-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
              isDark
                ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                : "bg-gray-200 text-gray-500 hover:bg-gray-300"
            }`}
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
        {viewStatus === "rejected" && (
          <button
            onClick={() => onRestore(job.id)}
            aria-label={`Restore job: ${job.title}`}
            className={`btn-icon p-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
              isDark
                ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                : "bg-gray-200 text-gray-500 hover:bg-gray-300"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(job.id)}
          aria-label={`Delete job: ${job.title}`}
          className={`btn-reject p-1.5 rounded shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
            isDark
              ? "bg-red-900/30 text-red-400 hover:bg-red-900 hover:text-white"
              : "bg-red-50 text-red-600 hover:bg-red-100"
          }`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

export default JobCard;
