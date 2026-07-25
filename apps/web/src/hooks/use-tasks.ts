"use client";

import { useRef } from "react";
import { useEduPlanStore } from "@/stores/eduplan-store";

export function useTasks() {
  const {
    subjects,
    currentSubjectId,
    tasks,
    isLoading,
    error,
    setSubjects,
    setCurrentSubjectId,
    setTasks,
    addTask,
    updateTask,
    removeTask,
    setLoading,
    setError,
  } = useEduPlanStore();

  const abortRef = useRef<AbortController | null>(null);

  async function fetchTasks(subjectId: string) {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/eduplan/tasks?subjectId=${subjectId}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to fetch tasks");
      }
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Failed to fetch tasks";
      setError(msg);
    }
    setLoading(false);
  }

  async function add(title: string) {
    if (!currentSubjectId) return;
    setError(null);
    try {
      const res = await fetch("/api/eduplan/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subjectId: currentSubjectId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to add task");
      }
      const data = await res.json();
      if (data.task) addTask(data.task);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add task";
      setError(msg);
    }
  }

  async function update(id: string, updates: Record<string, unknown>) {
    setError(null);
    try {
      const res = await fetch(`/api/eduplan/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to update task");
      }
      const mapped = { ...updates };
      if ("sortOrder" in mapped) {
        (mapped as Record<string, unknown>).sort_order = mapped.sortOrder;
        delete (mapped as Record<string, unknown>).sortOrder;
      }
      updateTask(id, mapped);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update task";
      setError(msg);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/eduplan/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to delete task");
      }
      removeTask(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete task";
      setError(msg);
    }
  }

  return {
    subjects,
    currentSubjectId,
    tasks: tasks.filter((t) => !t.parent_id && t.subject_id === currentSubjectId),
    allTasks: tasks,
    isLoading,
    error,
    add,
    update,
    remove,
    setCurrentSubjectId,
    fetchTasks,
    fetchSubjects: async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/eduplan/subjects", {
          signal: abortRef.current.signal,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error || "Failed to fetch subjects");
        }
        const data = await res.json();
        if (data.subjects) setSubjects(data.subjects);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Failed to fetch subjects";
        setError(msg);
      }
      setLoading(false);
    },
  };
}
