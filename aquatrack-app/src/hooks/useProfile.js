import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { demoProfile, USE_DEMO_SEED_DATA } from "../data/demoData";

const PROFILE_KEY = "userProfile";

export const defaultProfile = {
  name: "",
  age: "",
  weight: "",
  height: "",
  activityLevel: "moderate",
  dailyWaterGoal: 2500,
  climateZone: "temperate",
};

export function useProfile() {
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!raw && USE_DEMO_SEED_DATA) {
      const seeded = { ...defaultProfile, ...demoProfile };
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(seeded));
      setProfile(seeded);
      setLoading(false);
      return;
    }
    setProfile({ ...defaultProfile, ...parsed });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = useCallback(async (nextProfile) => {
    setProfile(nextProfile);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
  }, []);

  return {
    profile,
    setProfile,
    saveProfile,
    loading,
  };
}
