import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_BACKEND_URL } from "../constants/endpoints";

const HISTORY_KEY = "aquatrack_history_v1";
const SETTINGS_KEY = "aquatrack_settings_v1";
const ONBOARDING_KEY = "aquatrack_seen_onboarding_v1";

const defaultSettings = {
  profileName: "",
  backendUrl: DEFAULT_BACKEND_URL,
  faceIdEnabled: false,
  units: "metric",
  modelVersion: "AquaTrack v1",
  lastTrainedDate: "Unknown",
};

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const [rawHistory, rawSettings, rawSeen] = await Promise.all([
        AsyncStorage.getItem(HISTORY_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ]);
      if (rawHistory) setHistory(JSON.parse(rawHistory));
      if (rawSettings) setSettings((prev) => ({ ...prev, ...JSON.parse(rawSettings) }));
      if (rawSeen === "true") setHasSeenOnboarding(true);
      setHydrated(true);
    })();
  }, []);

  const persistHistory = async (next) => {
    setHistory(next);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const addReading = async (reading) => {
    const next = [{ id: `${Date.now()}`, createdAt: new Date().toISOString(), ...reading }, ...history];
    await persistHistory(next);
    return next[0];
  };

  const clearHistory = async () => {
    await persistHistory([]);
  };

  const updateSettings = async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  };

  const completeOnboarding = async () => {
    setHasSeenOnboarding(true);
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
  };

  const value = useMemo(
    () => ({
      history,
      settings,
      hasSeenOnboarding,
      hydrated,
      addReading,
      clearHistory,
      updateSettings,
      completeOnboarding,
    }),
    [history, settings, hasSeenOnboarding, hydrated]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useHistoryStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useHistoryStore must be used inside StoreProvider");
  }
  return ctx;
}
