import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProfile } from "../hooks/useProfile";
import { useHistory } from "../hooks/useHistory";
import { useAuth } from "../hooks/useAuth";
import { scopedStorageKey } from "../services/auth";
import { theme } from "../theme";

const WATER_LOG_KEY = "aquatrack_water_log";

export default function ProfileScreen() {
  const { profile, setProfile, saveProfile } = useProfile();
  const { history } = useHistory();
  const { user, logout } = useAuth();
  const [saved, setSaved] = useState(false);
  const [todayWater, setTodayWater] = useState(0);
  const todayKey = new Date().toISOString().slice(0, 10);
  const waterLogKey = scopedStorageKey(WATER_LOG_KEY, user?.username);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(waterLogKey);
      const logs = raw ? JSON.parse(raw) : {};
      setTodayWater(Number(logs[todayKey] || 0));
    })();
  }, [todayKey, waterLogKey]);

  const adjustedGoal = useMemo(() => {
    const weight = Number(profile.weight || 0);
    const multi = profile.activityLevel === "active" ? 40 : profile.activityLevel === "sedentary" ? 30 : 35;
    return Math.round(weight * multi);
  }, [profile.weight, profile.activityLevel]);

  const bmi = useMemo(() => {
    const h = Number(profile.height || 0) / 100;
    const w = Number(profile.weight || 0);
    if (!h || !w) return 0;
    return w / (h * h);
  }, [profile.height, profile.weight]);

  const progress = Math.min(1, (todayWater || 0) / Number(profile.dailyWaterGoal || adjustedGoal || 1));
  const stats = useMemo(() => {
    const totalReadings = history.length;
    const avgScore = totalReadings ? history.reduce((sum, h) => sum + Number(h.fusionScore || 0), 0) / totalReadings : 0;
    const first = history[history.length - 1];
    const daysSince = first ? Math.max(1, Math.round((Date.now() - new Date(first.createdAt).getTime()) / 86400000)) : 0;
    return { totalReadings, avgScore, daysSince };
  }, [history]);

  const streak = useMemo(() => {
    const grouped = {};
    history.forEach((h) => {
      const day = new Date(h.createdAt).toISOString().slice(0, 10);
      grouped[day] = grouped[day] || [];
      grouped[day].push(Number(h.fusionScore || 0));
    });
    const days = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
    let current = 0;
    let best = 0;
    for (const day of days) {
      const ok = grouped[day].length && grouped[day].every((x) => x < 0.65);
      if (ok) {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
    return { weekly: current, best };
  }, [history]);

  const onSave = async () => {
    const next = { ...profile, dailyWaterGoal: Number(profile.dailyWaterGoal || adjustedGoal || 2500) };
    await saveProfile(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };

  const update = (key, value) => setProfile((prev) => ({ ...prev, [key]: value }));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need access to your gallery to upload a profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      update("photoUri", result.assets[0].uri);
    }
  };

  const addWater = async () => {
    const raw = await AsyncStorage.getItem(waterLogKey);
    const logs = raw ? JSON.parse(raw) : {};
    const next = Number(logs[todayKey] || 0) + 250;
    logs[todayKey] = next;
    await AsyncStorage.setItem(waterLogKey, JSON.stringify(logs));
    setTodayWater(next);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.accountCard}>
        <View style={styles.accountLeft}>
          {profile.photoUri ? (
            <Image source={{ uri: profile.photoUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{(profile.name || user?.username || "A")[0].toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.accountLabel}>Signed in as</Text>
            <Text style={styles.accountName}>{profile.name || user?.displayName || user?.username}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.label}>Profile Photo</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
          <Text style={styles.uploadBtnText}>Choose from Gallery</Text>
        </TouchableOpacity>
        <TextInput
          value={`${profile.photoUri ?? ""}`}
          onChangeText={(value) => update("photoUri", value)}
          style={[styles.input, { marginTop: 8 }]}
          placeholder="Or paste image URL here..."
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="none"
        />
      </View>

      {["name", "age", "gender", "weight", "height", "goal"].map((field) => (
        <View key={field} style={styles.inputWrap}>
          <Text style={styles.label}>{labelFor(field)}</Text>
          <TextInput
            value={`${profile[field] ?? ""}`}
            onChangeText={(value) => update(field, value)}
            style={styles.input}
            placeholderTextColor={theme.colors.muted}
          />
        </View>
      ))}

      <View style={styles.inputWrap}>
        <Text style={styles.label}>Interests</Text>
        <TextInput
          value={`${profile.interests ?? ""}`}
          onChangeText={(value) => update("interests", value)}
          style={[styles.input, styles.multiline]}
          placeholderTextColor={theme.colors.muted}
          multiline
        />
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.label}>Activity Level (affects recommended intake)</Text>
        <Picker selectedValue={profile.activityLevel} onValueChange={(v) => update("activityLevel", v)} dropdownIconColor={theme.colors.cyan} style={styles.picker}>
          <Picker.Item label="Sedentary" value="sedentary" />
          <Picker.Item label="Moderate" value="moderate" />
          <Picker.Item label="Active" value="active" />
        </Picker>
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.label}>Daily Water Goal (ml)</Text>
        <TextInput
          value={`${profile.dailyWaterGoal ?? adjustedGoal}`}
          onChangeText={(value) => update("dailyWaterGoal", value)}
          style={styles.input}
          keyboardType="numeric"
          placeholderTextColor={theme.colors.muted}
        />
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Today's Hydration Progress</Text>
        <Text style={styles.progressSub}>
          {Math.round(todayWater)} / {Math.round(Number(profile.dailyWaterGoal || adjustedGoal || 0))} mL
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <TouchableOpacity style={styles.addWaterBtn} onPress={addWater}>
          <Text style={styles.addWaterTxt}>+ Add 250ml</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressSub}>BMI: {bmi ? bmi.toFixed(1) : "--"} ({bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese"})</Text>
        <Text style={styles.progressSub}>Recommended Daily Intake: {adjustedGoal || 0} ml</Text>
        <Text style={styles.progressSub}>Weekly low-risk streak: 🔥 {streak.weekly} days</Text>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statCard}><Text style={styles.statLabel}>Total readings</Text><Text style={styles.statValue}>{stats.totalReadings}</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>Avg fusion</Text><Text style={styles.statValue}>{Math.round(stats.avgScore * 100)}%</Text></View>
      </View>
      <View style={styles.statRow}>
        <View style={styles.statCard}><Text style={styles.statLabel}>Best streak</Text><Text style={styles.statValue}>{streak.best}</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>Days tracked</Text><Text style={styles.statValue}>{stats.daysSince}</Text></View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={onSave}>
        <Text style={styles.saveText}>Save Profile {saved ? "Saved ✓" : ""}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function labelFor(field) {
  const labels = {
    name: "Name",
    age: "Age",
    gender: "Gender",
    weight: "Weight",
    height: "Height",
    goal: "Hydration Goal",
  };
  return labels[field] || field;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, paddingBottom: 36 },
  accountCard: { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  accountLeft: { flexDirection: "row", gap: 10, alignItems: "center", flex: 1 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: theme.colors.cardAlt },
  avatarFallback: { width: 58, height: 58, borderRadius: 29, backgroundColor: theme.colors.cardAlt, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", justifyContent: "center" },
  avatarText: { color: theme.colors.cyan, fontFamily: theme.fonts.heading, fontSize: 24 },
  accountLabel: { color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: 11 },
  accountName: { color: theme.colors.text, fontFamily: theme.fonts.bodyBold, marginTop: 3 },
  logoutBtn: { borderWidth: 1, borderColor: theme.colors.high, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  logoutText: { color: theme.colors.high, fontFamily: theme.fonts.bodyBold },
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
  multiline: { minHeight: 76, textAlignVertical: "top" },
  picker: { backgroundColor: theme.colors.card, color: theme.colors.text, borderRadius: 10 },
  progressCard: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12, marginTop: 4, marginBottom: 16 },
  progressTitle: { color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: 18 },
  progressSub: { color: theme.colors.muted, fontFamily: theme.fonts.body, marginTop: 4, marginBottom: 10 },
  progressTrack: { backgroundColor: theme.colors.inactive, borderRadius: 999, height: 10, overflow: "hidden" },
  progressFill: { backgroundColor: theme.colors.cyan, height: 10 },
  addWaterBtn: { marginTop: 12, borderWidth: 1, borderColor: theme.colors.cyan, borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  addWaterTxt: { color: theme.colors.cyan, fontFamily: theme.fonts.bodyBold },
  statRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 10, padding: 10 },
  statLabel: { color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: 11 },
  statValue: { color: theme.colors.text, fontFamily: theme.fonts.heading, marginTop: 3 },
  saveButton: { backgroundColor: theme.colors.cyan, borderRadius: 12, alignItems: "center", paddingVertical: 14 },
  saveText: { color: theme.colors.background, fontFamily: theme.fonts.bodyBold, fontSize: 15 },
  uploadBtn: { backgroundColor: theme.colors.cardAlt, borderWidth: 1, borderColor: theme.colors.cyan, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  uploadBtnText: { color: theme.colors.cyan, fontFamily: theme.fonts.bodyBold },
});
