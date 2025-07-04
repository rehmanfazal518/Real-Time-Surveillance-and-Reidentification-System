// constants/theme.js (Updated to match desktop CSS style)
export const COLORS = {
  primary: "#1f6feb",       // Bright Blue (from desktop CSS var(--color-secondary))
  secondary: "#ff5555",     // Error/Delete Red (from desktop CSS var(--color-error))
  background: "#0d1117",    // Dark Background (from desktop CSS var(--color-primary))
  surface: "rgba(22, 27, 34, 0.88)", // Card Background (from desktop CSS var(--color-bg))
  text: "#c9d1d9",          // Light Text (from desktop CSS var(--color-light))
  success: "#4CAF50",       // Keep existing success color
  error: "#ff5555",         // Error Red (from desktop CSS var(--color-error))
  white: "#FFFFFF",         // Pure White
  cardBackground: "rgba(255, 255, 255, 0.08)", // Semi-transparent card background (from desktop CSS var(--color-surface))
  black: "#000000",         // Pure Black (for video backgrounds)
  border: "rgba(255, 255, 255, 0.12)", // Border color from desktop
};

export const FONTS = {
  base: "Inter",  // Match the desktop's font
  bold: "Inter-Bold",
};

export const SIZES = {
  base: 8,        // Base unit = 8px
  padding: 16,    // Standard padding
  margin: 16,     // Standard margin
  borderRadius: 12, // Standard border radius (from desktop CSS var(--radius-md))
  borderRadiusSm: 6, // Small border radius (from desktop CSS var(--radius-sm))
  borderRadiusLg: 20, // Large border radius (from desktop CSS var(--radius-lg))
  icon: 24,       // Icon size
  font: 14,       // Standard font size
  fontSmall: 12,  // Small font size
  title: 18,      // Title font size
  heading: 24,    // Heading font size
};

export const SHADOW = {
  elevation: 8,   // React Native elevation
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)", // For web (from desktop CSS var(--shadow-elev))
};