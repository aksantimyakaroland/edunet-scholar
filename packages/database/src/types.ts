export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Workspace = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  workspace_id: string;
  title: string;
  file_type: string;
  storage_path: string;
  content: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatSession = {
  id: string;
  workspace_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  sources: string[] | null;
  created_at: string;
};

export type Subject = {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  subject_id: string | null;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  estimated_hours: number | null;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Goal = {
  id: string;
  workspace_id: string;
  title: string;
  target_date: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at" | "updated_at">; Update: Partial<Omit<Profile, "id">> };
      workspaces: { Row: Workspace; Insert: Omit<Workspace, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Workspace, "id">> };
      documents: { Row: Document; Insert: Omit<Document, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Document, "id">> };
      chat_sessions: { Row: ChatSession; Insert: Omit<ChatSession, "id" | "created_at" | "updated_at">; Update: Partial<Omit<ChatSession, "id">> };
      messages: { Row: Message; Insert: Omit<Message, "id" | "created_at">; Update: Partial<Omit<Message, "id">> };
      subjects: { Row: Subject; Insert: Omit<Subject, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Subject, "id">> };
      tasks: { Row: Task; Insert: Omit<Task, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Task, "id">> };
      goals: { Row: Goal; Insert: Omit<Goal, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Goal, "id">> };
    };
  };
};
