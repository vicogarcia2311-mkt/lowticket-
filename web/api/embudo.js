// Datos del panel /panel.html: embudo y ventas por UTM, sin datos personales.
// Protegido con la clave PANEL_CLAVE (variable de entorno en Vercel), enviada en el encabezado x-panel-clave.

const crypto = require("crypto");
const { configured, rest } = require("./_supabase");

const igual = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

module.exports = async (req, res) => {
  const clave = process.env.PANEL_CLAVE || "";
  const enviada = String(req.headers["x-panel-clave"] || "");
  if (!clave || !igual(enviada, clave)) return res.status(401).json({ error: "clave" });
  if (!configured()) return res.status(503).json({ error: "supabase" });

  try {
    const [embudo, ventas] = await Promise.all([rest("embudo_utm?select=*"), rest("ventas_utm?select=*")]);
    const clave4 = r => [r.fuente, r.medio, r.campana, r.pieza].join("|");
    const filas = new Map();
    (embudo || []).forEach(r => filas.set(clave4(r), Object.assign({ ventas: 0, ingresos: 0 }, r)));
    (ventas || []).forEach(r => {
      const k = clave4(r);
      const f = filas.get(k) || { fuente: r.fuente, medio: r.medio, campana: r.campana, pieza: r.pieza, visitas: 0, test_iniciado: 0, llegaron_al_formulario: 0, leads: 0, clic_compra: 0 };
      f.ventas = Number(r.ventas) || 0; f.ingresos = Number(r.ingresos) || 0;
      filas.set(k, f);
    });
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ actualizado: new Date().toISOString(), filas: [...filas.values()].sort((a, b) => (b.visitas || 0) - (a.visitas || 0)) });
  } catch (e) {
    console.error("embudo", e.message);
    return res.status(502).json({ error: "consulta" });
  }
};
