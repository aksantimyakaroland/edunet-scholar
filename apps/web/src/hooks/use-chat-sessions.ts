"use client";

import { useState, useEffect, useCallback } from "react";

export type ChatSession = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/chat/sessions")
      .then((r) => r.json())
      .then((data) => {
        if (data.sessions) setSessions(data.sessions);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const createSession = useCallback(
    async (firstMessage?: string): Promise<ChatSession | null> => {
      try {
        const res = await fetch("/api/chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstMessage }),
        });
        const data = await res.json();
        if (data.session) {
          setSessions((prev) => [data.session, ...prev]);
          return data.session;
        }
      } catch {}
      return null;
    },
    []
  );

  const deleteSession = useCallback(async (id: string) => {
    try {
      await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {}
  }, []);

  const renameSession = useCallback(async (id: string, title: string) => {
    try {
      await fetch(`/api/chat/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      setSessions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, title, updated_at: new Date().toISOString() } : s
        )
      );
    } catch {}
  }, []);

  return { sessions, isLoading, createSession, deleteSession, renameSession };
}
