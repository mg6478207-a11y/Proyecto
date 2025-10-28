// ===============================
// 🏖️ RETOMATE - MEDIDA Y GEOMETRÍA
// Aventura en la Playa del Zorrito con 10 Cofres y Castillo Final
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
    salto: new Audio("/static/sounds/salto.mp3"),
    cofre: new Audio("/static/sounds/cofre.mp3"),
    correcto: new Audio("/static/sounds/correcto.mp3"),
    error: new Audio("/static/sounds/error.mp3"),
    superSalto: new Audio("/static/sounds/supersalto.mp3")
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
        sonidos.fondo.play().catch(e => console.log("Error iniciando música:", e));
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
  enCastillo: false,
  tieneSuperSalto: false,
  tiempoSuperSalto: 0,
  saltosRestantes: 0
};

// === CONTROLES ===
let keys = {};
let gamePaused = false;

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  
  if (e.key === "p" || e.key === "P") {
    gamePaused = !gamePaused;
    if (gamePaused) {
      sonidos.fondo.pause();
    } else {
      sonidos.fondo.play();
    }
  }
  
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
  if (gamePaused && (vidas <= 0 || zorrito.enCastillo)) {
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

// NUBES para el cielo
let nubes = [
  { x: 250, y: 120, size: 30 },
  { x: 600, y: 80, size: 25 },
  { x: 900, y: 150, size: 35 },
  { x: 1400, y: 100, size: 28 },
  { x: 1800, y: 130, size: 32 },
  { x: 2200, y: 90, size: 30 }
];

// OLAS DEL MAR
let olas = [];
for (let i = 0; i < 15; i++) {
  olas.push({
    x: i * 200,
    offset: Math.random() * Math.PI * 2
  });
}

// === PLATAFORMAS (Rocas en la playa) ===
const plataformas = [
  { x: 800, y: groundLevel - 150, width: 150, height: 20 },
  { x: 1300, y: groundLevel - 180, width: 120, height: 20 },
  { x: 1700, y: groundLevel - 140, width: 140, height: 20 },
  { x: 2100, y: groundLevel - 200, width: 130, height: 20 }
];

function drawBackground() {
  // Cielo azul degradado
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#87ceeb");
  gradient.addColorStop(0.6, "#b0d4f1");
  gradient.addColorStop(1, "#e0f2ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Sol tropical
  const sunX = 150;
  const sunY = 100;
  const baseRadius = 45;
  const glow = 15 + Math.sin(frame * 0.05) * 8;

  const sunGradient = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, baseRadius + 50);
  sunGradient.addColorStop(0, "rgba(255, 200, 50, 1)");
  sunGradient.addColorStop(1, "rgba(255, 200, 50, 0)");
  ctx.fillStyle = sunGradient;
  ctx.beginPath();
  ctx.arc(sunX, sunY, baseRadius + 50, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFD700";
  ctx.shadowColor = "rgba(255, 200, 0, 0.8)";
  ctx.shadowBlur = glow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, baseRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Nubes blancas
  ctx.fillStyle = "#fff";
  nubes.forEach((n) => {
    const parallaxX = n.x - cameraX * 0.3;
    ctx.beginPath();
    ctx.arc(parallaxX, n.y, n.size, 0, Math.PI * 2);
    ctx.arc(parallaxX + n.size * 1.2, n.y - 10, n.size * 1.4, 0, Math.PI * 2);
    ctx.arc(parallaxX + n.size * 2.2, n.y, n.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Mar con olas animadas
  const marY = groundLevel - 40;
  ctx.fillStyle = "#4a90e2";
  ctx.fillRect(-cameraX, marY, worldWidth, 40);

  // Olas
  ctx.fillStyle = "#6bb6ff";
  olas.forEach((ola) => {
    const olaX = ola.x - cameraX;
    const olaY = marY + Math.sin(frame * 0.05 + ola.offset) * 3;
    ctx.beginPath();
    ctx.ellipse(olaX, olaY, 40, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Arena de la playa
  ctx.fillStyle = "#f4e4c1";
  ctx.fillRect(-cameraX, groundLevel, worldWidth, 100);

  // Detalles de arena (textura)
  ctx.fillStyle = "#e6d5b0";
  for (let i = 0; i < worldWidth / 50; i++) {
    const x = i * 50 - cameraX;
    ctx.fillRect(x, groundLevel + 5, 20, 2);
    ctx.fillRect(x + 30, groundLevel + 12, 15, 2);
  }

  // Palmeras
  for (let i = 0; i < worldWidth / 350; i++) {
    const x = 200 + i * 350 - cameraX;
    if (x < -150 || x > canvas.width + 150) continue;
    
    const sway = Math.sin(frame * 0.03 + i) * 5;
    
    // Tronco
    ctx.fillStyle = "#8b6f47";
    ctx.fillRect(x + sway, groundLevel - 90, 15, 90);
    
    // Hojas
    ctx.fillStyle = "#228b22";
    for (let j = 0; j < 8; j++) {
      const angle = (j / 8) * Math.PI * 2;
      const leafX = x + 7 + Math.cos(angle) * 40 + sway;
      const leafY = groundLevel - 90 + Math.sin(angle) * 40;
      
      ctx.save();
      ctx.translate(leafX, leafY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, 35, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    // Cocos
    ctx.fillStyle = "#8b4513";
    ctx.beginPath();
    ctx.arc(x + 7 + sway, groundLevel - 85, 8, 0, Math.PI * 2);
    ctx.arc(x + 15 + sway, groundLevel - 82, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gaviotas volando
  if (frame % 200 < 100) {
    const gaviotaX = (frame % 200) * 10 - cameraX * 0.5;
    drawGaviota(gaviotaX, 150);
    drawGaviota(gaviotaX + 80, 180);
  }
}

function drawGaviota(x, y) {
  ctx.strokeStyle = "#666";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 15, y);
  ctx.quadraticCurveTo(x - 10, y - 8, x, y - 5);
  ctx.quadraticCurveTo(x + 10, y - 8, x + 15, y);
  ctx.stroke();
}

function drawPlataformas() {
  plataformas.forEach(p => {
    const screenX = p.x - cameraX;
    if (screenX < -200 || screenX > canvas.width + 200) return;
    
    // Rocas con textura
    ctx.fillStyle = "#a0826d";
    ctx.fillRect(screenX, p.y, p.width, p.height);
    
    ctx.fillStyle = "#8b7355";
    ctx.fillRect(screenX + 5, p.y + 5, p.width - 10, p.height - 10);
    
    ctx.strokeStyle = "#6b5d4f";
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, p.y, p.width, p.height);
    
    // Musgo
    ctx.fillStyle = "#3a8b3a";
    ctx.fillRect(screenX, p.y - 3, p.width, 3);
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
      ctx.fillStyle = "rgba(255, 215, 0, 0.4)";
      ctx.fillRect(screenX - pulse, c.y - pulse, 80 + pulse * 2, 80 + pulse * 2);
    }

    // Cofre estilo pirata
    ctx.fillStyle = "#8b6914";
    ctx.fillRect(screenX, c.y, 80, 60);
    ctx.fillStyle = c.abierto ? "#daa520" : "#6b5614";
    ctx.fillRect(screenX, c.y - 20, 80, 20);
    
    // Detalles metálicos
    ctx.strokeStyle = "#4a4a4a";
    ctx.lineWidth = 4;
    ctx.strokeRect(screenX, c.y - 20, 80, 80);
    
    ctx.fillStyle = "#4a4a4a";
    ctx.fillRect(screenX + 5, c.y + 10, 70, 3);
    ctx.fillRect(screenX + 5, c.y + 40, 70, 3);
    
    // Cerradura
    ctx.fillStyle = "#2a2a2a";
    ctx.beginPath();
    ctx.arc(screenX + 40, c.y + 25, 8, 0, Math.PI * 2);
    ctx.fill();

    if (c.abierto) {
      ctx.fillStyle = "#2ecc71";
      ctx.font = "bold 40px Arial";
      ctx.textAlign = "center";
      ctx.fillText("✓", screenX + 40, c.y + 35);
    }
  });
}

const castillo = {
  x: worldWidth - 300,
  y: groundLevel - 200,
  width: 180,
  height: 200
};

function drawCastillo() {
  const screenX = castillo.x - cameraX;
  if (screenX < -300 || screenX > canvas.width + 300) return;

  const bounce = zorrito.enCastillo ? Math.sin(victoryAnimation * 0.2) * 5 : 0;

  // Castillo de arena
  ctx.fillStyle = "#f4e4c1";
  
  // Torres
  ctx.fillRect(screenX, castillo.y + 60, 40, 140);
  ctx.fillRect(screenX + 140, castillo.y + 60, 40, 140);
  
  // Cuerpo central
  ctx.fillRect(screenX + 30, castillo.y + 80, 120, 120);
  
  // Almenas
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(screenX + i * 10, castillo.y + 60, 8, 15);
    ctx.fillRect(screenX + 140 + i * 8, castillo.y + 60, 6, 15);
    ctx.fillRect(screenX + 35 + i * 24, castillo.y + 80, 18, 12);
  }
  
  // Puerta
  ctx.fillStyle = "#8b6f47";
  ctx.fillRect(screenX + 70, castillo.y + 150, 40, 50);
  ctx.strokeStyle = "#6b5d4f";
  ctx.lineWidth = 2;
  ctx.strokeRect(screenX + 70, castillo.y + 150, 40, 50);
  
  // Ventanas
  ctx.fillStyle = "#4a90e2";
  ctx.fillRect(screenX + 10, castillo.y + 100, 20, 25);
  ctx.fillRect(screenX + 150, castillo.y + 100, 20, 25);
  ctx.fillRect(screenX + 60, castillo.y + 110, 15, 20);
  ctx.fillRect(screenX + 105, castillo.y + 110, 15, 20);
  
  // Banderas
  ctx.fillStyle = "#ff6b35";
  ctx.fillRect(screenX + 15, castillo.y + 50, 3, 15);
  ctx.fillRect(screenX + 160, castillo.y + 50, 3, 15);
  ctx.beginPath();
  ctx.moveTo(screenX + 18, castillo.y + 50);
  ctx.lineTo(screenX + 30, castillo.y + 55);
  ctx.lineTo(screenX + 18, castillo.y + 60);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(screenX + 163, castillo.y + 50);
  ctx.lineTo(screenX + 175, castillo.y + 55);
  ctx.lineTo(screenX + 163, castillo.y + 60);
  ctx.fill();

  // Efectos de victoria
  if (zorrito.enCastillo) {
    for (let i = 0; i < 8; i++) {
      const starX = screenX + 90 + Math.cos(victoryAnimation * 0.1 + i) * 60;
      const starY = castillo.y + 40 + Math.sin(victoryAnimation * 0.1 + i) * 40;
      ctx.fillStyle = "#ffd700";
      ctx.font = "20px Arial";
      ctx.fillText("⭐", starX, starY);
    }
  }
}

function drawZorrito() {
  const screenX = zorrito.x - cameraX;
  const p = 4;
  const baseY = zorrito.y + (zorrito.resting ? 2 : 0) + (zorrito.enCastillo ? Math.sin(victoryAnimation * 0.3) * 3 : 0);
  const stepOffset = Math.sin(zorrito.stepTimer * 0.3) * (zorrito.walking ? 2 : 0);

  ctx.save();
  if (zorrito.facing === "left") {
    ctx.translate(screenX + zorrito.width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(screenX, 0);
  }

  const baseX = 0;
  const tailSwing = Math.sin(zorrito.stepTimer * 0.3) * (zorrito.enCastillo ? 5 : 2);
  
  // Cola
  ctx.fillStyle = "#e76f51";
  ctx.fillRect(baseX - 6 * p, baseY + 12 * p + tailSwing, 6 * p, 3 * p);
  ctx.fillStyle = "#f48c06";
  ctx.fillRect(baseX - 10 * p, baseY + 10 * p + tailSwing, 4 * p, 3 * p);
  ctx.fillStyle = "#fff";
  ctx.fillRect(baseX - 12 * p, baseY + 9 * p + tailSwing, 3 * p, 2 * p);

  // Cuerpo con flotador (para la playa)
  ctx.fillStyle = "#ff6b35";
  ctx.fillRect(baseX + 5 * p, baseY + 8 * p, 10 * p, 10 * p);
  
  // Cabeza
  ctx.fillStyle = "#f48c06";
  ctx.fillRect(baseX + 4 * p, baseY + 1 * p, 12 * p, 9 * p);
  
  // Orejas
  ctx.fillStyle = "#e85d04";
  ctx.fillRect(baseX + 4 * p, baseY - 1 * p, 3 * p, 3 * p);
  ctx.fillRect(baseX + 13 * p, baseY - 1 * p, 3 * p, 3 * p);
  
  // Pantalón de playa
  ctx.fillStyle = "#4a90e2";
  ctx.fillRect(baseX + 5 * p, baseY + 16 * p, 10 * p, 5 * p);
  
  // Patas
  ctx.fillStyle = "#f48c06";
  ctx.fillRect(baseX + 5 * p, baseY + 21 * p + stepOffset, 4 * p, 2 * p);
  ctx.fillRect(baseX + 11 * p, baseY + 21 * p - stepOffset, 4 * p, 2 * p);
  
  // Brazos
  ctx.fillStyle = "#f48c06";
  ctx.fillRect(baseX + 2 * p, baseY + 8 * p, 3 * p, 5 * p);
  ctx.fillRect(baseX + 15 * p, baseY + 8 * p, 3 * p, 5 * p);

  // Cara
  ctx.fillStyle = "#000";
  if (zorrito.enCastillo) {
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

  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillRect(10, 10, 300, 40);
  ctx.fillStyle = "#ff6b35";
  ctx.fillRect(15, 15, 290 * porcentaje, 30);
  ctx.strokeStyle = "#d4a574";
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, 300, 40);
  ctx.fillStyle = "#333";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Cofres: ${cofresAbiertos}/${total}`, 20, 35);

  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillRect(10, 60, 150, 35);
  ctx.fillStyle = "#e74c3c";
  ctx.fillText(`❤ Vidas: ${vidas}`, 20, 83);

  if (zorrito.tieneSuperSalto) {
    const tiempoRestante = Math.ceil((300 - zorrito.tiempoSuperSalto) / 60);
    ctx.fillStyle = "rgba(74, 144, 226, 0.9)";
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
    if (zorrito.tiempoSuperSalto > 300) {
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

  if (Math.abs(zorrito.x - castillo.x) < 100 && cofres.every(c => c.abierto)) {
    zorrito.enCastillo = true;
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
    drawCastillo();
    drawZorrito();
    drawProgressBar();

    if (!gamePaused) {
        update();
        canvas.style.cursor = "default";
    } else {
        if (vidas <= 0) {
            mostrarPantallaGameOver();
        } else if (zorrito.enCastillo) {
            mostrarPantallaVictoria();
        } else {
            drawPauseScreen();
        }
    }

    requestAnimationFrame(loop);
}

// ========== PREGUNTAS DE MEDIDA Y GEOMETRÍA ==========
const preguntas = [
  { pregunta: "¿Cuántos centímetros hay en 1 metro?", opciones: ["10 cm", "100 cm", "1000 cm"], correcta: 1 },
  { pregunta: "¿Cuántos lados tiene un hexágono?", opciones: ["5", "6", "7"], correcta: 1 },
  { pregunta: "¿Cuál es el perímetro de un cuadrado con lado de 4 cm?", opciones: ["8 cm", "16 cm", "12 cm"], correcta: 1 },
  { pregunta: "¿Cuántos vértices tiene un cubo?", opciones: ["6", "8", "12"], correcta: 1 },
  { pregunta: "¿Cuál es el área de un rectángulo de 5 cm × 3 cm?", opciones: ["8 cm²", "15 cm²", "10 cm²"], correcta: 1 },
  { pregunta: "¿Cuántos grados tiene un ángulo recto?", opciones: ["45°", "90°", "180°"], correcta: 1 },
  { pregunta: "¿Cuántos mililitros hay en 2 litros?", opciones: ["200 ml", "2000 ml", "20 ml"], correcta: 1 },
  { pregunta: "¿Cuántas caras tiene una pirámide triangular?", opciones: ["3", "4", "5"], correcta: 1 },
  { pregunta: "Si un triángulo tiene todos sus lados iguales, ¿cómo se llama?", opciones: ["Escaleno", "Equilátero", "Isósceles"], correcta: 1 },
  { pregunta: "¿Cuántos gramos hay en 1 kilogramo?", opciones: ["10 g", "100 g", "1000 g"], correcta: 2 }
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
            reproducirSonido('cofre');
            mostrarPregunta(i);
        }
    });
}

function mostrarPregunta(indiceCofre) {
  mostrandoPregunta = true;
  gamePaused = true;
  const q = preguntas[indiceCofre];
  
  const cofresQueDanSuperSalto = [0, 1, 3, 5, 7];
  const darSuperSalto = cofresQueDanSuperSalto.includes(indiceCofre);
  
  if (document.getElementById("preguntaBox")) return;

  const contenedor = document.createElement("div");
  contenedor.id = "preguntaBox";
  contenedor.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #87ceeb 0%, #b0d4f1 100%);
    border: 4px solid #d4a574;
    padding: 25px;
    font-family: Arial, sans-serif;
    z-index: 10000;
    width: 450px;
    max-width: 90%;
    text-align: center;
    border-radius: 15px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  `;
  
  let mensajePremio = '';
  if (darSuperSalto) {
    const cofresAltos = [2, 4, 6, 8];
    const siguienteCofreAlto = cofresAltos.find(index => index > indiceCofre);
    
    if (siguienteCofreAlto !== undefined) {
      mensajePremio = `<p style="color:#ff6b35; font-weight:bold; margin:10px 0;">¡Premio: SUPER SALTO! ⚡<br><small style="color:#333;">Para alcanzar el cofre ${siguienteCofreAlto + 1}</small></p>`;
    } else {
      mensajePremio = '<p style="color:#ff6b35; font-weight:bold; margin:10px 0;">¡Premio: SUPER SALTO! ⚡</p>';
    }
  } else {
    mensajePremio = '<p style="color:#27ae60; font-weight:bold; margin:10px 0;">¡Respuesta correcta! +10 puntos</p>';
  }
  
  contenedor.innerHTML = `
    <h3 style="margin:0 0 20px; color: #ff6b35; font-size: 20px;">🏖️ Cofre ${indiceCofre + 1}/10</h3>
    ${mensajePremio}
    <p style="margin: 0 0 20px; font-size: 18px; color: #333;">${q.pregunta}</p>
    <div id="opcionesBox" style="display:flex;flex-direction:column;gap:12px;">
      ${q.opciones.map((op, idx) => `<button class='opcion' data-idx='${idx}' style="padding:12px 20px; font-size:16px; cursor:pointer; background:#4a90e2; color:white; border:none; border-radius:5px; transition: all 0.2s;">${op}</button>`).join("")}
    </div>
  `;
  document.body.appendChild(contenedor);

  document.querySelectorAll(".opcion").forEach(btn => {
    btn.addEventListener("mouseover", (e) => e.target.style.background = "#3a7ac2");
    btn.addEventListener("mouseout", (e) => e.target.style.background = "#4a90e2");
    btn.addEventListener("click", (e) => {
      const seleccion = parseInt(e.target.dataset.idx);
      
      if (seleccion === q.correcta) {
        puntaje += 10;
        cofres[indiceCofre].abierto = true;
        reproducirSonido('correcto');
        
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
        mostrarPantallaVictoria();
    } else {
        mostrarPantallaGameOver();
    }

    const usuarioIdEl = document.getElementById("usuario_id");
    const usuarioId = usuarioIdEl ? usuarioIdEl.value : null;
    fetch("/guardar_progreso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            usuario_id: usuarioId,
            unidad: 6,
            aciertos: Math.round(puntaje / 10),
            total: preguntas.length,
            puntaje: puntaje,
        }),
    }).catch(err => console.error("Error guardando progreso:", err));
}

function mostrarPantallaVictoria() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = "bold 48px 'Press Start 2P', cursive, Arial, sans-serif";
    ctx.fillStyle = "#ffd700";
    ctx.textAlign = "center";
    
    ctx.fillText("¡FELICIDADES!", canvas.width / 2, canvas.height / 2 - 80);
    
    ctx.font = "20px 'Press Start 2P', cursive, Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("El zorrito llegó al castillo", canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillText(`Puntaje: ${puntaje}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText(`Vidas restantes: ${vidas}`, canvas.width / 2, canvas.height / 2 + 60);
    
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
    
    canvas.style.cursor = "pointer";
}

function mostrarPantallaGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = "bold 48px 'Press Start 2P', cursive, Arial, sans-serif";
    ctx.fillStyle = "#E74C3C";
    ctx.textAlign = "center";
    
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 80);
    
    ctx.font = "20px 'Press Start 2P', cursive, Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Te quedaste sin vidas", canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillText(`Puntaje: ${puntaje}`, canvas.width / 2, canvas.height / 2 + 20);
    
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