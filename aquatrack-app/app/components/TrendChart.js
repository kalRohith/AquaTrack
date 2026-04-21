import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { COLORS } from "../constants/colors";

export default function TrendChart({ values = [], width = 220, height = 60 }) {
  if (!values.length) return <View style={[styles.placeholder, { width, height }]} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const norm = values.map((v, i) => ({
    x: (i / Math.max(values.length - 1, 1)) * width,
    y: height - ((v - min) / Math.max(max - min, 0.0001)) * (height - 6) - 3,
  }));
  const d = norm.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <Svg width={width} height={height}>
      <Path d={d} stroke={COLORS.accent} strokeWidth={2.5} fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  placeholder: { borderRadius: 10, backgroundColor: COLORS.cardAlt },
});
