import AsyncStorage from "@react-native-async-storage/async-storage";

const USERS_KEY = "aquatrack_users_v1";
const SESSION_KEY = "aquatrack_session_v1";
const PROFILE_KEY = "userProfile";

export function normalizeUsername(username) {
  return `${username || ""}`.trim().toLowerCase();
}

export function scopedStorageKey(baseKey, username) {
  return `${baseKey}:${normalizeUsername(username)}`;
}

export async function getStoredSession() {
  const rawSession = await AsyncStorage.getItem(SESSION_KEY);
  if (!rawSession) return null;

  const session = JSON.parse(rawSession);
  const username = normalizeUsername(session?.username);
  if (!username) return null;

  const users = await getUsers();
  const user = users[username];
  if (!user) {
    await AsyncStorage.removeItem(SESSION_KEY);
    return null;
  }
  return { username: user.username, displayName: user.displayName || user.username };
}

export async function getCurrentUsername() {
  const session = await getStoredSession();
  return session?.username || "";
}

export async function loginUser(username, password) {
  const normalized = normalizeUsername(username);
  if (!normalized || !password) {
    throw new Error("Enter username and password.");
  }

  const users = await getUsers();
  const user = users[normalized];
  if (!user || user.passwordHash !== hashPassword(normalized, password)) {
    throw new Error("Invalid username or password.");
  }

  const session = { username: normalized, signedInAt: new Date().toISOString() };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { username: normalized, displayName: user.displayName || normalized };
}

export async function signupUser(username, password, profile = {}) {
  const normalized = normalizeUsername(username);
  if (normalized.length < 3) {
    throw new Error("Username must be at least 3 characters.");
  }
  if (`${password || ""}`.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const users = await getUsers();
  if (users[normalized]) {
    throw new Error("Username already exists.");
  }

  users[normalized] = {
    username: normalized,
    displayName: `${profile.name || username}`.trim(),
    passwordHash: hashPassword(normalized, password),
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  await AsyncStorage.setItem(scopedStorageKey(PROFILE_KEY, normalized), JSON.stringify(cleanProfile(profile, normalized)));

  const session = { username: normalized, signedInAt: new Date().toISOString() };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { username: normalized, displayName: users[normalized].displayName };
}

export async function logoutUser() {
  await AsyncStorage.removeItem(SESSION_KEY);
}

async function getUsers() {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function hashPassword(username, password) {
  const input = `aquatrack:${username}:${password}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function cleanProfile(profile, username) {
  return {
    name: `${profile.name || username}`.trim(),
    age: `${profile.age || ""}`.trim(),
    interests: `${profile.interests || ""}`.trim(),
    photoUri: `${profile.photoUri || ""}`.trim(),
    gender: `${profile.gender || ""}`.trim(),
    goal: `${profile.goal || ""}`.trim(),
    weight: `${profile.weight || ""}`.trim(),
    height: `${profile.height || ""}`.trim(),
    activityLevel: profile.activityLevel || "moderate",
    dailyWaterGoal: Number(profile.dailyWaterGoal || 2500),
    climateZone: profile.climateZone || "temperate",
  };
}
