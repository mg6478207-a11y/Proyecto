// 🎮 RETOMATE - Grado 5 | Unidad 2: Porcentajes
// 🎪 "La Feria de los Porcentajes" — feria nocturna de neón
// El zorrito se mueve bajo dispensadores y presiona ↑ para llenar el vaso correcto
// Controles: ← → mover | ↑ activar dispensador | P pausar

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");
canvas.width  = 1000;
canvas.height = 600;

// ─── ESTADO ────────────────────────────────────────────────────────────────────
let aciertos        = 0;
let currentQuestion = 0;
let juegoTerminado  = false;
let pausado         = false;
let tiempo          = 0;
let feedbackTimer   = 0;
let feedbackMsg     = "";
let feedbackOk      = true;
let particulas      = [];
let estrellasFinal  = [];
let lluvia          = [];        // confeti de feria
let colisionLock    = false;

// Animación del vaso activo
let vasoActivo      = -1;        // índice del dispensador bajo el zorrito
let nivelLlenado    = 0;         // 0..100 (porcentaje actual llenado)
let llenando        = false;
let llenandoVelocidad = 1.5;     // % por frame

// ─── SONIDOS ───────────────────────────────────────────────────────────────────
const sonidoLlenar   = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");
const sonidoCorrecto = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const sonidoError    = new Audio("https://actions.google.com/sounds/v1/cartoon/concussive_guitar_hit.ogg");
const musicaFondo    = new Audio("/static/sounds/fondo.mp3");
musicaFondo.volume   = 0.35; musicaFondo.loop = true;
sonidoLlenar.volume  = 0.3; sonidoCorrecto.volume = 0.6; sonidoError.volume = 0.5;

// ─── ZORRITO ───────────────────────────────────────────────────────────────────
let fox = { x: 440, y: 490, w: 44, h: 44, vx: 0, anim: 0 };
const FOX_SPEED = 4.5;
const SUELO_Y   = 500;

// ─── PREGUNTAS ─────────────────────────────────────────────────────────────────
// Cada pregunta tiene un número total, un porcentaje a encontrar, y 3 vasos
// con diferentes niveles. El niño debe activar el dispensador que está al % correcto.
const preguntas = [
  {
    pregunta: "¿Cuánto es el 50% de 80?",
    respuesta: 40,
    opciones: [
      { etiqueta: "20",  pct: 25, valor: 20  },
      { etiqueta: "40",  pct: 50, valor: 40  },
      { etiqueta: "60",  pct: 75, valor: 60  },
    ],
    correcta: 1
  },
  {
    pregunta: "¿Cuánto es el 25% de 200?",
    respuesta: 50,
    opciones: [
      { etiqueta: "50",  pct: 25, valor: 50  },
      { etiqueta: "75",  pct: 37, valor: 75  },
      { etiqueta: "100", pct: 50, valor: 100 },
    ],
    correcta: 0
  },
  {
    pregunta: "¿Cuánto es el 10% de 150?",
    respuesta: 15,
    opciones: [
      { etiqueta: "30",  pct: 20, valor: 30  },
      { etiqueta: "15",  pct: 10, valor: 15  },
      { etiqueta: "45",  pct: 30, valor: 45  },
    ],
    correcta: 1
  },
  {
    pregunta: "¿Cuánto es el 75% de 40?",
    respuesta: 30,
    opciones: [
      { etiqueta: "10",  pct: 25, valor: 10  },
      { etiqueta: "20",  pct: 50, valor: 20  },
      { etiqueta: "30",  pct: 75, valor: 30  },
    ],
    correcta: 2
  },
  {
    pregunta: "¿Cuánto es el 20% de 500?",
    respuesta: 100,
    opciones: [
      { etiqueta: "100", pct: 20, valor: 100 },
      { etiqueta: "50",  pct: 10, valor: 50  },
      { etiqueta: "250", pct: 50, valor: 250 },
    ],
    correcta: 0
  },
  {
    pregunta: "Si 100 caramelos son el 100%, ¿cuántos son el 30%?",
    respuesta: 30,
    opciones: [
      { etiqueta: "20",  pct: 20, valor: 20  },
      { etiqueta: "30",  pct: 30, valor: 30  },
      { etiqueta: "50",  pct: 50, valor: 50  },
    ],
    correcta: 1
  },
  {
    pregunta: "¿Cuánto es el 5% de 300?",
    respuesta: 15,
    opciones: [
      { etiqueta: "30",  pct: 10, valor: 30  },
      { etiqueta: "15",  pct: 5,  valor: 15  },
      { etiqueta: "60",  pct: 20, valor: 60  },
    ],
    correcta: 1
  },
  {
    pregunta: "¿Cuánto es el 100% de 75?",
    respuesta: 75,
    opciones: [
      { etiqueta: "25",  pct: 33, valor: 25  },
      { etiqueta: "50",  pct: 66, valor: 50  },
      { etiqueta: "75",  pct: 100,valor: 75  },
    ],
    correcta: 2
  },
  {
    pregunta: "¿Cuánto es el 40% de 50?",
    respuesta: 20,
    opciones: [
      { etiqueta: "20",  pct: 40, valor: 20  },
      { etiqueta: "10",  pct: 20, valor: 10  },
      { etiqueta: "25",  pct: 50, valor: 25  },
    ],
    correcta: 0
  },
  {
    pregunta: "En una clase de 200 alumnos, el 15% practica fútbol. ¿Cuántos son?",
    respuesta: 30,
    opciones: [
      { etiqueta: "20",  pct: 10, valor: 20  },
      { etiqueta: "30",  pct: 15, valor: 30  },
      { etiqueta: "40",  pct: 20, valor: 40  },
    ],
    correcta: 1
  },
];

// ─── DISPENSADORES (posiciones fijas de los 3 vasos) ──────────────────────────
const DISP_X    = [180, 460, 740];   // X centro de cada dispensador
const VASO_W    = 90;
const VASO_H    = 160;
const VASO_Y    = 310;               // Y superior del vaso
const DISP_Y    = 220;               // Y del dispensador (grifo)

// Estado de llenado por vaso (animación)
let nivelVasos  = [0, 0, 0];        // nivel actual de cada vaso (0..pct objetivo)
let vasoLlenado = -1;               // cuál se está llenando ahora

// Colores de neón para cada dispensador
const NEON = [
  { fondo:"#ff0066", borde:"#ff66aa", liquido:"#ff3388", glow:"rgba(255,0,102,0.7)" },
  { fondo:"#00ccff", borde:"#66eeff", liquido:"#00aaff", glow:"rgba(0,204,255,0.7)" },
  { fondo:"#aaff00", borde:"#ccff55", liquido:"#88dd00", glow:"rgba(170,255,0,0.7)"  },
];

// ─── DECORACIÓN: Luces de feria ───────────────────────────────────────────────
let lucesF = [];
function initLuces() {
  lucesF = [];
  for (let i = 0; i < 40; i++) {
    lucesF.push({
      x:    Math.random() * canvas.width,
      y:    Math.random() * 180,
      r:    3 + Math.random() * 5,
      color:["#ff0066","#00ccff","#aaff00","#ffff00","#ff6600","#cc00ff"][Math.floor(Math.random()*6)],
      fase: Math.random() * Math.PI * 2,
      vel:  0.04 + Math.random() * 0.06
    });
  }
}

// Globos decorativos
let globos = [];
function initGlobos() {
  globos = [];
  const cols = ["#ff0066","#00ccff","#aaff00","#ff6600","#cc00ff","#ffff00"];
  for (let i = 0; i < 8; i++) {
    globos.push({
      x:    50 + i * 120 + Math.random() * 60,
      y:    80 + Math.random() * 120,
      r:    18 + Math.random() * 12,
      color: cols[i % cols.length],
      fase:  Math.random() * Math.PI * 2,
      vel:   0.012 + Math.random() * 0.01
    });
  }
}

// Confeti permanente
let confeti = [];
function initConfeti() {
  confeti = [];
  for (let i = 0; i < 25; i++) {
    confeti.push({
      x:    Math.random() * canvas.width,
      y:    Math.random() * canvas.height,
      w:    5 + Math.random() * 8,
      h:    3 + Math.random() * 5,
      rot:  Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.06,
      vy:   0.4 + Math.random() * 0.8,
      color:["#ff0066","#00ccff","#aaff00","#ffff00","#ff6600"][Math.floor(Math.random()*5)]
    });
  }
}

function initMundo() { initLuces(); initGlobos(); initConfeti(); }

// ─── RESET VASOS ──────────────────────────────────────────────────────────────
function resetVasos() {
  nivelVasos   = [0, 0, 0];
  vasoLlenado  = -1;
  llenando     = false;
  vasoActivo   = -1;
  nivelLlenado = 0;
}

// ─── FONDO FERIA NOCTURNA ─────────────────────────────────────────────────────
function drawFondo() {
  // Cielo nocturno degradado
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0,   "#0a0015");
  g.addColorStop(0.5, "#1a0030");
  g.addColorStop(1,   "#0d001a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Estrellas de fondo
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  for (let i = 0; i < 60; i++) {
    const sx = ((i * 173 + tiempo * 0.01) % canvas.width);
    const sy = ((i * 97) % 200);
    const sr = 0.5 + Math.sin(tiempo * 0.05 + i) * 0.5;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2); ctx.fill();
  }

  // Suelo de la feria
  ctx.fillStyle = "#1a0a2e";
  ctx.fillRect(0, SUELO_Y + fox.h, canvas.width, canvas.height);
  // Tablones del suelo
  for (let x = 0; x < canvas.width; x += 60) {
    ctx.fillStyle = x % 120 === 0 ? "#250a3a" : "#1e0d30";
    ctx.fillRect(x, SUELO_Y + fox.h, 58, canvas.height);
  }
  // Línea brillante del suelo
  ctx.strokeStyle = "rgba(255,0,204,0.4)";
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(0, SUELO_Y + fox.h);
  ctx.lineTo(canvas.width, SUELO_Y + fox.h);
  ctx.stroke();

  // Guirnaldas de luces superiores
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 30);
  for (let x = 0; x <= canvas.width; x += 4) {
    ctx.lineTo(x, 30 + Math.sin(x * 0.03) * 12);
  }
  ctx.stroke();

  // Luces de feria parpadeantes
  lucesF.forEach(l => {
    l.fase += l.vel;
    const brillo = 0.5 + Math.sin(l.fase) * 0.5;
    ctx.shadowColor = l.color;
    ctx.shadowBlur  = 10 * brillo;
    ctx.fillStyle   = l.color;
    ctx.globalAlpha = 0.4 + brillo * 0.6;
    ctx.beginPath(); ctx.arc(l.x, l.y, l.r * brillo, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  });

  // Globos
  globos.forEach(gb => {
    gb.fase += gb.vel;
    const gy = gb.y + Math.sin(gb.fase) * 14;
    ctx.shadowColor = gb.color; ctx.shadowBlur = 14;
    ctx.fillStyle   = gb.color;
    ctx.beginPath(); ctx.arc(gb.x, gy, gb.r, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur  = 0;
    // Brillo
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath(); ctx.arc(gb.x - gb.r*0.3, gy - gb.r*0.3, gb.r*0.35, 0, Math.PI*2); ctx.fill();
    // Hilo
    ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gb.x, gy+gb.r); ctx.lineTo(gb.x+Math.sin(gb.fase)*5, gy+gb.r+40); ctx.stroke();
  });

  // Confeti flotando
  confeti.forEach(c => {
    c.y  += c.vy;
    c.rot += c.vrot;
    if (c.y > canvas.height + 10) { c.y = -10; c.x = Math.random()*canvas.width; }
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.fillStyle = c.color;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(-c.w/2, -c.h/2, c.w, c.h);
    ctx.globalAlpha = 1;
    ctx.restore();
  });
}

// ─── DISPENSADORES Y VASOS ────────────────────────────────────────────────────
function drawDispensadores() {
  if (currentQuestion >= preguntas.length) return;
  const q = preguntas[currentQuestion];

  DISP_X.forEach((cx, i) => {
    const op  = q.opciones[i];
    const n   = NEON[i];
    const nv  = nivelVasos[i];   // nivel actual de llenado (0..op.pct)
    const isActivo = (vasoLlenado === i);

    // ── Estructura del dispensador (grifo / máquina) ──
    // Base de la máquina
    ctx.shadowColor = n.glow; ctx.shadowBlur = isActivo ? 22 : 10;
    ctx.fillStyle   = "#1a0030";
    ctx.fillRect(cx - 35, DISP_Y - 60, 70, 80);
    ctx.strokeStyle = n.borde; ctx.lineWidth = 2.5;
    ctx.strokeRect(cx - 35, DISP_Y - 60, 70, 80);
    ctx.shadowBlur  = 0;

    // Pantalla del %, valor de la opción
    ctx.fillStyle = "#000820";
    ctx.fillRect(cx - 28, DISP_Y - 52, 56, 34);
    ctx.strokeStyle = n.borde; ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 28, DISP_Y - 52, 56, 34);
    // Texto del valor
    ctx.fillStyle   = n.borde;
    ctx.font        = "bold 18px 'Minecraftia', monospace";
    ctx.textAlign   = "center";
    ctx.shadowColor = n.borde; ctx.shadowBlur = 8;
    ctx.fillText(op.etiqueta, cx, DISP_Y - 30);
    ctx.shadowBlur  = 0;

    // Indicador % (pequeño)
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font      = "9px Minecraftia";
    ctx.fillText(`${op.pct}%`, cx, DISP_Y - 14);

    // Caño/grifo
    ctx.fillStyle   = n.fondo;
    ctx.shadowColor = n.glow; ctx.shadowBlur = isActivo ? 18 : 6;
    ctx.fillRect(cx - 5, DISP_Y + 18, 10, 22);
    ctx.fillRect(cx - 12, DISP_Y + 32, 24, 8);
    ctx.shadowBlur = 0;

    // Líquido cayendo (si está activo)
    if (isActivo && nv < op.pct) {
      const chorro_h = 40 + Math.random() * 6;
      const chorro_g = ctx.createLinearGradient(cx, DISP_Y + 40, cx, DISP_Y + 40 + chorro_h);
      chorro_g.addColorStop(0, n.liquido);
      chorro_g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle   = chorro_g;
      ctx.shadowColor = n.glow; ctx.shadowBlur = 12;
      ctx.fillRect(cx - 4, DISP_Y + 40, 8, chorro_h);
      ctx.shadowBlur = 0;
    }

    // ── Vaso ──
    const vasoX = cx - VASO_W/2;
    // Contorno del vaso (trapecio)
    ctx.strokeStyle = n.borde; ctx.lineWidth = 3;
    ctx.shadowColor = n.glow; ctx.shadowBlur = isActivo ? 16 : 6;
    ctx.beginPath();
    ctx.moveTo(vasoX + 8,      VASO_Y);
    ctx.lineTo(vasoX + VASO_W - 8, VASO_Y);
    ctx.lineTo(vasoX + VASO_W,     VASO_Y + VASO_H);
    ctx.lineTo(vasoX,              VASO_Y + VASO_H);
    ctx.closePath();
    ctx.strokeStyle = n.borde; ctx.stroke();
    ctx.fillStyle   = "rgba(255,255,255,0.04)";
    ctx.fill();
    ctx.shadowBlur  = 0;

    // Líquido dentro del vaso
    if (nv > 0) {
      const fillH  = (nv / 100) * VASO_H;
      const fillY  = VASO_Y + VASO_H - fillH;
      // Recorte del trapecio
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(vasoX + 8,          VASO_Y);
      ctx.lineTo(vasoX + VASO_W - 8, VASO_Y);
      ctx.lineTo(vasoX + VASO_W,     VASO_Y + VASO_H);
      ctx.lineTo(vasoX,              VASO_Y + VASO_H);
      ctx.closePath();
      ctx.clip();

      const lg = ctx.createLinearGradient(vasoX, fillY, vasoX, VASO_Y + VASO_H);
      lg.addColorStop(0,   n.liquido + "cc");
      lg.addColorStop(0.5, n.fondo   + "aa");
      lg.addColorStop(1,   n.liquido + "ff");
      ctx.fillStyle   = lg;
      ctx.shadowColor = n.glow; ctx.shadowBlur = 14;
      ctx.fillRect(vasoX, fillY, VASO_W, fillH);
      ctx.shadowBlur  = 0;

      // Burbujas dentro del líquido
      for (let b = 0; b < 4; b++) {
        const bx = vasoX + 10 + (b * 18 + tiempo * 0.4 + b * 20) % (VASO_W - 20);
        const by = fillY + 5 + ((tiempo * 0.8 + b * 30) % (fillH - 5));
        ctx.fillStyle   = "rgba(255,255,255,0.25)";
        ctx.beginPath(); ctx.arc(bx, by, 2.5, 0, Math.PI*2); ctx.fill();
      }

      // Superficie con ola
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(vasoX, fillY);
      for (let wx = 0; wx <= VASO_W; wx += 3) {
        ctx.lineTo(vasoX + wx, fillY + Math.sin(wx * 0.2 + tiempo * 0.1) * 2.5);
      }
      ctx.stroke();
      ctx.restore();

      // Etiqueta % sobre el líquido
      ctx.fillStyle   = "#fff";
      ctx.font        = "bold 13px Minecraftia";
      ctx.textAlign   = "center";
      ctx.shadowColor = n.glow; ctx.shadowBlur = 8;
      ctx.fillText(`${Math.round(nv)}%`, cx, fillY - 5);
      ctx.shadowBlur  = 0;
    }

    // Marca de línea objetivo (línea punteada en el vaso)
    const marcarY = VASO_Y + VASO_H - (op.pct / 100) * VASO_H;
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(vasoX + 2, marcarY);
    ctx.lineTo(vasoX + VASO_W - 2, marcarY);
    ctx.stroke();
    ctx.setLineDash([]);
    // Flecha en la marca
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font      = "9px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`${op.pct}%`, vasoX - 2, marcarY + 4);
  });
  ctx.textAlign = "left";
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function drawHUD() {
  if (currentQuestion >= preguntas.length) return;
  const q = preguntas[currentQuestion];

  // Panel superior
  ctx.fillStyle = "rgba(10,0,25,0.82)";
  roundRect(ctx, 10, 10, 980, 80, 12); ctx.fill();
  ctx.strokeStyle = "rgba(255,0,204,0.5)"; ctx.lineWidth = 1.5;
  roundRect(ctx, 10, 10, 980, 80, 12); ctx.stroke();

  // Aciertos
  ctx.fillStyle   = "#ff66ff";
  ctx.font        = "14px Minecraftia";
  ctx.textAlign   = "left";
  ctx.fillText(`🎪 Aciertos: ${aciertos}`, 24, 36);

  // Barra progreso
  const bW = 160;
  ctx.fillStyle = "rgba(255,255,255,0.1)"; ctx.fillRect(24, 44, bW, 8);
  ctx.fillStyle = "#ff00cc";
  ctx.fillRect(24, 44, bW * (currentQuestion / preguntas.length), 8);
  ctx.strokeStyle = "#ff00cc"; ctx.lineWidth = 1;
  ctx.strokeRect(24, 44, bW, 8);
  ctx.fillStyle = "#cc99ff"; ctx.font = "10px Minecraftia";
  ctx.fillText(`${currentQuestion+1}/${preguntas.length}`, 190, 53);

  // Pregunta centrada
  ctx.fillStyle   = "#ffffff";
  ctx.font        = "16px Minecraftia";
  ctx.textAlign   = "center";
  ctx.shadowColor = "#ff00cc"; ctx.shadowBlur = 6;
  ctx.fillText(q.pregunta, canvas.width/2 + 60, 52);
  ctx.shadowBlur  = 0;

  // Instrucción flecha
  ctx.fillStyle = "#ffe066"; ctx.font = "11px Minecraftia";
  ctx.fillText("↑ = ACTIVAR DISPENSADOR", canvas.width/2 + 60, 72);
  ctx.textAlign = "left";
}

// ─── ZORRITO FERIANTE ─────────────────────────────────────────────────────────
function drawFox() {
  fox.anim += 0.12;
  const bobY = Math.sin(fox.anim) * (fox.vx !== 0 ? 2 : 1);
  const fx   = fox.x;
  const fy   = fox.y + bobY;

  ctx.save();
  ctx.translate(fx + fox.w/2, fy + fox.h/2);
  // Espejo si va a la izquierda
  if (fox.vx < 0) ctx.scale(-1, 1);

  // Sombrero de feria (copa con ala)
  ctx.fillStyle = "#cc0066";
  ctx.fillRect(-14, -32, 28, 18);      // copa
  ctx.fillRect(-20, -16, 40, 5);       // ala
  // Banda del sombrero
  ctx.fillStyle = "#ffe066";
  ctx.fillRect(-14, -20, 28, 5);
  // Estrella en el sombrero
  ctx.fillStyle = "#fff";
  ctx.font = "8px Arial"; ctx.textAlign = "center";
  ctx.fillText("★", 0, -24);

  // Cabeza
  ctx.fillStyle = "#ff9933";
  ctx.fillRect(-14, -14, 28, 22);
  // Orejas
  ctx.fillStyle = "#ff8000";
  ctx.fillRect(-16, -18, 6, 6);
  ctx.fillRect(10,  -18, 6, 6);
  ctx.fillStyle = "#ff4400";
  ctx.fillRect(-15, -17, 3, 4);
  ctx.fillRect(12,  -17, 3, 4);
  // Mejilla / hocico
  ctx.fillStyle = "#fff0cc";
  ctx.fillRect(-8, 0, 16, 7);
  // Nariz
  ctx.fillStyle = "#000";
  ctx.fillRect(-2, -2, 4, 3);
  // Ojos con brillo neón
  ctx.fillStyle = "#000";
  ctx.fillRect(-9, -8, 3, 3);
  ctx.fillRect(6,  -8, 3, 3);
  ctx.fillStyle = "#fff";
  ctx.fillRect(-8, -9, 1, 2);
  ctx.fillRect(7,  -9, 1, 2);

  // Cuerpo con traje de feria (rojo con pompones)
  ctx.fillStyle = "#cc0044";
  ctx.fillRect(-12, 8, 24, 18);
  // Pompones blancos
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(-6, 10, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 0, 10, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 6, 10, 3, 0, Math.PI*2); ctx.fill();

  // Brazos — el derecho sostiene un megáfono
  ctx.fillStyle = "#ff9933";
  ctx.fillRect(-20, 10, 8, 5);   // brazo izq
  ctx.fillRect(12,  10, 8, 5);   // brazo der
  // Megáfono
  ctx.fillStyle = "#ffe066";
  ctx.beginPath();
  ctx.moveTo(20, 8); ctx.lineTo(30, 5); ctx.lineTo(30, 16); ctx.lineTo(20, 14);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#ff6600"; ctx.lineWidth = 1; ctx.stroke();

  // Pantalón a cuadros
  ctx.fillStyle = "#880022";
  ctx.fillRect(-12, 26, 10, 12);
  ctx.fillRect(2,   26, 10, 12);
  // Cuadros
  ctx.strokeStyle = "#cc0044"; ctx.lineWidth = 1;
  for (let r=0;r<3;r++) for (let c=0;c<2;c++) {
    ctx.strokeRect(-12 + c*14, 26 + r*4, 10, 4);
  }

  // Zapatos con punta redonda
  ctx.fillStyle = "#ffcc00";
  ctx.beginPath(); ctx.ellipse(-6,  39, 9, 5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 6,  39, 9, 5, 0, 0, Math.PI*2); ctx.fill();

  // Cola
  ctx.fillStyle = "#ff9933";
  ctx.fillRect(12, 22, 10, 6);
  ctx.fillStyle = "#fff";
  ctx.fillRect(20, 22, 4, 6);

  ctx.restore();
}

// ─── INDICADOR DE POSICIÓN ────────────────────────────────────────────────────
function drawIndicadorPosicion() {
  // Flecha / halo bajo el dispensador más cercano
  const fx = fox.x + fox.w/2;
  let closest = -1, minDist = 999;
  DISP_X.forEach((dx, i) => {
    const dist = Math.abs(fx - dx);
    if (dist < minDist) { minDist = dist; closest = i; }
  });
  vasoActivo = minDist < 80 ? closest : -1;

  if (vasoActivo >= 0 && !colisionLock) {
    const cx = DISP_X[vasoActivo];
    const n  = NEON[vasoActivo];
    // Arco de selección bajo el zorrito
    ctx.strokeStyle = n.borde;
    ctx.lineWidth   = 2.5;
    ctx.shadowColor = n.glow; ctx.shadowBlur = 14;
    ctx.setLineDash([5,3]);
    ctx.beginPath();
    ctx.moveTo(fox.x + fox.w/2 - 22, fox.y + fox.h + 2);
    ctx.lineTo(cx, DISP_Y + 18);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Flecha parpadeante sobre la máquina
    const af = 0.6 + Math.sin(tiempo * 0.15) * 0.4;
    ctx.globalAlpha = af;
    ctx.fillStyle   = n.borde;
    ctx.shadowColor = n.glow; ctx.shadowBlur = 10;
    ctx.font        = "22px Arial";
    ctx.textAlign   = "center";
    ctx.fillText("▼", cx, DISP_Y - 68);
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
    ctx.textAlign   = "left";
  }
}

// ─── FEEDBACK ─────────────────────────────────────────────────────────────────
function drawFeedback() {
  if (feedbackTimer <= 0) return;
  feedbackTimer--;
  const alpha = Math.min(1, feedbackTimer / 20);
  ctx.globalAlpha = alpha;
  const color = feedbackOk ? "#00ff88" : "#ff4466";
  ctx.font        = "bold 28px 'Minecraftia', monospace";
  ctx.textAlign   = "center";
  ctx.fillStyle   = color;
  ctx.shadowColor = color; ctx.shadowBlur = 24;
  ctx.fillText(feedbackMsg, canvas.width/2, canvas.height/2 - 20);
  ctx.shadowBlur  = 0; ctx.globalAlpha = 1; ctx.textAlign = "left";
}

// ─── PARTÍCULAS ───────────────────────────────────────────────────────────────
function crearParticulas(x, y, color) {
  for (let i = 0; i < 28; i++) {
    particulas.push({
      x, y,
      vx: (Math.random()*8)-4,
      vy: (Math.random()*-7)-1,
      life: 70, maxLife: 70,
      color, r: 3 + Math.random()*6
    });
  }
}
function drawParticulas() {
  particulas.forEach(p => {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle   = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur  = 0;
    p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.r *= 0.97; p.life--;
  });
  ctx.globalAlpha = 1;
  particulas = particulas.filter(p => p.life > 0);
}

// ─── UTILIDADES ───────────────────────────────────────────────────────────────
function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x+r, y); c.lineTo(x+w-r, y);
  c.quadraticCurveTo(x+w, y, x+w, y+r);
  c.lineTo(x+w, y+h-r);
  c.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  c.lineTo(x+r, y+h);
  c.quadraticCurveTo(x, y+h, x, y+h-r);
  c.lineTo(x, y+r);
  c.quadraticCurveTo(x, y, x+r, y);
  c.closePath();
}

// ─── CONTROLES ────────────────────────────────────────────────────────────────
const keys = {};
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();

  if (juegoTerminado || pausado || colisionLock) return;

  if (e.key === "ArrowUp" && !keys["_act"]) {
    keys["_act"] = true;
    activarDispensador();
  }
  if (e.key === "p" || e.key === "P") {
    pausado = !pausado;
    if (pausado) musicaFondo.pause(); else musicaFondo.play();
  }
});
document.addEventListener("keyup", e => {
  keys[e.key] = false;
  if (e.key === "ArrowUp") keys["_act"] = false;
});

// ─── ACTIVAR DISPENSADOR ──────────────────────────────────────────────────────
function activarDispensador() {
  if (vasoActivo < 0 || colisionLock) return;
  if (vasoLlenado >= 0) return; // ya hay uno llenándose
  vasoLlenado = vasoActivo;
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
function update() {
  if (juegoTerminado || pausado) return;
  tiempo++;

  // Mover zorrito
  if (keys["ArrowRight"]) fox.vx =  FOX_SPEED;
  else if (keys["ArrowLeft"]) fox.vx = -FOX_SPEED;
  else fox.vx *= 0.7;

  fox.x += fox.vx;
  fox.x  = Math.max(0, Math.min(fox.x, canvas.width - fox.w));
  fox.y  = SUELO_Y;

  // Llenado animado del vaso activo
  if (vasoLlenado >= 0 && !colisionLock) {
    const q  = preguntas[currentQuestion];
    const op = q.opciones[vasoLlenado];
    if (nivelVasos[vasoLlenado] < op.pct) {
      nivelVasos[vasoLlenado] = Math.min(
        nivelVasos[vasoLlenado] + llenandoVelocidad,
        op.pct
      );
    } else {
      // Llenado completo → evaluar
      colisionLock = true;
      const esCorrecta = (vasoLlenado === q.correcta);

      if (esCorrecta) {
        aciertos++;
        feedbackMsg  = "¡Perfecto! 🎉";
        feedbackOk   = true;
        sonidoCorrecto.currentTime = 0; sonidoCorrecto.play();
        crearParticulas(DISP_X[vasoLlenado], VASO_Y + VASO_H/2, NEON[vasoLlenado].fondo);
        crearParticulas(DISP_X[vasoLlenado], VASO_Y + VASO_H/2, "#ffe066");
      } else {
        feedbackMsg  = `¡Ese no! Era ${q.respuesta} 😅`;
        feedbackOk   = false;
        sonidoError.currentTime = 0; sonidoError.play();
        crearParticulas(DISP_X[vasoLlenado], VASO_Y + VASO_H/2, "#ff4466");
      }
      feedbackTimer = 90;
      vasoLlenado   = -1;

      setTimeout(() => {
        siguientePregunta();
        colisionLock = false;
      }, 1100);
    }
  }
}

// ─── SIGUIENTE PREGUNTA ───────────────────────────────────────────────────────
function siguientePregunta() {
  currentQuestion++;
  resetVasos();
  if (currentQuestion >= preguntas.length) {
    juegoTerminado = true;
    estrellasFinal = [];
    for (let i = 0; i < 180; i++) {
      estrellasFinal.push({
        x:     Math.random() * canvas.width,
        y:     Math.random() * -canvas.height,
        vy:    0.8 + Math.random() * 2,
        r:     2 + Math.random() * 4,
        color: ["#ff0066","#00ccff","#aaff00","#ffff00","#ff6600","#cc00ff"][Math.floor(Math.random()*6)]
      });
    }
    const puntaje = (aciertos / preguntas.length) * 100;
    fetch("/guardar_progreso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grado:5, unidad:2, aciertos, total:preguntas.length, puntaje })
    }).then(r=>r.json()).then(d=>console.log("✅",d)).catch(e=>console.error("❌",e));
  }
}

// ─── PANTALLA FINAL ───────────────────────────────────────────────────────────
function drawFinal() {
  estrellasFinal.forEach(e => {
    ctx.strokeStyle = e.color; ctx.lineWidth = 1.5;
    ctx.shadowColor = e.color; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI*2); ctx.stroke();
    ctx.shadowBlur  = 0;
    e.y += e.vy; if (e.y > canvas.height+10) e.y = -10;
  });

  const pW=620, pH=270;
  const px=(canvas.width-pW)/2, py=(canvas.height-pH)/2;
  ctx.fillStyle = "rgba(10,0,25,0.93)";
  roundRect(ctx, px, py, pW, pH, 22); ctx.fill();
  ctx.strokeStyle = "#ff00cc"; ctx.lineWidth = 4;
  ctx.shadowColor = "#ff00cc"; ctx.shadowBlur = 20;
  roundRect(ctx, px+4, py+4, pW-8, pH-8, 20); ctx.stroke();
  ctx.shadowBlur  = 0;

  ctx.fillStyle   = "#ff66ff";
  ctx.font        = "30px Minecraftia";
  ctx.textAlign   = "center";
  ctx.shadowColor = "#ff00cc"; ctx.shadowBlur = 12;
  ctx.fillText("🎪 ¡Feria completada!", canvas.width/2, py+62);
  ctx.shadowBlur  = 0;

  ctx.fillStyle = "#ffe066"; ctx.font = "22px Minecraftia";
  ctx.fillText(`⭐ ${aciertos} / ${preguntas.length} correctas`, canvas.width/2, py+108);

  const pct = Math.round((aciertos/preguntas.length)*100);
  const msg = pct===100?"¡Maestro de %! 🏆":pct>=70?"¡Muy bien! 🎠":"¡Practica más! 📚";
  ctx.fillStyle = "#e0c0ff"; ctx.font = "15px Minecraftia";
  ctx.fillText(`${pct}% — ${msg}`, canvas.width/2, py+145);

  const bW=250, bH=56;
  const bx=canvas.width/2-bW/2, by=py+178;
  ctx.fillStyle = "#3d0060";
  roundRect(ctx, bx, by, bW, bH, 12); ctx.fill();
  ctx.strokeStyle = "#ff00cc"; ctx.lineWidth = 2.5;
  ctx.shadowColor = "#ff00cc"; ctx.shadowBlur = 12;
  roundRect(ctx, bx, by, bW, bH, 12); ctx.stroke();
  ctx.shadowBlur  = 0;
  ctx.fillStyle   = "#fff"; ctx.font = "20px Minecraftia";
  ctx.fillText("🔁 Reiniciar", canvas.width/2, by+37);
  ctx.textAlign   = "left";
}

function drawPausa() {
  ctx.fillStyle = "rgba(10,0,25,0.80)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ff66ff"; ctx.font = "42px Minecraftia"; ctx.textAlign = "center";
  ctx.shadowColor = "#ff00cc"; ctx.shadowBlur = 18;
  ctx.fillText("⏸ Pausa", canvas.width/2, canvas.height/2-44);
  ctx.shadowBlur  = 0;
  const bW=250, bH=60, bx=canvas.width/2-125, by=canvas.height/2;
  ctx.fillStyle = "#3d0060";
  roundRect(ctx, bx, by, bW, bH, 12); ctx.fill();
  ctx.strokeStyle = "#ff00cc"; ctx.lineWidth = 2.5;
  roundRect(ctx, bx, by, bW, bH, 12); ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.font = "22px Minecraftia";
  ctx.fillText("▶ Continuar", canvas.width/2, by+39);
  ctx.textAlign = "left";
}

canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  if (pausado && !juegoTerminado) {
    if (mx>=canvas.width/2-125 && mx<=canvas.width/2+125 &&
        my>=canvas.height/2    && my<=canvas.height/2+60) {
      pausado = false; musicaFondo.play();
    }
  }
  if (juegoTerminado) {
    const pH=270, py=(canvas.height-pH)/2;
    const bW=250, bH=56, bx=canvas.width/2-125, by=py+178;
    if (mx>=bx && mx<=bx+bW && my>=by && my<=by+bH) resetGame();
  }
});

// ─── DRAW PRINCIPAL ───────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFondo();
  if (!juegoTerminado) {
    drawDispensadores();
    drawIndicadorPosicion();
    drawFox();
    drawHUD();
    drawFeedback();
    drawParticulas();
  }
  if (pausado && !juegoTerminado) drawPausa();
  if (juegoTerminado) { drawFinal(); drawParticulas(); }
}

// ─── RESET ────────────────────────────────────────────────────────────────────
function resetGame() {
  aciertos=0; currentQuestion=0; juegoTerminado=false; pausado=false; colisionLock=false;
  particulas=[]; estrellasFinal=[]; feedbackTimer=0; feedbackMsg="";
  fox.x=440; fox.y=SUELO_Y; fox.vx=0;
  resetVasos();
  initMundo();
}

// ─── LOOP ─────────────────────────────────────────────────────────────────────
function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }

resetGame();
gameLoop();
musicaFondo.play().catch(()=>{
  document.addEventListener("keydown", ()=>musicaFondo.play(), { once:true });
});