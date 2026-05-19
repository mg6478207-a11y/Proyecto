// 🎮 RETOMATE - Grado 4 | Unidad 6: Estadística Básica
// 📊 "El Huerto Estadístico"
// Controles: Flechas ← / → para mover al zorro | P pausar

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");
canvas.width  = 1000;
canvas.height = 600;

// ─── ESTADO DEL JUEGO ──────────────────────────────────────────────────────────
let aciertos       = 0;
let currentQ       = 0;
let juegoTerminado = false;
let pausado        = false;
let tiempo         = 0;
let feedbackTimer  = 0;
let feedbackMsg    = "";
let feedbackOk     = true;
let frutas         = [];

// ─── RECOLECCIÓN ACTUAL DEL ESTUDIANTE (CONTEO DE FRECUENCIAS) ─────────────────
let recolectado = { manzana: 0, zanahoria: 0, baya: 0 };

// ─── CONFIGURACIÓN DEL JUGADOR (ZORRO CON CANASTA AMORTIGUADA) ─────────────────
const fox = {
  x: 600,
  y: 490,
  w: 80,
  h: 80,
  speed: 13
};

const keys = { ArrowLeft: false, ArrowRight: false };

// ─── BANCO DE RETOS ESTADÍSTICOS ──────────────────────────────────────────────
const preguntas = [
  { consigna: "Recolecta hasta que la MODA sea: 5 Manzanas 🍎 (Deja las demás en 0)", target: { manzana: 5, zanahoria: 0, baya: 0 } },
  { consigna: "Iguala las frecuencias: Consigue 3 Zanahorias 🥕 y 3 Bayas 🍇", target: { manzana: 0, zanahoria: 3, baya: 3 } },
  { consigna: "Llena el pedido exacto: 4 Manzanas 🍎, 2 Zanahorias 🥕 y 5 Bayas 🍇", target: { manzana: 4, zanahoria: 2, baya: 5 } },
  { consigna: "Haz que la Zanahoria 🥕 sea la moda absoluta con 6 unidades", target: { manzana: 1, zanahoria: 6, baya: 2 } },
  { consigna: "Prepara un jugo mixto: 4 Manzanas 🍎 y 4 Bayas 🍇 (0 Zanahorias)", target: { manzana: 4, zanahoria: 0, baya: 4 } }
];

// ─── GENERACIÓN DE FRUTAS MÁS GRANDES Y LENTAS ────────────────────────────────
function spawnFruta() {
  if (pausado || juegoTerminado || feedbackTimer > 0) return;
  
  const tipos = [
    { name: "manzana", color: "#e74c3c", icono: "🍎" },
    { name: "zanahoria", color: "#e67e22", icono: "🥕" },
    { name: "baya", color: "#9b59b6", icono: "🍇" }
  ];
  
  const tipoElegido = tipos[Math.floor(Math.random() * tipos.length)];
  
  frutas.push({
    x: 440 + Math.random() * 460,
    y: -30,
    w: 36, // Caja de colisión más ancha
    h: 36,
    speedY: 1.8 + Math.random() * 1.5, // Caída más lenta y regulada para niños
    tipo: tipoElegido.name,
    color: tipoElegido.color,
    icono: tipoElegido.icono
  });
}

let intervalFrutas = setInterval(spawnFruta, 1400);

// ─── INTERACCIÓN Y CONTROLES ──────────────────────────────────────────────────
window.addEventListener("keydown", e => {
  if (["ArrowLeft", "ArrowRight", " "].includes(e.key) && e.target === document.body) e.preventDefault();
  if (e.key in keys) keys[e.key] = true;
  if ((e.key === "p" || e.key === "P") && !juegoTerminado) pausado = !pausado;
});

window.addEventListener("keyup", e => {
  if (e.key in keys) keys[e.key] = false;
});

canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;

  if (pausado && !juegoTerminado) {
    if (mx >= canvas.width/2 - 125 && mx <= canvas.width/2 + 125 && my >= 270 && my <= 330) {
      pausado = false;
    }
    return;
  }
  if (juegoTerminado) {
    if (mx >= canvas.width/2 - 125 && mx <= canvas.width/2 + 125 && my >= 400 && my <= 454) {
      resetGame();
    }
  }
});

// ─── LÓGICA DE ACTUALIZACIÓN ──────────────────────────────────────────────────
function update() {
  if (pausado || juegoTerminado || feedbackTimer > 0) return;

  if (keys.ArrowLeft) fox.x = Math.max(420, fox.x - fox.speed);
  if (keys.ArrowRight) fox.x = Math.min(910, fox.x + fox.speed);

  frutas.forEach((f, idx) => {
    f.y += f.speedY;

    // Caja de colisión optimizada con la parte superior de la canasta
    if (f.x < fox.x + fox.w && f.x + f.w > fox.x &&
        f.y + f.h >= fox.y && f.y <= fox.y + 25) {
      
      recolectado[f.tipo]++;
      frutas.splice(idx, 1);
      validarEstadoObjetivo();
    }

    if (f.y > canvas.height) frutas.splice(idx, 1);
  });
}

function validarEstadoObjetivo() {
  const target = preguntas[currentQ].target;
  
  if (recolectado.manzana === target.manzana && 
      recolectado.zanahoria === target.zanahoria && 
      recolectado.baya === target.baya) {
    
    aciertos++;
    feedbackMsg = "¡Frecuencias perfectas! Diagrama completado 📊✨";
    feedbackOk = true;
    feedbackTimer = 90;
    setTimeout(siguientePregunta, 1300);
  } else if (recolectado.manzana > target.manzana || 
             recolectado.zanahoria > target.zanahoria || 
             recolectado.baya > target.baya) {
    
    feedbackMsg = "¡Oh no! Te excediste en la frecuencia. ¡Limpia la canasta! 🧺";
    feedbackOk = false;
    feedbackTimer = 90;
    setTimeout(() => {
      recolectado = { manzana: 0, zanahoria: 0, baya: 0 };
    }, 1200);
  }
}

function siguientePregunta() {
  currentQ++;
  recolectado = { manzana: 0, zanahoria: 0, baya: 0 };
  frutas = [];
  feedbackTimer = 0;

  if (currentQ >= preguntas.length) {
    juegoTerminado = true;
    clearInterval(intervalFrutas);
    const puntaje = (aciertos / preguntas.length) * 100;

    fetch("/guardar_progreso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grado: 4, unidad: 6, aciertos, total: preguntas.length, puntaje })
    })
    .then(r => r.json()).then(d => console.log("✅ Estadística guardada:", d));
  }
}

// ─── CAPA DE RENDERIZADO GRÁFICO ─────────────────────────────────────────────
function drawFondo() {
  ctx.fillStyle = "#1e3a1e"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(400, 0); ctx.lineTo(400, canvas.height); ctx.stroke();
  
  ctx.fillStyle = "#2d5a27"; ctx.fillRect(400, 550, 600, 50);
}

function drawPanelesEstadisticos() {
  // 📊 TABLA DE FRECUENCIAS
  ctx.fillStyle = "#112611"; ctx.strokeStyle = "#2ecc71"; ctx.lineWidth = 3;
  roundRect(ctx, 20, 125, 360, 230, 10); ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#2ecc71"; ctx.font = "bold 13px Minecraftia"; ctx.textAlign = "left";
  ctx.fillText("FRUTA", 40, 155); ctx.fillText("OBJETIVO", 240, 155);
  ctx.strokeStyle = "rgba(46, 204, 113, 0.4)"; ctx.beginPath(); ctx.moveTo(30, 170); ctx.lineTo(370, 170); ctx.stroke();

  const target = preguntas[currentQ].target;
  ctx.fillStyle = "#ffffff"; ctx.font = "14px Minecraftia";
  ctx.fillText("🍎 Manzanas", 40, 210);  ctx.fillText(`${target.manzana} u`, 270, 210);
  ctx.fillText("🥕 Zanahorias", 40, 255); ctx.fillText(`${target.zanahoria} u`, 270, 255);
  ctx.fillText("🍇 Bayas", 40, 305);      ctx.fillText(`${target.baya} u`, 270, 305);

  // 📊 DIAGRAMA DE BARRAS (Ajustado en altura: Y de 375 a 555)
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3;
  roundRect(ctx, 20, 375, 360, 180, 10); ctx.fillStyle = "#112611"; ctx.fill(); ctx.stroke();
  
  ctx.strokeStyle = "#bdc3c7"; ctx.beginPath(); ctx.moveTo(60, 395); ctx.lineTo(60, 515); ctx.lineTo(350, 515); ctx.stroke();
  
  const categorias = [
    { total: recolectado.manzana, color: "#e74c3c", posX: 90 },
    { total: recolectado.zanahoria, color: "#e67e22", posX: 180 },
    { total: recolectado.baya, color: "#9b59b6", posX: 270 }
  ];

  categorias.forEach(cat => {
    let alturaBarra = cat.total * 16; // Cada unidad son 16px de altura
    ctx.fillStyle = cat.color;
    ctx.fillRect(cat.posX, 515 - alturaBarra, 45, alturaBarra);
    
    if (cat.total > 0) {
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 12px Minecraftia"; ctx.textAlign = "center";
      ctx.fillText(cat.total, cat.posX + 22, 505 - alturaBarra);
    }
  });
  
  ctx.fillStyle = "#ffffff"; ctx.font = "12px Arial"; ctx.textAlign = "center";
  ctx.fillText("🍎", 112, 535); ctx.fillText("🥕", 202, 535); ctx.fillText("🍇", 292, 535);
}

function drawZorro() {
  ctx.save();
  ctx.translate(fox.x, fox.y);
  
  ctx.fillStyle = "#e66000"; ctx.fillRect(0, 20, fox.w, fox.h - 20); 
  ctx.fillStyle = "#ffffff"; ctx.fillRect(18, 40, fox.w - 36, 25); 
  
  ctx.fillStyle = "#e66000"; ctx.fillRect(15, -5, 50, 30);
  ctx.fillStyle = "#000"; ctx.fillRect(25, 5, 5, 5); ctx.fillRect(50, 5, 5, 5); 
  
  // Canasta grande y vistosa para atrapar con comodidad
  ctx.fillStyle = "#d35400"; ctx.strokeStyle = "#ba4a00"; ctx.lineWidth = 3;
  roundRect(ctx, -10, -5, fox.w + 20, 18, 5); ctx.fill(); ctx.stroke();
  
  ctx.restore();
}

function drawFrutas() {
  frutas.forEach(f => {
    ctx.font = "32px Arial"; // Frutas mucho más grandes y visibles
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText(f.icono, f.x + f.w/2, f.y);
  });
}

function drawHUD() {
  ctx.fillStyle = "rgba(17, 38, 17, 0.95)"; ctx.strokeStyle = "#2ecc71"; ctx.lineWidth = 4;
  roundRect(ctx, 100, 20, canvas.width - 200, 80, 15); ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#ffffff"; ctx.font = "bold 15px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText(preguntas[currentQ].consigna, canvas.width / 2, 66);

  // TEXTOS CORREGIDOS Y SEPARADOS DE LAS CAJAS
  ctx.fillStyle = "#a2b9a2"; ctx.font = "14px Minecraftia"; ctx.textAlign = "left";
  ctx.fillText("📊 RETOMATE | Huerto de Campo G4", 40, 580);

  // El indicador de nivel se desplaza a la derecha con espacio libre
  ctx.textAlign = "right";
  ctx.fillText(`Desafío: ${currentQ + 1} / ${preguntas.length}`, canvas.width - 40, 580);
}

function drawFeedback() {
  if (feedbackTimer <= 0) return;
  ctx.fillStyle = "rgba(10, 20, 10, 0.93)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = feedbackOk ? "#00ffcc" : "#ff4757";
  ctx.font = "bold 22px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText(feedbackMsg, canvas.width / 2, canvas.height / 2);
}

function drawPausa() {
  ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const bx = canvas.width / 2 - 125, by = 270;
  ctx.fillStyle = "#112611"; ctx.strokeStyle = "#2ecc71"; ctx.lineWidth = 3;
  roundRect(ctx, bx, by, 250, 60, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#2ecc71"; ctx.font = "18px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("▶ Continuar", canvas.width / 2, by + 38);
}

function drawFinal() {
  ctx.fillStyle = "#0d1f0d"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#00ffcc"; ctx.font = "bold 32px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("¡HUERTO ESTADÍSTICO COMPLETADO!", canvas.width / 2, canvas.height / 2 - 50);
  ctx.fillStyle = "#fff"; ctx.font = "20px Minecraftia";
  ctx.fillText("¡Dominas las tablas de frecuencia y las modas a la perfección!", canvas.width / 2, canvas.height / 2 + 10);
  
  const bx = canvas.width / 2 - 125, by = 400;
  ctx.fillStyle = "#2ecc71"; roundRect(ctx, bx, by, 250, 54, 10); ctx.fill();
  ctx.fillStyle = "#000"; ctx.font = "bold 16px Minecraftia";
  ctx.fillText("🔄 Sembrar de Nuevo", canvas.width / 2, by + 34);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x+r, y); c.lineTo(x+w-r, y); c.quadraticCurveTo(x+w, y, x+w, y+r);
  c.lineTo(x+w, y+h-r); c.quadraticCurveTo(x+w, y+h, x+w-r, y+h); c.lineTo(x+r, y+h);
  c.quadraticCurveTo(x, y+h, x, y+h-r); c.lineTo(x, y+r); c.quadraticCurveTo(x, y, x+r, y);
  c.closePath();
}

function resetGame() { 
  aciertos = 0; currentQ = 0; juegoTerminado = false; pausado = false; 
  recolectado = { manzana: 0, zanahoria: 0, baya: 0 }; frutas = [];
  clearInterval(intervalFrutas); intervalFrutas = setInterval(spawnFruta, 1400);
}

// ─── LOOP PRINCIPAL DEL JUEGO ──────────────────────────────────────────────────
function gameLoop() {
  tiempo++;
  if (feedbackTimer > 0) feedbackTimer--;

  if (!pausado && !juegoTerminado) {
    update();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFondo();
    drawPanelesEstadisticos();
    drawFrutas();
    drawZorro();
    drawHUD();
    drawFeedback();
  } else if (pausado && !juegoTerminado) {
    drawPausa();
  } else {
    drawFinal();
  }

  requestAnimationFrame(gameLoop);
}

window.onload = () => { gameLoop(); };