-- Edunet Scholar - Database Schema
-- Migration 001: Initial schema

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Workspaces
create table if not exists workspaces (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Workspace',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table workspaces enable row level security;

create policy "Users can view own workspaces"
  on workspaces for select
  using (auth.uid() = user_id);

create policy "Users can create own workspaces"
  on workspaces for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workspaces"
  on workspaces for update
  using (auth.uid() = user_id);

create policy "Users can delete own workspaces"
  on workspaces for delete
  using (auth.uid() = user_id);

-- Documents
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  file_type text not null,
  storage_path text not null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table documents enable row level security;

create policy "Users can view documents in own workspace"
  on documents for select
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = documents.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "Users can create documents in own workspace"
  on documents for insert
  with check (
    exists (
      select 1 from workspaces
      where workspaces.id = documents.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "Users can update documents in own workspace"
  on documents for update
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = documents.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "Users can delete documents in own workspace"
  on documents for delete
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = documents.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

-- Chat sessions
create table if not exists chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null default 'New Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table chat_sessions enable row level security;

create policy "Users can view chat sessions in own workspace"
  on chat_sessions for select
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = chat_sessions.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "Users can create chat sessions in own workspace"
  on chat_sessions for insert
  with check (
    exists (
      select 1 from workspaces
      where workspaces.id = chat_sessions.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "Users can update chat sessions in own workspace"
  on chat_sessions for update
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = chat_sessions.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "Users can delete chat sessions in own workspace"
  on chat_sessions for delete
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = chat_sessions.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

-- Messages
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

create policy "Users can view messages in own session"
  on messages for select
  using (
    exists (
      select 1 from chat_sessions
      join workspaces on workspaces.id = chat_sessions.workspace_id
      where chat_sessions.id = messages.session_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "Users can create messages in own session"
  on messages for insert
  with check (
    exists (
      select 1 from chat_sessions
      join workspaces on workspaces.id = chat_sessions.workspace_id
      where chat_sessions.id = messages.session_id
      and workspaces.user_id = auth.uid()
    )
  );

-- Tasks
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "Users can view tasks in own workspace"
  on tasks for select
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = tasks.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "Users can create tasks in own workspace"
  on tasks for insert
  with check (
    exists (
      select 1 from workspaces
      where workspaces.id = tasks.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "Users can update tasks in own workspace"
  on tasks for update
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = tasks.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "Users can delete tasks in own workspace"
  on tasks for delete
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = tasks.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

-- Goals
create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  target_date timestamptz,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table goals enable row level security;

create policy "Users can view goals in own workspace"
  on goals for select
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = goals.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "Users can create goals in own workspace"
  on goals for insert
  with check (
    exists (
      select 1 from workspaces
      where workspaces.id = goals.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "Users can update goals in own workspace"
  on goals for update
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = goals.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "Users can delete goals in own workspace"
  on goals for delete
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = goals.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_workspaces_updated_at
  before update on workspaces
  for each row execute function update_updated_at();

create trigger update_documents_updated_at
  before update on documents
  for each row execute function update_updated_at();

create trigger update_chat_sessions_updated_at
  before update on chat_sessions
  for each row execute function update_updated_at();

create trigger update_tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

create trigger update_goals_updated_at
  before update on goals
  for each row execute function update_updated_at();
