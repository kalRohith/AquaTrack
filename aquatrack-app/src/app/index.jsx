import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Slider from "@react-native-community/slider";
import { getBackendUrl } from "../../app/services/backendUrl";
import { predictAll } from "../../app/services/api";
import { cancelReminder, sendAlert } from "../../app/services/notifications";
import ScoreGauge from "../components/ScoreGauge";
import { FIELD_META } from "../constants/predictFields";
import { useHistory } from "../hooks/useHistory";
import { useMedians } from "../hooks/useMedians";
import { useProfile } from "../hooks/useProfile";
import { appendAlerts, buildAlertsFromHistory, shouldNotifyAlert } from "../services/alerts";
import { riskMeta, theme } from "../theme";

const TIME_OPTIONS = [
  { key: 1, label: "Morning" },
  { key: 2, label: "Afternoon" },
  { key: 3, label: "Evening" },
];

const medianKeyMap = {
  sweatChloride: "sweat_chloride",
  sweatOsmolality: "sweat_osmolality",
  salivaryOsmolality: "salivary_osmolality",
  salivaryChloride: "salivary_chloride",
  salivaryAmylase: "salivary_amylase",
  salivaryProtein: "salivary_protein",
  salivaryCortisol: "salivary_cortisol",
  salivaryCortisone: "salivary_cortisone",
  salivaryPotassium: "salivary_potassium",
  totalBodyWater: "total_body_water",
  inbodyWeight: "inbody_weight",
  runningSpeed: "running_speed",
  runningInterval: "running_interval",
  skinTemperature: "skin_temperature",
  skinConductance: "skin_conductance",
  tewl: "tewl",
  ambientTemperature: "ambient_temperature",
  ambientHumidity: "ambient_humidity",
  rightArm: "right_arm",
  leftArm: "left_arm",
  trunk: "trunk",
  rightLeg: "right_leg",
  leftLeg: "left_leg",
};

function FieldInput({ fieldKey, value, estimated, error, onChange }) {
  const meta = FIELD_META[fieldKey];
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.fieldHeader}>
        <Text style={styles.label}>{meta.label}</Text>
        {estimated ? <Text style={styles.estimated}>estimated</Text> : null}
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={[styles.input, error && styles.inputError]}
        keyboardType="numeric"
        placeholder={meta.hint}
        placeholderTextColor={theme.colors.muted}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export default function PredictScreen() {
  const { medians } = useMedians();
  const { history, addReading } = useHistory();
  const { profile } = useProfile();
  const [form, setForm] = useState({ timeOfDay: 2, runningSpeed: "0", runningInterval: "0", inbodyWeight: `${profile.weight || ""}` });
  const [errors, setErrors] = useState({});
  const [estimated, setEstimated] = useState({});
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    if (profile.weight) {
      setForm((prev) => ({ ...prev, inbodyWeight: prev.inbodyWeight || `${profile.weight}` }));
    }
  }, [profile.weight]);

  const visibleFields = useMemo(
    () => [
      "sweatChloride",
      "sweatOsmolality",
      "salivaryOsmolality",
      "salivaryChloride",
      "salivaryAmylase",
      "totalBodyWater",
      "inbodyWeight",
      "skinTemperature",
      "skinConductance",
      "tewl",
      "ambientTemperature",
      "ambientHumidity",
    ],
    []
  );

  const validateAndFill = () => {
    const nextErrors = {};
    const nextForm = { ...form };
    const nextEstimated = {};
    Object.keys(medianKeyMap).forEach((key) => {
      const str = `${nextForm[key] ?? ""}`.trim();
      if (!str.length) {
        const medianVal = medians[medianKeyMap[key]];
        const fallbackMedian = FIELD_META[key]?.max ? FIELD_META[key].max / 2 : 0;
        const fillVal = medianVal !== undefined && medianVal !== null && medianVal !== "" ? medianVal : fallbackMedian;
        nextForm[key] = String(fillVal);
        nextEstimated[key] = true;
      }
      const n = Number(nextForm[key]);
      if (!Number.isNaN(n)) {
        if (n < 0) nextErrors[key] = "Must be non-negative";
        const max = FIELD_META[key]?.max;
        if (max && n > max * 3) nextErrors[key] = `Above safe limit (${max * 3})`;
      }
    });
    setErrors(nextErrors);
    setEstimated(nextEstimated);
    setForm(nextForm);
    return { isValid: Object.keys(nextErrors).length === 0, nextForm };
  };

  const runPredict = async () => {
    setRequestError("");
    const { isValid, nextForm } = validateAndFill();
    if (!isValid) return;
    setSaving(true);
    try {
      const backendUrl = await getBackendUrl();
      const response = await predictAll({ backendUrl, input: nextForm });
      const mainScore = Number(response?.main?.score ?? response?.main?.prediction ?? response?.main?.risk ?? 0);
      const contextScore = Number(response?.context?.score ?? response?.context?.prediction ?? response?.context?.risk ?? 0);
      const fusionScore = Number((0.6 * mainScore + 0.4 * contextScore).toFixed(3));
      const delta = Math.abs(mainScore - contextScore);
      const contributions = Object.keys(medianKeyMap)
        .map((key) => {
          const base = Number(medians[medianKeyMap[key]] || 1);
          const current = Number(nextForm[key] || 0);
          return { key, val: Math.abs(current - base) / Math.max(Math.abs(base), 1) };
        })
        .sort((a, b) => b.val - a.val)
        .slice(0, 3);
      setResult({
        mainScore,
        contextScore,
        fusionScore,
        riskLabel: riskMeta(fusionScore).label,
        consistent: delta < 0.18,
        contributions,
        input: nextForm,
      });
    } catch (err) {
      setRequestError("Could not reach the model API. Ensure FastAPI is running and your phone/emulator is on the same WiFi.");
    } finally {
      setSaving(false);
    }
  };

  const saveReading = async () => {
    if (!result) return;
    const reading = await addReading({
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...result,
    });
    const nextHistory = [reading, ...history];
    const alerts = buildAlertsFromHistory(nextHistory);
    if (alerts.length) {
      await appendAlerts(alerts);
      for (const alert of alerts) {
        const canNotify = await shouldNotifyAlert(alert);
        if (canNotify) {
          await sendAlert(`AquaTrack Alert — ${alert.level[0].toUpperCase()}${alert.level.slice(1)}`, alert.message, {
            screen: "Results",
            readingId: reading.createdAt,
          });
        }
      }
    }
    await cancelReminder();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Main Inputs</Text>
        <View style={styles.sectionBody}>
          {visibleFields.map((fieldKey) => (
            <FieldInput
              key={fieldKey}
              fieldKey={fieldKey}
              value={`${form[fieldKey] ?? ""}`}
              estimated={!!estimated[fieldKey]}
              error={errors[fieldKey]}
              onChange={(v) => setForm((prev) => ({ ...prev, [fieldKey]: v }))}
            />
          ))}

          <Text style={styles.sliderLabel}>Running Speed: {form.runningSpeed || 0}</Text>
          <Slider
            minimumValue={0}
            maximumValue={20}
            step={0.1}
            value={Number(form.runningSpeed || 0)}
            minimumTrackTintColor={theme.colors.cyan}
            maximumTrackTintColor={theme.colors.inactive}
            onValueChange={(v) => setForm((prev) => ({ ...prev, runningSpeed: String(Number(v).toFixed(1)) }))}
          />
          <Text style={styles.sliderLabel}>Running Interval: {form.runningInterval || 0}</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => setForm((prev) => ({ ...prev, runningInterval: String(Math.max(0, Number(prev.runningInterval || 0) - 1)) }))}>
              <Text style={styles.stepperTxt}>-</Text>
            </TouchableOpacity>
            <Text style={styles.stepperVal}>{form.runningInterval || 0}</Text>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => setForm((prev) => ({ ...prev, runningInterval: String(Math.min(9, Number(prev.runningInterval || 0) + 1)) }))}>
              <Text style={styles.stepperTxt}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.segmentRow}>
            {TIME_OPTIONS.map((opt) => (
              <TouchableOpacity key={opt.key} style={[styles.segment, Number(form.timeOfDay) === opt.key && styles.segmentOn]} onPress={() => setForm((prev) => ({ ...prev, timeOfDay: opt.key }))}>
                <Text style={[styles.segmentText, Number(form.timeOfDay) === opt.key && styles.segmentTextOn]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.predictBtn} onPress={runPredict} disabled={saving}>
        <Text style={styles.predictTxt}>{saving ? "Predicting..." : "Predict"}</Text>
      </TouchableOpacity>
      {requestError ? <Text style={styles.requestError}>{requestError}</Text> : null}

      {result ? (
        <View style={styles.resultsWrap}>
          <View style={styles.gaugeRow}>
            <ScoreGauge score={result.mainScore} title="Main Model Score" />
            <ScoreGauge score={result.contextScore} title="Context Score" />
          </View>
          <ScoreGauge score={result.fusionScore} title="Fusion Score" large />
          <Text style={styles.consistency}>{result.consistent ? "✅ Consistent" : "⚠️ Signals conflict"}</Text>
          <Text style={styles.subTitle}>Top Feature Contributions</Text>
          {result.contributions.map((item) => (
            <View key={item.key} style={styles.barWrap}>
              <Text style={styles.barLabel}>{FIELD_META[item.key]?.label || item.key}</Text>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${Math.min(100, Math.round(item.val * 100))}%` }]} />
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.saveBtn} onPress={saveReading}>
            <Text style={styles.saveTxt}>Save This Reading</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, paddingBottom: 34, gap: 10 },
  card: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 12 },
  sectionTitle: { color: theme.colors.text, fontFamily: theme.fonts.heading },
  sectionBody: { marginTop: 8 },
  fieldWrap: { marginBottom: 8 },
  fieldHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { color: theme.colors.text, fontFamily: theme.fonts.bodyBold, marginBottom: 4, fontSize: 12 },
  estimated: { color: "#9ca3af", fontFamily: theme.fonts.body, fontSize: 11 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, color: theme.colors.text, backgroundColor: theme.colors.cardAlt, fontFamily: theme.fonts.body },
  inputError: { borderColor: theme.colors.high },
  error: { color: theme.colors.high, fontFamily: theme.fonts.body, fontSize: 11, marginTop: 2 },
  sliderLabel: { color: theme.colors.muted, fontFamily: theme.fonts.body, marginTop: 6 },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 6 },
  stepperBtn: { backgroundColor: theme.colors.cardAlt, borderColor: theme.colors.border, borderWidth: 1, width: 34, height: 34, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  stepperTxt: { color: theme.colors.text, fontFamily: theme.fonts.bodyBold, fontSize: 18 },
  stepperVal: { color: theme.colors.text, fontFamily: theme.fonts.heading, minWidth: 24, textAlign: "center" },
  segmentRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  segment: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  segmentOn: { backgroundColor: theme.colors.cyan, borderColor: theme.colors.cyan },
  segmentText: { color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: 12 },
  segmentTextOn: { color: theme.colors.background, fontFamily: theme.fonts.bodyBold },
  predictBtn: { backgroundColor: theme.colors.cyan, borderRadius: 12, alignItems: "center", paddingVertical: 14 },
  predictTxt: { color: theme.colors.background, fontFamily: theme.fonts.bodyBold },
  requestError: { color: theme.colors.high, fontFamily: theme.fonts.body, marginTop: 6 },
  resultsWrap: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 12 },
  gaugeRow: { flexDirection: "row", justifyContent: "space-around", gap: 8 },
  consistency: { color: theme.colors.text, fontFamily: theme.fonts.bodyBold, textAlign: "center", marginVertical: 8 },
  subTitle: { color: theme.colors.text, fontFamily: theme.fonts.heading, marginBottom: 6 },
  barWrap: { marginBottom: 8 },
  barLabel: { color: theme.colors.muted, fontFamily: theme.fonts.body, marginBottom: 4, fontSize: 12 },
  track: { height: 10, borderRadius: 999, overflow: "hidden", backgroundColor: theme.colors.cardAlt },
  bar: { height: 10, backgroundColor: theme.colors.cyan },
  saveBtn: { marginTop: 8, borderWidth: 1, borderColor: theme.colors.cyan, borderRadius: 10, alignItems: "center", paddingVertical: 11 },
  saveTxt: { color: theme.colors.cyan, fontFamily: theme.fonts.bodyBold },
});
