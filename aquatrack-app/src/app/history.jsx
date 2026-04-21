import { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { RectButton } from "react-native-gesture-handler";
import RiskBadge from "../components/RiskBadge";
import { useHistory } from "../hooks/useHistory";
import { riskMeta, theme } from "../theme";

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { history, stats, deleteReading } = useHistory();

  const chartData = useMemo(
    () =>
      history
        .slice(0, 10)
        .reverse()
        .map((entry, idx) => ({
          x: idx + 1,
          y: Number(entry.fusionScore || 0),
          color: riskMeta(Number(entry.fusionScore || 0)).color,
        })),
    [history]
  );

  return (
    <View style={styles.container}>
      <View style={styles.statRow}>
        <StatCard label="Average Score" value={`${Math.round(stats.average * 100)}%`} />
        <StatCard label="Highest Risk" value={`${Math.round(stats.highest * 100)}%`} />
        <StatCard label="Total Readings" value={stats.total} />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Last 10 Fusion Scores</Text>
        <View style={styles.sparkRow}>
          {chartData.map((bar) => (
            <View key={bar.x} style={styles.sparkItem}>
              <View style={[styles.sparkBar, { height: `${Math.max(8, bar.y * 100)}%`, backgroundColor: bar.color }]} />
            </View>
          ))}
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No readings yet. Your saved hydration checks will appear here.</Text>}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <RectButton style={styles.deleteAction} onPress={() => deleteReading(item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </RectButton>
            )}
          >
            <View style={styles.itemCard}>
              <View style={styles.itemTop}>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
                <RiskBadge score={item.fusionScore} label={`${Math.round(item.fusionScore * 100)}%`} />
              </View>
              <Text style={styles.risk}>{item.riskLabel}</Text>
              <Text style={styles.scores}>
                Main: {Math.round((item.mainScore || 0) * 100)}% | Context: {Math.round((item.contextScore || 0) * 100)}%
              </Text>
            </View>
          </Swipeable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  statRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  statCard: { flex: 1, backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 12, padding: 10 },
  statLabel: { color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: 11 },
  statValue: { color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: 17, marginTop: 4 },
  chartCard: { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  sectionTitle: { color: theme.colors.text, fontFamily: theme.fonts.heading, marginBottom: 4 },
  empty: { color: theme.colors.muted, textAlign: "center", marginTop: 24, fontFamily: theme.fonts.body },
  itemCard: { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  itemTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  time: { color: theme.colors.text, fontFamily: theme.fonts.bodyBold, fontSize: 12 },
  risk: { color: theme.colors.cyan, fontFamily: theme.fonts.heading, marginTop: 8 },
  scores: { color: theme.colors.muted, fontFamily: theme.fonts.body, marginTop: 4, fontSize: 12 },
  deleteAction: { backgroundColor: theme.colors.high, justifyContent: "center", alignItems: "center", borderRadius: 12, marginBottom: 10, width: 92 },
  deleteText: { color: "#fff", fontFamily: theme.fonts.bodyBold },
  sparkRow: { height: 120, marginTop: 8, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 6 },
  sparkItem: { flex: 1, height: "100%", justifyContent: "flex-end", backgroundColor: theme.colors.cardAlt, borderRadius: 8, overflow: "hidden" },
  sparkBar: { width: "100%", borderRadius: 8, minHeight: 8 },
});
