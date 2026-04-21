import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/colors";

export default function OfflineBanner() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>Offline - showing last reading</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: `${COLORS.offline}55`, borderRadius: 10, padding: 8, marginBottom: 8, borderWidth: 1, borderColor: COLORS.offline },
  text: { color: COLORS.textPrimary, fontSize: 12, textAlign: "center" },
});
