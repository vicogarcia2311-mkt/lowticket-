// Estado del lanzamiento. La web lo consulta para saber si muestra la compra.
// El link de pago solo se entrega cuando el estado es "abierto"; nunca vive en el código público.
// Variables de entorno (Vercel):
//   ESTADO_LANZAMIENTO  espera | abierto | cerrado   (opcional: fuerza el estado a mano)
//   APERTURA_ISO        por defecto 2026-11-20T12:00:00-05:00 (viernes 20 nov, mediodía Colombia)
//   CIERRE_ISO          opcional, ej. 2026-11-28T19:00:00-05:00 (inicio de la clase)
//   CHECKOUT_URL        link de pago de Whop (plan activo)

const APERTURA_DEF = "2026-11-20T12:00:00-05:00";

module.exports = (req, res) => {
  const apertura = process.env.APERTURA_ISO || APERTURA_DEF;
  const cierre = process.env.CIERRE_ISO || null;
  const ahora = Date.now();

  let estado = (process.env.ESTADO_LANZAMIENTO || "").trim().toLowerCase();
  if (!["espera", "abierto", "cerrado"].includes(estado)) {
    if (ahora < Date.parse(apertura)) estado = "espera";
    else if (cierre && ahora >= Date.parse(cierre)) estado = "cerrado";
    else estado = "abierto";
  }
  // Sin link configurado no hay compra posible, aunque la fecha ya haya llegado.
  const checkoutUrl = estado === "abierto" ? (process.env.CHECKOUT_URL || null) : null;
  if (estado === "abierto" && !checkoutUrl) estado = "espera";

  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=60");
  res.status(200).json({ estado, apertura, cierre, checkoutUrl });
};
