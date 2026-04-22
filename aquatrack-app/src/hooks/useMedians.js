import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { getBackendUrl } from "../../app/services/backendUrl";
import { fetchMedians } from "../../app/services/api";

const KEY = "aquatrack_medians";

export function useMedians() {
  const [medians, setMedians] = useState({});
  const [loading, setLoading] = useState(true);

  const loadMedians = useCallback(async () => {
    const cached = await AsyncStorage.getItem(KEY);
    if (cached) setMedians(JSON.parse(cached));
    try {
      const backendUrl = await getBackendUrl();
      const fromApi = await fetchMedians(backendUrl);
      if (fromApi && Object.keys(fromApi).length) {
        setMedians(fromApi);
        await AsyncStorage.setItem(KEY, JSON.stringify(fromApi));
      }
    } catch (err) {
      // Keep cached medians when offline.
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMedians();
  }, [loadMedians]);

  return { medians, loading, refresh: loadMedians };
}
