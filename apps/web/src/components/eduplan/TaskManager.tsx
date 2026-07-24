"use client";

import { useState } from "react";
import { Plus, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { EduTask } from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";

type TaskManagerProps = {
  tasks: EduTask[];
  onAdd: (title: string) => void;
  onUpdate: (id: string, updates: Partial<EduTask>) => void;
  onRemove: (id: string) => void;
};

const priorityColors = {
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function TaskManager({ tasks, onAdd, onUpdate, onRemove }: TaskManagerProps) {
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
        <h3 className="font-heading text-sm font-semibold">Tasks</h3>
      </div>

      <div className="space-y-1 p-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
          >
            <button
              onClick={() =>
                onUpdate(task.id, {
                  status: task.status === "done" ? "todo" : "done",
                })
              }
            >
              {task.status === "done" ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <span
              className={cn(
                "flex-1 text-sm",
                task.status === "done" && "text-muted-foreground line-through"
              )}
            >
              {task.title}
            </span>
            <Badge
              variant="secondary"
              className={cn("text-xs font-normal", priorityColors[task.priority])}
            >
              {task.priority}
            </Badge>
            <button
              onClick={() => onRemove(task.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
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
            placeholder="Add a task..."
            className="h-8 border-0 px-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
    </div>
  );
}
