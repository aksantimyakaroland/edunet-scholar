"use client";

import { useState, useEffect } from "react";
import { useEduPlanStore, type Subject } from "@/stores/eduplan-store";
import { Plus, Trash2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubjectSidebar() {
  const {
    subjects,
    currentSubjectId,
    setCurrentSubjectId,
    addSubject,
    removeSubject,
    setSubjects,
    tasks,
  } = useEduPlanStore();
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/eduplan/subjects")
      .then((r) => r.json())
      .then((data) => {
        if (data.subjects) setSubjects(data.subjects);
      });
  }, [setSubjects]);

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const colors = ["#5B5BD6", "#22C55E", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4", "#8B5CF6", "#F97316"];
    const color = colors[subjects.length % colors.length];
    try {
      const res = await fetch("/api/eduplan/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, color }),
      });
      const data = await res.json();
      if (data.subject) addSubject(data.subject);
    } catch {}
    setName("");
    setShowInput(false);
  }

  const taskCount = (subjectId: string) =>
    tasks.filter((t) => t.subject_id === subjectId).length;
  const doneCount = (subjectId: string) =>
    tasks.filter((t) => t.subject_id === subjectId && t.status === "done").length;

  return (
    <div className="flex h-full flex-col border-r border-border">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Subjects
        </h3>
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {subjects.map((subject) => {
          const total = taskCount(subject.id);
          const done = doneCount(subject.id);
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <button
              key={subject.id}
              onClick={() => setCurrentSubjectId(subject.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                currentSubjectId === subject.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Circle
                className="h-3 w-3 shrink-0 fill-current"
                style={{ color: subject.color }}
              />
              <span className="flex-1 truncate">{subject.name}</span>
              {total > 0 && (
                <span className="text-xs text-muted-foreground">
                  {done}/{total}
                </span>
              )}
              {total > 0 && (
                <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: subject.color }}
                  />
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fetch(`/api/eduplan/subjects/${subject.id}`, { method: "DELETE" });
                  removeSubject(subject.id);
                }}
                className="shrink-0 text-muted-foreground/40 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </button>
          );
        })}
      </div>
      <div className="border-t border-border p-2">
        {showInput ? (
          <div className="flex items-center gap-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              onBlur={() => { if (!name.trim()) setShowInput(false); }}
              placeholder="Subject name"
              autoFocus
              className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary/50"
            />
            <button
              onClick={handleAdd}
              className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Add subject
          </button>
        )}
      </div>
    </div>
  );
}