-- Migration: Create worship_services table
-- This table stores worship service schedule information for churches

create table public.worship_services (
  id bigint primary key generated always as identity,
  church_id integer not null,
  name text not null,
  location text,
  day_of_week integer, -- 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
  start_time time without time zone not null,
  end_time time without time zone,
  service_type text,
  target_group text,
  is_online boolean default false,
  is_active boolean default true,
  order_index integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes for better query performance
create index idx_worship_services_church_id on public.worship_services(church_id);
create index idx_worship_services_day_of_week on public.worship_services(day_of_week);
create index idx_worship_services_is_active on public.worship_services(is_active);
create index idx_worship_services_order_index on public.worship_services(order_index);

-- Enable Row Level Security
alter table public.worship_services enable row level security;

-- Create RLS policies
-- Allow authenticated users to read worship services
create policy "Enable read access for authenticated users" on public.worship_services
  for select using (auth.role() = 'authenticated');

-- Allow service role to do everything (for Edge Functions)
create policy "Enable all access for service role" on public.worship_services
  for all using (auth.role() = 'service_role');

-- Allow authenticated users to insert/update/delete (basic policy)
create policy "Enable insert for authenticated users" on public.worship_services
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on public.worship_services
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on public.worship_services
  for delete using (auth.role() = 'authenticated');

-- Add a trigger to automatically update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_worship_services_updated_at
  before update on public.worship_services
  for each row
  execute function update_updated_at_column();