# Valentina García · Web del workshop

Workshop **"De una idea a infinitos contenidos"** (en vivo, 1 hora, USD 27).
Test de 3 preguntas → página del camino (Negocio, Marca personal o UGC) → compra.
Quien responde "No estoy segura" termina en el grupo de WhatsApp de asesoría.

Construido por ASYGNUZ. Todo corre en cuentas de Valentina (GitHub, Vercel, Supabase).

## Estructura

| Carpeta | Qué hay |
|---|---|
| `web/` | El sitio. Es la **Root Directory** del proyecto en Vercel |
| `web/assets/camino.js` | Lógica, textos de cada camino y los objetos `CONFIG` y `OFERTA` (datos por completar) |
| `web/assets/camino.css` | Estilos: Poppins, blanco, lila `#E6DEFF`, amarillo `#FFF393` |
| `web/api/` | Funciones de Vercel. `lead.js` guarda los leads en Supabase |
| `supabase/` | SQL de las tablas, en orden (`001_…`, `002_…`) |
| `n8n/` | Exportes de los flujos de automatización |
| `docs/` | Despliegue, variables de entorno y datos pendientes |

## Páginas

- `/` → redirige a `/camino` conservando las UTM
- `/camino` → entrada con el test
- `/camino-negocio`, `/camino-marca-personal`, `/camino-ugc`

## Estado

Borrador: aviso rosado visible y `noindex`. Antes de abrir ventas ver [docs/PUBLICAR.md](docs/PUBLICAR.md).
