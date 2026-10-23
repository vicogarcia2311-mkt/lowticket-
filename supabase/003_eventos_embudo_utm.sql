-- 003 · Embudo por UTM: visitas y pasos del test (sin datos personales). Correr una vez en Supabase → SQL Editor.

create table if not exists public.eventos (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  sesion text not null,          -- una visita (id aleatorio del navegador, no identifica a la persona)
  visitante text,                -- mismo navegador en varias visitas
  evento text not null check (evento in ('visita','test_inicio','pregunta_1','pregunta_2','pregunta_3','formulario','lead','grupo','clic_compra','clic_espera')),
  pagina text,
  angulo text,
  utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text,
  referrer text,
  movil boolean
);
create index if not exists eventos_fecha_idx on public.eventos (created_at);
create index if not exists eventos_utm_idx on public.eventos (utm_campaign, utm_content);
alter table public.eventos enable row level security;

-- Embudo por fuente / medio / campaña / pieza (personas únicas por visita)
create or replace view public.embudo_utm with (security_invoker = true) as
select
  coalesce(utm_source, '(directo)') as fuente,
  coalesce(utm_medium, '')          as medio,
  coalesce(utm_campaign, '')        as campana,
  coalesce(utm_content, '')         as pieza,
  count(distinct sesion) filter (where evento = 'visita')      as visitas,
  count(distinct sesion) filter (where evento = 'test_inicio') as test_iniciado,
  count(distinct sesion) filter (where evento = 'formulario')  as llegaron_al_formulario,
  count(distinct sesion) filter (where evento = 'lead')        as leads,
  count(distinct sesion) filter (where evento = 'clic_compra') as clic_compra
from public.eventos
group by 1, 2, 3, 4;

-- Ventas aprobadas por UTM (vía el lead que compró)
create or replace view public.ventas_utm with (security_invoker = true) as
select
  coalesce(l.utm_source, '(directo)') as fuente,
  coalesce(l.utm_medium, '')          as medio,
  coalesce(l.utm_campaign, '')        as campana,
  coalesce(l.utm_content, '')         as pieza,
  count(*)                            as ventas,
  coalesce(sum(v.monto), 0)           as ingresos
from public.ventas v
left join public.leads l on l.id = v.lead_id
where v.estado = 'aprobada'
group by 1, 2, 3, 4;

-- Las vistas solo las lee el servidor (Vercel con la clave secreta)
revoke all on public.embudo_utm, public.ventas_utm from anon, authenticated;
