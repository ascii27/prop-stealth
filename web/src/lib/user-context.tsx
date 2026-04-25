"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: "owner" | "agent";
}

interface UserContextValue {
  user: AuthUser | null;
  loading: boolean;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserContext value={{ user, loading }}>
      {children}
    </UserContext>
  );
}

export function useUser() {
  return useContext(UserContext);
}

export async function logout() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  window.location.href = "/login";
}
