import { create } from "zustand";

type ChatSessionsState = {
  currentSessionId: string | null;
  setCurrentSession: (id: string | null) => void;
};

export const useChatSessionsStore = create<ChatSessionsState>((set) => ({
  currentSessionId: null,
  setCurrentSession: (id) => set({ currentSessionId: id }),
}));
