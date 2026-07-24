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
      if (data.tasks) setTasks(data.tasks);
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
      if (data.task) addTask(data.task);
    } catch {}
  }

  async function update(id: string, updates: Record<string, unknown>) {
    try {
      await fetch(`/api/eduplan/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      updateTask(id, updates);
    } catch {}
  }

  async function remove(id: string) {
    try {
      await fetch(`/api/eduplan/tasks/${id}`, { method: "DELETE" });
      removeTask(id);
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
      const res = await fetch("/api/eduplan/subjects");
      const data = await res.json();
      if (data.subjects) setSubjects(data.subjects);
    },
  };
}
