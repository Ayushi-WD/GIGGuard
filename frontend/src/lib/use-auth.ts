"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError, loginUser, signupUser } from "@/lib/api";
import { clearAuthUser, getAuthUser, saveAuthUser } from "@/lib/storage";
import type { AuthUser, LoginCredentials, SignUpPayload } from "@/lib/types";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate auth state from localStorage
  const syncUser = useCallback(() => {
    const saved = getAuthUser();
    setUser(saved);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncUser();

    function handleAuthChange() {
      syncUser();
    }

    window.addEventListener("gigguard-auth-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("gigguard-auth-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [syncUser]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthUser> => {
    const trimmedUsername = credentials.username.trim();

    try {
      const response = await loginUser({
        username: trimmedUsername,
        password: credentials.password,
      });

      const authUser: AuthUser = {
        id: response.user.id,
        username: response.user.username,
        role: response.user.role,
        worker_id: response.user.worker_id,
        full_name:
          response.worker?.full_name ??
          (response.user.role === "admin" ? "System Admin" : response.user.username),
        worker: response.worker,
        token: response.token,
      };

      saveAuthUser(authUser);
      setUser(authUser);
      return authUser;
    } catch (caught) {
      // Offline fallback for default admin if backend is unreachable
      if (
        caught instanceof ApiError &&
        caught.status === 0 &&
        trimmedUsername.toLowerCase() === "admin" &&
        credentials.password === "admin123"
      ) {
        const fallbackAdmin: AuthUser = {
          id: "admin-offline-id",
          username: "admin",
          role: "admin",
          full_name: "System Admin",
          worker_id: null,
          worker: null,
          token: "offline_admin_token",
        };
        saveAuthUser(fallbackAdmin);
        setUser(fallbackAdmin);
        return fallbackAdmin;
      }
      throw caught;
    }
  }, []);

  const signup = useCallback(async (payload: SignUpPayload): Promise<AuthUser> => {
    try {
      const response = await signupUser(payload);
      const authUser: AuthUser = {
        id: response.user.id,
        username: response.user.username,
        role: response.user.role,
        worker_id: response.user.worker_id,
        full_name: response.worker?.full_name ?? payload.full_name,
        worker: response.worker,
        token: response.token,
      };

      saveAuthUser(authUser);
      setUser(authUser);
      return authUser;
    } catch (caught) {
      throw caught;
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthUser();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    isLoggedIn: Boolean(user),
    isAdmin: user?.role === "admin",
    isWorker: user?.role === "worker",
    login,
    signup,
    logout,
  };
}
