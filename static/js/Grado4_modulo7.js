// 🎮 RETOMATE - Grado 4 | Unidad 7: Problemas en 3 Pasos
// 🎒 "La Mochila del Zorro Comerciante"
// Controles: Clic en las burbujas en el orden correcto de los pasos | P pausar

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");
canvas.width  = 1000;
canvas.height = 600;

// ─── ESTADO DEL JUEGO ──────────────────────────────────────────────────────────
let aciertos       = 0;
let currentQ       = 0;
let juegoTerminado = false;
let pausado        = false;
let feedbackTimer  = 0;
let feedbackMsg    = "";
let feedbackOk     = true;
let burbujas       = [];
let pasoActual     = 1; // Controla si va en el paso 1, 2 o 3 del problema actual

// ─── BANCO DE PREGUNTAS (SITUACIONES EN 3 PASOS) ──────────────────────────────
const preguntas = [
  {
    enunciado: "El zorro compra 3 cajas de manzanas a $8 cada una. Paga con un billete de $50. ¿Cuánto recibe de cambio?",
    pasosText: ["1. Calcular costo (3 x 8)", "2. Restar del billete (50 - 24)", "3. Resultado final"],
    burbujasDisponibles: [
      { texto: "3 x 8 = 24", pasoTarget: 1, x: 200, y: 350 },
      { texto: "50 - 24 = 26", pasoTarget: 2, x: 500, y: 380 },
      { texto: "$26 de cambio", pasoTarget: 3, x: 800, y: 360 },
      { texto: "3 + 8 = 11", pasoTarget: 0, x: 350, y: 420 }, // Distractor
      { texto: "50 - 8 = 42", pasoTarget: 0, x: 650, y: 430 }   // Distractor
    ]
  },
  {
    enunciado: "Un tren sale con 100 pasajeros. Suman 25 en la primera parada, bajan 40 en la segunda y suben 15 más. ¿Cuántos quedan?",
    pasosText: ["1. Primera parada (100 + 25)", "2. Segunda parada (125 - 40)", "3. Última subida (85 + 15)"],
    burbujasDisponibles: [
      { texto: "100+25 = 125", pasoTarget: 1, x: 180, y: 360 },
      { texto: "125-40 = 85", pasoTarget: 2, x: 480, y: 410 },
      { texto: "85+15 = 100", pasoTarget: 3, x: 780, y: 370 },
      { texto: "100-40 = 60", pasoTarget: 0, x: 320, y: 440 }, // Distractor
      { texto: "40+15 = 55", pasoTarget: 0, x: 620, y: 350 }   // Distractor
    ]
  },
  {
    enunciado: "Tienes 4 bolsas con 10 caramelos cada una. Te comes 12 caramelos y luego tu amigo te regala 5 más. ¿Cuántos tienes?",
    pasosText: ["1. Total inicial (4 x 10)", "2. Restar lo que comes (40 - 12)", "3. Sumar regalo (28 + 5)"],
    burbujasDisponibles: [
      { texto: "4 x 10 = 40", pasoTarget: 1, x: 250, y: 360 },
      { texto: "40 - 12 = 28", pasoTarget: 2, x: 520, y: 350 },
      { texto: "28 + 5 = 33", pasoTarget: 3, x: 750, y: 420 },
      { texto: "4 + 10 = 14", pasoTarget: 0, x: 380, y: 430 }, // Distractor
      { texto: "12 + 5 = 17", pasoTarget: 0, x: 630, y: 370 }   // Distractor
    ]
  }
];

// Cargar burbujas del problema actual con físicas de balanceo sutil
function cargarBurbujas() {
  burbujas = JSON.parse(JSON.stringify(preguntas[currentQ].burbujasDisponibles));
  burbujas.forEach(b => {
    b.radio = 65;
    b.baseY = b.y;
    b.offset = Math.random() * 100; // Fase de flotación aleatoria
    b.explotada = false;
  });
}

// ─── CONTROL DE EVENTOS (INTERACCIÓN POR CLIC) ────────────────────────────────
canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (pausado && !juegoTerminado) {
    if (mx >= canvas.width/2 - 125 && mx <= canvas.width/2 + 125 && my >= 270 && my <= 330) pausado = false;
    return;
  }
  if (juegoTerminado) {
    if (mx >= canvas.width/2 - 125 && mx <= canvas.width/2 + 125 && my >= 420 && my <= 474) resetGame();
    return;
  }

  if (feedbackTimer > 0) return;

  // Evaluar clics sobre burbujas activas
  burbujas.forEach(b => {
    if (b.explotada) return;

    let dist = Math.hypot(mx - b.x, my - b.y);
    if (dist <= b.radio) {
      if (b.pasoTarget === pasoActual) {
        // ¡Paso correcto seleccionado!
        b.explotada = true;
        pasoActual++;

        if (pasoActual > 3) {
          // Completó los 3 pasos del problema con éxito
          aciertos++;
          feedbackMsg = "¡Problema resuelto con lógica impecable! 🎒✨";
          feedbackOk = true;
          feedbackTimer = 90;
          setTimeout(siguientePregunta, 1300);
        }
      } else {
        // Error: No corresponde al orden del paso actual o es distractor
        feedbackMsg = "¡Paso incorrecto! Analiza qué debes calcular primero 🤔";
        feedbackOk = false;
        feedbackTimer = 75;
      }
    }
  });
});

window.addEventListener("keydown", e => {
  if ((e.key === "p" || e.key === "P") && !juegoTerminado) {
    pausado = !pausado;
  }
});

function siguientePregunta() {
  currentQ++;
  pasoActual = 1;
  feedbackTimer = 0;

  if (currentQ < preguntas.length) {
    cargarBurbujas();
  } else {
    juegoTerminado = true;
    const puntaje = (aciertos / preguntas.length) * 100;

    fetch("/guardar_progreso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grado: 4, unidad: 7, aciertos, total: preguntas.length, puntaje })
    })
    .then(r => r.json()).then(d => console.log("✅ Problemas guardados:", d));
  }
}

// ─── RENDERIZADO GRÁFICO DEL JUEGO ───────────────────────────────────────────
function drawFondo() {
  // Bosque otoñal/comercial cálido
  ctx.fillStyle = "#2c1d11"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Senderos decorativos de fondo
  ctx.fillStyle = "#3d2a1c"; ctx.fillRect(0, 500, canvas.width, 100);
}

function drawCasillasPasos() {
  // Dibujar los 3 contenedores vacíos o llenos según el progreso del niño
  const nombresPasos = preguntas[currentQ].pasosText;
  const anchoCaja = 260, altoCaja = 75;
  const posicionesX = [80, 370, 660];

  for (let i = 0; i < 3; i++) {
    let x = posicionesX[i];
    let y = 140;

    // Estilo dinámico si el paso ya fue completado
    if (pasoActual > i + 1) {
      ctx.fillStyle = "#1e3a1e"; ctx.strokeStyle = "#2ecc71"; // Completado (Verde)
    } else if (pasoActual === i + 1) {
      ctx.fillStyle = "#3a2a18"; ctx.strokeStyle = "#ff9f43"; // Paso Activo (Naranja)
    } else {
      ctx.fillStyle = "#1c140d"; ctx.strokeStyle = "#5c4033"; // Bloqueado (Marrón opaco)
    }

    ctx.lineWidth = 3;
    roundRect(ctx, x, y, anchoCaja, altoCaja, 10); ctx.fill(); ctx.stroke();

    // Texto descriptivo guía del paso
    ctx.fillStyle = pasoActual === i + 1 ? "#ff9f43" : "#a68a7c";
    ctx.font = "bold 11px Minecraftia"; ctx.textAlign = "center";
    ctx.fillText(nombresPasos[i], x + anchoCaja/2, y + 43);
  }
}

function drawBurbujas() {
  burbujas.forEach(b => {
    if (b.explotada) return;

    // Efecto flotante usando seno matemático basado en el tiempo transcurrido
    b.y = b.baseY + Math.sin((tiempo + b.offset) * 0.04) * 12;

    // Sombra interna y estilo de la burbuja flotante
    ctx.fillStyle = "rgba(243, 198, 35, 0.15)";
    ctx.strokeStyle = "#ffcc00"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.radio, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Brillo estético de burbuja (Efecto cristal)
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath(); ctx.arc(b.x - 20, b.y - 20, 10, 0, Math.PI * 2); ctx.fill();

    // Texto interior de la operación matemática
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 13px Minecraftia"; ctx.textAlign = "center";
    ctx.fillText(b.texto, b.x, b.y + 6);
  });
}

function drawHUD() {
  // Pizarra del problema contextualizado superior
  ctx.fillStyle = "rgba(20, 12, 6, 0.96)"; ctx.strokeStyle = "#e67e22"; ctx.lineWidth = 4;
  roundRect(ctx, 60, 20, canvas.width - 120, 95, 15); ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#ffffff"; ctx.font = "bold 13px Minecraftia"; ctx.textAlign = "center";
  wrapText(ctx, preguntas[currentQ].enunciado, canvas.width / 2, 48, 800, 22);

  // Textos y tags de navegación inferiores
  ctx.fillStyle = "#a68a7c"; ctx.font = "14px Minecraftia"; ctx.textAlign = "left";
  ctx.fillText("🎒 RETOMATE | Logística en 3 Pasos", 40, 565);

  ctx.textAlign = "right";
  ctx.fillText(`Caso de Negocio: ${currentQ + 1} / ${preguntas.length}`, canvas.width - 40, 565);
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  let words = text.split(' ');
  let line = '';
  for(let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    let metrics = context.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      context.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else { line = testLine; }
  }
  context.fillText(line, x, y);
}

function drawFeedback() {
  if (feedbackTimer <= 0) return;
  ctx.fillStyle = "rgba(15, 8, 4, 0.95)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = feedbackOk ? "#00ffcc" : "#ff4757";
  ctx.font = "bold 20px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText(feedbackMsg, canvas.width / 2, canvas.height / 2);
}

function drawPausa() {
  ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const bx = canvas.width / 2 - 125, by = 270;
  ctx.fillStyle = "#2c1d11"; ctx.strokeStyle = "#e67e22"; ctx.lineWidth = 3;
  roundRect(ctx, bx, by, 250, 60, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#e67e22"; ctx.font = "18px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("▶ Continuar", canvas.width / 2, by + 38);
}

function drawFinal() {
  ctx.fillStyle = "#140c06"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#00ffcc"; ctx.font = "bold 30px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("¡LOGÍSTICA TOTALMENTE DESPACHADA!", canvas.width / 2, canvas.height / 2 - 40);
  ctx.fillStyle = "#fff"; ctx.font = "18px Minecraftia";
  ctx.fillText("¡Felicidades! Lograste organizar todas las cuentas del zorro.", canvas.width / 2, canvas.height / 2 + 15);
  
  const bx = canvas.width / 2 - 125, by = 420;
  ctx.fillStyle = "#e67e22"; roundRect(ctx, bx, by, 250, 54, 10); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "bold 15px Minecraftia";
  ctx.fillText("🔄 Reiniciar Viaje", canvas.width / 2, by + 34);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x+r, y); c.lineTo(x+w-r, y); c.quadraticCurveTo(x+w, y, x+w, y+r);
  c.lineTo(x+w, y+h-r); c.quadraticCurveTo(x+w, y+h, x+w-r, y+h); c.lineTo(x+r, y+h);
  c.quadraticCurveTo(x, y+h, x, y+h-r); c.lineTo(x, y+r); c.quadraticCurveTo(x, y, x+r, y);
  c.closePath();
}

function resetGame() { aciertos = 0; currentQ = 0; juegoTerminado = false; pausado = false; pasoActual = 1; cargarBurbujas(); }

// ─── LOOP PRINCIPAL DE RENDER ────────────────────────────────────────────────
let tiempo = 0;
function gameLoop() {
  tiempo++;
  if (feedbackTimer > 0) feedbackTimer--;

  if (!pausado && !juegoTerminado) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFondo();
    drawCasillasPasos();
    drawBurbujas();
    drawHUD();
    drawFeedback();
  } else if (pausado && !juegoTerminado) {
    drawPausa();
  } else {
    drawFinal();
  }

  requestAnimationFrame(gameLoop);
}

window.onload = () => { cargarBurbujas(); gameLoop(); };