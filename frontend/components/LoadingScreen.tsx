"use client";

import React from "react";
import { Search } from "lucide-react";

interface LoadingScreenProps {
  isDark: boolean;
}

export default function LoadingScreen({ isDark }: LoadingScreenProps) {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center gap-6 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
      {/* Animated Logo Icon */}
      <div className="relative">
        <div className={`absolute inset-0 rounded-2xl blur-xl ${isDark ? 'bg-teal-500/20' : 'bg-teal-500/10'}`}></div>
        <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? 'bg-gradient-to-br from-teal-500 to-teal-600 shadow-teal-500/20' : 'bg-gradient-to-br from-teal-500 to-teal-600 shadow-teal-500/30'}`}>
          <Search className="w-7 h-7 text-white animate-pulse" />
        </div>
      </div>
      
      {/* Brand Name */}
      <div className="flex flex-col items-center gap-1">
        <h1 className={`text-2xl font-bold tracking-tight font-display ${isDark ? 'text-white' : 'text-gray-900'}`}>
          FindMyJob<span className="text-teal-500">AI</span>
        </h1>
        <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>AI-Powered Job Search</p>
      </div>
      
      {/* Loading Dots */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-teal-500 animate-[dotPulse_1.4s_ease-in-out_infinite]"></div>
        <div className="w-2 h-2 rounded-full bg-teal-500 animate-[dotPulse_1.4s_ease-in-out_0.2s_infinite]"></div>
        <div className="w-2 h-2 rounded-full bg-teal-500 animate-[dotPulse_1.4s_ease-in-out_0.4s_infinite]"></div>
      </div>
    </div>
  );
}
