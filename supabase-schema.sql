-- Run this in Supabase SQL Editor (supabase.com > your project > SQL Editor)

-- Users / creators
create table if not exists creators (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  plan text default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text,
  created_at timestamptz default now()
);

-- Fans
create table if not exists fans (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references creators(id) on delete cascade,
  name text not null,
  tag text default 'new' check (tag in ('whale', 'vip', 'regular', 'new', 'at-risk')),
  total_spent numeric default 0,
  last_message_at timestamptz,
  renewal_date timestamptz,
  notes text default '',
  created_at timestamptz default now()
);

-- Row-level security: creators can only see their own fans
alter table fans enable row level security;

create policy "Creators can view own fans"
  on fans for select
  using (creator_id = auth.uid());

create policy "Creators can insert own fans"
  on fans for insert
  with check (creator_id = auth.uid());

create policy "Creators can update own fans"
  on fans for update
  using (creator_id = auth.uid());

create policy "Creators can delete own fans"
  on fans for delete
  using (creator_id = auth.uid());

-- Index for fast lookups
create index if not exists idx_fans_creator on fans(creator_id);
create index if not exists idx_fans_tag on fans(creator_id, tag);
create index if not exists idx_fans_renewal on fans(creator_id, renewal_date);

-- Announcements (admin broadcasts to all users)
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- Support tickets (contact form submissions)
create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz default now()
);

alter table support_tickets enable row level security;

create policy "Anyone can submit a ticket"
  on support_tickets for insert
  with check (true);

create index if not exists idx_tickets_status on support_tickets(status, created_at desc);
