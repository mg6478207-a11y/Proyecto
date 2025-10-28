// ===============================
// 🦊 RETOMATE - TEORÍA DE NÚMEROS
// Aventura del Zorrito con 10 Cofres y Casita Final
// ===============================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 600;
const groundLevel = canvas.height - 80;

// === MUNDO EXPANDIDO ===
const worldWidth = 3000;
let cameraX = 0;
// === SONIDOS ===
const sonidos = {
    fondo: new Audio("/static/sounds/fondo.mp3"),
    salto: new Audio("/static/sounds/salto.mp3"), // Necesitarás este archivo
    cofre: new Audio("/static/sounds/cofre.mp3"),
    correcto: new Audio("/static/sounds/correcto.mp3"),
    error: new Audio("/static/sounds/error.mp3"),
    superSalto: new Audio("/static/sounds/supersalto.mp3") // Puedes usar uno existente o agregar
};

// Configurar volúmenes
sonidos.fondo.volume = 0.4;
sonidos.fondo.loop = true;
sonidos.salto.volume = 0.5;
sonidos.cofre.volume = 0.6;
sonidos.correcto.volume = 0.6;
sonidos.error.volume = 0.5;
sonidos.superSalto.volume = 0.7;
// === FUNCIÓN PARA REPRODUCIR SONIDOS === 

function reproducirSonido(tipo) {
    try {
        // Pausar y resetear antes de reproducir
        sonidos[tipo].pause();
        sonidos[tipo].currentTime = 0;
        sonidos[tipo].play().catch(e => console.log(`Error con sonido ${tipo}:`, e));
    } catch (error) {
        console.log("Error reproduciendo sonido:", error);
    }
}

// === INICIALIZAR MÚSICA ===
function iniciarMusica() {
    const iniciarConClick = function() {
        sonidos.fondo.play().catch(e => console.log("Error iniciando música:", e)); // Cambié reproducirSonido por sonidos.fondo.play()
        document.removeEventListener('click', iniciarConClick);
        document.removeEventListener('keydown', iniciarConClick);
    };
    
    document.addEventListener('click', iniciarConClick);
    document.addEventListener('keydown', iniciarConClick);
}

window.addEventListener('load', iniciarMusica);

// === ZORRITO ===
let zorrito = {
  x: 100,
  y: groundLevel - 80,
  width: 64,
  height: 64,
  vx: 0,
  vy: 0,
  grounded: true,
  facing: "right",
  stepTimer: 0,
  walking: false,
  blinkTimer: 0,
  eyesClosed: false,
  idleTimer: 0,
  resting: false,
  enCasita: false,
  tieneSuperSalto: false,
  tiempoSuperSalto: 0,
  saltosRestantes: 0
};

// === CONTROLES ===
let keys = {};
let gamePaused = false;

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  
  // Pausa del juego
  if (e.key === "p" || e.key === "P") {
    gamePaused = !gamePaused;
    if (gamePaused) {
      sonidos.fondo.pause(); // Cambié musicaFondo por sonidos.fondo
    } else {
      sonidos.fondo.play();
    }
  }
  
  // SUPER SALTO - Tecla Espacio
  if (e.key === " " && zorrito.tieneSuperSalto && zorrito.grounded) {
    zorrito.vy = -18;
    zorrito.grounded = false;
    zorrito.saltosRestantes--;
    reproducirSonido('superSalto');
    
    if (zorrito.saltosRestantes <= 0) {
      zorrito.tieneSuperSalto = false;
    }
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// EVENT LISTENER PARA PAUSA
canvas.addEventListener("click", (e) => {
  if (!gamePaused) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const btnX = canvas.width / 2 - 100;
  const btnY = canvas.height / 2 + 40;
  const btnWidth = 200;
  const btnHeight = 50;
  if (mouseX >= btnX && mouseX <= btnX + btnWidth &&
      mouseY >= btnY && mouseY <= btnY + btnHeight) {
    gamePaused = false;
  }
});

// EVENT LISTENER PARA VICTORIA/GAME OVER
canvas.addEventListener("click", (e) => {
  if (gamePaused && (vidas <= 0 || zorrito.enCasita)) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const btnX = canvas.width / 2 - 100;
    const btnY = canvas.height / 2 + (vidas <= 0 ? 80 : 120);
    const btnWidth = 200;
    const btnHeight = 50;
    
    if (mouseX >= btnX && mouseX <= btnX + btnWidth &&
        mouseY >= btnY && mouseY <= btnY + btnHeight) {
      location.reload();
    }
  }
});
// === FÍSICA ===
const gravity = 0.8;
const jumpPower = 12;
const maxSpeed = 3;
const accel = 0.2;
const friction = 0.88;

// === ANIMACIONES ===
let frame = 0;
let victoryAnimation = 0;

let nubes = [
  { x: 250, y: 120, size: 30 },
  { x: 600, y: 80, size: 25 },
  { x: 900, y: 150, size: 35 },
  { x: 1400, y: 100, size: 28 },
  { x: 1800, y: 130, size: 32 },
  { x: 2200, y: 90, size: 30 }
];

// === PLATAFORMAS ===
const plataformas = [
  { x: 800, y: groundLevel - 150, width: 150, height: 20 },
  { x: 1300, y: groundLevel - 180, width: 120, height: 20 },
  { x: 1700, y: groundLevel - 140, width: 140, height: 20 },
  { x: 2100, y: groundLevel - 200, width: 130, height: 20 }
];

function drawBackground() {
  ctx.fillStyle = "#9cd1ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const sunX = 100;
  const sunY = 100;
  const baseRadius = 40;
  const glow = 10 + Math.sin(frame * 0.05) * 5;
  const rotation = frame * 0.02;

  const gradient = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, baseRadius + 40);
  gradient.addColorStop(0, "rgba(255, 223, 0, 1)");
  gradient.addColorStop(1, "rgba(255, 223, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(sunX, sunY, baseRadius + 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(sunX, sunY);
  ctx.rotate(rotation);
  for (let i = 0; i < 12; i++) {
    ctx.rotate((Math.PI * 2) / 12);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -baseRadius - 15);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(255, 200, 0, 0.8)";
    ctx.stroke();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(sunX, sunY, baseRadius + Math.sin(frame * 0.1) * 2, 0, Math.PI * 2);
  ctx.fillStyle = "#FFD700";
  ctx.shadowColor = "rgba(255, 200, 0, 0.6)";
  ctx.shadowBlur = glow;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#fff";
  nubes.forEach((n) => {
    const parallaxX = n.x - cameraX * 0.3;
    ctx.beginPath();
    ctx.arc(parallaxX, n.y, n.size, 0, Math.PI * 2);
    ctx.arc(parallaxX + n.size * 1.2, n.y - 10, n.size * 1.4, 0, Math.PI * 2);
    ctx.arc(parallaxX + n.size * 2.2, n.y, n.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#654321";
  ctx.fillRect(-cameraX, groundLevel, worldWidth, 100);
  ctx.fillStyle = "#3fa34d";
  ctx.fillRect(-cameraX, groundLevel, worldWidth, 15);

  for (let i = 0; i < worldWidth / 250; i++) {
    const x = 150 + i * 250 - cameraX;
    if (x < -100 || x > canvas.width + 100) continue;
    const sway = Math.sin(frame * 0.03 + i) * 3;
    ctx.fillStyle = "#8b4513";
    ctx.fillRect(x + sway, groundLevel - 60, 20, 60);
    ctx.beginPath();
    ctx.arc(x + 10 + sway, groundLevel - 70, 40, 0, Math.PI * 2);
    ctx.fillStyle = "#2e8b57";
    ctx.fill();
  }
}

function drawPlataformas() {
  plataformas.forEach(p => {
    const screenX = p.x - cameraX;
    if (screenX < -200 || screenX > canvas.width + 200) return;
    ctx.fillStyle = "#8B7355";
    ctx.fillRect(screenX, p.y, p.width, p.height);
    ctx.strokeStyle = "#5D4E37";
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, p.y, p.width, p.height);
    ctx.fillStyle = "#3fa34d";
    ctx.fillRect(screenX, p.y - 5, p.width, 5);
  });
}

const cofres = [
  { x: 350, y: groundLevel - 60, abierto: false },
  { x: 650, y: groundLevel - 60, abierto: false },
  { x: 950, y: groundLevel - 210, abierto: false },
  { x: 1200, y: groundLevel - 60, abierto: false },
  { x: 1450, y: groundLevel - 240, abierto: false },
  { x: 1650, y: groundLevel - 60, abierto: false },
  { x: 1850, y: groundLevel - 200, abierto: false },
  { x: 2050, y: groundLevel - 60, abierto: false },
  { x: 2250, y: groundLevel - 260, abierto: false },
  { x: 2450, y: groundLevel - 60, abierto: false }
];

function drawCofres() {
  cofres.forEach((c) => {
    const screenX = c.x - cameraX;
    if (screenX < -200 || screenX > canvas.width + 200) return;

    if (!c.abierto) {
      const pulse = Math.sin(frame * 0.1) * 5;
      ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
      ctx.fillRect(screenX - pulse, c.y - pulse, 80 + pulse * 2, 80 + pulse * 2);
    }

    ctx.fillStyle = "#b07a4a";
    ctx.fillRect(screenX, c.y, 80, 60);
    ctx.fillStyle = c.abierto ? "#d3a15d" : "#a26a37";
    ctx.fillRect(screenX, c.y - 20, 80, 20);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX, c.y - 20, 80, 80);
    ctx.fillStyle = "#000";
    ctx.fillRect(screenX + 36, c.y + 20, 8, 8);

    if (c.abierto) {
      ctx.fillStyle = "#2ecc71";
      ctx.font = "bold 40px Arial";
      ctx.textAlign = "center";
      ctx.fillText("✓", screenX + 40, c.y + 30);
    }
  });
}

const casita = {
  x: worldWidth - 300,
  y: groundLevel - 180,
  width: 160,
  height: 180
};

function drawCasita() {
  const screenX = casita.x - cameraX;
  if (screenX < -300 || screenX > canvas.width + 300) return;

  const bounce = zorrito.enCasita ? Math.sin(victoryAnimation * 0.2) * 5 : 0;

  ctx.fillStyle = "#d4a574";
  ctx.fillRect(screenX, casita.y + 60, casita.width, 120);

  ctx.fillStyle = "#c0504d";
  ctx.beginPath();
  ctx.moveTo(screenX - 20, casita.y + 60);
  ctx.lineTo(screenX + casita.width / 2, casita.y - 20);
  ctx.lineTo(screenX + casita.width + 20, casita.y + 60);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#8b4513";
  ctx.fillRect(screenX + 55, casita.y + 110, 50, 70);

  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(screenX + 20, casita.y + 90, 35, 35);
  ctx.strokeStyle = "#5D4E37";
  ctx.lineWidth = 3;
  ctx.strokeRect(screenX + 20, casita.y + 90, 35, 35);

  ctx.fillStyle = "#8B4513";
  ctx.fillRect(screenX + 110, casita.y + 10, 25, 50);

  for (let i = 0; i < 3; i++) {
    const smokeY = casita.y - 10 - i * 25 - (frame * 2) % 60;
    const smokeX = screenX + 122 + Math.sin(frame * 0.1 + i) * 10;
    ctx.fillStyle = `rgba(200, 200, 200, ${0.6 - i * 0.2})`;
    ctx.beginPath();
    ctx.arc(smokeX, smokeY, 8 + i * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (zorrito.enCasita) {
    for (let i = 0; i < 5; i++) {
      const heartX = screenX + 80 + Math.sin(victoryAnimation * 0.1 + i) * 30;
      const heartY = casita.y - 50 - (victoryAnimation * 2 + i * 10) % 100;
      ctx.fillStyle = "#ff69b4";
      ctx.font = "24px Arial";
      ctx.fillText("❤", heartX, heartY);
    }
  }
}

function drawZorrito() {
  const screenX = zorrito.x - cameraX;
  const p = 4;
  const baseY = zorrito.y + (zorrito.resting ? 2 : 0) + (zorrito.enCasita ? Math.sin(victoryAnimation * 0.3) * 3 : 0);
  const stepOffset = Math.sin(zorrito.stepTimer * 0.3) * (zorrito.walking ? 2 : 0);

  ctx.save();
  if (zorrito.facing === "left") {
    ctx.translate(screenX + zorrito.width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(screenX, 0);
  }

  const baseX = 0;
  const tailSwing = Math.sin(zorrito.stepTimer * 0.3) * (zorrito.enCasita ? 5 : 2);
  ctx.fillStyle = "#e76f51";
  ctx.fillRect(baseX - 6 * p, baseY + 12 * p + tailSwing, 6 * p, 3 * p);
  ctx.fillStyle = "#f48c06";
  ctx.fillRect(baseX - 10 * p, baseY + 10 * p + tailSwing, 4 * p, 3 * p);
  ctx.fillStyle = "#fff";
  ctx.fillRect(baseX - 12 * p, baseY + 9 * p + tailSwing, 3 * p, 2 * p);

  ctx.fillStyle = "#3fa34d";
  ctx.fillRect(baseX + 5 * p, baseY + 8 * p, 10 * p, 10 * p);
  ctx.fillStyle = "#f48c06";
  ctx.fillRect(baseX + 4 * p, baseY + 1 * p, 12 * p, 9 * p);
  ctx.fillStyle = "#e85d04";
  ctx.fillRect(baseX + 4 * p, baseY - 1 * p, 3 * p, 3 * p);
  ctx.fillRect(baseX + 13 * p, baseY - 1 * p, 3 * p, 3 * p);
  ctx.fillStyle = "#264653";
  ctx.fillRect(baseX + 5 * p, baseY + 16 * p, 10 * p, 5 * p);
  ctx.fillStyle = "#1d3557";
  ctx.fillRect(baseX + 5 * p, baseY + 21 * p + stepOffset, 4 * p, 2 * p);
  ctx.fillRect(baseX + 11 * p, baseY + 21 * p - stepOffset, 4 * p, 2 * p);
  ctx.fillStyle = "#f48c06";
  ctx.fillRect(baseX + 2 * p, baseY + 8 * p, 3 * p, 5 * p);
  ctx.fillRect(baseX + 15 * p, baseY + 8 * p, 3 * p, 5 * p);

  ctx.fillStyle = "#000";
  if (zorrito.enCasita) {
    ctx.fillRect(baseX + 7 * p, baseY + 5 * p, 4 * p, 1 * p);
    ctx.fillRect(baseX + 13 * p, baseY + 5 * p, 4 * p, 1 * p);
    ctx.fillRect(baseX + 8 * p, baseY + 7 * p, 6 * p, 1 * p);
  } else if (zorrito.eyesClosed) {
    ctx.fillRect(baseX + 7 * p, baseY + 5 * p, 4 * p, 1 * p);
    ctx.fillRect(baseX + 13 * p, baseY + 5 * p, 4 * p, 1 * p);
  } else {
    ctx.fillRect(baseX + 7 * p, baseY + 4 * p, 2 * p, 2 * p);
    ctx.fillRect(baseX + 13 * p, baseY + 4 * p, 2 * p, 2 * p);
  }
  ctx.fillRect(baseX + 9 * p, baseY + 6 * p, 4 * p, 1 * p);

  ctx.restore();
}

function drawProgressBar() {
  const cofresAbiertos = cofres.filter(c => c.abierto).length;
  const total = cofres.length;
  const porcentaje = cofresAbiertos / total;

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(10, 10, 300, 40);
  ctx.fillStyle = "#2ecc71";
  ctx.fillRect(15, 15, 290 * porcentaje, 30);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, 300, 40);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Cofres: ${cofresAbiertos}/${total}`, 20, 35);

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(10, 60, 150, 35);
  ctx.fillStyle = "#e74c3c";
  ctx.fillText(`❤ Vidas: ${vidas}`, 20, 83);

  // Indicador de super salto
  if (zorrito.tieneSuperSalto) {
    const tiempoRestante = Math.ceil((300 - zorrito.tiempoSuperSalto) / 60);
    ctx.fillStyle = "rgba(52, 152, 219, 0.8)";
    ctx.fillRect(10, 105, 180, 35);
    ctx.fillStyle = "#fff";
    ctx.fillText(`⚡ Super Salto: ${tiempoRestante}s`, 20, 128);
  }
}

function drawPauseScreen() {
  ctx.fillStyle = "rgba(52, 73, 94, 0.85)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const iconBoxX = canvas.width / 2 - 200;
  const iconBoxY = canvas.height / 2 - 60;
  ctx.fillStyle = "#5DADE2";
  ctx.fillRect(iconBoxX, iconBoxY, 60, 60);
  ctx.fillStyle = "#fff";
  ctx.fillRect(iconBoxX + 15, iconBoxY + 12, 12, 36);
  ctx.fillRect(iconBoxX + 33, iconBoxY + 12, 12, 36);

  ctx.font = "bold 32px Arial";
  ctx.fillStyle = "#F9E79F";
  ctx.textAlign = "left";
  ctx.fillText("Juego en pausa", iconBoxX + 80, iconBoxY + 42);

  const btnX = canvas.width / 2 - 100;
  const btnY = canvas.height / 2 + 40;
  const btnWidth = 200;
  const btnHeight = 50;
  ctx.fillStyle = "#1E8449";
  ctx.fillRect(btnX, btnY + 4, btnWidth, btnHeight);
  ctx.fillStyle = "#27AE60";
  ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
  ctx.strokeStyle = "#1E8449";
  ctx.lineWidth = 2;
  ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
  ctx.font = "20px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText("▶ Continuar", btnX + btnWidth / 2, btnY + 32);
  canvas.style.cursor = "pointer";
}

function update() {
  if (gamePaused) return;
 if (zorrito.tieneSuperSalto) {
    zorrito.tiempoSuperSalto++;
    if (zorrito.tiempoSuperSalto > 300) { // 5 segundos a 60fps
      zorrito.tieneSuperSalto = false;
      zorrito.saltosRestantes = 0;
    }
  }
  zorrito.walking = false;

  if (keys["ArrowRight"]) {
    zorrito.vx = Math.min(zorrito.vx + accel, maxSpeed);
    zorrito.facing = "right";
    zorrito.walking = true;
  } else if (keys["ArrowLeft"]) {
    zorrito.vx = Math.max(zorrito.vx - accel, -maxSpeed);
    zorrito.facing = "left";
    zorrito.walking = true;
  } else {
    zorrito.vx *= friction;
  }

  if (keys["ArrowUp"] && zorrito.grounded) {
    zorrito.vy = -jumpPower;
    zorrito.grounded = false;
    reproducirSonido('salto');
  }
  
  zorrito.x += zorrito.vx;
  zorrito.vy += gravity;
  zorrito.y += zorrito.vy;

  if (zorrito.y >= groundLevel - zorrito.height) {
    zorrito.y = groundLevel - zorrito.height;
    zorrito.vy = 0;
    zorrito.grounded = true;
  }

  plataformas.forEach(p => {
    if (zorrito.x + zorrito.width > p.x && zorrito.x < p.x + p.width &&
        zorrito.y + zorrito.height > p.y && zorrito.y + zorrito.height < p.y + 20 &&
        zorrito.vy >= 0) {
      zorrito.y = p.y - zorrito.height;
      zorrito.vy = 0;
      zorrito.grounded = true;
    }
  });

  if (zorrito.x < 0) zorrito.x = 0;
  if (zorrito.x + zorrito.width > worldWidth) zorrito.x = worldWidth - zorrito.width;

  cameraX = zorrito.x - canvas.width / 3;
  if (cameraX < 0) cameraX = 0;
  if (cameraX > worldWidth - canvas.width) cameraX = worldWidth - canvas.width;

  zorrito.blinkTimer++;
  if (zorrito.blinkTimer > 200 && Math.random() < 0.05) {
    zorrito.eyesClosed = true;
    zorrito.blinkTimer = 0;
    setTimeout(() => (zorrito.eyesClosed = false), 200);
  }

  if (Math.abs(zorrito.vx) < 0.1 && zorrito.grounded) {
    zorrito.idleTimer++;
    if (zorrito.idleTimer > 400) zorrito.resting = true;
  } else {
    zorrito.idleTimer = 0;
    zorrito.resting = false;
  }

  if (zorrito.walking) zorrito.stepTimer += 1;

  if (Math.abs(zorrito.x - casita.x) < 100 && cofres.every(c => c.abierto)) {
    zorrito.enCasita = true;
    victoryAnimation++;
    if (victoryAnimation === 60) {
      setTimeout(() => mostrarVictoria(), 1000);
    }
  }

  verificarColisionCofre();
}

function loop() {
    frame++;
    drawBackground();
    drawPlataformas();
    drawCofres();
    drawCasita();
    drawZorrito();
    drawProgressBar();

    if (!gamePaused) {
        update();
        canvas.style.cursor = "default";
    } else {
        // Si está en pausa por victoria o game over
        if (vidas <= 0) {
            mostrarPantallaGameOver(); // ← DIBUJA GAME OVER
        } else if (zorrito.enCasita) {
            mostrarPantallaVictoria(); // ← DIBUJA VICTORIA
        } else {
            drawPauseScreen(); // ← PAUSA NORMAL
        }
    }

    requestAnimationFrame(loop);
}

const preguntas = [
  { pregunta: "¿Cuál de los siguientes es un número primo?", opciones: ["12", "17", "21"], correcta: 1 },
  { pregunta: "¿Cuál es el MCD de 12 y 18?", opciones: ["3", "6", "9"], correcta: 1 },
  { pregunta: "¿Cuál es el siguiente número en el sistema binario después de 11₂?", opciones: ["100₂", "12₂", "111₂"], correcta: 0 },
  { pregunta: "¿Cuántos divisores tiene el número 24?", opciones: ["6", "8", "10"], correcta: 1 },
  { pregunta: "¿Cuál es el MCM de 4 y 6?", opciones: ["12", "24", "8"], correcta: 0 },
  { pregunta: "¿Qué número es 101₂ en decimal?", opciones: ["5", "6", "7"], correcta: 0 },
  { pregunta: "¿Cuál es el resultado de 2³ + 2²?", opciones: ["10", "12", "14"], correcta: 1 },
  { pregunta: "¿Cuál número es divisible por 3?", opciones: ["25", "36", "41"], correcta: 1 },
  { pregunta: "¿Cuál es la suma de los primeros 5 números primos?", opciones: ["26", "28", "30"], correcta: 1 },
  { pregunta: "¿Cuál es 15 en sistema binario?", opciones: ["1111₂", "1101₂", "1011₂"], correcta: 0 }
];

let vidas = 7;
let puntaje = 0;
let mostrandoPregunta = false;
let preguntaActual = null;
let respuestaSeleccionada = -1;

function verificarColisionCofre() {
    if (mostrandoPregunta) return;
    cofres.forEach((c, i) => {
        const centroCofreX = c.x + 40;
        const centroZorroX = zorrito.x + zorrito.width / 2;
        const distancia = Math.abs(centroZorroX - centroCofreX);
        if (distancia < 70 && !c.abierto && i < preguntas.length) {
            reproducirSonido('cofre'); // SONIDO AL ENCONTRAR COFRE
            mostrarPregunta(i);
        }
    });
}

function mostrarPregunta(indiceCofre) {
  mostrandoPregunta = true;
  gamePaused = true;
  const q = preguntas[indiceCofre];
  
  // ✅ MODIFICAR: Dar super salto en cofres BAJOS para alcanzar los ALTOS
  // Cofres bajos: 0, 1, 3, 5, 7, 9 (índices 0,1,3,5,7,9)
  // Cofres altos: 2, 4, 6, 8 (índices 2,4,6,8)
  const cofresQueDanSuperSalto = [0, 1, 3, 5, 7]//dar supersalto en cofres 1,2,4,6
  
  const darSuperSalto = cofresQueDanSuperSalto.includes(indiceCofre);
  
  if (document.getElementById("preguntaBox")) return;

  const contenedor = document.createElement("div");
  contenedor.id = "preguntaBox";
  contenedor.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    border: 4px solid #111;
    padding: 25px;
    font-family: Arial, sans-serif;
    z-index: 10000;
    width: 450px;
    max-width: 90%;
    text-align: center;
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  `;
  
  // ✅ MENSAJES EXPLICATIVOS
  let mensajePremio = '';
  if (darSuperSalto) {
    // Identificar qué cofre alto viene después
    const cofresAltos = [2, 4, 6, 8];
    const siguienteCofreAlto = cofresAltos.find(index => index > indiceCofre);
    
    if (siguienteCofreAlto !== undefined) {
      mensajePremio = `<p style="color:#e74c3c; font-weight:bold; margin:10px 0;">¡Premio: SUPER SALTO! ⚡<br><small>Para alcanzar el cofre ${siguienteCofreAlto + 1}</small></p>`;
    } else {
      mensajePremio = '<p style="color:#e74c3c; font-weight:bold; margin:10px 0;">¡Premio: SUPER SALTO! ⚡</p>';
    }
  } else {
    mensajePremio = '<p style="color:#27ae60; font-weight:bold; margin:10px 0;">¡Respuesta correcta! +10 puntos</p>';
  }
  
  contenedor.innerHTML = `
    <h3 style="margin:0 0 20px; color: #2c3e50; font-size: 20px;">Cofre ${indiceCofre + 1}/10</h3>
    ${mensajePremio}
    <p style="margin: 0 0 20px; font-size: 18px; color: #34495e;">${q.pregunta}</p>
    <div id="opcionesBox" style="display:flex;flex-direction:column;gap:12px;">
      ${q.opciones.map((op, idx) => `<button class='opcion' data-idx='${idx}' style="padding:12px 20px; font-size:16px; cursor:pointer; background:#3498db; color:white; border:none; border-radius:5px; transition: all 0.2s;">${op}</button>`).join("")}
    </div>
  `;
  document.body.appendChild(contenedor);

  document.querySelectorAll(".opcion").forEach(btn => {
    btn.addEventListener("mouseover", (e) => e.target.style.background = "#2980b9");
    btn.addEventListener("mouseout", (e) => e.target.style.background = "#3498db");
    btn.addEventListener("click", (e) => {
      const seleccion = parseInt(e.target.dataset.idx);
      
      if (seleccion === q.correcta) {
        puntaje += 10;
        cofres[indiceCofre].abierto = true;
        reproducirSonido('correcto');
        
        // ✅ ACTIVAR SUPER SALTO EN COFRES BAJOS
        if (darSuperSalto) {
          zorrito.tieneSuperSalto = true;
          zorrito.saltosRestantes = 3;
          zorrito.tiempoSuperSalto = 0;
        }
      } else {
        vidas--;
        reproducirSonido('error');
      }

      const el = document.getElementById("preguntaBox");
      if (el) el.remove();
      mostrandoPregunta = false;
      gamePaused = false;

      if (vidas <= 0) {
        finalizarJuego(false);
      }
    });
  });
}
function mostrarVictoria() {
  finalizarJuego(true);
}

function finalizarJuego(victoria) {
    gamePaused = true;
    
    if (victoria) {
        // Mostrar pantalla de victoria en el juego
        mostrarPantallaVictoria();
    } else {
        // Mostrar pantalla de game over
        mostrarPantallaGameOver();
    }

    // Guardar progreso (mantener tu código existente)
    const usuarioIdEl = document.getElementById("usuario_id");
    const usuarioId = usuarioIdEl ? usuarioIdEl.value : null;
    fetch("/guardar_progreso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            usuario_id: usuarioId,
            unidad: 2,
            aciertos: Math.round(puntaje / 10),
            total: preguntas.length,
            puntaje: puntaje,
        }),
    }).catch(err => console.error("Error guardando progreso:", err));
}

function mostrarPantallaVictoria() {
    // Dibujar fondo semi-transparente
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Fuente Minecraft
    ctx.font = "bold 48px 'Press Start 2P', cursive, Arial, sans-serif";
    ctx.fillStyle = "#4ECDC4";
    ctx.textAlign = "center";
    
    // Título FELICIDADES!
    ctx.fillText("¡FELICIDADES!", canvas.width / 2, canvas.height / 2 - 80);
    
    // Mensaje
    ctx.font = "20px 'Press Start 2P', cursive, Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("El zorrito llegó a su casita", canvas.width / 2, canvas.height / 2 - 20);
    
    // Puntaje
    ctx.fillText(`Puntaje: ${puntaje}`, canvas.width / 2, canvas.height / 2 + 20);
    
    // Vidas restantes
    ctx.fillText(`Vidas restantes: ${vidas}`, canvas.width / 2, canvas.height / 2 + 60);
    
    // Botón de aceptar
    const btnX = canvas.width / 2 - 100;
    const btnY = canvas.height / 2 + 120;
    const btnWidth = 200;
    const btnHeight = 50;
    
    ctx.fillStyle = "#27AE60";
    ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
    ctx.strokeStyle = "#2ECC71";
    ctx.lineWidth = 3;
    ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
    
    ctx.font = "16px 'Press Start 2P', cursive, Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("ACEPTAR", canvas.width / 2, btnY + 32);
    
    // Hacer el canvas clickeable para el botón
    canvas.style.cursor = "pointer";
}

function mostrarPantallaGameOver() {
    // Dibujar fondo semi-transparente
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Fuente Minecraft
    ctx.font = "bold 48px 'Press Start 2P', cursive, Arial, sans-serif";
    ctx.fillStyle = "#E74C3C";
    ctx.textAlign = "center";
    
    // Título
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 80);
    
    // Mensaje
    ctx.font = "20px 'Press Start 2P', cursive, Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Te quedaste sin vidas", canvas.width / 2, canvas.height / 2 - 20);
    
    // Puntaje
    ctx.fillText(`Puntaje: ${puntaje}`, canvas.width / 2, canvas.height / 2 + 20);
    
    // Botón de aceptar
    const btnX = canvas.width / 2 - 100;
    const btnY = canvas.height / 2 + 80;
    const btnWidth = 200;
    const btnHeight = 50;
    
    ctx.fillStyle = "#E74C3C";
    ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
    ctx.strokeStyle = "#EC7063";
    ctx.lineWidth = 3;
    ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
    
    ctx.font = "16px 'Press Start 2P', cursive, Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("ACEPTAR", canvas.width / 2, btnY + 32);
    
    canvas.style.cursor = "pointer";
}

loop();