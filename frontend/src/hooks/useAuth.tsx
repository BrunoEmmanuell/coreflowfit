import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email?: string;
} | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("coreflow_user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem("coreflow_user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      // TODO: substituir pela chamada real ao backend (fetch/axios)
      await new Promise((r) => setTimeout(r, 500));
      const fakeUser = { id: "1", name: "Bruno", email };
      localStorage.setItem("coreflow_user", JSON.stringify(fakeUser));
      setUser(fakeUser);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("coreflow_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

/* Exports nomeadas compatíveis com imports existentes */
export function useUser() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useUser must be used within an AuthProvider");
  }
  return ctx.user;
}

export function useLogin() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useLogin must be used within an AuthProvider");
  }
  return ctx.login;
}

export function useLogout() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useLogout must be used within an AuthProvider");
  }
  return ctx.logout;
}
