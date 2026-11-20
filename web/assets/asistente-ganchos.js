/* Biblioteca de ganchos: fórmulas por tipo. Se usan en la pestaña "Banco de ganchos".
   Fichas: {tema} {producto} {momento} {dolor} {deseo} {error} {mito} {tip} {pregunta} {situacion} */
(function (root) {
  const D = root.ASIS_DATOS || (typeof require !== "undefined" ? require("./asistente-datos.js") : null);
  const GANCHOS = {
    curiosidad: { nombre: "Curiosidad", uso: "Abre una pregunta que solo se cierra viendo el video.", f: [
      "Nadie te cuenta esto de {tema}.", "Espera a ver cómo termina.", "Esto cambió por completo cómo veo {tema}.", "Lo descubrí por accidente y ahora no paro de hacerlo.",
      "Hay una razón por la que te pasa esto: {dolor}.", "El secreto está en el paso 3.", "Casi nadie se fija en este detalle.", "Lo que pasa después de {momento} te va a sorprender.",
      "Esto es lo que hago diferente.", "Hay algo que tienes que saber antes de {error}." ] },
    error: { nombre: "Error", uso: "Señala algo que la persona hace mal sin hacerla sentir mal.", f: [
      "Deja de {error}.", "Si estás por {error}, para.", "El error que más veo en {tema}.", "Lo hiciste mal toda la vida (y no es tu culpa).",
      "3 errores que te están costando caro.", "Por esto no te funciona.", "Yo también lo hacía mal hasta que aprendí esto.", "Si te pasa esto, estás cometiendo este error: {dolor}." ] },
    mito: { nombre: "Mito y controversia", uso: "Contradice una creencia: genera comentarios.", f: [
      "«{mito}». Falso.", "Opinión impopular: «{mito}» no es cierto.", "Te mintieron sobre {tema}.", "Me van a odiar por decir esto.",
      "Todo el mundo cree que {mito}. No es así.", "Lo que dicen de {tema} está mal.", "No estoy de acuerdo con lo que se dice de {tema}." ] },
    numero: { nombre: "Número y lista", uso: "Promete algo concreto y fácil de consumir.", f: [
      "3 cosas que tienes que saber si {situacion}.", "5 consejos de {tema} que nadie te da.", "1 minuto para entender {tema}.", "7 días para cambiar cómo haces esto.",
      "Lo resumo en 3 pasos.", "2 cosas que haría distinto.", "10 segundos para no {error}." ] },
    historia: { nombre: "Historia", uso: "Empieza en medio de una situación: la gente quiere saber qué pasó.", f: [
      "Hace un año no me imaginaba esto.", "La vez que casi lo dejo todo.", "Nunca les había contado esto.", "Todo empezó con {momento}.",
      "Una clienta me escribió esto y me hizo llorar.", "Ese día aprendí la lección más importante sobre {tema}.", "Así empezó todo." ] },
    pov: { nombre: "POV e identificación", uso: "La persona se ve reflejada en la situación.", f: [
      "POV: te toca {momento}.", "Si {situacion}, esto es para ti.", "Cuando te pasa esto: {dolor}.", "Esto le pasa a todas y nadie lo dice.",
      "Levanta la mano si te ha pasado.", "Esto es para ti que {situacion}." ] },
    tutorial: { nombre: "Tutorial y beneficio", uso: "Promete un resultado concreto.", f: [
      "Cómo lo hago yo, paso a paso.", "Así lo hago yo para que me quede bien.", "Truco rápido: {tip}.", "Te enseño a hacerlo en menos de un minuto.",
      "La forma más fácil: {tip}.", "Guarda esto para cuando lo necesites.", "Lo que hago para que te quede bien sin complicarte." ] },
    prueba: { nombre: "Prueba y resultado", uso: "Muestra el resultado primero y explica después.", f: [
      "De esto a esto.", "El resultado habla solo.", "Lo probé una semana y esto pasó.", "Así quedó después de {momento}.",
      "Antes y después, sin filtros.", "Mira la diferencia." ] },
    pregunta: { nombre: "Pregunta directa", uso: "Habla directo a quien tiene la duda.", f: [
      "{pregunta}", "¿Sabías que «{mito}» no es cierto?", "¿Por qué nadie habla de esto?", "¿Te ha pasado? {dolor}.",
      "¿Cuál prefieres?", "¿Sabes cuál es la diferencia?" ] },
    contraste: { nombre: "Contraste", uso: "Compara dos realidades para generar tensión.", f: [
      "Lo que la gente cree vs. lo que pasa de verdad.", "Barato vs. bien hecho.", "Expectativa vs. realidad de {momento}.", "Así lo hace la mayoría. Así lo hago yo.",
      "Lo que pides vs. lo que necesitas.", "Antes pensaba que {mito}. Hoy sé esto." ] }
  };


  /* Fórmulas adicionales */
  const MAS_G = {
    curiosidad: ["No vas a creer lo que encontré haciendo {momento}.", "Esto lo sabe muy poca gente en {tema}.", "Llevo años en esto y apenas lo entendí.", "Te voy a mostrar algo que casi nadie hace.", "La parte de mi trabajo que más me preguntan.", "¿Por qué hago esto así? Te explico.", "Esto me lo enseñó una clienta.", "Si ves esto hasta el final, vas a entender por qué."],
    error: ["Lo estás haciendo al revés.", "Este error lo cometí durante años.", "Si haces esto, estás perdiendo plata.", "No vuelvas a {error}.", "Lo que nadie te corrige en {tema}.", "Este pequeño error lo arruina todo.", "Revisa si estás cometiendo este error."],
    mito: ["Te dijeron que {mito}. Te mintieron.", "Ya es hora de dejar de creer esto.", "La verdad sobre {tema} que no te gusta escuchar.", "Esto que repite todo el mundo es falso.", "Voy a defender algo que todos critican.", "No, «{mito}» no es verdad."],
    numero: ["3 señales de que necesitas cambiar esto.", "4 cosas que hago todos los días.", "La regla de los 5 minutos que me cambió todo.", "3 preguntas que debes hacer antes de decidir.", "5 cosas que aprendí este año en {tema}.", "Lo más importante de {tema} en 30 segundos."],
    historia: ["Ayer me pasó algo que les tengo que contar.", "Mi primera clienta me dijo algo que nunca olvidé.", "Así me veía cuando empecé.", "El día que todo salió mal.", "Una decisión que me cambió la vida.", "Nunca pensé que diría esto."],
    pov: ["POV: es lunes y te toca {momento}.", "Esto es tan real que duele.", "A ti que {situacion}: te entiendo.", "Si te sientes identificada, comenta «YO».", "Esto es lo que pasa por tu cabeza cuando te pasa esto: {dolor}.", "Etiqueta a tu amiga que vive esto."],
    tutorial: ["En 3 pasos y sin complicarte.", "Te enseño exactamente cómo lo hago.", "Copia este paso a paso.", "Lo que hago antes de {momento}.", "Mi método en menos de un minuto.", "El paso que todos se saltan."],
    prueba: ["Esto pasó después de una semana.", "Te muestro el resultado real.", "Así quedó. Ahora te cuento cómo.", "La foto no le hace justicia.", "Mira el detalle.", "El cambio en 15 segundos."],
    pregunta: ["¿Tú también {error}?", "¿Esto es normal? Te respondo.", "¿Qué harías tú?", "¿Lo sabías?", "¿Por qué cuesta lo que cuesta?", "¿Vale la pena? Respuesta honesta."],
    contraste: ["Lo que publico vs. lo que vivo.", "Cómo empecé vs. cómo lo hago hoy.", "Rápido vs. bien hecho.", "Lo que esperas vs. lo que recibes.", "Lo que se ve vs. lo que hay detrás.", "Primer intento vs. décimo intento."]
  };
  for (const k of Object.keys(MAS_G)) GANCHOS[k].f.push(...MAS_G[k]);

  /* Guía por formato: cómo grabarlo bien. */
  const GUIA_FORMATOS = {
    historias: { funcion: "Probar la idea y conectar con quien ya te sigue.", duracion: "4 a 8 historias.", graba: ["Graba mientras pasa, no después.", "Muestra tu cara o tus manos al menos en una.", "Texto corto: se ven sin sonido.", "Usa una encuesta, pregunta o deslizador."], mide: "Respuestas, votos y cuántas personas llegan a la última historia.", evita: "Contarlo todo hablando a cámara." },
    reel: { funcion: "Alcance: llegar a gente que todavía no te sigue.", duracion: "15 a 45 segundos.", graba: ["La primera frase va escrita antes de grabar.", "Algo se mueve en el primer segundo.", "Subtítulos o texto en pantalla.", "Termina pidiendo una acción concreta."], mide: "Retención a los 3 segundos, guardados y seguidores nuevos.", evita: "Poner lo mejor al final." },
    carrusel: { funcion: "Valor que se guarda y se comparte.", duracion: "6 a 9 láminas.", graba: ["La portada se entiende en un segundo.", "Una sola idea por lámina.", "Máximo 30 palabras por lámina.", "La última lámina pide una acción."], mide: "Guardados y compartidos.", evita: "Párrafos largos: si parece documento, no se lee." },
    tiktok: { funcion: "Personalidad y tendencias: aquí vive tu 30%.", duracion: "15 a 60 segundos.", graba: ["Suena a conversación, no a guion leído.", "Empieza en medio de la acción.", "Responde comentarios con video.", "Prueba dos ganchos para la misma idea."], mide: "Comentarios y veces que lo comparten.", evita: "Subir el mismo reel con marca de agua de otra red." },
    video_largo: { funcion: "Confianza: quien llega aquí ya está pensando en comprarte.", duracion: "5 a 10 minutos o 600 a 1.000 palabras.", graba: ["El título dice qué va a lograr quien lo vea.", "Los primeros 30 segundos dicen qué viene.", "Ejemplos reales, no solo teoría.", "Marca 3 momentos para recortar en reels."], mide: "Tiempo de visualización y mensajes que llegan después.", evita: "Pensar que es «demasiado largo»: quien te sigue quiere el detalle." }
  };

  /* Estrategia por camino: qué priorizar. */
  const ESTRATEGIA = {
    negocio: { meta: "Que tu contenido traiga mensajes preguntando precio.", mezcla: "Detrás de cámaras, casos de clientas, objeciones respondidas y antes y después.", consejo: "Cada semana, al menos una pieza que muestre el proceso y una que responda una duda de compra.", evita: "Publicar solo fotos del producto con el precio." },
    "marca-personal": { meta: "Que te conozcan por lo que sabes y confíen en ti.", mezcla: "Tu historia, opiniones, consejos accionables y un día contigo.", consejo: "Cuenta lo que vives, no solo lo que sabes: la gente sigue personas.", evita: "Dar consejos genéricos que podría decir cualquiera." },
    ugc: { meta: "Demostrar que sabes vender un producto ajeno de forma natural.", mezcla: "Primeras impresiones, tutoriales de uso, problema y solución, y antes y después.", consejo: "Arma tu portafolio con 3 a 5 videos de productos que ya tienes en casa, aunque nadie te haya pagado todavía.", evita: "Grabar como anuncio de televisión: las marcas buscan naturalidad." }
  };

  /* Ajustes por objetivo. */
  const AJUSTE_OBJETIVO = {
    vender: "Termina cada pieza con una invitación clara a escribirte. Habla de para quién es y qué incluye.",
    confianza: "Muestra procesos, casos y errores corregidos. Explica el porqué de lo que haces.",
    alcance: "Ganchos fuertes, temas amplios y formatos que se comparten: listas, mitos y errores.",
    comunidad: "Pregunta, responde y comparte tu día. Usa encuestas y responde comentarios con video."
  };

  if (D) Object.assign(D, { GANCHOS, GUIA_FORMATOS, ESTRATEGIA, AJUSTE_OBJETIVO });
})(typeof window !== "undefined" ? window : globalThis);
