"use client";

import React from "react";

// --- TYPES ---

export type EmptyStateType = 
  | "no-jobs" 
  | "no-saved" 
  | "no-rejected" 
  | "error" 
  | "ready-search"
  | "no-results";

type EmptyStateProps = {
  type: EmptyStateType;
  isDark: boolean;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

// --- MINIMAL ANIMATED SVG COMPONENTS ---

/**
 * No Jobs State - Minimal magnifying glass with subtle pulse
 */
function NoJobsSVG({ isDark }: { isDark: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28">
      <defs>
        <linearGradient id="searchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? "#2dd4bf" : "#14b8a6"} />
          <stop offset="100%" stopColor={isDark ? "#14b8a6" : "#0d9488"} />
        </linearGradient>
      </defs>
      
      {/* Outer ring - subtle pulse */}
      <circle 
        cx="50" cy="50" r="35" 
        fill="none" 
        stroke={isDark ? "#27272a" : "#e4e4e7"} 
        strokeWidth="1"
        className="animate-pulse"
        style={{ animationDuration: '3s' }}
      />
      
      {/* Main circle */}
      <circle 
        cx="50" cy="50" r="22" 
        fill="none" 
        stroke="url(#searchGradient)" 
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Handle */}
      <line 
        x1="66" y1="66" x2="85" y2="85" 
        stroke="url(#searchGradient)" 
        strokeWidth="2.5" 
        strokeLinecap="round"
      />
      
      {/* Inner dot */}
      <circle 
        cx="50" cy="50" r="4" 
        fill={isDark ? "#14b8a6" : "#0d9488"}
        className="animate-pulse"
        style={{ animationDuration: '2s' }}
      />
    </svg>
  );
}

/**
 * No Saved Jobs State - Minimal bookmark with heart
 */
function NoSavedSVG({ isDark }: { isDark: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28">
      <defs>
        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      
      {/* Bookmark outline */}
      <path
        d="M35 25 L35 85 L55 68 L75 85 L75 25"
        fill="none"
        stroke={isDark ? "#3f3f46" : "#d4d4d8"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Heart */}
      <path
        d="M55 50 C55 44 50 40 45 40 C40 40 36 44 36 50 C36 58 55 70 55 70 C55 70 74 58 74 50 C74 44 70 40 65 40 C60 40 55 44 55 50"
        fill="url(#heartGradient)"
        className="animate-pulse"
        style={{ animationDuration: '2s' }}
      />
    </svg>
  );
}

/**
 * No Rejected Jobs State - Minimal checkmark circle
 */
function NoRejectedSVG({ isDark }: { isDark: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28">
      <defs>
        <linearGradient id="checkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      
      {/* Outer circle */}
      <circle 
        cx="60" cy="60" r="35" 
        fill="none" 
        stroke={isDark ? "#27272a" : "#e4e4e7"} 
        strokeWidth="1.5"
      />
      
      {/* Inner circle with gradient */}
      <circle 
        cx="60" cy="60" r="28" 
        fill="none" 
        stroke="url(#checkGradient)" 
        strokeWidth="2"
        className="animate-pulse"
        style={{ animationDuration: '3s' }}
      />
      
      {/* Checkmark */}
      <path
        d="M45 60 L55 70 L77 48"
        fill="none"
        stroke="url(#checkGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Error State - Minimal warning triangle
 */
function ErrorSVG({ isDark }: { isDark: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28">
      <defs>
        <linearGradient id="warningGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      
      {/* Outer ring */}
      <circle 
        cx="60" cy="60" r="38" 
        fill="none" 
        stroke={isDark ? "#27272a" : "#e4e4e7"} 
        strokeWidth="1"
        strokeDasharray="4 4"
        className="animate-spin"
        style={{ animationDuration: '20s' }}
      />
      
      {/* Triangle */}
      <path
        d="M60 28 L95 85 L25 85 Z"
        fill="none"
        stroke="url(#warningGradient)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      {/* Exclamation mark */}
      <line 
        x1="60" y1="48" x2="60" y2="65" 
        stroke="url(#warningGradient)" 
        strokeWidth="3" 
        strokeLinecap="round"
      />
      <circle 
        cx="60" cy="74" r="2.5" 
        fill="url(#warningGradient)"
      />
    </svg>
  );
}

/**
 * Ready to Search State - Minimal play button
 */
function ReadySearchSVG({ isDark }: { isDark: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28">
      <defs>
        <linearGradient id="playGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? "#2dd4bf" : "#14b8a6"} />
          <stop offset="100%" stopColor={isDark ? "#14b8a6" : "#0d9488"} />
        </linearGradient>
      </defs>
      
      {/* Outer ring */}
      <circle 
        cx="60" cy="60" r="38" 
        fill="none" 
        stroke={isDark ? "#27272a" : "#e4e4e7"} 
        strokeWidth="1"
      />
      
      {/* Inner circle */}
      <circle 
        cx="60" cy="60" r="30" 
        fill={isDark ? "#18181b" : "#fafafa"} 
        stroke="url(#playGradient)" 
        strokeWidth="2"
      />
      
      {/* Play triangle */}
      <path
        d="M52 45 L52 75 L75 60 Z"
        fill="url(#playGradient)"
        className="animate-pulse"
        style={{ animationDuration: '2s' }}
      />
    </svg>
  );
}

/**
 * No Results State - Minimal filter/list
 */
function NoResultsSVG({ isDark }: { isDark: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28">
      <defs>
        <linearGradient id="filterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? "#2dd4bf" : "#14b8a6"} />
          <stop offset="100%" stopColor={isDark ? "#14b8a6" : "#0d9488"} />
        </linearGradient>
      </defs>
      
      {/* List lines */}
      <line x1="30" y1="40" x2="90" y2="40" stroke={isDark ? "#3f3f46" : "#d4d4d8"} strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="55" x2="90" y2="55" stroke={isDark ? "#3f3f46" : "#d4d4d8"} strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="70" x2="90" y2="70" stroke={isDark ? "#3f3f46" : "#d4d4d8"} strokeWidth="2" strokeLinecap="round" />
      
      {/* Filter icon */}
      <g transform="translate(70, 25)">
        <circle 
          cx="15" cy="15" r="14" 
          fill={isDark ? "#18181b" : "#fafafa"} 
          stroke="url(#filterGradient)" 
          strokeWidth="2"
        />
        {/* Funnel */}
        <path
          d="M8 10 L22 10 L18 18 L18 23 L12 23 L12 18 Z"
          fill="none"
          stroke="url(#filterGradient)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>
      
      {/* X mark */}
      <g className="animate-pulse" style={{ animationDuration: '2s' }}>
        <circle cx="35" cy="55" r="8" fill={isDark ? "#18181b" : "#fafafa"} stroke="#ef4444" strokeWidth="1.5" />
        <line x1="32" y1="52" x2="38" y2="58" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="38" y1="52" x2="32" y2="58" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// --- CONTENT CONFIG ---

const EMPTY_STATE_CONTENT: Record<EmptyStateType, { defaultTitle: string; defaultDescription: string }> = {
  "no-jobs": {
    defaultTitle: "No Jobs Found",
    defaultDescription: "Start a new search to discover opportunities",
  },
  "no-saved": {
    defaultTitle: "No Saved Jobs",
    defaultDescription: "Jobs you save will appear here",
  },
  "no-rejected": {
    defaultTitle: "No Rejected Jobs",
    defaultDescription: "Your queue is clean",
  },
  "error": {
    defaultTitle: "Connection Error",
    defaultDescription: "Unable to connect. Please try again.",
  },
  "ready-search": {
    defaultTitle: "Ready to Search",
    defaultDescription: "Configure your search and click Fetch",
  },
  "no-results": {
    defaultTitle: "No Matching Results",
    defaultDescription: "Try adjusting your filters",
  },
};

// --- MAIN COMPONENT ---

export default function EmptyState({ 
  type, 
  isDark, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  const content = EMPTY_STATE_CONTENT[type];
  const displayTitle = title || content.defaultTitle;
  const displayDescription = description || content.defaultDescription;

  const renderSVG = () => {
    switch (type) {
      case "no-jobs":
        return <NoJobsSVG isDark={isDark} />;
      case "no-saved":
        return <NoSavedSVG isDark={isDark} />;
      case "no-rejected":
        return <NoRejectedSVG isDark={isDark} />;
      case "error":
        return <ErrorSVG isDark={isDark} />;
      case "ready-search":
        return <ReadySearchSVG isDark={isDark} />;
      case "no-results":
        return <NoResultsSVG isDark={isDark} />;
      default:
        return <NoJobsSVG isDark={isDark} />;
    }
  };

  return (
    <div 
      className="empty-state-enter flex flex-col items-center justify-center h-full py-12 px-4"
      role="status"
      aria-live="polite"
      aria-label={displayTitle}
    >
      {/* Animated SVG */}
      <div className="empty-state-icon mb-5 opacity-80">
        {renderSVG()}
      </div>
      
      {/* Title */}
      <h3 className={`text-base font-semibold text-center mb-1.5 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
        {displayTitle}
      </h3>
      
      {/* Description */}
      <p className={`text-sm text-center max-w-xs ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
        {displayDescription}
      </p>
      
      {/* Optional Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className={`btn-primary mt-5 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
            isDark 
              ? 'bg-teal-600 text-white' 
              : 'bg-teal-500 text-white'
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
