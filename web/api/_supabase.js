// Cliente mínimo de Supabase (REST) para las funciones. Vercel no publica archivos de /api que empiezan con "_".
// Variables de entorno: SUPABASE_URL y SUPABASE_SECRET_KEY.

function headers(extra) {
  const key = process.env.SUPABASE_SECRET_KEY;
  const h = Object.assign({ apikey: key, "Content-Type": "application/json" }, extra || {});
  // Las claves nuevas (sb_secret_…) van solo en apikey; la legacy service_role (JWT) también en Authorization.
  if (!key.startsWith("sb_")) h.Authorization = `Bearer ${key}`;
  return h;
}

const configured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);

async function rest(path, { method = "GET", body, prefer } = {}) {
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: headers(prefer ? { Prefer: prefer } : {}),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`supabase ${r.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

module.exports = { configured, rest };
