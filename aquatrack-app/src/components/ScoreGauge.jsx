import { StyleSheet, Text, View } from "react-native";
import { riskMeta, theme } from "../theme";

export default function ScoreGauge({ score = 0, title, large = false }) {
  const clamped = Math.max(0, Math.min(1, Number(score) || 0));
  const { color, label } = riskMeta(clamped);
  const size = large ? 160 : 120;
  const stroke = large ? 12 : 10;

  return (
    <View style={styles.wrap}>
      <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderWidth: stroke, borderColor: `${color}55` }]}>
        <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
        <Text style={[styles.percent, large && styles.percentLarge]}>{Math.round(clamped * 100)}%</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", marginVertical: 8 },
  ring: {
    backgroundColor: theme.colors.cardAlt,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  fill: { position: "absolute", left: 0, bottom: 0, top: 0, opacity: 0.25 },
  percent: { color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: 22 },
  percentLarge: { fontSize: 32 },
  title: { color: theme.colors.muted, fontFamily: theme.fonts.body, marginTop: 8, fontSize: 12 },
  label: { fontFamily: theme.fonts.bodyBold, marginTop: 2 },
});
