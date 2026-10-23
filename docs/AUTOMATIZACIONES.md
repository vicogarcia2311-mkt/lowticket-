# Automatizaciones del lanzamiento

Calendario: pre-registro y expectativa → **apertura vie 20 nov, 12:00 m.** → carrito abierto → **clase sáb 28 nov** (YouTube) → entrega.
Fuente de datos: Supabase (`leads`, `ventas`). Motor: n8n. Canales: WhatsApp (API oficial de Meta, plantillas aprobadas) y correo.

## Flujos

| # | Disparador | A quién | Mensaje | Canal |
|---|---|---|---|---|
| 1 | Nuevo lead (fila en `leads`) | El lead | "Ya estás en la lista. Tu camino es {camino}. Abrimos el 20 nov a las 12:00 m. con precio de lanzamiento USD 27." | WhatsApp + correo |
| 2 | Nuevo lead con `indeciso = true` | Equipo (Karen) | Aviso para atenderla en el grupo, con sus respuestas | WhatsApp interno |
| 3 | Programado: días de expectativa | Toda la lista | Contenido de calentamiento (1 por día, por definir) | WhatsApp |
| 4 | Vie 20 nov 12:00 | Lista, segmentada por camino | "Ya abrimos" + link directo a su página de camino (`utm_source=lista&utm_medium=whatsapp&utm_campaign=apertura`) | WhatsApp + correo |
| 5 | Carrito abierto, sin compra | Leads sin venta | Recordatorios: día 2, 48 h antes del cierre y última llamada el 28 nov | WhatsApp |
| 6 | Nueva venta (`ventas.estado = aprobada`) | Compradora | Confirmación, acceso en Whop, PDF y fecha del vivo | WhatsApp + correo |
| 7 | 28 nov: 24 h y 1 h antes | Compradoras | Recordatorio con el link del directo (no listado) | WhatsApp + correo |
| 8 | Después del vivo | Compradoras | Grabación, bonos en [X] días y pedido de testimonio | WhatsApp + correo |
| 9 | Diario | Juan y Valen | Resumen: leads nuevos por camino, ventas, ingresos | WhatsApp / correo |

Reglas: no escribir a quien no dio consentimiento; quien compra sale de los recordatorios de venta; WhatsApp fuera de la ventana de 24 h solo con plantilla aprobada.

## Lo que hace falta para construirlo

- **n8n**: instancia y acceso (en cuenta de Valen o de ASYGNUZ, por decidir). Clave de API de n8n guardada fuera del chat.
- **WhatsApp Cloud API**: Business Manager de Valen verificado, número dedicado (o coexistencia con el WhatsApp Business actual), y plantillas aprobadas por Meta para los flujos 1, 4, 5, 6, 7 y 8. La aprobación puede tardar; enviar las plantillas con tiempo.
- **Correo**: buzón y dominio de envío (Workspace o un servicio de envío) con SPF, DKIM y DMARC en `valentinamkt.online`.
- **Supabase → n8n**: webhook de base de datos en `leads` y `ventas` (insert/update) hacia n8n, o n8n consultando Supabase cada pocos minutos.
