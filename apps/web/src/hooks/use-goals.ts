"use client";

import { useState } from "react";

export type EduGoal = {
  id: string;
  title: string;
  targetDate: string | null;
  progress: number;
};

export function useGoals() {
  const [goals, setGoals] = useState<EduGoal[]>([]);

  function add(title: string) {
    const goal: EduGoal = {
      id: crypto.randomUUID(),
      title,
      targetDate: null,
      progress: 0,
    };
    setGoals((prev) => [...prev, goal]);
  }

  function updateProgress(id: string, progress: number) {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, progress } : g))
    );
  }

  function remove(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  return { goals, add, updateProgress, remove };
}
