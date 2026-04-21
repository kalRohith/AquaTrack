import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import InputCard from "../components/InputCard";
import { COLORS } from "../constants/colors";
import { FIELD_GROUPS, QUICK_FIELDS, TIME_OPTIONS } from "../constants/ranges";
import { useHistoryStore } from "../store/useHistoryStore";

const optionalContextFields = [
  { key: "skinTemperature", label: "Skin Temperature", hint: "deg C" },
  { key: "skinConductance", label: "Skin Conductance", hint: "uS" },
  { key: "tewl", label: "TEWL", hint: "g/m2h" },
  { key: "ambientTemperature", label: "Ambient Temperature", hint: "deg C" },
  { key: "ambientHumidity", label: "Ambient Humidity", hint: "%" },
];

export default function InputScreen({ navigation, route }) {
  const { history } = useHistoryStore();
  const quickMode = Boolean(route.params?.quickMode);
  const last = history[0];
  const [showContext, setShowContext] = useState(false);
  const [form, setForm] = useState({
    sweatChloride: `${last?.input?.sweatChloride ?? ""}`,
    sweatOsmolality: `${last?.input?.sweatOsmolality ?? ""}`,
    salivaryOsmolality: `${last?.input?.salivaryOsmolality ?? ""}`,
    salivaryChloride: `${last?.input?.salivaryChloride ?? ""}`,
    salivaryAmylase: `${last?.input?.salivaryAmylase ?? ""}`,
    runningSpeed: `${last?.input?.runningSpeed ?? ""}`,
    runningInterval: `${last?.input?.runningInterval ?? ""}`,
    totalBodyWater: `${last?.input?.totalBodyWater ?? ""}`,
    bodyWeight: `${last?.input?.bodyWeight ?? ""}`,
    skinTemperature: `${last?.input?.skinTemperature ?? ""}`,
    skinConductance: `${last?.input?.skinConductance ?? ""}`,
    tewl: `${last?.input?.tewl ?? ""}`,
    ambientTemperature: `${last?.input?.ambientTemperature ?? ""}`,
    ambientHumidity: `${last?.input?.ambientHumidity ?? ""}`,
    timeOfDay: `${last?.input?.timeOfDay ?? "2"}`,
  });

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const deltaFor = (k) => {
    const prev = Number(last?.input?.[k]);
    const cur = Number(form[k]);
    if (!Number.isFinite(prev) || !Number.isFinite(cur)) return null;
    return cur - prev;
  };
  const shouldShow = (key) => !quickMode || QUICK_FIELDS.includes(key);

  const missingCount = useMemo(
    () => Object.values(form).filter((v) => v === "").length,
    [form]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.head}>{quickMode ? "Quick Log Mode" : "Manual Sensor Entry"}</Text>
      <Text style={styles.sub}>Missing fields are auto-estimated by backend medians ({missingCount} empty).</Text>

      <Text style={styles.group}>SWEAT MARKERS</Text>
      {FIELD_GROUPS.sweat.filter((f) => shouldShow(f.key)).map((f) => (
        <InputCard
          key={f.key}
          label={f.label}
          hint={f.hint}
          keyboardType={f.keyboardType}
          value={form[f.key]}
          onChangeText={(v) => update(f.key, v)}
          usingEstimate={!form[f.key]}
          delta={deltaFor(f.key)}
        />
      ))}

      <Text style={styles.group}>SALIVA MARKERS</Text>
      {FIELD_GROUPS.saliva.filter((f) => shouldShow(f.key)).map((f) => (
        <InputCard
          key={f.key}
          label={f.label}
          hint={f.hint}
          keyboardType={f.keyboardType}
          value={form[f.key]}
          onChangeText={(v) => update(f.key, v)}
          usingEstimate={!form[f.key]}
          delta={deltaFor(f.key)}
        />
      ))}

      <Text style={styles.group}>ACTIVITY</Text>
      {shouldShow("runningSpeed") ? (
        <View style={styles.sliderCard}>
          <Text style={styles.label}>Running Speed: {form.runningSpeed || 0} km/h</Text>
          <TextInput value={form.runningSpeed} onChangeText={(v) => update("runningSpeed", v)} keyboardType="numeric" style={styles.input} />
        </View>
      ) : null}
      {shouldShow("runningInterval") ? (
        <View style={styles.sliderCard}>
          <Text style={styles.label}>Running Interval (0-9)</Text>
          <TextInput value={form.runningInterval} onChangeText={(v) => update("runningInterval", v)} keyboardType="numeric" style={styles.input} />
        </View>
      ) : null}

      <Text style={styles.group}>BODY</Text>
      {FIELD_GROUPS.body.filter((f) => shouldShow(f.key)).map((f) => (
        <InputCard
          key={f.key}
          label={f.label}
          hint={f.hint}
          keyboardType={f.keyboardType}
          value={form[f.key]}
          onChangeText={(v) => update(f.key, v)}
          usingEstimate={!form[f.key]}
          delta={deltaFor(f.key)}
        />
      ))}

      <TouchableOpacity style={styles.contextToggle} onPress={() => setShowContext((s) => !s)}>
        <Text style={styles.contextText}>{showContext ? "Hide" : "Show"} Context Sensors (optional)</Text>
      </TouchableOpacity>
      {showContext &&
        optionalContextFields.map((f) => (
          <InputCard
            key={f.key}
            label={f.label}
            hint={f.hint}
            value={form[f.key]}
            onChangeText={(v) => update(f.key, v)}
            usingEstimate={!form[f.key]}
            delta={deltaFor(f.key)}
          />
        ))}

      <Text style={styles.group}>Time of Day</Text>
      <View style={styles.segRow}>
        {TIME_OPTIONS.map((t) => (
          <TouchableOpacity key={t.key} onPress={() => update("timeOfDay", t.key)} style={[styles.seg, form.timeOfDay === t.key && styles.segActive]}>
            <Text style={[styles.segText, form.timeOfDay === t.key && styles.segTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Results", { input: form })}>
        <Text style={styles.buttonText}>Analyse Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 36 },
  head: { color: COLORS.textPrimary, fontSize: 24, fontWeight: "800" },
  sub: { color: COLORS.textSecondary, marginVertical: 10 },
  group: { color: COLORS.accent, marginTop: 12, marginBottom: 8, fontWeight: "700" },
  sliderCard: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 10 },
  label: { color: COLORS.textPrimary, fontWeight: "600", marginBottom: 8 },
  input: { backgroundColor: COLORS.cardAlt, borderRadius: 12, color: COLORS.textPrimary, paddingHorizontal: 12, paddingVertical: 10 },
  contextToggle: { padding: 12, borderRadius: 12, backgroundColor: COLORS.cardAlt, marginTop: 8, marginBottom: 8 },
  contextText: { color: COLORS.textPrimary, textAlign: "center", fontWeight: "600" },
  segRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  seg: { flex: 1, backgroundColor: COLORS.card, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  segActive: { borderColor: COLORS.accent, backgroundColor: `${COLORS.accent}20` },
  segText: { color: COLORS.textSecondary, textAlign: "center", fontWeight: "700" },
  segTextActive: { color: COLORS.accent },
  button: { backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: COLORS.background, fontWeight: "800" },
});
