"use client";

import { useEffect, useCallback } from "react";
import { useChatSessionsStore } from "@/stores/chat-sessions-store";
import type { ChatSession } from "@/stores/chat-sessions-store";

export type { ChatSession };

export function useChatSessions() {
  const sessionsFetched = useChatSessionsStore((s) => s.sessionsFetched);
  const sessions = useChatSessionsStore((s) => s.sessions);
  const sessionsLoading = useChatSessionsStore((s) => s.sessionsLoading);
  const markSessionsFetched = useChatSessionsStore((s) => s.markSessionsFetched);
  const setSessionsLoading = useChatSessionsStore((s) => s.setSessionsLoading);
  const setSessions = useChatSessionsStore((s) => s.setSessions);
  const addSession = useChatSessionsStore((s) => s.addSession);
  const removeSession = useChatSessionsStore((s) => s.removeSession);
  const renameSessionLocally = useChatSessionsStore((s) => s.renameSessionLocally);

  useEffect(() => {
    if (sessionsFetched) return;
    markSessionsFetched();
    setSessionsLoading(true);
    fetch("/api/chat/sessions")
      .then((r) => r.json())
      .then((data) => {
        if (data.sessions) setSessions(data.sessions);
      })
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, [sessionsFetched, markSessionsFetched, setSessionsLoading, setSessions]);

  const createSession = useCallback(
    async (firstMessage?: string): Promise<ChatSession | null> => {
      try {
        const res = await fetch("/api/chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstMessage }),
        });
        const data = await res.json();
        if (res.ok && data.session) {
          addSession(data.session);
          return data.session;
        }
      } catch {}
      return null;
    },
    [addSession]
  );

  const deleteSession = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) removeSession(id);
    } catch {}
  }, [removeSession]);

  const renameSession = useCallback(async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) renameSessionLocally(id, title);
    } catch {}
  }, [renameSessionLocally]);

  return {
    sessions,
    isLoading: sessionsLoading,
    createSession,
    deleteSession,
    renameSession,
  };
}
