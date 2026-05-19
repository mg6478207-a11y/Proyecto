// 🎮 RETOMATE - Grado 5 | Unidad 5: Estadística
// 🚀 "El Observatorio Cósmico del Zorro"
// El zorro piloto maneja una nave espacial y dispara misiles a planetas.
// Debe calcular media, mediana o moda del conjunto de datos mostrado.
// Controles: ← → mover nave | ↑ disparar | P pausar

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");
canvas.width  = 1000;
canvas.height = 600;

// ─── ESTADO ────────────────────────────────────────────────────────────────────
let aciertos       = 0;
let currentQ       = 0;
let juegoTerminado = false;
let pausado        = false;
let colisionLock   = false;
let tiempo         = 0;
let feedbackTimer  = 0;
let feedbackMsg    = "";
let feedbackOk     = true;
let particulas     = [];
let estrellasFondo = [];
let estrellasFinal = [];
let misil          = null;
let planetas       = [];
let nebulaOffset   = 0;

// ─── SONIDOS ──────────────────────────────────────────────────────────────────
const sonidoLanzar   = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");
const sonidoCorrecto = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const sonidoError    = new Audio("https://actions.google.com/sounds/v1/cartoon/concussive_guitar_hit.ogg");
const musicaFondo    = new Audio("/static/sounds/fondo.mp3");
musicaFondo.volume   = 0.35; musicaFondo.loop = true;
sonidoLanzar.volume  = 0.4; sonidoCorrecto.volume = 0.6; sonidoError.volume = 0.5;

// ─── NAVE ZORRO ───────────────────────────────────────────────────────────────
let ship = { x: 480, y: 490, w: 60, h: 48, vx: 0, anim: 0, escudo: false, escudoTimer: 0 };
const SHIP_SPEED = 5;
const SUELO_Y    = 490;

// ─── PREGUNTAS ─────────────────────────────────────────────────────────────────
const preguntas = [
  { tipo:"Media",    datos:[4,6,8,10,12],      enunciado:"Datos: 4, 6, 8, 10, 12",    respuesta:8,  opciones:[6,8,10],    correcta:1 },
  { tipo:"Moda",     datos:[3,5,5,7,9,5,2],    enunciado:"Datos: 3,5,5,7,9,5,2",      respuesta:5,  opciones:[7,3,5],     correcta:2 },
  { tipo:"Mediana",  datos:[2,4,6,8,10],        enunciado:"Datos: 2, 4, 6, 8, 10",     respuesta:6,  opciones:[6,5,8],     correcta:0 },
  { tipo:"Media",    datos:[10,20,30],          enunciado:"Datos: 10, 20, 30",          respuesta:20, opciones:[20,15,25],  correcta:0 },
  { tipo:"Moda",     datos:[1,2,2,3,4,4,4,5],  enunciado:"Datos: 1,2,2,3,4,4,4,5",   respuesta:4,  opciones:[2,4,3],     correcta:1 },
  { tipo:"Mediana",  datos:[1,3,5,7,9,11],      enunciado:"Datos: 1,3,5,7,9,11",       respuesta:6,  opciones:[5,6,7],     correcta:1 },
  { tipo:"Media",    datos:[15,25,35,45],       enunciado:"Datos: 15, 25, 35, 45",     respuesta:30, opciones:[25,35,30],  correcta:2 },
  { tipo:"Moda",     datos:[8,8,9,9,9,10],      enunciado:"Datos: 8,8,9,9,9,10",       respuesta:9,  opciones:[8,9,10],    correcta:1 },
  { tipo:"Mediana",  datos:[3,7,1,9,5],         enunciado:"Datos: 3,7,1,9,5",          respuesta:5,  opciones:[7,3,5],     correcta:2 },
  { tipo:"Media",    datos:[6,12,18,24],        enunciado:"Datos: 6, 12, 18, 24",      respuesta:15, opciones:[12,15,18],  correcta:1 },
];

// Colores de planetas
const PLANET_COLS = [
  { base:"#44aaff", glow:"rgba(68,170,255,0.8)", dark:"#1a4488", crater:"#2266cc" },
  { base:"#ff6644", glow:"rgba(255,102,68,0.8)",  dark:"#882211", crater:"#cc3311" },
  { base:"#44ffaa", glow:"rgba(68,255,170,0.8)",  dark:"#1a8844", crater:"#22aa66" },
];

const PLANET_XS = [180, 500, 820];
const PLANET_Y  = 140;
const PLANET_R  = 55;

// ─── INIT ESTRELLAS ────────────────────────────────────────────────────────────
function initEstrellas() {
  estrellasFondo = [];
  for (let i = 0; i < 200; i++) {
    estrellasFondo.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8,
      brillo: Math.random(),
      vel: 0.1 + Math.random() * 0.3,
      color: ["#ffffff","#aaddff","#ffddaa","#ddffdd"][Math.floor(Math.random()*4)]
    });
  }
}

// ─── GENERAR PLANETAS ─────────────────────────────────────────────────────────
function generarPlanetas() {
  if (currentQ >= preguntas.length) return;
  const q = preguntas[currentQ];
  planetas = q.opciones.map((val, i) => ({
    x:       PLANET_XS[i],
    y:       PLANET_Y,
    r:       PLANET_R,
    valor:   val,
    correcta: i === q.correcta,
    color:   PLANET_COLS[i],
    rot:     Math.random() * Math.PI * 2,
    rotVel:  (Math.random() - 0.5) * 0.01,
    wobble:  0,
    hit:     false,
    hitTimer: 0,
    ring:    i === 1,  // planeta central tiene anillo
    fase:    Math.random() * Math.PI * 2
  }));
}

// ─── FONDO ESPACIAL ────────────────────────────────────────────────────────────
function drawFondo() {
  // Gradiente espacial profundo
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#000510");
  g.addColorStop(0.5, "#05050f");
  g.addColorStop(1, "#0a0518");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Nebulosas de fondo
  nebulaOffset += 0.002;
  [[200,200,"rgba(68,100,255,0.04)"],[700,300,"rgba(255,68,100,0.03)"],[400,450,"rgba(68,255,200,0.03)"]].forEach(([nx,ny,nc])=>{
    const rg = ctx.createRadialGradient(nx, ny+Math.sin(nebulaOffset)*20, 0, nx, ny, 200);
    rg.addColorStop(0, nc);
    rg.addColorStop(1, "transparent");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });

  // Estrellas con parpadeo
  estrellasFondo.forEach(s => {
    s.brillo += 0.02 * s.vel;
    const alpha = 0.4 + Math.sin(s.brillo) * 0.6;
    ctx.globalAlpha = Math.max(0.1, alpha);
    ctx.fillStyle = s.color;
    ctx.shadowColor = s.color; ctx.shadowBlur = 3;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
  });
  ctx.globalAlpha = 1;

  // Línea del horizonte de la nave (plataforma)
  const pg = ctx.createLinearGradient(0, SUELO_Y + ship.h + 5, 0, canvas.height);
  pg.addColorStop(0, "#0a0520");
  pg.addColorStop(1, "#05020f");
  ctx.fillStyle = pg;
  ctx.fillRect(0, SUELO_Y + ship.h + 5, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(68,170,255,0.5)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#44aaff"; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.moveTo(0, SUELO_Y + ship.h + 5); ctx.lineTo(canvas.width, SUELO_Y + ship.h + 5); ctx.stroke();
  ctx.shadowBlur = 0;

  // Cuadrícula espacial en la plataforma
  ctx.strokeStyle = "rgba(68,170,255,0.06)"; ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, SUELO_Y + ship.h + 5); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
}

// ─── PLANETAS ─────────────────────────────────────────────────────────────────
function drawPlanetas() {
  planetas.forEach((p, i) => {
    p.rot += p.rotVel;
    p.fase += 0.03;
    const floatY = p.y + Math.sin(p.fase + i) * 8;
    const isNear = misil === null && Math.abs((ship.x + ship.w/2) - p.x) < 120;

    if (p.hit) {
      p.hitTimer--;
      if (p.hitTimer <= 0) p.hit = false;
    }

    // Anillo (planeta central)
    if (p.ring) {
      ctx.save();
      ctx.translate(p.x, floatY);
      ctx.rotate(0.4);
      ctx.strokeStyle = p.color.dark + "aa";
      ctx.lineWidth = 8;
      ctx.shadowColor = p.color.glow; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.ellipse(0, 0, p.r + 25, 10, 0, 0, Math.PI*2); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Atmósfera del planeta
    const atmG = ctx.createRadialGradient(p.x, floatY, p.r * 0.7, p.x, floatY, p.r * 1.4);
    atmG.addColorStop(0, "transparent");
    atmG.addColorStop(1, p.color.glow.replace("0.8","0.15"));
    ctx.fillStyle = atmG;
    ctx.beginPath(); ctx.arc(p.x, floatY, p.r * 1.4, 0, Math.PI*2); ctx.fill();

    // Cuerpo del planeta
    const planetG = ctx.createRadialGradient(p.x - p.r*0.3, floatY - p.r*0.3, p.r*0.1, p.x, floatY, p.r);
    planetG.addColorStop(0, p.color.base);
    planetG.addColorStop(0.6, p.color.dark);
    planetG.addColorStop(1, "#000");
    ctx.fillStyle = planetG;
    ctx.shadowColor = p.hit ? "#ffffff" : p.color.glow;
    ctx.shadowBlur = p.hit ? 40 : (isNear ? 25 : 12);
    ctx.beginPath(); ctx.arc(p.x, floatY, p.r, 0, Math.PI*2); ctx.fill();

    // Cráteres decorativos
    ctx.save();
    ctx.translate(p.x, floatY);
    ctx.rotate(p.rot);
    [[p.r*0.3, -p.r*0.2, p.r*0.12],[- p.r*0.3, p.r*0.3, p.r*0.08],[p.r*0.5, p.r*0.2, p.r*0.07]].forEach(([cx,cy,cr])=>{
      ctx.fillStyle = p.color.crater + "88";
      ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI*2); ctx.fill();
    });
    ctx.restore();
    ctx.shadowBlur = 0;

    // Brillo especular
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath(); ctx.arc(p.x - p.r*0.3, floatY - p.r*0.3, p.r*0.2, 0, Math.PI*2); ctx.fill();

    // Etiqueta con el valor
    ctx.fillStyle = "#000000aa";
    ctx.beginPath(); ctx.arc(p.x, floatY, 22, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Minecraftia"; ctx.textAlign = "center";
    ctx.shadowColor = p.color.glow; ctx.shadowBlur = 8;
    ctx.fillText(p.valor, p.x, floatY + 6);
    ctx.shadowBlur = 0;

    // Indicador de apuntado
    if (isNear) {
      ctx.strokeStyle = p.color.base;
      ctx.lineWidth = 2;
      ctx.shadowColor = p.color.glow; ctx.shadowBlur = 12;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(p.x, floatY + p.r + 10);
      ctx.lineTo(ship.x + ship.w/2, SUELO_Y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Triángulo de apuntado
      ctx.fillStyle = p.color.base;
      ctx.beginPath();
      ctx.moveTo(p.x, floatY + p.r + 22);
      ctx.lineTo(p.x - 8, floatY + p.r + 10);
      ctx.lineTo(p.x + 8, floatY + p.r + 10);
      ctx.closePath(); ctx.fill();
    }
    ctx.textAlign = "left";

    // Actualizar Y flotante para colisiones
    p._floatY = floatY;
  });
}

// ─── NAVE ZORRO ───────────────────────────────────────────────────────────────
function drawShip() {
  ship.anim += 0.08;
  const cx = ship.x + ship.w / 2;
  const cy = ship.y + ship.h / 2;

  ctx.save();
  ctx.translate(cx, cy);

  // Llamas del propulsor
  const llamas = Math.sin(ship.anim * 3) * 0.3 + 0.8;
  ctx.fillStyle = "#ff8800";
  ctx.shadowColor = "#ff8800"; ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.moveTo(-10, 18);
  ctx.lineTo(0, 18 + 20 * llamas);
  ctx.lineTo(10, 18);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#ffff00";
  ctx.beginPath();
  ctx.moveTo(-5, 18);
  ctx.lineTo(0, 18 + 12 * llamas);
  ctx.lineTo(5, 18);
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;

  // Cuerpo de la nave (metálico)
  const navG = ctx.createLinearGradient(-24, -20, 24, 20);
  navG.addColorStop(0, "#aaccff");
  navG.addColorStop(0.5, "#4477cc");
  navG.addColorStop(1, "#223366");
  ctx.fillStyle = navG;
  ctx.shadowColor = "rgba(68,170,255,0.6)"; ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(22, 10);
  ctx.lineTo(18, 20);
  ctx.lineTo(-18, 20);
  ctx.lineTo(-22, 10);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#88aaff"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.shadowBlur = 0;

  // Alas laterales
  ctx.fillStyle = "#334477";
  ctx.beginPath(); ctx.moveTo(18, 5); ctx.lineTo(32, 18); ctx.lineTo(18, 18); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-18, 5); ctx.lineTo(-32, 18); ctx.lineTo(-18, 18); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#5566aa"; ctx.lineWidth = 1; ctx.stroke();

  // Cabina con zorro
  ctx.fillStyle = "#001133";
  ctx.beginPath(); ctx.ellipse(0, -2, 14, 12, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#44aaff"; ctx.lineWidth = 1.5; ctx.stroke();
  // Reflejo de cabina
  ctx.fillStyle = "rgba(68,170,255,0.3)";
  ctx.beginPath(); ctx.ellipse(-4, -6, 6, 4, -0.5, 0, Math.PI*2); ctx.fill();

  // Carita del zorro en la cabina
  ctx.fillStyle = "#ff8833";
  ctx.beginPath(); ctx.ellipse(0, -1, 9, 8, 0, 0, Math.PI*2); ctx.fill();
  // Orejas
  ctx.fillStyle = "#ff6600";
  ctx.beginPath(); ctx.moveTo(-7,-7); ctx.lineTo(-10,-13); ctx.lineTo(-4,-7); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(7,-7); ctx.lineTo(10,-13); ctx.lineTo(4,-7); ctx.closePath(); ctx.fill();
  // Cara
  ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.arc(-3, -2, 1.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(3, -2, 1.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 1, 1, 0, Math.PI*2); ctx.fill();
  // Casco
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(0, -1, 9, 8, 0, 0, Math.PI*2); ctx.stroke();

  // Cañón de la nave
  ctx.fillStyle = "#88aaff";
  ctx.fillRect(-3, -28, 6, 10);
  ctx.fillStyle = "#aaccff";
  ctx.fillRect(-2, -30, 4, 5);

  // Escudo (si activo)
  if (ship.escudo) {
    ship.escudoTimer--;
    if (ship.escudoTimer <= 0) ship.escudo = false;
    ctx.strokeStyle = "rgba(68,255,255,0.6)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#44ffff"; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

// ─── MISIL ────────────────────────────────────────────────────────────────────
function drawMisil() {
  if (!misil) return;
  misil.y += misil.vy;

  // Estela del misil
  for (let i = 0; i < 3; i++) {
    particulas.push({
      x: misil.x + (Math.random() - 0.5) * 6,
      y: misil.y + 10,
      vx: (Math.random() - 0.5) * 1,
      vy: 1 + Math.random() * 2,
      life: 20,
      maxLife: 20,
      color: "#44aaff",
      r: 2 + Math.random() * 3
    });
  }

  ctx.save();
  ctx.translate(misil.x, misil.y);
  ctx.fillStyle = "#88ddff";
  ctx.shadowColor = "#44aaff";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(5, 4);
  ctx.lineTo(-5, 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ff8800";
  ctx.beginPath();
  ctx.moveTo(-5, 4);
  ctx.lineTo(0, 14);
  ctx.lineTo(5, 4);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Verificar colisión con planetas
  for (const p of planetas) {
    const dy = misil.y - (p._floatY || p.y);
    const dx = misil.x - p.x;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < p.r + 8 && !colisionLock) {
      colisionLock = true;
      p.hit = true;
      p.hitTimer = 30;

      crearParticulas(misil.x, misil.y, p.color.base);
      misil = null;

      if (p.correcta) {
        aciertos++;
        feedbackMsg = "¡Planeta conquistado! 🚀⭐";
        feedbackOk = true;
        sonidoCorrecto.currentTime = 0;
        sonidoCorrecto.play();

        crearParticulas(p.x, p._floatY || p.y, "#44ffff");
        crearParticulas(p.x, p._floatY || p.y, "#ffffff");
      } else {
        feedbackMsg = `¡Erró el blanco! Era ${preguntas[currentQ].respuesta} 🌌`;
        feedbackOk = false;
        sonidoError.currentTime = 0;
        sonidoError.play();
      }

      feedbackTimer = 90;

      setTimeout(() => {
        siguientePregunta();
        colisionLock = false;
      }, 1100);

      break; // ← IMPORTANTE: salir del ciclo inmediatamente
    }
  }

  if (misil && misil.y < -20) misil = null;
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function drawHUD() {
  if (currentQ >= preguntas.length) return;
  const q = preguntas[currentQ];

  ctx.fillStyle = "rgba(0,5,20,0.88)";
  roundRect(ctx, 10, 10, 980, 95, 12); ctx.fill();
  ctx.strokeStyle = "rgba(68,170,255,0.5)"; ctx.lineWidth = 2;
  roundRect(ctx, 10, 10, 980, 95, 12); ctx.stroke();

  // Tipo de estadística
  const tipoColor = {Media:"#ffff44", Mediana:"#44ffaa", Moda:"#ff88aa"}[q.tipo] || "#44aaff";
  ctx.fillStyle = tipoColor; ctx.font = "bold 14px Minecraftia"; ctx.textAlign = "left";
  ctx.shadowColor = tipoColor; ctx.shadowBlur = 8;
  ctx.fillText(`📊 ${q.tipo.toUpperCase()}`, 22, 34);
  ctx.shadowBlur = 0;

  // Aciertos
  ctx.fillStyle = "#66aaff"; ctx.font = "12px Minecraftia";
  ctx.fillText(`🚀 Aciertos: ${aciertos}`, 22, 52);

  // Barra de progreso
  const bW = 120;
  ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(22, 60, bW, 7);
  ctx.fillStyle = "#44aaff"; ctx.fillRect(22, 60, bW*(currentQ/preguntas.length), 7);
  ctx.strokeStyle = "#44aaff"; ctx.lineWidth=1; ctx.strokeRect(22,60,bW,7);
  ctx.fillStyle = "#88aaff"; ctx.font = "10px Minecraftia";
  ctx.fillText(`${currentQ+1}/${preguntas.length}`, 148, 68);

  // Pregunta principal
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 18px Minecraftia"; ctx.textAlign = "center";
  ctx.shadowColor = "#44aaff"; ctx.shadowBlur = 6;
  ctx.fillText(`Calcula la ${q.tipo}: ${q.enunciado}`, canvas.width/2 + 60, 38);
  ctx.shadowBlur = 0;

  // Instrucción
  ctx.fillStyle = tipoColor; ctx.font = "12px Minecraftia";
  const hints = {
    Media: "Suma todos los números y divide entre la cantidad",
    Mediana: "Ordena los números y encuentra el del centro",
    Moda: "¿Qué número se repite más veces?"
  };
  ctx.fillText(`💡 ${hints[q.tipo]}`, canvas.width/2 + 60, 62);
  ctx.fillStyle = "#ffe066"; ctx.font = "11px Minecraftia";
  ctx.fillText("↑ = DISPARAR AL PLANETA CORRECTO", canvas.width/2 + 60, 85);
  ctx.textAlign = "left";
}

// ─── FEEDBACK ─────────────────────────────────────────────────────────────────
function drawFeedback() {
  if (feedbackTimer <= 0) return;
  feedbackTimer--;
  ctx.globalAlpha = Math.min(1, feedbackTimer/20);
  const color = feedbackOk ? "#44ffaa" : "#ff4466";
  ctx.font = "bold 28px Minecraftia"; ctx.textAlign = "center";
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 28;
  ctx.fillText(feedbackMsg, canvas.width/2, canvas.height/2 - 20);
  ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.textAlign = "left";
}

// ─── PARTÍCULAS ───────────────────────────────────────────────────────────────
function crearParticulas(x, y, color) {
  for (let i = 0; i < 28; i++) {
    particulas.push({
      x, y,
      vx:(Math.random()*10)-5,
      vy:(Math.random()*-8)-1,
      life:60, maxLife:60,
      color, r:2+Math.random()*5
    });
  }
}
function drawParticulas() {
  particulas.forEach(p => {
    ctx.globalAlpha = p.life/p.maxLife;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.r*=0.97; p.life--;
  });
  ctx.globalAlpha = 1;
  particulas = particulas.filter(p=>p.life>0);
}

// ─── UTILIDADES ───────────────────────────────────────────────────────────────
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

// ─── CONTROLES ────────────────────────────────────────────────────────────────
const keys = {};
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
  if (juegoTerminado || pausado || colisionLock) return;
  if (e.key === "ArrowUp" && !keys["_act"] && !misil) {
    keys["_act"] = true;
    dispararMisil();
  }
  if (e.key==="p"||e.key==="P") {
    pausado=!pausado;
    if(pausado) musicaFondo.pause(); else musicaFondo.play();
  }
});
document.addEventListener("keyup", e => {
  keys[e.key]=false;
  if(e.key==="ArrowUp") keys["_act"]=false;
});

function dispararMisil() {
  const cx = ship.x + ship.w/2;
  misil = { x: cx, y: ship.y - 10, vy: -9 };
  sonidoLanzar.currentTime = 0; sonidoLanzar.play();
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
function update() {
  if (juegoTerminado||pausado) return;
  tiempo++;
  if(keys["ArrowRight"]) ship.vx= SHIP_SPEED;
  else if(keys["ArrowLeft"]) ship.vx=-SHIP_SPEED;
  else ship.vx*=0.75;
  ship.x+=ship.vx;
  ship.x=Math.max(0,Math.min(ship.x,canvas.width-ship.w));
}

// ─── SIGUIENTE PREGUNTA ───────────────────────────────────────────────────────
function siguientePregunta() {
  currentQ++;
  misil=null;
  if(currentQ>=preguntas.length) {
    juegoTerminado=true;
    estrellasFinal=[];
    for(let i=0;i<200;i++) {
      estrellasFinal.push({
        x:Math.random()*canvas.width,
        y:Math.random()*-canvas.height,
        vy:0.8+Math.random()*2,
        r:1.5+Math.random()*4,
        color:["#44aaff","#44ffaa","#ffff44","#ff88aa","#ffffff"][Math.floor(Math.random()*5)]
      });
    }
    const puntaje=(aciertos/preguntas.length)*100;
    fetch("/guardar_progreso",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({grado:5,unidad:5,aciertos,total:preguntas.length,puntaje})
    }).then(r=>r.json()).then(d=>console.log("✅",d)).catch(e=>console.error("❌",e));
  } else {
    generarPlanetas();
  }
}

// ─── PANTALLA FINAL ───────────────────────────────────────────────────────────
function drawFinal() {
  estrellasFinal.forEach(e=>{
    ctx.fillStyle=e.color; ctx.shadowColor=e.color; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    e.y+=e.vy; if(e.y>canvas.height+10) e.y=-10;
  });
  const pW=620,pH=280;
  const px=(canvas.width-pW)/2,py=(canvas.height-pH)/2;
  ctx.fillStyle="rgba(0,5,20,0.94)";
  roundRect(ctx,px,py,pW,pH,22); ctx.fill();
  ctx.strokeStyle="#44aaff"; ctx.lineWidth=4;
  ctx.shadowColor="#44aaff"; ctx.shadowBlur=22;
  roundRect(ctx,px+4,py+4,pW-8,pH-8,20); ctx.stroke();
  ctx.shadowBlur=0;
  ctx.fillStyle="#66ccff"; ctx.font="26px Minecraftia"; ctx.textAlign="center";
  ctx.shadowColor="#44aaff"; ctx.shadowBlur=12;
  ctx.fillText("🚀 ¡Observatorio completado!", canvas.width/2, py+58);
  ctx.shadowBlur=0;
  ctx.fillStyle="#ffe066"; ctx.font="22px Minecraftia";
  ctx.fillText(`⭐ ${aciertos} / ${preguntas.length} correctas`, canvas.width/2, py+105);
  const pct=Math.round((aciertos/preguntas.length)*100);
  const msg=pct===100?"¡Astrónomo maestro! 🌌":pct>=70?"¡Gran explorador! 🚀":"¡Sigue explorando! 🌠";
  ctx.fillStyle="#aaddff"; ctx.font="13px Minecraftia";
  ctx.fillText(`${pct}% — ${msg}`, canvas.width/2, py+143);
  const bW=250,bH=54,bx=canvas.width/2-125,by=py+178;
  ctx.fillStyle="#001133";
  roundRect(ctx,bx,by,bW,bH,12); ctx.fill();
  ctx.strokeStyle="#44aaff"; ctx.lineWidth=2.5;
  ctx.shadowColor="#44aaff"; ctx.shadowBlur=14;
  roundRect(ctx,bx,by,bW,bH,12); ctx.stroke();
  ctx.shadowBlur=0;
  ctx.fillStyle="#fff"; ctx.font="20px Minecraftia";
  ctx.fillText("🔁 Reiniciar", canvas.width/2, by+36);
  ctx.textAlign="left";
}

function drawPausa() {
  ctx.fillStyle="rgba(0,5,20,0.85)"; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#66aaff"; ctx.font="42px Minecraftia"; ctx.textAlign="center";
  ctx.shadowColor="#44aaff"; ctx.shadowBlur=20;
  ctx.fillText("⏸ Pausa", canvas.width/2, canvas.height/2-44);
  ctx.shadowBlur=0;
  const bW=250,bH=60,bx=canvas.width/2-125,by=canvas.height/2;
  ctx.fillStyle="#001133"; roundRect(ctx,bx,by,bW,bH,12); ctx.fill();
  ctx.strokeStyle="#44aaff"; ctx.lineWidth=2.5; roundRect(ctx,bx,by,bW,bH,12); ctx.stroke();
  ctx.fillStyle="#fff"; ctx.font="22px Minecraftia";
  ctx.fillText("▶ Continuar", canvas.width/2, by+39);
  ctx.textAlign="left";
}

canvas.addEventListener("click",e=>{
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left,my=e.clientY-rect.top;
  if(pausado&&!juegoTerminado){
    if(mx>=canvas.width/2-125&&mx<=canvas.width/2+125&&my>=canvas.height/2&&my<=canvas.height/2+60){
      pausado=false; musicaFondo.play();
    }
  }
  if(juegoTerminado){
    const pH=280,py=(canvas.height-pH)/2;
    const bx=canvas.width/2-125,by=py+178;
    if(mx>=bx&&mx<=bx+250&&my>=by&&my<=by+54) resetGame();
  }
});

// ─── DRAW PRINCIPAL ───────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawFondo();
  if(!juegoTerminado) {
    drawPlanetas();
    drawMisil();
    drawShip();
    drawHUD();
    drawFeedback();
  }
  drawParticulas();
  if(pausado&&!juegoTerminado) drawPausa();
  if(juegoTerminado) drawFinal();
}

// ─── RESET ────────────────────────────────────────────────────────────────────
function resetGame() {
  aciertos=0; currentQ=0; juegoTerminado=false; pausado=false; colisionLock=false;
  particulas=[]; estrellasFinal=[]; feedbackTimer=0; feedbackMsg=""; misil=null;
  ship.x=480; ship.y=SUELO_Y; ship.vx=0; ship.escudo=false;
  initEstrellas(); generarPlanetas();
}

// ─── LOOP ─────────────────────────────────────────────────────────────────────
function gameLoop(){ update(); draw(); requestAnimationFrame(gameLoop); }
resetGame();
gameLoop();
musicaFondo.play().catch(()=>{
  document.addEventListener("keydown",()=>musicaFondo.play(),{once:true});
});