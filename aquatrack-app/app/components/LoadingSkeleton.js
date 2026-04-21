import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useEffect } from "react";
import { COLORS } from "../constants/colors";

export default function LoadingSkeleton({ height = 18, width = "100%" }) {
  const opacity = useSharedValue(0.35);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.75, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.box, style, { height, width }]} />;
}

const styles = StyleSheet.create({
  box: { borderRadius: 8, backgroundColor: COLORS.cardAlt, marginBottom: 8 },
});
