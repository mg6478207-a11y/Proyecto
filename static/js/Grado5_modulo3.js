// 🎮 RETOMATE - Grado 5 | Unidad 3: Razón y Proporción
// ⚗️ "El Laboratorio del Equilibrio"
// El zorrito alquimista lanza frascos a una balanza gigante.
// Debe encontrar el valor que completa la proporción y equilibra los platillos.
// Controles: ← → mover | ↑ lanzar frasco | P pausar

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
let humos          = [];          // humo de tubos del laboratorio
let burbujas       = [];          // burbujas en los tubos
let estrellasFinal = [];

// Balanza
let balanzaAngulo  = 0;           // ángulo actual de la balanza (-15..+15 grados)
let balanzaTarget  = 0;           // ángulo objetivo
let frascoVolando  = null;        // frasco que está en el aire hacia la balanza
let balanzaShake   = 0;           // vibración al caer frasco

// Frascos en el suelo (opciones)
let frascos        = [];

// ─── SONIDOS ──────────────────────────────────────────────────────────────────
const sonidoLanzar   = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");
const sonidoCorrecto = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const sonidoError    = new Audio("https://actions.google.com/sounds/v1/cartoon/concussive_guitar_hit.ogg");
const musicaFondo    = new Audio("/static/sounds/fondo.mp3");
musicaFondo.volume   = 0.35; musicaFondo.loop = true;
sonidoLanzar.volume  = 0.4; sonidoCorrecto.volume = 0.6; sonidoError.volume = 0.5;

// ─── ZORRITO ──────────────────────────────────────────────────────────────────
let fox = { x: 100, y: 490, w: 44, h: 44, vx: 0, anim: 0 };
const FOX_SPEED = 4.5;
const SUELO_Y   = 490;

// ─── PREGUNTAS ─────────────────────────────────────────────────────────────────
// Formato: a/b = c/? → hallar el cuarto término
// La balanza izquierda muestra la razón conocida (a:b)
// La balanza derecha muestra (c:?) y el alumno elige el frasco con el ? correcto
const preguntas = [
  { razon:"2 : 4",  igual:"6 : ?", respuesta:12, opciones:[8, 12, 10],  correcta:1,
    hint:"Si 2 es a 4, entonces 6 es a..." },
  { razon:"3 : 9",  igual:"5 : ?", respuesta:15, opciones:[15, 12, 18], correcta:0,
    hint:"Multiplica 5 por el mismo factor que 3→9" },
  { razon:"1 : 5",  igual:"4 : ?", respuesta:20, opciones:[16, 25, 20], correcta:2,
    hint:"1×5=5, entonces 4×5=..." },
  { razon:"4 : 8",  igual:"3 : ?", respuesta:6,  opciones:[6,  9,  4],  correcta:0,
    hint:"La razón 4:8 simplificada es 1:2" },
  { razon:"2 : 6",  igual:"5 : ?", respuesta:15, opciones:[10, 18, 15], correcta:2,
    hint:"2×3=6, entonces 5×3=..." },
  { razon:"10 : 2", igual:"25 : ?",respuesta:5,  opciones:[5,  8,  50], correcta:0,
    hint:"10÷5=2, entonces 25÷5=..." },
  { razon:"3 : 12", igual:"2 : ?", respuesta:8,  opciones:[6,  8,  10], correcta:1,
    hint:"3×4=12, entonces 2×4=..." },
  { razon:"5 : 15", igual:"6 : ?", respuesta:18, opciones:[24, 18, 12], correcta:1,
    hint:"5×3=15, entonces 6×3=..." },
  { razon:"7 : 14", igual:"4 : ?", respuesta:8,  opciones:[14, 8,  12], correcta:1,
    hint:"La razón 7:14 es 1:2" },
  { razon:"6 : 18", igual:"4 : ?", respuesta:12, opciones:[12, 8,  24], correcta:0,
    hint:"6×3=18, entonces 4×3=..." },
];

// ─── COLORES FRASCOS ──────────────────────────────────────────────────────────
const FRASCO_COLS = [
  { liquido:"#44ffaa", glow:"rgba(68,255,170,0.7)", borde:"#22dd88" },
  { liquido:"#ff8844", glow:"rgba(255,136,68,0.7)",  borde:"#dd6622" },
  { liquido:"#aa44ff", glow:"rgba(170,68,255,0.7)",  borde:"#8822dd" },
];

// ─── POSICIONES FRASCOS ────────────────────────────────────────────────────────
const FRASCO_XS   = [160, 460, 760];
const FRASCO_Y    = 450;
const FRASCO_W    = 52;
const FRASCO_H    = 80;

// Balanza
const BAL_CX = 500;   // centro X de la balanza
const BAL_Y  = 160;   // Y del pivote
const BAL_L  = 220;   // mitad del largo de la barra
const PLAT_Y = 60;    // longitud del hilo del platillo

// ─── GENERAR FRASCOS ─────────────────────────────────────────────────────────
function generarFrascos() {
  if (currentQ >= preguntas.length) return;
  const q = preguntas[currentQ];
  frascos = q.opciones.map((val, i) => ({
    x:       FRASCO_XS[i],
    y:       FRASCO_Y,
    w:       FRASCO_W,
    h:       FRASCO_H,
    valor:   val,
    correcta: i === q.correcta,
    color:   FRASCO_COLS[i],
    burbFase: Math.random() * Math.PI * 2,
    wobble:  0
  }));
  balanzaAngulo = 8;   // empieza inclinada (desequilibrada)
  balanzaTarget = 8;
}

// ─── DECORACIÓN: TUBOS DE LABORATORIO ─────────────────────────────────────────
const tubos = [
  { x:40,  y:350, h:180, color:"#44ffaa", burbFase:0 },
  { x:80,  y:370, h:160, color:"#ff8844", burbFase:1 },
  { x:880, y:340, h:190, color:"#aa44ff", burbFase:2 },
  { x:920, y:360, h:170, color:"#44aaff", burbFase:0.5 },
];

// ─── INIT HUMOS Y BURBUJAS DE TUBOS ──────────────────────────────────────────
function initLab() {
  humos = [];
  for (let i = 0; i < 20; i++) {
    const t = tubos[Math.floor(Math.random()*tubos.length)];
    humos.push({
      x: t.x + 10,
      y: t.y - 10,
      r: 4 + Math.random()*8,
      vy: -(0.4 + Math.random()*0.5),
      vx: (Math.random()-0.5)*0.5,
      alfa: 0.5,
      color: t.color
    });
  }
}

// ─── FONDO LABORATORIO ────────────────────────────────────────────────────────
function drawFondo() {
  // Fondo oscuro con vetas
  const g = ctx.createLinearGradient(0,0,0,canvas.height);
  g.addColorStop(0,   "#050f05");
  g.addColorStop(0.5, "#0a1e0a");
  g.addColorStop(1,   "#030a03");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Grid de laboratorio (cuadriculado tenue)
  ctx.strokeStyle = "rgba(68,255,68,0.04)";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke();
  }

  // Estantes del fondo
  [[0,200,400],[600,200,400]].forEach(([x,y,w]) => {
    ctx.fillStyle = "#0d200d";
    ctx.fillRect(x, y, w, 18);
    ctx.strokeStyle = "rgba(68,255,68,0.25)"; ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, 18);
    // Objetos en el estante
    for (let xi = x+20; xi < x+w-20; xi += 35) {
      ctx.fillStyle = ["#44ffaa33","#ff884433","#aa44ff33"][Math.floor((xi/35)%3)];
      ctx.fillRect(xi, y-28, 16, 28);
      ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth=1;
      ctx.strokeRect(xi, y-28, 16, 28);
    }
  });

  // Suelo con brillo
  ctx.fillStyle = "#0d200d";
  ctx.fillRect(0, SUELO_Y + fox.h + 4, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(68,255,68,0.35)"; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, SUELO_Y + fox.h + 4);
  ctx.lineTo(canvas.width, SUELO_Y + fox.h + 4);
  ctx.stroke();

  // Reflejos en el suelo
  for (let x = 50; x < canvas.width; x += 120) {
    const rg = ctx.createRadialGradient(x, SUELO_Y+fox.h+4, 0, x, SUELO_Y+fox.h+4, 60);
    rg.addColorStop(0, "rgba(68,255,68,0.06)");
    rg.addColorStop(1, "rgba(68,255,68,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(x-60, SUELO_Y+fox.h, 120, 20);
  }
}

// ─── TUBOS DE LABORATORIO ─────────────────────────────────────────────────────
function drawTubos() {
  tubos.forEach(t => {
    t.burbFase += 0.02;
    // Tubo de cristal
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth   = 3;
    ctx.fillStyle   = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.rect(t.x, t.y - t.h, 20, t.h);
    ctx.fill(); ctx.stroke();

    // Líquido animado dentro del tubo
    const lvl = t.h * (0.5 + Math.sin(t.burbFase * 0.3) * 0.1);
    const lg  = ctx.createLinearGradient(t.x, t.y-lvl, t.x, t.y);
    lg.addColorStop(0, t.color+"55");
    lg.addColorStop(1, t.color+"cc");
    ctx.fillStyle = lg;
    ctx.fillRect(t.x+2, t.y-lvl, 16, lvl);

    // Burbujas subiendo
    for (let b = 0; b < 3; b++) {
      const bFase = t.burbFase + b * 1.5;
      const bx = t.x + 5 + (b*5);
      const by = t.y - 10 - (bFase * 20 % (t.h - 10));
      if (by < t.y && by > t.y - lvl) {
        ctx.fillStyle   = "rgba(255,255,255,0.35)";
        ctx.beginPath(); ctx.arc(bx, by, 2.5, 0, Math.PI*2); ctx.fill();
      }
    }

    // Burbujeo arriba del tubo
    ctx.shadowColor = t.color; ctx.shadowBlur = 14;
    ctx.fillStyle   = t.color+"88";
    ctx.beginPath(); ctx.arc(t.x+10, t.y-t.h-4, 6+Math.sin(t.burbFase)*3, 0, Math.PI*2);
    ctx.fill(); ctx.shadowBlur = 0;

    // Conectores (tubos curvos decorativos entre los 2 tubos de cada lado)
    if (t.x === 40) {
      ctx.strokeStyle = t.color+"66"; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(t.x+20, t.y - t.h*0.6);
      ctx.bezierCurveTo(t.x+40, t.y-t.h*0.6, t.x+40, t.y-t.h*0.4+30, t.x+60, t.y-t.h*0.4+30);
      ctx.stroke();
    }
  });

  // Humos
  humos.forEach(h => {
    h.x  += h.vx; h.y += h.vy;
    h.r  += 0.12; h.alfa -= 0.006;
    if (h.alfa <= 0) {
      const t = tubos[Math.floor(Math.random()*tubos.length)];
      h.x=t.x+10; h.y=t.y-t.h-10;
      h.r=4+Math.random()*6; h.alfa=0.5; h.color=t.color;
    }
    ctx.globalAlpha = h.alfa;
    ctx.fillStyle   = h.color;
    ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  });
}

// ─── BALANZA ──────────────────────────────────────────────────────────────────
function drawBalanza() {
  // Suavizar ángulo
  balanzaAngulo += (balanzaTarget - balanzaAngulo) * 0.05;
  if (balanzaShake > 0) { balanzaShake *= 0.85; }
  const ang    = (balanzaAngulo + Math.sin(tiempo*0.03)*0.3) * Math.PI / 180;
  const shake  = Math.sin(tiempo*0.5) * balanzaShake;

  // Soporte vertical
  ctx.fillStyle   = "#1a3a1a";
  ctx.shadowColor = "rgba(68,255,68,0.3)"; ctx.shadowBlur = 10;
  ctx.fillRect(BAL_CX - 8, BAL_Y, 16, 300);
  ctx.fillStyle = "#0d200d";
  ctx.fillRect(BAL_CX - 40, BAL_Y + 295, 80, 14);
  ctx.shadowBlur = 0;

  // Base decorativa
  ctx.fillStyle = "#1a3a1a";
  ctx.beginPath();
  ctx.ellipse(BAL_CX, BAL_Y + 305, 55, 10, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = "rgba(68,255,68,0.4)"; ctx.lineWidth = 2;
  ctx.stroke();

  // Pivote central (círculo brillante)
  ctx.shadowColor = "#44ff44"; ctx.shadowBlur = 20;
  ctx.fillStyle   = "#44ff44";
  ctx.beginPath(); ctx.arc(BAL_CX + shake, BAL_Y, 12, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur  = 0;
  ctx.fillStyle   = "#aaffaa";
  ctx.beginPath(); ctx.arc(BAL_CX+shake-3, BAL_Y-3, 4, 0, Math.PI*2); ctx.fill();

  // ── Barra de la balanza ──
  ctx.save();
  ctx.translate(BAL_CX + shake, BAL_Y);
  ctx.rotate(ang);

  ctx.shadowColor = "rgba(68,255,68,0.4)"; ctx.shadowBlur = 8;
  ctx.strokeStyle = "#44ff44"; ctx.lineWidth = 8;
  ctx.lineCap     = "round";
  ctx.beginPath(); ctx.moveTo(-BAL_L, 0); ctx.lineTo(BAL_L, 0); ctx.stroke();
  ctx.shadowBlur  = 0;

  // Barra de detalle
  ctx.strokeStyle = "#aaffaa"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-BAL_L, 0); ctx.lineTo(BAL_L, 0); ctx.stroke();

  // ── Platillo IZQUIERDO (razón conocida) ──
  drawPlatillo(ctx, -BAL_L, PLAT_Y, "left");

  // ── Platillo DERECHO (valor a encontrar) ──
  drawPlatillo(ctx, BAL_L, PLAT_Y, "right");

  ctx.restore();

  // Contenido de platillos (fuera del rotate para texto legible)
  drawContenidoPlatillos(ang, shake);
}

function drawPlatillo(c, rx, ry, lado) {
  // Hilos
  c.strokeStyle = "#66ff66"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(rx-20, 0); c.lineTo(rx-25, ry); c.stroke();
  c.beginPath(); c.moveTo(rx+20, 0); c.lineTo(rx+25, ry); c.stroke();
  c.beginPath(); c.moveTo(rx,     0); c.lineTo(rx,   ry); c.stroke();

  // Platillo (elipse)
  c.shadowColor = lado==="left" ? "#44ff44" : "#ff8844";
  c.shadowBlur  = 12;
  const platColor = lado==="left" ? "#1a4a1a" : "#3a1a0a";
  c.fillStyle   = platColor;
  c.beginPath(); c.ellipse(rx, ry, 55, 12, 0, 0, Math.PI*2); c.fill();
  c.strokeStyle = lado==="left" ? "#44ff44" : "#ff8844";
  c.lineWidth   = 2.5; c.stroke();
  c.shadowBlur  = 0;
  // Borde interior
  c.strokeStyle = "rgba(255,255,255,0.1)"; c.lineWidth = 1;
  c.beginPath(); c.ellipse(rx, ry, 42, 8, 0, 0, Math.PI*2); c.stroke();
}

function drawContenidoPlatillos(ang, shake) {
  if (currentQ >= preguntas.length) return;
  const q = preguntas[currentQ];

  // Posición del platillo izquierdo y derecho en coordenadas de pantalla
  const lx = BAL_CX + shake + (-BAL_L)*Math.cos(ang) - PLAT_Y*Math.sin(ang);
  const ly = BAL_Y + (-BAL_L)*Math.sin(ang) + PLAT_Y*Math.cos(ang);
  const rx = BAL_CX + shake + BAL_L*Math.cos(ang) - PLAT_Y*Math.sin(ang);
  const ry = BAL_Y + BAL_L*Math.sin(ang) + PLAT_Y*Math.cos(ang);

  // ── Platillo IZQUIERDO: razón conocida (siempre lleno, piedras verdes) ──
  // Piedra/pesa decorativa
  ctx.shadowColor = "#44ff44"; ctx.shadowBlur = 14;
  ctx.fillStyle   = "#225522";
  ctx.beginPath(); ctx.ellipse(lx, ly-14, 32, 18, ang, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#44ff44"; ctx.lineWidth = 2; ctx.stroke();
  ctx.shadowBlur  = 0;
  // Brillo
  ctx.fillStyle = "rgba(68,255,68,0.3)";
  ctx.beginPath(); ctx.ellipse(lx-8, ly-20, 12, 6, ang, 0, Math.PI*2); ctx.fill();

  // Texto de la razón (rotado con la balanza para quedar horizontal)
  ctx.save();
  ctx.translate(lx, ly-14);
  ctx.fillStyle = "#aaffaa"; ctx.font = "bold 13px Minecraftia"; ctx.textAlign = "center";
  ctx.shadowColor = "#44ff44"; ctx.shadowBlur = 6;
  ctx.fillText(q.razon, 0, 5);
  ctx.shadowBlur = 0;
  ctx.restore();

  // ── Platillo DERECHO: lado a completar ──
  ctx.shadowColor = "#ff8844"; ctx.shadowBlur = 14;
  ctx.fillStyle   = "#3a1a0a";
  ctx.beginPath(); ctx.ellipse(rx, ry-14, 32, 18, ang, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#ff8844"; ctx.lineWidth = 2; ctx.stroke();
  ctx.shadowBlur  = 0;

  ctx.save();
  ctx.translate(rx, ry-14);
  ctx.fillStyle = "#ffcc88"; ctx.font = "bold 13px Minecraftia"; ctx.textAlign = "center";
  ctx.shadowColor = "#ff8844"; ctx.shadowBlur = 6;
  // Muestra la parte conocida y el interrogante
  const partes = q.igual.split(":");
  ctx.fillText(`${partes[0].trim()} : ?`, 0, 5);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─── FRASCOS EN EL SUELO ──────────────────────────────────────────────────────
function drawFrascos() {
  frascos.forEach((f, i) => {
    f.burbFase += 0.04;
    const c = f.color;
    const isNear = Math.abs((fox.x + fox.w/2) - (f.x + f.w/2)) < 60;

    // Sombra del frasco
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath(); ctx.ellipse(f.x+f.w/2, f.y+f.h+4, f.w*0.4, 6, 0, 0, Math.PI*2); ctx.fill();

    // Cuerpo del frasco (balón de Erlenmeyer)
    ctx.shadowColor = isNear ? c.glow : "transparent";
    ctx.shadowBlur  = isNear ? 20 : 0;

    // Cuello del frasco
    ctx.fillStyle = "#0a1a0a";
    ctx.strokeStyle = c.borde; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(f.x + f.w*0.35, f.y);
    ctx.lineTo(f.x + f.w*0.65, f.y);
    ctx.lineTo(f.x + f.w*0.65, f.y + f.h*0.28);
    ctx.lineTo(f.x + f.w*0.35, f.y + f.h*0.28);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Cuerpo esférico
    ctx.fillStyle   = "#071207";
    ctx.beginPath();
    ctx.arc(f.x+f.w/2, f.y+f.h*0.65, f.w*0.48, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();

    // Líquido dentro del frasco
    ctx.save();
    ctx.beginPath();
    ctx.arc(f.x+f.w/2, f.y+f.h*0.65, f.w*0.44, 0, Math.PI*2);
    ctx.clip();
    const fillY = f.y + f.h*0.4 + Math.sin(f.burbFase*0.5)*3;
    const liqG  = ctx.createLinearGradient(0, fillY, 0, f.y+f.h);
    liqG.addColorStop(0, c.liquido+"66");
    liqG.addColorStop(1, c.liquido+"ee");
    ctx.fillStyle = liqG;
    ctx.fillRect(f.x, fillY, f.w, f.h);
    // Olas
    ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let wx = 0; wx <= f.w; wx += 3)
      wx===0 ? ctx.moveTo(f.x+wx, fillY+Math.sin(wx*0.3+f.burbFase)*2)
             : ctx.lineTo(f.x+wx, fillY+Math.sin(wx*0.3+f.burbFase)*2);
    ctx.stroke();
    // Burbuja interna
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath(); ctx.arc(f.x+f.w*0.35, fillY+8+Math.sin(f.burbFase)*5, 3, 0, Math.PI*2); ctx.fill();
    ctx.restore();

    ctx.shadowBlur = 0;

    // Tapón del frasco
    ctx.fillStyle = c.liquido+"cc";
    ctx.fillRect(f.x+f.w*0.38, f.y-8, f.w*0.24, 10);
    ctx.strokeStyle = c.borde; ctx.lineWidth=1.5;
    ctx.strokeRect(f.x+f.w*0.38, f.y-8, f.w*0.24, 10);

    // Etiqueta con el valor (pegada al frasco)
    ctx.fillStyle   = "#ffffcc";
    ctx.fillRect(f.x+4, f.y+f.h*0.55, f.w-8, 22);
    ctx.strokeStyle = c.borde; ctx.lineWidth=1;
    ctx.strokeRect(f.x+4, f.y+f.h*0.55, f.w-8, 22);
    ctx.fillStyle   = "#222";
    ctx.font        = "bold 14px Minecraftia";
    ctx.textAlign   = "center";
    ctx.fillText(f.valor, f.x+f.w/2, f.y+f.h*0.55+15);

    // Indicador de selección si el zorrito está cerca
    if (isNear) {
      ctx.fillStyle   = c.borde;
      ctx.shadowColor = c.glow; ctx.shadowBlur = 10;
      ctx.font        = "20px Arial";
      ctx.fillText("▲", f.x+f.w/2, f.y - 16);
      ctx.shadowBlur  = 0;
    }
    ctx.textAlign = "left";
  });
}

// ─── FRASCO VOLANDO ───────────────────────────────────────────────────────────
function drawFrascoVolando() {
  if (!frascoVolando) return;
  const f = frascoVolando;
  f.x  += f.vx;
  f.y  += f.vy;
  f.vy += 0.4;   // gravedad
  f.rot += 0.08;
  f.life--;

  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(f.rot);
  ctx.shadowColor = f.color.glow; ctx.shadowBlur = 16;
  // Frasco simplificado en vuelo
  ctx.fillStyle   = f.color.liquido + "99";
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = f.color.borde; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle   = "#ffffcc"; ctx.font = "bold 10px Minecraftia"; ctx.textAlign="center";
  ctx.fillText(f.valor, 0, 4);
  ctx.shadowBlur  = 0;
  ctx.restore();

  // ¿Llegó al platillo de la balanza?
  const targetX = BAL_CX + BAL_L * Math.cos(balanzaAngulo*Math.PI/180);
  const targetY = BAL_Y  + BAL_L * Math.sin(balanzaAngulo*Math.PI/180) + PLAT_Y - 14;

  if (f.y < targetY + 20 && f.x > targetX - 60 && f.x < targetX + 60 && f.life < 60) {
    // Impacto en el platillo
    balanzaShake = 10;
    crearParticulas(f.x, f.y, f.color.liquido);

    if (f.correcta) {
      aciertos++;
      balanzaTarget = 0;    // se equilibra ✓
      feedbackMsg   = "¡Equilibrado! ⚖️✨";
      feedbackOk    = true;
      sonidoCorrecto.currentTime = 0; sonidoCorrecto.play();
      crearParticulas(BAL_CX, BAL_Y, "#44ff44");
    } else {
      balanzaTarget = -12;  // cae al otro lado ✗
      feedbackMsg   = `¡Incorrecto! Era ${preguntas[currentQ].respuesta} 😅`;
      feedbackOk    = false;
      sonidoError.currentTime = 0; sonidoError.play();
    }
    feedbackTimer  = 90;
    frascoVolando  = null;

    setTimeout(() => {
      siguientePregunta();
      colisionLock = false;
    }, 1100);
  }

  if (f.life <= 0) frascoVolando = null;
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function drawHUD() {
  if (currentQ >= preguntas.length) return;
  const q = preguntas[currentQ];

  ctx.fillStyle = "rgba(5,15,5,0.82)";
  roundRect(ctx, 10, 10, 980, 88, 12); ctx.fill();
  ctx.strokeStyle = "rgba(68,255,68,0.4)"; ctx.lineWidth = 1.5;
  roundRect(ctx, 10, 10, 980, 88, 12); ctx.stroke();

  // Aciertos
  ctx.fillStyle = "#66ff66"; ctx.font = "13px Minecraftia"; ctx.textAlign = "left";
  ctx.fillText(`⚗️ Aciertos: ${aciertos}`, 22, 34);

  // Progreso
  const bW = 150;
  ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(22, 42, bW, 8);
  ctx.fillStyle = "#44ff44"; ctx.fillRect(22, 42, bW*(currentQ/preguntas.length), 8);
  ctx.strokeStyle = "#44ff44"; ctx.lineWidth=1; ctx.strokeRect(22,42,bW,8);
  ctx.fillStyle = "#aaffaa"; ctx.font = "10px Minecraftia";
  ctx.fillText(`${currentQ+1}/${preguntas.length}`, 178, 51);

  // Pregunta / enunciado grande
  ctx.fillStyle   = "#ffffff"; ctx.font = "bold 17px Minecraftia"; ctx.textAlign = "center";
  ctx.shadowColor = "#44ff44"; ctx.shadowBlur = 5;
  ctx.fillText(`Si  ${q.razon}  =  ${q.igual}  →  ¿Cuánto es ?`, canvas.width/2 + 50, 40);
  ctx.shadowBlur  = 0;

  // Pista
  ctx.fillStyle = "#88ff88"; ctx.font = "12px Minecraftia";
  ctx.fillText(`💡 Pista: ${q.hint}`, canvas.width/2 + 50, 62);

  ctx.fillStyle = "#ffe066"; ctx.font = "11px Minecraftia";
  ctx.fillText("↑ = LANZAR FRASCO A LA BALANZA", canvas.width/2 + 50, 82);
  ctx.textAlign = "left";
}

// ─── ZORRITO ALQUIMISTA ───────────────────────────────────────────────────────
function drawFox() {
  fox.anim += 0.1;
  const bob = Math.sin(fox.anim) * (fox.vx !== 0 ? 2 : 0.8);
  ctx.save();
  ctx.translate(fox.x + fox.w/2, fox.y + fox.h/2 + bob);
  if (fox.vx < 0) ctx.scale(-1,1);

  // Capa de mago (verde oscura con estrella)
  ctx.fillStyle = "#1a4a1a";
  ctx.beginPath();
  ctx.moveTo(-18, 2);
  ctx.lineTo(-22, 28);
  ctx.lineTo(22, 28);
  ctx.lineTo(18, 2);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#44ff44"; ctx.lineWidth = 1.5; ctx.stroke();
  // Estrellas en la capa
  ctx.fillStyle = "#44ff44";
  ctx.font = "8px Arial"; ctx.textAlign="center";
  ctx.fillText("✦", -8, 20); ctx.fillText("✦", 8, 16);

  // Sombrero de mago puntiagudo
  ctx.fillStyle = "#0d2a0d";
  ctx.beginPath();
  ctx.moveTo(0, -38); ctx.lineTo(-16, -14); ctx.lineTo(16, -14);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#44ff44"; ctx.lineWidth=1.5; ctx.stroke();
  // Ala del sombrero
  ctx.fillStyle = "#1a4a1a";
  ctx.fillRect(-20, -16, 40, 6);
  ctx.strokeStyle = "#44ff44"; ctx.lineWidth=1; ctx.strokeRect(-20,-16,40,6);
  // Banda dorada
  ctx.fillStyle = "#ffe066";
  ctx.fillRect(-16, -18, 32, 4);
  // Estrella del sombrero
  ctx.fillStyle = "#ffe066"; ctx.font="10px Arial";
  ctx.fillText("⭐", 0, -26);

  // Cabeza
  ctx.fillStyle = "#ff9933";
  ctx.fillRect(-14,-12,28,22);
  // Orejas
  ctx.fillStyle="#ff8000";
  ctx.fillRect(-16,-16,6,6); ctx.fillRect(10,-16,6,6);
  // Gafas de científico
  ctx.strokeStyle="#aaffaa"; ctx.lineWidth=1.5;
  ctx.strokeRect(-10,-6,8,6); ctx.strokeRect(2,-6,8,6);
  ctx.beginPath(); ctx.moveTo(-2,-4); ctx.lineTo(2,-4); ctx.stroke();
  // Nariz
  ctx.fillStyle="#000"; ctx.fillRect(-2,0,4,3);
  // Ojos (detrás de las gafas)
  ctx.fillStyle="#000"; ctx.fillRect(-8,-5,3,3); ctx.fillRect(4,-5,3,3);
  // Boca con expresión de concentración
  ctx.strokeStyle="#000"; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(0,7,4,0,Math.PI); ctx.stroke();

  // Brazos
  ctx.fillStyle="#ff9933";
  ctx.fillRect(-22,2,8,5); ctx.fillRect(14,2,8,5);
  // Mano con frasco (izquierda sosteniendo un frasquito)
  ctx.fillStyle="#44ffaa88";
  ctx.beginPath(); ctx.arc(-18,8,5,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#44ff44"; ctx.lineWidth=1; ctx.stroke();

  // Pantalón oscuro
  ctx.fillStyle="#0d2a0d";
  ctx.fillRect(-12,22,10,14); ctx.fillRect(2,22,10,14);
  // Zapatos puntiagudos
  ctx.fillStyle="#ffe066";
  ctx.beginPath(); ctx.ellipse(-7,37,8,4,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(7,37,8,4,0,0,Math.PI*2); ctx.fill();

  // Cola
  ctx.fillStyle="#ff9933"; ctx.fillRect(14,18,10,5);
  ctx.fillStyle="#fff"; ctx.fillRect(22,18,4,5);

  ctx.restore();
}

// ─── FEEDBACK ─────────────────────────────────────────────────────────────────
function drawFeedback() {
  if (feedbackTimer <= 0) return;
  feedbackTimer--;
  ctx.globalAlpha = Math.min(1, feedbackTimer/22);
  const color = feedbackOk ? "#44ff44" : "#ff4466";
  ctx.font        = "bold 26px 'Minecraftia', monospace";
  ctx.textAlign   = "center";
  ctx.fillStyle   = color;
  ctx.shadowColor = color; ctx.shadowBlur = 24;
  ctx.fillText(feedbackMsg, canvas.width/2, canvas.height/2 - 30);
  ctx.shadowBlur  = 0; ctx.globalAlpha = 1; ctx.textAlign = "left";
}

// ─── PARTÍCULAS ───────────────────────────────────────────────────────────────
function crearParticulas(x, y, color) {
  for (let i = 0; i < 26; i++) {
    particulas.push({
      x, y,
      vx:(Math.random()*8)-4,
      vy:(Math.random()*-7)-1,
      life:70, maxLife:70,
      color, r:2+Math.random()*6
    });
  }
}
function drawParticulas() {
  particulas.forEach(p => {
    ctx.globalAlpha = p.life/p.maxLife;
    ctx.fillStyle   = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur  = 0;
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.r*=0.97; p.life--;
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
  if (e.key === "ArrowUp" && !keys["_act"] && !frascoVolando) {
    keys["_act"] = true;
    lanzarFrasco();
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

// ─── LANZAR FRASCO ────────────────────────────────────────────────────────────
function lanzarFrasco() {
  // Frasco más cercano al zorrito
  const fx = fox.x + fox.w/2;
  let closest=-1, minD=999;
  frascos.forEach((f,i)=>{
    const d = Math.abs(fx-(f.x+f.w/2));
    if(d<minD){minD=d;closest=i;}
  });
  if(closest<0||minD>80) return;

  const f = frascos[closest];
  colisionLock = true;

  // Calcular trayectoria parabólica hacia el platillo derecho
  const startX = f.x + f.w/2;
  const startY = f.y;
  const targetX = BAL_CX + BAL_L;
  const targetY = BAL_Y + PLAT_Y - 30;
  const frames  = 45;
  const vx = (targetX - startX) / frames;
  const vy = (targetY - startY) / frames - 0.4 * frames / 2;

  frascoVolando = {
    x: startX, y: startY,
    vx, vy,
    rot: 0,
    valor:    f.valor,
    correcta: f.correcta,
    color:    f.color,
    life:     frames + 20
  };

  sonidoLanzar.currentTime=0; sonidoLanzar.play();
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
function update() {
  if (juegoTerminado||pausado) return;
  tiempo++;
  if(keys["ArrowRight"]) fox.vx= FOX_SPEED;
  else if(keys["ArrowLeft"]) fox.vx=-FOX_SPEED;
  else fox.vx*=0.7;
  fox.x+=fox.vx;
  fox.x=Math.max(0,Math.min(fox.x,canvas.width-fox.w));
  fox.y=SUELO_Y;
}

// ─── SIGUIENTE PREGUNTA ───────────────────────────────────────────────────────
function siguientePregunta() {
  currentQ++;
  frascoVolando=null;
  if(currentQ>=preguntas.length) {
    juegoTerminado=true;
    estrellasFinal=[];
    for(let i=0;i<180;i++) {
      estrellasFinal.push({
        x:Math.random()*canvas.width,
        y:Math.random()*-canvas.height,
        vy:0.8+Math.random()*2,
        r:2+Math.random()*4,
        color:["#44ff44","#44ffaa","#aaff44","#ffff44","#ff8844"][Math.floor(Math.random()*5)]
      });
    }
    const puntaje=(aciertos/preguntas.length)*100;
    fetch("/guardar_progreso",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({grado:5,unidad:3,aciertos,total:preguntas.length,puntaje})
    }).then(r=>r.json()).then(d=>console.log("✅",d)).catch(e=>console.error("❌",e));
  } else {
    generarFrascos();
  }
}

// ─── PANTALLA FINAL ───────────────────────────────────────────────────────────
function drawFinal() {
  estrellasFinal.forEach(e=>{
    ctx.strokeStyle=e.color; ctx.lineWidth=1.5;
    ctx.shadowColor=e.color; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.stroke();
    ctx.shadowBlur=0;
    e.y+=e.vy; if(e.y>canvas.height+10) e.y=-10;
  });
  const pW=620,pH=270;
  const px=(canvas.width-pW)/2,py=(canvas.height-pH)/2;
  ctx.fillStyle="rgba(5,15,5,0.93)";
  roundRect(ctx,px,py,pW,pH,22); ctx.fill();
  ctx.strokeStyle="#44ff44"; ctx.lineWidth=4;
  ctx.shadowColor="#44ff44"; ctx.shadowBlur=20;
  roundRect(ctx,px+4,py+4,pW-8,pH-8,20); ctx.stroke();
  ctx.shadowBlur=0;
  ctx.fillStyle="#66ff66"; ctx.font="28px Minecraftia"; ctx.textAlign="center";
  ctx.shadowColor="#44ff44"; ctx.shadowBlur=10;
  ctx.fillText("⚖️ ¡Laboratorio completado!", canvas.width/2,py+62);
  ctx.shadowBlur=0;
  ctx.fillStyle="#ffe066"; ctx.font="22px Minecraftia";
  ctx.fillText(`⭐ ${aciertos} / ${preguntas.length} correctas`,canvas.width/2,py+108);
  const pct=Math.round((aciertos/preguntas.length)*100);
  const msg=pct===100?"¡Alquimista maestro! 🏆":pct>=70?"¡Muy proporcional! ⚗️":"¡Sigue mezclando! 🔬";
  ctx.fillStyle="#aaffaa"; ctx.font="14px Minecraftia";
  ctx.fillText(`${pct}% — ${msg}`,canvas.width/2,py+145);
  const bW=250,bH=54,bx=canvas.width/2-125,by=py+178;
  ctx.fillStyle="#0d2a0d";
  roundRect(ctx,bx,by,bW,bH,12); ctx.fill();
  ctx.strokeStyle="#44ff44"; ctx.lineWidth=2.5;
  ctx.shadowColor="#44ff44"; ctx.shadowBlur=12;
  roundRect(ctx,bx,by,bW,bH,12); ctx.stroke();
  ctx.shadowBlur=0;
  ctx.fillStyle="#fff"; ctx.font="20px Minecraftia";
  ctx.fillText("🔁 Reiniciar",canvas.width/2,by+36);
  ctx.textAlign="left";
}

function drawPausa() {
  ctx.fillStyle="rgba(5,15,5,0.82)"; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#66ff66"; ctx.font="42px Minecraftia"; ctx.textAlign="center";
  ctx.shadowColor="#44ff44"; ctx.shadowBlur=18;
  ctx.fillText("⏸ Pausa",canvas.width/2,canvas.height/2-44);
  ctx.shadowBlur=0;
  const bW=250,bH=60,bx=canvas.width/2-125,by=canvas.height/2;
  ctx.fillStyle="#0d2a0d";
  roundRect(ctx,bx,by,bW,bH,12); ctx.fill();
  ctx.strokeStyle="#44ff44"; ctx.lineWidth=2.5;
  roundRect(ctx,bx,by,bW,bH,12); ctx.stroke();
  ctx.fillStyle="#fff"; ctx.font="22px Minecraftia";
  ctx.fillText("▶ Continuar",canvas.width/2,by+39);
  ctx.textAlign="left";
}

canvas.addEventListener("click",e=>{
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left,my=e.clientY-rect.top;
  if(pausado&&!juegoTerminado){
    if(mx>=canvas.width/2-125&&mx<=canvas.width/2+125&&my>=canvas.height/2&&my<=canvas.height/2+60){
      pausado=false;musicaFondo.play();
    }
  }
  if(juegoTerminado){
    const pH=270,py=(canvas.height-pH)/2;
    const bW=250,bH=54,bx=canvas.width/2-125,by=py+178;
    if(mx>=bx&&mx<=bx+bW&&my>=by&&my<=by+bH) resetGame();
  }
});

// ─── DRAW PRINCIPAL ───────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawFondo();
  drawTubos();
  if(!juegoTerminado) {
    drawBalanza();
    drawFrascos();
    drawFrascoVolando();
    drawFox();
    drawHUD();
    drawFeedback();
    drawParticulas();
  }
  if(pausado&&!juegoTerminado) drawPausa();
  if(juegoTerminado){drawFinal();drawParticulas();}
}

// ─── RESET ────────────────────────────────────────────────────────────────────
function resetGame() {
  aciertos=0;currentQ=0;juegoTerminado=false;pausado=false;colisionLock=false;
  particulas=[];estrellasFinal=[];feedbackTimer=0;feedbackMsg="";
  frascoVolando=null;balanzaAngulo=8;balanzaTarget=8;balanzaShake=0;
  fox.x=100;fox.y=SUELO_Y;fox.vx=0;
  initLab();generarFrascos();
}

// ─── LOOP ─────────────────────────────────────────────────────────────────────
function gameLoop(){update();draw();requestAnimationFrame(gameLoop);}
resetGame();
gameLoop();
musicaFondo.play().catch(()=>{
  document.addEventListener("keydown",()=>musicaFondo.play(),{once:true});
});