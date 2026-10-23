/* De una idea a infinitos contenidos — lógica compartida.
   Entrada (camino.html): test de 3 preguntas → datos → página del ángulo.
   Páginas por ángulo (camino-*.html): se arman desde ANGULOS con <body data-angulo="...">.
   Spec: ../OFERTA-Y-PROMESA-22oct.md */

const CONFIG = {
  // === COMPLETAR ANTES DE PUBLICAR ===
  checkoutWorkshop: "https://whop.com/checkout/plan_nkY3ynh3G9wOr", // Whop · producto prod_n9hWq5KyyOxNa · USD 27 pago único
  whatsappGrupo: "",      // grupo de WhatsApp donde el equipo orienta a quien no sabe su camino
  webhookUrl: "/api/lead", // función de Vercel que guarda el lead en Supabase (web/api/lead.js)
  metaPixelId: "",        // ID del pixel de Meta (opcional)
  paginas: { "ugc": "camino-ugc.html", "negocio": "camino-negocio.html", "marca-personal": "camino-marca-personal.html" },
  // "No estoy segura" en P1 → pantalla del grupo (whatsappGrupo). Si P3 = "Apenas empiezo" sin otra señal → este camino
  anguloPorDefecto: "negocio"
};

const OFERTA = {
  titulo: "De una idea a infinitos contenidos",
  precio: 27,                 // USD, precio de lanzamiento (solo esta edición)
  precioRegular: 35,          // USD, precio normal del workshop (tachado)
  precioCOP: "88.500",        // referencia en pesos colombianos (Whop cobra al cambio del día, hoy ≈ COP 88.496)
  fecha: "",                  // ej. "Jueves 5 de noviembre · 7:00 p. m. (COL)"
  cierre: "",                 // cierre de inscripciones, ej. "miércoles 4 de noviembre, 11:59 p. m."
  plataforma: "YouTube",      // dónde se transmite la clase en vivo
  plazas: "",                 // ej. "150"; si queda vacío dice "Plazas limitadas"
  replay: "Sí. La clase queda grabada y tienes acceso de por vida a la grabación y a todos los bonos desde tu cuenta de Whop.",
  diasBonos: "",              // en cuántos días se entregan la clase del camino y el asistente
  garantia: "",               // política de reembolso definida (ver FAQ)
  // Valores de referencia de los bonos (USD), tachados en la oferta. PROPUESTA: confirmar.
  valores: { clase: 30, pdf: 5, asistente: 20 }
};

// Capturas reales de alumnas (con autorización). Mientras esté vacío, la sección no se muestra.
// Formato: { img: "img/testimonio-1.jpg", alt: "Mensaje de ... sobre ..." }
const TESTIMONIOS = [];

/* ---------- utilidades ---------- */
const $ = (s, el) => (el || document).querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const tbd = (v, ph) => v ? esc(v) : `<mark class="tbd">${ph}</mark>`;
const usd = n => `USD ${n}`;
const cop = () => OFERTA.precioCOP ? `≈ $${OFERTA.precioCOP} COP` : "";
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
function send(payload){
  if(!CONFIG.webhookUrl) return Promise.resolve(false);
  const body = JSON.stringify(Object.assign({ts:new Date().toISOString(), page:location.pathname}, payload));
  try{
    if(payload.event === "click" && navigator.sendBeacon){ navigator.sendBeacon(CONFIG.webhookUrl, body); return Promise.resolve(true); }
    return fetch(CONFIG.webhookUrl, {method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain"}, body}).then(()=>true).catch(()=>false);
  }catch(e){ return Promise.resolve(false); }
}
if(CONFIG.metaPixelId){
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', CONFIG.metaPixelId); fbq('track','PageView');
}
function track(name, data){ if(window.fbq) fbq('track', name, data || {}); }
currentParams(); // guarda las UTM de llegada en sessionStorage

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
      if(qi === 0) send({event:"click", accion:"test_respuesta_1"});
      setTimeout(() => go(current + 1), 220);
    }));
  });
  document.querySelectorAll("[data-back]").forEach(b => b.addEventListener("click", () => go(Math.max(0, current - 1))));
  $("[data-start]").addEventListener("click", () => { track("ViewContent", {content_name:"test_angulo"}); go(1); });

  const form = $("#lead-form"), msg = $("#msg");
  function showMsg(t){ msg.textContent = t; msg.hidden = false; }
  form.addEventListener("submit", async e => {
    e.preventDefault(); msg.hidden = true;
    const d = Object.fromEntries(new FormData(form).entries());
    const tel = (d.whatsapp || "").replace(/[^\d+]/g, "");
    const bad = { nombre: !d.nombre.trim(), email: !/^\S+@\S+\.\S+$/.test(d.email || ""), whatsapp: tel.replace(/\D/g,"").length < 10 };
    Object.keys(bad).forEach(k => form[k].setAttribute("aria-invalid", bad[k] ? "true" : "false"));
    if(bad.nombre || bad.email || bad.whatsapp){ showMsg("Revisa tu nombre, tu correo y tu WhatsApp con código de país."); return; }
    if(!form.consent.checked){ showMsg("Necesitamos tu autorización para tratar tus datos."); return; }
    const indeciso = respuestas.objetivo === null; // eligió "No estoy segura": va al grupo, no a una página de camino
    const angulo = indeciso ? "por-definir" : asignarAngulo(respuestas);
    const lead = { nombre: d.nombre.trim(), email: d.email.trim(), angulo, bloqueo: etiquetas.bloqueo || "", indeciso };
    ss("vm_lead", lead);
    go(indeciso ? steps.indexOf($("[data-grupo-step]")) : steps.length - 1);
    await send(Object.assign({ event:"lead", producto:"Workshop " + OFERTA.titulo,
      nombre: lead.nombre, email: lead.email, whatsapp: tel, angulo, bloqueo: lead.bloqueo, indeciso,
      objetivo: etiquetas.objetivo || "", situacion: etiquetas.situacion || "" }, currentParams()));
    track("Lead", {content_category: angulo});
    if(!indeciso) setTimeout(() => { location.href = CONFIG.paginas[angulo]; }, 900);
  });

  $("[data-grupo]").addEventListener("click", e => {
    send({event:"click", accion:"grupo_whatsapp"});
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

/* Collage de videos de la bio: todos a la vez → uno solo en grande → todos… */
function initReel(){
  const reel = $("[data-reel]"); if(!reel) return;
  const tiles = [...reel.querySelectorAll(".reel-grid video")], solo = reel.querySelector(".reel-solo video");
  const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let i = 0, started = false;
  tiles.concat(solo).forEach(v => { v.muted = true; v.defaultMuted = true; }); // iOS solo reproduce solo si muted es propiedad, no solo atributo
  const playAll = () => tiles.forEach(v => { if(!v.src) v.src = v.dataset.src; v.play().catch(() => {}); });
  const espera = ms => new Promise(r => setTimeout(r, ms));
  // Ritmo: 1) flash rápido de todos los cortes a pantalla completa → 2) aparecen todos juntos → 3) uno por uno en grande.
  async function ciclo(){
    for(;;){
      reel.classList.remove("is-solo", "is-appear"); reel.classList.add("is-flash");
      for(const t of tiles){ tiles.forEach(x => x.classList.toggle("on", x === t)); await espera(260); }
      tiles.forEach(x => x.classList.remove("on"));
      reel.classList.remove("is-flash"); reel.classList.add("is-appear");
      await espera(2600);
      for(const t of tiles){
        solo.src = t.dataset.src; solo.play().catch(() => {});
        reel.classList.add("is-solo");
        await espera(1900);
      }
      reel.classList.remove("is-solo");
      await espera(900);
    }
  }
  new IntersectionObserver(([e]) => {
    if(e.isIntersecting){
      if(quieto) return;               // con "reducir movimiento" quedan las portadas quietas
      playAll(); if(reel.classList.contains("is-solo")) solo.play().catch(() => {});
      if(!started){ started = true; ciclo(); }
    } else { tiles.concat(solo).forEach(v => v.pause()); }
  }, {threshold:.25}).observe(reel);
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
  const lead = ss("vm_lead") || {};
  const nombre = (lead.nombre || "").split(" ")[0];
  const V = OFERTA.valores, totalBonos = V.clase + V.pdf + V.asistente;
  const otros = Object.keys(ANGULOS).filter(k => k !== key);
  const toOffer = (label, cls) => `<a class="btn ${cls || ""}" href="#oferta">${label} <span class="arrow" aria-hidden="true">→</span></a>`;
  const buy = (label, cls) => `<a class="btn ${cls || ""}" href="#" data-buy>${label} <span class="arrow" aria-hidden="true">→</span></a>`;
  const cierre = OFERTA.cierre ? `Inscripciones abiertas hasta el ${esc(OFERTA.cierre)}` : `<mark class="tbd">Cierre de inscripciones por confirmar</mark>`;
  const plazas = OFERTA.plazas ? `${esc(OFERTA.plazas)} plazas` : "Plazas limitadas";

  $("#app").innerHTML = `
  <header class="hero"><div class="wrap">
    <div class="topbar"><a class="brand" href="camino.html"><img src="img/logo-valen.png" alt="Valentina García · Empresaria digital" width="415" height="155"></a><span class="small">Workshop en vivo · 1 hora</span></div>
    <div class="hero-grid">
      <div>
        <p class="hello"><img src="img/valen-avatar.jpg" alt="" width="30" height="30">${nombre ? `${esc(nombre)}, tu camino es` : "Tu camino"} <b>${A.nombre}</b></p>
        <h1>${A.titular}</h1>
        <p class="lead">${A.sub}</p>
        <p class="bloqueo" ${lead.bloqueo ? "" : "hidden"}>Nos contaste que tu mayor bloqueo es <b>“${esc(lead.bloqueo || "")}”</b>. Por eso la clase arranca por la estructura.</p>
        <ul class="facts" aria-label="Datos del workshop">
          <li><span>Workshop</span><span>${esc(OFERTA.titulo)}</span></li>
          <li><span>Fecha</span><span>${tbd(OFERTA.fecha, "Por confirmar")}</span></li>
          <li><span>Duración</span><span>1 hora en vivo, con preguntas</span></li>
          <li><span>Grabación</span><span>Incluida · acceso de por vida</span></li>
          <li><span>Inversión</span><span><s class="val">${usd(OFERTA.precioRegular)}</s> ${usd(OFERTA.precio)} <span class="cop">${cop()} · precio de lanzamiento</span></span></li>
          <li><span>Cupos</span><span>${plazas}</span></li>
        </ul>
        <div class="cta-row">${toOffer("Reservar mi lugar")}${OFERTA.cierre ? `<span class="small">${cierre}</span>` : ""}</div>
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
    <p class="small" style="margin:-12px 0 24px"><mark class="tbd">Orden y minutos por confirmar con Valen</mark></p>
    ${toOffer("Quiero salir con mi banco de ideas")}
  </div></section>

  <section class="sec-yellow curve-top bio-sec" style="--curve-from:var(--second)"><div class="wrap quote-grid">
    <div class="reel" data-reel aria-label="Videos de Valentina García trabajando">
      <div class="reel-grid">${CLIPS.map((c, n) => `<video muted playsinline loop preload="none" poster="media/${c}.jpg" data-src="media/${c}.mp4" style="--i:${n}" aria-hidden="true"></video>`).join("")}</div>
      <div class="reel-solo"><video muted playsinline loop preload="none" aria-hidden="true"></video></div>
      <span class="reel-tag">Procesos reales</span>
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
      <div class="card bono featured reveal"><span class="tag">★ Bono estrella · tu camino</span><p class="obj">${A.bonoObj}</p><h3>${A.bono}</h3><p>${A.bonoDesc}</p><p class="when"><span>Llega ${tbd(OFERTA.diasBonos ? `en ${OFERTA.diasBonos} días` : "", "en [X] días")} después del vivo</span><span class="val-pair"><s class="val">${usd(V.clase)}</s><em class="incl">Incluido</em></span></p></div>
      <div class="card bono reveal"><span class="tag">Bono 2</span><p class="obj">Para la duda de “no tengo tiempo de crear tanto”</p><h3>PDF “Una idea, cinco formatos”</h3><p>Checklist para contar la misma idea en historias, reel, carrusel, TikTok y video largo o blog, con un ejemplo ya lleno.</p><p class="when"><span>Lo recibes al inscribirte</span><span class="val-pair"><s class="val">${usd(V.pdf)}</s><em class="incl">Incluido</em></span></p></div>
      <div class="card bono reveal"><span class="tag">Bono 3</span><p class="obj">Para la duda de “¿y cuando se me acaben las ideas?”</p><h3>Tu asistente de ideas con IA</h3><p>Escribes una idea y recibes 3 o 4 opciones de contenido en los cinco formatos.</p><p class="when"><span>Se activa después del vivo · <mark class="tbd">límite de uso</mark></span><span class="val-pair"><s class="val">${usd(V.asistente)}</s><em class="incl">Incluido</em></span></p></div>
    </div>
  </div></section>

  <section class="sec-yellow curve-top" id="oferta" style="--curve-from:var(--bg)"><div class="wrap">
    <div class="oferta-card reveal">
      <p class="eyebrow" style="color:var(--muted)">Tu lugar en el workshop</p>
      <h2 style="font-size:1.6rem">${esc(OFERTA.titulo)}</h2>
      <ul class="stack">
        <li><span>Workshop en vivo de 1 hora con Valen <small class="stack-note">+ grabación con acceso de por vida</small></span><s class="val">${usd(OFERTA.precioRegular)}</s></li>
        <li class="star-line"><span>★ ${A.bono}</span><span class="val-pair"><s class="val">${usd(V.clase)}</s><em class="incl">Incluido</em></span></li>
        <li><span>PDF “Una idea, cinco formatos”</span><span class="val-pair"><s class="val">${usd(V.pdf)}</s><em class="incl">Incluido</em></span></li>
        <li><span>Asistente de ideas con IA</span><span class="val-pair"><s class="val">${usd(V.asistente)}</s><em class="incl">Incluido</em></span></li>
      </ul>
      <p class="total"><span>Valor total</span><s class="val">${usd(OFERTA.precioRegular + totalBonos)}</s></p>
      <p class="price-now"><span style="font-weight:600">Hoy pagas</span><span class="price-pair"><strong>${usd(OFERTA.precio)}</strong><span class="cop">${cop()}</span></span></p>
      <p class="urgencia">Precio de lanzamiento: <b>todo por ${usd(OFERTA.precio)}</b>, solo en esta edición. La clase queda grabada y tienes <b>acceso de por vida</b> a todo.</p>
      <div class="pills"><span>${plazas}</span><span>${OFERTA.fecha ? esc(OFERTA.fecha) : "1 hora en vivo"}</span><span>Acceso de por vida</span></div>
      ${buy(`Reservar mi lugar por ${usd(OFERTA.precio)}`, "block")}
      <p class="small" style="margin:14px 0 0;text-align:center">${cierre}<br>Pago seguro con Whop · Garantía de devolución si no logramos lo prometido</p>
    </div>
  </div></section>

  ${TESTIMONIOS.length ? `<section><div class="wrap">
    <p class="eyebrow">Lo que dicen</p>
    <h2>Mensajes de <em>alumnas</em></h2>
    <div class="proof" style="margin-top:28px">${TESTIMONIOS.map(t => `<img src="${t.img}" alt="${esc(t.alt)}" loading="lazy">`).join("")}</div>
  </div></section>` : ""}


  <section class="sec-second curve-top" style="--curve-from:var(--accent)"><div class="wrap grid g2" style="gap:48px">
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
    <details><summary>¿Y si no puedo conectarme ese día?</summary><p>${OFERTA.replay ? esc(OFERTA.replay) : `<mark class="tbd">Si habrá grabación, por cuántos días estará disponible y cómo se accede</mark>`} Si no puedes asistir, te avisaremos cómo acceder al contenido.</p></details>
    <details><summary>¿Necesito experiencia previa?</summary><p>No. El ejercicio parte de lo que ya haces o de lo que quieres empezar a hacer. Cada persona trabaja con su propio negocio o proyecto.</p></details>
    <details><summary>¿Qué recibo y cuándo?</summary><p><b>El PDF:</b> inmediatamente después de tu compra.<br><b>La clase de tu camino y el asistente de IA:</b> ${tbd(OFERTA.diasBonos, "[X]")} días después de la clase en vivo.</p></details>
    <details><summary>¿Tiene garantía?</summary><p>Sí. Si no logramos lo que te prometemos, te devolvemos tu dinero según las condiciones de garantía de Whop.</p></details>
    ${OFERTA.cierre || OFERTA.plazas ? `<details><summary>¿Hay cupos o fecha límite?</summary><p>${OFERTA.plazas ? `Hay ${esc(OFERTA.plazas)} cupos. ` : ""}${OFERTA.cierre ? `Las inscripciones cierran el ${esc(OFERTA.cierre)}.` : ""}</p></details>` : ""}
  </div></section>

  <section class="final wm wm-c sec-yellow curve-top" style="--curve-from:var(--bg)"><div class="wrap">
    <p class="eyebrow">${esc(OFERTA.titulo)}</p>
    <h2>Una hora para salir con tu <em>banco de ideas</em></h2>
    <p class="lead" style="margin:0 auto 28px">Tu estructura, tu camino ${A.nombre.toLowerCase()} y tus primeras ideas, armadas en vivo con Valen.</p>
    ${buy(`Reservar mi lugar por ${usd(OFERTA.precio)}`)}
    <p class="small" style="margin-top:16px">${cierre} · ${plazas}</p>
    <div class="others" aria-label="Otros caminos"><span class="small" style="align-self:center">¿No te identificas?</span>${otros.map(k => `<a href="${CONFIG.paginas[k]}">Ver el camino ${ANGULOS[k].nombre}</a>`).join("")}</div>
  </div></section>

  <footer><div class="wrap">© Valentina Garcia · <mark class="tbd">Política de privacidad y términos (enlaces)</mark></div></footer>
  <div class="sticky"><a class="btn block" href="#oferta">Reservar mi lugar · ${usd(OFERTA.precio)}</a></div>
  <p class="msg ok toast" id="toast" role="status" hidden></p>`;

  // barra fija en móvil: aparece después del inicio y se oculta mientras la oferta está en pantalla
  const sticky = $(".sticky"), seen = {hero:true, oferta:false};
  const io = new IntersectionObserver(es => {
    es.forEach(e => seen[e.target.id === "oferta" ? "oferta" : "hero"] = e.isIntersecting);
    sticky.classList.toggle("show", !seen.hero && !seen.oferta);
  });
  io.observe($(".hero")); io.observe($("#oferta"));

  document.querySelectorAll("[data-buy]").forEach(b => b.addEventListener("click", e => {
    e.preventDefault();
    send({event:"click", accion:"checkout", angulo:key});
    track("InitiateCheckout", {content_category:key, value:OFERTA.precio, currency:"USD"});
    if(!CONFIG.checkoutWorkshop){
      const t = $("#toast"); t.textContent = "Modo borrador: falta el enlace de checkout en CONFIG."; t.hidden = false;
      setTimeout(() => t.hidden = true, 3500); return;
    }
    const url = new URL(checkoutUrl(CONFIG.checkoutWorkshop, key));
    if(lead.email) url.searchParams.set("email", lead.email);
    location.href = url.toString();
  }));
}

if(document.body.dataset.page === "entrada") initEntrada();
else if(document.body.dataset.angulo){ renderAngulo(); initReel(); }
initReveal();
