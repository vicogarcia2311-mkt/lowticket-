// Recibe los eventos de la web (assets/camino.js → send) y guarda los leads en Supabase.
// Variables de entorno en Vercel: SUPABASE_URL y SUPABASE_SECRET_KEY (nunca en el código).

const ANGULOS = ["ugc", "negocio", "marca-personal", "por-definir"];
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const txt = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : null) || null;

function supabaseHeaders(key) {
  const h = { apikey: key, "Content-Type": "application/json", Prefer: "return=minimal" };
  // Las claves nuevas (sb_secret_…) van solo en apikey; la legacy service_role (JWT) también en Authorization.
  if (!key.startsWith("sb_")) h.Authorization = `Bearer ${key}`;
  return h;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  let data = req.body;
  if (typeof data === "string") { try { data = JSON.parse(data); } catch (e) { return res.status(400).end(); } }
  if (!data || typeof data !== "object") return res.status(400).end();

  // Por ahora solo se guardan leads; los clics del embudo se ignoran.
  if (data.event !== "lead") return res.status(204).end();

  const lead = {
    nombre: txt(data.nombre, 120),
    email: txt(data.email, 200),
    whatsapp: txt(data.whatsapp, 30),
    angulo: data.angulo,
    indeciso: data.indeciso === true,
    bloqueo: txt(data.bloqueo, 200),
    objetivo: txt(data.objetivo, 200),
    situacion: txt(data.situacion, 200),
    pagina: txt(data.page, 200)
  };
  UTM.forEach(k => { lead[k] = txt(data[k], 200); });

  if (!lead.nombre || !/^\S+@\S+\.\S+$/.test(lead.email || "") || !lead.whatsapp || !ANGULOS.includes(lead.angulo)) {
    return res.status(422).end();
  }

  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return res.status(503).end();

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST", headers: supabaseHeaders(SUPABASE_SECRET_KEY), body: JSON.stringify(lead)
    });
    if (!r.ok) { console.error("supabase", r.status, await r.text()); return res.status(502).end(); }
    return res.status(201).end();
  } catch (e) {
    console.error("supabase", e.message);
    return res.status(502).end();
  }
};
