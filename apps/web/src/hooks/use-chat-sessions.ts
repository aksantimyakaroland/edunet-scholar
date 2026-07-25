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
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch sessions (${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (data.sessions) setSessions(data.sessions);
      })
      .catch((err) => console.error("Failed to fetch sessions:", err))
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
        if (!res.ok) throw new Error(`Failed to create session (${res.status})`);
        const data = await res.json();
        if (data.session) {
          addSession(data.session);
          return data.session;
        }
      } catch (err) {
        console.error("Failed to create session:", err);
      }
      return null;
    },
    [addSession]
  );

  const deleteSession = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Failed to delete session (${res.status})`);
      removeSession(id);
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  }, [removeSession]);

  const renameSession = useCallback(async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error(`Failed to rename session (${res.status})`);
      renameSessionLocally(id, title);
    } catch (err) {
      console.error("Failed to rename session:", err);
    }
  }, [renameSessionLocally]);

  return {
    sessions,
    isLoading: sessionsLoading,
    createSession,
    deleteSession,
    renameSession,
  };
}
