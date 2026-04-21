import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { COLORS, riskColor } from "../constants/colors";

const AnimatedLine = Animated.createAnimatedComponent(Line);
const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = 88;
const STROKE = 16;

export default function Gauge({ score = 0, label = "Hydration Risk" }) {
  const clamped = Math.max(0, Math.min(1, Number(score) || 0));
  const angle = useSharedValue(-130);
  const pulse = useSharedValue(1);

  useEffect(() => {
    angle.value = withTiming(-130 + clamped * 260, { duration: 900, easing: Easing.out(Easing.cubic) });
    const pulseMs = clamped < 0.4 ? 1800 : clamped < 0.65 ? 1200 : 700;
    pulse.value = withRepeat(
      withTiming(1.06, { duration: pulseMs, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [clamped]);

  const needleAnimatedProps = useAnimatedProps(() => {
    const x2 = CENTER + Math.cos((angle.value * Math.PI) / 180) * (RADIUS - 10);
    const y2 = CENTER + Math.sin((angle.value * Math.PI) / 180) * (RADIUS - 10);
    return { x1: CENTER, y1: CENTER, x2, y2 };
  });

  const pulseStyle = {
    transform: [{ scale: pulse }],
    shadowColor: riskColor(clamped),
    shadowOpacity: interpolate(clamped, [0, 1], [0.2, 0.6]),
    shadowRadius: 16,
  };

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.pulseRing, pulseStyle]} />
      <Svg width={SIZE} height={SIZE}>
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke={COLORS.border} strokeWidth={STROKE} fill="none" />
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={riskColor(clamped)}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${Math.PI * 2 * RADIUS * clamped}, 999`}
          strokeLinecap="round"
          transform={`rotate(-130 ${CENTER} ${CENTER})`}
        />
        <AnimatedLine animatedProps={needleAnimatedProps} stroke={COLORS.textPrimary} strokeWidth={4} strokeLinecap="round" />
        <Circle cx={CENTER} cy={CENTER} r={7} fill={COLORS.textPrimary} />
      </Svg>
      <Text style={styles.percent}>{Math.round(clamped * 100)}%</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", marginVertical: 8 },
  pulseRing: {
    position: "absolute",
    width: 188,
    height: 188,
    borderRadius: 94,
    backgroundColor: "rgba(0,212,255,0.09)",
  },
  percent: { marginTop: -22, color: COLORS.textPrimary, fontWeight: "800", fontSize: 34 },
  label: { color: COLORS.textSecondary, marginTop: 4 },
});
