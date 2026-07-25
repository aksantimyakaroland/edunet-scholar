"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Message } from "@edunet/ai";
import { useChatSessionsStore } from "@/stores/chat-sessions-store";

type ExtendedMessage = Message & { id: string };

export function useChat(sessionId?: string | null) {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ExtendedMessage[]>([]);
  const activeSessionId = useRef<string | null>(null);
  const loadedSessionIds = useRef(new Set<string>());
  const setCurrentSession = useChatSessionsStore((s) => s.setCurrentSession);

  // Load messages when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      messagesRef.current = [];
      setSessionLoaded(true);
      setError(null);
      activeSessionId.current = null;
      return;
    }

    activeSessionId.current = sessionId;

    // Already loaded this session — skip fetch
    if (loadedSessionIds.current.has(sessionId)) {
      setSessionLoaded(true);
      return;
    }

    setSessionLoaded(false);
    setError(null);

    fetch(`/api/chat/sessions/${sessionId}/messages`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load messages (${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (data.messages) {
          const loaded = data.messages.map(
            (m: { id: string; role: string; content: string }) => ({
              id: m.id,
              role: m.role as "user" | "model",
              content: m.content,
            })
          );
          setMessages(loaded);
          messagesRef.current = loaded;
          loadedSessionIds.current.add(sessionId);
        }
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
        setError(err instanceof Error ? err.message : "Failed to load messages");
      })
      .finally(() => setSessionLoaded(true));
  }, [sessionId]);

  const updateMessages = useCallback(
    (updater: (prev: ExtendedMessage[]) => ExtendedMessage[]) => {
      const next = updater(messagesRef.current);
      messagesRef.current = next;
      setMessages(next);
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ExtendedMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
      };

      updateMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      // Ensure we have a session
      let sid = activeSessionId.current;
      if (!sid) {
        try {
          const res = await fetch("/api/chat/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstMessage: content }),
          });
          if (!res.ok) throw new Error("Failed to create session");
          const data = await res.json();
          if (data.session) {
            const newSid: string = data.session.id;
            sid = newSid;
            activeSessionId.current = newSid;
            loadedSessionIds.current.add(newSid);
            // Update URL without triggering re-render race
            const url = new URL(window.location.href);
            url.searchParams.set("session", newSid);
            window.history.replaceState({}, "", url.toString());
            setCurrentSession(newSid);
          }
        } catch (err) {
          console.error("Failed to create session:", err);
          // Send anyway without session
        }
      }

      const assistantMessage: ExtendedMessage = {
        id: crypto.randomUUID(),
        role: "model",
        content: "",
      };

      updateMessages((prev) => [...prev, assistantMessage]);

      const history = messagesRef.current
        .filter((m) => m.id !== assistantMessage.id)
        .map((m) => ({
          role: m.role as "user" | "model",
          content: m.content,
        }));

      try {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, sessionId: sid }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) throw new Error("Chat request failed");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const current = buffer;
          updateMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: current } : m
            )
          );
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const msg = error instanceof Error ? error.message : "Unknown error";
        setError(msg);
        updateMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: `Error: ${msg}` }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [updateMessages, setCurrentSession]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    updateMessages(() => []);
    activeSessionId.current = null;
    loadedSessionIds.current.clear();
    setCurrentSession(null);
    setError(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("session");
    window.history.replaceState({}, "", url.toString());
  }, [updateMessages, setCurrentSession]);

  return { messages, isLoading, sessionLoaded, error, sendMessage, stop, clear };
}
