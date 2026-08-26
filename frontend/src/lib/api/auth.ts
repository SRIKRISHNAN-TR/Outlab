import { apiClient } from "./client";
import type { User } from "../types";

export const authApi = {
  /** Get the currently logged-in user (returns null if not authenticated) */
  async me(): Promise<User | null> {
    try {
      const res = await apiClient.get<User>("/api/auth/me");
      return res.data;
    } catch {
      return null;
    }
  },

  /** Redirect browser to Google OAuth consent screen */
  loginWithGoogle() {
    const apiUrl = import.meta.env.VITE_API_URL ?? "";
    window.location.href = `${apiUrl}/api/auth/google`;
  },

  /** Logout */
  async logout(): Promise<void> {
    await apiClient.post("/api/auth/logout");
  },
};
