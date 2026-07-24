"use client";

import { GraduationCap, Sparkles } from "lucide-react";

const suggestions = [
  "Explain quantum computing in simple terms",
  "Help me understand the French Revolution",
  "Create a study plan for my biology exam",
  "Summarize the key concepts of calculus",
];

type EmptyStateProps = {
  onSuggestion: (text: string) => void;
};

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
          <GraduationCap className="h-7 w-7 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="font-heading text-lg font-semibold">
            How can I help you study?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask me anything about your courses, assignments, or topics.
          </p>
        </div>
      </div>

      <div className="mt-8 grid w-full max-w-lg gap-2">
        {suggestions.map((text) => (
          <button
            key={text}
            onClick={() => onSuggestion(text)}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-primary/60" />
            <span>{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
