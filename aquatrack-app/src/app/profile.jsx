import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import Slider from "@react-native-community/slider";
import { useProfile } from "../hooks/useProfile";
import { useHistory } from "../hooks/useHistory";
import { theme } from "../theme";

export default function ProfileScreen() {
  const { profile, setProfile, saveProfile } = useProfile();
  const { history } = useHistory();
  const [saved, setSaved] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const todayIntake = history
    .filter((item) => new Date(item.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, item) => sum + (item.input?.waterIntakeMl ? Number(item.input.waterIntakeMl) : 250), 0);

  const progress = Math.min(1, todayIntake / Number(profile.dailyWaterGoal || 2500));

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: progress, duration: 500, useNativeDriver: false }).start();
  }, [progress, progressAnim]);

  const onSave = async () => {
    await saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };

  const update = (key, value) => setProfile((prev) => ({ ...prev, [key]: value }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {["name", "age", "weight", "height"].map((field) => (
        <View key={field} style={styles.inputWrap}>
          <Text style={styles.label}>{field[0].toUpperCase() + field.slice(1)}</Text>
          <TextInput
            value={`${profile[field] ?? ""}`}
            onChangeText={(value) => update(field, value)}
            style={styles.input}
            placeholderTextColor={theme.colors.muted}
          />
        </View>
      ))}

      <View style={styles.inputWrap}>
        <Text style={styles.label}>Activity Level</Text>
        <Picker selectedValue={profile.activityLevel} onValueChange={(v) => update("activityLevel", v)} dropdownIconColor={theme.colors.cyan} style={styles.picker}>
          <Picker.Item label="Sedentary" value="sedentary" />
          <Picker.Item label="Moderate" value="moderate" />
          <Picker.Item label="Active" value="active" />
          <Picker.Item label="Athlete" value="athlete" />
        </Picker>
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.label}>Daily Water Goal: {Math.round(profile.dailyWaterGoal)} mL</Text>
        <Slider
          minimumValue={1000}
          maximumValue={4000}
          step={50}
          value={Number(profile.dailyWaterGoal)}
          minimumTrackTintColor={theme.colors.cyan}
          maximumTrackTintColor={theme.colors.inactive}
          thumbTintColor={theme.colors.cyan}
          onValueChange={(v) => update("dailyWaterGoal", v)}
        />
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.label}>Climate Zone</Text>
        <Picker selectedValue={profile.climateZone} onValueChange={(v) => update("climateZone", v)} dropdownIconColor={theme.colors.cyan} style={styles.picker}>
          <Picker.Item label="Cold" value="cold" />
          <Picker.Item label="Temperate" value="temperate" />
          <Picker.Item label="Hot & Humid" value="hot_humid" />
          <Picker.Item label="Hot & Dry" value="hot_dry" />
        </Picker>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Today's Goal Progress</Text>
        <Text style={styles.progressSub}>
          {Math.round(todayIntake)} / {Math.round(profile.dailyWaterGoal)} mL
        </Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={onSave}>
        <Text style={styles.saveText}>Save Profile {saved ? "Saved ✓" : ""}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, paddingBottom: 36 },
  inputWrap: { marginBottom: 12 },
  label: { color: theme.colors.text, fontFamily: theme.fonts.bodyBold, marginBottom: 6 },
  input: {
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: theme.fonts.body,
  },
  picker: { backgroundColor: theme.colors.card, color: theme.colors.text, borderRadius: 10 },
  progressCard: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12, marginTop: 4, marginBottom: 16 },
  progressTitle: { color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: 18 },
  progressSub: { color: theme.colors.muted, fontFamily: theme.fonts.body, marginTop: 4, marginBottom: 10 },
  progressTrack: { backgroundColor: theme.colors.inactive, borderRadius: 999, height: 10, overflow: "hidden" },
  progressFill: { backgroundColor: theme.colors.cyan, height: 10 },
  saveButton: { backgroundColor: theme.colors.cyan, borderRadius: 12, alignItems: "center", paddingVertical: 14 },
  saveText: { color: theme.colors.background, fontFamily: theme.fonts.bodyBold, fontSize: 15 },
});
