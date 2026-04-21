import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AppState } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import AppNavigator from "./app/AppNavigator";
import { StoreProvider, useHistoryStore } from "./app/store/useHistoryStore";

function AuthGate() {
  const { settings } = useHistoryStore();

  useEffect(() => {
    const lockIfNeeded = async () => {
      if (!settings.faceIdEnabled) return;
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) return;
      await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock AquaTrack",
        fallbackLabel: "Use Passcode",
      });
    };
    lockIfNeeded();
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") lockIfNeeded();
    });
    return () => sub.remove();
  }, [settings.faceIdEnabled]);

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AuthGate />
    </StoreProvider>
  );
}
