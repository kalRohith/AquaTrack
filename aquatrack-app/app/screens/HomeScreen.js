import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMemo } from "react";
import Gauge from "../components/Gauge";
import RiskBadge from "../components/RiskBadge";
import TrendChart from "../components/TrendChart";
import OfflineBanner from "../components/OfflineBanner";
import { COLORS } from "../constants/colors";
import { trendIsRising } from "../utils/analysis";
import { useHistoryStore } from "../store/useHistoryStore";

export default function HomeScreen({ navigation }) {
  const { history } = useHistoryStore();
  const latest = history[0];
  const score = latest?.fusionScore ?? 0;
  const label = latest?.riskLabel ?? "Low";
  const isRising = useMemo(() => trendIsRising(history), [history]);

  return (
    <View style={styles.container}>
      {latest?.offline ? <OfflineBanner /> : null}
      {isRising ? <Text style={styles.warning}>Your dehydration risk has been increasing. Consider hydrating now.</Text> : null}
      <Gauge score={score} label="Dehydration Risk" />
      <RiskBadge label={label} />
      <Text style={styles.big}>{Math.round(score * 100)}% Dehydration Risk</Text>
      <Text style={styles.time}>Last updated: {latest?.createdAt ? new Date(latest.createdAt).toLocaleString() : "-"}</Text>
      <TouchableOpacity style={styles.cta} onPress={() => navigation.navigate("Input")}>
        <Text style={styles.ctaText}>Check Now</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ctaGhost} onLongPress={() => navigation.navigate("Input", { quickMode: true })}>
        <Text style={styles.ctaGhostText}>Long-press Check Now for Quick Log</Text>
      </TouchableOpacity>
      <View style={styles.sparkWrap}>
        <Text style={styles.sparkTitle}>Last 3 readings</Text>
        <TrendChart values={history.slice(0, 3).map((h) => h.fusionScore || 0).reverse()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  warning: { color: COLORS.medium, backgroundColor: `${COLORS.medium}22`, borderWidth: 1, borderColor: COLORS.medium, borderRadius: 10, padding: 10, marginBottom: 8, fontSize: 12 },
  big: { color: COLORS.textPrimary, fontSize: 28, fontWeight: "800", marginTop: 10 },
  time: { color: COLORS.textSecondary, marginTop: 4, marginBottom: 10 },
  cta: { backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 10 },
  ctaText: { color: COLORS.background, fontWeight: "800" },
  ctaGhost: { marginTop: 8, padding: 8, alignItems: "center" },
  ctaGhostText: { color: COLORS.textSecondary, fontSize: 12 },
  sparkWrap: { marginTop: 12, backgroundColor: COLORS.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  sparkTitle: { color: COLORS.textPrimary, fontWeight: "700", marginBottom: 8 },
});
