-- Independent VSL applications. Apply before enabling VSL_LIVE.
create table if not exists public.vsl_applications (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 token_hash text not null unique,
 nombre text not null,
 email text not null,
 whatsapp text not null,
 consent boolean not null,
 meta_consent boolean not null default false,
 utm jsonb not null default '{}'::jsonb,
 fbp text, fbc text, client_ip text, user_agent text,
 lead_event_id text not null unique,
 answers jsonb,
 status text not null default 'registered' check(status in ('registered','pending','qualified','not_qualified','booked')),
 submitted_at timestamptz,
 booking_id text unique,
 schedule_event_id text unique,
 schedule_meta_sent boolean not null default false,
 booked_at timestamptz
);
alter table public.vsl_applications enable row level security;
revoke all on public.vsl_applications from anon, authenticated;
grant select, insert, update on public.vsl_applications to service_role;
create index if not exists vsl_applications_status_idx on public.vsl_applications(status,created_at);
