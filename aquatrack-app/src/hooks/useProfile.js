import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { demoProfile, USE_DEMO_SEED_DATA } from "../data/demoData";
import { scopedStorageKey } from "../services/auth";
import { useAuth } from "./useAuth";

const PROFILE_KEY = "userProfile";

export const defaultProfile = {
  name: "",
  age: "",
  interests: "",
  photoUri: "",
  gender: "",
  goal: "",
  weight: "",
  height: "",
  activityLevel: "moderate",
  dailyWaterGoal: 2500,
  climateZone: "temperate",
};

export function useProfile() {
  const { user } = useAuth();
  const storageKey = scopedStorageKey(PROFILE_KEY, user?.username);
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!user?.username) return;
    const raw = await AsyncStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!raw && USE_DEMO_SEED_DATA) {
      const seeded = { ...defaultProfile, ...demoProfile };
      await AsyncStorage.setItem(storageKey, JSON.stringify(seeded));
      setProfile(seeded);
      setLoading(false);
      return;
    }
    setProfile({ ...defaultProfile, ...parsed });
    setLoading(false);
  }, [storageKey, user?.username]);

  useEffect(() => {
    setProfile(defaultProfile);
    setLoading(true);
    loadProfile();
  }, [loadProfile]);

  const saveProfile = useCallback(async (nextProfile) => {
    setProfile(nextProfile);
    await AsyncStorage.setItem(storageKey, JSON.stringify(nextProfile));
  }, [storageKey]);

  return {
    profile,
    setProfile,
    saveProfile,
    loading,
  };
}
