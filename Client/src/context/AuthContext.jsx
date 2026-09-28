import { createContext, useCallback, useContext, useEffect, useState } from "react";

import api from "../services/api";

const AuthContext = createContext(null);

const STORAGE_KEY = "fanhubplus_auth";

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredAuth(user, token) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
  } catch {
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
    }
  }, []);

  useEffect(() => {
    const stored = readStoredAuth();
    if (!stored?.token) {
      setLoading(false);
      return;
    }

    setUser(stored.user);
    setToken(stored.token);

    api
      .get("/auth/me")
      .then((data) => {
        setUser(data.user);
        writeStoredAuth(data.user, stored.token);
      })
      .catch((err) => {
        if (err.status === 401 || err.status === 403 || err.status === 404) logout();
      })
      .finally(() => setLoading(false));
  }, [logout]);

  useEffect(() => {
    window.addEventListener("fanhub:unauthorized", logout);
    return () => window.removeEventListener("fanhub:unauthorized", logout);
  }, [logout]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    writeStoredAuth(userData, authToken);
  };

  const updateUser = useCallback(
    (patch) => {
      setUser((current) => {
        const next = { ...current, ...patch };
        writeStoredAuth(next, token || readStoredAuth()?.token);
        return next;
      });
    },
    [token]
  );

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
