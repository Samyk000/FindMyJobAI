"use client";

import React from "react";

interface SkeletonJobRowProps {
  isDark: boolean;
}

export default function SkeletonJobRow({ isDark }: SkeletonJobRowProps) {
  const shimmerStyle = {
    background: isDark 
      ? 'linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)'
      : 'linear-gradient(90deg, #e4e4e7 25%, #f4f4f5 50%, #e4e4e7 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s linear infinite',
  };

  return (
    <div className={`flex items-center gap-4 p-3 border-l-2 border-transparent ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
      {/* Icon skeleton */}
      <div className="w-9 h-9 rounded-lg flex-shrink-0" style={shimmerStyle}></div>
      
      {/* Content skeleton */}
      <div className="flex-1 grid grid-cols-12 gap-4 items-center">
        <div className="col-span-4 space-y-2">
          <div className="h-4 rounded w-3/4" style={shimmerStyle}></div>
          <div className="h-3 rounded w-1/2" style={shimmerStyle}></div>
        </div>
        <div className="col-span-2 h-3 rounded w-20" style={shimmerStyle}></div>
        <div className="col-span-2 h-3 rounded w-16" style={shimmerStyle}></div>
        <div className="col-span-2 h-3 rounded w-20" style={shimmerStyle}></div>
        <div className="col-span-2 h-5 rounded w-16 ml-auto" style={shimmerStyle}></div>
      </div>
    </div>
  );
}
