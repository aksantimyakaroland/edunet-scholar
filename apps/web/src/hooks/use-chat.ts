"use client";

import { useState, useRef, useCallback } from "react";
import type { Message } from "@edunet/ai";

type ExtendedMessage = Message & { id: string };

export function useChat() {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ExtendedMessage[]>([]);

  const updateMessages = useCallback(
    (updater: (prev: ExtendedMessage[]) => ExtendedMessage[]) => {
      setMessages((prev) => {
        const next = updater(prev);
        messagesRef.current = next;
        return next;
      });
    },
    []
  );

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ExtendedMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    updateMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

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
        body: JSON.stringify({ messages: history }),
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
                content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [updateMessages]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const clear = useCallback(() => {
    updateMessages(() => []);
  }, [updateMessages]);

  return { messages, isLoading, sendMessage, stop, clear };
}
