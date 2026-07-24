"use client";

import { useState } from "react";
import { Plus, Target, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { EduGoal } from "@/hooks/use-goals";

type GoalTrackerProps = {
  goals: EduGoal[];
  onAdd: (title: string) => void;
  onUpdateProgress: (id: string, progress: number) => void;
  onRemove: (id: string) => void;
};

export function GoalTracker({ goals, onAdd, onUpdateProgress, onRemove }: GoalTrackerProps) {
  const [input, setInput] = useState("");

  function handleAdd() {
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput("");
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-heading text-sm font-semibold">Goals</h3>
      </div>

      <div className="space-y-3 p-4">
        {goals.map((goal) => (
          <div key={goal.id} className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <span className="flex-1 text-sm font-medium">{goal.title}</span>
              <span className="text-xs text-muted-foreground">
                {goal.progress}%
              </span>
              <button
                onClick={() => onRemove(goal.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={goal.progress}
              onChange={(e) =>
                onUpdateProgress(goal.id, parseInt(e.target.value))
              }
              className="w-full accent-primary"
            />
          </div>
        ))}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add a goal..."
            className="h-8 border-0 px-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
    </div>
  );
}
