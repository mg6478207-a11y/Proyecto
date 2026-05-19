// 🎮 RETOMATE - Grado 4 | Unidad 2: Fracciones Equivalentes
// ⚓ "El Barco Pirata del Zorro"
// El zorro pirata navega verticalmente y lanza un gancho hacia cofres en la isla.
// Controles: ↑ ↓ mover balsa | Espacio lanzar gancho a la derecha | P pausar

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
let estrellasFinal = [];
let gancho         = null; // Proyectil horizontal (Izquierda -> Derecha)
let cofres         = [];   // Objetivos estáticos/flotantes en la isla

// ─── SONIDOS ──────────────────────────────────────────────────────────────────
const sonidoLanzar   = new Audio("https://actions.google.com/sounds/v1/cartoon/slide_whistle_up.ogg");
const sonidoCorrecto = new Audio("https://actions.google.com/sounds/v1/cartoon/coins_clinking.ogg");
const sonidoError    = new Audio("https://actions.google.com/sounds/v1/cartoon/splash.ogg");
const musicaFondo    = new Audio(""); // Pega aquí tu link de OpenGameArt pirata
musicaFondo.loop = true; musicaFondo.volume = 0.15;

// ─── BANCO DE 10 PREGUNTAS (FRACCIONES EQUIVALENTES - GRADO 4) ────────────────
const preguntas = [
  { base: "1/2", enunciado: "Encuentra la fracción EQUIVALENTE a 1/2", opciones: ["2/4", "1/3", "2/5"], respuesta: "2/4" },
  { base: "1/3", enunciado: "Encuentra la fracción EQUIVALENTE a 1/3", opciones: ["2/4", "3/9", "1/5"], respuesta: "3/9" },
  { base: "2/4", enunciado: "Encuentra la fracción EQUIVALENTE a 2/4", opciones: ["4/8", "3/5", "2/6"], respuesta: "4/8" },
  { base: "1/4", enunciado: "Encuentra la fracción EQUIVALENTE a 1/4", opciones: ["2/6", "3/12", "2/5"], respuesta: "3/12" },
  { base: "2/3", enunciado: "Encuentra la fracción EQUIVALENTE a 2/3", opciones: ["4/6", "3/4", "5/9"], respuesta: "4/6" },
  { base: "3/4", enunciado: "Encuentra la fracción EQUIVALENTE a 3/4", opciones: ["6/10", "9/12", "4/5"], respuesta: "9/12" },
  { base: "2/5", enunciado: "Encuentra la fracción EQUIVALENTE a 2/5", opciones: ["4/10", "3/8", "2/10"], respuesta: "4/10" },
  { base: "3/5", enunciado: "Encuentra la fracción EQUIVALENTE a 3/5", opciones: ["5/10", "6/10", "4/8"], respuesta: "6/10" },
  { base: "4/6", enunciado: "Encuentra la fracción EQUIVALENTE a 4/6", opciones: ["2/3", "1/2", "3/5"], respuesta: "2/3" },
  { base: "5/10", enunciado: "Encuentra la fracción EQUIVALENTE a 5/10", opciones: ["2/3", "3/4", "1/2"], respuesta: "1/2" }
];

// ─── CONFIGURACIÓN DEL PERSONAJE (BALSA PIRATA) ──────────────────────────────
const balsa = {
  x: 60,
  y: 260,
  w: 70,
  h: 85,
  speed: 7.5
};

function generarCofres() {
  cofres = [];
  const q = preguntas[currentQ];
  
  // 3 posiciones verticales fijadas al lado derecho (la isla del tesoro)
  const alturas = [140, 290, 440];
  
  q.opciones.forEach((op, index) => {
    cofres.push({
      x: 820,
      y: alturas[index],
      w: 110,
      h: 75,
      texto: op,
      correcta: op === q.respuesta,
      offsetFlote: Math.random() * Math.PI, // Movimiento sutil de olas
      hit: false
    });
  });
}

function crearParticulas(x, y, color, cantidad = 15) {
  for (let i = 0; i < cantidad; i++) {
    particulas.push({
      x, y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 20 + Math.random() * 10, maxLife: 30,
      color: color,
      r: 1.5 + Math.random() * 3
    });
  }
}

// ─── CONTROLES ────────────────────────────────────────────────────────────────
const keys = {};
window.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key === " " && e.target === document.body) e.preventDefault(); // Detener scroll de barra espaciadora

  if ((e.key === "p" || e.key === "P") && !juegoTerminado) {
    pausado = !pausado;
    pausado ? musicaFondo.pause() : (musicaFondo.src && musicaFondo.play());
  }

  // LANZAR GANCHO DE ABORDAJE CON ESPACIO
  if (e.key === " " && !gancho && feedbackTimer <= 0 && !juegoTerminado && !pausado) {
    gancho = { x: balsa.x + balsa.w, y: balsa.y + balsa.h / 2 - 5, vx: 13 };
    if (sonidoLanzar) { sonidoLanzar.currentTime = 0; sonidoLanzar.play(); }
  }
});
window.addEventListener("keyup", e => { keys[e.key] = false; });

canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;

  if (pausado && !juegoTerminado) {
    if (mx >= canvas.width / 2 - 125 && mx <= canvas.width / 2 + 125 && my >= canvas.height / 2 && my <= canvas.height / 2 + 60) {
      pausado = false;
      if (musicaFondo.src) musicaFondo.play();
    }
  }
  if (juegoTerminado) {
    const bx = canvas.width / 2 - 125, by = 380;
    if (mx >= bx && mx <= bx + 250 && my >= by && my <= by + 54) resetGame();
  }
});

// ─── ACTUALIZACIÓN ────────────────────────────────────────────────────────────
function update() {
  if (pausado || juegoTerminado) return;
  tiempo++;

  if (feedbackTimer > 0) feedbackTimer--;

  // Movimiento Vertical de la Balsa (Límite del mar libre)
  if (keys["ArrowUp"]) balsa.y -= balsa.speed;
  if (keys["ArrowDown"]) balsa.y += balsa.speed;
  balsa.y = Math.max(110, Math.min(balsa.y, canvas.height - balsa.h - 80));

  // Animación suave de flote para los cofres en la isla
  cofres.forEach(c => {
    if (!c.hit) {
      c.floteY = Math.sin(tiempo * 0.04 + c.offsetFlote) * 6;
    }
  });

  // Movimiento del gancho horizontal hacia la derecha
  if (gancho) {
    gancho.x += gancho.vx;

    // Burbujas marinas saliendo del gancho
    if (tiempo % 3 === 0) {
      particulas.push({
        x: gancho.x - 10, y: gancho.y + 5,
        vx: -1, vy: (Math.random() - 0.5) * 1,
        life: 15, maxLife: 15,
        color: "rgba(255,255,255,0.6)", r: 2.5
      });
    }

    // Colisión de punta de gancho con cofres
    cofres.forEach(c => {
      if (!gancho || colisionLock || c.hit) return;

      let cyReal = c.y + c.floteY;

      // Verificación de rango de colisión rectangular
      if (gancho.x >= c.x && gancho.x <= c.x + c.w &&
          gancho.y >= cyReal && gancho.y <= cyReal + c.h) {
        
        colisionLock = true;
        c.hit = true;

        crearParticulas(c.x + c.w / 2, cyReal + c.h / 2, "#f1c40f", 25); // Monedas de oro
        crearParticulas(c.x + c.w / 2, cyReal + c.h / 2, "#95a5a6", 10); // Astillas

        if (c.correcta) {
          aciertos++;
          feedbackMsg = "¡Botín Asegurado! ¡Son Equivalentes! 🪙🏴‍☠️";
          feedbackOk = true;
          if (sonidoCorrecto) { sonidoCorrecto.currentTime = 0; sonidoCorrecto.play(); }
        } else {
          feedbackMsg = `¡Al agua! La fracción equivalente era ${preguntas[currentQ].respuesta} 🌊`;
          feedbackOk = false;
          if (sonidoError) { sonidoError.currentTime = 0; sonidoError.play(); }
        }

        feedbackTimer = 90;
        gancho = null;

        setTimeout(() => {
          siguientePregunta();
        }, 1100);
      }
    });

    // Si el gancho sale de la pantalla por la derecha
    if (gancho && gancho.x > canvas.width + 20) gancho = null;
  }

  // Partículas
  particulas.forEach((p, idx) => {
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.life <= 0) particulas.splice(idx, 1);
  });
}

// ─── PERSISTENCIA CON EL SERVIDOR FLASK (GRADO 4 UNIDAD 2) ───────────────────
function siguientePregunta() {
  currentQ++;
  gancho = null;
  colisionLock = false;
  feedbackTimer = 0;

  if (currentQ >= preguntas.length) {
    juegoTerminado = true;
    estrellasFinal = [];
    for (let i = 0; i < 160; i++) {
      estrellasFinal.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        vy: 2 + Math.random() * 2,
        r: 2.5 + Math.random() * 3,
        color: ["#f1c40f", "#ffffff", "#3498db", "#e74c3c"][Math.floor(Math.random() * 4)]
      });
    }
    const puntaje = (aciertos / preguntas.length) * 100;

    // Conexión nativa Flask para Grado 4 Unidad 2
    fetch("/guardar_progreso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grado: 4, unidad: 2, aciertos, total: preguntas.length, puntaje })
    })
    .then(r => r.json())
    .then(d => console.log("✅ Progreso de Fracciones Equivalentes guardado:", d))
    .catch(e => console.error("❌ Error guardando G4U2:", e));
  } else {
    generarCofres();
  }
}

// ─── GRÁFICOS (DISEÑO MARÍTIMO PIRATA) ────────────────────────────────────────
function drawFondo() {
  // Cielo tropical
  let gradCielo = ctx.createLinearGradient(0, 0, 0, 180);
  gradCielo.addColorStop(0, "#3498db"); gradCielo.addColorStop(1, "#85c1e9");
  ctx.fillStyle = gradCielo; ctx.fillRect(0, 0, canvas.width, 180);

  // Mar caribeño animado
  ctx.fillStyle = "#2e86c1"; ctx.fillRect(0, 180, canvas.width, canvas.height - 180);
  
  // Olas decorativas
  ctx.fillStyle = "#2471a3";
  for (let i = (tiempo % 60) * -2; i < canvas.width + 100; i += 80) {
    ctx.beginPath();
    ctx.arc(i, 200, 20, 0, Math.PI, true);
    ctx.fill();
  }

  // Isla del tesoro en la derecha
  ctx.fillStyle = "#f4d03f"; ctx.beginPath();
  ctx.arc(950, canvas.height / 2, 220, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#27ae60"; ctx.beginPath(); // Palmeras o pasto en la isla
  ctx.arc(980, canvas.height / 2, 160, 0, Math.PI * 2); ctx.fill();
}

function drawCofres() {
  cofres.forEach(c => {
    if (c.hit) return;
    ctx.save();
    
    let cyReal = c.y + c.floteY;
    ctx.translate(c.x, cyReal);

    // Dibujar cofre de madera pirata
    ctx.fillStyle = "#8a5329"; ctx.strokeStyle = "#5c3a1e"; ctx.lineWidth = 4;
    roundRect(ctx, 0, 15, c.w, c.h - 15, 8); ctx.fill(); ctx.stroke();

    // Tapa redondeada del cofre
    ctx.fillStyle = "#a86734"; ctx.beginPath();
    ctx.arc(c.w / 2, 17, c.w / 2, Math.PI, 0); ctx.fill(); ctx.stroke();

    // Bordes de oro del cofre
    ctx.fillStyle = "#f1c40f";
    ctx.fillRect(0, 15, 10, c.h - 15);
    ctx.fillRect(c.w - 10, 15, 10, c.h - 15);
    // Cerradura de oro central
    ctx.fillRect(c.w / 2 - 10, 15, 20, 16);
    ctx.fillStyle = "#000"; ctx.fillRect(c.w / 2 - 3, 23, 6, 6);

    // Texto de la fracción
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 22px Minecraftia";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "#000"; ctx.shadowBlur = 4;
    ctx.fillText(c.texto, c.w / 2, c.h / 2 + 12);

    ctx.restore();
  });
}

function drawGanchoYLaço() {
  if (!gancho) return;

  // Cuerda/Lazo de abordaje desde la balsa hasta el gancho
  ctx.strokeStyle = "#d35400"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(balsa.x + balsa.w, balsa.y + balsa.h / 2);
  ctx.lineTo(gancho.x, gancho.y + 5); ctx.stroke();

  // El gancho metálico de tres puntas
  ctx.save();
  ctx.translate(gancho.x, gancho.y);
  ctx.fillStyle = "#7f8c8d";
  ctx.fillRect(0, 0, 15, 8);
  ctx.beginPath();
  ctx.moveTo(15, 4); ctx.lineTo(26, -6); ctx.lineTo(22, -8); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(15, 4); ctx.lineTo(26, 14); ctx.lineTo(22, 16); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawBalsaYPirata() {
  ctx.save();
  ctx.translate(balsa.x, balsa.y);

  // Balanceo ligero de ola en la balsa
  let balanceo = Math.sin(tiempo * 0.06) * 2;
  ctx.translate(0, balanceo);

  // Mástil y vela pirata calavera
  ctx.fillStyle = "#7e5129"; ctx.fillRect(20, -45, 8, 55); // Mástil
  ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#ccc"; ctx.lineWidth = 2;
  roundRect(ctx, -15, -40, 35, 40, 5); ctx.fill(); ctx.stroke(); // Vela blanca
  ctx.fillStyle = "#e74c3c"; ctx.font = "bold 14px Arial"; ctx.fillText("☠", -4, -15); // Logotipo pirata

  // Troncos de madera de la balsa
  ctx.fillStyle = "#a0522d"; ctx.strokeStyle = "#5c3a1e"; ctx.lineWidth = 3;
  roundRect(ctx, 0, 50, balsa.w, 18, 6); ctx.fill(); ctx.stroke();
  roundRect(ctx, -5, 66, balsa.w + 10, 18, 6); ctx.fill(); ctx.stroke();

  // 🦊 Zorro Explorador vestido de Pirata con Parche en el ojo
  ctx.fillStyle = "#e66000"; ctx.fillRect(15, 10, 32, 28); // Rostro
  ctx.fillStyle = "#ffffff"; ctx.fillRect(15, 26, 8, 12); ctx.fillRect(39, 26, 8, 12); // Mejillas
  ctx.fillStyle = "#111"; ctx.fillRect(29, 22, 4, 4); // Nariz
  
  // Ojo normal y Parche Pirata Negro 🏴‍☠️
  ctx.fillStyle = "#111111"; ctx.fillRect(18, 14, 10, 10); // Parche izquierdo
  ctx.fillRect(14, 17, 34, 2); // Cita del parche
  ctx.fillStyle = "#2d3436"; ctx.fillRect(36, 14, 4, 7); // Ojo derecho despierto

  // Pañoleta Pirata Roja en la cabeza
  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(12, 4, 38, 8);
  ctx.beginPath(); ctx.moveTo(12, 10); ctx.lineTo(2, 14); ctx.lineTo(6, 6); ctx.closePath(); ctx.fill(); // Nudo de pañoleta

  ctx.restore();
}

function drawHUD() {
  // Letrero del mapa del tesoro
  ctx.fillStyle = "rgba(254, 249, 231, 0.95)"; ctx.strokeStyle = "#b7950b"; ctx.lineWidth = 4;
  roundRect(ctx, 80, 15, canvas.width - 160, 75, 14); ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#7d6608"; ctx.font = "bold 21px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText(preguntas[currentQ].enunciado, canvas.width / 2, 58);

  // Información de monedas
  ctx.fillStyle = "#ffffff"; ctx.font = "16px Minecraftia"; ctx.textAlign = "left";
  ctx.shadowColor = "#000"; ctx.shadowBlur = 4;
  ctx.fillText(`⚡ Cofres Conquistados: ${aciertos} / ${preguntas.length}`, 40, 575);
  ctx.shadowBlur = 0;
}

function drawFeedback() {
  if (feedbackTimer <= 0) return;
  ctx.fillStyle = "rgba(21, 67, 96, 0.92)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = feedbackOk ? "#f1c40f" : "#e74c3c";
  ctx.font = "bold 26px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText(feedbackMsg, canvas.width / 2, canvas.height / 2);
}

function drawParticulas() {
  particulas.forEach(p => {
    ctx.fillStyle = p.color; ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * (p.life / p.maxLife), 0, Math.PI * 2); ctx.fill();
  });
}

function drawPausa() {
  ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const bx = canvas.width / 2 - 125, by = canvas.height / 2 - 30;
  ctx.fillStyle = "#fff"; ctx.strokeStyle = "#2980b9"; ctx.lineWidth = 3;
  roundRect(ctx, bx, by, 250, 60, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#2980b9"; ctx.font = "20px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("▶ Continuar", canvas.width / 2, by + 38);
}

function drawFinal() {
  ctx.fillStyle = "rgba(26, 36, 43, 0.98)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  estrellasFinal.forEach(e => {
    e.y += e.vy; if (e.y > canvas.height) e.y = -10;
    ctx.fillStyle = e.color; ctx.fillRect(e.x, e.y, e.r, e.r);
  });

  ctx.fillStyle = "#f1c40f"; ctx.font = "bold 36px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("¡ISLA DEL TESORO COMPLETADA!", canvas.width / 2, canvas.height / 2 - 80);
  
  ctx.fillStyle = "#ffffff"; ctx.font = "20px Minecraftia";
  ctx.fillText(`Efectividad de Saqueo: ${Math.round((aciertos / preguntas.length) * 100)}%`, canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillText(`Tesoros Correctos: ${aciertos} de ${preguntas.length}`, canvas.width / 2, canvas.height / 2 + 35);

  const bx = canvas.width / 2 - 125, by = 380;
  ctx.fillStyle = "#27ae60"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3;
  roundRect(ctx, bx, by, 250, 54, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ffffff"; ctx.font = "18px Minecraftia";
  ctx.fillText("🔄 Volver a Navegar", canvas.width / 2, by + 34);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x+r, y); c.lineTo(x+w-r, y); c.quadraticCurveTo(x+w, y, x+w, y+r);
  c.lineTo(x+w, y+h-r); c.quadraticCurveTo(x+w, y+h, x+w-r, y+h); c.lineTo(x+r, y+h);
  c.quadraticCurveTo(x, y+h, x, y+h-r); c.lineTo(x, y+r); c.quadraticCurveTo(x, y, x+r, y);
  c.closePath();
}

function resetGame() {
  aciertos = 0; currentQ = 0; juegoTerminado = false; pausado = false;
  colisionLock = false; feedbackTimer = 0; gancho = null;
  generarCofres();
}

// ─── LOOP PRINCIPAL ───────────────────────────────────────────────────────────
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFondo();
  if (!juegoTerminado) {
    drawCofres();
    drawGanchoYLaço();
    drawBalsaYPirata();
    drawHUD();
    drawFeedback();
  }
  drawParticulas();
  if (pausado && !juegoTerminado) drawPausa();
  if (juegoTerminado) drawFinal();
}

generarCofres();
window.onload = () => { gameLoop(); };