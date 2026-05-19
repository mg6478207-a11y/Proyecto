// 🎮 RETOMATE - Grado 4 | Unidad 1: Múltiplos y Divisores
// 🍬 "La Máquina de Dulces del Zorro"
// El zorro pastelero explota burbujas de caramelos que caen del techo.
// Controles: ← → mover | ↑ pinchar burbuja hacia arriba | P pausar | Clic en pantalla

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
let pincho         = null; // Proyectil vertical
let caramelos      = [];   // Objetivos que caen

// ─── SONIDOS ──────────────────────────────────────────────────────────────────
const sonidoLanzar   = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");
const sonidoCorrecto = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const sonidoError    = new Audio("https://actions.google.com/sounds/v1/cartoon/mechanical_clunk.ogg");
const musicaFondo    = new Audio(""); // Aquí puedes pegar tu link de OpenGameArt preferido
musicaFondo.loop = true; musicaFondo.volume = 0.15;

// ─── BANCO DE 10 PREGUNTAS (MÚLTIPLOS Y DIVISORES - GRADO 4) ──────────────────
const preguntas = [
  { tipo: "múltiplo", base: 4, enunciado: "Encuentra un MÚLTIPLO de 4", opciones: ["14", "16", "18"], respuesta: "16" },
  { tipo: "divisor",  base: 12, enunciado: "Encuentra un DIVISOR de 12", opciones: ["5", "8", "4"], respuesta: "4" },
  { tipo: "múltiplo", base: 6, enunciado: "Encuentra un MÚLTIPLO de 6", opciones: ["24", "16", "20"], respuesta: "24" },
  { tipo: "divisor",  base: 15, enunciado: "Encuentra un DIVISOR de 15", opciones: ["2", "5", "4"], respuesta: "5" },
  { tipo: "múltiplo", base: 7, enunciado: "Encuentra un MÚLTIPLO de 7", opciones: ["17", "21", "25"], respuesta: "21" },
  { tipo: "divisor",  base: 20, enunciado: "Encuentra un DIVISOR de 20", opciones: ["6", "3", "10"], respuesta: "10" },
  { tipo: "múltiplo", base: 9, enunciado: "Encuentra un MÚLTIPLO de 9", opciones: ["18", "23", "29"], respuesta: "18" },
  { tipo: "divisor",  base: 18, enunciado: "Encuentra un DIVISOR de 18", opciones: ["4", "6", "8"], respuesta: "6" },
  { tipo: "múltiplo", base: 5, enunciado: "Encuentra un MÚLTIPLO de 5", opciones: ["33", "35", "38"], respuesta: "35" },
  { tipo: "divisor",  base: 30, enunciado: "Encuentra un DIVISOR de 30", opciones: ["7", "15", "9"], respuesta: "15" }
];

// ─── CONFIGURACIÓN DEL PERSONAJE (ZORRO PASTELERO) ────────────────────────────
const fox = {
  x: 450,
  y: 475,
  w: 65,
  h: 65,
  speed: 8.5,
  dir: 1,
  animFrame: 0
};

function generarCaramelos() {
  caramelos = [];
  const q = preguntas[currentQ];
  const espaciado = 260;
  const inicioX = (canvas.width - (q.opciones.length * espaciado - 80)) / 2;

  q.opciones.forEach((op, index) => {
    caramelos.push({
      x: inicioX + index * espaciado,
      y: -60 - (index * 40), // Caída escalonada para dar tiempo de reacción visual
      r: 45, // Radio de la burbuja redonda de dulce
      texto: op,
      correcta: op === q.respuesta,
      vy: 1.5 + Math.random() * 0.8, // Velocidad suave apta para niños de cuarto
      color: ["#ff7675", "#fdcb6e", "#00cec9"][index], // Colores pasteles muy vivos
      hit: false
    });
  });
}

function crearParticulas(x, y, color, cantidad = 20) {
  for (let i = 0; i < cantidad; i++) {
    particulas.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 25 + Math.random() * 10, maxLife: 35,
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
    pausado ? musicaFondo.pause() : (musicaFondo.src && musicaFondo.play());
  }
  // DISPARAR HACIA ARRIBA CON FLECHA ARRIBA
  if (e.key === "ArrowUp" && !pincho && feedbackTimer <= 0 && !juegoTerminado && !pausado) {
    pincho = { x: fox.x + fox.w / 2, y: fox.y, vy: -11 };
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

  // Movimiento horizontal del Zorro
  let moviendo = false;
  if (keys["ArrowLeft"]) { fox.x -= fox.speed; fox.dir = -1; moviendo = true; }
  if (keys["ArrowRight"]) { fox.x += fox.speed; fox.dir = 1; moviendo = true; }
  fox.x = Math.max(0, Math.min(fox.x, canvas.width - fox.w));
  if (moviendo && tiempo % 6 === 0) fox.animFrame = (fox.animFrame + 1) % 4;

  // Actualizar movimiento de los dulces caídos
  caramelos.forEach(c => {
    if (!c.hit) {
      c.y += c.vy;
      
      // Si un dulce toca el suelo, vuelve a aparecer arriba para evitar que el juego se tranque
      if (c.y > 510) {
        c.y = -50;
      }
    }
  });

  // Movimiento del Pincho/Proyectil
  if (pincho) {
    pincho.y += pincho.vy;

    // Chispitas mágicas de azúcar flotando detrás del proyectil
    if (tiempo % 2 === 0) {
      particulas.push({
        x: pincho.x, y: pincho.y,
        vx: (Math.random() - 0.5) * 2, vy: 1,
        life: 12, maxLife: 12,
        color: "#fff", r: 1.5
      });
    }

    // Colisión pincho con caramelos redondos
    caramelos.forEach(c => {
      if (!pincho || colisionLock || c.hit) return;

      let dx = pincho.x - c.x;
      let dy = pincho.y - c.y;
      let distancia = Math.sqrt(dx * dx + dy * dy);

      if (distancia < c.r + 5) {
        colisionLock = true;
        c.hit = true;

        crearParticulas(c.x, c.y, c.color, 30);
        crearParticulas(c.x, c.y, "#ffffff", 15);

        if (c.correcta) {
          aciertos++;
          feedbackMsg = "¡Delicioso! ¡Es correcto! 🍬✨";
          feedbackOk = true;
          if (sonidoCorrecto) { sonidoCorrecto.currentTime = 0; sonidoCorrecto.play(); }
        } else {
          feedbackMsg = `¡Oh no! Sabías que la respuesta era ${preguntas[currentQ].respuesta} 🦊`;
          feedbackOk = false;
          if (sonidoError) { sonidoError.currentTime = 0; sonidoError.play(); }
        }

        feedbackTimer = 90;
        pincho = null;

        setTimeout(() => {
          siguientePregunta();
        }, 1100);
      }
    });

    if (pincho && pincho.y < -20) pincho = null;
  }

  // Partículas
  particulas.forEach((p, idx) => {
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.life <= 0) particulas.splice(idx, 1);
  });
}

// ─── PERSISTENCIA Y AVANCE DE NIVEL (GRADO 4 UNIDAD 1) ───────────────────────
function siguientePregunta() {
  currentQ++;
  pincho = null;
  colisionLock = false;
  feedbackTimer = 0;

  if (currentQ >= preguntas.length) {
    juegoTerminado = true;
    estrellasFinal = [];
    for (let i = 0; i < 150; i++) {
      estrellasFinal.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        vy: 1.5 + Math.random() * 2,
        r: 2 + Math.random() * 4,
        color: ["#ff7675", "#fdcb6e", "#00cec9", "#e84393", "#ffffcc"][Math.floor(Math.random() * 5)]
      });
    }
    const puntaje = (aciertos / preguntas.length) * 100;

    // Conexión limpia con tu sistema Flask guardando Grado 4, Unidad 1
    fetch("/guardar_progreso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grado: 4, unidad: 1, aciertos, total: preguntas.length, puntaje })
    })
    .then(r => r.json())
    .then(d => console.log("✅ Progreso de Grado 4 Guardado con éxito:", d))
    .catch(e => console.error("❌ Error salvando datos G4U1:", e));
  } else {
    generarCaramelos();
  }
}

// ─── GRÁFICOS Y CANVAS ────────────────────────────────────────────────────────
function drawFondo() {
  // Fábrica de golosinas colorida
  let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#ffeaa7"); grad.addColorStop(1, "#fab1a0");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Rayas de caramelo de fondo sutiles
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  for (let i = 0; i < canvas.width; i += 120) {
    ctx.beginPath();
    ctx.moveTo(i, 0); ctx.lineTo(i + 60, 0);
    ctx.lineTo(i + 180, canvas.height); ctx.lineTo(i + 120, canvas.height);
    ctx.closePath(); ctx.fill();
  }

  // Piso de la cocina/fábrica pastelería
  ctx.fillStyle = "#e17055"; ctx.fillRect(0, 540, canvas.width, 60);
  ctx.fillStyle = "#d63031"; ctx.fillRect(0, 540, canvas.width, 8);
}

function drawCaramelos() {
  caramelos.forEach(c => {
    if (c.hit) return;
    ctx.save();
    ctx.translate(c.x, c.y);

    // Efecto de brillo de burbuja
    ctx.shadowBlur = 15; ctx.shadowColor = c.color;

    // Cuerpo principal de la bola de caramelo
    ctx.fillStyle = c.color; ctx.beginPath();
    ctx.arc(0, 0, c.r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Envoltura lateral estilo dulce de fiesta
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.moveTo(-c.r, 0); ctx.lineTo(-c.r - 15, -12); ctx.lineTo(-c.r - 15, 12); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(c.r, 0); ctx.lineTo(c.r + 15, -12); ctx.lineTo(c.r + 15, 12); ctx.closePath(); ctx.fill();

    // Reflejo blanco brillante superior
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath(); ctx.arc(-12, -12, 10, 0, Math.PI * 2); ctx.fill();

    // Número del caramelo
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 3;
    ctx.font = "bold 28px Minecraftia"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.strokeText(c.texto, 0, 2); ctx.fillText(c.texto, 0, 2);

    ctx.restore();
  });
}

function drawPincho() {
  if (!pincho) return;
  ctx.fillStyle = "#2d3436"; // Varilla o pincho metálico para romper los dulces
  ctx.fillRect(pincho.x - 3, pincho.y, 6, 25);
  ctx.fillStyle = "#0984e3"; // Punta afilada azul de energía
  ctx.beginPath();
  ctx.moveTo(pincho.x - 6, pincho.y); ctx.lineTo(pincho.x, pincho.y - 14); ctx.lineTo(pincho.x + 6, pincho.y);
  ctx.closePath(); ctx.fill();
}

function drawFox() {
  ctx.save();
  let reboteY = (fox.animFrame % 2 === 0 && (keys["ArrowLeft"] || keys["ArrowRight"])) ? 3 : 0;
  ctx.translate(fox.x + fox.w / 2, fox.y + fox.h / 2 + reboteY);
  if (fox.dir === -1) ctx.scale(-1, 1);

  // Cola juguetona
  ctx.fillStyle = "#e66000"; ctx.fillRect(-32, 10, 16, 14);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(-38, 12, 6, 10);

  // Cuerpo con Delantal de Pastelero/Chef
  ctx.fillStyle = "#e66000"; ctx.fillRect(-18, -10, 36, 35); // Pelo base
  ctx.fillStyle = "#ffffff"; ctx.fillRect(-12, -2, 24, 27);  // Delantal blanco limpio
  ctx.fillStyle = "#d63031"; ctx.fillRect(-12, -2, 24, 4);   // Listón rojo del delantal

  // Cabeza y Orejas
  ctx.fillStyle = "#e66000"; ctx.fillRect(-15, -36, 30, 26);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(-13, -18, 7, 8); ctx.fillRect(6, -18, 7, 8); // Mejillas
  ctx.fillStyle = "#2d3436"; ctx.fillRect(-2, -14, 4, 4); // Nariz
  
  // Ojos despiertos
  ctx.fillStyle = "#2d3436"; ctx.fillRect(-8, -25, 4, 6); ctx.fillRect(4, -25, 4, 6);

  // 🧑‍🍳 Sombrero Alto de Chef Pastelero
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-14, -46, 28, 10); // Base del gorro
  ctx.beginPath(); ctx.arc(-7, -49, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -49, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -53, 11, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function drawHUD() {
  // Letrero de la orden de dulces
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)"; ctx.strokeStyle = "#e17055"; ctx.lineWidth = 4;
  roundRect(ctx, 60, 20, canvas.width - 120, 75, 15); ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#2d3436"; ctx.font = "bold 22px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText(preguntas[currentQ].enunciado, canvas.width / 2, 62);

  // Panel inferior
  ctx.fillStyle = "#ffffff"; ctx.font = "16px Minecraftia"; ctx.textAlign = "left";
  ctx.fillText(`Dulces Empacados: ${aciertos} / ${preguntas.length}`, 40, 575);
}

function drawFeedback() {
  if (feedbackTimer <= 0) return;
  ctx.fillStyle = "rgba(255, 250, 240, 0.9)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = feedbackOk ? "#00b894" : "#d63031";
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
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const bx = canvas.width / 2 - 125, by = canvas.height / 2 - 30;
  ctx.fillStyle = "#fff"; ctx.strokeStyle = "#e17055"; ctx.lineWidth = 3;
  roundRect(ctx, bx, by, 250, 60, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#e17055"; ctx.font = "20px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("▶ Continuar", canvas.width / 2, by + 38);
}

function drawFinal() {
  ctx.fillStyle = "rgba(255, 250, 242, 0.98)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  estrellasFinal.forEach(e => {
    e.y += e.vy; if (e.y > canvas.height) e.y = -10;
    ctx.fillStyle = e.color; ctx.fillRect(e.x, e.y, e.r, e.r);
  });

  ctx.fillStyle = "#e17055"; ctx.font = "bold 36px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("¡FÁBRICA COMPLETADA!", canvas.width / 2, canvas.height / 2 - 80);
  
  ctx.fillStyle = "#2d3436"; ctx.font = "20px Minecraftia";
  ctx.fillText(`Puntaje de Repostería: ${Math.round((aciertos / preguntas.length) * 100)}%`, canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillText(`Caramelos Correctos: ${aciertos} de ${preguntas.length}`, canvas.width / 2, canvas.height / 2 + 35);

  const bx = canvas.width / 2 - 125, by = 380;
  ctx.fillStyle = "#6c5ce7"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3;
  roundRect(ctx, bx, by, 250, 54, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ffffff"; ctx.font = "18px Minecraftia";
  ctx.fillText("🔄 Jugar otra vez", canvas.width / 2, by + 34);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x+r, y); c.lineTo(x+w-r, y); c.quadraticCurveTo(x+w, y, x+w, y+r);
  c.lineTo(x+w, y+h-r); c.quadraticCurveTo(x+w, y+h, x+w-r, y+h); c.lineTo(x+r, y+h);
  c.quadraticCurveTo(x, y+h, x, y+h-r); c.lineTo(x, y+r); c.quadraticCurveTo(x, y, x+r, y);
  c.closePath();
}

function resetGame() {
  aciertos = 0; currentQ = 0; juegoTerminado = false; pausado = false;
  colisionLock = false; feedbackTimer = 0; pincho = null;
  generarCaramelos();
}

// ─── LOOP ────────────────────────────────────────────────────────────────────
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFondo();
  if (!juegoTerminado) {
    drawCaramelos();
    drawPincho();
    drawFox();
    drawHUD();
    drawFeedback();
  }
  drawParticulas();
  if (pausado && !juegoTerminado) drawPausa();
  if (juegoTerminado) drawFinal();
}

generarCaramelos();
window.onload = () => { gameLoop(); };