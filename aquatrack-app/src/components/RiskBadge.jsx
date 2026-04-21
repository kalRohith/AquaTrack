import { StyleSheet, Text, View } from "react-native";
import { riskMeta, theme } from "../theme";

export default function RiskBadge({ score = 0, label }) {
  const meta = riskMeta(score);
  const shownLabel = label || meta.label;

  return (
    <View style={[styles.badge, { borderColor: meta.color, backgroundColor: `${meta.color}22` }]}>
      <Text style={[styles.text, { color: meta.color }]}>{shownLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontFamily: theme.fonts.bodyBold,
  },
});
