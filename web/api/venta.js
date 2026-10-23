// Webhook de Whop → tabla ventas en Supabase.
// Eventos: payment.succeeded (venta aprobada), refund.created (reembolso), dispute.created (contracargo).
// Variables de entorno: WHOP_WEBHOOK_SECRET (el webhook_secret que entrega Whop), SUPABASE_URL, SUPABASE_SECRET_KEY.
// Firma estilo Standard Webhooks: HMAC-SHA256 de "{webhook-id}.{webhook-timestamp}.{cuerpo crudo}", base64, encabezado "v1,<firma>".

const crypto = require("crypto");
const { configured, rest } = require("./_supabase");

const TOLERANCIA_S = 5 * 60;

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// Whop documenta el secreto como "ws_…"; Standard Webhooks usa "whsec_<base64>". Se aceptan ambas formas de clave.
function claves(secret) {
  const out = [Buffer.from(secret, "utf8")];
  const m = secret.match(/^whsec_(.+)$/);
  if (m) out.push(Buffer.from(m[1], "base64"));
  return out;
}

function firmaValida(secret, id, ts, body, header) {
  if (!id || !ts || !header) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > TOLERANCIA_S) return false;
  const firmas = header.split(" ").map(p => p.split(",")[1]).filter(Boolean);
  return claves(secret).some(k => {
    const esperada = crypto.createHmac("sha256", k).update(`${id}.${ts}.${body}`).digest("base64");
    return firmas.some(f => f.length === esperada.length && crypto.timingSafeEqual(Buffer.from(f), Buffer.from(esperada)));
  });
}

async function leadPorEmail(email) {
  if (!email) return null;
  const q = `leads?select=id,angulo&email=ilike.${encodeURIComponent(email)}&order=created_at.desc&limit=1`;
  const rows = await rest(q);
  return rows && rows[0] ? rows[0] : null;
}

async function marcar(paymentId, estado) {
  if (!paymentId) return;
  await rest(`ventas?transaccion_id=eq.${encodeURIComponent(paymentId)}`, { method: "PATCH", body: { estado }, prefer: "return=minimal" });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret || !configured()) return res.status(503).end();

  const body = await rawBody(req);
  const h = req.headers;
  if (!firmaValida(secret, h["webhook-id"], h["webhook-timestamp"], body, h["webhook-signature"])) {
    return res.status(401).end();
  }

  let evento;
  try { evento = JSON.parse(body); } catch (e) { return res.status(400).end(); }
  const d = evento.data || {};

  try {
    if (evento.type === "payment.succeeded") {
      const email = d.user && d.user.email ? String(d.user.email).toLowerCase() : null;
      const lead = await leadPorEmail(email);
      await rest("ventas?on_conflict=transaccion_id", {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=minimal",
        body: {
          plataforma: "whop",
          transaccion_id: d.id,
          email,
          producto: (d.product && (d.product.title || d.product.id)) || null,
          monto: typeof d.total === "number" ? d.total : null,
          moneda: d.currency ? String(d.currency).toUpperCase() : "USD",
          estado: "aprobada",
          angulo: lead ? lead.angulo : null,
          lead_id: lead ? lead.id : null,
          raw: evento
        }
      });
    } else if (evento.type === "refund.created") {
      await marcar((d.payment && d.payment.id) || d.payment_id, "reembolsada");
    } else if (evento.type === "dispute.created") {
      await marcar((d.payment && d.payment.id) || d.payment_id, "contracargo");
    }
    // Otros eventos se aceptan y se ignoran para que Whop no los reintente.
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("venta", evento.type, e.message);
    return res.status(500).end(); // Whop reintenta
  }
};
