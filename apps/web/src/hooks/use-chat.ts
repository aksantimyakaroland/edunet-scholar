"use client";

import { useState, useRef, useCallback } from "react";
import type { Message } from "@edunet/ai";

type ExtendedMessage = Message & { id: string };

export function useChat() {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ExtendedMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const assistantMessage: ExtendedMessage = {
      id: crypto.randomUUID(),
      role: "model",
      content: "",
    };

    setMessages((prev) => [...prev, assistantMessage]);

    const history = messages.map((m) => ({
      role: m.role as "user" | "model",
      content: m.content,
    }));
    history.push({ role: "user" as const, content });

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
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id ? { ...m, content: buffer } : m
          )
        );
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: `Error: ${error instanceof Error ? error.message : "Unknown error"}` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, stop, clear };
}
