"use client";

import { useState, useRef, useEffect } from "react";
import { useEduBookStore } from "@/stores/edubook-store";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Loader2, BookOpen } from "lucide-react";

export function EduBookChatPanel() {
  const { selectedDocIds, chatMessages, isChatLoading, addChatMessage, setChatLoading, setChatMessages } =
    useEduBookStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function handleAsk() {
    const trimmed = input.trim();
    if (!trimmed || selectedDocIds.length === 0 || isChatLoading) return;

    setInput("");
    addChatMessage({ role: "user", content: trimmed });
    setChatLoading(true);

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/edubook/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, documentIds: selectedDocIds }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error("Request failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
      }

      addChatMessage({ role: "assistant", content: buffer });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      addChatMessage({
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setChatLoading(false);
      abortRef.current = null;
    }
  }

  if (selectedDocIds.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Select documents on the left to start asking questions about your course materials.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-1 overflow-y-auto p-4">
        {chatMessages.length === 0 && (
          <div className="flex flex-1 items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              Ask a question about your selected documents.
            </p>
          </div>
        )}
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "ml-8 bg-primary text-primary-foreground"
                : "mr-8 bg-muted text-foreground"
            }`}
          >
            {msg.role === "user" ? (
              <p className="whitespace-pre-wrap">{msg.content}</p>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAsk()}
            placeholder={
              selectedDocIds.length === 0
                ? "Select documents to ask questions..."
                : `Ask about ${selectedDocIds.length} document(s)...`
            }
            disabled={isChatLoading}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 disabled:opacity-50"
          />
          <button
            onClick={handleAsk}
            disabled={!input.trim() || isChatLoading || selectedDocIds.length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isChatLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
