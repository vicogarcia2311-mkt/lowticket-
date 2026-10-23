/**
 * Control de ventas · Valentina García (valentinamkt.online)
 * Script del Google Sheet "Valentina_Control_Ventas". Lo instala Valen en: Extensiones → Apps Script.
 *
 * - configurar(): crea las pestañas Resumen, Leads, Ventas y Links UTM con sus columnas y fórmulas. Correr una vez.
 * - doPost(e): recibe los eventos desde n8n (lead_nuevo, lead_indeciso, venta_aprobada, reembolso, contracargo).
 *
 * Supabase es la base principal; esta hoja es la vista para el equipo. No editar Leads ni Ventas a mano.
 */

const SECRETO = 'PEGAR_AQUI_EL_SECRETO';   // el mismo que usa n8n (llavero de JM: sheet-valen-secreto)

const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const COL_LEADS = ['Fecha', 'Nombre', 'Correo', 'WhatsApp', 'Camino', 'Indecisa', 'Bloqueo', 'Objetivo', 'Situación',
                   'Fuente (utm_source)', 'Medio (utm_medium)', 'Campaña (utm_campaign)', 'Pieza (utm_content)', 'Término (utm_term)',
                   'Compró', 'Actualizado'];
const COL_VENTAS = ['Fecha', 'Pago ID', 'Correo', 'Nombre', 'Producto', 'Monto', 'Moneda', 'Camino', 'Estado',
                    'Fuente (utm_source)', 'Medio (utm_medium)', 'Campaña (utm_campaign)', 'Pieza (utm_content)', 'Término (utm_term)'];
const CAMINOS = { 'negocio': 'Negocio', 'marca-personal': 'Marca personal', 'ugc': 'UGC', 'por-definir': 'Por definir' };

function configurar() {
  const ss = SpreadsheetApp.getActive();
  const hoja = (nombre, cols) => {
    let h = ss.getSheetByName(nombre) || ss.insertSheet(nombre);
    if (cols) {
      h.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold').setBackground('#FFF393');
      h.setFrozenRows(1);
    }
    return h;
  };
  const leads = hoja('Leads', COL_LEADS);
  const ventas = hoja('Ventas', COL_VENTAS);

  // Resumen
  const r = hoja('Resumen');
  r.clear();
  const filas = [
    ['Resumen del lanzamiento', ''],
    ['Leads totales', '=COUNTA(Leads!C2:C)'],
    ['Leads Negocio', '=COUNTIF(Leads!E2:E,"Negocio")'],
    ['Leads Marca personal', '=COUNTIF(Leads!E2:E,"Marca personal")'],
    ['Leads UGC', '=COUNTIF(Leads!E2:E,"UGC")'],
    ['Indecisas (al grupo)', '=COUNTIF(Leads!F2:F,"Sí")'],
    ['Ventas aprobadas', '=COUNTIF(Ventas!I2:I,"aprobada")'],
    ['Ingresos aprobados', '=SUMIFS(Ventas!F2:F,Ventas!I2:I,"aprobada")'],
    ['Reembolsos', '=COUNTIF(Ventas!I2:I,"reembolsada")'],
    ['Conversión lead → venta', '=IFERROR(B7/B2,0)'],
    ['', ''],
    ['Leads y ventas por fuente y campaña', '']
  ];
  r.getRange(1, 1, filas.length, 2).setValues(filas);
  r.getRange('A1').setFontWeight('bold').setFontSize(14);
  r.getRange('A12').setFontWeight('bold');
  r.getRange('B10').setNumberFormat('0.0%');
  r.getRange('A13').setFormula(
    '=QUERY({Leads!J2:J,Leads!L2:L,Leads!O2:O},"select Col1, Col2, count(Col1), sum(Col3) where Col1 is not null group by Col1, Col2 label Col1 \'Fuente\', Col2 \'Campaña\', count(Col1) \'Leads\', sum(Col3) \'Ventas\'",0)');
  r.setColumnWidth(1, 260);

  // Generador de links con UTM
  const u = hoja('Links UTM', ['Página', 'Fuente (utm_source)', 'Medio (utm_medium)', 'Campaña (utm_campaign)', 'Pieza (utm_content)', 'Link listo para usar']);
  u.getRange('A2:E4').setValues([
    ['https://valentinamkt.online/', 'instagram', 'bio', 'workshop-nov', 'link-bio'],
    ['https://valentinamkt.online/', 'instagram', 'reel', 'workshop-nov', 'reel-01'],
    ['https://valentinamkt.online/', 'whatsapp', 'grupo', 'workshop-nov', 'mensaje-01']
  ]);
  u.getRange('F2').setFormula('=ARRAYFORMULA(IF(A2:A="","",A2:A&"?utm_source="&ENCODEURL(B2:B)&"&utm_medium="&ENCODEURL(C2:C)&"&utm_campaign="&ENCODEURL(D2:D)&"&utm_content="&ENCODEURL(E2:E)))');
  u.getRange('A6').setValue('Escribe en minúscula y sin espacios (usa guiones). Una fila por publicación o mensaje; copia el link de la columna F.');

  // La hoja inicial vacía se elimina si existe
  ['Hoja 1', 'Sheet1'].forEach(n => { const h = ss.getSheetByName(n); if (h && ss.getSheets().length > 1) ss.deleteSheet(h); });
  ss.setActiveSheet(r);
}

function doPost(e) {
  let ev;
  try { ev = JSON.parse(e.postData.contents); } catch (err) { return salida({ ok: false, error: 'json' }); }
  if (ev.secreto !== SECRETO) return salida({ ok: false, error: 'secreto' });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActive();
    const d = ev.datos || {};
    const ahora = new Date();

    if (ev.tipo === 'lead_nuevo' || ev.tipo === 'lead_indeciso') {
      const h = ss.getSheetByName('Leads');
      const fila = [ahora, d.nombre || '', (d.email || '').toLowerCase(), d.whatsapp || '', CAMINOS[d.angulo] || d.angulo || '',
                    ev.tipo === 'lead_indeciso' ? 'Sí' : 'No', d.bloqueo || '', d.objetivo || '', d.situacion || '']
                    .concat(UTM.map(k => d[k] || ''));
      const n = buscar(h, 3, fila[2]);
      if (n) {
        const compro = h.getRange(n, 15).getValue();
        h.getRange(n, 2, 1, fila.length - 1).setValues([fila.slice(1)]);   // conserva la fecha de primer registro
        h.getRange(n, 15, 1, 2).setValues([[compro, ahora]]);
      } else {
        h.appendRow(fila.concat([0, ahora]));
      }
    } else if (ev.tipo === 'venta_aprobada') {
      const v = ss.getSheetByName('Ventas'), l = ss.getSheetByName('Leads');
      const email = (d.email || '').toLowerCase();
      if (!buscar(v, 2, d.pago_id)) {
        const nl = buscar(l, 3, email);
        const lead = nl ? l.getRange(nl, 1, 1, 14).getValues()[0] : null;
        v.appendRow([ahora, d.pago_id || '', email, d.nombre || (lead ? lead[1] : ''), d.producto || '', d.monto || '',
                     (d.moneda || 'usd').toUpperCase(), CAMINOS[d.angulo] || (lead ? lead[4] : ''), 'aprobada']
                     .concat(lead ? lead.slice(9, 14) : ['', '', '', '', '']));
        if (nl) l.getRange(nl, 15).setValue((Number(l.getRange(nl, 15).getValue()) || 0) + 1);
      }
    } else if (ev.tipo === 'reembolso' || ev.tipo === 'contracargo') {
      const v = ss.getSheetByName('Ventas');
      const n = buscar(v, 2, d.pago_id);
      if (n) v.getRange(n, 9).setValue(ev.tipo === 'reembolso' ? 'reembolsada' : 'contracargo');
    }
    return salida({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function buscar(hoja, col, valor) {
  if (!valor) return 0;
  const ultima = hoja.getLastRow();
  if (ultima < 2) return 0;
  const vals = hoja.getRange(2, col, ultima - 1, 1).getValues();
  for (let i = 0; i < vals.length; i++) if (String(vals[i][0]).toLowerCase() === String(valor).toLowerCase()) return i + 2;
  return 0;
}

function salida(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
