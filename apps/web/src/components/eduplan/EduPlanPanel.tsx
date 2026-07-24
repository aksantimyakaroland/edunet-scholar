"use client";

import { useTasks } from "@/hooks/use-tasks";
import { useGoals } from "@/hooks/use-goals";
import { TaskManager } from "./TaskManager";
import { GoalTracker } from "./GoalTracker";

export function EduPlanPanel() {
  const { tasks, add: addTask, update: updateTask, remove: removeTask } = useTasks();
  const { goals, add: addGoal, updateProgress, remove: removeGoal } = useGoals();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col p-6">
      <div className="mb-6">
        <h2 className="font-heading text-lg font-semibold">EduPlan</h2>
        <p className="text-sm text-muted-foreground">
          Manage your tasks, track your goals, and plan your study schedule.
        </p>
      </div>

      <div className="grid gap-6">
        <TaskManager
          tasks={tasks}
          onAdd={addTask}
          onUpdate={updateTask}
          onRemove={removeTask}
        />
        <GoalTracker
          goals={goals}
          onAdd={addGoal}
          onUpdateProgress={updateProgress}
          onRemove={removeGoal}
        />
      </div>
    </div>
  );
}
