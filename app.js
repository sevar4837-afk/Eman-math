let qs=[],i=0,score=0,sel=-1,sec=0,timer,name;
const $=x=>document.getElementById(x);
async function start(){name=$("name").value.trim();if(!name)return alert("ناوت بنووسە");let d=await fetch("/api/quiz").then(r=>r.json());qs=d.questions;if(!qs.length)return alert("هێشتا پرسیار زیاد نەکراوە");sec=d.minutes*60;$("start").classList.add("hide");$("quiz").classList.remove("hide");show();timer=setInterval(tick,1000);startLiveUpdates()}
function startLiveUpdates(){
  if(window.quizStream)window.quizStream.close();
  window.quizStream=new EventSource("/api/quiz/stream");
  window.quizStream.onmessage=e=>{
    try{const d=JSON.parse(e.data);
      const oldLength=qs.length;
      qs=d.questions;
      if(!qs.length){window.quizStream.close();return;}
      if(i>=qs.length)i=qs.length-1;
      if(qs.length!==oldLength)show();
    }catch(err){}
  };
}
function tick(){sec--;$("clock").textContent=`⏱️ ${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`;if(sec<=0)finish()}
function show(){sel=-1;let x=qs[i];$("num").textContent=`پرسیار ${i+1} لە ${qs.length}`;$("q").textContent=x.q;$("bar").style.width=`${i/qs.length*100}%`;$("ans").innerHTML=x.a.map((a,j)=>`<button class="answer" onclick="pick(${j})">${String.fromCharCode(65+j)}. ${a}</button>`).join("");$("next").disabled=true}
function pick(n){sel=n;document.querySelectorAll(".answer").forEach((x,j)=>x.classList.toggle("sel",j===n));$("next").disabled=false}
function next(){if(sel<0)return;if(sel===qs[i].c)score++;i++;i>=qs.length?finish():show()}
async function finish(){clearInterval(timer);if(window.quizStream)window.quizStream.close();let total=qs.length,p=Math.round(score/total*100);$("quiz").classList.add("hide");$("result").classList.remove("hide");$("out").innerHTML=`<h2>${score} / ${total}</h2><h2>${p}%</h2><p>${p>=80?"زۆر باش! 👏":p>=50?"باشە! 💪":"هەوڵی زیاتر بدە 🌟"}</p>`;fetch("/api/result",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,score,total,percent:p})})}