import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import TrendChart from "../components/TrendChart";
import { COLORS, riskColor } from "../constants/colors";
import { useHistoryStore } from "../store/useHistoryStore";

export default function HistoryScreen({ navigation }) {
  const { history } = useHistoryStore();
  const top7 = history.slice(0, 7);
  const weeklyAvg = top7.length ? top7.reduce((a, b) => a + (b.fusionScore || 0), 0) / top7.length : 0;

  const exportCsv = async () => {
    const rows = ["date,risk_label,main_score,context_score,fusion_score"];
    history.forEach((h) => {
      rows.push(`${h.createdAt},${h.riskLabel},${h.mainScore},${h.contextScore},${h.fusionScore}`);
    });
    const uri = `${FileSystem.cacheDirectory}aquatrack-history.csv`;
    await FileSystem.writeAsStringAsync(uri, rows.join("\n"));
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.chartCard}>
        <Text style={styles.title}>7-reading trend</Text>
        <TrendChart values={top7.map((h) => h.fusionScore || 0).reverse()} width={320} height={90} />
        <Text style={styles.avg}>Weekly Avg: {Math.round(weeklyAvg * 100)}%</Text>
      </View>
      {history.map((h) => (
        <TouchableOpacity
          key={h.id}
          style={[styles.row, { borderLeftColor: riskColor(h.fusionScore), borderLeftWidth: 4 }]}
          onPress={() => navigation.navigate("Results", { input: h.input })}
        >
          <Text style={styles.rowTitle}>{new Date(h.createdAt).toLocaleString()}</Text>
          <Text style={styles.rowSub}>
            {h.riskLabel} • {Math.round((h.fusionScore || 0) * 100)}%
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.cta} onPress={exportCsv}>
        <Text style={styles.ctaText}>Export as CSV</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  chartCard: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  title: { color: COLORS.textPrimary, fontWeight: "700" },
  avg: { marginTop: 8, color: COLORS.accent, fontWeight: "800" },
  row: { backgroundColor: COLORS.card, borderRadius: 12, padding: 12, marginTop: 8 },
  rowTitle: { color: COLORS.textPrimary, fontWeight: "700" },
  rowSub: { color: COLORS.textSecondary, marginTop: 3 },
  cta: { marginTop: 12, backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  ctaText: { color: COLORS.background, fontWeight: "800" },
});
