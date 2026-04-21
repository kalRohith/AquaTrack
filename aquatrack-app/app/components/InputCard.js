import { StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS } from "../constants/colors";

export default function InputCard({ label, hint, value, onChangeText, keyboardType = "default", usingEstimate, delta }) {
  const deltaText = delta === null || delta === undefined ? "" : delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        {deltaText ? <Text style={styles.delta}>{deltaText}</Text> : null}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={hint}
        placeholderTextColor={COLORS.textSecondary}
        style={styles.input}
      />
      <View style={styles.footer}>
        <Text style={styles.hint}>{hint}</Text>
        {usingEstimate ? <Text style={styles.estimate}>Using estimate</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { color: COLORS.textPrimary, fontWeight: "700", marginBottom: 8 },
  delta: { color: COLORS.accent, fontWeight: "700" },
  input: { backgroundColor: COLORS.cardAlt, borderRadius: 12, color: COLORS.textPrimary, paddingHorizontal: 12, paddingVertical: 10 },
  footer: { marginTop: 8, flexDirection: "row", justifyContent: "space-between" },
  hint: { color: COLORS.textSecondary, fontSize: 12 },
  estimate: { color: COLORS.medium, fontSize: 12, fontWeight: "700" },
});
