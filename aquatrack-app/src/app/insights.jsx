import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getBackendUrl } from "../../app/services/backendUrl";
import { askHydrationAssistant } from "../../app/services/api";
import { useHistory } from "../hooks/useHistory";
import { useMedians } from "../hooks/useMedians";
import { riskMeta, theme } from "../theme";

export default function InsightsScreen() {
  const { history } = useHistory();
  const { medians } = useMedians();
  const latest = history[0];
  const latestScore = Number(latest?.fusionScore || 0);
  const riskLabel = riskMeta(latestScore).label;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");

  const sectionA = useMemo(() => {
    const byTod = { Morning: [], Afternoon: [], Evening: [] };
    const byDow = {};
    history.forEach((h) => {
      const d = new Date(h.createdAt);
      const tod = d.getHours() < 12 ? "Morning" : d.getHours() < 17 ? "Afternoon" : "Evening";
      byTod[tod].push(Number(h.fusionScore || 0));
      const day = d.toLocaleDateString(undefined, { weekday: "long" });
      byDow[day] = byDow[day] || [];
      byDow[day].push(Number(h.fusionScore || 0));
    });
    const bestTime = Object.entries(byTod).sort((a, b) => avg(a[1]) - avg(b[1]))[0]?.[0] || "N/A";
    const riskiestDay = Object.entries(byDow).sort((a, b) => avg(b[1]) - avg(a[1]))[0]?.[0] || "N/A";
    const thisWeek = history.filter((h) => new Date(h.createdAt) > new Date(Date.now() - 7 * 86400000));
    const lastWeek = history.filter((h) => {
      const d = new Date(h.createdAt).getTime();
      return d <= Date.now() - 7 * 86400000 && d > Date.now() - 14 * 86400000;
    });
    const pct = lastWeek.length ? ((avg(thisWeek.map((h) => h.fusionScore)) - avg(lastWeek.map((h) => h.fusionScore))) / Math.max(avg(lastWeek.map((h) => h.fusionScore)), 0.01)) * 100 : 0;
    return { bestTime, riskiestDay, pct };
  }, [history]);

  const chartPoints = useMemo(() => {
    const map = {};
    history.forEach((h) => {
      const day = new Date(h.createdAt).toISOString().slice(0, 10);
      map[day] = map[day] || [];
      map[day].push(Number(h.fusionScore || 0));
    });
    return Object.entries(map).sort((a, b) => new Date(a[0]) - new Date(b[0])).slice(-7).map(([day, vals]) => ({ day, avg: avg(vals), critical: vals.some((v) => v > 0.75) }));
  }, [history]);

  const topContrib = useMemo(() => {
    const scores = {};
    history.forEach((h) => {
      Object.entries(h.input || {}).forEach(([k, v]) => {
        const n = Number(v);
        if (!Number.isNaN(n)) scores[k] = (scores[k] || 0) + Math.abs(n);
      });
    });
    return Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [history]);

  const dynamicCards = useMemo(() => {
    const highActivity = history.filter((h) => Number(h.input?.runningInterval || 0) > 3);
    const rest = history.filter((h) => Number(h.input?.runningInterval || 0) <= 3);
    const hot = history.filter((h) => Number(h.input?.ambientTemperature || 0) > 30);
    const cool = history.filter((h) => Number(h.input?.ambientTemperature || 0) <= 30);
    const peak = ["Morning", "Afternoon", "Evening"].sort((a, b) => {
      const av = avg(history.filter((h) => periodOfDay(h.createdAt) === a).map((h) => h.fusionScore));
      const bv = avg(history.filter((h) => periodOfDay(h.createdAt) === b).map((h) => h.fusionScore));
      return bv - av;
    })[0];
    return [
      `On days you ran > 3 intervals your avg score was ${pct(avg(highActivity.map((h) => h.fusionScore)))} vs ${pct(avg(rest.map((h) => h.fusionScore)))} on rest days.`,
      `Your scores peak at ${peak}. Consider hydrating before this period.`,
      `Readings on days > 30C ambient averaged ${pct(avg(hot.map((h) => h.fusionScore)))} - ${Math.round(((avg(hot.map((h) => h.fusionScore)) - avg(cool.map((h) => h.fusionScore))) / Math.max(avg(cool.map((h) => h.fusionScore)), 0.01)) * 100)}% higher than cooler days.`,
      `After high-risk readings your score typically returns to low in ${recoveryReadings(history)} readings.`,
      `Your longest low-risk streak was ${longestLowStreak(history).count} days starting ${longestLowStreak(history).start}.`,
    ];
  }, [history]);

  const recommendations = useMemo(() => {
    if (!latest) return [];
    const out = [];
    if (Number(latest.input?.tewl || 0) > 20) out.push("Elevated skin water loss detected. Use electrolyte drinks not plain water.");
    if (Number(latest.input?.ambientTemperature || 0) > 30) out.push("Increase intake by ~500ml for every degree above 30C.");
    if (Number(latest.input?.salivaryAmylase || 0) > Number(medians.salivary_amylase || 70)) out.push("Stress marker elevated. Dehydration may be stress-linked.");
    if (Number(latest.input?.runningInterval || 0) > 5) out.push("Rehydrate within 20 mins post-exercise with isotonic fluid.");
    if (periodOfDay(latest.createdAt) === "Morning" && Number(latest.fusionScore) >= 0.4) out.push("Start each day with 500ml before any activity.");
    return out.slice(0, 3);
  }, [latest, medians]);

  const send = async () => {
    const input = text.trim();
    if (!input) return;
    setChatError("");
    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setText("");
    setSending(true);
    let reply = "";
    try {
      const backendUrl = await getBackendUrl();
      const res = await askHydrationAssistant({ backendUrl, message: input, latestScore, latestLabel: riskLabel });
      reply = res?.reply || res?.message || "";
    } catch (err) {
      setChatError("Assistant API unavailable. Showing offline hydration guidance.");
      reply = fallbackReply(input);
    } finally {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: `${reply || fallbackReply(input)}\n\n💧 Your current fusion score is ${latestScore.toFixed(2)} (${riskLabel}).` },
      ]);
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Personal Hydration Profile</Text>
        <Text style={styles.tipText}>Best time of day: {sectionA.bestTime}</Text>
        <Text style={styles.tipText}>Riskiest day: {sectionA.riskiestDay}</Text>
        <Text style={styles.tipText}>Week vs last week: {sectionA.pct >= 0 ? "↑" : "↓"} {Math.abs(Math.round(sectionA.pct))}%</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Trend Analysis (7 Day Avg)</Text>
        {chartPoints.map((p) => (
          <View key={p.day} style={styles.metricRow}>
            <Text style={styles.metricLabel}>{p.day} {p.critical ? "🔴" : ""}</Text>
            <View style={styles.metricTrack}>
              <View style={[styles.metricFill, { width: `${Math.max(2, p.avg * 100)}%`, backgroundColor: theme.colors.cyan }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Factor Breakdown</Text>
        {topContrib.map(([name, value]) => (
          <View key={name} style={styles.metricRow}>
            <Text style={styles.metricLabel}>{name}</Text>
            <View style={styles.metricTrack}>
              <View style={[styles.metricFill, { width: `${Math.min(100, Math.round(value / 8))}%`, backgroundColor: theme.colors.medium }]} />
            </View>
          </View>
        ))}
        {topContrib[0] ? <Text style={styles.tipText}>Your {topContrib[0][0]} appears elevated vs typical median and may be a key risk driver.</Text> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {dynamicCards.map((tip, idx) => (
          <View key={tip} style={[styles.tipCard, { width: 280 }]}>
            <Text style={styles.tipTitle}>Insight {idx + 1}</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        {recommendations.map((tip) => (
          <Text key={tip} style={styles.tipText}>• {tip}</Text>
        ))}
        {!recommendations.length ? <Text style={styles.tipText}>Add more readings to get contextual recommendations.</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Hydration Assistant</Text>
        {messages.map((msg, idx) => (
          <View key={`${msg.role}-${idx}`} style={[styles.chatBubble, msg.role === "user" ? styles.userBubble : styles.botBubble]}>
            <Text style={styles.tipText}>{msg.role === "bot" ? `💧 ${msg.text}` : msg.text}</Text>
          </View>
        ))}
        <View style={styles.chatRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            style={styles.chatInput}
            placeholder="Ask about hydration, dehydration, electrolytes..."
            placeholderTextColor={theme.colors.muted}
          />
          <TouchableOpacity style={styles.chatSend} onPress={send} disabled={sending}>
            <Text style={styles.chatSendTxt}>{sending ? "..." : "Send"}</Text>
          </TouchableOpacity>
        </View>
        {chatError ? <Text style={styles.chatError}>{chatError}</Text> : null}
      </View>
    </ScrollView>
  );
}

function periodOfDay(dateString) {
  const hour = new Date(dateString).getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((sum, x) => sum + Number(x || 0), 0) / arr.length;
}

function pct(v) {
  return `${Math.round(Number(v || 0) * 100)}%`;
}

function recoveryReadings(history) {
  const highs = history.filter((h) => Number(h.fusionScore || 0) > 0.65);
  if (!highs.length) return 0;
  let total = 0;
  highs.forEach((h) => {
    const idx = history.findIndex((x) => x.id === h.id);
    let steps = 0;
    for (let i = idx + 1; i < history.length; i += 1) {
      steps += 1;
      if (Number(history[i].fusionScore || 0) < 0.4) break;
    }
    total += steps;
  });
  return Math.max(1, Math.round(total / highs.length));
}

function longestLowStreak(history) {
  const sorted = [...history].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  let best = { count: 0, start: "N/A" };
  let current = 0;
  let startDate = null;
  sorted.forEach((h) => {
    if (Number(h.fusionScore || 0) < 0.65) {
      current += 1;
      if (!startDate) startDate = new Date(h.createdAt).toLocaleDateString();
      if (current > best.count) best = { count: current, start: startDate };
    } else {
      current = 0;
      startDate = null;
    }
  });
  return best;
}

function fallbackReply(input) {
  const lower = input.toLowerCase();
  const map = {
    water: "Sip water in small, frequent amounts and add electrolytes if sweating heavily.",
    electrolyte: "Electrolytes replace sodium and potassium losses and improve hydration recovery.",
    exercise: "Rehydrate within 20 minutes after exercise, ideally with isotonic fluids.",
    salt: "A small sodium intake helps retain fluid better than plain water alone.",
    headache: "Headache can be linked to dehydration. Hydrate and rest; seek care if persistent.",
    thirst: "Thirst is a late signal. Hydrate proactively, especially before activity.",
    food: "Hydrating foods include watermelon, cucumber, citrus fruits, and soups.",
  };
  const key = Object.keys(map).find((k) => lower.includes(k));
  return key ? map[key] : "I can help with hydration, dehydration symptoms, electrolytes, and exercise recovery.";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, paddingBottom: 36, gap: 10 },
  card: { backgroundColor: theme.colors.card, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 12 },
  sectionTitle: { color: theme.colors.text, fontFamily: theme.fonts.heading, marginBottom: 8 },
  tipCard: { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 12, padding: 12 },
  tipTitle: { color: theme.colors.cyan, fontFamily: theme.fonts.bodyBold, marginBottom: 4 },
  tipText: { color: theme.colors.text, fontFamily: theme.fonts.body, lineHeight: 18, marginBottom: 4 },
  metricRow: { marginTop: 8 },
  metricLabel: { color: theme.colors.text, fontFamily: theme.fonts.body, marginBottom: 4, fontSize: 12 },
  metricTrack: { height: 10, borderRadius: 999, backgroundColor: theme.colors.cardAlt, overflow: "hidden" },
  metricFill: { height: 10, borderRadius: 999 },
  chatBubble: { borderRadius: 10, padding: 8, marginBottom: 8 },
  userBubble: { backgroundColor: theme.colors.cyan },
  botBubble: { backgroundColor: theme.colors.cardAlt, borderWidth: 1, borderColor: theme.colors.border },
  chatRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  chatInput: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingHorizontal: 10, color: theme.colors.text, fontFamily: theme.fonts.body, backgroundColor: theme.colors.cardAlt },
  chatSend: { backgroundColor: theme.colors.cyan, borderRadius: 10, justifyContent: "center", paddingHorizontal: 14 },
  chatSendTxt: { color: theme.colors.background, fontFamily: theme.fonts.bodyBold },
  chatError: { color: theme.colors.medium, fontFamily: theme.fonts.body, marginTop: 6, fontSize: 12 },
});
