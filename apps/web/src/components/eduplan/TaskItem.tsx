"use client";

import { useCallback } from "react";
import { useEduPlanStore, type PlanTask } from "@/stores/eduplan-store";
import {
  CheckCircle2,
  Circle,
  Trash2,
  ChevronRight,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SubTaskList } from "./SubTaskList";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

type Props = {
  task: PlanTask;
};

const priorityColors = {
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function TaskItem({ task }: Props) {
  const { updateTask, removeTask, tasks } = useEduPlanStore();
  const [expanded, setExpanded] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  const subTasks = tasks.filter((t) => t.parent_id === task.id);
  const hasSubTasks = subTasks.length > 0;
  const subDone = subTasks.filter((t) => t.status === "done").length;

  const toggleDone = useCallback(async () => {
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      const res = await fetch(`/api/eduplan/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      updateTask(task.id, { status: newStatus });
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  }, [task.id, task.status, updateTask]);

  const handleRemove = useCallback(async () => {
    try {
      const res = await fetch(`/api/eduplan/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
      removeTask(task.id);
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  }, [task.id, removeTask]);

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")}>
      <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 transition-colors hover:bg-muted/50">
        <button aria-label="Drag to reorder" className="cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground shrink-0" {...attributes} {...listeners}>
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button onClick={toggleDone} className="shrink-0">
          {task.status === "done" ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <span
          className={cn(
            "flex-1 text-sm truncate",
            task.status === "done" && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </span>
        {task.estimated_hours && (
          <span className="hidden sm:inline text-xs text-muted-foreground/60 shrink-0">~{task.estimated_hours}h</span>
        )}
        {task.due_date && (
          <span className="hidden sm:inline text-xs text-muted-foreground/60 shrink-0">
            {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
        <span
          className={cn(
            "hidden sm:inline rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0",
            priorityColors[task.priority]
          )}
        >
          {task.priority}
        </span>
        {hasSubTasks && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="hidden sm:flex text-muted-foreground hover:text-foreground shrink-0"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        <button
          onClick={handleRemove}
          className="shrink-0 text-muted-foreground/40 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {expanded && hasSubTasks && (
        <div className="ml-8 border-l border-border pl-3">
          <SubTaskList parentId={task.id} subTasks={subTasks} />
        </div>
      )}
    </div>
  );
}
