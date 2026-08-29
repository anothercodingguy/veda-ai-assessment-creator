"use client";

import React from "react";

export function SparkleExtractingIcon() {
  return (
    <div className="extracting-starburst-wrapper">
      <div className="starburst-glow-aura" />
      <svg className="starburst-svg" width="96" height="96" viewBox="0 0 96 96" fill="none">
        {/* Ambient Glow / Secondary Starlets */}
        <circle cx="28" cy="46" r="4.5" fill="#ff7a50" className="star-dot-1" />
        <circle cx="72" cy="54" r="3.5" fill="#ff9977" className="star-dot-2" />
        
        {/* Main 4-point Diamond Star (Top/Center) */}
        <path
          d="M52 14 C52 28, 62 38, 76 38 C62 38, 52 48, 52 62 C52 48, 42 38, 28 38 C42 38, 52 28, 52 14 Z"
          fill="url(#starGrad1)"
          className="star-main"
        />

        {/* Smaller Secondary 4-point Diamond Star (Bottom/Left) */}
        <path
          d="M36 48 C36 56, 42 62, 50 62 C42 62, 36 68, 36 76 C36 68, 30 62, 22 62 C30 62, 36 56, 36 48 Z"
          fill="url(#starGrad2)"
          className="star-sub"
        />

        {/* Tiny Accent Star (Right) */}
        <path
          d="M68 52 C68 55, 71 58, 74 58 C71 58, 68 61, 68 64 C68 61, 65 58, 62 58 C65 58, 68 55, 68 52 Z"
          fill="#ffaa8d"
          className="star-accent"
        />

        <defs>
          <linearGradient id="starGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff5028" />
            <stop offset="50%" stopColor="#ff7043" />
            <stop offset="100%" stopColor="#ff9a70" />
          </linearGradient>
          <linearGradient id="starGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff451a" />
            <stop offset="100%" stopColor="#ff855e" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
