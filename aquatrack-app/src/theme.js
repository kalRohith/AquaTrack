export const theme = {
  colors: {
    background: "#050d1a",
    card: "#0f1f3d",
    cardAlt: "#14284d",
    tabBar: "#0a1628",
    cyan: "#00e5ff",
    inactive: "#3a5068",
    text: "#e6f1ff",
    muted: "#8aa0bf",
    border: "#1d345f",
    low: "#1dd1a1",
    medium: "#f6b93b",
    high: "#ff6b6b",
  },
  fonts: {
    heading: "Syne_700Bold",
    body: "JetBrainsMono_400Regular",
    bodyBold: "JetBrainsMono_700Bold",
  },
};

export const riskMeta = (score = 0) => {
  if (score >= 0.65) return { label: "High", color: theme.colors.high };
  if (score >= 0.4) return { label: "Medium", color: theme.colors.medium };
  return { label: "Low", color: theme.colors.low };
};
