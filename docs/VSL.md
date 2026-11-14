# Funnel VSL — DocuSelling
Rutas: /vsl, /vsl/registro, /vsl/aplicar, /vsl/gracias, /vsl/recibido. /VSL redirige a /vsl. Diseño y JS independientes de Camino.
## Activación
Por defecto es demostración: formulario real deshabilitado, no guarda datos ni emite Lead o Schedule. Solo PageView/ViewContent si se acepta publicidad.
1. Aplicar supabase/006_vsl_applications.sql en el proyecto existente. No modifica tablas de Camino.
2. Definir oferta, preguntas definitivas y criterio de calificación. Modificar OPTIONS (servidor) y questions (navegador) en conjunto.
3. Variables Vercel producción: VSL_VIDEO_URL (https, MP4 o URL embed), VSL_CALENDAR_URL (https embed), VSL_FILTER_URL (https), VSL_FILTER_SECRET (sensible), VSL_BOOKING_SECRET (sensible). El filtro recibe {applicationId,answers}, autorizado con Bearer, y devuelve {qualified:boolean}. Si falla, queda pending sin agenda.
4. Integrar proveedor de calendario: conservar referencia opaca utm_content que se adjunta al embed; si el proveedor no la conserva, adaptar integración antes de activar. Verificar firma/evento real del proveedor en el adaptador, luego POST /api/vsl con x-vsl-booking-secret y {action:"booking",token,bookingId}. Nunca exponer el secreto en frontend. Solo una aplicación calificada puede reservar y emitir Schedule. Este endpoint es un contrato para el adaptador, no una integración activa con Calendly u otro proveedor.
5. Revisar privacidad con asesoría legal y configurar video, agenda y filtro; poner VSL_LIVE=si en producción, redeploy. Probar registro, ruta calificada/no calificada, confirmación y Meta Test Events. Mantener las credenciales existentes META_PIXEL_ID/META_CAPI_ACCESS_TOKEN en Vercel.
## Medición
PageView/ViewContent navegador tras consentimiento; Lead navegador y servidor con mismo event_id después de persistencia; VSLApplicationSubmitted evento informativo; Schedule servidor tras reserva confirmada de un perfil calificado. En Meta crear conversión personalizada sobre Schedule con URL contiene /vsl/gracias para aislar este funnel. No optimizar por visita a gracias ni clic en calendario. No hay Purchase.
