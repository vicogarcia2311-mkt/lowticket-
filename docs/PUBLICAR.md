# Despliegue y publicación

## 1. Vercel (una sola vez)

1. Vercel → **Add New → Project** → importar `vicogarcia2311-mkt/lowticket-`.
2. **Root Directory:** `web` · **Framework Preset:** Other · sin Build Command.
3. Deploy. Desde ahí cada push a `main` publica solo; cada rama crea una vista previa con su propio link.

## 2. Variables de entorno

Vercel → proyecto → **Settings → Environment Variables**. Marcar *Production* y *Preview*, guardar y hacer **Redeploy**.

| Nombre | Valor | Sensitive |
|---|---|---|
| `SUPABASE_URL` | `https://gfbeaflsttyegmnkmaox.supabase.co` | No |
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys → *Secret key* (`sb_secret_…`) o la legacy `service_role` | **Sí** |
| `WHOP_WEBHOOK_SECRET` | El `webhook_secret` del webhook de ventas de Whop (guardado en el llavero de JM como `whop-valen-webhook`) | **Sí** |

Las claves nunca van en el código: esta repo es pública. Si una clave se expone, regenerarla en Supabase y actualizarla aquí.

## 3. Supabase (una sola vez)

Correr `supabase/001_tablas.sql` en **SQL Editor**. Las tablas tienen RLS activo y sin políticas públicas: solo las funciones de Vercel escriben.

Regla ASYGNUZ: los agentes de IA no leen los datos de clientes. Las pruebas se hacen con datos falsos (`@example.test`) y se borran.

## 4. Antes de abrir ventas

En `web/assets/camino.js`:

- [x] El link de pago ya no está en el código: lo entrega `/api/config` solo con el carrito abierto (ver sección 6).
- [ ] `CONFIG.whatsappGrupo` → link del grupo de asesoría
- [ ] `CONFIG.metaPixelId` → pixel de Meta (opcional)
- [ ] `OFERTA.fecha`, `OFERTA.cierre`, `OFERTA.plazas`, `OFERTA.diasBonos`, `OFERTA.garantia`
- [ ] Confirmar `OFERTA.valores` de los bonos (propuesta: 17 / 9 / 15)
- [ ] `TESTIMONIOS` → capturas reales con autorización (si queda vacío, la sección no aparece)

En las páginas:

- [ ] Política de tratamiento de datos (Ley 1581) publicada y enlazada en el formulario y el pie
- [ ] Quitar el aviso rosado (`draft-banner`) y `<meta name="robots" content="noindex">` de los 4 HTML
- [ ] Quitar el header `X-Robots-Tag: noindex` de `web/vercel.json`
- [ ] Conectar el dominio en Vercel → Settings → Domains
- [ ] Cambiar `og:image` por la URL completa con dominio

## 5. Webhook de ventas (Whop → Supabase)

- Endpoint: `https://valentinamkt.online/api/venta` (`web/api/venta.js`).
- Eventos: `payment.succeeded` → venta `aprobada` (cruzada con el lead por correo, toma su `angulo`); `refund.created` → `reembolsada`; `dispute.created` → `contracargo`.
- Firma verificada (HMAC-SHA256, encabezados `webhook-id`, `webhook-timestamp`, `webhook-signature`); sin `WHOP_WEBHOOK_SECRET` responde 503.

## 6. Modo espera y apertura

Las fechas son reservadas (campaña de expectativa): viven en el vault y en las variables de Vercel, nunca en esta repo pública.

`/api/config` decide el estado: `espera` antes de la apertura, `abierto` después, `cerrado` desde `CIERRE_ISO`. En espera la página muestra el precio y "Ya estás en la lista", sin fechas ni botón de compra.

Variables en Vercel:

| Nombre | Valor |
|---|---|
| `APERTURA_ISO` | fecha y hora de apertura, ISO con zona `-05:00`. Sin ella la página queda en espera |
| `CIERRE_ISO` | fecha y hora de cierre (inicio de la clase) |
| `FECHA_CLASE_TEXTO` | fecha de la clase en texto; solo se muestra con el carrito abierto |
| `CIERRE_TEXTO` | texto del cierre de inscripciones; solo se muestra con el carrito abierto |
| `CHECKOUT_URL` | link de pago de Whop del plan activo |
| `ESTADO_LANZAMIENTO` | opcional, fuerza `espera`, `abierto` o `cerrado` |

Antes de la apertura: reactivar el plan en Whop (hoy archivado para que nadie compre antes) o crear uno nuevo, y poner su link en `CHECKOUT_URL`. Sin `CHECKOUT_URL` la página sigue en espera aunque llegue la fecha.

## 7. Supabase: 002
Correr `supabase/002_leads_unicos_consentimiento.sql`: un lead por correo (se actualiza si repite el test) y evidencia del consentimiento (fecha y versión de la política). Mientras no se corra, los leads se siguen guardando como filas nuevas.

## 8. n8n (instancia de ASYGNUZ)

- Flujo: "Valen - Eventos del lanzamiento" (id `D5iFVPYWPiZ8Vo73`), activo. Recibe `lead_nuevo`, `lead_indeciso`, `venta_aprobada`, `reembolso` y `contracargo`, y arma el mensaje. El envío por WhatsApp y correo se conecta cuando estén los canales.
- Variables en Vercel: `N8N_EVENTOS_URL` = `https://35-231-56-44.sslip.io/webhook/valen-eventos` y `N8N_EVENTOS_SECRET` (llavero de JM: `n8n-valen-eventos`). Sin ellas, los eventos quedan solo en Supabase.

## 9. Embudo por UTM y panel

- Correr `supabase/003_eventos_embudo_utm.sql` (tabla `eventos` y vistas `embudo_utm` y `ventas_utm`, sin datos personales).
- La web registra: visita, test iniciado, cada pregunta, formulario, lead, clic al grupo, clic de compra y clic en espera, cada uno con sus 5 UTM.
- Correr también `supabase/004_panel.sql` (función `panel_datos` con filtro de fechas).
- Panel: `https://valentinamkt.online/panel.html`, protegido con `PANEL_CLAVE` en Vercel. Tiene datos personales (nombres, correos, WhatsApp): la clave solo para JM, Valen y Karen.
- Pestañas: Resumen (indicadores, gráfico por día, por camino, top piezas), Embudo por UTM, Leads (filtros, botón de WhatsApp, CSV) y Ventas.
