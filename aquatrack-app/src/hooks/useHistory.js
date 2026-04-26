import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { demoHistory, USE_DEMO_SEED_DATA } from "../data/demoData";
import { useAuth } from "./useAuth";
import { scopedStorageKey } from "../services/auth";
import { riskMeta } from "../theme";

const HISTORY_KEY = "aquatrack_history";

const normalizeEntry = (entry, index) => {
  const fusionScore = Number(entry.fusionScore ?? entry.score ?? 0);
  return {
    id: entry.id || `${entry.createdAt || Date.now()}-${index}`,
    createdAt: entry.createdAt || new Date().toISOString(),
    fusionScore,
    mainScore: Number(entry.mainScore ?? 0),
    contextScore: Number(entry.contextScore ?? 0),
    riskLabel: entry.riskLabel || riskMeta(fusionScore).label,
    input: entry.input || {},
    ...entry,
  };
};

export function useHistory() {
  const { user } = useAuth();
  const storageKey = scopedStorageKey(HISTORY_KEY, user?.username);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!user?.username) return;
    const raw = await AsyncStorage.getItem(storageKey);
    let parsed = raw ? JSON.parse(raw) : [];
    if (!parsed.length && USE_DEMO_SEED_DATA) {
      parsed = demoHistory;
      await AsyncStorage.setItem(storageKey, JSON.stringify(parsed));
    }
    const normalized = parsed.map(normalizeEntry).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setHistory(normalized);
    setLoading(false);
  }, [storageKey, user?.username]);

  useEffect(() => {
    setHistory([]);
    setLoading(true);
    loadHistory();
  }, [loadHistory]);

  const persist = useCallback(async (next) => {
    setHistory(next);
    await AsyncStorage.setItem(storageKey, JSON.stringify(next));
  }, [storageKey]);

  const deleteReading = useCallback(
    async (id) => {
      const next = history.filter((item) => item.id !== id);
      await persist(next);
    },
    [history, persist]
  );

  const addReading = useCallback(
    async (reading) => {
      const normalized = normalizeEntry(reading, 0);
      const next = [normalized, ...history].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      await persist(next);
      return normalized;
    },
    [history, persist]
  );

  const stats = useMemo(() => {
    const total = history.length;
    const avg = total ? history.reduce((sum, item) => sum + Number(item.fusionScore || 0), 0) / total : 0;
    const highest = history.reduce((max, item) => Math.max(max, Number(item.fusionScore || 0)), 0);
    return { average: avg, highest, total };
  }, [history]);

  return {
    history,
    loading,
    loadHistory,
    deleteReading,
    addReading,
    stats,
  };
}
