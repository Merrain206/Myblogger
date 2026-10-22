"use client";

import { useCallback, useEffect, useState } from "react";

interface SessionState {
  isAuthed: boolean;
  isCheckingAuth: boolean;
  csrfToken: string;
}

export function useAdminSession() {
  const [state, setState] = useState<SessionState>({
    isAuthed: false,
    isCheckingAuth: true,
    csrfToken: "",
  });

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/tools/yijing/auth", { cache: "no-store" });
      if (!response.ok) throw new Error("unauthorized");
      const data = await response.json();
      setState({ isAuthed: data.valid === true, isCheckingAuth: false, csrfToken: data.csrfToken || "" });
    } catch {
      setState({ isAuthed: false, isCheckingAuth: false, csrfToken: "" });
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const login = useCallback(async (password: string): Promise<string | null> => {
    const response = await fetch("/api/tools/yijing/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return typeof data.error === "string" ? data.error : "验证失败";
    setState({ isAuthed: true, isCheckingAuth: false, csrfToken: data.csrfToken || "" });
    return null;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/tools/yijing/auth", {
      method: "DELETE",
      headers: { "X-CSRF-Token": state.csrfToken },
    }).catch(() => undefined);
    setState({ isAuthed: false, isCheckingAuth: false, csrfToken: "" });
  }, [state.csrfToken]);

  return { ...state, login, logout, refresh };
}
