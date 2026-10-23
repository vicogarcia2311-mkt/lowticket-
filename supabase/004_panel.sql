-- 004 · Datos del panel en una sola consulta, filtrados por fechas. Correr una vez en Supabase → SQL Editor (después del 003).

create or replace function public.panel_datos(desde timestamptz, hasta timestamptz)
returns json
language sql
stable
security invoker
as $$
  select json_build_object(
    'totales', (
      select json_build_object(
        'visitas',       (select count(distinct sesion) from eventos where evento = 'visita'      and created_at between desde and hasta),
        'test_iniciado', (select count(distinct sesion) from eventos where evento = 'test_inicio' and created_at between desde and hasta),
        'leads',         (select count(*) from leads  where created_at between desde and hasta),
        'indecisas',     (select count(*) from leads  where indeciso and created_at between desde and hasta),
        'ventas',        (select count(*) from ventas where estado = 'aprobada' and created_at between desde and hasta),
        'ingresos',      (select coalesce(sum(monto), 0) from ventas where estado = 'aprobada' and created_at between desde and hasta),
        'reembolsos',    (select count(*) from ventas where estado in ('reembolsada', 'contracargo') and created_at between desde and hasta)
      )
    ),
    'embudo', (
      select coalesce(json_agg(e order by e.visitas desc), '[]'::json) from (
        select coalesce(utm_source, '(directo)') as fuente, coalesce(utm_medium, '') as medio,
               coalesce(utm_campaign, '') as campana, coalesce(utm_content, '') as pieza,
               count(distinct sesion) filter (where evento = 'visita')      as visitas,
               count(distinct sesion) filter (where evento = 'test_inicio') as test_iniciado,
               count(distinct sesion) filter (where evento = 'formulario')  as llegaron_al_formulario,
               count(distinct sesion) filter (where evento = 'lead')        as leads,
               count(distinct sesion) filter (where evento = 'clic_compra') as clic_compra
        from eventos where created_at between desde and hasta
        group by 1, 2, 3, 4
      ) e
    ),
    'ventas_utm', (
      select coalesce(json_agg(v), '[]'::json) from (
        select coalesce(l.utm_source, '(directo)') as fuente, coalesce(l.utm_medium, '') as medio,
               coalesce(l.utm_campaign, '') as campana, coalesce(l.utm_content, '') as pieza,
               count(*) as ventas, coalesce(sum(v.monto), 0) as ingresos
        from ventas v left join leads l on l.id = v.lead_id
        where v.estado = 'aprobada' and v.created_at between desde and hasta
        group by 1, 2, 3, 4
      ) v
    ),
    'por_camino', (
      select coalesce(json_agg(c), '[]'::json) from (
        select l.angulo as camino, count(*) as leads,
               count(v.id) filter (where v.estado = 'aprobada') as ventas,
               coalesce(sum(v.monto) filter (where v.estado = 'aprobada'), 0) as ingresos
        from leads l left join ventas v on v.lead_id = l.id
        where l.created_at between desde and hasta
        group by l.angulo
      ) c
    ),
    'diario', (
      select coalesce(json_agg(d order by d.dia), '[]'::json) from (
        select dia,
               sum(leads)::int  as leads,
               sum(ventas)::int as ventas
        from (
          select (created_at at time zone 'America/Bogota')::date as dia, 1 as leads, 0 as ventas from leads  where created_at between desde and hasta
          union all
          select (created_at at time zone 'America/Bogota')::date, 0, 1 from ventas where estado = 'aprobada' and created_at between desde and hasta
        ) x
        group by dia
      ) d
    )
  );
$$;

revoke execute on function public.panel_datos(timestamptz, timestamptz) from public, anon, authenticated;
