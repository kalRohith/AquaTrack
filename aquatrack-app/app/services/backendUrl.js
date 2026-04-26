import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { NativeModules, Platform } from "react-native";
import { DEFAULT_BACKEND_URL } from "../constants/endpoints";

const SETTINGS_KEY = "aquatrack_settings_v1";
const DEFAULT_API_PORT = "8000";

export async function getBackendUrl() {
  const configured = await getConfiguredBackendUrl();
  return resolveBackendUrl(configured);
}

async function getConfiguredBackendUrl() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_BACKEND_URL;
    const parsed = JSON.parse(raw);
    return parsed?.backendUrl || DEFAULT_BACKEND_URL;
  } catch (err) {
    return DEFAULT_BACKEND_URL;
  }
}

export function resolveBackendUrl(url) {
  const envUrl = typeof process !== "undefined" ? process.env.EXPO_PUBLIC_API_URL : "";
  const rawConfigured = normalizeUrl(envUrl || url || DEFAULT_BACKEND_URL);
  const configured = isSupportedBackendUrl(rawConfigured) ? rawConfigured : DEFAULT_BACKEND_URL;
  const configuredPort = getPort(configured) || DEFAULT_API_PORT;
  const devHost = getExpoDevHost();

  // Keep explicit remote HTTPS backends (e.g. deployed API).
  if (/^https:\/\//i.test(configured)) {
    return configured;
  }

  // Physical devices cannot reach a laptop API through localhost. In dev,
  // rewrite local URLs to the Expo LAN host only when Expo exposes one.
  if (__DEV__) {
    if (!isLoopbackUrl(configured)) {
      return configured;
    }
    if (devHost && !isLoopbackHost(devHost)) {
      return `http://${devHost}:${configuredPort}`;
    }
    if (Platform.OS === "android") {
      return `http://10.0.2.2:${configuredPort}`;
    }
    return configured;
  }

  if (!isLoopbackUrl(configured) || !devHost || isLoopbackHost(devHost)) {
    return configured;
  }

  return `http://${devHost}:${configuredPort}`;
}

function getExpoDevHost() {
  const candidates = [
    NativeModules?.SourceCode?.scriptURL,
    Constants?.expoConfig?.hostUri,
    Constants?.manifest?.debuggerHost,
    Constants?.manifest2?.extra?.expoGo?.debuggerHost,
  ].filter(Boolean);

  let firstHost = "";
  for (const candidate of candidates) {
    const host = extractHost(candidate);
    if (!host) continue;
    firstHost ||= host;
    if (!isLoopbackHost(host)) return host;
  }
  return firstHost;
}

function normalizeUrl(url) {
  return `${url || ""}`.trim().replace(/\/+$/, "");
}

function extractHost(value) {
  const match = `${value}`.match(/^(?:https?|exp):\/\/(?:.*@)?(\[[^\]]+\]|[^/:]+)(?::\d+)?/i) || `${value}`.match(/^(\[[^\]]+\]|[^/:]+):\d+/);
  return match?.[1]?.replace(/^\[(.*)\]$/, "$1") || "";
}

function getPort(url) {
  return `${url}`.match(/^https?:\/\/(?:\[[^\]]+\]|[^/:]+):(\d+)/i)?.[1];
}

function isLoopbackUrl(url) {
  return isLoopbackHost(extractHost(url));
}

function isLoopbackHost(host) {
  return /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|::1)$/i.test(`${host}`.trim());
}

function isSupportedBackendUrl(url) {
  const host = extractHost(url);
  return /^https?:\/\//i.test(url) && host && !host.startsWith(".") && !host.endsWith(".");
}
