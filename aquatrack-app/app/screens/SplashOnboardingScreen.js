import { useRef, useState } from "react";
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants/colors";
import { useHistoryStore } from "../store/useHistoryStore";

const { width } = Dimensions.get("window");

const cards = [
  { title: "What it monitors", body: "Sweat, saliva, activity and context signals to estimate dehydration risk." },
  { title: "How it works", body: "AquaTrack calls FastAPI endpoints for biomarker and context model predictions." },
  { title: "What you need", body: "Enter manual readings or quick-log key values. Backend fills missing values safely." },
];

export default function SplashOnboardingScreen() {
  const { completeOnboarding } = useHistoryStore();
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);
  return (
    <LinearGradient colors={["#081228", "#0A0F1E"]} style={styles.container}>
      <Animated.Text entering={FadeIn.duration(700)} style={styles.logo}>
        AquaTrack
      </Animated.Text>
      <FlatList
        ref={listRef}
        data={cards}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        keyExtractor={(i) => i.title}
        renderItem={({ item }) => (
          <Animated.View entering={FadeInDown} style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </Animated.View>
        )}
      />
      <View style={styles.dots}>
        {cards.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
      <TouchableOpacity style={styles.cta} onPress={completeOnboarding}>
        <Text style={styles.ctaText}>Get Started</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 120, alignItems: "center", backgroundColor: COLORS.background },
  logo: { color: COLORS.accent, fontSize: 42, fontWeight: "800", marginBottom: 30 },
  card: { width: width - 40, marginHorizontal: 20, backgroundColor: COLORS.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  title: { color: COLORS.textPrimary, fontWeight: "800", fontSize: 24, marginBottom: 10 },
  body: { color: COLORS.textSecondary, fontSize: 16, lineHeight: 22 },
  dots: { flexDirection: "row", marginTop: 24, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { width: 26, backgroundColor: COLORS.accent },
  cta: { marginTop: 28, backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 },
  ctaText: { color: COLORS.background, fontWeight: "800" },
});
