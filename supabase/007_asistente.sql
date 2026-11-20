-- Bono 3 · Asistente de ideas: índice para consultar ingresos por correo.
create index if not exists asistente_uso_email_idx on public.asistente_uso (email);
