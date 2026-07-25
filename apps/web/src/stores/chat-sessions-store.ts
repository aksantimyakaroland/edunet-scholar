import { create } from "zustand";

export type ChatSession = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type ChatSessionsState = {
  currentSessionId: string | null;
  sessions: ChatSession[];
  sessionsLoading: boolean;
  sessionsFetched: boolean;

  setCurrentSession: (id: string | null) => void;
  setSessions: (sessions: ChatSession[]) => void;
  addSession: (session: ChatSession) => void;
  removeSession: (id: string) => void;
  renameSessionLocally: (id: string, title: string) => void;
  setSessionsLoading: (v: boolean) => void;
  markSessionsFetched: () => void;
};

export const useChatSessionsStore = create<ChatSessionsState>((set) => ({
  currentSessionId: null,
  sessions: [],
  sessionsLoading: false,
  sessionsFetched: false,

  setCurrentSession: (id) => set({ currentSessionId: id }),
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((s) => ({ sessions: [session, ...s.sessions] })),
  removeSession: (id) => set((s) => ({ sessions: s.sessions.filter((s) => s.id !== id) })),
  renameSessionLocally: (id, title) =>
    set((s) => ({
      sessions: s.sessions.map((s) =>
        s.id === id ? { ...s, title, updated_at: new Date().toISOString() } : s
      ),
    })),
  setSessionsLoading: (sessionsLoading) => set({ sessionsLoading }),
  markSessionsFetched: () => set({ sessionsFetched: true }),
}));
