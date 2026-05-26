/**
 * Color Palette for StudyGenie AI
 * Modern, professional purple and gradient theme
 */

export const COLORS = {
  // Primary Colors
  primary: "#6366F1", // Indigo
  primaryLight: "#818CF8",
  primaryDark: "#4F46E5",

  // Secondary Colors
  secondary: "#8B5CF6", // Purple
  secondaryLight: "#A78BFA",
  secondaryDark: "#7C3AED",

  // Gradient Colors
  gradientStart: "#6366F1",
  gradientEnd: "#8B5CF6",

  // Neutral Colors
  white: "#FFFFFF",
  black: "#000000",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  // Status Colors
  success: "#10B981",
  successLight: "#D1FAE5",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  info: "#3B82F6",
  infoLight: "#DBEAFE",

  // Transparent
  transparentBlack: "rgba(0, 0, 0, 0.5)",
  transparentWhite: "rgba(255, 255, 255, 0.1)",

  // Shadows
  shadowColor: "#000000",
};

export const TEXT_COLORS = {
  primary: COLORS.gray900,
  secondary: COLORS.gray600,
  tertiary: COLORS.gray500,
  white: COLORS.white,
  muted: COLORS.gray400,
};

export const BG_COLORS = {
  primary: COLORS.white,
  secondary: COLORS.gray50,
  tertiary: COLORS.gray100,
  dark: COLORS.gray900,
};
