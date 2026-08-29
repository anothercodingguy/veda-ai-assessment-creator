"use client";

import React from "react";

export function TeacherIllustration() {
  return (
    <div className="teacher-illustration-wrapper">
      <div className="teacher-orbit-ring ring-outer" />
      <div className="teacher-orbit-ring ring-inner" />
      
      {/* Planetary / Floating Badges */}
      <div className="orbit-badge badge-top">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        </svg>
      </div>
      <div className="orbit-badge badge-right">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </div>
      <div className="orbit-badge badge-bottom">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </svg>
      </div>
      <div className="orbit-badge badge-left">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>

      {/* Teacher Avatar Graphic */}
      <div className="teacher-avatar-circle">
        <svg width="76" height="76" viewBox="0 0 80 80" fill="none">
          <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="100%" stopColor="#ffede5" />
            </linearGradient>
            <linearGradient id="suitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2b2d42" />
              <stop offset="100%" stopColor="#1e1f2f" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="38" fill="url(#bgGrad)" />
          
          {/* Hair back */}
          <path d="M24 36 C24 20, 56 20, 56 36 C56 46, 54 52, 54 52 C50 50, 48 44, 48 44 L32 44 C32 44, 30 50, 26 52 C26 52, 24 46, 24 36 Z" fill="#2d1e18" />
          
          {/* Head & Neck */}
          <rect x="36" y="38" width="8" height="10" rx="3" fill="#fcd5b5" />
          <ellipse cx="40" cy="30" rx="10" ry="12" fill="#fcd5b5" />
          
          {/* Hair front */}
          <path d="M28 28 C28 20, 52 18, 52 28 C48 24, 42 24, 40 26 C36 24, 32 25, 28 28 Z" fill="#3a2720" />
          <path d="M28 28 C29 34, 31 38, 32 40 C31 34, 30 30, 28 28 Z" fill="#3a2720" />
          <path d="M52 28 C51 34, 49 38, 48 40 C49 34, 50 30, 52 28 Z" fill="#3a2720" />
          
          {/* Glasses */}
          <rect x="33" y="27" width="6" height="4.5" rx="1.5" fill="none" stroke="#222" strokeWidth="1.2" />
          <rect x="41" y="27" width="6" height="4.5" rx="1.5" fill="none" stroke="#222" strokeWidth="1.2" />
          <line x1="39" y1="29" x2="41" y2="29" stroke="#222" strokeWidth="1.2" />
          
          {/* Eyes & Smile */}
          <circle cx="36" cy="29" r="0.9" fill="#222" />
          <circle cx="44" cy="29" r="0.9" fill="#222" />
          <path d="M37.5 35 Q40 37.5 42.5 35" stroke="#d96b6b" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          
          {/* Torso & Suit */}
          <path d="M22 68 C22 52, 30 46, 40 46 C50 46, 58 52, 58 68 Z" fill="url(#suitGrad)" />
          {/* Shirt */}
          <polygon points="40,46 35,58 45,58" fill="#ffffff" />
          {/* Inner collar */}
          <polygon points="40,53 37,46 43,46" fill="#fcd5b5" />
          
          {/* Folder/Tablet */}
          <rect x="32" y="55" width="16" height="15" rx="2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <line x1="35" y1="59" x2="45" y2="59" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
          <line x1="35" y1="62" x2="43" y2="62" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
          <line x1="35" y1="65" x2="41" y2="65" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
