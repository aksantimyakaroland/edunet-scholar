"use client";

import { useRef, useEffect, useState } from "react";
import { ArrowUp, Square } from "lucide-react";

type AIComposerProps = {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
};

export function AIComposer({ onSend, onStop, isLoading }: AIComposerProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 pb-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow focus-within:border-primary/50 focus-within:shadow-md">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your studies..."
          rows={1}
          className="w-full resize-none bg-transparent px-5 pt-4 pb-3 text-sm outline-none placeholder:text-muted-foreground/60"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between border-t border-border/50 px-4 py-2">
          <span className="text-xs text-muted-foreground/40">
            {isLoading ? "AI is thinking..." : "Shift + Enter for new line"}
          </span>
          <button
            onClick={isLoading ? onStop : handleSubmit}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            disabled={!input.trim() && !isLoading}
          >
            {isLoading ? (
              <Square className="h-3.5 w-3.5 fill-current" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] leading-tight text-muted-foreground/30 select-none">
        EduChat can make mistakes. Verify its responses.
      </p>
    </div>
  );
}
