import { StyleSheet, Text, View } from "react-native";
import RiskBadge from "../components/RiskBadge";
import { useHistory } from "../hooks/useHistory";
import { theme } from "../theme";

export default function HomeScreen() {
  const { history } = useHistory();
  const latest = history[0];
  const score = Number(latest?.fusionScore || 0);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>AquaTrack Dashboard</Text>
        <Text style={styles.score}>{Math.round(score * 100)}%</Text>
        <RiskBadge score={score} label={latest?.riskLabel} />
        <Text style={styles.meta}>
          Last updated: {latest?.createdAt ? new Date(latest.createdAt).toLocaleString() : "No readings yet"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  card: { backgroundColor: theme.colors.card, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 16 },
  title: { color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: 22 },
  score: { color: theme.colors.cyan, fontFamily: theme.fonts.heading, fontSize: 44, marginVertical: 8 },
  meta: { color: theme.colors.muted, fontFamily: theme.fonts.body, marginTop: 8 },
});
