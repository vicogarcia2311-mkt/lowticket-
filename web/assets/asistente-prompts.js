/* Biblioteca de prompts para usar en ChatGPT, Claude o Gemini. Se personalizan con los datos de la alumna.
   Variables: {camino} {nicho} {idea} {objetivo} {producto} {tema} {dolor} {deseo} {situacion} {publico} */
(function (root) {
  const D = root.ASIS_DATOS || (typeof require !== "undefined" ? require("./asistente-datos.js") : null);

  const CONTEXTO = `Actúa como estratega de contenido experta en la metodología de Valentina García (DocuSelling):
- Estructura 70/30: 70% contenido permanente que funciona por meses y 30% tendencias, audios y conexiones.
- Documentar para vender: las ideas salen de mi día a día real; se muestra el proceso, no solo el resultado.
- De una idea a infinitos contenidos: cada idea se cuenta en historias, reel, carrusel, TikTok y video largo o blog.

Sobre mí:
- Mi camino de contenido: {camino}.
- Mi nicho: {nicho}.
- Lo que ofrezco o muestro: {mi_producto}.
- A mi público le hablo así: «Si {situacion}, esto es para ti».
- Lo que más le duele: {dolor}. Lo que más quiere: {deseo}.
- Mi objetivo ahora: {objetivo}.

Escribe en español latinoamericano, cercano y directo, como yo hablaría a cámara. Nada de «hola, chicas» ni frases de anuncio. No prometas viralidad ni resultados garantizados.`;

  const PROMPTS = [
    // IDEAS
    { id: "cinco-formatos", grupo: "Ideas", titulo: "Mi idea en los 5 formatos", para: "Cuando tienes una idea y quieres sacarle todo el jugo.",
      texto: `{CONTEXTO}

Mi idea: «{idea}».

Cuéntala en 3 ángulos distintos. Para cada ángulo, dame historias, reel, carrusel, TikTok y video largo, cada uno con: gancho (primera frase lista para grabar), qué mostrar o decir, y cierre con una acción concreta. Marca si cada ángulo es 70 (permanente) o 30 (tendencia).` },
    { id: "30-ideas-dia", grupo: "Ideas", titulo: "30 ideas sacadas de mi día", para: "Cuando sientes que no tienes nada que mostrar.",
      texto: `{CONTEXTO}

Te voy a contar mi día normal: [describe tu mañana, tu tarde y tu noche, qué haces en tu trabajo y qué te preguntan tus clientes].

Con eso, dame 30 ideas de contenido que salgan de lo que ya hago. Organízalas en una tabla con: idea, momento del día del que sale, formato recomendado, y si es 70 o 30. Al menos 21 deben ser 70 (permanentes).` },
    { id: "banco-mes", grupo: "Ideas", titulo: "Banco de ideas para un mes", para: "Para planear un mes completo en una sentada.",
      texto: `{CONTEXTO}

Arma un banco de 20 ideas para el próximo mes alrededor de este problema de mi público: {dolor}. Y de este deseo: {deseo}.
Distribúyelas en: 5 detrás de cámaras, 4 errores comunes, 3 casos o antes y después, 3 preguntas frecuentes, 3 mitos y 2 tendencias (el 30%). Para cada una, un gancho listo para grabar.` },
    { id: "ideas-preguntas", grupo: "Ideas", titulo: "Ideas desde las preguntas de mis clientes", para: "Cuando quieres contenido que venda solo.",
      texto: `{CONTEXTO}

Estas son las preguntas que más me hacen: [pega aquí 5 a 10 preguntas reales de tus mensajes o comentarios].

Convierte cada pregunta en una pieza de contenido: elige el mejor formato, escribe el gancho y el cierre, y dime qué objeción de compra está respondiendo.` },
    // GANCHOS
    { id: "20-ganchos", grupo: "Ganchos", titulo: "20 ganchos para mi idea", para: "Cuando ya tienes la idea pero no sabes cómo empezar el video.",
      texto: `{CONTEXTO}

Mi idea: «{idea}».

Escríbeme 20 ganchos (primeras frases de 0 a 3 segundos) para un reel. 4 de cada tipo: curiosidad, error, número o lista, historia y contraste. Cada uno de máximo 12 palabras, listo para decir a cámara. Marca con ★ los 3 que tú usarías.` },
    { id: "ganchos-visuales", grupo: "Ganchos", titulo: "Ganchos visuales (sin hablar)", para: "Para reels donde no quieres salir hablando.",
      texto: `{CONTEXTO}

Mi idea: «{idea}».

Dame 10 ganchos visuales para el primer segundo de un reel: qué se ve en pantalla, qué texto aparece encima y qué movimiento hace la cámara. Pensados para grabar con el celular, sin equipo profesional.` },
    { id: "mejorar-gancho", grupo: "Ganchos", titulo: "Mejorar un gancho que no funcionó", para: "Cuando un reel tuvo poca retención.",
      texto: `{CONTEXTO}

Este es el gancho de un reel que tuvo poca retención: «[pega tu gancho]». El video trataba de: [explica de qué era].

Dime por qué probablemente no retuvo y dame 8 versiones mejores, explicando en una línea qué cambia en cada una.` },
    // GUIONES
    { id: "guion-reel", grupo: "Guiones", titulo: "Guion de reel de 30 segundos", para: "Para grabar sin improvisar.",
      texto: `{CONTEXTO}

Escribe el guion de un reel de 30 segundos sobre: «{idea}».
Formato en tabla: segundo, lo que se ve (toma), lo que digo, texto en pantalla. Gancho en los primeros 3 segundos y cierre con una acción concreta. Pensado para grabar con el celular en mi espacio de trabajo.` },
    { id: "guion-historias", grupo: "Guiones", titulo: "Secuencia de historias que vende", para: "Para un día en el que quieres recibir mensajes.",
      texto: `{CONTEXTO}

Diseña una secuencia de 7 historias sobre «{idea}» que termine en mensajes por DM. Para cada historia: qué grabo, el texto corto encima y el sticker (encuesta, pregunta, deslizador o link). La venta va al final, sin presionar.` },
    { id: "guion-largo", grupo: "Guiones", titulo: "Guion de video largo o blog", para: "Para YouTube, un blog o un video de 5 a 10 minutos.",
      texto: `{CONTEXTO}

Escribe la estructura de un video de 8 minutos sobre «{idea}»: título que dice el resultado, gancho de 30 segundos, 4 secciones (problema, mi caso, paso a paso, errores) y cierre. Marca 3 momentos que se puedan recortar como reels.` },
    { id: "storytelling", grupo: "Guiones", titulo: "Mi historia en 3 actos", para: "Para contar por qué hago lo que hago.",
      texto: `{CONTEXTO}

Ayúdame a contar mi historia en 3 actos (antes, el momento que lo cambió todo, hoy). Te cuento lo que pasó: [escribe tu historia en tus palabras, sin preocuparte por cómo suena].

Devuélvemela en tres versiones: reel de 45 segundos, carrusel de 7 láminas y caption largo para un post.` },
    // CARRUSELES Y TEXTOS
    { id: "carrusel", grupo: "Carruseles y textos", titulo: "Carrusel de 8 láminas", para: "Para contenido que se guarda.",
      texto: `{CONTEXTO}

Escribe un carrusel de 8 láminas sobre «{idea}». Lámina 1: portada con la promesa (máximo 8 palabras). Láminas 2 a 7: un punto por lámina, máximo 30 palabras. Lámina 8: acción concreta. Además, la descripción del post con un gancho en la primera línea.` },
    { id: "caption", grupo: "Carruseles y textos", titulo: "Caption que conecta", para: "Para la descripción de cualquier publicación.",
      texto: `{CONTEXTO}

Escribe 3 captions para una publicación sobre «{idea}»: uno corto (2 líneas), uno medio (5 líneas, con una mini historia) y uno largo (storytelling). Todos con la primera línea como gancho y una pregunta o acción al final.` },
    { id: "bio", grupo: "Carruseles y textos", titulo: "Bio de Instagram", para: "Para que quien llega a tu perfil entienda en 3 segundos qué haces.",
      texto: `{CONTEXTO}

Escribe 5 opciones de bio de Instagram (máximo 150 caracteres). Cada una debe decir: qué hago, para quién, qué resultado ayudo a lograr y una llamada a la acción hacia mi link.` },
    // PLANEACIÓN
    { id: "calendario-semana", grupo: "Planeación", titulo: "Calendario de 7 días 70/30", para: "Para planear la semana el domingo.",
      texto: `{CONTEXTO}

Arma mi calendario de contenido para 7 días respetando la estructura 70/30 (5 piezas permanentes y 2 de tendencia). Para cada día: formato, idea, gancho, qué grabar y cierre. Agrega historias diarias que documenten mi día. Ten en cuenta que tengo [escribe cuánto tiempo a la semana tienes para contenido].` },
    { id: "calendario-mes", grupo: "Planeación", titulo: "Plan de contenido de 30 días", para: "Para tener un mes resuelto.",
      texto: `{CONTEXTO}

Diseña un plan de 30 días con 4 publicaciones por semana más historias diarias. Organízalo por semanas con un tema por semana relacionado con {tema}. Incluye qué días son de venta, cuáles de comunidad y cuáles de alcance, según mi objetivo: {objetivo}.` },
    { id: "pilares", grupo: "Planeación", titulo: "Mis pilares de contenido", para: "Para dejar de publicar al azar.",
      texto: `{CONTEXTO}

Define mis 4 pilares de contenido. Para cada pilar: nombre, para qué sirve (alcance, confianza, venta o comunidad), 5 ideas de ejemplo y el formato que mejor le va. Al final, el porcentaje de cada pilar en mi mes.` },
    { id: "reutilizar", grupo: "Planeación", titulo: "Reciclar un contenido que funcionó", para: "Cuando algo te funcionó y quieres repetirlo sin copiarte.",
      texto: `{CONTEXTO}

Este contenido me funcionó: [pega el texto o describe el video y sus resultados].

Dame 10 formas de reutilizarlo: otros formatos, otros ángulos, una segunda parte, una respuesta a comentarios y una versión para dentro de 3 meses.` },
    // MÉTRICAS
    { id: "metricas", grupo: "Métricas", titulo: "Leer mis métricas", para: "Cada semana, para saber qué repetir.",
      texto: `{CONTEXTO}

Estas son las métricas de mis últimas publicaciones: [pega por publicación: tipo, tema, visualizaciones, retención, guardados, compartidos, comentarios y seguidores nuevos].

Dime qué funcionó, qué no y por qué. Luego dame 3 decisiones concretas para la próxima semana.` },
    // VENTAS
    { id: "venta-sin-vender", grupo: "Ventas", titulo: "Contenido que vende sin parecer venta", para: "Cuando quieres recibir mensajes sin sonar a anuncio.",
      texto: `{CONTEXTO}

Dame 10 ideas de contenido que lleven a comprar {producto} sin que parezca publicidad: detrás de cámaras, casos, objeciones respondidas y preguntas frecuentes. Para cada una, el gancho y la acción final que lleva a escribirme.`, caminos: ["negocio", "marca-personal"] },
    { id: "objeciones", grupo: "Ventas", titulo: "Responder objeciones", para: "Para el «está caro» y el «lo voy a pensar».",
      texto: `{CONTEXTO}

Mis clientes me dicen estas objeciones: [escribe las que te dicen, por ejemplo: está caro, no tengo tiempo, lo voy a pensar].

Para cada una dame: qué hay detrás de verdad, una respuesta corta para DM y una idea de contenido que la responda antes de que me la digan.` },
    { id: "dm", grupo: "Ventas", titulo: "Responder mensajes y comentarios", para: "Para convertir conversaciones en ventas.",
      texto: `{CONTEXTO}

Escríbeme respuestas para estas situaciones en DM: alguien pregunta el precio, alguien dice que lo va a pensar, alguien deja de responder y alguien pide descuento. Tono cálido, corto, sin presionar, siempre con una pregunta que mantenga la conversación.`, caminos: ["negocio", "marca-personal"] },
    { id: "lanzamiento", grupo: "Ventas", titulo: "Contenido para un lanzamiento", para: "Cuando vas a sacar algo nuevo.",
      texto: `{CONTEXTO}

Voy a lanzar: [describe lo que vas a lanzar, precio y fecha].

Arma la secuencia de contenido de 10 días: expectativa (días 1 a 4), apertura (día 5), prueba y objeciones (días 6 a 9) y cierre (día 10). Para cada día, formato, idea, gancho y cierre.`, caminos: ["negocio", "marca-personal"] },
    // UGC
    { id: "pitch-marca", grupo: "UGC", titulo: "Mensaje para proponerme a una marca", para: "Para escribirle a una marca por primera vez.",
      texto: `{CONTEXTO}

Escribe 3 versiones de un mensaje corto (máximo 120 palabras) para proponerme como creadora UGC a la marca [nombre de la marca], que vende [qué vende]. Debe mencionar algo específico de la marca, qué tipo de video haría para ellos y cerrar con una pregunta. Sin sonar desesperada ni genérica.`, caminos: ["ugc"] },
    { id: "portafolio", grupo: "UGC", titulo: "Ideas para mi portafolio UGC", para: "Para armar portafolio sin que nadie te haya contratado.",
      texto: `{CONTEXTO}

Tengo en casa estos productos: [escribe 5 productos que tengas]. Dame una idea de video UGC para cada uno, usando formatos distintos: unboxing, problema y solución, tutorial, antes y después y testimonio. Para cada uno, el guion de 20 segundos.`, caminos: ["ugc"] },
    { id: "brief", grupo: "UGC", titulo: "Convertir el brief de una marca en guiones", para: "Cuando una marca te manda lo que quiere.",
      texto: `{CONTEXTO}

Esta es la información que me mandó la marca: [pega el brief].

Dame 3 guiones distintos de 30 segundos con gancho, desarrollo y llamada a la acción, más 5 ganchos alternativos para que la marca pueda probar en pauta.`, caminos: ["ugc"] },
    { id: "tarifas", grupo: "UGC", titulo: "Armar mis paquetes y tarifas", para: "Para saber qué ofrecer y cómo presentarlo.",
      texto: `{CONTEXTO}

Ayúdame a armar 3 paquetes de servicios UGC (básico, estándar y completo): qué incluye cada uno (número de videos, ganchos alternativos, derechos de uso, entregables) y cómo presentarlos en un documento de una página. No me des precios: dime qué debo tener en cuenta para definirlos.`, caminos: ["ugc"] }
  ];

  if (D) Object.assign(D, { CONTEXTO_PROMPT: CONTEXTO, PROMPTS });
})(typeof window !== "undefined" ? window : globalThis);
