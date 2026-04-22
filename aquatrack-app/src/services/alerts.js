import AsyncStorage from "@react-native-async-storage/async-storage";

export const ALERT_HISTORY_KEY = "aquatrack_alert_history";
const LAST_NOTIFICATION_KEY = "aquatrack_alert_last_notification";
const THIRTY_MIN_MS = 30 * 60 * 1000;

export function buildAlertsFromHistory(history) {
  if (!history.length) return [];
  const latest = history[0];
  const prev = history[1];
  const last3 = history.slice(0, 3);
  const nowScore = Number(latest.fusionScore || 0);
  const prevScore = Number(prev?.fusionScore || 0);
  const hours = Number((((new Date(latest.createdAt) - new Date(last3[2]?.createdAt || latest.createdAt)) / 3600000) || 0).toFixed(1));
  const out = [];

  const mk = (level, message) => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    level,
    message,
    createdAt: latest.createdAt || new Date().toISOString(),
    score: nowScore,
  });

  if (nowScore > 0.75) out.push(mk("critical", "Severe dehydration risk detected. Drink water immediately."));
  if (last3.length === 3 && last3.every((r) => Number(r.fusionScore || 0) > 0.65)) {
    out.push(mk("critical", `Sustained high risk for ${hours || 1} hours. Seek medical advice if symptoms persist.`));
  }
  if (prev && nowScore - prevScore > 0.2) out.push(mk("critical", "Sharp dehydration spike detected."));

  if (nowScore >= 0.5 && nowScore <= 0.75) {
    out.push(mk("warning", "Moderate dehydration. Aim for 500ml water in next 30 mins."));
  }
  if (last3.length === 3 && Number(last3[0].fusionScore) > Number(last3[1].fusionScore) && Number(last3[1].fusionScore) > Number(last3[2].fusionScore)) {
    out.push(mk("warning", "Your hydration is declining steadily."));
  }
  if (Number(latest.input?.ambientTemperature || 0) > 32 && nowScore > 0.4) {
    out.push(mk("warning", "Hot conditions worsening dehydration risk."));
  }
  if (Number(latest.input?.runningInterval || 0) > 5 && nowScore > 0.4) {
    out.push(mk("warning", "Post-exercise dehydration detected."));
  }

  if (nowScore < 0.4 && prev && prevScore > 0.5) {
    out.push(mk("info", "Great improvement! Keep hydrating."));
  }
  const low7 = history.filter((r) => new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 3600000) && Number(r.fusionScore || 0) < 0.4);
  if (low7.length >= 7) out.push(mk("info", "Excellent hydration streak - 7 days strong!"));
  return dedupeAlerts(out);
}

export async function getAlertHistory() {
  const raw = await AsyncStorage.getItem(ALERT_HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveAlertHistory(next) {
  await AsyncStorage.setItem(ALERT_HISTORY_KEY, JSON.stringify(next.slice(0, 30)));
}

export async function appendAlert(alert) {
  if (!alert) return null;
  const list = await getAlertHistory();
  const next = [alert, ...list].slice(0, 30);
  await saveAlertHistory(next);
  return alert;
}

export async function appendAlerts(alerts) {
  if (!alerts?.length) return [];
  const list = await getAlertHistory();
  const next = dedupeAlerts([...alerts, ...list]).slice(0, 30);
  await saveAlertHistory(next);
  return alerts;
}

export async function shouldNotifyAlert(alert) {
  const raw = await AsyncStorage.getItem(LAST_NOTIFICATION_KEY);
  const state = raw ? JSON.parse(raw) : {};
  const key = `${alert.level}:${alert.message}`;
  const lastTs = Number(state[key] || 0);
  if (Date.now() - lastTs < THIRTY_MIN_MS) return false;
  const next = { ...state, [key]: Date.now() };
  await AsyncStorage.setItem(LAST_NOTIFICATION_KEY, JSON.stringify(next));
  return true;
}

function dedupeAlerts(list) {
  const seen = new Set();
  return list.filter((item) => {
    const key = `${item.level}:${item.message}:${new Date(item.createdAt).toISOString().slice(0, 16)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
