const express=require("express"),fs=require("fs"),path=require("path"),{EventEmitter}=require("events");
const app=express(); app.use(express.json()); app.use(express.static(path.join(__dirname,"public")));
const DATA=path.join(__dirname,"data.json");
const ADMIN=process.env.ADMIN_CODE||"123456", TG=process.env.TELEGRAM_BOT_TOKEN||"", CHAT=process.env.TELEGRAM_CHAT_ID||"";
const quizEvents=new EventEmitter();
function load(){try{return JSON.parse(fs.readFileSync(DATA,"utf8"))}catch(e){let d={minutes:5,questions:[]};fs.writeFileSync(DATA,JSON.stringify(d,null,2));return d}}
function save(d){fs.writeFileSync(DATA,JSON.stringify(d,null,2))}
app.get("/api/quiz",(req,res)=>{let d=load();res.json({minutes:d.minutes,questions:d.questions.map(x=>({q:x.q,a:x.a}))})});
app.get("/api/quiz/stream",(req,res)=>{
  res.setHeader("Content-Type","text/event-stream");
  res.setHeader("Cache-Control","no-cache");
  res.setHeader("Connection","keep-alive");
  if(res.flushHeaders)res.flushHeaders();
  const send=()=>{let d=load();res.write(`data: ${JSON.stringify({minutes:d.minutes,questions:d.questions.map(x=>({q:x.q,a:x.a}))})}\n\n`)};
  send();
  const listener=()=>send();
  quizEvents.on("updated",listener);
  const keepAlive=setInterval(()=>res.write(": ping\n\n"),25000);
  req.on("close",()=>{clearInterval(keepAlive);quizEvents.off("updated",listener);});
});
app.post("/api/admin/login",(req,res)=>res.json({ok:String(req.body.code||"")===String(ADMIN)}));
app.get("/api/admin/data",(req,res)=>{if(req.headers["x-admin-code"]!==ADMIN)return res.status(401).end();res.json(load())});
app.post("/api/admin/save",(req,res)=>{if(req.headers["x-admin-code"]!==ADMIN)return res.status(401).end();
let b=req.body||{}, qs=Array.isArray(b.questions)?b.questions.map(x=>({q:String(x.q||"").trim(),a:Array.isArray(x.a)?x.a.slice(0,4).map(v=>String(v||"").trim()):[],c:Number(x.c)||0})).filter(x=>x.q&&x.a.length===4):[];
save({minutes:Math.max(1,Math.min(180,Number(b.minutes)||5)),questions:qs});
quizEvents.emit("updated");
res.json({ok:true})});
app.post("/api/result",async(req,res)=>{if(!TG||!CHAT)return res.json({ok:true,telegram:false});
let b=req.body||{},text=`🧮 ئەنجامی تاقیکردنەوەی بیرکاری\n\n👤 ناو: ${b.name||"-"}\n✅ نمرە: ${b.score}/${b.total}\n📊 ڕێژە: ${b.percent}%`;
try{let r=await fetch(`https://api.telegram.org/bot${TG}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:CHAT,text})});res.json({ok:r.ok})}catch(e){res.json({ok:false})}});
app.listen(process.env.PORT||3000,()=>console.log("running"));