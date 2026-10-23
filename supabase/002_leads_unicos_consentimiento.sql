-- 002 · Un lead por correo + evidencia del consentimiento (Ley 1581). Correr una vez en Supabase → SQL Editor.

alter table public.leads
  add column if not exists consentimiento_at timestamptz,
  add column if not exists politica_version text,
  add column if not exists actualizado_at timestamptz;

-- Correos en minúscula y sin espacios
update public.leads set email = lower(trim(email));

-- Si hay correos repetidos, se conserva la fila más reciente de cada uno
delete from public.leads a
using public.leads b
where a.email = b.email and a.created_at < b.created_at;

alter table public.leads add constraint leads_email_key unique (email);

-- Ventas: correo en minúscula para cruzar con leads
update public.ventas set email = lower(trim(email)) where email is not null;
