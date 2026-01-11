-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Contacts Module
create table public.contacts (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  telefone text not null,
  email text,
  status text default 'novo', -- novo, negociacao, proposta, fechado, perdido
  prioridade text default 'media', -- alta, media, baixa
  tags text[] default '{}',
  data_criacao timestamp with time zone default timezone('utc'::text, now()),
  ultimo_contato timestamp with time zone default timezone('utc'::text, now()),
  aniversario date,
  observacoes text,
  owner_id uuid references auth.users(id)
);

-- 2. Messages Module
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  contact_id uuid references public.contacts(id) on delete cascade,
  texto text not null,
  tipo text not null check (tipo in ('enviada', 'recebida')),
  midia_url text,
  midia_tipo text,
  data_envio timestamp with time zone default timezone('utc'::text, now()),
  status text default 'enviado' -- enviado, entregue, lido
);

-- 3. Agenda/Events Module
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone,
  contact_id uuid references public.contacts(id) on delete set null,
  type text default 'reuniao', -- reuniao, visita, call, tarefa
  status text default 'pendente', -- pendente, concluido, cancelado
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Pipeline/Kanban Configuration (Optional, if stages are dynamic)
create table public.pipeline_stages (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  color text,
  position integer not null
);

-- RLS Policies (Security)
alter table public.contacts enable row level security;
alter table public.messages enable row level security;
alter table public.events enable row level security;

-- Simple policy: User can view/edit their own data (assuming single tenant per row or shared)
-- For this CRM, we'll assume open access for authenticated users for simplicity, or modify as needed.
create policy "Allow access to authenticated users" on public.contacts for all using (auth.role() = 'authenticated');
create policy "Allow access to authenticated users" on public.messages for all using (auth.role() = 'authenticated');
create policy "Allow access to authenticated users" on public.events for all using (auth.role() = 'authenticated');
create policy "Allow access to authenticated users" on public.events for all using (auth.role() = 'authenticated');

-- 5. Real Estate Module (Refined Schema)
create table public.properties (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Vínculos
  owner_id uuid references public.contacts(id),
  type text not null, -- 'Venda' ou 'Locacao'
  status text default 'disponivel', -- 'disponivel', 'reservado', 'vendido'
  
  -- Dados do Imóvel
  title text,
  description text,
  address_zipcode text,
  address_street text,
  address_number text,
  address_neighborhood text, -- Added to complete address
  address_city text,        -- Added to complete address
  address_state text,       -- Added to complete address
  
  -- Detalhes Técnicos
  area_total numeric,
  area_useful numeric,
  bedrooms int,
  suites int,
  bathrooms int,
  garages int,
  
  -- Financeiro
  price numeric,
  condo_fee numeric,
  iptu_value numeric,
  
  -- Logística
  keys_location text,
  
  -- Features
  features text[],
  
  -- Multimídia (Keeping these to support the UI)
  photos text[] default '{}',
  video_url text,
  tour_360_url text
);

-- RLS
alter table public.properties enable row level security;
create policy "Allow access to properties" on public.properties for all using (auth.role() = 'authenticated');
