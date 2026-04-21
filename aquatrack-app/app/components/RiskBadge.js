import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/colors";

const byLabel = {
  Low: COLORS.low,
  Medium: COLORS.medium,
  High: COLORS.high,
};

export default function RiskBadge({ label = "Low" }) {
  const color = byLabel[label] || COLORS.medium;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}25`, borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  text: { fontWeight: "700", fontSize: 14 },
});
