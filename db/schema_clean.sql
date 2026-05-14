create extension if not exists "uuid-ossp";

create table if not exists leads (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  company text,
  email text,
  phone text,
  website text,
  industry text,
  source text default 'manual',
  status text default 'new',
  score integer,
  score_breakdown jsonb,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_leads_user_id on leads(user_id);
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_score on leads(score);

alter table leads enable row level security;

create policy "Users can view their own leads"
  on leads for select
  using (auth.uid() = user_id);

create policy "Users can insert their own leads"
  on leads for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own leads"
  on leads for update
  using (auth.uid() = user_id);

create policy "Users can delete their own leads"
  on leads for delete
  using (auth.uid() = user_id);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_leads_updated_at
  before update on leads
  for each row
  execute function update_updated_at_column();
