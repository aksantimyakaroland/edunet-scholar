-- Subjects table for task organization
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

create policy "Users can view subjects in own workspace"
  on subjects for select
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = subjects.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "Users can create subjects in own workspace"
  on subjects for insert
  with check (
    exists (
      select 1 from workspaces
      where workspaces.id = subjects.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "Users can update subjects in own workspace"
  on subjects for update
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = subjects.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "Users can delete subjects in own workspace"
  on subjects for delete
  using (
    exists (
      select 1 from workspaces
      where workspaces.id = subjects.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

-- Add new columns to tasks table
alter table tasks add column if not exists parent_id uuid references tasks(id) on delete cascade;
alter table tasks add column if not exists sort_order integer not null default 0;
alter table tasks add column if not exists subject_id uuid references subjects(id) on delete set null;
alter table tasks add column if not exists estimated_hours numeric(5,1);

-- Triggers for updated_at
create trigger update_subjects_updated_at
  before update on subjects
  for each row
  execute function update_updated_at();