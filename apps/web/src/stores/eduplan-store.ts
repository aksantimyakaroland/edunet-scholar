import { create } from "zustand";

export type Subject = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
};

export type PlanTask = {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  parent_id: string | null;
  subject_id: string | null;
  estimated_hours: number | null;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
};

export type AISuggestions = {
  priority: "low" | "medium" | "high";
  estimatedHours: number;
  suggestedDueDate: string | null;
  suggestedSubtasks: string[];
};

export type StudyPlan = {
  weeks: {
    title: string;
    description: string;
    tasks: { title: string; estimatedHours: number }[];
  }[];
};

export type Digest = {
  focus: string;
  topTask: string;
  urgentTasks: string[];
  totalPending: number;
};

type EduPlanState = {
  subjects: Subject[];
  currentSubjectId: string | null;
  tasks: PlanTask[];
  isLoading: boolean;
  suggestions: AISuggestions | null;
  isSuggesting: boolean;
  studyPlan: StudyPlan | null;
  isGenerating: boolean;
  digest: Digest | null;
  digestLoading: boolean;

  setSubjects: (subjects: Subject[]) => void;
  addSubject: (subject: Subject) => void;
  removeSubject: (id: string) => void;
  setCurrentSubjectId: (id: string | null) => void;
  setTasks: (tasks: PlanTask[]) => void;
  addTask: (task: PlanTask) => void;
  updateTask: (id: string, updates: Partial<PlanTask>) => void;
  removeTask: (id: string) => void;
  setLoading: (v: boolean) => void;
  setSuggestions: (s: AISuggestions | null) => void;
  setSuggesting: (v: boolean) => void;
  setStudyPlan: (plan: StudyPlan | null) => void;
  setGenerating: (v: boolean) => void;
  setDigest: (d: Digest | null) => void;
  setDigestLoading: (v: boolean) => void;
  clearSuggestions: () => void;
};

export const useEduPlanStore = create<EduPlanState>((set) => ({
  subjects: [],
  currentSubjectId: null,
  tasks: [],
  isLoading: false,
  suggestions: null,
  isSuggesting: false,
  studyPlan: null,
  isGenerating: false,
  digest: null,
  digestLoading: false,

  setSubjects: (subjects) => set({ subjects }),
  addSubject: (subject) => set((s) => ({ subjects: [...s.subjects, subject] })),
  removeSubject: (id) =>
    set((s) => ({
      subjects: s.subjects.filter((sub) => sub.id !== id),
      currentSubjectId: s.currentSubjectId === id ? null : s.currentSubjectId,
    })),
  setCurrentSubjectId: (currentSubjectId) => set({ currentSubjectId }),
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
  updateTask: (id, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTask: (id) =>
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setSuggesting: (isSuggesting) => set({ isSuggesting }),
  setStudyPlan: (studyPlan) => set({ studyPlan }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setDigest: (digest) => set({ digest }),
  setDigestLoading: (digestLoading) => set({ digestLoading }),
  clearSuggestions: () => set({ suggestions: null }),
}));
