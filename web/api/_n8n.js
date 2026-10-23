// Aviso de eventos al n8n de ASYGNUZ (flujo "Valen - Eventos del lanzamiento").
// Variables de entorno: N8N_EVENTOS_URL (webhook) y N8N_EVENTOS_SECRET (encabezado x-asygnuz-secret).
// No bloquea ni hace fallar la respuesta: si n8n no contesta en 2,5 s, el evento queda solo en Supabase.

async function avisar(tipo, datos) {
  const url = process.env.N8N_EVENTOS_URL, secret = process.env.N8N_EVENTOS_SECRET;
  if (!url || !secret) return false;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 2500);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-asygnuz-secret": secret },
      body: JSON.stringify({ tipo, origen: "valentinamkt.online", ts: new Date().toISOString(), datos }),
      signal: ctrl.signal
    });
    return r.ok;
  } catch (e) {
    console.error("n8n", tipo, e.message);
    return false;
  } finally {
    clearTimeout(t);
  }
}

module.exports = { avisar };
