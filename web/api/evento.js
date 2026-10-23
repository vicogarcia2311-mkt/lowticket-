// Registra los pasos del embudo (visita, test, formulario, clics) para medir cada UTM. No recibe datos personales.

const { configured, rest } = require("./_supabase");

const EVENTOS = ["visita", "test_inicio", "pregunta_1", "pregunta_2", "pregunta_3", "formulario", "lead", "grupo", "clic_compra", "clic_espera"];
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const txt = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : null) || null;

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  let d = req.body;
  if (typeof d === "string") { try { d = JSON.parse(d); } catch (e) { return res.status(400).end(); } }
  if (!d || !EVENTOS.includes(d.evento) || !txt(d.sesion, 64)) return res.status(422).end();
  if (!configured()) return res.status(204).end();

  const fila = {
    sesion: txt(d.sesion, 64),
    visitante: txt(d.visitante, 64),
    evento: d.evento,
    pagina: txt(d.pagina, 120),
    angulo: txt(d.angulo, 40),
    referrer: txt(d.referrer, 200),
    movil: d.movil === true
  };
  UTM.forEach(k => { fila[k] = txt(d[k], 120); });

  try {
    await rest("eventos", { method: "POST", body: fila, prefer: "return=minimal" });
  } catch (e) {
    console.error("evento", e.message); // si falta el SQL 003 no se rompe la página
  }
  return res.status(204).end();
};
