import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import Gauge from "../components/Gauge";
import ResultCard from "../components/ResultCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import OfflineBanner from "../components/OfflineBanner";
import { COLORS } from "../constants/colors";
import { predictAll } from "../services/api";
import { useHistoryStore } from "../store/useHistoryStore";
import { fusionScore, riskMessage, topFactors } from "../utils/analysis";

export default function ResultsScreen({ route, navigation }) {
  const { input } = route.params || {};
  const shotRef = useRef(null);
  const { settings, history, addReading } = useHistoryStore();
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const apiResult = await predictAll({ backendUrl: settings.backendUrl, input });
        setResult(apiResult);
      } catch (err) {
        setOffline(true);
        if (history[0]) {
          setResult({
            main: { risk_label: history[0].riskLabel, risk_score: history[0].mainScore, consistent: true },
            context: { risk_label: history[0].riskLabel, risk_score: history[0].contextScore, consistent: true },
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [settings.backendUrl]);

  const merged = useMemo(() => {
    const mainScore = Number(result?.main?.risk_score ?? 0);
    const contextScore = Number(result?.context?.risk_score ?? 0);
    const fused = fusionScore(mainScore, contextScore);
    const label = result?.main?.risk_label || "Low";
    return { mainScore, contextScore, fused, label };
  }, [result]);

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingSkeleton height={20} />
        <LoadingSkeleton height={220} />
        <LoadingSkeleton height={80} />
      </View>
    );
  }

  const factors = topFactors(input);
  const consistent = Boolean(result?.main?.consistent && result?.context?.consistent);

  const onSave = async () => {
    await addReading({
      input,
      riskLabel: merged.label,
      mainScore: merged.mainScore,
      contextScore: merged.contextScore,
      fusionScore: merged.fused,
      consistent,
      offline,
      factors,
    });
    navigation.navigate("Tabs", { screen: "Home" });
  };

  const onShare = async () => {
    const uri = await shotRef.current.capture();
    const destination = `${FileSystem.cacheDirectory}aquatrack-report-${Date.now()}.png`;
    await FileSystem.copyAsync({ from: uri, to: destination });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(destination);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {offline ? <OfflineBanner /> : null}
      <ViewShot ref={shotRef} options={{ format: "png", quality: 1 }}>
        <View style={styles.shareCard}>
          <Text style={styles.logo}>AquaTrack</Text>
          <Gauge score={merged.fused} />
          <Text style={styles.label}>{merged.label}</Text>
          <Text style={styles.message}>{riskMessage(merged.label)}</Text>
        </View>
      </ViewShot>

      <View style={styles.row}>
        <ResultCard title="Main Model" score={merged.mainScore} />
        <View style={{ width: 10 }} />
        <ResultCard title="Context Model" score={merged.contextScore} />
      </View>

      <Text style={styles.fusion}>Fusion Score: {Math.round(merged.fused * 100)}%</Text>
      <Text style={[styles.consistency, { color: consistent ? COLORS.low : COLORS.medium }]}>
        {consistent ? "✅ Consistent" : "⚠️ Signals conflict - verify inputs"}
      </Text>

      <Text style={styles.section}>Top contributing factors</Text>
      {factors.map((f) => (
        <View key={f.name} style={styles.factorRow}>
          <Text style={styles.factorLabel}>{f.name}</Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.round(f.value * 100)}%` }]} />
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.cta} onPress={onSave}>
        <Text style={styles.ctaText}>Save Reading</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ghost} onPress={onShare}>
        <Text style={styles.ghostText}>Share Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  shareCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  logo: { color: COLORS.accent, fontWeight: "800", fontSize: 20, textAlign: "center" },
  label: { color: COLORS.textPrimary, fontSize: 28, textAlign: "center", fontWeight: "800" },
  message: { color: COLORS.textSecondary, textAlign: "center", marginBottom: 10 },
  row: { flexDirection: "row", marginTop: 14 },
  fusion: { marginTop: 16, color: COLORS.textPrimary, fontSize: 24, fontWeight: "800" },
  consistency: { marginTop: 4, fontWeight: "700" },
  section: { marginTop: 16, color: COLORS.accent, fontWeight: "700" },
  factorRow: { marginTop: 8 },
  factorLabel: { color: COLORS.textSecondary, marginBottom: 4 },
  barBg: { height: 10, borderRadius: 999, backgroundColor: COLORS.cardAlt },
  barFill: { height: 10, borderRadius: 999, backgroundColor: COLORS.accent },
  cta: { marginTop: 16, backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  ctaText: { color: COLORS.background, fontWeight: "800" },
  ghost: { marginTop: 10, borderWidth: 1, borderColor: COLORS.accent, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  ghostText: { color: COLORS.accent, fontWeight: "700" },
});
