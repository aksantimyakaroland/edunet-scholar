"use client";

import { useState } from "react";
import { useEduPlanStore } from "@/stores/eduplan-store";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import { AISuggestions } from "./AISuggestions";

type Props = {
  subjectId: string | null;
};

export function SmartTaskInput({ subjectId }: Props) {
  const { addTask, suggestions, setSuggestions, setSuggesting, clearSuggestions } =
    useEduPlanStore();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleAdd(useAI = true) {
    const trimmed = input.trim();
    if (!trimmed || !subjectId) return;

    if (useAI) {
      setIsLoading(true);
      setSuggesting(true);
      try {
        const res = await fetch("/api/eduplan/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed }),
        });
        const data = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions(null);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/eduplan/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed, subjectId }),
      });
      const data = await res.json();
      if (data.task) addTask(data.task);
    } catch {}
    setInput("");
  }

  async function handleApplyWithSuggestions(s: NonNullable<typeof suggestions>) {
    const trimmed = input.trim();
    if (!trimmed || !subjectId) return;
    try {
      const res = await fetch("/api/eduplan/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmed,
          subjectId,
          priority: s.priority,
          dueDate: s.suggestedDueDate,
          estimatedHours: s.estimatedHours,
        }),
      });
      const data = await res.json();
      if (data.task) addTask(data.task);

      if (s.suggestedSubtasks.length > 0) {
        for (const st of s.suggestedSubtasks) {
          await fetch("/api/eduplan/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: st,
              subjectId,
              parentId: data.task.id,
            }),
          });
        }
        const tasksRes = await fetch(`/api/eduplan/tasks?subjectId=${subjectId}`);
        const tasksData = await tasksRes.json();
        if (tasksData.tasks) useEduPlanStore.getState().setTasks(tasksData.tasks);
      }
    } catch {}
    setInput("");
    clearSuggestions();
  }

  function handleSkip() {
    handleAdd(false);
    clearSuggestions();
  }

  return (
    <div>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 focus-within:border-primary/50">
        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAdd(true);
            }
          }}
          placeholder="Add a task..."
          disabled={!subjectId}
          className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 disabled:opacity-40"
        />
        {input.trim() && (
          <button
            onClick={() => handleAdd(true)}
            disabled={isLoading || !subjectId}
            className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            AI
          </button>
        )}
      </div>
      {suggestions && (
        <AISuggestions
          suggestions={suggestions}
          onApply={() => handleApplyWithSuggestions(suggestions)}
          onSkip={handleSkip}
        />
      )}
    </div>
  );
}