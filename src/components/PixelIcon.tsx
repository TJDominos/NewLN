import React from 'react';

export type IconName = 'cherry' | 'banana' | 'lemon' | 'orange' | 'grape' | 'strawberry' | 'apple' | 'watermelon' | 'star' | 'five' | 'wild';

export const PixelIcon = ({ name, className = '', size = 64 }: { name: IconName, className?: string, size?: number }) => {
  const renderIcon = () => {
    switch (name) {
      case 'cherry':
        return (
          <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
            <defs>
              <radialGradient id="cherryGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ff8a8a" />
                <stop offset="50%" stopColor="#e60000" />
                <stop offset="100%" stopColor="#8a0000" />
              </radialGradient>
              <linearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#166534" />
              </linearGradient>
            </defs>
            <path d="M 50 15 Q 60 40 35 60" fill="none" stroke="url(#stemGrad)" strokeWidth="4" strokeLinecap="round" />
            <path d="M 50 15 Q 70 30 75 55" fill="none" stroke="url(#stemGrad)" strokeWidth="4" strokeLinecap="round" />
            <path d="M 45 15 Q 50 10 55 15" fill="none" stroke="url(#stemGrad)" strokeWidth="6" strokeLinecap="round" />
            <circle cx="35" cy="70" r="22" fill="url(#cherryGrad)" stroke="#5c0000" strokeWidth="2" />
            <circle cx="75" cy="65" r="22" fill="url(#cherryGrad)" stroke="#5c0000" strokeWidth="2" />
            <ellipse cx="28" cy="63" rx="6" ry="3" fill="#ffffff" opacity="0.6" transform="rotate(-30 28 63)" />
            <ellipse cx="68" cy="58" rx="6" ry="3" fill="#ffffff" opacity="0.6" transform="rotate(-30 68 58)" />
          </svg>
        );
      case 'lemon':
        return (
          <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
            <defs>
              <radialGradient id="lemonGrad" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#ffff99" />
                <stop offset="60%" stopColor="#ffcc00" />
                <stop offset="100%" stopColor="#cc9900" />
              </radialGradient>
            </defs>
            <path d="M 80 20 C 90 30 90 60 70 80 C 50 100 20 100 10 90 C 0 80 0 50 20 30 C 40 10 70 10 80 20 Z" fill="url(#lemonGrad)" stroke="#b38600" strokeWidth="2" />
            <path d="M 50 10 Q 60 5 70 15 Q 55 20 50 10" fill="#4ade80" stroke="#166534" strokeWidth="1" />
            <ellipse cx="35" cy="35" rx="10" ry="5" fill="#ffffff" opacity="0.5" transform="rotate(-45 35 35)" />
          </svg>
        );
      case 'orange':
        return (
          <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
            <defs>
              <radialGradient id="orangeGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ffb366" />
                <stop offset="60%" stopColor="#ff8000" />
                <stop offset="100%" stopColor="#cc4400" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="55" r="35" fill="url(#orangeGrad)" stroke="#b33c00" strokeWidth="2" />
            <path d="M 50 20 Q 65 5 80 15 Q 65 30 50 20" fill="#4ade80" stroke="#166534" strokeWidth="1" />
            <circle cx="45" cy="25" r="2" fill="#cc4400" opacity="0.5" />
            <circle cx="35" cy="40" r="2" fill="#cc4400" opacity="0.5" />
            <circle cx="65" cy="35" r="2" fill="#cc4400" opacity="0.5" />
            <circle cx="55" cy="75" r="2" fill="#cc4400" opacity="0.5" />
            <ellipse cx="35" cy="40" rx="8" ry="4" fill="#ffffff" opacity="0.4" transform="rotate(-30 35 40)" />
          </svg>
        );
      case 'grape':
        return (
          <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
            <defs>
              <radialGradient id="grapeGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#d8b3ff" />
                <stop offset="50%" stopColor="#8000ff" />
                <stop offset="100%" stopColor="#330066" />
              </radialGradient>
            </defs>
            <path d="M 50 15 Q 60 5 75 15 Q 60 25 50 15" fill="#4ade80" stroke="#166534" strokeWidth="1" />
            <path d="M 50 15 Q 40 20 45 30" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round" />
            {[
              [40, 35], [60, 35],
              [30, 50], [50, 50], [70, 50],
              [40, 65], [60, 65],
              [50, 80]
            ].map(([cx, cy], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="14" fill="url(#grapeGrad)" stroke="#26004d" strokeWidth="1" />
                <circle cx={cx - 4} cy={cy - 4} r="3" fill="#ffffff" opacity="0.5" />
              </g>
            ))}
          </svg>
        );
      case 'strawberry':
        return (
          <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
            <defs>
              <radialGradient id="strawGrad" cx="40%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ff6666" />
                <stop offset="60%" stopColor="#e60000" />
                <stop offset="100%" stopColor="#800000" />
              </radialGradient>
            </defs>
            <path d="M 50 90 C 20 70 15 40 25 25 C 35 10 65 10 75 25 C 85 40 80 70 50 90 Z" fill="url(#strawGrad)" stroke="#660000" strokeWidth="2" />
            <path d="M 35 20 Q 50 30 65 20 Q 55 10 50 5 Q 45 10 35 20 Z" fill="#4ade80" stroke="#166534" strokeWidth="1" />
            <path d="M 25 25 Q 40 35 50 20 Z" fill="#4ade80" stroke="#166534" strokeWidth="1" />
            <path d="M 75 25 Q 60 35 50 20 Z" fill="#4ade80" stroke="#166534" strokeWidth="1" />
            {[
              [40, 40], [60, 40], [50, 55], [35, 60], [65, 60], [50, 75]
            ].map(([cx, cy], i) => (
              <ellipse key={i} cx={cx} cy={cy} rx="2" ry="3" fill="#ffff99" />
            ))}
            <ellipse cx="35" cy="40" rx="6" ry="12" fill="#ffffff" opacity="0.3" transform="rotate(-20 35 40)" />
          </svg>
        );
      case 'apple':
        return (
          <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
            <defs>
              <radialGradient id="appleGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ff8080" />
                <stop offset="50%" stopColor="#cc0000" />
                <stop offset="100%" stopColor="#660000" />
              </radialGradient>
            </defs>
            <path d="M 50 25 C 30 15 10 30 15 55 C 20 80 40 90 50 85 C 60 90 80 80 85 55 C 90 30 70 15 50 25 Z" fill="url(#appleGrad)" stroke="#4d0000" strokeWidth="2" />
            <path d="M 50 25 Q 45 15 55 5" fill="none" stroke="#663300" strokeWidth="4" strokeLinecap="round" />
            <path d="M 55 5 Q 70 5 75 20 Q 60 20 55 5 Z" fill="#4ade80" stroke="#166534" strokeWidth="1" />
            <ellipse cx="30" cy="45" rx="8" ry="18" fill="#ffffff" opacity="0.4" transform="rotate(-20 30 45)" />
          </svg>
        );
      case 'watermelon':
        return (
          <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
            <defs>
              <linearGradient id="melonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ff4d4d" />
                <stop offset="70%" stopColor="#cc0000" />
                <stop offset="90%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#00cc44" />
              </linearGradient>
            </defs>
            <path d="M 10 30 A 40 40 0 0 0 90 30 Z" fill="url(#melonGrad)" stroke="#006622" strokeWidth="3" transform="translate(0, 20)" />
            <g transform="translate(0, 20)">
              {[
                [30, 45], [50, 45], [70, 45],
                [40, 55], [60, 55],
                [50, 65]
              ].map(([cx, cy], i) => (
                <ellipse key={i} cx={cx} cy={cy} rx="2" ry="3" fill="#330000" />
              ))}
            </g>
          </svg>
        );
      case 'star':
        return (
          <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
            <defs>
              <radialGradient id="starGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#ffe600" />
                <stop offset="100%" stopColor="#cc9900" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path d="M 50 5 L 61 35 L 95 35 L 67 55 L 78 85 L 50 65 L 22 85 L 33 55 L 5 35 L 39 35 Z" fill="url(#starGrad)" stroke="#ffcc00" strokeWidth="2" filter="url(#glow)" />
          </svg>
        );
      case 'banana':
        return (
          <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
            <defs>
              <linearGradient id="bananaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffff66" />
                <stop offset="50%" stopColor="#ffcc00" />
                <stop offset="100%" stopColor="#cc9900" />
              </linearGradient>
            </defs>
            <path d="M 20 80 C 40 90 80 80 90 40 C 95 20 80 10 75 15 C 70 20 80 60 40 70 C 20 75 10 60 15 50 C 10 60 10 75 20 80 Z" fill="url(#bananaGrad)" stroke="#997300" strokeWidth="2" />
            <path d="M 75 15 L 80 10 L 85 15" fill="none" stroke="#4d3900" strokeWidth="3" strokeLinecap="round" />
            <path d="M 15 80 L 20 85" fill="none" stroke="#4d3900" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      case 'five':
        return (
          <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
            <defs>
              <linearGradient id="fiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff4d4d" />
                <stop offset="50%" stopColor="#cc0000" />
                <stop offset="100%" stopColor="#660000" />
              </linearGradient>
              <linearGradient id="goldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffe600" />
                <stop offset="50%" stopColor="#ffaa00" />
                <stop offset="100%" stopColor="#cc6600" />
              </linearGradient>
              <filter id="fiveGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path d="M 30 20 L 75 20 L 70 40 L 45 40 L 40 50 C 55 45 75 50 75 70 C 75 90 45 95 25 80 L 35 65 C 45 75 55 75 55 65 C 55 55 40 55 30 60 Z" fill="url(#fiveGrad)" stroke="url(#goldStroke)" strokeWidth="3" strokeLinejoin="round" filter="url(#fiveGlow)" />
          </svg>
        );
      case 'wild':
        return (
          <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
            <defs>
              <linearGradient id="wildGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="50%" stopColor="#ff8c00" />
                <stop offset="100%" stopColor="#ff0000" />
              </linearGradient>
            </defs>
            <rect x="10" y="25" width="80" height="50" rx="10" fill="url(#wildGrad)" stroke="#fff" strokeWidth="4" />
            <text x="50" y="58" fontFamily="Arial, sans-serif" fontSize="32" fontWeight="900" fill="#fff" textAnchor="middle" letterSpacing="2">WILD</text>
            <circle cx="20" cy="35" r="4" fill="#fff" opacity="0.8" />
            <circle cx="80" cy="65" r="4" fill="#fff" opacity="0.8" />
          </svg>
        );
      default:
        return null;
    }
  };

  return renderIcon();
};
