export const COLORS = {
  background: "#0A0F1E",
  card: "#141B2D",
  cardAlt: "#1A2340",
  accent: "#00D4FF",
  textPrimary: "#F4F7FF",
  textSecondary: "#A4B0D0",
  low: "#00C896",
  medium: "#FFB347",
  high: "#FF4757",
  border: "#2B3555",
  offline: "#6B7280",
};

export const riskColor = (score = 0) => {
  if (score < 0.4) return COLORS.low;
  if (score < 0.65) return COLORS.medium;
  return COLORS.high;
};
