-- 001 · Tablas base (correr una vez en Supabase → SQL Editor). Proyecto: gfbeaflsttyegmnkmaox

-- Leads que llegan del test de la web (web/api/lead.js)
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  email text not null,
  whatsapp text not null,
  angulo text not null check (angulo in ('ugc','negocio','marca-personal','por-definir')),
  indeciso boolean not null default false,
  bloqueo text,
  objetivo text,
  situacion text,
  consentimiento boolean not null default true,
  utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text,
  pagina text
);
create index leads_email_idx on public.leads (lower(email));

-- Ventas que llegan de Whop o Hotmart (base del revenue share)
create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  plataforma text not null check (plataforma in ('whop','hotmart')),
  transaccion_id text not null unique,
  email text,
  producto text,
  monto numeric(10,2),
  moneda text default 'USD',
  estado text not null check (estado in ('aprobada','pendiente','reembolsada','contracargo')),
  angulo text,
  src text,
  sck text,
  lead_id uuid references public.leads(id),
  raw jsonb
);

-- Uso del asistente de IA (bono 3), para el límite por persona
create table public.asistente_uso (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  email text not null,
  idea text,
  tokens int
);

-- Seguridad: sin políticas públicas. Solo el servidor (Vercel, con la clave secreta) lee y escribe.
alter table public.leads enable row level security;
alter table public.ventas enable row level security;
alter table public.asistente_uso enable row level security;
