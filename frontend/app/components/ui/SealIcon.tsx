/**
 * SealIcon — The LumenLock signature dual-confirmation motif.
 *
 * Three modes:
 *  - variant="animated"  Hero entrance: two arcs slide in and lock together
 *  - variant="loading"   Orbiting arcs as loading indicator
 *  - variant="static"    Dimmed / empty-state placeholder
 */

import React from 'react';

interface SealIconProps {
  variant?: 'animated' | 'loading' | 'static';
  size?: number;
  className?: string;
}

export function SealIcon({ variant = 'static', size = 80, className = '' }: SealIconProps) {
  const r = size * 0.5;
  const cx = r;
  const cy = r;
  const arcR = size * 0.36;
  const strokeW = size * 0.055;

  if (variant === 'loading') {
    const orbitR = size * 0.3;
    const dotR = size * 0.07;
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        aria-label="Loading"
        className={className}
      >
        {/* Outer ring */}
        <circle
          cx={cx}
          cy={cy}
          r={orbitR}
          stroke="var(--color-trust-soft)"
          strokeWidth={strokeW * 0.5}
          strokeDasharray="3 4"
        />
        {/* Orbiting group */}
        <g className="seal-loading-outer" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <circle
            cx={cx + orbitR}
            cy={cy}
            r={dotR}
            fill="var(--color-trust)"
            opacity={0.8}
          />
        </g>
        {/* Counter-orbiting group */}
        <g className="seal-loading-inner" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <circle
            cx={cx - orbitR}
            cy={cy}
            r={dotR * 0.7}
            fill="var(--color-accent)"
            opacity={0.8}
          />
        </g>
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={dotR * 0.4} fill="var(--color-trust)" opacity={0.3} />
      </svg>
    );
  }

  if (variant === 'animated') {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        aria-hidden="true"
        className={className}
      >
        {/* Left arc — slides in from left */}
        <g className="seal-left-arc seal-lock-pulse" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <path
            d={`M ${cx - arcR * 0.15} ${cy - arcR}
                A ${arcR} ${arcR} 0 0 0 ${cx - arcR * 0.15} ${cy + arcR}`}
            stroke="var(--color-trust)"
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
          <circle cx={cx - arcR * 0.15} cy={cy - arcR} r={strokeW * 0.8} fill="var(--color-trust)" />
          <circle cx={cx - arcR * 0.15} cy={cy + arcR} r={strokeW * 0.8} fill="var(--color-trust)" />
        </g>

        {/* Right arc — slides in from right */}
        <g className="seal-right-arc seal-lock-pulse" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <path
            d={`M ${cx + arcR * 0.15} ${cy - arcR}
                A ${arcR} ${arcR} 0 0 1 ${cx + arcR * 0.15} ${cy + arcR}`}
            stroke="var(--color-accent)"
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
          <circle cx={cx + arcR * 0.15} cy={cy - arcR} r={strokeW * 0.8} fill="var(--color-accent)" />
          <circle cx={cx + arcR * 0.15} cy={cy + arcR} r={strokeW * 0.8} fill="var(--color-accent)" />
        </g>

        {/* Center lock body (appears after lock) */}
        <g className="seal-lock-pulse" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <rect
            x={cx - size * 0.085}
            y={cy - size * 0.06}
            width={size * 0.17}
            height={size * 0.13}
            rx={size * 0.025}
            fill="var(--color-trust)"
            opacity={0.12}
          />
        </g>
      </svg>
    );
  }

  // Static / dimmed
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d={`M ${cx - arcR * 0.15} ${cy - arcR}
            A ${arcR} ${arcR} 0 0 0 ${cx - arcR * 0.15} ${cy + arcR}`}
        stroke="var(--color-border-strong)"
        strokeWidth={strokeW}
        strokeLinecap="round"
      />
      <circle cx={cx - arcR * 0.15} cy={cy - arcR} r={strokeW * 0.8} fill="var(--color-border-strong)" />
      <circle cx={cx - arcR * 0.15} cy={cy + arcR} r={strokeW * 0.8} fill="var(--color-border-strong)" />

      <path
        d={`M ${cx + arcR * 0.15} ${cy - arcR}
            A ${arcR} ${arcR} 0 0 1 ${cx + arcR * 0.15} ${cy + arcR}`}
        stroke="var(--color-surface-raised)"
        strokeWidth={strokeW}
        strokeLinecap="round"
      />
      <circle cx={cx + arcR * 0.15} cy={cy - arcR} r={strokeW * 0.8} fill="var(--color-surface-raised)" />
      <circle cx={cx + arcR * 0.15} cy={cy + arcR} r={strokeW * 0.8} fill="var(--color-surface-raised)" />
    </svg>
  );
}
