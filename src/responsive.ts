/**
 * HealthGuard Uganda — Responsive Utilities
 *
 * Single source of truth for all screen-size adaptations.
 * Import and use in every screen / component for consistent
 * phone → tablet → desktop behaviour.
 *
 * Usage:
 *   import { rs, rf, rp, useResponsive } from '../responsive';
 *
 *   // Inside a component:
 *   const { isPhone, isTablet, rs, rf, rp } = useResponsive();
 *   <Text style={{ fontSize: rf(16) }}>Hello</Text>
 *
 *   // In a StyleSheet (static — uses current Dimensions snapshot):
 *   fontSize: rs(16)   // scales relative to 375-wide baseline
 */

import { Dimensions, useWindowDimensions } from 'react-native';

// ── Breakpoints ───────────────────────────────────────────────────────────────

export const BREAKPOINTS = {
  phone:   0,      // < 480
  tablet:  480,    // 480 – 900
  desktop: 900,    // > 900
} as const;

// ── Baseline design width (matches Figma / design reference) ──────────────────
const BASE_WIDTH = 375; // iPhone 14 logical width

// ─────────────────────────────────────────────────────────────────────────────
//  Static helpers  (use inside StyleSheet.create — they read Dimensions once)
// ─────────────────────────────────────────────────────────────────────────────

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/** Responsive size — scales a value proportionally to screen width. */
export function rs(size: number, minSize?: number, maxSize?: number): number {
  const scaled = (SCREEN_W / BASE_WIDTH) * size;
  if (minSize !== undefined && scaled < minSize) return minSize;
  if (maxSize !== undefined && scaled > maxSize) return maxSize;
  return Math.round(scaled);
}

/** Responsive font — like rs() but clamped to reasonable text range. */
export function rf(size: number): number {
  return rs(size, size * 0.8, size * 1.4);
}

/** Responsive padding/margin — same as rs but with safe minimum. */
export function rp(size: number): number {
  return rs(size, 4);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Reactive hook  (use inside components — re-renders on rotation / resize)
// ─────────────────────────────────────────────────────────────────────────────

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isPhone   = width < BREAKPOINTS.tablet;
  const isTablet  = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;

  /** Scale a size proportionally to current screen width. */
  function rs(size: number, minSize?: number, maxSize?: number): number {
    const scaled = (width / BASE_WIDTH) * size;
    if (minSize !== undefined && scaled < minSize) return minSize;
    if (maxSize !== undefined && scaled > maxSize) return maxSize;
    return Math.round(scaled);
  }

  /** Responsive font, clamped to ±20 % of base size. */
  function rf(size: number): number {
    return rs(size, size * 0.8, size * 1.4);
  }

  /** Responsive padding / margin. */
  function rp(size: number): number {
    return rs(size, 4);
  }

  /**
   * Pick a value based on current breakpoint.
   * Usage: bp({ phone: 12, tablet: 16, desktop: 20 })
   */
  function bp<T>(values: { phone: T; tablet?: T; desktop?: T }): T {
    if (isDesktop && values.desktop !== undefined) return values.desktop;
    if (isTablet  && values.tablet  !== undefined) return values.tablet;
    return values.phone;
  }

  /** Horizontal padding that respects large screens (centered content). */
  const hPad = bp({ phone: 12, tablet: 24, desktop: 48 });

  /** Max content width for desktop-centred layouts. */
  const maxWidth = isDesktop ? 960 : width;

  /** Column count for grid layouts. */
  const columns = bp({ phone: 1, tablet: 2, desktop: 3 });

  /** Card height multiplier (shrink on small phones). */
  const heroHeight = bp({ phone: 180, tablet: 280, desktop: 380 });

  return {
    width,
    height,
    isPhone,
    isTablet,
    isDesktop,
    hPad,
    maxWidth,
    columns,
    heroHeight,
    rs,
    rf,
    rp,
    bp,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Responsive Typography Scale
//  Use these in StyleSheet.create for consistent text across all screens.
// ─────────────────────────────────────────────────────────────────────────────

export const typography = {
  /** Extra-large display heading */
  display:    { fontSize: rf(32), fontWeight: '900' as const, lineHeight: rf(40) },
  /** Screen-level heading */
  h1:         { fontSize: rf(26), fontWeight: '800' as const, lineHeight: rf(34) },
  /** Section heading */
  h2:         { fontSize: rf(20), fontWeight: '800' as const, lineHeight: rf(28) },
  /** Card/widget title */
  h3:         { fontSize: rf(16), fontWeight: '700' as const, lineHeight: rf(24) },
  /** Body text */
  body:       { fontSize: rf(14), fontWeight: '500' as const, lineHeight: rf(22) },
  /** Small body / secondary text */
  bodySmall:  { fontSize: rf(13), fontWeight: '500' as const, lineHeight: rf(20) },
  /** Caption / label */
  caption:    { fontSize: rf(11), fontWeight: '700' as const, lineHeight: rf(16) },
  /** Tiny label / badge */
  micro:      { fontSize: rf(10), fontWeight: '800' as const, lineHeight: rf(14) },
  /** Button text */
  button:     { fontSize: rf(15), fontWeight: '800' as const },
  /** Numeric stat value */
  stat:       { fontSize: rf(28), fontWeight: '900' as const },
};

// ─────────────────────────────────────────────────────────────────────────────
//  Responsive Spacing helpers
// ─────────────────────────────────────────────────────────────────────────────

export const rspacing = {
  xs:  rp(4),
  sm:  rp(8),
  md:  rp(14),
  lg:  rp(20),
  xl:  rp(28),
  xxl: rp(40),
};
