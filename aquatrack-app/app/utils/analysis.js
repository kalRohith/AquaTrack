export const fusionScore = (mainScore = 0, contextScore = 0) => 0.6 * mainScore + 0.4 * contextScore;

export const riskMessage = (label = "Low") => {
  if (label === "Low") return "You are well hydrated. Keep it up.";
  if (label === "Medium") return "Mild dehydration detected. Drink water soon.";
  return "High dehydration risk. Act immediately.";
};

export const trendIsRising = (history = []) => {
  if (history.length < 3) return false;
  const [a, b, c] = history.slice(0, 3).map((r) => r.fusionScore || 0);
  return a > b && b > c;
};

export const topFactors = (input = {}) => {
  const candidates = [
    ["Sweat Chloride", Number(input.sweatChloride || 0), 60],
    ["Running Interval", Number(input.runningInterval || 0), 9],
    ["TEWL", Number(input.tewl || 0), 30],
    ["Ambient Temp", Number(input.ambientTemperature || 0), 40],
    ["Skin Temp", Number(input.skinTemperature || 0), 40],
  ];
  return candidates
    .map(([name, value, scale]) => ({ name, value: Math.min(1, Math.abs(value) / scale) }))
    .sort((x, y) => y.value - x.value)
    .slice(0, 3);
};
