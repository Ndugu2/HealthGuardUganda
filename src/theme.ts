/**
 * HealthGuard Uganda — Design Token System
 *
 * Single source of truth for all visual constants.
 * Import `theme` anywhere to access colors, spacing, typography, etc.
 */

// ── Color Palette ────────────────────────────────────────────────────────────

export const colors = {
  primary: {
    50:  '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },
  danger: {
    50:  '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    600: '#E53935',
    800: '#C62828',
    900: '#B71C1C',
  },
  warning: {
    50:  '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    600: '#FB8C00',
    800: '#EF6C00',
    900: '#E65100',
  },
  accent: {
    amber:  '#F9A825',
    teal:   '#00897B',
    purple: '#7B1FA2',
    blue:   '#1565C0',
    indigo: '#283593',
  },
  neutral: {
    0:   '#FFFFFF',
    50:  '#F8F9FA',
    100: '#F1F3F5',
    200: '#E9ECEF',
    300: '#DEE2E6',
    400: '#CED4DA',
    500: '#ADB5BD',
    600: '#868E96',
    700: '#495057',
    800: '#343A40',
    900: '#212529',
  },
  surface: '#FFFFFF',
  background: '#F8F9FA',
};

export const darkColors = {
  ...colors,
  neutral: {
    0:   '#121212',
    50:  '#1E1E1E',
    100: '#2C2C2C',
    200: '#383838',
    300: '#484848',
    400: '#5C5C5C',
    500: '#7B8187',
    600: '#ADB5BD',
    700: '#DEE2E6',
    800: '#F1F3F5',
    900: '#FFFFFF',
  },
  surface: '#1E1E1E',
  background: '#121212',
};

// ── Topic Colors (for Knowledge Base chips / accents) ────────────────────────

export const topicColors: Record<string, { bg: string; text: string; accent: string }> = {
  vaccination: { bg: '#E3F2FD', text: '#1565C0', accent: '#1565C0' },
  malaria:     { bg: '#E0F2F1', text: '#00695C', accent: '#00897B' },
  hiv:         { bg: '#F3E5F5', text: '#6A1B9A', accent: '#7B1FA2' },
  maternal:    { bg: '#FCE4EC', text: '#AD1457', accent: '#C2185B' },
  covid:       { bg: '#FFF3E0', text: '#E65100', accent: '#EF6C00' },
  nutrition:   { bg: '#F1F8E9', text: '#33691E', accent: '#558B2F' },
  sanitation:  { bg: '#E0F7FA', text: '#00838F', accent: '#0097A7' },
  general:     { bg: '#ECEFF1', text: '#37474F', accent: '#546E7A' },
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
  lg:   16,
  xl:   24,
  full: 9999,
} as const;

// ── Shadows ──────────────────────────────────────────────────────────────────

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// ── Gradient Presets ─────────────────────────────────────────────────────────

export const gradients = {
  primaryHeader: ['#1B5E20', '#2E7D32', '#43A047'],
  primarySoft:   ['#2E7D32', '#388E3C'],
  dangerSoft:    ['#C62828', '#E53935'],
  warningSoft:   ['#EF6C00', '#FB8C00'],
  surface:       ['#FFFFFF', '#F5F5F5'],
};

// ── Bundled Theme Object ─────────────────────────────────────────────────────

const theme = {
  colors,
  topicColors,
  spacing,
  radii,
  shadows,
  gradients,
};

export default theme;
