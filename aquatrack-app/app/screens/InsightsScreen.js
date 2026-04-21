import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/colors";
import { useHistoryStore } from "../store/useHistoryStore";

function timeLabel(v) {
  if (v === "1") return "Morning";
  if (v === "2") return "Afternoon";
  return "Evening";
}

export default function InsightsScreen() {
  const { history } = useHistoryStore();
  const safe = history.slice(0, 30);

  const byTod = {};
  safe.forEach((h) => {
    const tod = h.input?.timeOfDay || "2";
    byTod[tod] = byTod[tod] || [];
    byTod[tod].push(h.fusionScore || 0);
  });
  const bestTod = Object.entries(byTod)
    .map(([k, arr]) => [k, arr.reduce((a, b) => a + b, 0) / arr.length])
    .sort((a, b) => a[1] - b[1])[0];

  const streak = safe.reduce((acc, h) => (h.riskLabel === "Low" ? acc + 1 : 0), 0);
  const avgInterval =
    safe.length > 0
      ? safe.reduce((a, h) => a + Number(h.input?.runningInterval || 0), 0) / safe.length
      : 0;
  const latest = safe[0];
  const tip = Number(latest?.input?.ambientTemperature || 0) > 30
    ? "Hot conditions detected - increase intake."
    : Number(latest?.input?.runningInterval || 0) > 5
      ? "Post-exercise rehydration recommended."
      : Number(latest?.input?.tewl || 0) > 18
        ? "Skin moisture loss elevated - consider electrolytes."
        : "Steady hydration pattern - keep monitoring.";

  return (
    <View style={styles.container}>
      <Card title="Best hydration time" value={bestTod ? `${timeLabel(bestTod[0])} (${Math.round(bestTod[1] * 100)}%)` : "Not enough data"} />
      <Card title="Activity impact" value={`Avg running interval: ${avgInterval.toFixed(1)}`} />
      <Card title="Low-risk streak" value={`${streak} readings`} />
      <Card title="Adaptive tip" value={tip} />
    </View>
  );
}

function Card({ title, value }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16, gap: 10 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14 },
  title: { color: COLORS.textSecondary, marginBottom: 6 },
  value: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 16, lineHeight: 22 },
});
