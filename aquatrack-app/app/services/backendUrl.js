import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules } from "react-native";
import { DEFAULT_BACKEND_URL } from "../constants/endpoints";

const SETTINGS_KEY = "aquatrack_settings_v1";

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
  if (!url) return DEFAULT_BACKEND_URL;
  if (!/localhost|127\.0\.0\.1/.test(url)) return url;

  const bundleUrl = NativeModules?.SourceCode?.scriptURL || "";
  const match = bundleUrl.match(/https?:\/\/([^/:]+)(?::\d+)?/);
  const devHost = match?.[1];
  if (!devHost) return url;

  return url.replace("localhost", devHost).replace("127.0.0.1", devHost);
}
