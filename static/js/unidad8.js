// ===============================
// 🌿 RETOMATE - ESTADÍSTICA DESCRIPTIVA
// Aventura Mágica en la Jungla del Zorrito con 10 Cofres y Templo Final
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
  enTemplo: false,
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
  if (gamePaused && (vidas <= 0 || zorrito.enTemplo)) {
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

// PARTÍCULAS MÁGICAS
let particulas = [];
for (let i = 0; i < 50; i++) {
  particulas.push({
    x: Math.random() * worldWidth,
    y: Math.random() * 500,
    size: Math.random() * 3 + 1,
    speed: Math.random() * 0.5 + 0.2,
    color: ['#76ff03', '#00e676', '#ffd600', '#e040fb'][Math.floor(Math.random() * 4)],
    offset: Math.random() * Math.PI * 2
  });
}

// MARIPOSAS
let mariposas = [];
for (let i = 0; i < 8; i++) {
  mariposas.push({
    x: Math.random() * worldWidth,
    y: Math.random() * 400 + 100,
    speed: Math.random() * 0.5 + 0.3,
    wingFlap: Math.random() * 100
  });
}

// === PLATAFORMAS (Ramas y troncos) ===
const plataformas = [
  { x: 800, y: groundLevel - 150, width: 150, height: 20 },
  { x: 1300, y: groundLevel - 180, width: 120, height: 20 },
  { x: 1700, y: groundLevel - 140, width: 140, height: 20 },
  { x: 2100, y: groundLevel - 200, width: 130, height: 20 }
];

function drawBackground() {
  // Cielo de jungla con degradado
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#2d5016");
  gradient.addColorStop(0.5, "#3a6629");
  gradient.addColorStop(1, "#4a7c2c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Sol filtrado por el follaje
  const sunX = 800;
  const sunY = 120;
  const sunRadius = 50;
  
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunRadius + 60);
  sunGlow.addColorStop(0, "rgba(255, 235, 100, 0.5)");
  sunGlow.addColorStop(1, "rgba(255, 235, 100, 0)");
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius + 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffeb64";
  ctx.shadowColor = "rgba(255, 235, 100, 0.6)";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Partículas mágicas flotantes
  particulas.forEach((p) => {
    const parallaxX = p.x - cameraX * 0.5;
    p.y += Math.sin(frame * 0.02 + p.offset) * p.speed;
    p.x += Math.cos(frame * 0.03 + p.offset) * 0.3;
    
    if (p.y > 500) p.y = 0;
    if (p.x > worldWidth) p.x = 0;
    if (p.x < 0) p.x = worldWidth;
    
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(parallaxX, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // Mariposas mágicas
  mariposas.forEach((m) => {
    const parallaxX = m.x - cameraX * 0.4;
    m.x += m.speed;
    m.y += Math.sin(frame * 0.05 + m.x) * 0.5;
    m.wingFlap += 0.2;
    
    if (m.x > worldWidth + 100) {
      m.x = -100;
      m.y = Math.random() * 400 + 100;
    }
    
    const wingAngle = Math.sin(m.wingFlap) * 0.5;
    
    // Cuerpo
    ctx.fillStyle = "#6a1b9a";
    ctx.fillRect(parallaxX - 2, m.y - 5, 4, 10);
    
    // Alas
    ctx.fillStyle = "#e040fb";
    ctx.save();
    ctx.translate(parallaxX, m.y);
    
    // Ala izquierda
    ctx.rotate(-wingAngle);
    ctx.beginPath();
    ctx.ellipse(-5, 0, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(wingAngle);
    
    // Ala derecha
    ctx.rotate(wingAngle);
    ctx.beginPath();
    ctx.ellipse(5, 0, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  });

  // Suelo de jungla
  ctx.fillStyle = "#1a3d1a";
  ctx.fillRect(-cameraX, groundLevel, worldWidth, 100);
  
  // Pasto y vegetación
  ctx.fillStyle = "#2e7d32";
  for (let i = 0; i < worldWidth / 20; i++) {
    const x = i * 20 - cameraX;
    const height = Math.random() * 10 + 15;
    ctx.fillRect(x, groundLevel - height, 3, height);
  }

  // Árboles gigantes de la jungla
  for (let i = 0; i < worldWidth / 400; i++) {
    const x = 180 + i * 400 - cameraX;
    if (x < -200 || x > canvas.width + 200) continue;
    
    const sway = Math.sin(frame * 0.02 + i) * 8;
    
    // Tronco grande
    ctx.fillStyle = "#4e342e";
    ctx.fillRect(x + sway, groundLevel - 200, 40, 200);
    
    // Raíces
    ctx.fillStyle = "#3e2723";
    ctx.beginPath();
    ctx.moveTo(x + sway, groundLevel);
    ctx.lineTo(x - 20 + sway, groundLevel);
    ctx.lineTo(x + 10 + sway, groundLevel - 30);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x + 40 + sway, groundLevel);
    ctx.lineTo(x + 60 + sway, groundLevel);
    ctx.lineTo(x + 30 + sway, groundLevel - 30);
    ctx.fill();
    
    // Copa del árbol con múltiples capas
    for (let j = 0; j < 3; j++) {
      ctx.fillStyle = j === 0 ? "#1b5e20" : j === 1 ? "#2e7d32" : "#388e3c";
      ctx.beginPath();
      ctx.arc(x + 20 + sway, groundLevel - 180 - j * 20, 80 - j * 10, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Lianas colgantes
    ctx.strokeStyle = "#558b2f";
    ctx.lineWidth = 3;
    for (let k = 0; k < 3; k++) {
      const lianaX = x + 10 + k * 15 + sway;
      ctx.beginPath();
      ctx.moveTo(lianaX, groundLevel - 180);
      ctx.quadraticCurveTo(
        lianaX + Math.sin(frame * 0.05 + k) * 10,
        groundLevel - 100,
        lianaX + Math.sin(frame * 0.05 + k) * 15,
        groundLevel - 20
      );
      ctx.stroke();
    }
    
    // Flores mágicas en el árbol
    for (let f = 0; f < 5; f++) {
      const flowerX = x - 30 + Math.random() * 100 + sway;
      const flowerY = groundLevel - 200 + Math.random() * 40;
      ctx.fillStyle = ['#ff6b9d', '#ffd600', '#00e676', '#e040fb'][f % 4];
      ctx.beginPath();
      ctx.arc(flowerX, flowerY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Plantas brillantes del suelo
  for (let i = 0; i < worldWidth / 100; i++) {
    const x = 50 + i * 100 - cameraX;
    if (x < -50 || x > canvas.width + 50) continue;
    
    const glow = Math.sin(frame * 0.05 + i) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(118, 255, 3, ${glow})`;
    ctx.shadowColor = "#76ff03";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(x, groundLevel - 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawPlataformas() {
  plataformas.forEach(p => {
    const screenX = p.x - cameraX;
    if (screenX < -200 || screenX > canvas.width + 200) return;
    
    // Rama o tronco
    ctx.fillStyle = "#5d4037";
    ctx.fillRect(screenX, p.y, p.width, p.height);
    
    ctx.fillStyle = "#4e342e";
    ctx.fillRect(screenX + 5, p.y + 5, p.width - 10, p.height - 10);
    
    ctx.strokeStyle = "#3e2723";
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, p.y, p.width, p.height);
    
    // Musgo brillante
    ctx.fillStyle = "#76ff03";
    ctx.shadowColor = "#76ff03";
    ctx.shadowBlur = 8;
    ctx.fillRect(screenX, p.y - 4, p.width, 4);
    ctx.shadowBlur = 0;
    
    // Hongos mágicos
    for (let i = 0; i < 3; i++) {
      const mushroomX = screenX + 20 + i * 40;
      ctx.fillStyle = "#ff6b9d";
      ctx.beginPath();
      ctx.arc(mushroomX, p.y - 8, 6, 0, Math.PI, true);
      ctx.fill();
      ctx.fillStyle = "#8e24aa";
      ctx.fillRect(mushroomX - 2, p.y - 8, 4, 8);
    }
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
      const glowColor = ['#76ff03', '#00e676', '#ffd600', '#e040fb'][Math.floor(frame / 20) % 4];
      ctx.fillStyle = glowColor.replace(')', ', 0.4)').replace('rgb', 'rgba');
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 20;
      ctx.fillRect(screenX - pulse, c.y - pulse, 80 + pulse * 2, 80 + pulse * 2);
      ctx.shadowBlur = 0;
    }

    // Cofre místico
    ctx.fillStyle = "#4a148c";
    ctx.fillRect(screenX, c.y, 80, 60);
    ctx.fillStyle = c.abierto ? "#7b1fa2" : "#311b92";
    ctx.fillRect(screenX, c.y - 20, 80, 20);
    
    // Detalles dorados mágicos
    ctx.strokeStyle = "#ffd600";
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX, c.y - 20, 80, 80);
    
    ctx.fillStyle = "#ffd600";
    ctx.fillRect(screenX + 5, c.y + 10, 70, 2);
    ctx.fillRect(screenX + 5, c.y + 40, 70, 2);
    
    // Símbolo mágico
    ctx.fillStyle = "#00e676";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("✦", screenX + 40, c.y + 15);

    if (c.abierto) {
      ctx.fillStyle = "#76ff03";
      ctx.shadowColor = "#76ff03";
      ctx.shadowBlur = 15;
      ctx.font = "bold 40px Arial";
      ctx.fillText("✓", screenX + 40, c.y + 40);
      ctx.shadowBlur = 0;
    }
  });
}

const templo = {
  x: worldWidth - 350,
  y: groundLevel - 250,
  width: 250,
  height: 250
};

function drawTemplo() {
  const screenX = templo.x - cameraX;
  if (screenX < -400 || screenX > canvas.width + 400) return;

  const bounce = zorrito.enTemplo ? Math.sin(victoryAnimation * 0.2) * 5 : 0;

  // Templo antiguo de piedra
  ctx.fillStyle = "#616161";
  
  // Base del templo
  ctx.fillRect(screenX, templo.y + 150, templo.width, 100);
  
  // Escaleras
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#757575" : "#616161";
    ctx.fillRect(screenX + 20 + i * 10, templo.y + 250 - i * 8, templo.width - 40 - i * 20, 8);
  }
  
  // Columnas
  ctx.fillStyle = "#9e9e9e";
  ctx.fillRect(screenX + 30, templo.y + 50, 30, 100);
  ctx.fillRect(screenX + 90, templo.y + 50, 30, 100);
  ctx.fillRect(screenX + 150, templo.y + 50, 30, 100);
  ctx.fillRect(screenX + 190, templo.y + 50, 30, 100);
  
  // Techo triangular
  ctx.fillStyle = "#424242";
  ctx.beginPath();
  ctx.moveTo(screenX - 20, templo.y + 50);
  ctx.lineTo(screenX + templo.width / 2, templo.y - 30);
  ctx.lineTo(screenX + templo.width + 20, templo.y + 50);
  ctx.closePath();
  ctx.fill();
  
  // Entrada con luz mágica
  ctx.fillStyle = "#1a237e";
  ctx.fillRect(screenX + 85, templo.y + 170, 80, 80);
  
  const glowGradient = ctx.createRadialGradient(
    screenX + 125, templo.y + 210, 10,
    screenX + 125, templo.y + 210, 50
  );
  glowGradient.addColorStop(0, "rgba(118, 255, 3, 0.6)");
  glowGradient.addColorStop(1, "rgba(118, 255, 3, 0)");
  ctx.fillStyle = glowGradient;
  ctx.fillRect(screenX + 85, templo.y + 170, 80, 80);
  
  // Símbolos místicos en las columnas
  ctx.fillStyle = "#76ff03";
  ctx.font = "24px Arial";
  ctx.textAlign = "center";
  ctx.fillText("◈", screenX + 45, templo.y + 90);
  ctx.fillText("✦", screenX + 105, templo.y + 90);
  ctx.fillText("◆", screenX + 165, templo.y + 90);
  ctx.fillText("✧", screenX + 205, templo.y + 90);
  
  // Enredaderas brillantes
  ctx.strokeStyle = "#00e676";
  ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    const vineX = screenX + 40 + i * 60;
    ctx.beginPath();
    ctx.moveTo(vineX, templo.y + 40);
    ctx.quadraticCurveTo(
      vineX + Math.sin(frame * 0.05 + i) * 10,
      templo.y + 100,
      vineX + Math.sin(frame * 0.05 + i) * 15,
      templo.y + 150
    );
    ctx.stroke();
  }

  // Efectos de victoria
  if (zorrito.enTemplo) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + victoryAnimation * 0.05;
      const distance = 80 + Math.sin(victoryAnimation * 0.1) * 20;
      const starX = screenX + templo.width / 2 + Math.cos(angle) * distance;
      const starY = templo.y + 100 + Math.sin(angle) * distance;
      ctx.fillStyle = ['#76ff03', '#00e676', '#ffd600', '#e040fb'][i % 4];
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 15;
      ctx.font = "30px Arial";
      ctx.fillText("✨", starX, starY);
      ctx.shadowBlur = 0;
    }
    
    // Rayo de luz desde el templo
    ctx.fillStyle = "rgba(118, 255, 3, 0.3)";
    ctx.beginPath();
    ctx.moveTo(screenX + templo.width / 2 - 30, templo.y);
    ctx.lineTo(screenX + templo.width / 2 + 30, templo.y);
    ctx.lineTo(screenX + templo.width / 2 + 50, 0);
    ctx.lineTo(screenX + templo.width / 2 - 50, 0);
    ctx.closePath();
    ctx.fill();
  }
}

function drawZorrito() {
  const screenX = zorrito.x - cameraX;
  const p = 4;
  const baseY = zorrito.y + (zorrito.resting ? 2 : 0) + (zorrito.enTemplo ? Math.sin(victoryAnimation * 0.3) * 3 : 0);
  const stepOffset = Math.sin(zorrito.stepTimer * 0.3) * (zorrito.walking ? 2 : 0);

  ctx.save();
  if (zorrito.facing === "left") {
    ctx.translate(screenX + zorrito.width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(screenX, 0);
  }

  const baseX = 0;
  const tailSwing = Math.sin(zorrito.stepTimer * 0.3) * (zorrito.enTemplo ? 5 : 2);
  
  // Cola
  ctx.fillStyle = "#e76f51";
  ctx.fillRect(baseX - 6 * p, baseY + 12 * p + tailSwing, 6 * p, 3 * p);
  ctx.fillStyle = "#f48c06";
  ctx.fillRect(baseX - 10 * p, baseY + 10 * p + tailSwing, 4 * p, 3 * p);
  ctx.fillStyle = "#fff";
  ctx.fillRect(baseX - 12 * p, baseY + 9 * p + tailSwing, 3 * p, 2 * p);

  // Cuerpo de explorador (chaleco verde jungla)
  ctx.fillStyle = "#2e7d32";
  ctx.fillRect(baseX + 5 * p, baseY + 8 * p, 10 * p, 10 * p);
  
  // Cabeza
  ctx.fillStyle = "#f48c06";
  ctx.fillRect(baseX + 4 * p, baseY + 1 * p, 12 * p, 9 * p);
  
  // Orejas
  ctx.fillStyle = "#e85d04";
  ctx.fillRect(baseX + 4 * p, baseY - 1 * p, 3 * p, 3 * p);
  ctx.fillRect(baseX + 13 * p, baseY - 1 * p, 3 * p, 3 * p);
  
  // Pantalón de explorador
  ctx.fillStyle = "#5d4037";
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
  if (zorrito.enTemplo) {
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

  ctx.fillStyle = "rgba(26, 61, 26, 0.9)";
  ctx.fillRect(10, 10, 300, 40);
  ctx.fillStyle = "#76ff03";
  ctx.fillRect(15, 15, 290 * porcentaje, 30);
  ctx.strokeStyle = "#00e676";
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, 300, 40);
  ctx.fillStyle = "#c8e6c9";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Cofres: ${cofresAbiertos}/${total}`, 20, 35);

  ctx.fillStyle = "rgba(26, 61, 26, 0.9)";
  ctx.fillRect(10, 60, 150, 35);
  ctx.fillStyle = "#ff6b9d";
  ctx.fillText(`❤ Vidas: ${vidas}`, 20, 83);

  if (zorrito.tieneSuperSalto) {
    const tiempoRestante = Math.ceil((300 - zorrito.tiempoSuperSalto) / 60);
    ctx.fillStyle = "rgba(118, 255, 3, 0.9)";
    ctx.fillRect(10, 105, 180, 35);
    ctx.fillStyle = "#fff";
    ctx.fillText(`⚡ Super Salto: ${tiempoRestante}s`, 20, 128);
  }
}

function drawPauseScreen() {
  ctx.fillStyle = "rgba(26, 61, 26, 0.95)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const iconBoxX = canvas.width / 2 - 200;
  const iconBoxY = canvas.height / 2 - 60;
  ctx.fillStyle = "#558b2f";
  ctx.fillRect(iconBoxX, iconBoxY, 60, 60);
  ctx.fillStyle = "#fff";
  ctx.fillRect(iconBoxX + 15, iconBoxY + 12, 12, 36);
  ctx.fillRect(iconBoxX + 33, iconBoxY + 12, 12, 36);

  ctx.font = "bold 32px Arial";
  ctx.fillStyle = "#76ff03";
  ctx.textAlign = "left";
  ctx.fillText("Juego en pausa", iconBoxX + 80, iconBoxY + 42);

  const btnX = canvas.width / 2 - 100;
  const btnY = canvas.height / 2 + 40;
  const btnWidth = 200;
  const btnHeight = 50;
  ctx.fillStyle = "#2e7d32";
  ctx.fillRect(btnX, btnY + 4, btnWidth, btnHeight);
  ctx.fillStyle = "#388e3c";
  ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
  ctx.strokeStyle = "#2e7d32";
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

  if (Math.abs(zorrito.x - templo.x) < 150 && cofres.every(c => c.abierto)) {
    zorrito.enTemplo = true;
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
    drawTemplo();
    drawZorrito();
    drawProgressBar();

    if (!gamePaused) {
        update();
        canvas.style.cursor = "default";
    } else {
        if (vidas <= 0) {
            mostrarPantallaGameOver();
        } else if (zorrito.enTemplo) {
            mostrarPantallaVictoria();
        } else {
            drawPauseScreen();
        }
    }

    requestAnimationFrame(loop);
}

// ========== PREGUNTAS DE ESTADÍSTICA DESCRIPTIVA ==========
const preguntas = [
  { pregunta: "¿Cuál es la media de estos datos: 4, 6, 8, 10?", opciones: ["6", "7", "8"], correcta: 1 },
  { pregunta: "¿Cuál es la mediana de: 3, 5, 7, 9, 11?", opciones: ["5", "7", "9"], correcta: 1 },
  { pregunta: "¿Cuál es la moda de: 2, 3, 3, 4, 5, 3, 6?", opciones: ["2", "3", "4"], correcta: 1 },
  { pregunta: "¿Cuál es el rango de: 10, 15, 20, 25, 30?", opciones: ["15", "20", "25"], correcta: 1 },
  { pregunta: "Si la suma de 5 datos es 50, ¿cuál es la media?", opciones: ["5", "10", "15"], correcta: 1 },
  { pregunta: "En un gráfico de barras, ¿qué representa la altura?", opciones: ["La categoría", "La frecuencia", "El color"], correcta: 1 },
  { pregunta: "¿Cuál es la mediana de: 2, 4, 6, 8?", opciones: ["4", "5", "6"], correcta: 1 },
  { pregunta: "¿Qué medida indica el valor central de un conjunto?", opciones: ["Rango", "Media", "Máximo"], correcta: 1 },
  { pregunta: "¿Cuál es la moda de: 1, 2, 2, 3, 4, 4, 4, 5?", opciones: ["2", "3", "4"], correcta: 2 },
  { pregunta: "Si organizas datos de menor a mayor, ¿qué buscas?", opciones: ["La moda", "La mediana", "El rango"], correcta: 1 }
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
    background: linear-gradient(135deg, #1a4d2e 0%, #2d5016 100%);
    border: 4px solid #76ff03;
    padding: 25px;
    font-family: Arial, sans-serif;
    z-index: 10000;
    width: 450px;
    max-width: 90%;
    text-align: center;
    border-radius: 15px;
    box-shadow: 0 8px 32px rgba(118, 255, 3, 0.5);
  `;
  
  let mensajePremio = '';
  if (darSuperSalto) {
    const cofresAltos = [2, 4, 6, 8];
    const siguienteCofreAlto = cofresAltos.find(index => index > indiceCofre);
    
    if (siguienteCofreAlto !== undefined) {
      mensajePremio = `<p style="color:#ffd600; font-weight:bold; margin:10px 0;">¡Premio: SUPER SALTO! ⚡<br><small style="color:#c8e6c9;">Para alcanzar el cofre ${siguienteCofreAlto + 1}</small></p>`;
    } else {
      mensajePremio = '<p style="color:#ffd600; font-weight:bold; margin:10px 0;">¡Premio: SUPER SALTO! ⚡</p>';
    }
  } else {
    mensajePremio = '<p style="color:#76ff03; font-weight:bold; margin:10px 0;">¡Respuesta correcta! +10 puntos</p>';
  }
  
  contenedor.innerHTML = `
    <h3 style="margin:0 0 20px; color: #76ff03; font-size: 20px;">🌿 Cofre Místico ${indiceCofre + 1}/10</h3>
    ${mensajePremio}
    <p style="margin: 0 0 20px; font-size: 18px; color: #c8e6c9;">${q.pregunta}</p>
    <div id="opcionesBox" style="display:flex;flex-direction:column;gap:12px;">
      ${q.opciones.map((op, idx) => `<button class='opcion' data-idx='${idx}' style="padding:12px 20px; font-size:16px; cursor:pointer; background:#388e3c; color:white; border:none; border-radius:5px; transition: all 0.2s;">${op}</button>`).join("")}
    </div>
  `;
  document.body.appendChild(contenedor);

  document.querySelectorAll(".opcion").forEach(btn => {
    btn.addEventListener("mouseover", (e) => e.target.style.background = "#2e7d32");
    btn.addEventListener("mouseout", (e) => e.target.style.background = "#388e3c");
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
            unidad: 8,
            aciertos: Math.round(puntaje / 10),
            total: preguntas.length,
            puntaje: puntaje,
        }),
    }).catch(err => console.error("Error guardando progreso:", err));
}

function mostrarPantallaVictoria() {
    ctx.fillStyle = "rgba(26, 61, 26, 0.95)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = "bold 48px 'Press Start 2P', cursive, Arial, sans-serif";
    ctx.fillStyle = "#76ff03";
    ctx.shadowColor = "#76ff03";
    ctx.shadowBlur = 20;
    ctx.textAlign = "center";
    
    ctx.fillText("¡FELICIDADES!", canvas.width / 2, canvas.height / 2 - 80);
    ctx.shadowBlur = 0;
    
    ctx.font = "20px 'Press Start 2P', cursive, Arial, sans-serif";
    ctx.fillStyle = "#c8e6c9";
    ctx.fillText("El zorrito llegó al templo", canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillText(`Puntaje: ${puntaje}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText(`Vidas restantes: ${vidas}`, canvas.width / 2, canvas.height / 2 + 60);
    
    const btnX = canvas.width / 2 - 100;
    const btnY = canvas.height / 2 + 120;
    const btnWidth = 200;
    const btnHeight = 50;
    
    ctx.fillStyle = "#388e3c";
    ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
    ctx.strokeStyle = "#76ff03";
    ctx.lineWidth = 3;
    ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
    
    ctx.font = "16px 'Press Start 2P', cursive, Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("ACEPTAR", canvas.width / 2, btnY + 32);
    
    canvas.style.cursor = "pointer";
}

function mostrarPantallaGameOver() {
    ctx.fillStyle = "rgba(26, 61, 26, 0.95)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = "bold 48px 'Press Start 2P', cursive, Arial, sans-serif";
    ctx.fillStyle = "#ff6b9d";
    ctx.shadowColor = "#ff6b9d";
    ctx.shadowBlur = 20;
    ctx.textAlign = "center";
    
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 80);
    ctx.shadowBlur = 0;
    
    ctx.font = "20px 'Press Start 2P', cursive, Arial, sans-serif";
    ctx.fillStyle = "#c8e6c9";
    ctx.fillText("Te quedaste sin vidas", canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillText(`Puntaje: ${puntaje}`, canvas.width / 2, canvas.height / 2 + 20);
    
    const btnX = canvas.width / 2 - 100;
    const btnY = canvas.height / 2 + 80;
    const btnWidth = 200;
    const btnHeight = 50;
    
    ctx.fillStyle = "#c62828";
    ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
    ctx.strokeStyle = "#ff6b9d";
    ctx.lineWidth = 3;
    ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
    
    ctx.font = "16px 'Press Start 2P', cursive, Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("ACEPTAR", canvas.width / 2, btnY + 32);
    
    canvas.style.cursor = "pointer";
}

loop();