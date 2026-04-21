import { useState } from "react";
import { Alert, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/colors";
import { useHistoryStore } from "../store/useHistoryStore";
import { fetchAbout } from "../services/api";

export default function SettingsScreen() {
  const { settings, updateSettings, clearHistory } = useHistoryStore();
  const [name, setName] = useState(settings.profileName);
  const [backendUrl, setBackendUrl] = useState(settings.backendUrl);

  const save = async () => {
    await updateSettings({ profileName: name, backendUrl });
    Alert.alert("Saved", "Settings updated.");
  };

  const loadAbout = async () => {
    try {
      const about = await fetchAbout(backendUrl);
      await updateSettings({
        modelVersion: about.model_version || settings.modelVersion,
        lastTrainedDate: about.last_trained_date || settings.lastTrainedDate,
      });
      Alert.alert("Updated", "Model metadata synced from API.");
    } catch (err) {
      Alert.alert("Unavailable", "Could not fetch metadata from backend /about.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <TextInput style={styles.input} placeholder="Profile name" placeholderTextColor={COLORS.textSecondary} value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Backend URL" placeholderTextColor={COLORS.textSecondary} value={backendUrl} onChangeText={setBackendUrl} autoCapitalize="none" />
      <Row label="Face ID lock">
        <Switch value={settings.faceIdEnabled} onValueChange={(v) => updateSettings({ faceIdEnabled: v })} />
      </Row>
      <Row label="Units">
        <TouchableOpacity style={styles.pill} onPress={() => updateSettings({ units: settings.units === "metric" ? "imperial" : "metric" })}>
          <Text style={styles.pillText}>{settings.units}</Text>
        </TouchableOpacity>
      </Row>
      <TouchableOpacity style={styles.secondary} onPress={loadAbout}>
        <Text style={styles.secondaryText}>Refresh model info from API</Text>
      </TouchableOpacity>
      <Text style={styles.meta}>Model: {settings.modelVersion}</Text>
      <Text style={styles.meta}>Last trained: {settings.lastTrainedDate}</Text>
      <TouchableOpacity style={styles.primary} onPress={save}>
        <Text style={styles.primaryText}>Save Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.danger} onPress={clearHistory}>
        <Text style={styles.dangerText}>Clear History</Text>
      </TouchableOpacity>
    </View>
  );
}

function Row({ label, children }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  title: { color: COLORS.textPrimary, fontWeight: "800", fontSize: 24, marginBottom: 14 },
  input: { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1, borderRadius: 12, color: COLORS.textPrimary, padding: 12, marginBottom: 10 },
  row: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { color: COLORS.textPrimary, fontWeight: "600" },
  pill: { backgroundColor: COLORS.cardAlt, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  pillText: { color: COLORS.accent, fontWeight: "700" },
  secondary: { padding: 10, alignItems: "center" },
  secondaryText: { color: COLORS.accent },
  meta: { color: COLORS.textSecondary, marginBottom: 4 },
  primary: { marginTop: 8, backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  primaryText: { color: COLORS.background, fontWeight: "800" },
  danger: { marginTop: 10, borderRadius: 14, borderWidth: 1, borderColor: COLORS.high, paddingVertical: 12, alignItems: "center" },
  dangerText: { color: COLORS.high, fontWeight: "700" },
});
