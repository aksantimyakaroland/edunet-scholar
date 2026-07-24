import { create } from "zustand";

export type ChatSession = {
  id: string;
  title: string;
  updatedAt: string;
};

type ChatSessionsState = {
  sessions: ChatSession[];
  currentSessionId: string | null;
  setCurrentSession: (id: string | null) => void;
  addSession: (session: ChatSession) => void;
  removeSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
};

export const useChatSessionsStore = create<ChatSessionsState>((set) => ({
  sessions: [],
  currentSessionId: null,
  setCurrentSession: (id) => set({ currentSessionId: id }),
  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions],
      currentSessionId: session.id,
    })),
  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      currentSessionId:
        state.currentSessionId === id ? null : state.currentSessionId,
    })),
  renameSession: (id, title) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, title, updatedAt: new Date().toISOString() } : s
      ),
    })),
}));
