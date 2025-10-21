// 🎮 RETOMATE - Unidad 1: Números Naturales
// Versión Zorrito + Opciones móviles + Pausa + Sonidos + Envío de puntaje
// Autores: Laura Nataly & Diego Andrés - 2025

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 600;

// === CONFIGURACIÓN GENERAL ===
const floorY = 530;
let aciertos = 0;
let currentQuestion = 0;
let bloques = [];
let particulas = [];
let estrellasFinal = [];
let juegoTerminado = false;
let pausado = false;
let colisionLock = false;

// === SONIDOS ===
const sonidoSalto = new Audio("https://actions.google.com/sounds/v1/cartoon/slide_whistle_to_drum_hit.ogg");
const sonidoCorrecto = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const sonidoError = new Audio("https://actions.google.com/sounds/v1/cartoon/boing.ogg");

// === MÚSICA DE FONDO ===
const musicaFondo = new Audio("/static/sounds/fondo.mp3");
musicaFondo.volume = 0.4;
musicaFondo.loop = true;

sonidoSalto.volume = 0.5;
sonidoCorrecto.volume = 0.6;
sonidoError.volume = 0.5;

// === PERSONAJE ===
let fox = {
  x: 100, y: floorY - 40,
  w: 40, h: 40,
  vy: 0,
  grounded: true
};

// === FONDO ===
let sun = { x: 850, y: 100, r: 50, ang: 0 };
let clouds = [
  { x: 100, y: 80, r: 30 },
  { x: 400, y: 120, r: 40 },
  { x: 700, y: 90, r: 35 },
];

// === PREGUNTAS ===
const preguntas = [
  { pregunta: "¿Cuál es el número natural más pequeño?", opciones: ["0", "1", "2"], correcta: 1 },
  { pregunta: "¿Cuánto es 6 × 7?", opciones: ["36", "40", "42"], correcta: 2 },
  { pregunta: "¿Cuál sigue después del 99?", opciones: ["100", "101", "98"], correcta: 0 },
  { pregunta: "¿Cuál es la suma de 8 + 5?", opciones: ["12", "13", "14"], correcta: 1 },
  { pregunta: "¿Qué número viene antes del 20?", opciones: ["19", "21", "18"], correcta: 0 },
  { pregunta: "¿Cuál es la mitad de 10?", opciones: ["2", "5", "8"], correcta: 1 },
  { pregunta: "¿Qué número es par?", opciones: ["7", "9", "10"], correcta: 2 },
  { pregunta: "¿Qué número tiene dos cifras?", opciones: ["8", "12", "5"], correcta: 1 },
  { pregunta: "¿Cuál es el doble de 4?", opciones: ["6", "8", "10"], correcta: 1 },
  { pregunta: "¿Qué número viene después del 49?", opciones: ["48", "50", "51"], correcta: 1 },
];

// === GENERAR BLOQUES DE OPCIONES ===
function generarBloquesPregunta() {
  if (juegoTerminado) return;
  if (currentQuestion >= preguntas.length) return;

  const opciones = preguntas[currentQuestion].opciones;
  bloques = [];

  const startY = 350;
  const separacion = 250;

  for (let i = 0; i < opciones.length; i++) {
    bloques.push({
      x: 200 + i * separacion,
      y: startY,
      w: 120,
      h: 60,
      texto: opciones[i],
      correcta: i === preguntas[currentQuestion].correcta,
      vx: 2 * (Math.random() < 0.5 ? 1 : -1)
    });
  }
}

// === DIBUJAR CIELO, SOL Y NUBES ===
function drawSky() {
  ctx.fillStyle = "#9cd1ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  sun.ang += 0.01;
  ctx.save();
  ctx.translate(sun.x, sun.y);
  ctx.rotate(sun.ang);
  ctx.fillStyle = "#FFD700";
  ctx.beginPath();
  ctx.arc(0, 0, sun.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#FFA500";
  ctx.lineWidth = 4;
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const x1 = Math.cos(angle) * sun.r;
    const y1 = Math.sin(angle) * sun.r;
    const x2 = Math.cos(angle) * (sun.r + 18);
    const y2 = Math.sin(angle) * (sun.r + 18);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();

  clouds.forEach(c => {
    c.x -= 0.3;
    c.y += Math.sin(Date.now() / 1000 + c.x / 100) * 0.15;
    if (c.x < -80) c.x = 1080;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.arc(c.x + 35, c.y + 10, c.r * 0.8, 0, Math.PI * 2);
    ctx.arc(c.x - 35, c.y + 10, c.r * 0.8, 0, Math.PI * 2);
    ctx.fill();
  });
}

// === DIBUJAR SUELO ===
function drawGround() {
  ctx.fillStyle = "#3d9435";
  ctx.fillRect(0, floorY, canvas.width, 50);
  ctx.fillStyle = "#7c4a2d";
  ctx.fillRect(0, floorY + 40, canvas.width, 60);
}

// === DIBUJAR ZORRITO ===
function drawFox() {
  ctx.fillStyle = "#ff9933";
  ctx.fillRect(fox.x, fox.y, fox.w, fox.h);
  ctx.fillStyle = "#4b2e05";
  ctx.fillRect(fox.x + 4, fox.y + 30, 10, 10);
  ctx.fillRect(fox.x + 26, fox.y + 30, 10, 10);
  ctx.fillStyle = "#fff";
  ctx.fillRect(fox.x + 10, fox.y + 12, 20, 14);
  ctx.fillStyle = "#ff8000";
  ctx.fillRect(fox.x + 4, fox.y - 6, 10, 10);
  ctx.fillRect(fox.x + 26, fox.y - 6, 10, 10);
  ctx.strokeStyle = "#000";
  ctx.strokeRect(fox.x, fox.y, fox.w, fox.h);
}

// === DIBUJAR BLOQUES ===
function drawBlock(b) {
  ctx.fillStyle = b.correcta ? "#f3d97a" : "#b07a4a";
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = "#000";
  ctx.strokeRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = "#000";
  ctx.font = "20px Minecraftia";
  ctx.textAlign = "center";
  ctx.fillText(b.texto, b.x + b.w / 2, b.y + 35);
  ctx.textAlign = "left";
}

// === HUD ===
function drawHUD() {
  ctx.fillStyle = "#000";
  ctx.font = "20px Minecraftia";
  ctx.textAlign = "left";
  ctx.fillText(`⭐ Aciertos: ${aciertos}`, 30, 50);
  ctx.fillText(`Pregunta ${Math.min(currentQuestion + 1, preguntas.length)}/${preguntas.length}`, 30, 80);
  if (!juegoTerminado && currentQuestion < preguntas.length)
    ctx.fillText(preguntas[currentQuestion].pregunta, 50, 150);
}

// === PARTÍCULAS ===
function crearParticulas(x, y, color) {
  for (let i = 0; i < 15; i++) {
    particulas.push({
      x, y,
      vx: (Math.random() * 4) - 2,
      vy: (Math.random() * -3),
      life: 50,
      color
    });
  }
}
function drawParticulas() {
  particulas.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 4, 4);
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08;
    p.life--;
  });
  particulas = particulas.filter(p => p.life > 0);
}

// === ACTUALIZACIÓN DE JUEGO ===
function update() {
  if (juegoTerminado) return;

  if (!fox.grounded) {
    fox.vy += 0.8;
    fox.y += fox.vy;
    if (fox.y >= floorY - fox.h) {
      fox.y = floorY - fox.h;
      fox.grounded = true;
      fox.vy = 0;
    }
  }

  bloques.forEach(b => {
    b.x += b.vx;
    if (b.x <= 50 || b.x + b.w >= canvas.width - 50) b.vx *= -1;
  });

  for (let b of bloques) {
    if (
      fox.x < b.x + b.w &&
      fox.x + fox.w > b.x &&
      fox.y < b.y + b.h &&
      fox.y + fox.h > b.y
    ) {
      if (colisionLock) break;
      colisionLock = true;

      if (b.correcta) {
        aciertos++;
        sonidoCorrecto.currentTime = 0;
        sonidoCorrecto.play();
        crearParticulas(b.x + b.w / 2, b.y + 10, "#FFD700");
      } else {
        sonidoError.currentTime = 0;
        sonidoError.play();
        crearParticulas(b.x + b.w / 2, b.y + 10, "#ff5555");
      }

      setTimeout(() => {
        siguientePregunta();
        colisionLock = false;
      }, 700);
      break;
    }
  }
}

// === CONTROLES ===
document.addEventListener("keydown", (e) => {
  if (juegoTerminado) return;
  if (e.key === "ArrowRight") fox.x = Math.min(fox.x + 25, canvas.width - fox.w);
  if (e.key === "ArrowLeft") fox.x = Math.max(fox.x - 25, 0);
  if (e.key === "ArrowUp" && fox.grounded) {
    fox.vy = -13;
    fox.grounded = false;
    sonidoSalto.currentTime = 0;
    sonidoSalto.play();
  }
  if (e.key === "p" || e.key === "P") {
    pausado = !pausado;
    if (pausado) musicaFondo.pause();
    else musicaFondo.play();
  }
});

// === SIGUIENTE PREGUNTA ===
function siguientePregunta() {
  currentQuestion++;
  if (currentQuestion >= preguntas.length) {
    juegoTerminado = true;
    estrellasFinal = [];
    for (let i = 0; i < 120; i++) {
      estrellasFinal.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        vy: 1 + Math.random() * 2
      });
    }

    // === 🔹 Enviar puntaje al servidor ===
    const totalPreguntas = preguntas.length;
    const puntaje = (aciertos / totalPreguntas) * 100;

    fetch("/guardar_progreso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unidad: 1,
        aciertos: aciertos,
        total: totalPreguntas,
        puntaje: puntaje
      })
    })
    .then(res => res.json())
    .then(data => console.log("✅ Progreso guardado:", data))
    .catch(err => console.error("❌ Error:", err));
  } else {
    generarBloquesPregunta();
  }
}

// === DIBUJAR ESCENA ===
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSky();
  drawGround();
  drawHUD();
  bloques.forEach(drawBlock);
  drawFox();
  drawParticulas();

  // Pausa
  if (pausado && !juegoTerminado) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFD700";
    ctx.font = "42px Minecraftia";
    ctx.textAlign = "center";
    ctx.fillText("⏸️ Juego en pausa", canvas.width / 2, canvas.height / 2 - 40);

    // botón para continuar
    const btnW = 220, btnH = 60;
    const bx = canvas.width / 2 - btnW / 2;
    const by = canvas.height / 2;
    ctx.fillStyle = "#3d9435";
    ctx.fillRect(bx, by, btnW, btnH);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, btnW, btnH);
    ctx.fillStyle = "#fff";
    ctx.font = "26px Minecraftia";
    ctx.fillText("▶️ Continuar", canvas.width / 2, by + 38);
    ctx.textAlign = "left";
  }

  if (juegoTerminado) {
    drawEstrellasFinal();
    const panelW = 560, panelH = 220;
    const px = (canvas.width - panelW) / 2;
    const py = (canvas.height - panelH) / 2;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(px, py, panelW, panelH);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 4;
    ctx.strokeRect(px + 6, py + 6, panelW - 12, panelH - 12);
    ctx.fillStyle = "#FFD700";
    ctx.font = "42px Minecraftia";
    ctx.textAlign = "center";
    ctx.fillText("🎉 ¡Juego Completado!", canvas.width / 2, py + 70);
    ctx.font = "28px Minecraftia";
    ctx.fillText(`⭐ Aciertos: ${aciertos}/${preguntas.length}`, canvas.width / 2, py + 120);

    // Botón Reiniciar
    const btnW = 200, btnH = 56;
    const bx = canvas.width / 2 - btnW / 2;
    const by = py + 140;
    ctx.fillStyle = "#3d9435";
    ctx.fillRect(bx, by, btnW, btnH);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, btnW, btnH);
    ctx.fillStyle = "#fff";
    ctx.font = "22px Minecraftia";
    ctx.fillText("🔁 Reiniciar", canvas.width / 2, by + 36);
  }
}

// === ESTRELLAS FINALES ===
function drawEstrellasFinal() {
  estrellasFinal.forEach(e => {
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
    ctx.fill();
    e.y += e.vy;
    if (e.y > canvas.height + 10) e.y = -10;
  });
}

// === REINICIAR ===
function resetGame() {
  aciertos = 0;
  currentQuestion = 0;
  bloques = [];
  particulas = [];
  estrellasFinal = [];
  juegoTerminado = false;
  pausado = false;
  fox.x = 100;
  fox.y = floorY - fox.h;
  fox.vy = 0;
  fox.grounded = true;
  generarBloquesPregunta();
}

// === CLICK BOTONES ===
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (pausado && !juegoTerminado) {
    const btnW = 220, btnH = 60;
    const bx = canvas.width / 2 - btnW / 2;
    const by = canvas.height / 2;
    if (x >= bx && x <= bx + btnW && y >= by && y <= by + btnH) {
      pausado = false;
      musicaFondo.play();
    }
  }

  if (juegoTerminado) {
    const panelW = 560, panelH = 220;
    const py = (canvas.height - panelH) / 2;
    const btnW = 200, btnH = 56;
    const bx = canvas.width / 2 - btnW / 2;
    const by = py + 140;
    if (x >= bx && x <= bx + btnW && y >= by && y <= by + btnH) {
      resetGame();
    }
  }
});

// === LOOP PRINCIPAL ===
function gameLoop() {
  if (!pausado) update();
  draw();
  requestAnimationFrame(gameLoop);
}

// === INICIO ===
resetGame();
gameLoop();
musicaFondo.play().catch(() => {
  document.addEventListener("keydown", () => musicaFondo.play(), { once: true });
});
