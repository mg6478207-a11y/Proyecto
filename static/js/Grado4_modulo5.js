// 🎮 RETOMATE - Grado 4 | Unidad 5: Ángulos
// 📐 "El Radar Explorador"
// Controles: Espacio o Clic para detener la aguja en el ángulo correcto | P pausar

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");
canvas.width  = 1000;
canvas.height = 600;

// ─── ESTADO DEL JUEGO ──────────────────────────────────────────────────────────
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

// ─── CONFIGURACIÓN DEL RADAR (AGUJA GIRATORIA) ────────────────────────────────
const radar = {
  x: canvas.width / 2,
  y: canvas.height / 2 + 40,
  radio: 180,
  angulo: 0,              // Ángulo actual en radianes
  velocidadGiro: 0.035,   // Velocidad constante de la aguja
  activo: true
};

// ─── SONIDOS ──────────────────────────────────────────────────────────────────
const sonidoCorrecto = new Audio("https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg");
const sonidoError    = new Audio("https://actions.google.com/sounds/v1/cartoon/glitch_error.ogg");

// ─── BANCO DE PREGUNTAS (ÁNGULOS - GRADO 4) ───────────────────────────────────
const preguntas = [
  { tipo: "recto",  enunciado: "Detén el radar exactamente en un ÁNGULO RECTO (90°)" },
  { tipo: "agudo",  enunciado: "Detén la aguja en cualquier ÁNGULO AGUDO (Menos de 90°)" },
  { tipo: "obtuso", enunciado: "Detén el radar en un ÁNGULO OBTUSO (Más de 90° pero menos de 180°)" },
  { tipo: "llano",  enunciado: "Busca un ÁNGULO LLANO completo (180°)" },
  { tipo: "agudo",  enunciado: "Captura una apertura de ÁNGULO AGUDO (Entre 0° y 90°)" },
  { tipo: "recto",  enunciado: "Encuentra la esquina perfecta: ÁNGULO RECTO (90°)" },
  { tipo: "obtuso", enunciado: "Apunta hacia un ÁNGULO OBTUSO (Apertura amplia)" },
  { tipo: "llano",  enunciado: "Estira la aguja hasta formar un ÁNGULO LLANO (Línea recta)" },
  { tipo: "agudo",  enunciado: "El zorro busca una rampa inclinada: ÁNGULO AGUDO" },
  { tipo: "obtuso", enunciado: "Abre el radar para detectar un ÁNGULO OBTUSO" }
];

function crearParticulas(x, y, color) {
  for (let i = 0; i < 25; i++) {
    particulas.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 25, maxLife: 25, color: color, r: 2 + Math.random() * 2
    });
  }
}

// ─── VALIDACIÓN GEOMÉTRICA DE ÁNGULOS ─────────────────────────────────────────
function evaluarAngulo() {
  if (!radar.activo || feedbackTimer > 0) return;

  let grados = (radar.angulo * (180 / Math.PI)) % 360;
  if (grados < 0) grados += 360;

  const tipoPregunta = preguntas[currentQ].tipo;
  let correcto = false;
  
  if (tipoPregunta === "recto") {
    correcto = (Math.abs(grados - 90) <= 6 || Math.abs(grados - 270) <= 6);
  } else if (tipoPregunta === "llano") {
    correcto = (Math.abs(grados - 180) <= 6 || Math.abs(grados - 0) <= 6 || Math.abs(grados - 360) <= 6);
  } else if (tipoPregunta === "agudo") {
    correcto = (grados > 0 && grados < 84) || (grados > 186 && grados < 264);
  } else if (tipoPregunta === "obtuso") {
    correcto = (grados > 96 && grados < 174) || (grados > 276 && grados < 354);
  }

  radar.activo = false;
  let puntaX = radar.x + Math.cos(radar.angulo) * radar.radio;
  let puntaY = radar.y + Math.sin(radar.angulo) * radar.radio;

  if (correcto) {
    aciertos++;
    feedbackMsg = `¡Excelente puntería! Marcaste ${Math.round(grados)}° ✨🎯`;
    feedbackOk = true;
    if (sonidoCorrecto) { sonidoCorrecto.currentTime = 0; sonidoCorrecto.play(); }
    crearParticulas(puntaX, puntaY, "#00ffcc");
  } else {
    feedbackMsg = `¡Casi! Ese era un ángulo de ${Math.round(grados)}° 📐`;
    feedbackOk = false;
    if (sonidoError) { sonidoError.currentTime = 0; sonidoError.play(); }
    crearParticulas(puntaX, puntaY, "#ff4757");
  }

  feedbackTimer = 100;
  setTimeout(() => { siguientePregunta(); }, 1400);
}

// ─── CONTROL DE ENTRADAS ──────────────────────────────────────────────────────
window.addEventListener("keydown", e => {
  if (e.key === " " && e.target === document.body) e.preventDefault();

  if (pausado || juegoTerminado || feedbackTimer > 0) return;

  if (e.key === " ") {
    evaluarAngulo();
  }
});

canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (pausado && !juegoTerminado) {
    const bx = canvas.width / 2 - 125, by = canvas.height / 2 - 30;
    if (mx >= bx && mx <= bx + 250 && my >= by && my <= by + 60) pausado = false;
    return;
  }

  if (juegoTerminado) {
    if (mx >= canvas.width / 2 - 125 && mx <= canvas.width / 2 + 125 && my >= 420 && my <= 474) resetGame();
    return;
  }

  if (radar.activo && feedbackTimer <= 0) {
    evaluarAngulo();
  }
});

window.addEventListener("keydown", e => {
  if ((e.key === "p" || e.key === "P") && !juegoTerminado) {
    pausado = !pausado;
  }
});

function siguientePregunta() {
  currentQ++;
  feedbackTimer = 0;
  radar.activo = true;

  if (currentQ >= preguntas.length) {
    juegoTerminado = true;
    const puntaje = (aciertos / preguntas.length) * 100;

    fetch("/guardar_progreso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grado: 4, unidad: 5, aciertos, total: preguntas.length, puntaje })
    })
    .then(r => r.json()).then(d => console.log("✅ Ángulos guardados:", d))
    .catch(err => console.error("Error salvando G4U5:", err));
  }
}

// ─── PARTE GRÁFICA ───────────────────────────────────────────────────────────
function drawFondo() {
  ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.strokeStyle = "rgba(0, 255, 204, 0.1)"; ctx.lineWidth = 1;
  for (let r = 50; r <= radar.radio; r += 45) {
    ctx.beginPath(); ctx.arc(radar.x, radar.y, r, 0, Math.PI * 2); ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.beginPath(); ctx.moveTo(radar.x - radar.radio - 20, radar.y); ctx.lineTo(radar.x + radar.radio + 20, radar.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(radar.x, radar.y - radar.radio - 20); ctx.lineTo(radar.x, radar.y + radar.radio + 20); ctx.stroke();
}

function drawRadar() {
  ctx.fillStyle = "rgba(30, 41, 59, 0.6)"; ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(radar.x, radar.y, radar.radio, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#64748b"; ctx.font = "12px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("0°", radar.x + radar.radio + 20, radar.y + 5);
  ctx.fillText("90°", radar.x, radar.y + radar.radio + 20);
  ctx.fillText("180°", radar.x - radar.radio - 25, radar.y + 5);
  ctx.fillText("270°", radar.x, radar.y - radar.radio - 12);

  let finX = radar.x + Math.cos(radar.angulo) * radar.radio;
  let finY = radar.y + Math.sin(radar.angulo) * radar.radio;

  ctx.strokeStyle = radar.activo ? "#ff9f43" : "#00ffcc"; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(radar.x, radar.y); ctx.lineTo(finX, finY); ctx.stroke();

  ctx.fillStyle = "#e66000"; ctx.beginPath(); ctx.arc(radar.x, radar.y, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(radar.x, radar.y, 8, 0, Math.PI * 2); ctx.fill();
}

function drawHUD() {
  // Recuadro del Enunciado de la Pregunta (Centrado)
  ctx.fillStyle = "rgba(15, 23, 42, 0.95)"; ctx.strokeStyle = "#ff9f43"; ctx.lineWidth = 3;
  roundRect(ctx, 100, 45, canvas.width - 200, 65, 12); ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#ffffff"; ctx.font = "bold 16px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText(preguntas[currentQ].enunciado, canvas.width / 2, 84);

  // TEXTO CORREGIDO: Separado de los recuadros principales para evitar colisiones visuales
  ctx.fillStyle = "#94a3b8"; ctx.font = "14px Minecraftia"; ctx.textAlign = "left";
  ctx.fillText("📐 RETOMATE | Sistema Radar G4", 40, 26);

  ctx.textAlign = "right";
  ctx.fillText(`🎯 Capturas Certificadas: ${aciertos} / ${preguntas.length}`, canvas.width - 40, 26);
}

function drawFeedback() {
  if (feedbackTimer <= 0) return;
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = feedbackOk ? "#00ffcc" : "#ff4757";
  ctx.font = "bold 22px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText(feedbackMsg, canvas.width / 2, canvas.height / 2);
}

function drawPausa() {
  ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const bx = canvas.width / 2 - 125, by = canvas.height / 2 - 30;
  ctx.fillStyle = "#1e293b"; ctx.strokeStyle = "#ff9f43"; ctx.lineWidth = 3;
  roundRect(ctx, bx, by, 250, 60, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ff9f43"; ctx.font = "18px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("▶ Continuar", canvas.width / 2, by + 38);
}

function drawFinal() {
  ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#00ffcc"; ctx.font = "bold 32px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("¡RADAR CALIBRADO POR COMPLETO!", canvas.width / 2, canvas.height / 2 - 60);
  ctx.fillStyle = "#fff"; ctx.font = "20px Minecraftia";
  ctx.fillText(`Precisión de Escáner: ${Math.round((aciertos / preguntas.length) * 100)}%`, canvas.width / 2, canvas.height / 2 + 5);
  
  const bx = canvas.width / 2 - 125, by = 420;
  ctx.fillStyle = "#ff9f43"; roundRect(ctx, bx, by, 250, 54, 10); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "16px Minecraftia";
  ctx.fillText("🔄 Reiniciar Radar", canvas.width / 2, by + 34);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x+r, y); c.lineTo(x+w-r, y); c.quadraticCurveTo(x+w, y, x+w, y+r);
  c.lineTo(x+w, y+h-r); c.quadraticCurveTo(x+w, y+h, x+w-r, y+h); c.lineTo(x+r, y+h);
  c.quadraticCurveTo(x, y+h, x, y+h-r); c.lineTo(x, y+r); c.quadraticCurveTo(x, y, x+r, y);
  c.closePath();
}

function resetGame() { aciertos = 0; currentQ = 0; juegoTerminado = false; pausado = false; radar.activo = true; }

// ─── LOOP PRINCIPAL ───────────────────────────────────────────────────────────
function gameLoop() {
  tiempo++;
  if (feedbackTimer > 0) feedbackTimer--;

  if (!pausado && !juegoTerminado) {
    if (radar.activo) {
      radar.angulo += radar.velocidadGiro;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFondo();
    drawRadar();
    drawHUD();
    drawFeedback();
    
    particulas.forEach((p, idx) => {
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) particulas.splice(idx, 1);
      ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.r, p.r);
    });
  } else if (pausado && !juegoTerminado) {
    drawPausa();
  } else if (juegoTerminado) {
    drawFinal();
  }

  requestAnimationFrame(gameLoop);
}

window.onload = () => { gameLoop(); };