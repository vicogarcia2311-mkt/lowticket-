// Separate VSL funnel; no writes to Camino tables. Live mode requires explicit configuration.
const {configured,rest}=require("./_supabase");
const {randomBytes,createHash,timingSafeEqual}=require("node:crypto");
const hash=v=>createHash("sha256").update(v).digest("hex");
const text=(v,max=200)=>typeof v==="string"?v.trim().slice(0,max):"";
const url=v=>{try{const u=new URL(v);return u.protocol==="https:"?u.href:"";}catch{return "";}};
const active=()=>process.env.VSL_LIVE==="si"&&configured()&&Boolean(url(process.env.VSL_VIDEO_URL)&&url(process.env.VSL_CALENDAR_URL)&&url(process.env.VSL_FILTER_URL)&&process.env.VSL_FILTER_SECRET&&process.env.VSL_BOOKING_SECRET);
const fail=(res,status,message)=>res.status(status).json({message});
const tokenOK=v=>typeof v==="string"&&/^[a-f0-9]{64}$/.test(v);
const eq=(a,b)=>{if(typeof a!=="string"||typeof b!=="string")return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);};
const query=(token)=>"vsl_applications?token_hash=eq."+hash(token);
async function find(token){if(!tokenOK(token))return null;const rows=await rest(query(token)+"&select=*&limit=1");return rows?.[0]||null;}
const metaId=()=>randomBytes(16).toString("hex");
const cookieId=v=>typeof v==="string"&&/^fb\.\d+\.\d+\.[A-Za-z0-9_-]{1,500}$/.test(v)?v:null;
const phoneOK=v=>/^\+[1-9]\d{7,14}$/.test(v);
const OPTIONS={profile:["Quiero empezar a crear contenido","Ya creo contenido y quiero monetizarlo","Tengo un negocio y quiero atraer clientes","Estoy explorando opciones"],goal:["Construir mi marca personal","Generar ingresos como creador/a","Vender más productos o servicios","Definir mi estrategia"],challenge:["No sé qué publicar","No tengo una estructura clara","No convierto mi contenido en ventas","Me cuesta ser constante"],timing:["Ahora","En los próximos 30 días","Más adelante","Solo estoy investigando"]};
async function requestJson(endpoint,body,headers){const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),4500);try{const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json",...headers},body:JSON.stringify(body),signal:controller.signal});if(!r.ok)throw Error("upstream "+r.status);return await r.json();}finally{clearTimeout(timeout);}}
async function meta(name,id,row,req){
 if(!row.meta_consent||!process.env.META_PIXEL_ID||!process.env.META_CAPI_ACCESS_TOKEN)return false;
 const user_data={em:[hash(row.email.toLowerCase())],ph:[hash(row.whatsapp.replace(/\D/g,""))]};
 if(row.fbp)user_data.fbp=row.fbp;if(row.fbc)user_data.fbc=row.fbc;
 if(row.client_ip)user_data.client_ip_address=row.client_ip;if(row.user_agent)user_data.client_user_agent=row.user_agent;
 try{const r=await requestJson("https://graph.facebook.com/v23.0/"+encodeURIComponent(process.env.META_PIXEL_ID)+"/events",{data:[{event_name:name,event_id:id,event_time:Math.floor(Date.now()/1000),action_source:"website",event_source_url:"https://valentinamkt.online/vsl"+(name==="Schedule"?"/gracias":"/registro"),user_data,custom_data:{content_name:"DocuSelling VSL"}}]},{Authorization:"Bearer "+process.env.META_CAPI_ACCESS_TOKEN});return Number(r.events_received)>0;}catch{console.error("VSL Meta delivery failed",name);return false;}
}
module.exports=async(req,res)=>{
 res.setHeader("Cache-Control","no-store");
 if(req.method==="GET")return res.status(200).json({live:active(),videoUrl:url(process.env.VSL_VIDEO_URL)||null});
 if(req.method!=="POST")return fail(res,405,"Método no permitido.");
 if(!active())return fail(res,503,"La aplicación todavía está en preparación.");
 let d=req.body;if(typeof d==="string"){try{d=JSON.parse(d);}catch{return fail(res,400,"Solicitud inválida.");}}if(!d||typeof d!=="object")return fail(res,400,"Solicitud inválida.");
 try{
  if(d.action==="register"){
   const nombre=text(d.nombre,120),email=text(d.email).toLowerCase(),whatsapp=text(d.phone,30).replace(/[\s()-]/g,"");
   if(!nombre||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!phoneOK(whatsapp)||d.consent!==true)return fail(res,422,"Revisa tus datos y la autorización.");
   const token=randomBytes(32).toString("hex"),eventId=metaId(),metaConsent=d.meta_consent===true;
   const utm={};for(const k of ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"])if(text(d.utm?.[k]))utm[k]=text(d.utm[k]);
   const row={token_hash:hash(token),nombre,email,whatsapp,consent:true,meta_consent:metaConsent,utm,fbp:metaConsent?cookieId(d.fbp):null,fbc:metaConsent?cookieId(d.fbc):null,client_ip:metaConsent?text(req.headers["x-forwarded-for"],120).split(",")[0].trim()||null:null,user_agent:metaConsent?text(req.headers["user-agent"],500)||null:null,lead_event_id:eventId};
   await rest("vsl_applications",{method:"POST",body:row,prefer:"return=minimal"});
   if(metaConsent)await meta("Lead",eventId,row,req);
   return res.status(201).json({token,eventId:metaConsent?eventId:null});
  }
  if(d.action==="booking"){
   // Only a trusted provider adapter may call this after verifying an actual booking.
   if(!eq(req.headers["x-vsl-booking-secret"],process.env.VSL_BOOKING_SECRET))return fail(res,401,"No autorizado.");
   if(!tokenOK(d.token)||!text(d.bookingId,200))return fail(res,422,"Reserva inválida.");
   const row=await find(d.token);if(!row||!["qualified","booked"].includes(row.status))return fail(res,409,"Aplicación no calificada.");
   const bookingId=text(d.bookingId,200);if(row.booking_id&&row.booking_id!==bookingId)return fail(res,409,"Ya existe una reserva.");
   const eventId=row.schedule_event_id||hash("vsl-schedule:"+row.id+":"+bookingId).slice(0,32);
   if(row.status!=="booked"){const updated=await rest(query(d.token)+"&status=eq.qualified",{method:"PATCH",body:{status:"booked",booking_id:bookingId,schedule_event_id:eventId,booked_at:new Date().toISOString()},prefer:"return=representation"});if(!updated?.length)return fail(res,409,"Reserva ya procesada; reintenta.");}
   if(row.schedule_meta_sent)return res.status(200).json({ok:true,duplicate:true});
   const sent=await meta("Schedule",eventId,row,req);if(sent)await rest(query(d.token),{method:"PATCH",body:{schedule_meta_sent:true},prefer:"return=minimal"});
   return res.status(200).json({ok:true,metaSent:sent});
  }
  if(!tokenOK(d.token))return fail(res,401,"Inicia tu aplicación.");
  const row=await find(d.token);if(!row)return fail(res,404,"Aplicación no encontrada.");
  if(d.action==="survey"){
   if(row.status!=="registered")return res.status(200).json({status:row.status});
   const answers={};for(const [key,values] of Object.entries(OPTIONS)){if(!values.includes(d.answers?.[key]))return fail(res,422,"Completa todas las preguntas.");answers[key]=d.answers[key];}
   // No invented scoring. External filter must return a boolean decision.
   let status="pending";
   try{const decision=await requestJson(url(process.env.VSL_FILTER_URL),{applicationId:row.id,answers},{Authorization:"Bearer "+process.env.VSL_FILTER_SECRET});if(decision.qualified===true)status="qualified";else if(decision.qualified===false)status="not_qualified";}catch{console.error("VSL qualification unavailable");}
   const updated=await rest(query(d.token)+"&status=eq.registered",{method:"PATCH",body:{answers,status,submitted_at:new Date().toISOString()},prefer:"return=representation"});
   if(!updated?.length){const latest=await find(d.token);return res.status(200).json({status:latest?.status||"pending"});}
   return res.status(200).json({status});
  }
  if(d.action==="status"){
   let calendarUrl=null;
   if(["qualified","booked"].includes(row.status)){
    // Provider must preserve this opaque reference and return it to its verified webhook adapter.
    const c=new URL(process.env.VSL_CALENDAR_URL);c.searchParams.set("utm_content",d.token);calendarUrl=c.href;
   }
   return res.status(200).json({status:row.status,calendarUrl});
  }
  return fail(res,400,"Acción inválida.");
 }catch(e){console.error("VSL API failure",e.name);return fail(res,502,"No pudimos completar este paso. Intenta nuevamente.");}
};