import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { demoHistory, USE_DEMO_SEED_DATA } from "../data/demoData";
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
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    let parsed = raw ? JSON.parse(raw) : [];
    if (!parsed.length && USE_DEMO_SEED_DATA) {
      parsed = demoHistory;
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(parsed));
    }
    const normalized = parsed.map(normalizeEntry).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setHistory(normalized);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const persist = useCallback(async (next) => {
    setHistory(next);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }, []);

  const deleteReading = useCallback(
    async (id) => {
      const next = history.filter((item) => item.id !== id);
      await persist(next);
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
    stats,
  };
}
