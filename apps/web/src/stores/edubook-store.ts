import { create } from "zustand";

export type EduBookDocument = {
  id: string;
  title: string;
  file_type: string;
  storage_path: string;
  created_at: string;
};

type EduBookState = {
  documents: EduBookDocument[];
  selectedDocIds: string[];
  isUploading: boolean;
  isLoading: boolean;

  // Chat
  chatMessages: { role: "user" | "assistant"; content: string }[];
  isChatLoading: boolean;

  // Actions
  setDocuments: (docs: EduBookDocument[]) => void;
  addDocument: (doc: EduBookDocument) => void;
  removeDocument: (id: string) => void;
  toggleDocSelection: (id: string) => void;
  setUploading: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  addChatMessage: (msg: { role: "user" | "assistant"; content: string }) => void;
  setChatMessages: (msgs: { role: "user" | "assistant"; content: string }[]) => void;
  setChatLoading: (v: boolean) => void;
  clearSelection: () => void;
};

export const useEduBookStore = create<EduBookState>((set) => ({
  documents: [],
  selectedDocIds: [],
  isUploading: false,
  isLoading: false,
  chatMessages: [],
  isChatLoading: false,

  setDocuments: (documents) => set({ documents }),
  addDocument: (doc) => set((s) => ({ documents: [doc, ...s.documents] })),
  removeDocument: (id) =>
    set((s) => ({
      documents: s.documents.filter((d) => d.id !== id),
      selectedDocIds: s.selectedDocIds.filter((did) => did !== id),
    })),
  toggleDocSelection: (id) =>
    set((s) => ({
      selectedDocIds: s.selectedDocIds.includes(id)
        ? s.selectedDocIds.filter((did) => did !== id)
        : [...s.selectedDocIds, id],
    })),
  setUploading: (isUploading) => set({ isUploading }),
  setLoading: (isLoading) => set({ isLoading }),
  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  setChatMessages: (chatMessages) => set({ chatMessages }),
  setChatLoading: (isChatLoading) => set({ isChatLoading }),
  clearSelection: () => set({ selectedDocIds: [] }),
}));
