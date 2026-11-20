// Bono 3 · Asistente de ideas: verifica que el correo sea de una compradora del workshop.
// El asistente funciona en el navegador (assets/asistente-*.js); esta función solo da acceso y registra el ingreso.
//
// Variables de entorno (Vercel):
//   SUPABASE_URL, SUPABASE_SECRET_KEY  (ya existen).
//   ASISTENTE_ABRE_ISO   opcional, fecha y hora en que se activa (ej. 2026-11-28T20:00:00-05:00). Sin ella, activo.
//   ASISTENTE_PRUEBA     opcional, correos separados por coma que entran sin compra (equipo).

const { configured, rest } = require("./_supabase");

const limpiarEmail = e => String(e || "").trim().toLowerCase();

async function esCompradora(email) {
  const equipo = (process.env.ASISTENTE_PRUEBA || "").split(",").map(limpiarEmail).filter(Boolean);
  if (equipo.includes(email)) return true;
  const patron = email.replace(/[\\%_]/g, m => "\\" + m); // ilike sin comodines: correo exacto sin importar mayúsculas
  const filas = await rest(`ventas?email=ilike.${encodeURIComponent(patron)}&estado=eq.aprobada&select=id&limit=1`);
  return filas.length > 0;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  res.setHeader("Cache-Control", "no-store");

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const email = limpiarEmail((body || {}).email);
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Escribe el correo con el que compraste." });

  const abre = process.env.ASISTENTE_ABRE_ISO ? Date.parse(process.env.ASISTENTE_ABRE_ISO) : NaN;
  if (!isNaN(abre) && Date.now() < abre) return res.status(403).json({ error: "El asistente se activa después de la clase en vivo." });
  if (!configured()) return res.status(503).json({ error: "El asistente todavía no está disponible." });

  try {
    if (!(await esCompradora(email))) {
      return res.status(403).json({ error: "No encontramos una compra con ese correo. Usa el mismo correo con el que pagaste en Whop o escríbenos por WhatsApp." });
    }
  } catch (e) {
    console.error("asistente: supabase", e.message);
    return res.status(502).json({ error: "No pudimos verificar tu acceso. Intenta de nuevo en un momento." });
  }

  // Registro de ingreso (para medir uso del bono). Si falla, igual se da acceso.
  try { await rest("asistente_uso", { method: "POST", body: { email, idea: "ingreso" }, prefer: "return=minimal" }); }
  catch (e) { console.error("asistente: registrar ingreso", e.message); }

  return res.status(200).json({ ok: true });
};
