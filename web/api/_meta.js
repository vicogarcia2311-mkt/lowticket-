// Server-only Meta Conversions API. Never log credentials or personal data.
const { createHash } = require("node:crypto");
const hash = v => createHash("sha256").update(v).digest("hex");
const clean = (v,re,max=600) => typeof v==="string" && v.length<=max && re.test(v) ? v : undefined;
async function metaLead(req,data,lead){
  if(data.meta_consent!==true || lead.consentimiento!==true) return;
  const pixel=process.env.META_PIXEL_ID, token=process.env.META_CAPI_ACCESS_TOKEN;
  const event_id=clean(data.meta_event_id,/^[A-Za-z0-9_-]+$/,100);
  if(!pixel||!token||!event_id)return;
  const user_data={em:[hash(lead.email.trim().toLowerCase())]};
  const phone=lead.whatsapp.replace(/\D/g,"");if(phone)user_data.ph=[hash(phone)];
  const fbp=clean(data.meta_fbp,/^fb\.\d+\.\d+\.[A-Za-z0-9_-]+$/);
  const fbc=clean(data.meta_fbc,/^fb\.\d+\.\d+\.[A-Za-z0-9_-]+$/);
  if(fbp)user_data.fbp=fbp;if(fbc)user_data.fbc=fbc;
  const ip=req.headers["x-forwarded-for"];if(typeof ip==="string")user_data.client_ip_address=ip.split(",")[0].trim();
  if(typeof req.headers["user-agent"]==="string")user_data.client_user_agent=req.headers["user-agent"];
  const ctrl=new AbortController(), timeout=setTimeout(()=>ctrl.abort(),3000);
  try{
    const response=await fetch("https://graph.facebook.com/v23.0/"+encodeURIComponent(pixel)+"/events",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify({data:[{event_name:"Lead",event_time:Math.floor(Date.now()/1000),event_id,action_source:"website",event_source_url:"https://valentinamkt.online/camino",user_data}]}),signal:ctrl.signal});
    const result=await response.json().catch(()=>({}));if(!response.ok||!result.events_received)console.error("Meta Lead delivery failed",response.status,result.error?.code);
  }catch(e){console.error("Meta Lead delivery failed",e.name);}finally{clearTimeout(timeout);}
}
module.exports={metaLead};
