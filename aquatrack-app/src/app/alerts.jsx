import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { theme } from "../theme";

const KEY = "aquatrack_alert_settings";
const defaults = {
  enabled: true,
  highRiskAlert: true,
  risingTrend: true,
  dailyReminder: false,
  morningCheckIn: true,
  threshold: 0.65,
  reminderTime: new Date().toISOString(),
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const ToggleRow = ({ label, value, onValueChange }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch value={value} onValueChange={onValueChange} trackColor={{ true: theme.colors.cyan }} />
  </View>
);

export default function AlertsScreen() {
  const [settings, setSettings] = useState(defaults);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) setSettings({ ...defaults, ...JSON.parse(raw) });
      await Notifications.requestPermissionsAsync();
    })();
  }, []);

  const persist = async (next) => {
    setSettings(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  };

  const update = (key, value) => persist({ ...settings, [key]: value });

  const sendTest = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "AquaTrack Test Alert",
        body: "Hydration reminder is working.",
      },
      trigger: null,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ToggleRow label="Enable Alerts" value={settings.enabled} onValueChange={(v) => update("enabled", v)} />
      <ToggleRow label="High Risk Alert (>= 0.65)" value={settings.highRiskAlert} onValueChange={(v) => update("highRiskAlert", v)} />
      <ToggleRow label="Rising Trend Warning" value={settings.risingTrend} onValueChange={(v) => update("risingTrend", v)} />
      <ToggleRow label="Daily Reminder" value={settings.dailyReminder} onValueChange={(v) => update("dailyReminder", v)} />
      <ToggleRow label="Morning Check-in" value={settings.morningCheckIn} onValueChange={(v) => update("morningCheckIn", v)} />

      <View style={styles.card}>
        <Text style={styles.title}>Risk Threshold: {settings.threshold.toFixed(2)}</Text>
        <Slider
          minimumValue={0.3}
          maximumValue={0.9}
          step={0.01}
          value={settings.threshold}
          minimumTrackTintColor={theme.colors.cyan}
          maximumTrackTintColor={theme.colors.inactive}
          thumbTintColor={theme.colors.cyan}
          onValueChange={(v) => update("threshold", v)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Daily Reminder Time</Text>
        <TouchableOpacity style={styles.timeButton} onPress={() => setShowTimePicker(true)}>
          <Text style={styles.timeText}>{new Date(settings.reminderTime).toLocaleTimeString()}</Text>
        </TouchableOpacity>
        {showTimePicker ? (
          <DateTimePicker
            mode="time"
            value={new Date(settings.reminderTime)}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, date) => {
              if (date) update("reminderTime", date.toISOString());
              if (Platform.OS !== "ios") setShowTimePicker(false);
            }}
          />
        ) : null}
      </View>

      <TouchableOpacity style={styles.testButton} onPress={sendTest}>
        <Text style={styles.testText}>Test Notification</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, paddingBottom: 36, gap: 10 },
  row: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: 13 },
  card: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12 },
  title: { color: theme.colors.text, fontFamily: theme.fonts.bodyBold, marginBottom: 8 },
  timeButton: { backgroundColor: theme.colors.cardAlt, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  timeText: { color: theme.colors.cyan, fontFamily: theme.fonts.bodyBold },
  testButton: { marginTop: 4, backgroundColor: theme.colors.cyan, borderRadius: 12, alignItems: "center", paddingVertical: 14 },
  testText: { color: theme.colors.background, fontFamily: theme.fonts.bodyBold },
});
