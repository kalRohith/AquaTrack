import { StyleSheet, Text, View } from "react-native";
import { COLORS, riskColor } from "../constants/colors";

export default function ResultCard({ title, score = 0 }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.score, { color: riskColor(score) }]}>{Math.round(score * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  title: { color: COLORS.textSecondary, fontSize: 12 },
  score: { color: COLORS.textPrimary, fontSize: 24, fontWeight: "800", marginTop: 8 },
});
