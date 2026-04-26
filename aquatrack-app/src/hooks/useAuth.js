import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getStoredSession, loginUser, logoutUser, signupUser } from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const session = await getStoredSession();
      setUser(session);
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (username, password) => {
    const nextUser = await loginUser(username, password);
    setUser(nextUser);
    return nextUser;
  }, []);

  const signup = useCallback(async (username, password, profile) => {
    const nextUser = await signupUser(username, password, profile);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, signup, logout }), [user, loading, login, signup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
