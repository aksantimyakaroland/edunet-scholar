"use client";

import { useState } from "react";
import { useEduPlanStore, type PlanTask } from "@/stores/eduplan-store";
import { CheckCircle2, Circle, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  parentId: string;
  subTasks: PlanTask[];
};

export function SubTaskList({ parentId, subTasks }: Props) {
  const { addTask, updateTask, removeTask } = useEduPlanStore();
  const [input, setInput] = useState("");

  async function handleAdd() {
    const trimmed = input.trim();
    if (!trimmed) return;
    try {
      const res = await fetch("/api/eduplan/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmed,
          parentId,
          subjectId: subTasks[0]?.subject_id || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.task) addTask(data.task);
    } catch {}
    setInput("");
  }

  async function toggleDone(task: PlanTask) {
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      const res = await fetch(`/api/eduplan/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) updateTask(task.id, { status: newStatus });
    } catch {}
  }

  return (
    <div className="space-y-0.5 py-1">
      {subTasks.map((st) => (
        <div key={st.id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/30">
          <button onClick={() => toggleDone(st)}>
            {st.status === "done" ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
          <span
            className={cn(
              "flex-1 text-xs",
              st.status === "done" && "text-muted-foreground line-through"
            )}
          >
            {st.title}
          </span>
          <button
            onClick={async () => {
              try {
                const res = await fetch(`/api/eduplan/tasks/${st.id}`, { method: "DELETE" });
                if (res.ok) removeTask(st.id);
              } catch {}
            }}
            className="text-muted-foreground/40 hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-1 px-2">
        <Plus className="h-3 w-3 text-muted-foreground" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add subtask..."
          className="flex-1 border-0 bg-transparent px-0 py-1 text-xs outline-none placeholder:text-muted-foreground/40"
        />
      </div>
    </div>
  );
}