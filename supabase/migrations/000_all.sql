-- Edunet Scholar — Complete Schema
-- Run this in Supabase SQL Editor once.
-- Also create the storage bucket manually via Dashboard > Storage or run the storage block below.

-- Enable extensions
create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- 2. WORKSPACES
create table if not exists workspaces (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Workspace',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table workspaces enable row level security;

drop policy if exists "Users can view own workspaces" on workspaces;
create policy "Users can view own workspaces"
  on workspaces for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own workspaces" on workspaces;
create policy "Users can create own workspaces"
  on workspaces for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own workspaces" on workspaces;
create policy "Users can update own workspaces"
  on workspaces for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own workspaces" on workspaces;
create policy "Users can delete own workspaces"
  on workspaces for delete
  using (auth.uid() = user_id);

-- 3. CHAT SESSIONS
create table if not exists chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null default 'New Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table chat_sessions enable row level security;

drop policy if exists "Users can view chat sessions in own workspace" on chat_sessions;
create policy "Users can view chat sessions in own workspace"
  on chat_sessions for select
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = chat_sessions.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create chat sessions in own workspace" on chat_sessions;
create policy "Users can create chat sessions in own workspace"
  on chat_sessions for insert
  with check (
    exists (
      select 1 from workspaces
      where workspaces.id = chat_sessions.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update chat sessions in own workspace" on chat_sessions;
create policy "Users can update chat sessions in own workspace"
  on chat_sessions for update
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = chat_sessions.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete chat sessions in own workspace" on chat_sessions;
create policy "Users can delete chat sessions in own workspace"
  on chat_sessions for delete
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = chat_sessions.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

-- 4. MESSAGES
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

drop policy if exists "Users can view messages in own session" on messages;
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

drop policy if exists "Users can create messages in own session" on messages;
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

-- 5. DOCUMENTS
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

drop policy if exists "Users can view documents in own workspace" on documents;
create policy "Users can view documents in own workspace"
  on documents for select
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = documents.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create documents in own workspace" on documents;
create policy "Users can create documents in own workspace"
  on documents for insert
  with check (
    exists (
      select 1 from workspaces
      where workspaces.id = documents.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update documents in own workspace" on documents;
create policy "Users can update documents in own workspace"
  on documents for update
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = documents.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete documents in own workspace" on documents;
create policy "Users can delete documents in own workspace"
  on documents for delete
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = documents.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

-- 6. SUBJECTS
create table if not exists subjects (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  color text not null default '#5B5BD6',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table subjects enable row level security;

drop policy if exists "Users can view subjects in own workspace" on subjects;
create policy "Users can view subjects in own workspace"
  on subjects for select
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = subjects.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create subjects in own workspace" on subjects;
create policy "Users can create subjects in own workspace"
  on subjects for insert
  with check (
    exists (
      select 1 from workspaces
      where workspaces.id = subjects.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update subjects in own workspace" on subjects;
create policy "Users can update subjects in own workspace"
  on subjects for update
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = subjects.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete subjects in own workspace" on subjects;
create policy "Users can delete subjects in own workspace"
  on subjects for delete
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = subjects.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

-- 7. TASKS
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  parent_id uuid references tasks(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date timestamptz,
  estimated_hours numeric(5,1),
  sort_order integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tasks enable row level security;

drop policy if exists "Users can view tasks in own workspace" on tasks;
create policy "Users can view tasks in own workspace"
  on tasks for select
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = tasks.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create tasks in own workspace" on tasks;
create policy "Users can create tasks in own workspace"
  on tasks for insert
  with check (
    exists (
      select 1 from workspaces
      where workspaces.id = tasks.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update tasks in own workspace" on tasks;
create policy "Users can update tasks in own workspace"
  on tasks for update
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = tasks.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete tasks in own workspace" on tasks;
create policy "Users can delete tasks in own workspace"
  on tasks for delete
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = tasks.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

-- 8. GOALS
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

drop policy if exists "Users can view goals in own workspace" on goals;
create policy "Users can view goals in own workspace"
  on goals for select
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = goals.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create goals in own workspace" on goals;
create policy "Users can create goals in own workspace"
  on goals for insert
  with check (
    exists (
      select 1 from workspaces
      where workspaces.id = goals.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update goals in own workspace" on goals;
create policy "Users can update goals in own workspace"
  on goals for update
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = goals.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete goals in own workspace" on goals;
create policy "Users can delete goals in own workspace"
  on goals for delete
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = goals.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

-- TRIGGERS: updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'update_profiles_updated_at') then
    create trigger update_profiles_updated_at
      before update on profiles
      for each row execute function update_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'update_workspaces_updated_at') then
    create trigger update_workspaces_updated_at
      before update on workspaces
      for each row execute function update_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'update_chat_sessions_updated_at') then
    create trigger update_chat_sessions_updated_at
      before update on chat_sessions
      for each row execute function update_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'update_documents_updated_at') then
    create trigger update_documents_updated_at
      before update on documents
      for each row execute function update_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'update_subjects_updated_at') then
    create trigger update_subjects_updated_at
      before update on subjects
      for each row execute function update_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'update_tasks_updated_at') then
    create trigger update_tasks_updated_at
      before update on tasks
      for each row execute function update_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'update_goals_updated_at') then
    create trigger update_goals_updated_at
      before update on goals
      for each row execute function update_updated_at();
  end if;
end $$;

-- TRIGGER: auto-create profile + workspace on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  insert into public.workspaces (user_id, name)
  values (new.id, 'My Workspace');

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- STORAGE BUCKET: edubook-documents
insert into storage.buckets (id, name, public, avif_autodetection)
values ('edubook-documents', 'edubook-documents', true, false)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload documents" on storage.objects;
create policy "Authenticated users can upload documents"
  on storage.objects for insert
  with check (
    bucket_id = 'edubook-documents'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Users can view documents" on storage.objects;
create policy "Users can view documents"
  on storage.objects for select
  using (
    bucket_id = 'edubook-documents'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Users can delete own documents" on storage.objects;
create policy "Users can delete own documents"
  on storage.objects for delete
  using (
    bucket_id = 'edubook-documents'
    and auth.role() = 'authenticated'
  );
