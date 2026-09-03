import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { login as loginRequest } from "../api/auth";
import { clearToken, getToken, setToken } from "../api/client";
import type { CurrentUser } from "../types";

const USER_KEY = "cts_user";

interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as CurrentUser) : null;
  });

  useEffect(() => {
    // If a token exists but no user (e.g. stale state), keep them consistent.
    if (!getToken() && user) {
      setUser(null);
    }
  }, [user]);

  async function login(username: string, password: string) {
    const response = await loginRequest(username, password);
    setToken(response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    setUser(response.user);
  }

  function logout() {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
