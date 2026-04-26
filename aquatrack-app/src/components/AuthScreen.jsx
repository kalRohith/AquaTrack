import { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../hooks/useAuth";
import { theme } from "../theme";

export default function AuthScreen() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    interests: "",
    photoUri: "",
    gender: "",
    goal: "",
    height: "",
    weight: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      if (isSignup) {
        await signup(username, password, profile);
      } else {
        await login(username, password);
      }
    } catch (err) {
      setError(err?.message || "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
  };

  const updateProfile = (key, value) => setProfile((prev) => ({ ...prev, [key]: value }));

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
      updateProfile("photoUri", result.assets[0].uri);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.panel}>
        <Text style={styles.brand}>AquaTrack</Text>
        <Text style={styles.title}>{isSignup ? "Create Account" : "Welcome Back"}</Text>

        <View style={styles.segment}>
          <TouchableOpacity style={[styles.segmentBtn, mode === "login" && styles.segmentOn]} onPress={() => switchMode("login")}>
            <Text style={[styles.segmentText, mode === "login" && styles.segmentTextOn]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segmentBtn, mode === "signup" && styles.segmentOn]} onPress={() => switchMode("signup")}>
            <Text style={[styles.segmentText, mode === "signup" && styles.segmentTextOn]}>Signup</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={theme.colors.muted}
          secureTextEntry
        />

        {isSignup ? (
          <>
            <View style={styles.photoRow}>
              {profile.photoUri ? (
                <Image source={{ uri: profile.photoUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{(profile.name || username || "A")[0].toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.photoLabel}>Profile Photo</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Text style={styles.uploadBtnText}>Choose Image</Text>
                </TouchableOpacity>
                <TextInput
                  value={profile.photoUri}
                  onChangeText={(value) => updateProfile("photoUri", value)}
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="Or image URL..."
                  placeholderTextColor={theme.colors.muted}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TextInput value={profile.name} onChangeText={(value) => updateProfile("name", value)} style={styles.input} placeholder="Full name" placeholderTextColor={theme.colors.muted} />
            <TextInput value={profile.age} onChangeText={(value) => updateProfile("age", value)} style={styles.input} placeholder="Age" placeholderTextColor={theme.colors.muted} keyboardType="numeric" />
            <TextInput value={profile.gender} onChangeText={(value) => updateProfile("gender", value)} style={styles.input} placeholder="Gender" placeholderTextColor={theme.colors.muted} />
            <TextInput value={profile.height} onChangeText={(value) => updateProfile("height", value)} style={styles.input} placeholder="Height (cm)" placeholderTextColor={theme.colors.muted} keyboardType="numeric" />
            <TextInput value={profile.weight} onChangeText={(value) => updateProfile("weight", value)} style={styles.input} placeholder="Weight (kg)" placeholderTextColor={theme.colors.muted} keyboardType="numeric" />
            <TextInput value={profile.goal} onChangeText={(value) => updateProfile("goal", value)} style={styles.input} placeholder="Hydration goal" placeholderTextColor={theme.colors.muted} />
            <TextInput
              value={profile.interests}
              onChangeText={(value) => updateProfile("interests", value)}
              style={[styles.input, styles.multiline]}
              placeholder="Interests"
              placeholderTextColor={theme.colors.muted}
              multiline
            />
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={[styles.primary, submitting && styles.disabled]} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.primaryText}>{isSignup ? "Create Account" : "Login"}</Text>}
        </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 18 },
  panel: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card, borderRadius: 8, padding: 18 },
  brand: { color: theme.colors.cyan, fontFamily: theme.fonts.heading, fontSize: 32, textAlign: "center" },
  title: { color: theme.colors.text, fontFamily: theme.fonts.bodyBold, fontSize: 18, textAlign: "center", marginTop: 8, marginBottom: 16 },
  segment: { flexDirection: "row", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, overflow: "hidden", marginBottom: 14 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: theme.colors.cardAlt },
  segmentOn: { backgroundColor: theme.colors.cyan },
  segmentText: { color: theme.colors.text, fontFamily: theme.fonts.bodyBold },
  segmentTextOn: { color: theme.colors.background },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: theme.fonts.body,
    marginBottom: 10,
  },
  error: { color: theme.colors.high, fontFamily: theme.fonts.body, marginBottom: 10 },
  primary: { backgroundColor: theme.colors.cyan, borderRadius: 8, paddingVertical: 13, alignItems: "center", marginTop: 2 },
  disabled: { opacity: 0.7 },
  primaryText: { color: theme.colors.background, fontFamily: theme.fonts.bodyBold, fontSize: 15 },
  photoRow: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 2 },
  avatar: { width: 74, height: 74, borderRadius: 37, backgroundColor: theme.colors.cardAlt },
  avatarFallback: { width: 74, height: 74, borderRadius: 37, backgroundColor: theme.colors.cardAlt, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", justifyContent: "center" },
  avatarText: { color: theme.colors.cyan, fontFamily: theme.fonts.heading, fontSize: 30 },
  photoLabel: { color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: 11, marginBottom: 4 },
  multiline: { minHeight: 76, textAlignVertical: "top" },
  uploadBtn: { backgroundColor: theme.colors.cardAlt, borderWidth: 1, borderColor: theme.colors.cyan, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  uploadBtnText: { color: theme.colors.cyan, fontFamily: theme.fonts.bodyBold, fontSize: 12 },
});
