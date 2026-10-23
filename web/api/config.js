// Estado del lanzamiento. La web lo consulta para saber si muestra la compra.
// Las fechas son reservadas (campaña de expectativa): NO van en el código ni en la respuesta mientras el carrito no esté abierto.
// Variables de entorno (Vercel), con los valores del calendario que está en el vault (no en esta repo pública):
//   APERTURA_ISO        fecha y hora de apertura del carrito, ISO con zona (-05:00). Sin ella la página queda en espera.
//   CIERRE_ISO          opcional, fecha y hora de cierre (inicio de la clase).
//   CHECKOUT_URL        link de pago de Whop (plan activo).
//   FECHA_CLASE_TEXTO   texto que se muestra con el carrito abierto, ej. "Sábado 00 de mes · 7:00 p. m. (COL)".
//   CIERRE_TEXTO        texto del cierre de inscripciones, ej. "el sábado 00 de mes, al empezar la clase".
//   ESTADO_LANZAMIENTO  opcional: espera | abierto | cerrado (fuerza el estado a mano).

module.exports = (req, res) => {
  const apertura = process.env.APERTURA_ISO ? Date.parse(process.env.APERTURA_ISO) : NaN;
  const cierre = process.env.CIERRE_ISO ? Date.parse(process.env.CIERRE_ISO) : NaN;
  const ahora = Date.now();

  let estado = (process.env.ESTADO_LANZAMIENTO || "").trim().toLowerCase();
  if (!["espera", "abierto", "cerrado"].includes(estado)) {
    if (isNaN(apertura) || ahora < apertura) estado = "espera";
    else if (!isNaN(cierre) && ahora >= cierre) estado = "cerrado";
    else estado = "abierto";
  }
  // Sin link configurado no hay compra posible, aunque la fecha ya haya llegado.
  if (estado === "abierto" && !process.env.CHECKOUT_URL) estado = "espera";

  const out = { estado };
  if (estado === "abierto") {
    out.checkoutUrl = process.env.CHECKOUT_URL;
    out.fechaClase = process.env.FECHA_CLASE_TEXTO || null;
    out.cierreTexto = process.env.CIERRE_TEXTO || null;
  }
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=60");
  res.status(200).json(out);
};
