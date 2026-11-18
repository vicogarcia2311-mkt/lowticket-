/* Registro directo del taller: reutiliza APIs, consentimiento y pixel de Camino. */
(function(){
"use strict";
const dialog=document.getElementById("registro-dialog"), form=document.getElementById("lead-form"), message=document.getElementById("msg"), submit=form.querySelector('button[type="submit"]');
const thankyou=document.getElementById("registro-ok"), pending=document.getElementById("registro-pendiente"), group=document.getElementById("grupo-taller");
let busy=false, pendingLeadKey="", pendingEventId="";
function showMessage(value){message.textContent=value;message.hidden=false;}
function openForm(){
  evento("formulario");
  if(typeof dialog.showModal==="function")dialog.showModal();else dialog.setAttribute("open","");
  if(!pending.hidden)setTimeout(()=>document.getElementById("nombre").focus(),0);
}
function closeForm(){if(typeof dialog.close==="function")dialog.close();else dialog.removeAttribute("open");}
document.querySelectorAll("[data-open-form]").forEach(button=>button.addEventListener("click",openForm));
document.querySelectorAll("[data-close-form]").forEach(button=>button.addEventListener("click",closeForm));
dialog.addEventListener("click",event=>{if(event.target===dialog)closeForm();});
if(CONFIG.whatsappGrupo){group.href=CONFIG.whatsappGrupo;group.addEventListener("click",()=>evento("grupo"));}else{group.hidden=true;}
form.addEventListener("submit",async event=>{
 event.preventDefault();if(busy)return;message.hidden=true;
 const data=Object.fromEntries(new FormData(form).entries());
 const raw=(data.whatsapp||"").trim(),local=raw.replace(/\D/g,"").replace(/^0+/,"");
 const phone=raw.startsWith("+")?"+"+raw.replace(/\D/g,""):(data.pais||"+57")+local;
 const email=(data.email||"").trim();
 if(!(data.nombre||"").trim() || !/^\S+@\S+\.\S+$/.test(email) || phone.replace(/\D/g,"").length<8 || local.length<6){
   showMessage("Revisa tu nombre, correo y número de WhatsApp.");return;
 }
 if(!form.consent.checked){showMessage("Necesitamos tu autorización para tratar tus datos.");return;}
 const key=email.toLowerCase()+"|"+phone;
 if(key!==pendingLeadKey||!pendingEventId){pendingLeadKey=key;pendingEventId=window.crypto?.randomUUID?.() || nuevoId();}
 const meta=metaDetails(pendingEventId);
 const lead={event:"lead",producto:"Workshop "+OFERTA.titulo,nombre:data.nombre.trim(),email,whatsapp:phone,angulo:"por-definir",indeciso:true,bloqueo:"",objetivo:"Información del taller",situacion:"Registro directo",consentimiento:true,consentimiento_at:new Date().toISOString(),politica_version:CONFIG.politicaVersion};
 busy=true;submit.disabled=true;
 const original=submit.innerHTML;submit.textContent="GUARDANDO REGISTRO...";
 let saved=false;try{saved=await send(Object.assign(lead,currentParams(),meta));}catch(e){saved=false;}
 busy=false;submit.disabled=false;submit.innerHTML=original;
 if(!saved){showMessage("No pudimos confirmar el registro. Por favor, inténtalo de nuevo.");return;}
 ss("vm_lead",{nombre:lead.nombre,email:lead.email,angulo:lead.angulo,indeciso:true});ls("vm_lead",{nombre:lead.nombre,email:lead.email,angulo:lead.angulo,indeciso:true});
 evento("lead",{angulo:"por-definir",origen:"camino-directo"});if(meta.meta_event_id)track("Lead",{},meta.meta_event_id);
 pendingEventId="";pendingLeadKey="";
 pending.hidden=true;thankyou.hidden=false;
});
})();