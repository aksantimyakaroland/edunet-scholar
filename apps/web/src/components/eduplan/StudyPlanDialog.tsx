"use client";

import { useState } from "react";
import { useEduPlanStore } from "@/stores/eduplan-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Calendar, ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function StudyPlanDialog({ open, onClose }: Props) {
  const { studyPlan, setStudyPlan, setGenerating, isGenerating, addTask, currentSubjectId } =
    useEduPlanStore();
  const [prompt, setPrompt] = useState("");
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([0]));

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
      if (res.ok && data.plan) setStudyPlan(data.plan);
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
        if (res.ok && data.task) addTask(data.task);
      } catch {}
    }
  }

  function handleClose() {
    setStudyPlan(null);
    setPrompt("");
    setExpandedWeeks(new Set([0]));
    onClose();
  }

  async function handleImportAll() {
    if (!studyPlan || !currentSubjectId) return;
    for (let i = 0; i < studyPlan.weeks.length; i++) {
      await handleImport(i);
    }
    handleClose();
  }

  const toggleWeek = (i: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="flex flex-col max-h-[80vh] sm:max-h-[70vh] p-0 gap-0">
        <DialogHeader className="border-b border-border px-5 py-3">
          <DialogTitle className="font-heading text-sm font-semibold">
            Generate Study Plan
          </DialogTitle>
        </DialogHeader>

        <div className="border-b border-border px-5 py-3">
          <div className="flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder='e.g. "Calculus final on May 15, chapters 1-8"'
              className="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shrink-0"
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
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="flex-1 font-heading text-sm font-semibold min-w-0 truncate">
                      {week.title}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {week.tasks.length} tasks
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImport(i);
                      }}
                      className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 shrink-0"
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
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                            <span className="truncate">{task.title}</span>
                            {task.estimatedHours && (
                              <span className="text-xs text-muted-foreground shrink-0">
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
          <DialogFooter className="border-t border-border px-5 py-3">
            <button
              onClick={handleImportAll}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Import All to Tasks
            </button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
