"use client";

import { useState } from "react";

export type EduTask = {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
};

export function useTasks() {
  const [tasks, setTasks] = useState<EduTask[]>([]);

  function add(title: string) {
    const task: EduTask = {
      id: crypto.randomUUID(),
      title,
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: null,
    };
    setTasks((prev) => [...prev, task]);
  }

  function update(id: string, updates: Partial<EduTask>) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }

  function remove(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return { tasks, add, update, remove };
}
