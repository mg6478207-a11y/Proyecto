// 🎮 RETOMATE - Grado 5 | Unidad 4: Geometría 3D
// 🏗️ "La Ciudad 3D del Zorrito Arquitecto"
// Una grúa se mueve arriba, el zorrito la controla.
// Debe soltar el bloque 3D correcto (cubo, esfera, pirámide, cilindro)
// sobre el hueco correcto de la ciudad según la pregunta.
// Controles: ← → mover grúa | ↑ soltar bloque | P pausar

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");
canvas.width  = 1000;
canvas.height = 600;

// ── ESTADO ────────────────────────────────────────────────────────────────────
let aciertos=0, currentQ=0, juegoTerminado=false, pausado=false, colisionLock=false, tiempo=0;
let feedbackTimer=0, feedbackMsg="", feedbackOk=true;
let particulas=[], estrellasFinal=[];
let bloqueVolando=null;
let grua = { x:200, vx:0 };
const GRUA_Y  = 60;
const SUELO_Y = 490;

// ── SONIDOS ───────────────────────────────────────────────────────────────────
const sndSoltar   = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");
const sndOk       = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const sndError    = new Audio("https://actions.google.com/sounds/v1/cartoon/concussive_guitar_hit.ogg");
const musicaFondo = new Audio("/static/sounds/fondo_modulo4.mp3");
musicaFondo.volume=0.35; musicaFondo.loop=true;
sndSoltar.volume=0.4; sndOk.volume=0.6; sndError.volume=0.5;

// ── PREGUNTAS ─────────────────────────────────────────────────────────────────
// Cada pregunta: figura objetivo, pregunta sobre sus propiedades, 3 opciones de figura
const FIGURAS = ["cubo","esfera","pirámide","cilindro","cono","prisma"];
const preguntas = [
  { pregunta:"¿Qué figura tiene 6 caras, 12 aristas y 8 vértices?",     correctaFig:"cubo",     opciones:["cubo","esfera","pirámide"] },
  { pregunta:"¿Qué figura NO tiene aristas ni vértices?",               correctaFig:"esfera",   opciones:["pirámide","esfera","cilindro"] },
  { pregunta:"¿Qué figura tiene 5 caras, 8 aristas y 5 vértices?",      correctaFig:"pirámide", opciones:["cubo","cilindro","pirámide"] },
  { pregunta:"¿Qué figura tiene 2 bases circulares y 1 cara lateral?",  correctaFig:"cilindro", opciones:["cilindro","cono","esfera"] },
  { pregunta:"¿Qué figura tiene 1 base circular y termina en punta?",   correctaFig:"cono",     opciones:["pirámide","cono","cilindro"] },
  { pregunta:"¿Cuántas caras tiene un cubo?",                           correctaFig:"cubo",     opciones:["cubo","pirámide","cono"],     esConteo:true, respTexto:"6 caras" },
  { pregunta:"¿Qué figura ocupa un dado?",                              correctaFig:"cubo",     opciones:["esfera","cubo","pirámide"] },
  { pregunta:"¿Qué figura tiene forma de pelota?",                      correctaFig:"esfera",   opciones:["esfera","cono","prisma"] },
  { pregunta:"¿Qué figura tiene base rectangular y caras triangulares?",correctaFig:"pirámide", opciones:["cubo","pirámide","prisma"] },
  { pregunta:"¿Qué figura tiene forma de lata de refresco?",            correctaFig:"cilindro", opciones:["cono","pirámide","cilindro"] },
];

// ── SLOTS DE LA CIUDAD (posiciones donde caen los bloques) ────────────────────
let slots=[];
function generarSlots(q){
  slots=[];
  const xs=[200,480,760];
  for(let i=0;i<3;i++){
    slots.push({
      x:xs[i], y:SUELO_Y,
      figura: q.opciones[i],
      correcta: q.opciones[i]===q.correctaFig,
      bloqueEncima:null,
      sacudida:0
    });
  }
}

// ── EDIFICIOS DE FONDO (ciudad ya construida) ─────────────────────────────────
const edificios=[];
for(let i=0;i<12;i++){
  edificios.push({
    x:30+i*82, w:60+Math.random()*30,
    h:80+Math.random()*200,
    color:`hsl(${200+Math.random()*40},${40+Math.random()*30}%,${15+Math.random()*20}%)`
  });
}

// ── DIBUJO FIGURAS 3D ISOMÉTRICAS ────────────────────────────────────────────
function drawFigura3D(cx,cy,tipo,size,alpha=1){
  ctx.globalAlpha=alpha;
  const s=size;
  switch(tipo){
    case "cubo":{
      // top
      ctx.fillStyle="#00d4ff"; ctx.strokeStyle="#005577"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(cx,cy-s*0.5); ctx.lineTo(cx+s*0.7,cy); ctx.lineTo(cx,cy+s*0.5); ctx.lineTo(cx-s*0.7,cy); ctx.closePath(); ctx.fill(); ctx.stroke();
      // right
      ctx.fillStyle="#0088aa";
      ctx.beginPath(); ctx.moveTo(cx+s*0.7,cy); ctx.lineTo(cx+s*0.7,cy+s*0.8); ctx.lineTo(cx,cy+s*1.3); ctx.lineTo(cx,cy+s*0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      // left
      ctx.fillStyle="#004466";
      ctx.beginPath(); ctx.moveTo(cx-s*0.7,cy); ctx.lineTo(cx-s*0.7,cy+s*0.8); ctx.lineTo(cx,cy+s*1.3); ctx.lineTo(cx,cy+s*0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
    case "esfera":{
      const rg=ctx.createRadialGradient(cx-s*0.2,cy-s*0.3,s*0.05,cx,cy,s*0.7);
      rg.addColorStop(0,"#88ffff"); rg.addColorStop(0.6,"#00aacc"); rg.addColorStop(1,"#003344");
      ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(cx,cy,s*0.65,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#005577"; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle="rgba(255,255,255,0.4)"; ctx.beginPath(); ctx.ellipse(cx-s*0.2,cy-s*0.25,s*0.2,s*0.12,Math.PI*0.3,0,Math.PI*2); ctx.fill();
      break;
    }
    case "pirámide":{
      ctx.fillStyle="#0099bb"; ctx.strokeStyle="#004466"; ctx.lineWidth=2;
      // base
      ctx.beginPath(); ctx.moveTo(cx,cy+s*0.6); ctx.lineTo(cx+s*0.7,cy+s*0.2); ctx.lineTo(cx,cy-s*0.6); ctx.lineTo(cx-s*0.7,cy+s*0.2); ctx.closePath(); ctx.fill(); ctx.stroke();
      // cara derecha
      ctx.fillStyle="#006688";
      ctx.beginPath(); ctx.moveTo(cx,cy-s*1.1); ctx.lineTo(cx+s*0.7,cy+s*0.2); ctx.lineTo(cx,cy+s*0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
      // cara izquierda
      ctx.fillStyle="#003355";
      ctx.beginPath(); ctx.moveTo(cx,cy-s*1.1); ctx.lineTo(cx-s*0.7,cy+s*0.2); ctx.lineTo(cx,cy+s*0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
    case "cilindro":{
      // cara lateral
      ctx.fillStyle="#006688";
      ctx.fillRect(cx-s*0.5,cy-s*0.4,s,s*0.9);
      // base inferior
      ctx.fillStyle="#004466";
      ctx.beginPath(); ctx.ellipse(cx,cy+s*0.5,s*0.5,s*0.22,0,0,Math.PI*2); ctx.fill();
      // tapa superior
      ctx.fillStyle="#00aacc";
      ctx.beginPath(); ctx.ellipse(cx,cy-s*0.4,s*0.5,s*0.22,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#005577"; ctx.lineWidth=2; ctx.stroke();
      break;
    }
    case "cono":{
      ctx.fillStyle="#006688"; ctx.strokeStyle="#004466"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(cx,cy-s*0.9); ctx.lineTo(cx+s*0.55,cy+s*0.5); ctx.lineTo(cx-s*0.55,cy+s*0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#0099bb";
      ctx.beginPath(); ctx.ellipse(cx,cy+s*0.5,s*0.55,s*0.2,0,0,Math.PI*2); ctx.fill();
      break;
    }
    case "prisma":{
      ctx.fillStyle="#0077aa";
      ctx.beginPath(); ctx.moveTo(cx,cy-s*0.4); ctx.lineTo(cx+s*0.75,cy); ctx.lineTo(cx+s*0.75,cy+s*0.9); ctx.lineTo(cx-s*0.75,cy+s*0.9); ctx.lineTo(cx-s*0.75,cy); ctx.closePath(); ctx.fill();
      ctx.strokeStyle="#004466"; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle="#005588";
      ctx.beginPath(); ctx.moveTo(cx,cy-s*0.4); ctx.lineTo(cx+s*0.75,cy); ctx.lineTo(cx+s*0.75,cy+s*0.9); ctx.lineTo(cx,cy+s*0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
  }
  ctx.globalAlpha=1;
}

// ── FONDO CIUDAD NOCTURNA ─────────────────────────────────────────────────────
function drawFondo(){
  // Cielo
  const g=ctx.createLinearGradient(0,0,0,canvas.height);
  g.addColorStop(0,"#02020f"); g.addColorStop(0.6,"#0a0a2e"); g.addColorStop(1,"#050518");
  ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height);
  // Estrellas
  for(let i=0;i<80;i++){
    const sx=((i*173+tiempo*0.01)%canvas.width);
    const sy=((i*97)%260);
    const br=0.4+Math.sin(tiempo*0.05+i)*0.4;
    ctx.fillStyle=`rgba(255,255,255,${br})`; ctx.beginPath(); ctx.arc(sx,sy,0.8,0,Math.PI*2); ctx.fill();
  }
  // Luna
  ctx.shadowColor="#aaddff"; ctx.shadowBlur=20;
  ctx.fillStyle="#ddeeff"; ctx.beginPath(); ctx.arc(880,60,36,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#c8dff0"; ctx.beginPath(); ctx.arc(893,52,28,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur=0;
  // Edificios de fondo
  edificios.forEach(e=>{
    ctx.fillStyle=e.color; ctx.fillRect(e.x,SUELO_Y-e.h,e.w,e.h);
    // Ventanas
    ctx.fillStyle="rgba(255,220,100,0.4)";
    for(let fy=SUELO_Y-e.h+10;fy<SUELO_Y-10;fy+=22)
      for(let fx=e.x+8;fx<e.x+e.w-8;fx+=16)
        if(Math.sin(fx*fy)>0) ctx.fillRect(fx,fy,8,10);
  });
  // Suelo
  ctx.fillStyle="#0a0a25"; ctx.fillRect(0,SUELO_Y,canvas.width,canvas.height-SUELO_Y);
  ctx.strokeStyle="rgba(0,212,255,0.3)"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(0,SUELO_Y); ctx.lineTo(canvas.width,SUELO_Y); ctx.stroke();
  // Cuadrícula del suelo
  ctx.strokeStyle="rgba(0,212,255,0.08)"; ctx.lineWidth=1;
  for(let x=0;x<canvas.width;x+=50){ ctx.beginPath(); ctx.moveTo(x,SUELO_Y); ctx.lineTo(x,canvas.height); ctx.stroke(); }
}

// ── GRÚA ──────────────────────────────────────────────────────────────────────
function drawGrua(){
  const gx=grua.x;
  // Cable principal
  ctx.strokeStyle="#888"; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,GRUA_Y+10); ctx.stroke();
  // Brazo horizontal
  ctx.strokeStyle="#aaa"; ctx.lineWidth=8;
  ctx.beginPath(); ctx.moveTo(gx-180,GRUA_Y); ctx.lineTo(gx+60,GRUA_Y); ctx.stroke();
  // Torre vertical
  ctx.fillStyle="#334"; ctx.fillRect(gx+30,GRUA_Y,30,60);
  // Cables diagonales
  ctx.strokeStyle="#666"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(gx+45,GRUA_Y); ctx.lineTo(gx-100,GRUA_Y+10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(gx+45,GRUA_Y); ctx.lineTo(gx+10,GRUA_Y+10); ctx.stroke();
  // Gancho
  ctx.strokeStyle="#aaa"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(gx-100,GRUA_Y+10); ctx.lineTo(gx-100,GRUA_Y+45); ctx.stroke();
  // Zorrito en la grúa (pequeño)
  drawFoxMini(gx-100, GRUA_Y+45);
}

// ── ZORRITO MINI (en la grúa) ─────────────────────────────────────────────────
function drawFoxMini(x,y){
  // Casco de construcción
  ctx.fillStyle="#ffcc00"; ctx.beginPath(); ctx.ellipse(x,y-24,14,8,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#ffaa00"; ctx.fillRect(x-16,y-22,32,6);
  // Cabeza
  ctx.fillStyle="#ff9933"; ctx.fillRect(x-10,y-20,20,16);
  // Orejas
  ctx.fillStyle="#ff8000"; ctx.fillRect(x-12,y-24,5,5); ctx.fillRect(x+7,y-24,5,5);
  // Ojos nariz
  ctx.fillStyle="#000"; ctx.fillRect(x-7,y-14,3,3); ctx.fillRect(x+4,y-14,3,3); ctx.fillRect(x-2,y-9,3,2);
  // Cuerpo chaleco naranja
  ctx.fillStyle="#ff6600"; ctx.fillRect(x-9,y-4,18,16);
  // Brazos
  ctx.fillStyle="#ff9933"; ctx.fillRect(x-14,y-2,5,10); ctx.fillRect(x+9,y-2,5,10);
  // Piernas
  ctx.fillStyle="#334455"; ctx.fillRect(x-8,y+12,7,10); ctx.fillRect(x+1,y+12,7,10);
}

// ── SLOTS DE COLOCACIÓN ───────────────────────────────────────────────────────
function drawSlots(){
  slots.forEach((s,i)=>{
    const shake=s.sacudida>0?(Math.sin(s.sacudida*0.8)*4):0;
    if(s.sacudida>0) s.sacudida--;
    const sx=s.x+shake;
    // Base del slot (pedestal)
    ctx.fillStyle="#0d1a2a";
    ctx.fillRect(sx-55,s.y-20,110,20);
    ctx.strokeStyle="rgba(0,212,255,0.5)"; ctx.lineWidth=2;
    ctx.strokeRect(sx-55,s.y-20,110,20);
    // Número del pedestal
    ctx.fillStyle="#00aacc"; ctx.font="11px Minecraftia"; ctx.textAlign="center";
    ctx.fillText(["A","B","C"][i],sx,s.y-5); ctx.textAlign="left";
    // Figura encima del pedestal
    if(s.bloqueEncima){
      drawFigura3D(sx,s.y-60,s.bloqueEncima,28);
    } else {
      // Silueta fantasma de la figura esperada
      drawFigura3D(sx,s.y-60,s.figura,28,0.15);
    }
    // Etiqueta con nombre
    ctx.fillStyle="rgba(0,212,255,0.7)"; ctx.font="12px Minecraftia"; ctx.textAlign="center";
    ctx.fillText(s.figura.toUpperCase(),sx,s.y+14); ctx.textAlign="left";
    // Indicador si el zorrito está cerca
    const gx=grua.x-100;
    if(Math.abs(gx-sx)<70 && !colisionLock && !s.bloqueEncima){
      ctx.fillStyle="#00d4ff"; ctx.shadowColor="#00d4ff"; ctx.shadowBlur=10;
      ctx.font="18px Arial"; ctx.textAlign="center"; ctx.fillText("▼",sx,s.y-110);
      ctx.shadowBlur=0; ctx.textAlign="left";
    }
  });
}

// ── BLOQUE VOLANDO ────────────────────────────────────────────────────────────
function drawBloqueVolando(){
  if(!bloqueVolando) return;
  bloqueVolando.y+=bloqueVolando.vy;
  bloqueVolando.vy+=0.6;
  drawFigura3D(bloqueVolando.x,bloqueVolando.y,bloqueVolando.figura,30);
  // ¿Llegó al suelo/slot?
  if(bloqueVolando.y>SUELO_Y-60){
    // Buscar slot más cercano
    let closest=-1, minD=999;
    slots.forEach((s,i)=>{ const d=Math.abs(bloqueVolando.x-s.x); if(d<minD){minD=d;closest=i;} });
    if(closest>=0 && minD<80){
      const s=slots[closest];
      s.sacudida=20;
      crearParticulas(s.x,s.y-40, s.correcta?"#00d4ff":"#ff4444");
      if(s.correcta){
        aciertos++; feedbackMsg="¡Bloque correcto! 🏗️✨"; feedbackOk=true;
        sndOk.currentTime=0; sndOk.play();
        s.bloqueEncima=bloqueVolando.figura;
        crearParticulas(s.x,s.y-80,"#ffff44");
      } else {
        feedbackMsg=`¡Ese no! Era: ${preguntas[currentQ].correctaFig} 🏗️`; feedbackOk=false;
        sndError.currentTime=0; sndError.play();
      }
      feedbackTimer=85; bloqueVolando=null;
      setTimeout(()=>{ siguientePregunta(); colisionLock=false; },1000);
    } else {
      bloqueVolando=null; colisionLock=false;
    }
  }
}

// ── HUD ───────────────────────────────────────────────────────────────────────
function drawHUD(){
  if(currentQ>=preguntas.length) return;
  const q=preguntas[currentQ];
  ctx.fillStyle="rgba(2,2,20,0.82)";
  roundRect(ctx,10,10,980,75,12); ctx.fill();
  ctx.strokeStyle="rgba(0,212,255,0.4)"; ctx.lineWidth=1.5;
  roundRect(ctx,10,10,980,75,12); ctx.stroke();
  ctx.fillStyle="#00d4ff"; ctx.font="13px Minecraftia"; ctx.textAlign="left";
  ctx.fillText(`🏗️ Aciertos: ${aciertos}`,22,34);
  const bW=150;
  ctx.fillStyle="rgba(255,255,255,0.08)"; ctx.fillRect(22,42,bW,8);
  ctx.fillStyle="#00d4ff"; ctx.fillRect(22,42,bW*(currentQ/preguntas.length),8);
  ctx.strokeStyle="#00d4ff"; ctx.lineWidth=1; ctx.strokeRect(22,42,bW,8);
  ctx.fillStyle="#aaddff"; ctx.font="10px Minecraftia"; ctx.fillText(`${currentQ+1}/${preguntas.length}`,178,51);
  ctx.fillStyle="#ffffff"; ctx.font="15px Minecraftia"; ctx.textAlign="center";
  ctx.shadowColor="#00d4ff"; ctx.shadowBlur=5;
  ctx.fillText(q.pregunta,canvas.width/2+50,42);
  ctx.shadowBlur=0;
  ctx.fillStyle="#ffe066"; ctx.font="11px Minecraftia";
  ctx.fillText("↑ = SOLTAR BLOQUE EN EL SLOT CORRECTO",canvas.width/2+50,65);
  ctx.textAlign="left";
}

// ── FEEDBACK ──────────────────────────────────────────────────────────────────
function drawFeedback(){
  if(feedbackTimer<=0) return; feedbackTimer--;
  ctx.globalAlpha=Math.min(1,feedbackTimer/20);
  const c=feedbackOk?"#00d4ff":"#ff4444";
  ctx.font="bold 26px Minecraftia"; ctx.textAlign="center";
  ctx.fillStyle=c; ctx.shadowColor=c; ctx.shadowBlur=22;
  ctx.fillText(feedbackMsg,canvas.width/2,canvas.height/2-30);
  ctx.shadowBlur=0; ctx.globalAlpha=1; ctx.textAlign="left";
}

// ── PARTÍCULAS ────────────────────────────────────────────────────────────────
function crearParticulas(x,y,color){ for(let i=0;i<22;i++) particulas.push({x,y,vx:(Math.random()*8)-4,vy:(Math.random()*-7)-1,life:65,maxLife:65,color,r:2+Math.random()*5}); }
function drawParticulas(){ particulas.forEach(p=>{ ctx.globalAlpha=p.life/p.maxLife; ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=6; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0; p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.r*=0.97; p.life--; }); ctx.globalAlpha=1; particulas=particulas.filter(p=>p.life>0); }

function roundRect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r); c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h); c.lineTo(x+r,y+h); c.quadraticCurveTo(x,y+h,x,y+h-r); c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath(); }

// ── CONTROLES ────────────────────────────────────────────────────────────────
const keys={};
document.addEventListener("keydown",e=>{ keys[e.key]=true; if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault(); if(juegoTerminado||pausado||colisionLock) return; if(e.key==="ArrowUp"&&!keys["_act"]&&!bloqueVolando){ keys["_act"]=true; soltarBloque(); } if(e.key==="p"||e.key==="P"){ pausado=!pausado; if(pausado) musicaFondo.pause(); else musicaFondo.play(); } });
document.addEventListener("keyup",e=>{ keys[e.key]=false; if(e.key==="ArrowUp") keys["_act"]=false; });

function soltarBloque(){
  if(colisionLock||bloqueVolando) return;
  colisionLock=true;
  const gx=grua.x-100;
  // Buscar slot más cercano
  let closest=-1,minD=999;
  slots.forEach((s,i)=>{ const d=Math.abs(gx-s.x); if(d<minD){minD=d;closest=i;} });
  if(closest<0||minD>100){ colisionLock=false; return; }
  const q=preguntas[currentQ];
  bloqueVolando={ x:gx, y:GRUA_Y+50, vy:2, figura:q.correctaFig };
  // Redirigir al slot seleccionado
  bloqueVolando.x=slots[closest].x;
  sndSoltar.currentTime=0; sndSoltar.play();
}

function update(){
  if(juegoTerminado||pausado) return; tiempo++;
  if(keys["ArrowRight"]) grua.vx=5; else if(keys["ArrowLeft"]) grua.vx=-5; else grua.vx*=0.7;
  grua.x+=grua.vx;
  grua.x=Math.max(180,Math.min(grua.x,820));
}

function siguientePregunta(){
  currentQ++;
  if(currentQ>=preguntas.length){ terminarJuego(); return; }
  generarSlots(preguntas[currentQ]);
}

function terminarJuego(){
  juegoTerminado=true; estrellasFinal=[];
  for(let i=0;i<180;i++) estrellasFinal.push({x:Math.random()*canvas.width,y:Math.random()*-canvas.height,vy:0.8+Math.random()*2,r:1.5+Math.random()*3.5,color:["#00d4ff","#00ffcc","#ffff44","#ff8844","#aa66ff"][Math.floor(Math.random()*5)]});
  const puntaje=(aciertos/preguntas.length)*100;
  fetch("/guardar_progreso",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({grado:5,unidad:4,aciertos,total:preguntas.length,puntaje})}).then(r=>r.json()).then(d=>console.log("✅",d)).catch(e=>console.error("❌",e));
}

function drawFinal(){
  estrellasFinal.forEach(e=>{ ctx.strokeStyle=e.color; ctx.lineWidth=1.5; ctx.shadowColor=e.color; ctx.shadowBlur=8; ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; e.y+=e.vy; if(e.y>canvas.height+10) e.y=-10; });
  const pW=620,pH=270,px=(canvas.width-pW)/2,py=(canvas.height-pH)/2;
  ctx.fillStyle="rgba(2,2,20,0.93)"; roundRect(ctx,px,py,pW,pH,22); ctx.fill();
  ctx.strokeStyle="#00d4ff"; ctx.lineWidth=4; ctx.shadowColor="#00d4ff"; ctx.shadowBlur=20; roundRect(ctx,px+4,py+4,pW-8,pH-8,20); ctx.stroke(); ctx.shadowBlur=0;
  ctx.fillStyle="#00d4ff"; ctx.font="26px Minecraftia"; ctx.textAlign="center"; ctx.shadowColor="#00d4ff"; ctx.shadowBlur=10;
  ctx.fillText("🏙️ ¡Ciudad construida!",canvas.width/2,py+62); ctx.shadowBlur=0;
  ctx.fillStyle="#ffff44"; ctx.font="22px Minecraftia"; ctx.fillText(`⭐ ${aciertos} / ${preguntas.length} correctas`,canvas.width/2,py+108);
  const pct=Math.round((aciertos/preguntas.length)*100); const msg=pct===100?"¡Arquitecto maestro! 🏆":pct>=70?"¡Gran constructor! 🏗️":"¡Sigue practicando! 📐";
  ctx.fillStyle="#aaddff"; ctx.font="14px Minecraftia"; ctx.fillText(`${pct}% — ${msg}`,canvas.width/2,py+145);
  const bW=250,bH=54,bx=canvas.width/2-125,by=py+178;
  ctx.fillStyle="#050518"; roundRect(ctx,bx,by,bW,bH,12); ctx.fill(); ctx.strokeStyle="#00d4ff"; ctx.lineWidth=2.5; ctx.shadowColor="#00d4ff"; ctx.shadowBlur=10; roundRect(ctx,bx,by,bW,bH,12); ctx.stroke(); ctx.shadowBlur=0;
  ctx.fillStyle="#fff"; ctx.font="20px Minecraftia"; ctx.fillText("🔁 Reiniciar",canvas.width/2,by+36); ctx.textAlign="left";
}

function drawPausa(){ ctx.fillStyle="rgba(2,2,20,0.82)"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle="#00d4ff"; ctx.font="42px Minecraftia"; ctx.textAlign="center"; ctx.shadowColor="#00d4ff"; ctx.shadowBlur=18; ctx.fillText("⏸ Pausa",canvas.width/2,canvas.height/2-44); ctx.shadowBlur=0; const bW=250,bH=60,bx=canvas.width/2-125,by=canvas.height/2; ctx.fillStyle="#050518"; roundRect(ctx,bx,by,bW,bH,12); ctx.fill(); ctx.strokeStyle="#00d4ff"; ctx.lineWidth=2.5; roundRect(ctx,bx,by,bW,bH,12); ctx.stroke(); ctx.fillStyle="#fff"; ctx.font="22px Minecraftia"; ctx.fillText("▶ Continuar",canvas.width/2,by+39); ctx.textAlign="left"; }

canvas.addEventListener("click",e=>{ const rect=canvas.getBoundingClientRect(); const mx=e.clientX-rect.left,my=e.clientY-rect.top; if(pausado&&!juegoTerminado){ if(mx>=canvas.width/2-125&&mx<=canvas.width/2+125&&my>=canvas.height/2&&my<=canvas.height/2+60){ pausado=false; musicaFondo.play(); } } if(juegoTerminado){ const pH=270,py=(canvas.height-pH)/2,bW=250,bH=54,bx=canvas.width/2-125,by=py+178; if(mx>=bx&&mx<=bx+bW&&my>=by&&my<=by+bH) resetGame(); } });

function draw(){ ctx.clearRect(0,0,canvas.width,canvas.height); drawFondo(); if(!juegoTerminado){ drawSlots(); drawGrua(); drawBloqueVolando(); drawHUD(); drawFeedback(); drawParticulas(); } if(pausado&&!juegoTerminado) drawPausa(); if(juegoTerminado){ drawFinal(); drawParticulas(); } }
function resetGame(){ aciertos=0;currentQ=0;juegoTerminado=false;pausado=false;colisionLock=false;particulas=[];estrellasFinal=[];feedbackTimer=0;bloqueVolando=null;grua.x=200;grua.vx=0; generarSlots(preguntas[0]); }
function gameLoop(){ update(); draw(); requestAnimationFrame(gameLoop); }
resetGame(); gameLoop();
musicaFondo.play().catch(()=>document.addEventListener("keydown",()=>musicaFondo.play(),{once:true}));