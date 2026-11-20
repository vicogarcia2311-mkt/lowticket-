/* De una idea a infinitos contenidos — lógica compartida.
   Entrada (/camino): test de 3 preguntas → datos → página del ángulo.
   Páginas por ángulo (/camino-*): se arman desde ANGULOS con <body data-angulo="...">.
   Spec: ../OFERTA-Y-PROMESA-22oct.md */

const CONFIG = {
  // === COMPLETAR ANTES DE PUBLICAR ===
  // El link de pago NO va aquí: lo entrega /api/config solo cuando el carrito está abierto (variable CHECKOUT_URL en Vercel).
  politicaVersion: "2026-11-04-borrador", // versión de la política de datos que acepta cada lead
  whatsappGrupo: "https://chat.whatsapp.com/G6nejKSn9Fp1gJEqSW1i70", // grupo de WhatsApp donde el equipo orienta a quien no sabe su camino
  webhookUrl: "/api/lead", // función de Vercel que guarda el lead en Supabase (web/api/lead.js)
  metaPixelId: "1930528057931904",        // ID del pixel de Meta (opcional)
  paginas: { "ugc": "/camino-ugc", "negocio": "/camino-negocio", "marca-personal": "/camino-marca-personal" },
  // "No estoy segura" en P1 → pantalla del grupo (whatsappGrupo). Si P3 = "Apenas empiezo" sin otra señal → este camino
  anguloPorDefecto: "negocio"
};

const OFERTA = {
  titulo: "De una idea a infinitos contenidos",
  // Precio reservado (campaña de expectativa): no va aquí. Lo entrega /api/config solo con el carrito abierto
  // (variables PRECIO_USD, PRECIO_REGULAR_USD y PRECIO_COP en Vercel).
  // Fechas reservadas (campaña de expectativa): no van aquí. Las entrega /api/config solo con el carrito abierto.
  plataforma: "YouTube",      // dónde se transmite la clase en vivo
  plazas: "",                 // ej. "150"; si queda vacío dice "Plazas limitadas"
  replay: "Sí. La clase queda grabada y tienes acceso de por vida a la grabación, a la clase de tu camino y al PDF desde tu cuenta de Whop.",
  diasBonos: "1",             // los bonos se entregan un día después de la clase en vivo
  garantia: "",               // política de reembolso definida (ver FAQ)
  // Valores de referencia de los bonos (USD).
  valores: { clase: 40, pdf: 10, asistente: 30 }
};

// Capturas reales de mensajes de alumnas y resultados en Instagram.
const TESTIMONIOS = [
  { img: "img/testimonio-mariam.jpg", w: 1160, h: 1280, alt: "Mensaje de Mariam sobre su llamada de diagnóstico: todo mejoró de inmediato y ya ve su perfil con más claridad" },
  { img: "img/testimonio-asesoria-1.jpg", w: 1280, h: 714, alt: "Mensaje de alumna: la asesoría marcó un antes y un después para crear contenido y diferenciarse para vender" },
  { img: "img/testimonio-asesoria-2.jpg", w: 1280, h: 816, alt: "Mensaje de alumna: claridad con la estrategia para optimizar el perfil, construir un sistema e identidad de marca" },
  { img: "img/testimonio-dinamica.jpg", w: 1239, h: 428, alt: "Mensaje de alumna agradeciendo ver la creación de contenido de forma más fácil y dinámica para conectar" },
  { img: "img/testimonio-documentar.jpg", w: 1280, h: 368, alt: "Mensaje de alumna: me habían hablado mucho de documentar mi proceso pero nunca de esta forma" }
];
const RESULTADOS = [
  { img: "img/resultado-reel-19k.jpg", w: 590, h: 1280, label: "19.057 visualizaciones · 442 guardados · 133 seguidores nuevos", alt: "Estadísticas de Reel con 19,057 visualizaciones, 13,956 cuentas alcanzadas y 442 guardados" },
  { img: "img/resultado-reel-10k.jpg", w: 934, h: 1280, label: "10.287 visualizaciones · 352 compartidos · 304 guardados", alt: "Estadísticas de Reel con 10,287 visualizaciones, 1,104 interacciones y 352 compartidos" },
  { img: "img/resultado-historias.jpg", w: 1280, h: 302, wide: true, label: "1.807 personas viendo las historias", alt: "Estadísticas de historias en Instagram con 1.807 visualizaciones" }
];

/* ---------- utilidades ---------- */
const $ = (s, el) => (el || document).querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const usd = n => `USD ${n}`;

function ls(k, v){ try{ if(v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); }catch(e){ return null; } }
function ss(k, v){ try{ if(v === undefined) return JSON.parse(sessionStorage.getItem(k) || "null"); sessionStorage.setItem(k, JSON.stringify(v)); }catch(e){ return null; } }
document.querySelectorAll("[data-ws-title]").forEach(el => el.textContent = OFERTA.titulo);

/* ---------- UTM + tracking (misma convención que las landings anteriores) ---------- */
const UTM_KEYS = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","src","sck"];
function currentParams(){
  const u = new URLSearchParams(location.search), o = {};
  UTM_KEYS.forEach(k => {
    let v = u.get(k);
    if(!v){ try{ v = sessionStorage.getItem("vm_"+k); }catch(e){} }
    if(v){ o[k] = v; try{ sessionStorage.setItem("vm_"+k, v); }catch(e){} }
  });
  return o;
}
// src = fuente, sck = campaña|pieza|ángulo (confirmar nombres de parámetros en la plataforma de cobro)
function checkoutUrl(base, angulo){
  const p = currentParams(), url = new URL(base, location.href);
  UTM_KEYS.forEach(k => { if(p[k]) url.searchParams.set(k, p[k]); });
  url.searchParams.set("src", p.utm_source || "directo");
  url.searchParams.set("sck", [p.utm_campaign || "", p.utm_content || "", angulo || ""].join("|"));
  return url.toString();
}
async function post(body){
  try{ const r = await fetch(CONFIG.webhookUrl, {method:"POST", headers:{"Content-Type":"application/json"}, body}); return r.ok; }
  catch(e){ return false; }
}
// Clics: sin esperar respuesta. Leads: se confirma que /api/lead los guardó; si falla se reintenta y, si sigue fallando, queda en cola en el navegador.
async function send(payload){
  if(!CONFIG.webhookUrl) return false;
  const body = JSON.stringify(Object.assign({ts:new Date().toISOString(), page:location.pathname}, payload));
  if(payload.event !== "lead"){
    try{ if(navigator.sendBeacon) return navigator.sendBeacon(CONFIG.webhookUrl, body); }catch(e){}
    post(body); return true;
  }
  for(let i = 0; i < 3; i++){
    if(await post(body)){ if(payload.meta_event_id){const queue=ls("vm_cola")||[];ls("vm_cola",queue.filter(b=>{try{return JSON.parse(b).meta_event_id!==payload.meta_event_id;}catch(e){return true;}}));} return true; }
    await new Promise(r => setTimeout(r, 600 * (i + 1)));
  }
  const cola = (ls("vm_cola") || []).filter(b=>{try{return !payload.meta_event_id || JSON.parse(b).meta_event_id!==payload.meta_event_id;}catch(e){return true;}}); cola.push(body); ls("vm_cola", cola.slice(-5));
  return false;
}
Promise.resolve().then(async function vaciarCola(){
  const cola = ls("vm_cola"); if(!cola || !cola.length || !CONFIG.webhookUrl) return;
  const quedan = [];
  for(const b of cola){ let payload;try{payload=JSON.parse(b);}catch(e){continue;} if(!metaAllowed()){delete payload.meta_consent;delete payload.meta_event_id;delete payload.meta_fbp;delete payload.meta_fbc;} if(!(await post(JSON.stringify(payload)))) quedan.push(JSON.stringify(payload)); }
  ls("vm_cola", quedan);
});
// Advertising consent is separate from workshop registration.
const metaAllowed = () => ls("vm_meta_consent") === "yes";
let metaStarted = false;
function startMeta(){
  if(!metaAllowed() || metaStarted || !CONFIG.metaPixelId) return;
  metaStarted = true;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('consent','grant'); window.fbq('init', CONFIG.metaPixelId); window.fbq('track','PageView');
}
function track(name, data, id){ if(metaAllowed() && window.fbq){ if(id) window.fbq('track',name,data||{},{eventID:id}); else window.fbq('track',name,data||{}); } }
function metaCookie(name){const m=document.cookie.split("; ").find(x=>x.startsWith(name+"="));return m?m.slice(name.length+1):"";}
function metaClickId(){
  const click=new URLSearchParams(location.search).get("fbclid"), existing=metaCookie("_fbc")||ss("vm_meta_fbc")||"";
  if(click && /^[A-Za-z0-9_-]{1,500}$/.test(click) && !existing.endsWith("."+click)){const fbc="fb.1."+Date.now()+"."+click;ss("vm_meta_fbc",fbc);return fbc;}
  return existing;
}
function metaDetails(id){
  if(!metaAllowed()) return {};
  return {meta_consent:true,meta_event_id:id,meta_fbp:metaCookie("_fbp"),meta_fbc:metaClickId()};
}
function metaPreferences(){
  if(new URLSearchParams(location.search).get("privacidad") === "publicidad"){ ls("vm_meta_consent","ask"); }
  const prior=ls("vm_meta_consent");
  if(prior==="yes" || prior==="no"){if(prior==="yes"){metaClickId();startMeta();}return;}
  const box=document.createElement("aside");
  box.className="meta-consent";
  box.setAttribute("aria-label","Preferencias de publicidad");
  box.innerHTML='<p>Con tu permiso, usamos Meta para medir anuncios. Puedes rechazar sin afectar tu inscripción. <a href="/privacidad" target="_blank" rel="noopener">Privacidad</a></p><div class="meta-consent-actions"><button type="button" data-meta-yes>Aceptar</button><button type="button" data-meta-no>Rechazar</button></div>';
  box.querySelector("[data-meta-yes]").onclick=()=>{ls("vm_meta_consent","yes");box.remove();metaClickId();startMeta();};
  box.querySelector("[data-meta-no]").onclick=()=>{ls("vm_meta_consent","no");box.remove();ss("vm_meta_fbc","");if(window.fbq)window.fbq("consent","revoke");};
  document.body.appendChild(box);
}
metaPreferences();
currentParams(); // guarda las UTM de llegada en sessionStorage

/* ---------- embudo por UTM: visitas y pasos del test (sin datos personales) ---------- */
const nuevoId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const SESION = ss("vm_sesion") || (v => (ss("vm_sesion", v), v))(nuevoId());
const VISITANTE = ls("vm_visitante") || (v => (ls("vm_visitante", v), v))(nuevoId());
if(!ss("vm_ref")) ss("vm_ref", document.referrer ? new URL(document.referrer).hostname : "directo");
const pasos = new Set();
function evento(nombre, extra){
  if(pasos.has(nombre) && nombre !== "visita") return;   // cada paso cuenta una vez por página
  pasos.add(nombre);
  const body = JSON.stringify(Object.assign({ evento: nombre, sesion: SESION, visitante: VISITANTE, pagina: location.pathname,
    angulo: document.body.dataset.angulo || null, referrer: ss("vm_ref"), movil: matchMedia("(max-width: 760px)").matches }, currentParams(), extra || {}));
  try{ if(navigator.sendBeacon && navigator.sendBeacon("/api/evento", new Blob([body], {type:"text/plain"}))) return; }catch(e){}
  fetch("/api/evento", { method:"POST", headers:{"Content-Type":"application/json"}, body, keepalive:true }).catch(() => {});
}
evento("visita");

/* ---------- test ---------- */
const PREGUNTAS = [
  { id:"objetivo", titulo:"¿Qué quieres lograr con tu contenido?", hint:"Elige la que más pese hoy.", opciones:[
    { t:"Trabajar con marcas", a:"ugc" },
    { t:"Vender mi producto o servicio", a:"negocio" },
    { t:"Construir mi marca personal", a:"marca-personal" },
    { t:"No estoy segura", a:null } ]},
  { id:"bloqueo", titulo:"¿Cuál es hoy tu mayor bloqueo?", hint:"Con esto preparamos la clase.", opciones:[
    { t:"No sé qué publicar" },
    { t:"Publico, pero no me contactan ni me compran" },
    { t:"No sé cómo estructurar mi contenido" },
    { t:"No soy constante" } ]},
  { id:"situacion", titulo:"¿Cómo describirías lo que haces hoy?", hint:"La opción más cercana sirve.", opciones:[
    { t:"Hago contenido para otras marcas, o quiero empezar", a:"ugc" },
    { t:"Tengo un negocio o un servicio", a:"negocio" },
    { t:"Hago contenido sobre mí y mi perfil", a:"marca-personal" },
    { t:"Apenas empiezo", a:null } ]}
];
// P1 cuenta doble, P3 suma uno; en empate decide P1; sin señal → anguloPorDefecto.
function asignarAngulo(r){
  const s = {"ugc":0, "negocio":0, "marca-personal":0};
  if(r.objetivo) s[r.objetivo] += 2;
  if(r.situacion) s[r.situacion] += 1;
  const max = Math.max(...Object.values(s));
  if(max === 0) return CONFIG.anguloPorDefecto;
  const top = Object.keys(s).filter(k => s[k] === max);
  return (top.length > 1 && top.includes(r.objetivo)) ? r.objetivo : top[0];
}

function initEntrada(){
  const steps = [...document.querySelectorAll(".step")];
  const respuestas = {}, etiquetas = {};
  let current = 0;
  function go(i){
    steps[current].classList.remove("active");
    current = i;
    $(".entrada").classList.toggle("started", current > 0);
    const s = steps[current];
    s.classList.add("active");
    const h = s.querySelector("h1,h2"); if(h){ h.setAttribute("tabindex","-1"); h.focus({preventScroll:true}); }
    if(s.querySelector("#lead-form")) evento("formulario");
    if(window.innerWidth < 960) window.scrollTo({top:0, behavior:"smooth"});
  }
  PREGUNTAS.forEach((q, qi) => {
    const s = $(`[data-q="${qi}"]`);
    s.innerHTML = `
      <div class="progress"><span>Pregunta ${qi+1} de 3</span><span class="bar"><i style="width:${(qi+1)/3*100}%"></i></span></div>
      <h2 id="q${qi}">${q.titulo}</h2>
      <p class="hint">${q.hint}</p>
      <div class="options" role="group" aria-labelledby="q${qi}">
        ${q.opciones.map((o, oi) => `<button type="button" class="opt" aria-pressed="false" data-oi="${oi}"><span class="k">${"ABCD"[oi]}</span>${o.t}</button>`).join("")}
      </div>
      <div class="step-foot"><button type="button" class="link-btn" data-back>← Atrás</button></div>`;
    s.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => {
      s.querySelectorAll(".opt").forEach(x => x.setAttribute("aria-pressed","false"));
      b.setAttribute("aria-pressed","true");
      const o = q.opciones[+b.dataset.oi];
      respuestas[q.id] = o.a === undefined ? o.t : o.a;
      etiquetas[q.id] = o.t;
      evento("pregunta_" + (qi + 1));
      setTimeout(() => go(current + 1), 220);
    }));
  });
  document.querySelectorAll("[data-back]").forEach(b => b.addEventListener("click", () => go(Math.max(0, current - 1))));
  document.querySelectorAll("[data-start]").forEach(b => b.addEventListener("click", () => { evento("test_inicio"); track("ViewContent", {content_name:"test_angulo"}); go(1); }));

  const form = $("#lead-form"), msg = $("#msg");
  function showMsg(t){ msg.textContent = t; msg.hidden = false; }
  let pendingLeadId = "", pendingLeadKey = "", submitting = false;
  form.addEventListener("submit", async e => {
    e.preventDefault(); if(submitting) return; msg.hidden = true;
    const d = Object.fromEntries(new FormData(form).entries());
    // WhatsApp = código del país elegido + número local (si la persona escribe el número con "+", se respeta tal cual).
    const crudo = (d.whatsapp || "").trim();
    const local = crudo.replace(/\D/g, "").replace(/^0+/, "");
    const tel = crudo.startsWith("+") ? "+" + crudo.replace(/\D/g, "") : (d.pais || "+57") + local;
    const bad = { nombre: !d.nombre.trim(), email: !/^\S+@\S+\.\S+$/.test(d.email || ""), whatsapp: tel.replace(/\D/g,"").length < 8 || local.length < 6 };
    Object.keys(bad).forEach(k => form[k].setAttribute("aria-invalid", bad[k] ? "true" : "false"));
    if(bad.nombre || bad.email || bad.whatsapp){ showMsg("Revisa tu nombre, tu correo y tu número de WhatsApp."); return; }
    if(!form.consent.checked){ showMsg("Necesitamos tu autorización para tratar tus datos."); return; }
    const indeciso = respuestas.objetivo === null; // eligió "No estoy segura": va al grupo, no a una página de camino
    const angulo = indeciso ? "por-definir" : asignarAngulo(respuestas);
    const lead = { nombre: d.nombre.trim(), email: d.email.trim(), angulo, bloqueo: etiquetas.bloqueo || "", indeciso };
    ss("vm_lead", lead); ls("vm_lead", lead);
    go(indeciso ? steps.indexOf($("[data-grupo-step]")) : steps.length - 1);
    const leadKey = lead.email.trim().toLowerCase()+"|"+tel;
    if(pendingLeadKey !== leadKey || !pendingLeadId){ pendingLeadKey=leadKey; pendingLeadId=window.crypto?.randomUUID?.() || nuevoId(); }
    const meta=metaDetails(pendingLeadId); submitting=true;
    const saved = await send(Object.assign({ event:"lead", producto:"Workshop " + OFERTA.titulo,
      nombre: lead.nombre, email: lead.email, whatsapp: tel, angulo, bloqueo: lead.bloqueo, indeciso,
      objetivo: etiquetas.objetivo || "", situacion: etiquetas.situacion || "",
      consentimiento: true, consentimiento_at: new Date().toISOString(), politica_version: CONFIG.politicaVersion }, currentParams(), meta));
    submitting=false;
    if(!saved){ go(4); showMsg("No pudimos confirmar tu registro. Intenta nuevamente."); return; }
    evento("lead", { angulo: angulo });
    if(meta.meta_event_id) track("Lead", {}, meta.meta_event_id);
    pendingLeadId=""; pendingLeadKey="";
    if(!indeciso) setTimeout(() => { location.href = CONFIG.paginas[angulo]; }, 900);
  });

  $("[data-grupo]").addEventListener("click", e => {
    evento("grupo");
    if(!CONFIG.whatsappGrupo){
      e.preventDefault();
      const m = $("#msg-grupo"); m.textContent = "Modo borrador: falta el link del grupo de WhatsApp en CONFIG."; m.hidden = false;
      return;
    }
    e.currentTarget.href = CONFIG.whatsappGrupo; e.currentTarget.target = "_blank"; e.currentTarget.rel = "noopener";
  });
}

/* ---------- páginas por ángulo ---------- */
const ANGULOS = {
  "ugc": {
    nombre: "UGC", img: "img/valen-ugc.jpg",
    titular: "Tu camino es crear contenido <em>para marcas</em>",
    sub: "Lo que publicas también es tu portafolio. En una hora armas la estructura que le muestra a una marca lo que sabes hacer, y sales con tu primer banco de ideas.",
    bono: "Clase grabada para creadoras UGC",
    bonoDesc: "30 minutos para llevar tu estructura al contenido que piden las marcas, con su plantilla descargable.",
    bonoObj: "Para la duda de “¿esto sirve para trabajar con marcas?”"
  },
  "negocio": {
    nombre: "Negocio", img: "img/valen-emprendedora.jpg",
    titular: "Tu camino es <em>vender</em> con tu contenido",
    sub: "Tu negocio ya tiene historias para contar. En una hora les das una estructura y sales con tu primer banco de ideas pensadas para vender.",
    bono: "Clase grabada para negocios",
    bonoDesc: "30 minutos para documentar tu negocio y convertirlo en contenido que vende, con su plantilla descargable.",
    bonoObj: "Para la duda de “¿esto sirve para mi negocio?”"
  },
  "marca-personal": {
    nombre: "Marca personal", img: "img/valen-marca-personal.jpg",
    titular: "Tu camino es tu <em>marca personal</em>",
    sub: "Tienes mucho que decir y te falta un orden. En una hora armas la estructura de tu perfil y sales con tu primer banco de ideas sobre lo que ya haces y vives.",
    bono: "Clase grabada de marca personal",
    bonoDesc: "30 minutos para convertir tu día a día en contenido de marca, con su plantilla descargable.",
    bonoObj: "Para la duda de “¿esto sirve para mi perfil?”"
  }
};

const CLIPS = ["clip01","clip02","clip03","clip04","clip05","clip06","clip07","clip08"]; // web/media, 5 s, sin audio

/* Collage de videos de la bio: 8 portadas reales de fondo + 1 solo <video> optimizado para móvil/iOS */
function initReel(){
  const reel = $("[data-reel]"); if(!reel) return;
  const solo = reel.querySelector(".reel-solo video");
  const playBtn = reel.querySelector("[data-reel-play]");
  const countEl = reel.querySelector("[data-reel-count]");
  const prevBtn = reel.querySelector("[data-reel-prev]");
  const nextBtn = reel.querySelector("[data-reel-next]");
  const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let idx = 0, timer = null, inView = false, loaded = false;

  solo.muted = true;
  solo.defaultMuted = true;
  solo.playsInline = true;
  solo.setAttribute("muted", "");
  solo.setAttribute("playsinline", "");
  solo.setAttribute("webkit-playsinline", "");

  function showClip(nextIdx, autoPlay){
    idx = (nextIdx + CLIPS.length) % CLIPS.length;
    const c = CLIPS[idx];
    if(countEl) countEl.textContent = `${idx + 1}/${CLIPS.length}`;
    reel.querySelectorAll(".reel-grid img").forEach((img, n) => img.classList.toggle("active", n === idx));
    solo.poster = `media/${c}.jpg`;
    solo.src = `media/${c}.mp4`;
    solo.load();
    loaded = true;
    if(autoPlay && !quieto){
      const p = solo.play();
      if(p && p.then){
        p.then(() => { if(playBtn) playBtn.hidden = true; })
         .catch(() => { if(playBtn) playBtn.hidden = false; });
      }
    }
  }

  function scheduleNext(){
    clearTimeout(timer);
    if(!inView || quieto) return;
    timer = setTimeout(() => { showClip(idx + 1, true); scheduleNext(); }, 3600);
  }

  if(playBtn){
    playBtn.addEventListener("click", () => {
      if(!loaded) showClip(idx, false);
      solo.muted = true;
      solo.play().then(() => { playBtn.hidden = true; scheduleNext(); }).catch(() => {});
    });
  }
  if(prevBtn) prevBtn.addEventListener("click", () => { showClip(idx - 1, true); scheduleNext(); });
  if(nextBtn) nextBtn.addEventListener("click", () => { showClip(idx + 1, true); scheduleNext(); });

  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if(inView){
      if(!loaded) showClip(0, !quieto);
      else if(!quieto) solo.play().then(() => { if(playBtn) playBtn.hidden = true; }).catch(() => { if(playBtn) playBtn.hidden = false; });
      scheduleNext();
    } else {
      clearTimeout(timer);
      if(loaded) solo.pause();
    }
  }, { rootMargin: "180px 0px", threshold: .1 }).observe(reel);
}

const MARQUEE = ["De una idea a infinitos contenidos","Documenta tu día","Estructura 70/30","Tu camino, no el de otra","Workshop en vivo"].map(t => `<span>${t}</span>`).join("");

/* E · aparición al bajar (se llama después de pintar cada página) */
function initReveal(){
  const els = document.querySelectorAll(".reveal");
  if(!("IntersectionObserver" in window)){ els.forEach(el => el.classList.add("in")); return; }
  const io = new IntersectionObserver(es => es.forEach((e, i) => { if(e.isIntersecting){ setTimeout(() => e.target.classList.add("in"), i * 90); io.unobserve(e.target); } }), {threshold:.12});
  els.forEach(el => io.observe(el));
}

function renderAngulo(){
  const key = document.body.dataset.angulo, A = ANGULOS[key];
  const lead = ss("vm_lead") || ls("vm_lead") || {};
  const nombre = (lead.nombre || "").split(" ")[0];
  const V = OFERTA.valores, totalBonos = V.clase + V.pdf + V.asistente;
  const otros = Object.keys(ANGULOS).filter(k => k !== key);
  const toOffer = (label, cls) => `<a class="btn ${cls || ""}" href="#oferta">${label} <span class="arrow" aria-hidden="true">→</span></a>`;
  const buy = (label, cls) => `<a class="btn ${cls || ""}" href="#" data-buy>${label} <span class="arrow" aria-hidden="true">→</span></a>`;
  const cierre = "";  // lo completa aplicarEstado() según el estado del lanzamiento
  const plazas = OFERTA.plazas ? `${esc(OFERTA.plazas)} plazas` : "";

  $("#app").innerHTML = `
  <header class="hero"><div class="wrap">
    <div class="topbar"><a class="brand" href="/camino"><img src="img/logo-valen.png" alt="Valentina García · Empresaria digital" width="415" height="155"></a><span class="small">Workshop en vivo · 1 hora</span></div>
    <div class="hero-grid">
      <div>
        <p class="hello"><img src="img/valen-avatar.jpg" alt="" width="30" height="30">${nombre ? `${esc(nombre)}, tu camino es` : "Tu camino"} <b>${A.nombre}</b></p>
        <h1>${A.titular}</h1>
        <p class="lead">${A.sub}</p>
        <p class="bloqueo" ${lead.bloqueo ? "" : "hidden"}>Nos contaste que tu mayor bloqueo es <b>“${esc(lead.bloqueo || "")}”</b>. Por eso la clase arranca por la estructura.</p>
        <ul class="facts" aria-label="Datos del workshop">
          <li><span>Workshop</span><span>${esc(OFERTA.titulo)}</span></li>
          <li><span>Fecha</span><span data-fecha>Se anuncia muy pronto</span></li>
          <li><span>Duración</span><span>1 hora en vivo, con preguntas</span></li>
          <li><span>Grabación</span><span>Incluida, con acceso de por vida</span></li>
          <li><span>Inversión</span><span data-precio-dato>Se revela muy pronto</span></li>
          ${plazas ? `<li><span>Cupos</span><span>${plazas}</span></li>` : ""}
        </ul>
        <div class="cta-row">${toOffer("Reservar mi lugar")}</div>
      </div>
      <div class="photo-wrap"><div class="hero-photo" style="display:block"><img src="${A.img}" alt="Valentina Garcia" width="1100" height="1460" fetchpriority="high"></div><span class="sticker star"><b>En vivo</b><small>1 hora</small></span></div>
    </div>
  </div></header>

  <div class="marquee" aria-hidden="true"><div class="track">${MARQUEE}${MARQUEE}</div></div>

  <section class="sec-second curve-top lift" style="--curve-from:var(--bg)"><div class="wrap">
    <p class="eyebrow">Al terminar la hora</p>
    <h2 class="reveal">Sales con <em>esto</em> en la mano</h2>
    <ol class="outcomes">
      <li class="reveal"><span class="idx">1</span><b>Tu estructura de contenido en borrador</b><span class="d">70% contenido permanente que sigue funcionando por meses, y 30% de tendencias, audios y conexiones.</span></li>
      <li class="reveal"><span class="idx">2</span><b>Tu camino claro: ${A.nombre}</b><span class="d">Qué publicar y para qué, sin copiar el camino de nadie.</span></li>
      <li class="reveal"><span class="idx">3</span><b>Tu primer banco de ideas</b><span class="d">Lo escribes durante la clase, a partir de lo que ya haces.</span></li>
      <li class="reveal"><span class="idx">4</span><b>El método de documentar tu día para vender</b><span class="d">Para que las ideas salgan de tu rutina y no de una hoja en blanco.</span></li>
    </ol>
    <h3 style="margin-top:44px">Así es la clase</h3>
    <div class="agenda">
      <div><span class="t">Parte 1</span><div><h3>La estructura</h3><p>Cómo se organiza un perfil que no depende de la inspiración del día.</p></div></div>
      <div><span class="t">Parte 2</span><div><h3>Tu camino</h3><p>Qué cambia en la estructura cuando tu camino es ${A.nombre.toLowerCase()}.</p></div></div>
      <div><span class="t">Parte 3</span><div><h3>Ejercicio en vivo</h3><p>Escribes tu banco de ideas con Valen guiando.</p></div></div>
      <div><span class="t">Cierre</span><div><h3>Preguntas y respuestas</h3><p>Dudas sobre tu caso, en vivo por ${esc(OFERTA.plataforma)}.</p></div></div>
    </div>
    ${toOffer("Quiero salir con mi banco de ideas")}
  </div></section>

  <section class="sec-yellow curve-top bio-sec" style="--curve-from:var(--second)"><div class="wrap quote-grid">
    <div class="reel" data-reel aria-label="Videos de Valentina García trabajando">
      <div class="reel-grid" aria-hidden="true">${CLIPS.map((c, n) => `<img src="media/${c}.jpg" alt="" width="432" height="768" loading="lazy"${n === 0 ? ' class="active"' : ""}>`).join("")}</div>
      <div class="reel-solo">
        <video muted playsinline webkit-playsinline autoplay loop preload="metadata" disableRemotePlayback poster="media/${CLIPS[0]}.jpg" aria-label="Clip de Valentina García creando contenido"></video>
        <button type="button" class="reel-play" data-reel-play aria-label="Reproducir video" hidden>▶ Ver video</button>
      </div>
      <div class="reel-bar">
        <span class="reel-tag">Procesos reales · <b data-reel-count>1/${CLIPS.length}</b></span>
        <div class="reel-nav">
          <button type="button" data-reel-prev aria-label="Video anterior">‹</button>
          <button type="button" data-reel-next aria-label="Video siguiente">›</button>
        </div>
      </div>
    </div>
    <div>
      <p class="bio-label">Quién te enseña</p>
      <h2 class="bio-name">Valentina <em>García</em></h2>
      <div class="bio-chips"><span>Estratega digital</span><span>Creadora de DocuSelling</span><span>+18.000 en su comunidad</span></div>
      <blockquote>“No hay un solo camino de contenido. Hay el tuyo.”</blockquote>
      <p><b>Valentina García</b>, estratega digital y creadora de la metodología DocuSelling.</p>
      <p>Te enseño a crear contenido perdurable documentando lo que ya haces, sin depender de la viralidad ni de la inspiración. Lidero una comunidad de más de 18.000 personas.</p>
      <p class="bio-cierre">Aquí no vas a ver teoría, vas a ver <em>procesos reales</em>.</p>
      <ul class="bio-metodo">
        <li><b>Estructura 70/30:</b> 70% contenido permanente, 30% tendencias, audios y conexiones.</li>
        <li><b>Documentar para vender:</b> su día a día es la materia prima de su contenido.</li>
        <li><b>De una idea a infinitos contenidos:</b> cada idea se cuenta en historias, reel, carrusel, TikTok y video largo.</li>
      </ul>
    </div>
  </div></section>

  <section class="curve-top lift" style="--curve-from:var(--accent)"><div class="wrap">
    <p class="eyebrow">Incluido con tu lugar</p>
    <h2 class="reveal">Tres bonos, <em>uno</em> hecho para tu camino</h2>
    <div class="bonos" style="margin-top:28px">
      <div class="card bono featured reveal"><span class="tag">★ Bono estrella · tu camino</span><p class="obj">${A.bonoObj}</p><h3>${A.bono}</h3><p>${A.bonoDesc}</p><p class="when"><span>Llega un día después de la clase</span><span class="val-pair"><span class="val">${usd(V.clase)}</span><em class="incl">Incluido</em></span></p></div>
      <div class="card bono reveal"><span class="tag">Bono 2</span><p class="obj">Para la duda de “no tengo tiempo de crear tanto”</p><h3>PDF “Una idea, cinco formatos”</h3><p>Checklist para contar la misma idea en historias, reel, carrusel, TikTok y video largo o blog, con un ejemplo ya lleno.</p><p class="when"><span>Llega un día después de la clase</span><span class="val-pair"><span class="val">${usd(V.pdf)}</span><em class="incl">Incluido</em></span></p></div>
      <div class="card bono reveal"><span class="tag">Bono 3</span><p class="obj">Para la duda de “¿y cuando se me acaben las ideas?”</p><h3>Tu asistente de ideas con IA</h3><p>Escribes una idea y recibes 3 o 4 opciones de contenido en los cinco formatos.</p><p class="when"><span>Se activa un día después de la clase</span><span class="val-pair"><span class="val">${usd(V.asistente)}</span><em class="incl">Incluido</em></span></p></div>
    </div>
  </div></section>

  <section class="sec-yellow curve-top" id="oferta" style="--curve-from:var(--bg)"><div class="wrap">
    <div class="oferta-card">
      <p class="eyebrow" style="color:var(--muted)">Tu lugar en el workshop</p>
      <h2 style="font-size:1.6rem">${esc(OFERTA.titulo)}</h2>
      <ul class="stack">
        <li><span>Workshop en vivo de 1 hora con Valen <small class="stack-note">+ grabación con acceso de por vida</small></span><span data-precio-regular class="por-revelar">Por revelar</span></li>
        <li class="star-line"><span>★ ${A.bono}</span><span class="val-pair"><span class="val">${usd(V.clase)}</span><em class="incl">Incluido</em></span></li>
        <li><span>PDF “Una idea, cinco formatos”</span><span class="val-pair"><span class="val">${usd(V.pdf)}</span><em class="incl">Incluido</em></span></li>
        <li><span>Asistente de ideas con IA</span><span class="val-pair"><span class="val">${usd(V.asistente)}</span><em class="incl">Incluido</em></span></li>
      </ul>
      <p class="total"><span data-total-label>Valor de los bonos</span><strong class="val-orig" data-total>${usd(totalBonos)}</strong></p>
      <div data-precio-bloque>
        <div class="expectativa">
          <p class="exp-tit">Pronto te <em>regalamos</em> todo esto</p>
          <p>Los tres bonos llegan de regalo con tu lugar en el workshop. El precio de lanzamiento se revela primero a quienes están en la lista, antes que a nadie.</p>
        </div>
      </div>
      <div class="pills">${plazas ? `<span>${plazas}</span>` : ""}<span>1 hora en vivo</span><span>Grabación de por vida</span></div>
      <p class="estado-msg" data-estado-msg hidden></p>
      ${buy("Reservar mi lugar", "block")}
      <p class="small" style="margin:14px 0 0;text-align:center"><span data-estado-texto>${cierre}</span><br>Pago seguro con Whop · Garantía de devolución si no logramos lo prometido</p>
    </div>
  </div></section>

  ${(TESTIMONIOS.length || RESULTADOS.length) ? `<section class="sec-proof curve-top" style="--curve-from:var(--accent)"><div class="wrap">
    <p class="eyebrow">Lo que dicen y logran</p>
    <h2>Mensajes de <em>alumnas</em> y resultados reales</h2>
    <p class="lead">Capturas reales de personas que ya aplicaron el método y el alcance que genera crear con estructura.</p>
    ${TESTIMONIOS.length ? `<div class="proof-msgs">${TESTIMONIOS.map(t => `<figure class="proof-card"><img src="${t.img}" alt="${esc(t.alt)}" width="${t.w}" height="${t.h}" loading="lazy"></figure>`).join("")}</div>` : ""}
    ${RESULTADOS.length ? `<h3 class="proof-sub">Resultados en pantalla</h3>
    <div class="proof-stats">${RESULTADOS.map(r => `<figure class="proof-card ${r.wide ? "is-wide" : "is-tall"}"><img src="${r.img}" alt="${esc(r.alt)}" width="${r.w}" height="${r.h}" loading="lazy"><figcaption>${esc(r.label)}</figcaption></figure>`).join("")}</div>` : ""}
  </div></section>` : ""}


  <section class="sec-second curve-top" style="--curve-from:${(TESTIMONIOS.length || RESULTADOS.length) ? "var(--bg)" : "var(--accent)"}"><div class="wrap grid g2" style="gap:48px">
    <div>
      <h2>Es para ti si…</h2>
      <ul class="nolist yeslist">
        <li>No sabes por dónde empezar a generar ideas ni cómo ordenarlas.</li>
        <li>Quieres una estructura propia en lugar de copiar a otra creadora.</li>
        <li>Vas a practicar lo que armes en la clase.</li>
      </ul>
    </div>
    <div>
      <h2>Lo que <em>no</em> te vamos a prometer</h2>
      <ul class="nolist">
        <li>Ventas instantáneas sin práctica ni estructura.</li>
        <li>Seguidores o viralidad sin trabajo.</li>
      </ul>
      <p class="small" style="margin-top:16px">Te llevas método y estructura. Los resultados dependen de que lo apliques.</p>
    </div>
  </div></section>

  <section class="curve-top" style="--curve-from:var(--second)"><div class="wrap" style="max-width:820px">
    <h2>Preguntas frecuentes</h2>
    <details><summary>¿Es en vivo?</summary><p>Sí. La clase es en directo por ${esc(OFERTA.plataforma)}, dura máximo una hora e incluye un espacio para preguntas.</p></details>
    <details><summary>¿Y si no puedo conectarme ese día?</summary><p>${esc(OFERTA.replay)}</p></details>
    <details><summary>¿Necesito experiencia previa?</summary><p>No. El ejercicio parte de lo que ya haces o de lo que quieres empezar a hacer. Cada persona trabaja con su propio negocio o proyecto.</p></details>
    <details><summary>¿Qué recibo y cuándo?</summary><p><b>Al inscribirte:</b> acceso inmediato a tu cuenta de Whop con la confirmación de tu cupo y los datos de la clase en vivo.<br><b>Un día después de la clase en vivo:</b> se desbloquean todos tus bonos (la clase grabada de tu camino, el PDF “Una idea, cinco formatos” y el asistente de ideas con IA), además de la grabación del taller con acceso de por vida.</p></details>
    <details><summary>¿Tiene garantía?</summary><p>Sí. Si no logramos lo que te prometemos, te devolvemos tu dinero según las condiciones de garantía de Whop.</p></details>
    ${OFERTA.plazas ? `<details><summary>¿Hay cupos?</summary><p>Hay ${esc(OFERTA.plazas)} cupos.</p></details>` : ""}
  </div></section>

  <section class="final wm wm-c sec-yellow curve-top" style="--curve-from:var(--bg)"><div class="wrap">
    <p class="eyebrow">${esc(OFERTA.titulo)}</p>
    <h2>Una hora para salir con tu <em>banco de ideas</em></h2>
    <p class="lead" style="margin:0 auto 28px">Tu estructura, tu camino ${A.nombre.toLowerCase()} y tus primeras ideas, armadas en vivo con Valen.</p>
    ${buy("Reservar mi lugar")}
    <p class="small" style="margin-top:16px" data-estado-texto>${cierre}${plazas ? " · " + plazas : ""}</p>
    <div class="others" aria-label="Otros caminos"><span class="small" style="align-self:center">¿No te identificas?</span>${otros.map(k => `<a href="${CONFIG.paginas[k]}">Ver el camino ${ANGULOS[k].nombre}</a>`).join("")}</div>
  </div></section>

  <footer><div class="wrap">© Valentina García · <a href="/privacidad">Política de tratamiento de datos</a></div></footer>
  <div class="sticky"><a class="btn block" href="#oferta">Ver lo que incluye</a></div>
  <p class="msg ok toast" id="toast" role="status" hidden></p>`;

  // barra fija en móvil: aparece después del inicio y se oculta mientras la oferta está en pantalla
  const sticky = $(".sticky"), seen = {hero:true, oferta:false};
  const io = new IntersectionObserver(es => {
    es.forEach(e => seen[e.target.id === "oferta" ? "oferta" : "hero"] = e.isIntersecting);
    sticky.classList.toggle("show", !seen.hero && !seen.oferta);
  });
  io.observe($(".hero")); io.observe($("#oferta"));

  // Estado del lanzamiento: hasta confirmar que está "abierto" la página se comporta como "espera".
  let estado = { estado: "espera" };
  const btns = [...document.querySelectorAll("[data-buy]")], msg = $("[data-estado-msg]");
  const toast = t => { const el = $("#toast"); el.textContent = t; el.hidden = false; setTimeout(() => el.hidden = true, 4500); };
  function aplicarEstado(){
    if(estado.estado === "abierto"){
      msg.hidden = true;
      if(estado.fechaClase) document.querySelectorAll("[data-fecha]").forEach(el => el.textContent = estado.fechaClase);
      document.querySelectorAll("[data-estado-texto]").forEach(el => el.textContent = estado.cierreTexto ? `Inscripciones abiertas hasta ${estado.cierreTexto}` : "Inscripciones abiertas");
      const P = estado.precio, R = estado.precioRegular;
      if(P){
        const copTxt = estado.precioCOP ? `≈ $${esc(estado.precioCOP)} COP` : "";
        document.querySelectorAll("[data-precio-dato]").forEach(el => el.innerHTML = `${R ? `<span class="val-orig-inline">Precio original ${usd(R)}</span> ` : ""}<strong>${usd(P)}</strong> <span class="cop">${copTxt} · precio de lanzamiento</span>`);
        document.querySelectorAll("[data-precio-regular]").forEach(el => el.outerHTML = R ? `<span class="val">${usd(R)}</span>` : "");
        if(R){ $("[data-total-label]").textContent = "Precio original"; $("[data-total]").textContent = usd(R + totalBonos); }
        $("[data-precio-bloque]").innerHTML = `<p class="price-now"><span style="font-weight:600">Hoy pagas</span><span class="price-pair"><strong>${usd(P)}</strong><span class="cop">${copTxt}</span></span></p>
          <p class="urgencia">Precio de lanzamiento: <b>todo por ${usd(P)}</b>, solo en esta edición. La clase queda grabada: <b>acceso de por vida</b> a la grabación, la clase de tu camino y el PDF.</p>`;
        $(".sticky a").textContent = "Reservar mi lugar · " + usd(P);
      }
      btns.forEach(b => b.innerHTML = `Reservar mi lugar${P ? " por " + usd(P) : ""} <span class="arrow" aria-hidden="true">→</span>`);
      return;
    }
    const cerrado = estado.estado === "cerrado";
    const texto = cerrado ? "Inscripciones cerradas" : lead.email ? "Ya estás en la lista" : "Inscripciones muy pronto";
    msg.innerHTML = cerrado ? "Las inscripciones de esta edición ya cerraron. Déjanos tus datos y te avisamos de la próxima."
      : lead.email ? `<b>Ya estás en la lista.</b> Serás de las primeras en saber cuándo abren las inscripciones: te avisamos por WhatsApp y correo con tu link directo.${CONFIG.whatsappGrupo ? " Entra al grupo de WhatsApp: ahí contamos todo primero." : ""}`
      : `Las inscripciones abren muy pronto y la lista se entera primero. Haz el test y entra para recibir tu link directo.`;
    msg.hidden = false;
    document.querySelectorAll("[data-estado-texto]").forEach(el => el.textContent = texto);
    btns.forEach(b => b.innerHTML = (cerrado || !lead.email) ? `Entrar a la lista <span class="arrow" aria-hidden="true">→</span>`
      : CONFIG.whatsappGrupo ? `Entrar al grupo de WhatsApp <span class="arrow" aria-hidden="true">→</span>` : `Ya estoy en la lista ✓`);
    $(".sticky a").textContent = "Ver lo que incluye";
  }
  aplicarEstado();
  fetch("/api/config").then(r => r.ok ? r.json() : null).then(c => { if(c){ estado = c; aplicarEstado(); } }).catch(() => {});

  btns.forEach(b => b.addEventListener("click", e => {
    e.preventDefault();
    if(estado.estado === "abierto" && estado.checkoutUrl){
      evento("clic_compra");
      track("InitiateCheckout", {content_category:key, value:estado.precio || 0, currency:"USD"});
      const url = new URL(checkoutUrl(estado.checkoutUrl, key));
      if(lead.email) url.searchParams.set("email", lead.email);
      location.href = url.toString();
    } else if(lead.email && estado.estado !== "cerrado"){
      if(CONFIG.whatsappGrupo){ evento("grupo"); window.open(CONFIG.whatsappGrupo, "_blank", "noopener"); return; }
      evento("clic_espera");
      toast("Ya estás en la lista. Te avisamos el día de la apertura.");
    } else {
      location.href = "/camino" + location.search;
    }
  }));
}

if(document.body.dataset.page === "entrada") initEntrada();
else if(document.body.dataset.angulo){ renderAngulo(); initReel(); }
initReveal();
