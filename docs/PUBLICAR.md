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

Las claves nunca van en el código: esta repo es pública. Si una clave se expone, regenerarla en Supabase y actualizarla aquí.

## 3. Supabase (una sola vez)

Correr `supabase/001_tablas.sql` en **SQL Editor**. Las tablas tienen RLS activo y sin políticas públicas: solo las funciones de Vercel escriben.

Regla ASYGNUZ: los agentes de IA no leen los datos de clientes. Las pruebas se hacen con datos falsos (`@example.test`) y se borran.

## 4. Antes de abrir ventas

En `web/assets/camino.js`:

- [ ] `CONFIG.checkoutWorkshop` → link de checkout (Whop u Hotmart)
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
