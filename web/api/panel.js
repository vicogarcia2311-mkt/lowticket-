// Datos del panel /panel: resumen, embudo por UTM, caminos, leads y ventas, filtrados por fechas.
// Protegido con PANEL_CLAVE (Vercel) en el encabezado x-panel-clave. Incluye datos personales: compartir la clave solo con el equipo.
// Requiere supabase/003 y 004.

const crypto = require("crypto");
const { configured, rest } = require("./_supabase");

const igual = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const fecha = (v, def) => { const t = Date.parse(v || ""); return isNaN(t) ? def : new Date(t).toISOString(); };

module.exports = async (req, res) => {
  const clave = process.env.PANEL_CLAVE || "";
  if (!clave || !igual(String(req.headers["x-panel-clave"] || ""), clave)) return res.status(401).json({ error: "clave" });
  if (!configured()) return res.status(503).json({ error: "supabase" });

  const q = req.query || {};
  const desde = fecha(q.desde, "2020-01-01T00:00:00Z");
  const hasta = fecha(q.hasta, new Date(Date.now() + 864e5).toISOString());
  const rango = `created_at=gte.${encodeURIComponent(desde)}&created_at=lte.${encodeURIComponent(hasta)}`;

  try {
    const [datos, leads, ventas] = await Promise.all([
      rest("rpc/panel_datos", { method: "POST", body: { desde, hasta } }),
      rest(`leads?select=id,created_at,nombre,email,whatsapp,angulo,indeciso,bloqueo,objetivo,situacion,utm_source,utm_medium,utm_campaign,utm_content&${rango}&order=created_at.desc&limit=1000`),
      rest(`ventas?select=id,created_at,transaccion_id,email,producto,monto,moneda,estado,angulo,lead_id&${rango}&order=created_at.desc&limit=1000`)
    ]);
    const compraron = new Set((ventas || []).filter(v => v.estado === "aprobada").map(v => v.lead_id));
    (leads || []).forEach(l => { l.compro = compraron.has(l.id); });

    // Une embudo y ventas por UTM en una sola tabla
    const k = r => [r.fuente, r.medio, r.campana, r.pieza].join("|");
    const filas = new Map();
    (datos.embudo || []).forEach(r => filas.set(k(r), Object.assign({ ventas: 0, ingresos: 0 }, r)));
    (datos.ventas_utm || []).forEach(r => {
      const f = filas.get(k(r)) || { fuente: r.fuente, medio: r.medio, campana: r.campana, pieza: r.pieza, visitas: 0, test_iniciado: 0, llegaron_al_formulario: 0, leads: 0, clic_compra: 0 };
      f.ventas = Number(r.ventas) || 0; f.ingresos = Number(r.ingresos) || 0;
      filas.set(k(r), f);
    });

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      actualizado: new Date().toISOString(), desde, hasta,
      totales: datos.totales, por_camino: datos.por_camino, diario: datos.diario,
      embudo: [...filas.values()].sort((a, b) => (b.visitas || 0) - (a.visitas || 0)),
      leads: leads || [], ventas: ventas || []
    });
  } catch (e) {
    console.error("panel", e.message);
    return res.status(502).json({ error: "consulta", detalle: /panel_datos|eventos/.test(e.message) ? "falta el SQL 003 o 004" : "" });
  }
};
