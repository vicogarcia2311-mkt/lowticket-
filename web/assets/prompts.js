/* /prompts — 3 prompts DocuSelling con la fórmula 7-7-5, a cambio de nombre y correo.
   El lead queda marcado con el producto "prompts" (web/api/lead.js → supabase/005_productos.sql).
   Fuente de los textos: vault valentina-mrkt/03-entregables/PROMPTS-FORMULA-7-7-5.md */

const PROMPTS = {
  "negocio": { nombre: "Negocio", para: "Para mostrar tu negocio sin miedo.", texto: "Actúa como guionista de contenido DocuSelling: videos cortos que venden contando una historia real, sin sonar a anuncio.\n\nEscríbeme UN guion para un reel de 45 a 60 segundos con la fórmula 7-7-5:\n- 7 líneas sobre el COLAPSO: el momento en que mi negocio se cayó, se estancó o casi lo cierro.\n- 7 líneas sobre la LUCHA: lo que intenté, el miedo que sentí, el día que me tocó pedir ayuda.\n- 5 líneas sobre el RESULTADO: lo que reconstruí con lo que aprendí y cómo está hoy mi negocio.\n\nUsa la metáfora \"la vida cabe en una maleta\": qué fue lo esencial que me llevé de esa caída y qué dejé atrás.\nCierra con 2 o 3 preguntas \"¿Qué pasaría si…?\" que inviten a quien me ve a grabar su negocio, mostrar su proceso y dejar de esconderse.\n\nMis datos:\n- Mi negocio: [qué vendes y a quién]\n- Mi colapso: [qué pasó, en tus palabras]\n- Lo que aprendí: [la lección principal]\n- Cómo está hoy: [un resultado concreto, aunque sea pequeño]\n\nReglas:\n- Frases cortas, una por línea, como se dicen en voz alta. Nada de palabras rebuscadas.\n- La primera línea tiene que enganchar en 3 segundos.\n- Habla en primera persona, con emoción real, sin exagerar ni inventar cifras.\n- Al final dame: 1 idea de toma para cada bloque (qué grabo mientras hablo) y un texto corto para la portada." },
  "marca-personal": { nombre: "Marca personal", para: "Para contar tu historia frente a la cámara.", texto: "Actúa como guionista de contenido DocuSelling: videos cortos que conectan contando una historia personal real.\n\nEscríbeme UN guion para un reel de 45 a 60 segundos con la fórmula 7-7-5:\n- 7 líneas sobre mi COLAPSO: el momento más duro que viví (personal, profesional o emocional).\n- 7 líneas sobre la LUCHA: cómo lo enfrenté, el miedo a mostrarme, el día que decidí pedir ayuda.\n- 5 líneas sobre el RESULTADO: cómo me reconstruí con lo que aprendí y quién soy hoy.\n\nUsa la metáfora \"la vida cabe en una maleta\": si mi vida tuviera que caber en una maleta, qué metí y qué solté.\nCierra con 2 o 3 preguntas \"¿Qué pasaría si…?\" que inviten a quien me ve a soltar el miedo a la cámara y compartir su propia historia.\n\nMis datos:\n- Quién soy: [a qué te dedicas o qué te apasiona]\n- Mi colapso: [qué pasó, en tus palabras]\n- Lo que aprendí: [la lección principal]\n- Quién soy hoy: [cómo cambió tu vida]\n\nReglas:\n- Frases cortas, una por línea, como se dicen en voz alta.\n- La primera línea tiene que enganchar en 3 segundos.\n- Tono cercano y honesto. Que se sienta vulnerable, no dramático.\n- Al final dame: 1 idea de toma para cada bloque y un texto corto para la portada." },
  "ugc": { nombre: "UGC", para: "Para crear videos que una marca quiera usar.", texto: "Actúa como guionista de contenido UGC con estilo DocuSelling: videos que una marca puede usar porque cuentan una experiencia real con su producto.\n\nEscríbeme UN guion para un video UGC de 30 a 45 segundos con la fórmula 7-7-5:\n- 7 líneas sobre el COLAPSO: el problema que yo tenía antes del producto (lo que me frustraba).\n- 7 líneas sobre la LUCHA: lo que probé y no funcionó, hasta que encontré este producto.\n- 5 líneas sobre el RESULTADO: qué cambió desde que lo uso, con un detalle concreto.\n\nUsa la metáfora \"la vida cabe en una maleta\": este producto es de lo esencial, de lo que sí meto en la maleta.\nCierra con 1 o 2 preguntas \"¿Qué pasaría si…?\" que inviten a quien ve el video a probarlo.\n\nMis datos:\n- Producto o marca: [qué es y para qué sirve]\n- Mi problema antes: [qué te pasaba]\n- Lo que cambió: [el resultado que notaste]\n- Para quién es: [a quién se lo recomendarías]\n\nReglas:\n- Frases cortas, una por línea, naturales, como si se lo contara a una amiga.\n- La primera línea tiene que enganchar en 3 segundos.\n- No inventes beneficios que el producto no tiene ni prometas resultados médicos o de dinero.\n- Al final dame: el plano para cada bloque (rostro, producto en mano, uso real) y 3 opciones de gancho distintas para que la marca pruebe." }
};
const POLITICA = "2026-10-23-borrador"; // misma versión que CONFIG.politicaVersion en camino.js

const $ = (s, el) => (el || document).querySelector(s);
function ls(k, v){ try{ if(v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); }catch(e){ return null; } }
const UTM_KEYS = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"];
function utms(){
  const u = new URLSearchParams(location.search), o = {};
  UTM_KEYS.forEach(k => { let v = u.get(k); if(!v){ try{ v = sessionStorage.getItem("vm_"+k); }catch(e){} }
    if(v){ o[k] = v; try{ sessionStorage.setItem("vm_"+k, v); }catch(e){} } });
  return o;
}
utms();

let elegido = null;
const steps = [...document.querySelectorAll(".step")];
const ir = i => { steps.forEach((s, j) => s.classList.toggle("active", j === i)); window.scrollTo({ top: 0, behavior: "smooth" }); };

document.querySelectorAll("[data-camino]").forEach(b => b.addEventListener("click", () => {
  elegido = b.dataset.camino;
  document.querySelectorAll("[data-camino]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
}));

function mostrar(camino){
  const p = PROMPTS[camino];
  $("#p-nombre").textContent = p.nombre;
  $("#p-para").textContent = p.para;
  $("#p-texto").textContent = p.texto;
  document.querySelectorAll("[data-ver]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.ver === camino)));
  $("#copiar").textContent = "Copiar prompt";
}
document.querySelectorAll("[data-ver]").forEach(b => b.addEventListener("click", () => mostrar(b.dataset.ver)));

$("#copiar").addEventListener("click", async () => {
  const t = $("#p-texto").textContent;
  try{ await navigator.clipboard.writeText(t); }
  catch(e){ const r = document.createRange(); r.selectNodeContents($("#p-texto")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand("copy"); }
  $("#copiar").textContent = "¡Copiado! Pégalo en ChatGPT";
});

$("#form").addEventListener("submit", async e => {
  e.preventDefault();
  const nombre = $("#nombre").value.trim(), email = $("#email").value.trim(), consent = $("#consent").checked;
  const msg = $("#msg"); msg.hidden = true;
  $("#nombre").setAttribute("aria-invalid", String(!nombre));
  $("#email").setAttribute("aria-invalid", String(!/^\S+@\S+\.\S+$/.test(email)));
  if(!elegido){ msg.textContent = "Elige tu camino para darte el prompt indicado."; msg.hidden = false; return; }
  if(!nombre || !/^\S+@\S+\.\S+$/.test(email)){ msg.textContent = "Revisa tu nombre y tu correo."; msg.hidden = false; return; }
  if(!consent){ msg.textContent = "Necesitamos tu autorización para enviarte los prompts."; msg.hidden = false; return; }
  const btn = $("#form button[type=submit]"); btn.disabled = true;
  const body = JSON.stringify(Object.assign({ event: "lead", producto: "prompts", nombre, email, angulo: elegido, consentimiento: true,
    consentimiento_at: new Date().toISOString(), politica_version: POLITICA, page: location.pathname }, utms()));
  let ok = false;
  for(let i = 0; i < 3 && !ok; i++){
    try{ ok = (await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body })).ok; }catch(e){}
    if(!ok) await new Promise(r => setTimeout(r, 600 * (i + 1)));
  }
  // Si el guardado falla igual se entregan los prompts: no castigamos a la persona por un error nuestro.
  ls("vm_prompts", { camino: elegido, nombre: nombre.split(" ")[0], guardado: ok });
  abrir(elegido, nombre.split(" ")[0]);
});

function abrir(camino, nombre){
  $("#hola").textContent = nombre ? `${nombre}, aquí ` : "Aquí ";
  mostrar(camino); ir(2);
}
$("[data-start]").addEventListener("click", () => ir(1));
const previo = ls("vm_prompts");
if(previo && PROMPTS[previo.camino]) abrir(previo.camino, previo.nombre);
