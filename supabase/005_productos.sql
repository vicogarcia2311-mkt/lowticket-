-- 005 · Varios infoproductos en la misma web: cada lead queda marcado con los productos por los que entró.
-- Correr una vez en Supabase → SQL Editor (después de 002).

-- Los productos gratis (ej. /prompts) piden solo nombre y correo.
alter table public.leads alter column whatsapp drop not null;

alter table public.leads add column if not exists productos text[] not null default '{}';
-- Los leads anteriores llegaron todos por el test del workshop.
update public.leads set productos = '{workshop}' where productos = '{}';
create index if not exists leads_productos_idx on public.leads using gin (productos);

-- Agrega un producto al lead sin pisar sus datos: si el correo ya existe solo suma el producto y completa lo que falte.
create or replace function public.lead_producto(p jsonb) returns void language sql as $$
  insert into public.leads (nombre, email, whatsapp, angulo, consentimiento, consentimiento_at, politica_version, pagina,
                            utm_source, utm_medium, utm_campaign, utm_content, utm_term, productos, actualizado_at)
  values (p->>'nombre', lower(p->>'email'), nullif(p->>'whatsapp', ''), coalesce(p->>'angulo', 'por-definir'), true,
          coalesce((p->>'consentimiento_at')::timestamptz, now()), p->>'politica_version', p->>'pagina',
          p->>'utm_source', p->>'utm_medium', p->>'utm_campaign', p->>'utm_content', p->>'utm_term',
          array[p->>'producto'], now())
  on conflict (email) do update set
    productos = (select array_agg(distinct x) from unnest(leads.productos || excluded.productos) x),
    whatsapp = coalesce(leads.whatsapp, excluded.whatsapp),
    actualizado_at = now();
$$;
revoke execute on function public.lead_producto(jsonb) from public, anon, authenticated;
