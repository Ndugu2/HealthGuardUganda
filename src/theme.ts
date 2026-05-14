/**
 * HealthGuard Uganda — Design Token System
 *
 * Single source of truth for all visual constants.
 * Import `theme` anywhere to access colors, spacing, typography, etc.
 */

// ── Color Palette ────────────────────────────────────────────────────────────

// ── Color Palette (Refined Premium) ──────────────────────────────────────────

export const colors = {
  primary: {
    50:  '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  danger: {
    50:  '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  warning: {
    50:  '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    800: '#92400E',
    900: '#78350F',
  },
  accent: {
    emerald: '#10B981',
    indigo:  '#6366F1',
    violet:  '#8B5CF6',
    rose:    '#F43F5E',
    sky:     '#0EA5E9',
  },
  neutral: {
    0:   '#FFFFFF',
    50:  '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  surface: '#FFFFFF',
  background: '#F9FAFB',
  glass: 'rgba(255, 255, 255, 0.7)',
};

export const darkColors = {
  ...colors,
  neutral: {
    0:   '#030712',
    50:  '#111827',
    100: '#1F2937',
    200: '#374151',
    300: '#4B5563',
    400: '#6B7280',
    500: '#9CA3AF',
    600: '#D1D5DB',
    700: '#E5E7EB',
    800: '#F3F4F6',
    900: '#FFFFFF',
  },
  surface: '#111827',
  background: '#030712',
  glass: 'rgba(17, 24, 39, 0.7)',
};

// ── Spacing Scale ────────────────────────────────────────────────────────────

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

// ── Border Radii ─────────────────────────────────────────────────────────────

export const radii = {
  sm:   8,
  md:   12,
  lg:   20,
  xl:   28,
  full: 9999,
} as const;

// ── Shadows (Premium Multi-Layered) ──────────────────────────────────────────

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  }
} as const;

// ── Gradient Presets (Ultra-Smooth) ──────────────────────────────────────────

export const gradients = {
  primary: ['#059669', '#10B981'],
  danger:  ['#DC2626', '#EF4444'],
  warning: ['#D97706', '#F59E0B'],
  info:    ['#2563EB', '#3B82F6'],
  surface: ['#FFFFFF', '#F9FAFB'],
  darkSurface: ['#111827', '#1F2937'],
};

// ── Topic Colors ─────────────────────────────────────────────────────────────

export const topicColors: Record<string, { bg: string; text: string; accent: string }> = {
  vaccination: { bg: '#DBEAFE', text: '#1E40AF', accent: '#3B82F6' },
  malaria:     { bg: '#D1FAE5', text: '#065F46', accent: '#10B981' },
  hiv:         { bg: '#F3E8FF', text: '#6B21A8', accent: '#8B5CF6' },
  maternal:    { bg: '#FCE7F3', text: '#9D174D', accent: '#EC4899' },
  covid:       { bg: '#FEF3C7', text: '#92400E', accent: '#F59E0B' },
  general:     { bg: '#F3F4F6', text: '#374151', accent: '#6B7280' },
};

const theme = {
  colors,
  topicColors,
  spacing,
  radii,
  shadows,
  gradients,
};

export default theme;
