-- Migration: Create bulletins table
-- This table stores bulletin information for churches

create table public.bulletins (
  id serial not null,
  church_id integer not null,
  title character varying not null,
  date date not null,
  content text null,
  file_url character varying null,
  created_at timestamp with time zone null default now(),
  created_by integer null,
  updated_at timestamp with time zone null,
  constraint bulletins_pkey primary key (id)
);

-- Add indexes for better query performance
create index idx_bulletins_church_id on public.bulletins(church_id);
create index idx_bulletins_date on public.bulletins(date);
create index idx_bulletins_created_at on public.bulletins(created_at);

-- Enable Row Level Security
alter table public.bulletins enable row level security;

-- Create RLS policies
-- Allow authenticated users to read bulletins
create policy "Enable read access for authenticated users" on public.bulletins
  for select using (auth.role() = 'authenticated');

-- Allow service role to do everything (for Edge Functions)
create policy "Enable all access for service role" on public.bulletins
  for all using (auth.role() = 'service_role');

-- Allow authenticated users to insert/update/delete (basic policy)
create policy "Enable insert for authenticated users" on public.bulletins
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on public.bulletins
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on public.bulletins
  for delete using (auth.role() = 'authenticated');

-- Add a trigger to automatically update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_bulletins_updated_at
  before update on public.bulletins
  for each row
  execute function update_updated_at_column();