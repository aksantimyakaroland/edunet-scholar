"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Message } from "@edunet/ai";
import { useChatSessionsStore } from "@/stores/chat-sessions-store";

type ExtendedMessage = Message & { id: string };

export function useChat(sessionId?: string | null) {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ExtendedMessage[]>([]);
  const activeSessionId = useRef<string | null>(null);
  const sessionJustCreatedRef = useRef(false);
  const setCurrentSession = useChatSessionsStore((s) => s.setCurrentSession);

  // Load messages when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      messagesRef.current = [];
      setSessionLoaded(true);
      activeSessionId.current = null;
      return;
    }

    // Don't reload if we just created this session (messages are streaming)
    if (sessionJustCreatedRef.current && activeSessionId.current === sessionId) {
      sessionJustCreatedRef.current = false;
      setSessionLoaded(true);
      return;
    }

    activeSessionId.current = sessionId;
    setSessionLoaded(false);

    fetch(`/api/chat/sessions/${sessionId}/messages`)
      .then((r) => r.json())
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
        }
      })
      .catch(() => {})
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

      // Ensure we have a session
      let sid = activeSessionId.current;
      if (!sid) {
        try {
          const res = await fetch("/api/chat/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstMessage: content }),
          });
          const data = await res.json();
          if (data.session) {
            sid = data.session.id;
            activeSessionId.current = sid;
            sessionJustCreatedRef.current = true;
            // Update URL without triggering re-render race
            const url = new URL(window.location.href);
            url.searchParams.set("session", sid!);
            window.history.replaceState({}, "", url.toString());
            setCurrentSession(sid);
          }
        } catch {
          // Fallback: send anyway without session
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
        updateMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? {
                  ...m,
                  content: `Error: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`,
                }
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
    setIsLoading(false);
  }, []);

  const clear = useCallback(() => {
    updateMessages(() => []);
    activeSessionId.current = null;
    setCurrentSession(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("session");
    window.history.replaceState({}, "", url.toString());
  }, [updateMessages, setCurrentSession]);

  return { messages, isLoading, sessionLoaded, sendMessage, stop, clear };
}
