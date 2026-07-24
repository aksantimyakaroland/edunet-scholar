"use client";

import { useState } from "react";
import { useEduPlanStore } from "@/stores/eduplan-store";
import { Loader2, X, Calendar, ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function StudyPlanDialog({ open, onClose }: Props) {
  const { studyPlan, setStudyPlan, setGenerating, isGenerating, addTask, currentSubjectId } =
    useEduPlanStore();
  const [prompt, setPrompt] = useState("");
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([0]));

  if (!open) return null;

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/eduplan/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (data.plan) setStudyPlan(data.plan);
    } catch {}
    setGenerating(false);
  }

  async function handleImport(weekIndex: number) {
    const week = studyPlan?.weeks[weekIndex];
    if (!week || !currentSubjectId) return;

    for (const task of week.tasks) {
      try {
        const res = await fetch("/api/eduplan/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            subjectId: currentSubjectId,
            estimatedHours: task.estimatedHours,
          }),
        });
        const data = await res.json();
        if (data.task) addTask(data.task);
      } catch {}
    }
  }

  async function handleImportAll() {
    if (!studyPlan || !currentSubjectId) return;
    for (let i = 0; i < studyPlan.weeks.length; i++) {
      await handleImport(i);
    }
    onClose();
  }

  const toggleWeek = (i: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="font-heading text-sm font-semibold">Generate Study Plan</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border px-5 py-3">
          <div className="flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder='e.g. "Calculus final on May 15, chapters 1-8"'
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              Generate
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!studyPlan && !isGenerating && (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Describe your study goal and I&apos;ll generate a week-by-week plan.
            </div>
          )}
          {isGenerating && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating your study plan...
            </div>
          )}
          {studyPlan && !isGenerating && (
            <div className="space-y-3">
              {studyPlan.weeks.map((week, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card"
                >
                  <button
                    onClick={() => toggleWeek(i)}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left"
                  >
                    {expandedWeeks.has(i) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="flex-1 font-heading text-sm font-semibold">
                      {week.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {week.tasks.length} tasks
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImport(i);
                      }}
                      className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      Import week
                    </button>
                  </button>
                  {expandedWeeks.has(i) && (
                    <div className="border-t border-border px-4 py-3">
                      {week.description && (
                        <p className="mb-2 text-xs text-muted-foreground">
                          {week.description}
                        </p>
                      )}
                      <ul className="space-y-1">
                        {week.tasks.map((task, j) => (
                          <li
                            key={j}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                            {task.title}
                            {task.estimatedHours && (
                              <span className="text-xs text-muted-foreground">
                                ~{task.estimatedHours}h
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {studyPlan && !isGenerating && (
          <div className="border-t border-border px-5 py-3">
            <button
              onClick={handleImportAll}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Import All to Tasks
            </button>
          </div>
        )}
      </div>
    </div>
  );
}