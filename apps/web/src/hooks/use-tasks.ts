"use client";

import { useEduPlanStore } from "@/stores/eduplan-store";

export function useTasks() {
  const {
    subjects,
    currentSubjectId,
    tasks,
    isLoading,
    setSubjects,
    setCurrentSubjectId,
    setTasks,
    addTask,
    updateTask,
    removeTask,
    setLoading,
  } = useEduPlanStore();

  async function fetchTasks(subjectId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/eduplan/tasks?subjectId=${subjectId}`);
      const data = await res.json();
      if (res.ok && data.tasks) setTasks(data.tasks);
    } catch {}
    setLoading(false);
  }

  async function add(title: string) {
    if (!currentSubjectId) return;
    try {
      const res = await fetch("/api/eduplan/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subjectId: currentSubjectId }),
      });
      const data = await res.json();
      if (res.ok && data.task) addTask(data.task);
    } catch {}
  }

  async function update(id: string, updates: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/eduplan/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return;
      const mapped = { ...updates };
      if ("sortOrder" in mapped) {
        (mapped as Record<string, unknown>).sort_order = mapped.sortOrder;
        delete (mapped as Record<string, unknown>).sortOrder;
      }
      updateTask(id, mapped);
    } catch {}
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/eduplan/tasks/${id}`, { method: "DELETE" });
      if (res.ok) removeTask(id);
    } catch {}
  }

  return {
    subjects,
    currentSubjectId,
    tasks: tasks.filter((t) => !t.parent_id && t.subject_id === currentSubjectId),
    allTasks: tasks,
    isLoading,
    add,
    update,
    remove,
    setCurrentSubjectId,
    fetchTasks,
    fetchSubjects: async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/eduplan/subjects");
        const data = await res.json();
        if (res.ok && data.subjects) setSubjects(data.subjects);
      } catch {}
      setLoading(false);
    },
  };
}