"use client";

import type { AISuggestions as AISuggestionsType } from "@/stores/eduplan-store";
import { Sparkles, Check, X } from "lucide-react";

type Props = {
  suggestions: AISuggestionsType;
  onApply: () => void;
  onSkip: () => void;
};

const priorityLabels = { low: "Low", medium: "Medium", high: "High" };

export function AISuggestions({ suggestions, onApply, onSkip }: Props) {
  return (
    <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-primary">
        <Sparkles className="h-3 w-3" />
        AI Suggestions
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Priority:</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
            {priorityLabels[suggestions.priority]}
          </span>
        </div>
        {suggestions.suggestedDueDate && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Suggested due:</span>
            <span className="font-medium">
              {new Date(suggestions.suggestedDueDate).toLocaleDateString()}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Estimated:</span>
          <span className="font-medium">~{suggestions.estimatedHours}h</span>
        </div>
        {suggestions.suggestedSubtasks.length > 0 && (
          <div>
            <span className="text-muted-foreground">Subtasks:</span>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-muted-foreground">
              {suggestions.suggestedSubtasks.map((st, i) => (
                <li key={i}>{st}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={onApply}
          className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Check className="h-3 w-3" />
          Apply
        </button>
        <button
          onClick={onSkip}
          className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/80"
        >
          <X className="h-3 w-3" />
          Skip
        </button>
      </div>
    </div>
  );
}