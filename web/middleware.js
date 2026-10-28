// Web cerrada mientras dura la expectativa: el workshop (/ y /camino*) muestra "Muy pronto" y nadie llena el test.
// Siguen abiertas /prompts, /privacidad y /panel.
// Variables en Vercel:
//   WEB_ABIERTA       "si" para abrir el workshop. Sin ella queda cerrado.
//   WEB_CLAVE_EQUIPO  opcional: entrar con ?equipo=<clave> deja ver las páginas cerradas en ese navegador (cookie de 30 días).

export const config = {
  matcher: ["/", "/index", "/index.html", "/camino", "/camino.html", "/camino-:camino*"]
};

export default function middleware(request) {
  if ((process.env.WEB_ABIERTA || "").trim().toLowerCase() === "si") return;

  const url = new URL(request.url);
  const clave = process.env.WEB_CLAVE_EQUIPO || "";
  if (clave) {
    if (url.searchParams.get("equipo") === clave) {
      url.searchParams.delete("equipo");
      return new Response(null, { status: 302, headers: {
        Location: url.pathname + url.search,
        "Set-Cookie": `vm_equipo=${encodeURIComponent(clave)}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`
      } });
    }
    const cookie = request.headers.get("cookie") || "";
    if (cookie.split(/;\s*/).includes(`vm_equipo=${encodeURIComponent(clave)}`)) return;
  }
  return new Response(null, { status: 302, headers: { Location: "/pronto" + url.search, "Cache-Control": "no-store" } });
}
