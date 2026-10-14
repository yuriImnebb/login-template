create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  senha text not null,
  created_at timestamptz not null default now()
);

alter table public.usuarios enable row level security;