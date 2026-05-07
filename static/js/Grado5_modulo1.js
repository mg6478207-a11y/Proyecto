// 🎮 RETOMATE - Grado 5 | Unidad 1: Números Naturales y Sistema Decimal
// 🌊 MODO: Zorrito Submarinista — mundo oceánico nocturno
// El zorrito nada y dispara burbujas hacia el valor posicional correcto
// Controles: ← → para nadar, ↑ para DISPARAR burbuja

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");
canvas.width  = 1000;
canvas.height = 600;

// ─── ESTADO GLOBAL ─────────────────────────────────────────────────────────────
let aciertos        = 0;
let currentQuestion = 0;
let juegoTerminado  = false;
let pausado         = false;
let colisionLock    = false;
let particulas      = [];
let burbujas        = [];       // proyectiles disparados
let objetivos       = [];       // tarjetas de respuesta flotantes
let peces           = [];       // peces decorativos
let algas           = [];       // algas del fondo
let burbujasDeco    = [];       // burbujas de fondo
let tiempo          = 0;
let feedbackTimer   = 0;
let feedbackMsg     = "";
let feedbackColor   = "#fff";
let estrellasFinal  = [];

// ─── SONIDOS ───────────────────────────────────────────────────────────────────
const sonidoDisparo  = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");
const sonidoCorrecto = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const sonidoError    = new Audio("https://actions.google.com/sounds/v1/cartoon/concussive_guitar_hit.ogg");
const musicaFondo    = new Audio("/static/sounds/fondo_G5_m1.mp3");

musicaFondo.volume   = 0.35;
musicaFondo.loop     = true;
sonidoDisparo.volume = 0.4;
sonidoCorrecto.volume= 0.6;
sonidoError.volume   = 0.5;

// ─── ZORRITO ──────────────────────────────────────────────────────────────────
let fox = { x: 80, y: 300, w: 44, h: 44, vy: 0, vx: 0, aletaAng: 0 };
const FOX_SPEED = 3.2;
const FOX_SWIM  = 2.8;
const GRAVITY   = 0.12;
const DRAG      = 0.88;

// ─── PREGUNTAS ─────────────────────────────────────────────────────────────────
const preguntas = [
  { numero:"3.472",   resalta:0, pregunta:"¿Qué valor tiene el 3 en 3.472?",          opciones:["3 millares","3 centenas","3 unidades"],          correcta:0 },
  { numero:"8.051",   resalta:1, pregunta:"¿Qué posición ocupa el 0 en 8.051?",        opciones:["Unidades","Centenas","Decenas"],                  correcta:1 },
  { numero:"25.300",  resalta:2, pregunta:"¿Qué valor tiene el 3 en 25.300?",          opciones:["3 decenas","300 unidades","3 millares"],          correcta:1 },
  { numero:"14.062",  resalta:0, pregunta:"¿Valor posicional del 1 en 14.062?",        opciones:["Millares","Decenas de millar","Centenas"],        correcta:1 },
  { numero:"607",     resalta:0, pregunta:"¿Cuánto vale el 6 en 607?",                 opciones:["6 unidades","6 decenas","600 unidades"],          correcta:2 },
  { numero:"50.904",  resalta:2, pregunta:"¿Qué valor tiene el 9 en 50.904?",          opciones:["9 decenas","900 unidades","9 millares"],          correcta:1 },
  { numero:"123.456", resalta:0, pregunta:"¿Posición del 1 en 123.456?",               opciones:["Centenas de millar","Dec. de millar","Millares"], correcta:0 },
  { numero:"7.809",   resalta:0, pregunta:"¿Cuánto vale el 7 en 7.809?",               opciones:["700 unidades","7 decenas","7.000 unidades"],      correcta:2 },
  { numero:"40.070",  resalta:3, pregunta:"¿Qué valor tiene el 7 en 40.070?",          opciones:["70 unidades","7 centenas","7 millares"],          correcta:0 },
  { numero:"299.001", resalta:0, pregunta:"¿Cuánto vale el primer 2 en 299.001?",      opciones:["2 millares","200.000 unidades","20.000 uds."],    correcta:1 },
];

// ─── COLORES TARJETAS ──────────────────────────────────────────────────────────
const CARD_COLORS = [
  { bg:"#0d3b6e", borde:"#4fc3f7", glow:"rgba(79,195,247,0.5)" },
  { bg:"#1b4332", borde:"#52b788", glow:"rgba(82,183,136,0.5)" },
  { bg:"#4a0e4e", borde:"#ce93d8", glow:"rgba(206,147,216,0.5)" },
];

// ─── INICIALIZAR MUNDO ─────────────────────────────────────────────────────────
function initMundo() {
  algas = [];
  for (let i = 0; i < 18; i++) {
    algas.push({
      x:     20 + i * 56 + Math.random() * 20,
      baseY: canvas.height,
      h:     55 + Math.random() * 90,
      w:     7  + Math.random() * 7,
      fase:  Math.random() * Math.PI * 2,
      vel:   0.015 + Math.random() * 0.02,
      color: Math.random() < 0.5 ? "#1b6b3a" : "#145a32"
    });
  }
  burbujasDeco = [];
  for (let i = 0; i < 30; i++) {
    burbujasDeco.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 2 + Math.random() * 5,
      vy: -(0.3 + Math.random() * 0.7),
      alfa: 0.25 + Math.random() * 0.45
    });
  }
  peces = [];
  const coloresPez = ["#f97316","#06b6d4","#a78bfa","#f43f5e","#fbbf24"];
  for (let i = 0; i < 6; i++) {
    peces.push({
      x:    Math.random() * canvas.width,
      y:    120 + Math.random() * 370,
      vx:   0.6 + Math.random() * 1.2,
      dir:  Math.random() < 0.5 ? 1 : -1,
      color: coloresPez[Math.floor(Math.random() * coloresPez.length)],
      size:  10 + Math.random() * 14,
      fase:  Math.random() * Math.PI * 2
    });
  }
}

// ─── GENERAR TARJETAS OBJETIVOS ────────────────────────────────────────────────
function generarObjetivos() {
  if (juegoTerminado || currentQuestion >= preguntas.length) return;
  const q = preguntas[currentQuestion];
  objetivos = [];
  const posY = [140, 278, 416];
  for (let i = 0; i < q.opciones.length; i++) {
    objetivos.push({
      x: 720 + Math.random() * 30,
      y: posY[i],
      w: 240, h: 72,
      texto: q.opciones[i],
      correcta: i === q.correcta,
      color: CARD_COLORS[i],
      oscAmp:  7 + Math.random() * 8,
      oscVel:  0.018 + Math.random() * 0.012,
      oscFase: Math.random() * Math.PI * 2,
      golpeTimer: 0,
      golpeado: false
    });
  }
}

// ─── FONDO OCEÁNICO ────────────────────────────────────────────────────────────
function drawOceano() {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0,   "#001829");
  g.addColorStop(0.45,"#002d4a");
  g.addColorStop(1,   "#001015");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Rayos de luz (cáusticas)
  for (let i = 0; i < 5; i++) {
    const rx = 100 + i * 200 + Math.sin(tiempo * 0.008 + i) * 30;
    const cg = ctx.createLinearGradient(rx, 0, rx + 60, canvas.height * 0.7);
    cg.addColorStop(0,   "rgba(100,200,255,0.07)");
    cg.addColorStop(0.5, "rgba(100,200,255,0.03)");
    cg.addColorStop(1,   "rgba(100,200,255,0)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.lineTo(rx + 60, 0);
    ctx.lineTo(rx + 80 + Math.sin(tiempo*0.005)*20, canvas.height*0.7);
    ctx.lineTo(rx - 30 + Math.sin(tiempo*0.005)*20, canvas.height*0.7);
    ctx.closePath();
    ctx.fill();
  }

  // Superficie
  ctx.beginPath();
  ctx.moveTo(0, 16);
  for (let x = 0; x <= canvas.width; x += 4) {
    ctx.lineTo(x, 14 + Math.sin(x * 0.04 + tiempo * 0.04) * 5);
  }
  ctx.lineTo(canvas.width, 0); ctx.lineTo(0, 0); ctx.closePath();
  ctx.fillStyle = "rgba(0,180,255,0.18)";
  ctx.fill();

  // Suelo marino
  const sy = canvas.height - 55;
  ctx.fillStyle = "#0a1a10";
  ctx.fillRect(0, sy, canvas.width, 55);
  for (let x = 0; x < canvas.width; x += 6) {
    ctx.fillStyle = `rgba(${40+Math.sin(x*0.3)*8},${80+Math.sin(x*0.2)*8},40,0.35)`;
    ctx.fillRect(x, sy, 4, 3);
  }
  // Piedras
  [[80,sy+8,22],[220,sy+5,14],[480,sy+10,30],[750,sy+6,18],[920,sy+9,25]].forEach(([x,y,r]) => {
    ctx.fillStyle = "#1c3a2a";
    ctx.beginPath(); ctx.ellipse(x,y,r,r*0.55,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = "rgba(0,200,100,0.2)"; ctx.lineWidth = 1.5; ctx.stroke();
  });
}

// ─── ALGAS ─────────────────────────────────────────────────────────────────────
function drawAlgas() {
  algas.forEach(a => {
    ctx.strokeStyle = a.color;
    ctx.lineWidth   = a.w;
    ctx.lineCap     = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.baseY);
    for (let s = 1; s <= 5; s++) {
      const t  = s / 5;
      const sy = a.baseY - a.h * t;
      const sx = a.x + Math.sin(tiempo * a.vel + a.fase + s * 0.8) * (15 * t);
      ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    // punta
    const tipX = a.x + Math.sin(tiempo*a.vel+a.fase+5*0.8)*15;
    const tipY = a.baseY - a.h;
    ctx.fillStyle = "#2ecc71";
    ctx.beginPath(); ctx.arc(tipX, tipY, a.w*0.7, 0, Math.PI*2); ctx.fill();
  });
}

// ─── BURBUJAS DECO ─────────────────────────────────────────────────────────────
function drawBurbujasDeco() {
  burbujasDeco.forEach(b => {
    b.y += b.vy;
    b.x += Math.sin(tiempo*0.02 + b.y*0.02) * 0.3;
    if (b.y < -10) { b.y = canvas.height+10; b.x = Math.random()*canvas.width; }
    ctx.strokeStyle = `rgba(150,230,255,${b.alfa})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = `rgba(255,255,255,${b.alfa*0.45})`;
    ctx.beginPath(); ctx.arc(b.x-b.r*0.3, b.y-b.r*0.3, b.r*0.3, 0, Math.PI*2); ctx.fill();
  });
}

// ─── PECES DECO ────────────────────────────────────────────────────────────────
function drawPeces() {
  peces.forEach(p => {
    p.x   += p.vx * p.dir;
    p.fase += 0.06;
    const bobY = p.y + Math.sin(p.fase)*3;
    if (p.x > canvas.width+50) p.x=-50;
    if (p.x < -50) p.x=canvas.width+50;
    ctx.save();
    ctx.translate(p.x, bobY);
    if (p.dir < 0) ctx.scale(-1,1);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.ellipse(0,0,p.size,p.size*0.55,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-p.size*0.8,0); ctx.lineTo(-p.size*1.4,-p.size*0.5); ctx.lineTo(-p.size*1.4,p.size*0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(p.size*0.5,-p.size*0.1,p.size*0.22,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#000"; ctx.beginPath(); ctx.arc(p.size*0.52,-p.size*0.1,p.size*0.1,0,Math.PI*2); ctx.fill();
    ctx.restore();
  });
}

// ─── ZORRITO CON TRAJE DE BUCEO ────────────────────────────────────────────────
function drawFox() {
  fox.aletaAng += 0.13;
  const ao = Math.sin(fox.aletaAng) * 6;
  ctx.save();
  ctx.translate(fox.x + fox.w/2, fox.y + fox.h/2);

  // Tanque de oxígeno
  ctx.fillStyle = "#607d8b";
  ctx.fillRect(10, -8, 8, 22);
  ctx.fillStyle = "#90a4ae";
  ctx.fillRect(11,-6,6,4);
  ctx.strokeStyle="#455a64"; ctx.lineWidth=1; ctx.strokeRect(10,-8,8,22);

  // Cuerpo traje
  ctx.fillStyle = "#0d5c2e";
  ctx.beginPath(); ctx.ellipse(0,6,14,18,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#1a8a4a"; ctx.lineWidth=2; ctx.stroke();

  // Cinturón
  ctx.fillStyle="#424242"; ctx.fillRect(-14,4,28,5);
  ctx.fillStyle="#757575"; ctx.fillRect(-4,3,8,7);

  // Brazos
  ctx.fillStyle="#0d5c2e";
  ctx.fillRect(-22,-4+ao*0.3,10,5);
  ctx.fillRect(12,-4-ao*0.3,10,5);
  // Guantes naranja
  ctx.fillStyle="#e65100";
  ctx.beginPath(); ctx.arc(-15,-2+ao*0.3,5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(20,-2-ao*0.3,5,0,Math.PI*2); ctx.fill();

  // Aletas
  ctx.fillStyle="#0277bd";
  ctx.beginPath(); ctx.ellipse(-8,23+ao*0.4,9,4,-0.3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(8,23-ao*0.4,9,4,0.3,0,Math.PI*2);  ctx.fill();

  // Casco
  ctx.fillStyle="#1a3a5c";
  ctx.beginPath(); ctx.arc(0,-12,17,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#4fc3f7"; ctx.lineWidth=2.5; ctx.stroke();

  // Visor
  ctx.fillStyle="rgba(100,200,255,0.22)";
  ctx.beginPath(); ctx.ellipse(0,-12,12,10,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#81d4fa"; ctx.lineWidth=2; ctx.stroke();

  // Cara zorrito dentro del casco
  ctx.fillStyle="#ff9933";
  ctx.beginPath(); ctx.ellipse(0,-12,9,8,0,0,Math.PI*2); ctx.fill();
  // Orejas
  ctx.fillStyle="#ff8000";
  ctx.beginPath(); ctx.moveTo(-7,-20); ctx.lineTo(-4,-26); ctx.lineTo(-1,-20); ctx.fill();
  ctx.beginPath(); ctx.moveTo(7,-20);  ctx.lineTo(4,-26);  ctx.lineTo(1,-20);  ctx.fill();
  // Ojos
  ctx.fillStyle="#1a1a1a";
  ctx.beginPath(); ctx.arc(-3.5,-13,2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(3.5,-13,2,0,Math.PI*2);  ctx.fill();
  ctx.fillStyle="#fff";
  ctx.beginPath(); ctx.arc(-2.8,-13.5,0.7,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(4.2,-13.5,0.7,0,Math.PI*2);  ctx.fill();
  // Nariz
  ctx.fillStyle="#1a1a1a";
  ctx.beginPath(); ctx.arc(0,-10,1.5,0,Math.PI*2); ctx.fill();

  // Burbujitas del casco
  if (tiempo % 25 < 2) {
    burbujasDeco.push({
      x: fox.x+fox.w/2+16+Math.random()*4,
      y: fox.y+6,
      r: 2+Math.random()*3,
      vy: -(0.4+Math.random()*0.5),
      alfa: 0.6
    });
  }
  ctx.restore();
}

// ─── PROYECTILES (BURBUJAS DISPARO) ────────────────────────────────────────────
function dispararBurbuja() {
  burbujas.push({
    x: fox.x + fox.w + 6,
    y: fox.y + fox.h/2,
    r: 10, vx: 7.5, vy: 0, life: 130
  });
}

function updateBurbujas() {
  burbujas.forEach(b => {
    b.x  += b.vx;
    b.y  += b.vy;
    b.vy += 0.04;
    b.r  += 0.035;
    b.life--;
  });

  // Colisión burbuja → tarjeta
  burbujas.forEach(bur => {
    if (bur.life <= 0) return;
    objetivos.forEach(obj => {
      if (obj.golpeado || colisionLock) return;
      if (
        bur.x+bur.r > obj.x && bur.x-bur.r < obj.x+obj.w &&
        bur.y+bur.r > obj.y && bur.y-bur.r < obj.y+obj.h
      ) {
        colisionLock = true;
        obj.golpeado = true;
        obj.golpeTimer = 45;
        bur.life = 0;

        if (obj.correcta) {
          aciertos++;
          feedbackMsg="¡Correcto! 🌊⭐"; feedbackColor="#00e676";
          sonidoCorrecto.currentTime=0; sonidoCorrecto.play();
          crearParticulas(obj.x+obj.w/2, obj.y+obj.h/2, "#FFD700");
          crearParticulas(obj.x+obj.w/2, obj.y+obj.h/2, "#00e676");
        } else {
          feedbackMsg="¡Esa no! 🐟 Intenta de nuevo"; feedbackColor="#ff5252";
          sonidoError.currentTime=0; sonidoError.play();
          crearParticulas(obj.x+obj.w/2, obj.y+obj.h/2, "#ff5252");
          crearParticulas(obj.x+obj.w/2, obj.y+obj.h/2, "#ff9800");
        }
        feedbackTimer = 85;

        setTimeout(() => { siguientePregunta(); colisionLock=false; }, 950);
      }
    });
  });

  burbujas = burbujas.filter(b => b.life > 0 && b.x < canvas.width+30);
}

function drawBurbujas() {
  burbujas.forEach(b => {
    // Destello interior
    ctx.fillStyle="rgba(100,220,255,0.25)";
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
    // Borde burbuja
    ctx.strokeStyle="rgba(150,230,255,0.95)";
    ctx.lineWidth=2.2;
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.stroke();
    // Brillo
    ctx.fillStyle="rgba(255,255,255,0.5)";
    ctx.beginPath(); ctx.arc(b.x-b.r*0.32,b.y-b.r*0.32,b.r*0.38,0,Math.PI*2); ctx.fill();
    // Sombra interna
    const sg=ctx.createRadialGradient(b.x,b.y,b.r*0.3,b.x,b.y,b.r);
    sg.addColorStop(0,"rgba(79,195,247,0.1)");
    sg.addColorStop(1,"rgba(79,195,247,0.35)");
    ctx.fillStyle=sg;
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
  });
}

// ─── TARJETAS OBJETIVOS ────────────────────────────────────────────────────────
function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x+r,y); c.lineTo(x+w-r,y);
  c.quadraticCurveTo(x+w,y,x+w,y+r);
  c.lineTo(x+w,y+h-r);
  c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  c.lineTo(x+r,y+h);
  c.quadraticCurveTo(x,y+h,x,y+h-r);
  c.lineTo(x,y+r);
  c.quadraticCurveTo(x,y,x+r,y);
  c.closePath();
}

function drawObjetivos() {
  objetivos.forEach((obj, i) => {
    obj.oscFase += obj.oscVel;
    const oscY  = Math.sin(obj.oscFase) * obj.oscAmp;
    if (obj.golpeTimer > 0) obj.golpeTimer--;
    const shake = obj.golpeTimer > 0 ? Math.sin(obj.golpeTimer*0.9)*5 : 0;

    const dx = obj.x + shake;
    const dy = obj.y + oscY;
    const c  = obj.color;

    ctx.shadowColor = c.glow;
    ctx.shadowBlur  = 20;

    // Cuerpo tarjeta
    ctx.fillStyle = c.bg;
    roundRect(ctx, dx, dy, obj.w, obj.h, 14);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Borde brillante
    ctx.strokeStyle = c.borde;
    ctx.lineWidth   = 3;
    roundRect(ctx, dx, dy, obj.w, obj.h, 14);
    ctx.stroke();

    // Línea interna decorativa
    ctx.strokeStyle="rgba(255,255,255,0.1)";
    ctx.lineWidth=1;
    roundRect(ctx, dx+4, dy+4, obj.w-8, obj.h-8, 10);
    ctx.stroke();

    // Badge lateral (A/B/C)
    ctx.fillStyle=c.borde;
    ctx.beginPath(); ctx.arc(dx+18,dy+obj.h/2,9,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#fff";
    ctx.font="bold 11px Arial";
    ctx.textAlign="center";
    ctx.fillText(["A","B","C"][i], dx+18, dy+obj.h/2+4);

    // Texto opción — ajuste automático
    ctx.fillStyle="#e0f7fa";
    ctx.font="bold 14px 'Minecraftia', monospace";
    ctx.textAlign="center";
    const maxW = obj.w - 50;
    const words = obj.texto.split(" ");
    let linea="", lineas=[];
    for (let w of words) {
      const test = linea+w+" ";
      if (ctx.measureText(test).width > maxW && linea!=="") {
        lineas.push(linea.trim()); linea=w+" ";
      } else linea=test;
    }
    lineas.push(linea.trim());
    const lh=17, sy2=dy+obj.h/2-((lineas.length-1)*lh)/2+5;
    lineas.forEach((l,li) => ctx.fillText(l, dx+obj.w/2+6, sy2+li*lh));

    ctx.textAlign="left"; ctx.shadowBlur=0;
  });
}

// ─── HUD ───────────────────────────────────────────────────────────────────────
function drawHUD() {
  if (currentQuestion >= preguntas.length) return;
  const q = preguntas[currentQuestion];

  // Panel translúcido
  ctx.fillStyle="rgba(0,10,30,0.78)";
  roundRect(ctx,10,10,640,112,12); ctx.fill();
  ctx.strokeStyle="rgba(79,195,247,0.45)";
  ctx.lineWidth=1.5;
  roundRect(ctx,10,10,640,112,12); ctx.stroke();

  // Aciertos
  ctx.fillStyle="#4fc3f7"; ctx.font="13px Minecraftia"; ctx.textAlign="left";
  ctx.fillText(`🌊 Aciertos: ${aciertos}`, 22, 33);

  // Barra de progreso
  const bw=190, bh=9;
  ctx.fillStyle="rgba(255,255,255,0.1)"; ctx.fillRect(22,41,bw,bh);
  ctx.fillStyle="#4fc3f7"; ctx.fillRect(22,41,bw*(currentQuestion/preguntas.length),bh);
  ctx.strokeStyle="#4fc3f7"; ctx.lineWidth=1; ctx.strokeRect(22,41,bw,bh);
  ctx.fillStyle="#aef"; ctx.font="10px Minecraftia";
  ctx.fillText(`${currentQuestion+1}/${preguntas.length}`, 218, 50);

  // Instrucción disparo
  ctx.fillStyle="#ffe066"; ctx.font="11px Minecraftia";
  ctx.fillText("ESPACIO = DISPARAR BURBUJA", 390, 33);
  ctx.fillStyle="#aef";
  ctx.fillText("← → ↑ ↓ = NADAR", 390, 52);

  // Número con dígito resaltado
  drawNumeroResaltado(q, 22, 82);

  // Pregunta
  ctx.fillStyle="#e0f7fa"; ctx.font="13px Minecraftia";
  const pw=q.pregunta.split(" ");
  let pl="", pY=101;
  for (let w of pw) {
    if (ctx.measureText(pl+w).width > 620 && pl!=="") {
      ctx.fillText(pl, 22, pY); pY+=16; pl="";
    }
    pl+=w+" ";
  }
  ctx.fillText(pl, 22, pY);
  ctx.textAlign="left";
}

function drawNumeroResaltado(q, x, y) {
  const partes = q.numero.split("");
  let cx = x;
  ctx.font="bold 26px Arial"; ctx.textAlign="left";
  let idx=0;
  for (let ch of partes) {
    if (ch==="."||ch===",") {
      ctx.fillStyle="#7ecfff"; ctx.fillText(ch,cx,y);
      cx+=ctx.measureText(ch).width+1; continue;
    }
    if (idx===q.resalta) {
      const dw=ctx.measureText(ch).width;
      ctx.fillStyle="#ffe000"; ctx.shadowColor="#ffe000"; ctx.shadowBlur=12;
      ctx.fillRect(cx-2,y-22,dw+6,28);
      ctx.shadowBlur=0; ctx.fillStyle="#b71c1c";
    } else {
      ctx.fillStyle="#e0f7fa";
    }
    ctx.fillText(ch,cx,y);
    cx+=ctx.measureText(ch).width+2; idx++;
  }
  ctx.shadowBlur=0;
}

// ─── FEEDBACK ──────────────────────────────────────────────────────────────────
function drawFeedback() {
  if (feedbackTimer<=0) return;
  feedbackTimer--;
  ctx.globalAlpha=Math.min(1,feedbackTimer/22);
  ctx.font="bold 30px 'Minecraftia', monospace";
  ctx.textAlign="center";
  ctx.fillStyle=feedbackColor;
  ctx.shadowColor=feedbackColor; ctx.shadowBlur=22;
  ctx.fillText(feedbackMsg, canvas.width/2, canvas.height/2-50);
  ctx.shadowBlur=0; ctx.globalAlpha=1; ctx.textAlign="left";
}

// ─── PARTÍCULAS ────────────────────────────────────────────────────────────────
function crearParticulas(x,y,color) {
  for (let i=0;i<24;i++) {
    particulas.push({
      x,y,
      vx:(Math.random()*7)-3.5,
      vy:(Math.random()*-5)-1,
      life:65+Math.random()*20, maxLife:85,
      color, r:2+Math.random()*5
    });
  }
}
function drawParticulas() {
  particulas.forEach(p => {
    ctx.globalAlpha=p.life/p.maxLife;
    ctx.fillStyle=p.color;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.09; p.r*=0.97; p.life--;
  });
  ctx.globalAlpha=1;
  particulas=particulas.filter(p=>p.life>0);
}

// ─── CONTROLES ─────────────────────────────────────────────────────────────────
// ↑ ↓ = nadar    |    Espacio = disparar burbuja    |    P = pausar
const keys={};
document.addEventListener("keydown", e=>{
  keys[e.key]=true;
  if (juegoTerminado||pausado) return;
  // Disparo solo con Espacio (tecla independiente del movimiento)
  if (e.key===" " && !keys["_disp"]) {
    keys["_disp"]=true;
    dispararBurbuja();
    sonidoDisparo.currentTime=0; sonidoDisparo.play();
  }
  if (e.key==="p"||e.key==="P") {
    pausado=!pausado;
    if(pausado) musicaFondo.pause(); else musicaFondo.play();
  }
  // Evitar scroll de página con las flechas y espacio
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
});
document.addEventListener("keyup",e=>{
  keys[e.key]=false;
  if(e.key===" ") keys["_disp"]=false;
});

// ─── UPDATE ZORRITO ────────────────────────────────────────────────────────────
function updateFox() {
  if (juegoTerminado||pausado) return;
  // Movimiento horizontal
  if (keys["ArrowRight"]) fox.vx= FOX_SPEED;
  else if (keys["ArrowLeft"]) fox.vx=-FOX_SPEED;
  else fox.vx*=0.7;
  // Movimiento vertical — nadar arriba y abajo libremente con ↑ ↓
  if (keys["ArrowUp"])   fox.vy=-FOX_SWIM;
  if (keys["ArrowDown"]) fox.vy= FOX_SWIM;

  fox.vy+=GRAVITY; fox.vy*=DRAG; fox.vx*=0.92;
  fox.x+=fox.vx; fox.y+=fox.vy;

  const sueloY=canvas.height-55-fox.h;
  fox.x=Math.max(0, Math.min(fox.x, 370));
  fox.y=Math.max(10, Math.min(fox.y, sueloY));
}

// ─── SIGUIENTE PREGUNTA ────────────────────────────────────────────────────────
function siguientePregunta() {
  currentQuestion++;
  if (currentQuestion>=preguntas.length) {
    juegoTerminado=true;
    estrellasFinal=[];
    for (let i=0;i<160;i++) {
      estrellasFinal.push({
        x:Math.random()*canvas.width,
        y:Math.random()*-canvas.height,
        vy:0.8+Math.random()*2.2,
        r:1.5+Math.random()*3.5,
        color:["#FFD700","#4fc3f7","#00e676","#ff80ab"][Math.floor(Math.random()*4)]
      });
    }
    const puntaje=(aciertos/preguntas.length)*100;
    fetch("/guardar_progreso",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({grado:5,unidad:1,aciertos,total:preguntas.length,puntaje})
    }).then(r=>r.json()).then(d=>console.log("✅",d)).catch(e=>console.error("❌",e));
  } else {
    generarObjetivos();
  }
}

// ─── PANTALLA FINAL ────────────────────────────────────────────────────────────
function drawFinal() {
  estrellasFinal.forEach(e=>{
    ctx.strokeStyle=e.color; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.stroke();
    e.y+=e.vy; if(e.y>canvas.height+10) e.y=-10;
  });
  const pW=600,pH=260;
  const px=(canvas.width-pW)/2, py=(canvas.height-pH)/2;
  ctx.fillStyle="rgba(0,10,30,0.92)";
  roundRect(ctx,px,py,pW,pH,20); ctx.fill();
  ctx.strokeStyle="#FFD700"; ctx.lineWidth=4;
  roundRect(ctx,px+4,py+4,pW-8,pH-8,18); ctx.stroke();
  ctx.fillStyle="#FFD700"; ctx.font="30px Minecraftia"; ctx.textAlign="center";
  ctx.fillText("🦊 ¡Misión completada!", canvas.width/2, py+62);
  ctx.fillStyle="#4fc3f7"; ctx.font="22px Minecraftia";
  ctx.fillText(`⭐ ${aciertos} / ${preguntas.length} correctas`, canvas.width/2, py+108);
  const pct=Math.round((aciertos/preguntas.length)*100);
  const msg=pct===100?"¡Perfecto! 🏆":pct>=70?"¡Muy bien! 🌊":"¡Practica más! 📚";
  ctx.fillStyle="#e0f7fa"; ctx.font="15px Minecraftia";
  ctx.fillText(`${pct}% — ${msg}`, canvas.width/2, py+145);
  const bW=240,bH=54;
  const bx=canvas.width/2-bW/2, by=py+175;
  ctx.fillStyle="#004d70"; roundRect(ctx,bx,by,bW,bH,12); ctx.fill();
  ctx.strokeStyle="#4fc3f7"; ctx.lineWidth=2.5; roundRect(ctx,bx,by,bW,bH,12); ctx.stroke();
  ctx.fillStyle="#fff"; ctx.font="20px Minecraftia";
  ctx.fillText("🔁 Reiniciar", canvas.width/2, by+35);
  ctx.textAlign="left";
}

function drawPausa() {
  ctx.fillStyle="rgba(0,5,20,0.78)"; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#4fc3f7"; ctx.font="42px Minecraftia"; ctx.textAlign="center";
  ctx.fillText("⏸ Pausa", canvas.width/2, canvas.height/2-42);
  const bW=240,bH=58;
  const bx=canvas.width/2-bW/2, by=canvas.height/2;
  ctx.fillStyle="#004d70"; roundRect(ctx,bx,by,bW,bH,12); ctx.fill();
  ctx.strokeStyle="#4fc3f7"; ctx.lineWidth=2.5; roundRect(ctx,bx,by,bW,bH,12); ctx.stroke();
  ctx.fillStyle="#fff"; ctx.font="22px Minecraftia";
  ctx.fillText("▶ Continuar", canvas.width/2, by+38);
  ctx.textAlign="left";
}

canvas.addEventListener("click",e=>{
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left, my=e.clientY-rect.top;
  if (pausado&&!juegoTerminado) {
    const bW=240,bH=58,bx=canvas.width/2-120,by=canvas.height/2;
    if(mx>=bx&&mx<=bx+bW&&my>=by&&my<=by+bH){pausado=false;musicaFondo.play();}
  }
  if (juegoTerminado) {
    const pH=260,py=(canvas.height-pH)/2;
    const bW=240,bH=54,bx=canvas.width/2-120,by=py+175;
    if(mx>=bx&&mx<=bx+bW&&my>=by&&my<=by+bH) resetGame();
  }
});

// ─── RESET ─────────────────────────────────────────────────────────────────────
function resetGame() {
  aciertos=0; currentQuestion=0; juegoTerminado=false; pausado=false; colisionLock=false;
  burbujas=[]; particulas=[]; estrellasFinal=[]; feedbackTimer=0; feedbackMsg="";
  fox.x=80; fox.y=300; fox.vx=0; fox.vy=0;
  initMundo(); generarObjetivos();
}

// ─── DRAW & UPDATE ─────────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawOceano();
  drawBurbujasDeco();
  drawAlgas();
  drawPeces();
  if (!juegoTerminado) {
    drawObjetivos();
    drawBurbujas();
    drawFox();
    drawHUD();
    drawFeedback();
    drawParticulas();
  }
  if (pausado&&!juegoTerminado) drawPausa();
  if (juegoTerminado) { drawFinal(); drawParticulas(); }
}

function update() {
  if (juegoTerminado||pausado) return;
  tiempo++;
  updateFox();
  updateBurbujas();
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }

// ─── INICIO ─────────────────────────────────────────────────────────────────────
resetGame();
gameLoop();
musicaFondo.play().catch(()=>{
  document.addEventListener("keydown",()=>musicaFondo.play(),{once:true});
});