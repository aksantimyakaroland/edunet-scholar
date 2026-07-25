"use client";

import { useState } from "react";
import { useEduPlanStore } from "@/stores/eduplan-store";
import { Plus, Trash2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

function hashColor(name: string): string {
  const colors = ["#5B5BD6", "#22C55E", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4", "#8B5CF6", "#F97316"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function SubjectSidebar() {
  const {
    subjects,
    currentSubjectId,
    setCurrentSubjectId,
    addSubject,
    removeSubject,
    tasks,
    setError,
  } = useEduPlanStore();
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState("");

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const color = hashColor(trimmed);
    try {
      const res = await fetch("/api/eduplan/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, color }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to add subject");
      }
      const data = await res.json();
      if (data.subject) addSubject(data.subject);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add subject");
    }
    setName("");
    setShowInput(false);
  }

  async function handleDelete(e: React.MouseEvent, subjectId: string) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/eduplan/subjects/${subjectId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to delete subject");
      }
      removeSubject(subjectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete subject");
    }
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
        {subjects.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground/60">
            No subjects yet. Create one below.
          </p>
        ) : (
          subjects.map((subject) => {
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
                  onClick={(e) => handleDelete(e, subject.id)}
                  className="shrink-0 text-muted-foreground/40 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </button>
            );
          })
        )}
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
