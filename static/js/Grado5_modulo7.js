// 🎮 RETOMATE - Grado 5 | Unidad 7: Álgebra (Patrones y Ecuaciones)
// 🏛️ "El Templo de los Patrones Místicos"
// El zorro arqueólogo explora ruinas antiguas y activa tótems flotantes de energía.
// Controles: ← → mover zorro | ↑ lanzar antorcha mágica | P pausar | Clic en pantalla

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
let antorcha       = null;
let totems         = [];
let antorchasFondo = []; // Decoración animada del mapa

// ─── SONIDOS ──────────────────────────────────────────────────────────────────
const sonidoLanzar   = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");
const sonidoCorrecto = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const sonidoError    = new Audio("https://actions.google.com/sounds/v1/cartoon/mechanical_clunk.ogg");
const musicaFondo    = new Audio("/static/sounds/fondo.mp3");
musicaFondo.loop = true; musicaFondo.volume = 0.2;

// ─── BANCO DE 10 PREGUNTAS (ÁLGEBRA GRADO 5) ──────────────────────────────────
const preguntas = [
  { enunciado: "Completa el patrón: 4, 9, 14, 19, __", opciones: ["22", "24", "24"], respuesta: "24" }, // Suma 5
  { enunciado: "Si x + 12 = 35, ¿cuánto vale x?", opciones: ["23", "25", "18"], respuesta: "23" },
  { enunciado: "Completa el patrón: 3, 6, 12, 24, __", opciones: ["36", "48", "30"], respuesta: "48" }, // Multiplica 2
  { enunciado: "Si 5 × y = 45, ¿cuánto vale y?", opciones: ["8", "7", "9"], respuesta: "9" },
  { enunciado: "Completa el patrón: 80, 72, 64, 56, __", opciones: ["48", "50", "46"], respuesta: "48" }, // Resta 8
  { enunciado: "Si z - 18 = 22, ¿cuánto vale z?", opciones: ["40", "34", "42"], respuesta: "40" },
  { enunciado: "Encuentra el número que falta: 2, 5, 11, 23, __", opciones: ["35", "47", "41"], respuesta: "47" }, // x2 + 1
  { enunciado: "Si 4 × m + 6 = 30, ¿cuánto vale m?", opciones: ["5", "6", "7"], respuesta: "6" },
  { enunciado: "Completa la secuencia: 1, 4, 9, 16, __", opciones: ["20", "25", "30"], respuesta: "25" }, // Cuadrados
  { enunciado: "Si el triple de un número es 36, ¿cuál es el número?", opciones: ["12", "14", "13"], respuesta: "12" }
];

// ─── CONFIGURACIÓN DE ELEMENTOS DE DISEÑO ─────────────────────────────────────
const fox = {
  x: 150,
  y: 475,
  w: 60,
  h: 65,
  speed: 8,
  dir: 1,
  animFrame: 0
};

// Antorchas decorativas fijas en las paredes del templo
for (let i = 100; i < canvas.width; i += 250) {
  antorchasFondo.push({ x: i, y: 220 });
}

function generarTotems() {
  totems = [];
  const q = preguntas[currentQ];
  const espaciado = 280;
  const inicioX = (canvas.width - (q.opciones.length * espaciado - 80)) / 2;

  q.opciones.forEach((op, index) => {
    totems.push({
      x: inicioX + index * espaciado,
      y: 130,
      w: 180,
      h: 110,
      texto: op,
      correcta: op === q.respuesta,
      hit: false,
      hitTimer: 0,
      offsetFlote: Math.random() * 100 // Variación individual de levitación
    });
  });
}

function crearParticulas(x, y, color, cantidad = 20) {
  for (let i = 0; i < cantidad; i++) {
    particulas.push({
      x, y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5 - 1,
      life: 30 + Math.random() * 15,
      maxLife: 45,
      color: color,
      r: 2 + Math.random() * 3
    });
  }
}

// ─── CONTROLES ────────────────────────────────────────────────────────────────
const keys = {};
window.addEventListener("keydown", e => {
  keys[e.key] = true;
  if ((e.key === "p" || e.key === "P") && !juegoTerminado) {
    pausado = !pausado;
    pausado ? musicaFondo.pause() : musicaFondo.play();
  }
  if (e.key === "ArrowUp" && !antorcha && feedbackTimer <= 0 && !juegoTerminado && !pausado) {
    antorcha = { x: fox.x + fox.w / 2, y: fox.y, vx: 0, vy: -10, rot: 0 };
    sonidoLanzar.currentTime = 0; sonidoLanzar.play();
  }
});
window.addEventListener("keyup", e => { keys[e.key] = false; });

// Interactividad con mouse/touch idéntica a tus módulos anteriores
canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (pausado && !juegoTerminado) {
    // Botón Continuar en pausa
    if (mx >= canvas.width / 2 - 125 && mx <= canvas.width / 2 + 125 && my >= canvas.height / 2 && my <= canvas.height / 2 + 60) {
      pausado = false;
      musicaFondo.play();
    }
  }
  if (juegoTerminado) {
    // Botón reiniciar al finalizar
    const bx = canvas.width / 2 - 125;
    const by = 380;
    if (mx >= bx && mx <= bx + 250 && my >= by && my <= by + 54) resetGame();
  }
});

// ─── LOGICA DEL JUEGO ──────────────────────────────────────────────────────────
function update() {
  if (pausado || juegoTerminado) return;
  tiempo++;

  if (feedbackTimer > 0) {
    feedbackTimer--;
  }

  // Chispas flotando del templo de fondo
  if (tiempo % 4 === 0) {
    antorchasFondo.forEach(a => {
      particulas.push({
        x: a.x + 4, y: a.y - 10,
        vx: (Math.random() - 0.5) * 1.5, vy: -1 - Math.random() * 1.5,
        life: 25, maxLife: 25,
        color: ["#ff5500", "#ffaa00", "#ffcc00"][Math.floor(Math.random() * 3)],
        r: 1.5 + Math.random() * 2
      });
    });
  }

  // Movimiento del Zorro Explorador
  let moviendo = false;
  if (keys["ArrowLeft"]) { fox.x -= fox.speed; fox.dir = -1; moviendo = true; }
  if (keys["ArrowRight"]) { fox.x += fox.speed; fox.dir = 1; moviendo = true; }
  
  // Libertad de caminar de lado a lado por debajo de los tótems
  fox.x = Math.max(0, Math.min(fox.x, canvas.width - fox.w));
  if (moviendo && tiempo % 5 === 0) fox.animFrame = (fox.animFrame + 1) % 4;

  // Actualizar proyectil (Antorcha Mística)
  if (antorcha) {
    antorcha.y += antorcha.vy;
    antorcha.rot += 0.2;

    // Estela de fuego azul místico en el proyectil
    particulas.push({
      x: antorcha.x, y: antorcha.y + 10,
      vx: (Math.random() - 0.5) * 2, vy: 2,
      life: 15, maxLife: 15,
      color: "#00ffcc", r: 2 + Math.random() * 2
    });

    // Colisiones con Tótems
    totems.forEach(t => {
      if (!antorcha || colisionLock) return;

      const cx = t.x + t.w / 2;
      // Añadir el offset dinámico del flote a la colisión para precisión absoluta
      const cy = (t.y + Math.sin((tiempo + t.offsetFlote) * 0.04) * 12) + t.h / 2;

      if (Math.abs(antorcha.x - cx) < t.w / 2 + 12 && Math.abs(antorcha.y - cy) < t.h / 2 + 12) {
        colisionLock = true;
        t.hit = true;
        t.hitTimer = 30;
        
        crearParticulas(antorcha.x, antorcha.y, "#00ffcc", 30);
        crearParticulas(antorcha.x, antorcha.y, "#ffffff", 15);

        if (t.correcta) {
          aciertos++;
          feedbackMsg = "¡Energía Activada! 🏺💎";
          feedbackOk = true;
          if (sonidoCorrecto) { sonidoCorrecto.currentTime = 0; sonidoCorrecto.play(); }
        } else {
          feedbackMsg = `¡Glifo Erróneo! La respuesta era ${preguntas[currentQ].respuesta} 🏛️`;
          feedbackOk = false;
          if (sonidoError) { sonidoError.currentTime = 0; sonidoError.play(); }
        }

        feedbackTimer = 90;
        antorcha = null; // Destrucción controlada al final

        setTimeout(() => {
          siguientePregunta();
        }, 1100);
      }
    });

    if (antorcha && antorcha.y < -30) antorcha = null;
  }

  // Actualizar Partículas de explosiones
  particulas.forEach((p, idx) => {
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.life <= 0) particulas.splice(idx, 1);
  });

  totems.forEach(t => { if (t.hitTimer > 0) t.hitTimer--; });
}

// ─── TRANSICIÓN SEGURA AL SERVIDOR (MÓDULO 7) ─────────────────────────────────
function siguientePregunta() {
  currentQ++;
  antorcha = null;
  colisionLock = false; // Desbloqueo limpio
  feedbackTimer = 0;
  feedbackMsg = "";

  if (currentQ >= preguntas.length) {
    juegoTerminado = true;
    estrellasFinal = [];
    for (let i = 0; i < 180; i++) {
      estrellasFinal.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        vy: 1.2 + Math.random() * 2.5,
        r: 1.5 + Math.random() * 4,
        color: ["#00ffcc", "#ffaa00", "#ffff44", "#ffffff", "#00ffaa"][Math.floor(Math.random() * 5)]
      });
    }
    const puntaje = (aciertos / preguntas.length) * 100;
    
    // Guardado en servidor asignando Grado 5, Unidad 7
    fetch("/guardar_progreso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grado: 5, unidad: 7, aciertos, total: preguntas.length, puntaje })
    })
    .then(r => r.json())
    .then(d => console.log("✅ Progreso de Álgebra Guardado:", d))
    .catch(e => console.error("❌ Error en persistencia U7:", e));
  } else {
    generarTotems();
  }
}

// ─── RENDERIZADO VISUAL COMPLETO (ART CANVAS) ─────────────────────────────────
function drawFondo() {
  // Degradado ambiental del templo ancestral
  let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#1d1926"); grad.addColorStop(1, "#0d0a12");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Columnas y ladrillos antiguos detallados
  ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
  for (let i = 0; i < canvas.width; i += 80) {
    for (let j = 0; j < canvas.height; j += 60) {
      if ((i / 80 + j / 60) % 2 === 0) ctx.fillRect(i, j, 74, 54);
    }
  }

  // Antorchas de decoración en muros
  antorchasFondo.forEach(a => {
    ctx.fillStyle = "#5c443c"; ctx.fillRect(a.x, a.y, 8, 25); // Soporte
    ctx.fillStyle = "#3a2d28"; ctx.fillRect(a.x - 4, a.y - 4, 16, 6);
    // Base de fuego estática dorada
    ctx.fillStyle = "#ffaa00"; ctx.beginPath();
    ctx.arc(a.x + 4, a.y - 6, 6, 0, Math.PI * 2); ctx.fill();
  });

  // Suelo sagrado del templo
  ctx.fillStyle = "#2c2436"; ctx.fillRect(0, 540, canvas.width, 60);
  ctx.fillStyle = "#1e1824"; ctx.fillRect(0, 540, canvas.width, 10);
  ctx.fillStyle = "#00ffcc"; ctx.globalAlpha = 0.1; // Línea de energía mística subterránea
  ctx.fillRect(0, 538, canvas.width, 2); ctx.globalAlpha = 1.0;
}

function drawTotems() {
  totems.forEach(t => {
    ctx.save();
    
    // Cálculo de levitación sinusoidal fluida
    const floteY = Math.sin((tiempo + t.offsetFlote) * 0.04) * 12;
    ctx.translate(t.x, t.y + floteY);

    if (t.hit && t.hitTimer % 4 < 2) ctx.translate((Math.random() - 0.5) * 10, 0);

    // Sombra brillante estilo "Glow" místico
    ctx.shadowBlur = t.hit ? 25 : 12;
    ctx.shadowColor = t.hit ? "#ffaa00" : "#00ffcc";

    // Estructura del Tótem de Piedra Rúnica
    ctx.fillStyle = t.hit ? "#ffbb22" : "#3b3147";
    ctx.strokeStyle = t.hit ? "#ffffff" : "#49d6b9";
    ctx.lineWidth = 4;
    roundRect(ctx, 0, 0, t.w, t.h, 16); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0; // Apagar glow para el texto

    // Glifos interiores de diseño decorativo
    ctx.strokeStyle = "rgba(0, 255, 200, 0.1)";
    ctx.strokeRect(8, 8, t.w - 16, t.h - 16);

    // Texto de la Opción Numérica (Álgebra)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Minecraftia"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(t.texto, t.w / 2, t.h / 2);
    ctx.restore();
  });
}

function drawAntorcha() {
  if (!antorcha) return;
  ctx.save();
  ctx.translate(antorcha.x, antorcha.y);
  ctx.rotate(antorcha.rot);
  
  // Cetro de madera
  ctx.fillStyle = "#7a431d"; ctx.fillRect(-4, 0, 8, 24);
  // Cristal de energía mística (Punta de proyectil)
  ctx.fillStyle = "#00ffcc"; ctx.shadowColor = "#00ffcc"; ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(-8, 0); ctx.lineTo(0, -22); ctx.lineTo(8, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawFox() {
  ctx.save();
  // Animación sutil de respiración o balanceo al correr
  let reboteY = (fox.animFrame % 2 === 0 && keys["ArrowLeft"] || keys["ArrowRight"]) ? 3 : 0;
  ctx.translate(fox.x + fox.w / 2, fox.y + fox.h / 2 + reboteY);
  if (fox.dir === -1) ctx.scale(-1, 1);

  // 🦊 Cola de Zorro Arqueólogo (Se mueve dinámicamente)
  ctx.save();
  ctx.rotate(Math.sin(tiempo * 0.08) * 0.15);
  ctx.fillStyle = "#d45200"; ctx.fillRect(-36, 10, 18, 16);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(-42, 12, 8, 12); // Punta blanca
  ctx.restore();

  // Cuerpo y Ropa de Arqueólogo
  ctx.fillStyle = "#e66000"; ctx.fillRect(-20, -10, 40, 35); // Pelaje naranja
  ctx.fillStyle = "#f5ebd5"; ctx.fillRect(-12, -10, 24, 35); // Camisa explorador beige
  ctx.fillStyle = "#5c4033"; ctx.fillRect(-22, -6, 6, 20); ctx.fillRect(16, -6, 6, 20); // Chaleco café

  // Cabeza y Rostro detallado
  ctx.fillStyle = "#e66000"; ctx.fillRect(-16, -38, 32, 28);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(-14, -20, 8, 10); ctx.fillRect(6, -20, 8, 10); // Mejillas
  ctx.fillStyle = "#111111"; ctx.fillRect(-3, -15, 6, 5); // Nariz
  
  // Ojos (Animación de pestañeo aleatorio)
  if (tiempo % 140 > 6) {
    ctx.fillStyle = "#333333"; ctx.fillRect(-10, -27, 5, 6); ctx.fillRect(5, -27, 5, 6);
  }

  // Sombrero Federal de Explorador Arqueológico
  ctx.fillStyle = "#7a4e2b"; ctx.fillRect(-26, -42, 52, 6); // Ala ancha
  ctx.fillRect(-16, -56, 32, 14); // Copa alta
  ctx.fillStyle = "#222222"; ctx.fillRect(-16, -45, 32, 3); // Cinta decorativa oscura

  ctx.restore();
}

function drawHUD() {
  // Panel Superior del Enunciado de Álgebra
  ctx.fillStyle = "rgba(18, 14, 26, 0.85)";
  ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 2;
  roundRect(ctx, 50, 20, canvas.width - 100, 80, 16); ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#ffffff"; ctx.font = "20px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText(preguntas[currentQ].enunciado, canvas.width / 2, 66);

  // Contador de Preguntas en las esquinas inferiores
  ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "16px Minecraftia"; ctx.textAlign = "left";
  ctx.fillText(`Glifos Resueltos: ${aciertos} / ${preguntas.length}`, 40, 575);
}

function drawFeedback() {
  if (feedbackTimer <= 0) return;
  ctx.fillStyle = "rgba(8, 5, 12, 0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = feedbackOk ? "#00ffcc" : "#ff4444";
  ctx.font = "bold 28px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText(feedbackMsg, canvas.width / 2, canvas.height / 2);
}

function drawParticulas() {
  particulas.forEach(p => {
    ctx.fillStyle = p.color; ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * (p.life / p.maxLife), 0, Math.PI * 2); ctx.fill();
  });
}

function drawPausa() {
  ctx.fillStyle = "rgba(10, 7, 15, 0.75)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Cuadro de pausa estilizado
  const bx = canvas.width / 2 - 125, by = canvas.height / 2 - 30;
  ctx.fillStyle = "#3b3147"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3;
  roundRect(ctx, bx, by, 250, 60, 14); ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#ffffff"; ctx.font = "22px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("▶ Continuar", canvas.width / 2, by + 38);
}

function drawFinal() {
  ctx.fillStyle = "rgba(11, 8, 18, 0.95)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Lluvia mágica de estrellas de victoria algebraicas
  estrellasFinal.forEach(e => {
    e.y += e.vy; if (e.y > canvas.height) e.y = -10;
    ctx.fillStyle = e.color; ctx.fillRect(e.x, e.y, e.r, e.r);
  });

  ctx.fillStyle = "#00ffcc"; ctx.font = "bold 38px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("¡TEMPLO DE ÁLGEBRA SUPERADO!", canvas.width / 2, canvas.height / 2 - 80);
  
  ctx.fillStyle = "#ffffff"; ctx.font = "22px Minecraftia";
  ctx.fillText(`Puntaje de Sabiduría: ${Math.round((aciertos / preguntas.length) * 100)}%`, canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillText(`Tótems Correctos: ${aciertos} de ${preguntas.length}`, canvas.width / 2, canvas.height / 2 + 30);

  // Botón Reiniciar Juego
  const bx = canvas.width / 2 - 125, by = 380;
  ctx.fillStyle = "#e66000"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3;
  roundRect(ctx, bx, by, 250, 54, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ffffff"; ctx.font = "20px Minecraftia";
  ctx.fillText("🔄 Repetir Nivel", canvas.width / 2, by + 34);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x+r, y); c.lineTo(x+w-r, y); c.quadraticCurveTo(x+w, y, x+w, y+r);
  c.lineTo(x+w, y+h-r); c.quadraticCurveTo(x+w, y+h, x+w-r, y+h); c.lineTo(x+r, y+h);
  c.quadraticCurveTo(x, y+h, x, y+h-r); c.lineTo(x, y+r); c.quadraticCurveTo(x, y, x+r, y);
  c.closePath();
}

function resetGame() {
  aciertos = 0; currentQ = 0; juegoTerminado = false; pausado = false;
  colisionLock = false; feedbackTimer = 0; antorcha = null;
  generarTotems();
}

// ─── BUCLE PRINCIPAL DE EJECUCIÓN (LOOP) ──────────────────────────────────────
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFondo();
  if (!juegoTerminado) {
    drawTotems();
    drawAntorcha();
    drawFox();
    drawHUD();
    drawFeedback();
  }
  drawParticulas();
  if (pausado && !juegoTerminado) drawPausa();
  if (juegoTerminado) drawFinal();
}

// Carga Inicial del Módulo
generarTotems();
window.onload = () => { gameLoop(); };