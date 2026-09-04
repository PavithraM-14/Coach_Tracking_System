import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { login as loginRequest } from "../api/auth";
import { getMyCapabilities } from "../api/assignments";
import { clearToken, getToken, setToken } from "../api/client";
import type { CurrentUser, RoleCode } from "../types";

const USER_KEY = "cts_user";

// Roles where a single login might only be configured for part of the
// role's modules (e.g. PAINT: Paint In only, Paint Out only, or both, per
// the Supervisor-Coach Assignments Matrix) — capabilities are fetched for
// these roles only; everyone else gets an empty (unused) list.
const CAPABILITY_ROLES: RoleCode[] = ["FURNISHING", "PAINT", "ASSEMBLY_PRODUCTION"];

interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  capabilities: string[];
  capabilitiesLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as CurrentUser) : null;
  });
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [capabilitiesLoading, setCapabilitiesLoading] = useState(true);

  useEffect(() => {
    // If a token exists but no user (e.g. stale state), keep them consistent.
    if (!getToken() && user) {
      setUser(null);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !CAPABILITY_ROLES.includes(user.role)) {
      setCapabilities([]);
      setCapabilitiesLoading(false);
      return;
    }
    setCapabilitiesLoading(true);
    getMyCapabilities()
      .then((res) => setCapabilities(res.modules))
      .catch(() => setCapabilities([]))
      .finally(() => setCapabilitiesLoading(false));
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
    setCapabilities([]);
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, capabilities, capabilitiesLoading, login, logout }}
    >
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
