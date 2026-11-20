/* Motor del Asistente de ideas: combina la base de conocimiento con los datos de la alumna.
   Funciona igual en el navegador (window.ASIS_MOTOR) y en Node (pruebas). */
(function (root) {
  const D = root.ASIS_DATOS || (typeof require !== "undefined" ? require("./asistente-datos.js") : null);
  const FORMATOS = [["historias", "Historias"], ["reel", "Reel"], ["carrusel", "Carrusel"], ["tiktok", "TikTok"], ["video_largo", "Video largo o blog"]];

  // Aleatorio reproducible: misma semilla, mismo resultado.
  function azar(seed) {
    let a = seed >>> 0;
    return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const elegir = (arr, r) => arr[Math.floor(r() * arr.length)];
  function barajar(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function mayuscula(s) { return s.replace(/^(\s*[«¿¡"]?)(\p{Ll})/u, (m, p, c) => p + c.toUpperCase()); }
  function rellenar(t, f) {
    const out = t.replace(/\{(\w+)\}/g, (m, k) => (f[k] !== undefined ? f[k] : m));
    return mayuscula(out).replace(/\b([Dd]e|[Aa]) el\b/g, (m, p) => (/^d/i.test(p) ? p[0] + "el" : p[0] + "l")).replace(/\s+([.,])/g, "$1").replace(/\.\./g, ".").replace(/\?\./g, "?");
  }

  // "tus tortas" -> "mis tortas": en los ganchos habla la creadora.
  function primeraPersona(p) {
    return p.replace(/^tus /, "mis ").replace(/^tu /, "mi ").replace(/lo que ofreces/, "lo que ofrezco").replace(/lo que sabes/, "lo que sé").replace(/los inmuebles que ofreces/, "los inmuebles que ofrezco");
  }

  function buscarNicho(camino, id, texto) {
    if (id === "propio" || !id) return D.nichoPropio(camino, texto);
    return (D.NICHOS[camino] || []).find(n => n.id === id) || D.nichoPropio(camino, texto);
  }

  // Fichas para una opción: se eligen una vez para que gancho y desarrollo hablen de lo mismo.
  function fichas(n, r, idea) {
    return {
      tema: n.tema, producto: n.producto, mi_producto: primeraPersona(n.producto), situacion: n.situacion,
      momento: elegir(n.momentos, r), dolor: elegir(n.dolores, r), deseo: elegir(n.deseos, r),
      error: elegir(n.errores, r), mito: elegir(n.mitos, r), tip: elegir(n.tips, r), pregunta: elegir(n.preguntas, r),
      idea: idea || ""
    };
  }

  function elegirAngulos(objetivo, r, cuantos) {
    const conPeso = D.ANGULOS.map(a => ({ a, p: (a.objetivos.includes(objetivo) ? 2 : 0) + r() * 2.2 }));
    conPeso.sort((x, y) => y.p - x.p);
    const elegidos = [];
    const maxTendencia = objetivo === "alcance" || objetivo === "comunidad" ? 1 : 0;
    let tendencias = 0;
    for (const { a } of conPeso) {
      if (a.tipo === "30" && tendencias >= maxTendencia) continue;
      if (a.tipo === "30") tendencias++;
      elegidos.push(a);
      if (elegidos.length === cuantos) break;
    }
    return elegidos;
  }

  /* Genera 3 ángulos en los 5 formatos. */
  function generar({ camino, nichoId, nichoTexto, objetivo = "confianza", idea = "", seed = Date.now() }) {
    const r = azar(seed);
    const n = buscarNicho(camino, nichoId, nichoTexto);
    const ideaLimpia = String(idea || "").trim().replace(/\s+/g, " ").slice(0, 300);
    const opciones = elegirAngulos(objetivo, r, 3).map(a => {
      const f = fichas(n, r, ideaLimpia);
      const formatos = {};
      for (const [k] of FORMATOS) {
        const p = a[k];
        formatos[k] = { gancho: rellenar(elegir(p.g, r), f), desarrollo: rellenar(p.d, f), cierre: elegir(D.CIERRES[camino][k], r) };
      }
      return {
        angulo: a.nombre, tipo: a.tipo, por_que: a.por[camino],
        idea: ideaLimpia ? `Cuenta «${ideaLimpia}» desde este ángulo: ${a.nombre.toLowerCase()}.` : "",
        formatos
      };
    });
    return { opciones, nicho: n.nombre, estrategia: D.ESTRATEGIA[camino], ajuste: D.AJUSTE_OBJETIVO[objetivo] };
  }

  /* Banco de ganchos: 3 por tipo, rellenados con el nicho. */
  function ganchos({ camino, nichoId, nichoTexto, seed = Date.now() }) {
    const r = azar(seed);
    const n = buscarNicho(camino, nichoId, nichoTexto);
    return Object.entries(D.GANCHOS).map(([id, g]) => ({
      id, nombre: g.nombre, uso: g.uso,
      lista: barajar(g.f, r).slice(0, 3).map(t => rellenar(t, fichas(n, r)))
    }));
  }

  /* Prompts personalizados para su IA. */
  function prompts({ camino, nichoId, nichoTexto, objetivo = "confianza", idea = "" }) {
    const n = buscarNicho(camino, nichoId, nichoTexto);
    const f = {
      camino: D.CAMINOS[camino], nicho: n.nombre, producto: n.producto, mi_producto: primeraPersona(n.producto), tema: n.tema, situacion: n.situacion,
      dolor: n.dolores[0], deseo: n.deseos[0], objetivo: D.OBJETIVOS[objetivo].toLowerCase(),
      idea: (String(idea || "").trim() || "[escribe aquí tu idea]")
    };
    const contexto = D.CONTEXTO_PROMPT.replace(/\{(\w+)\}/g, (m, k) => (f[k] !== undefined ? f[k] : m));
    return D.PROMPTS.filter(p => !p.caminos || p.caminos.includes(camino)).map(p => ({
      id: p.id, grupo: p.grupo, titulo: p.titulo, para: p.para,
      texto: p.texto.replace("{CONTEXTO}", contexto).replace(/\{(\w+)\}/g, (m, k) => (f[k] !== undefined ? f[k] : m))
    }));
  }

  /* Calendario de 7 días: 5 piezas permanentes y 2 de tendencia, rotando formatos. */
  function calendario({ camino, nichoId, nichoTexto, objetivo = "confianza", seed = Date.now() }) {
    const r = azar(seed);
    const n = buscarNicho(camino, nichoId, nichoTexto);
    const permanentes = barajar(D.ANGULOS.filter(a => a.tipo === "70"), r);
    const tendencias = barajar(D.ANGULOS.filter(a => a.tipo === "30"), r);
    const plan = [["Lunes", "70", "reel"], ["Martes", "70", "carrusel"], ["Miércoles", "30", "tiktok"], ["Jueves", "70", "reel"], ["Viernes", "70", "historias"], ["Sábado", "30", "reel"], ["Domingo", "70", "video_largo"]];
    let ip = 0, it = 0;
    return plan.map(([dia, tipo, formato]) => {
      const a = tipo === "70" ? permanentes[ip++ % permanentes.length] : tendencias[it++ % tendencias.length];
      const fi = fichas(n, r);
      return { dia, tipo, formato: FORMATOS.find(x => x[0] === formato)[1], angulo: a.nombre, gancho: rellenar(elegir(a[formato].g, r), fi), cierre: elegir(D.CIERRES[camino][formato], r) };
    });
  }

  const motor = { FORMATOS, generar, ganchos, prompts, calendario, buscarNicho };
  if (typeof module !== "undefined" && module.exports) module.exports = motor;
  else root.ASIS_MOTOR = motor;
})(typeof window !== "undefined" ? window : globalThis);
