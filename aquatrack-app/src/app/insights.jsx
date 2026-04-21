import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { MODEL_ARTIFACTS } from "../constants/modelArtifacts";
import { useHistory } from "../hooks/useHistory";
import { riskMeta, theme } from "../theme";

const periodOfDay = (dateString) => {
  const hour = new Date(dateString).getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  if (hour < 21) return "Evening";
  return "Night";
};

export default function InsightsScreen() {
  const { history } = useHistory();
  const last10 = history.slice(0, 10);

  const trendLabel = useMemo(() => {
    if (last10.length < 2) return "Stable";
    const deltas = last10.slice(0, -1).map((entry, idx) => entry.fusionScore - last10[idx + 1].fusionScore);
    const meanDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
    if (meanDelta < -0.03) return "Improving";
    if (meanDelta > 0.03) return "Worsening";
    return "Stable";
  }, [last10]);

  const distribution = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0 };
    last10.forEach((item) => counts[riskMeta(item.fusionScore).label] += 1);
    return [
      { x: "Low", y: counts.Low, fill: theme.colors.low },
      { x: "Medium", y: counts.Medium, fill: theme.colors.medium },
      { x: "High", y: counts.High, fill: theme.colors.high },
    ];
  }, [last10]);

  const timeOfDayAvg = useMemo(() => {
    const buckets = { Morning: [], Afternoon: [], Evening: [], Night: [] };
    last10.forEach((item) => buckets[periodOfDay(item.createdAt)].push(item.fusionScore));
    return Object.entries(buckets).map(([label, values]) => ({
      x: label,
      y: values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0,
    }));
  }, [last10]);

  const topFactors = useMemo(() => {
    const scores = {};
    last10.forEach((entry) => {
      Object.entries(entry.input || {}).forEach(([k, value]) => {
        const n = Number(value);
        if (!Number.isNaN(n)) scores[k] = (scores[k] || 0) + Math.abs(n);
      });
    });
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  }, [last10]);

  const tips = useMemo(() => {
    const highCount = last10.filter((x) => x.fusionScore >= 0.65).length;
    return [
      highCount >= 4 ? "Frequent high-risk readings detected. Increase water intake earlier in the day." : "Your high-risk frequency is manageable. Keep hydration consistent.",
      trendLabel === "Worsening" ? "Trend is worsening. Add a morning and afternoon hydration reminder." : "Trend is not worsening. Continue your current hydration routine.",
      topFactors[0] ? `Most influential factor appears to be '${topFactors[0]}'. Track it more consistently.` : "Log more readings to unlock stronger personalized factor tips.",
    ];
  }, [last10, topFactors, trendLabel]);

  const exportJson = async () => {
    const uri = `${FileSystem.cacheDirectory}aquatrack-history-${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(history, null, 2));
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={["#13305f", "#0f1f3d"]} style={styles.gradient}>
        <Text style={styles.gradientTitle}>Overall Trend</Text>
        <Text style={styles.gradientValue}>{trendLabel}</Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Risk Distribution (Last 10)</Text>
        {distribution.map((item) => (
          <View key={item.x} style={styles.metricRow}>
            <Text style={styles.metricLabel}>
              {item.x}: {item.y}
            </Text>
            <View style={styles.metricTrack}>
              <View style={[styles.metricFill, { width: `${Math.max(4, item.y * 10)}%`, backgroundColor: item.fill }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Average Risk by Time of Day</Text>
        {timeOfDayAvg.map((item) => (
          <View key={item.x} style={styles.metricRow}>
            <Text style={styles.metricLabel}>
              {item.x}: {Math.round(item.y * 100)}%
            </Text>
            <View style={styles.metricTrack}>
              <View style={[styles.metricFill, { width: `${Math.max(4, item.y * 100)}%`, backgroundColor: theme.colors.cyan }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Top Contributing Factors</Text>
        <View style={styles.pillWrap}>
          {topFactors.map((factor) => (
            <View key={factor} style={styles.pill}>
              <Text style={styles.pillText}>{factor}</Text>
            </View>
          ))}
        </View>
      </View>

      {tips.map((tip, idx) => (
        <View key={tip} style={styles.tipCard}>
          <Text style={styles.tipTitle}>Tip {idx + 1}</Text>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Model Artifacts Referenced</Text>
        <Text style={styles.artifactText}>{MODEL_ARTIFACTS.join(", ")}</Text>
      </View>

      <TouchableOpacity style={styles.exportButton} onPress={exportJson}>
        <Text style={styles.exportText}>Export History JSON</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, paddingBottom: 36, gap: 10 },
  gradient: { borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.border },
  gradientTitle: { color: theme.colors.muted, fontFamily: theme.fonts.bodyBold },
  gradientValue: { color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: 30, marginTop: 4 },
  card: { backgroundColor: theme.colors.card, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 12 },
  sectionTitle: { color: theme.colors.text, fontFamily: theme.fonts.heading, marginBottom: 8 },
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { backgroundColor: "#103462", borderWidth: 1, borderColor: theme.colors.cyan, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  pillText: { color: theme.colors.cyan, fontFamily: theme.fonts.body, fontSize: 12 },
  tipCard: { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 12, padding: 12 },
  tipTitle: { color: theme.colors.cyan, fontFamily: theme.fonts.bodyBold, marginBottom: 4 },
  tipText: { color: theme.colors.text, fontFamily: theme.fonts.body, lineHeight: 18 },
  exportButton: { marginTop: 4, backgroundColor: theme.colors.cyan, borderRadius: 12, alignItems: "center", paddingVertical: 14 },
  exportText: { color: theme.colors.background, fontFamily: theme.fonts.bodyBold },
  artifactText: { color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: 12, lineHeight: 18 },
  metricRow: { marginTop: 8 },
  metricLabel: { color: theme.colors.text, fontFamily: theme.fonts.body, marginBottom: 4 },
  metricTrack: { height: 10, borderRadius: 999, backgroundColor: theme.colors.cardAlt, overflow: "hidden" },
  metricFill: { height: 10, borderRadius: 999 },
});
