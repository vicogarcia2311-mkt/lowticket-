// Recibe los eventos de la web (assets/camino.js → send) y guarda los leads en Supabase.
// Un lead por correo: si la persona repite el test se actualiza su fila (requiere supabase/002_leads_unicos_consentimiento.sql).
// Variables de entorno en Vercel: SUPABASE_URL y SUPABASE_SECRET_KEY (nunca en el código).

const { configured, rest } = require("./_supabase");
const { avisar } = require("./_n8n");

const ANGULOS = ["ugc", "negocio", "marca-personal", "por-definir"];
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const txt = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : null) || null;

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  let data = req.body;
  if (typeof data === "string") { try { data = JSON.parse(data); } catch (e) { return res.status(400).end(); } }
  if (!data || typeof data !== "object") return res.status(400).end();

  // Por ahora solo se guardan leads; los clics del embudo se ignoran.
  if (data.event !== "lead") return res.status(204).end();

  const email = (txt(data.email, 200) || "").toLowerCase();
  const lead = {
    nombre: txt(data.nombre, 120),
    email,
    whatsapp: txt(data.whatsapp, 30),
    angulo: data.angulo,
    indeciso: data.indeciso === true,
    bloqueo: txt(data.bloqueo, 200),
    objetivo: txt(data.objetivo, 200),
    situacion: txt(data.situacion, 200),
    pagina: txt(data.page, 200),
    consentimiento: data.consentimiento === true
  };
  UTM.forEach(k => { lead[k] = txt(data[k], 200); });

  if (!lead.nombre || !/^\S+@\S+\.\S+$/.test(email) || !lead.whatsapp || !ANGULOS.includes(lead.angulo) || !lead.consentimiento) {
    return res.status(422).end();
  }
  if (!configured()) return res.status(503).end();

  const completo = Object.assign({}, lead, {
    consentimiento_at: txt(data.consentimiento_at, 40) || new Date().toISOString(),
    politica_version: txt(data.politica_version, 40),
    actualizado_at: new Date().toISOString()
  });

  try {
    await rest("leads?on_conflict=email", { method: "POST", body: completo, prefer: "resolution=merge-duplicates,return=minimal" });
    await avisar(lead.indeciso ? "lead_indeciso" : "lead_nuevo", {
      nombre: lead.nombre, email, whatsapp: lead.whatsapp, angulo: lead.angulo, bloqueo: lead.bloqueo,
      objetivo: lead.objetivo, situacion: lead.situacion,
      utm_source: lead.utm_source, utm_medium: lead.utm_medium, utm_campaign: lead.utm_campaign, utm_content: lead.utm_content, utm_term: lead.utm_term
    });
    return res.status(201).end();
  } catch (e) {
    // Si aún no se corrió el SQL 002 (sin índice único ni columnas nuevas), se guarda igual como fila nueva.
    console.error("lead upsert", e.message);
    try {
      await rest("leads", { method: "POST", body: lead, prefer: "return=minimal" });
      await avisar(lead.indeciso ? "lead_indeciso" : "lead_nuevo", {
        nombre: lead.nombre, email, whatsapp: lead.whatsapp, angulo: lead.angulo, bloqueo: lead.bloqueo,
        objetivo: lead.objetivo, situacion: lead.situacion,
      utm_source: lead.utm_source, utm_medium: lead.utm_medium, utm_campaign: lead.utm_campaign, utm_content: lead.utm_content, utm_term: lead.utm_term
      });
      return res.status(201).end();
    } catch (e2) {
      console.error("lead insert", e2.message);
      return res.status(502).end();
    }
  }
};
