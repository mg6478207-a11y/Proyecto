// 🎮 RETOMATE - Grado 4 | Unidad 4: Área y Perímetro
// 📐 "El Zorro Arquitecto"
// El estudiante selecciona la habitación con las medidas correctas de Área o Perímetro.
// Controles: Clic en la opción correcta | P pausar

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
let particulas     = [];
let estrellasFinal = [];
let opcionesPlanos = []; 

// ─── SONIDOS ──────────────────────────────────────────────────────────────────
const sonidoCorrecto = new Audio("https://actions.google.com/sounds/v1/cartoon/shop_register.ogg");
const sonidoError    = new Audio("https://actions.google.com/sounds/v1/cartoon/boing_spring.ogg");
const musicaFondo    = new Audio(""); // Opcional: música alegre de construcción
musicaFondo.loop = true; musicaFondo.volume = 0.12;

// ─── BANCO DE PREGUNTAS (ÁREA Y PERÍMETRO - GRADO 4) ────────────────=========
const preguntas = [
  { tipo: "area", valor: 12, enunciado: "Busca los planos de una habitación con ÁREA = 12 u²", opciones: [{w:4, h:3}, {w:5, h:2}, {w:3, h:3}], respuestaIdx: 0 },
  { tipo: "perimetro", valor: 14, enunciado: "Busca una zona perimetral de un total de PERÍMETRO = 14 u", opciones: [{w:3, h:2}, {w:5, h:2}, {w:4, h:4}], respuestaIdx: 1 },
  { tipo: "area", valor: 16, enunciado: "El zorro necesita construir un jardín de ÁREA = 16 u²", opciones: [{w:6, h:2}, {w:5, h:3}, {w:4, h:4}], respuestaIdx: 2 },
  { tipo: "perimetro", valor: 12, enunciado: "Encuentra el plano que gaste exactamente PERÍMETRO = 12 u de cerca", opciones: [{w:4, h:2}, {w:5, h:1}, {w:3, h:4}], respuestaIdx: 0 },
  { tipo: "area", valor: 20, enunciado: "Ayuda a diseñar una piscina con un ÁREA = 20 u²", opciones: [{w:5, h:4}, {w:6, h:3}, {w:7, h:2}], respuestaIdx: 0 },
  { tipo: "perimetro", valor: 18, enunciado: "El establo requiere un cerco de PERÍMETRO = 18 u", opciones: [{w:5, h:3}, {w:5, h:4}, {w:6, h:2}], respuestaIdx: 1 },
  { tipo: "area", valor: 6, enunciado: "Diseña un baño pequeño que ocupe un ÁREA = 6 u²", opciones: [{w:2, h:2}, {w:3, h:2}, {w:4, h:1}], respuestaIdx: 1 },
  { tipo: "perimetro", valor: 16, enunciado: "Encuentra la habitación cuadrada con un PERÍMETRO = 16 u", opciones: [{w:5, h:3}, {w:3, h:3}, {w:4, h:4}], respuestaIdx: 2 },
  { tipo: "area", valor: 25, enunciado: "Construye la habitación principal de ÁREA = 25 u²", opciones: [{w:6, h:4}, {w:5, h:5}, {w:7, h:3}], respuestaIdx: 1 },
  { tipo: "perimetro", valor: 20, enunciado: "Busca la zona recreativa exterior de PERÍMETRO = 20 u", opciones: [{w:6, h:4}, {w:8, h:2}, {w:5, h:4}], respuestaIdx: 0 }
];

function generarPlanos() {
  opcionesPlanos = [];
  const q = preguntas[currentQ];
  const posX = [100, 400, 700];

  q.opciones.forEach((op, index) => {
    opcionesPlanos.push({
      x: posX[index],
      y: 360,
      wBox: 220,
      hBox: 180,
      anchoUnidades: op.w,
      altoUnidades: op.h,
      esCorrecto: index === q.respuestaIdx,
      areaCalculada: op.w * op.h,
      perimetroCalculado: 2 * (op.w + op.h)
    });
  });
}

function crearParticulas(x, y, color) {
  for (let i = 0; i < 15; i++) {
    particulas.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 20, maxLife: 20, color: color, r: 2 + Math.random() * 3
    });
  }
}

// ─── AUXILIAR: TEXTO MULTILÍNEA PARA EVITAR DESBORDE ─────────────────────────
function fragmentarTexto(texto, maxAncho) {
  let palabras = texto.split(" ");
  let lineas = [];
  let lineaActual = palabras[0];

  for (let i = 1; i < palabras.length; i++) {
    let palabra = palabras[i];
    let ancho = ctx.measureText(lineaActual + " " + palabra).width;
    if (ancho < maxAncho) {
      lineaActual += " " + palabra;
    } else {
      lineas.push(lineaActual);
      lineaActual = palabra;
    }
  }
  lineas.push(lineaActual);
  return lineas;
}

// ─── CONTROL DE EVENTOS (CLIC Y TECLADO) ──────────────────────────────────────
canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Si está pausado y da clic en el botón de continuar
  if (pausado && !juegoTerminado) {
    const bx = canvas.width / 2 - 125, by = canvas.height / 2 - 30;
    if (mouseX >= bx && mouseX <= bx + 250 && mouseY >= by && mouseY <= by + 60) {
      pausado = false;
    }
    return;
  }

  if (juegoTerminado) {
    if (mouseX >= canvas.width / 2 - 125 && mouseX <= canvas.width / 2 + 125 && mouseY >= 400 && mouseY <= 454) {
      resetGame();
    }
    return;
  }

  if (feedbackTimer > 0) return;

  // Detectar clic en los planos expuestos
  opcionesPlanos.forEach(p => {
    if (mouseX >= p.x && mouseX <= p.x + p.wBox &&
        mouseY >= p.y && mouseY <= p.y + p.hBox) {
      
      if (p.esCorrecto) {
        aciertos++;
        feedbackMsg = "¡Excelente Arquitecto! Encaja Perfecto 📐🏗️";
        feedbackOk = true;
        if (sonidoCorrecto) { sonidoCorrecto.currentTime = 0; sonidoCorrecto.play(); }
        crearParticulas(p.x + p.wBox/2, p.y + p.hBox/2, "#2ecc71");
      } else {
        const q = preguntas[currentQ];
        feedbackMsg = q.tipo === "area" 
          ? `¡Oops! Ese plano mide ${p.areaCalculada} u² de Área 🔧`
          : `¡Oops! Ese plano mide ${p.perimetroCalculado} u de Perímetro 🔧`;
        feedbackOk = false;
        if (sonidoError) { sonidoError.currentTime = 0; sonidoError.play(); }
        crearParticulas(p.x + p.wBox/2, p.y + p.hBox/2, "#e74c3c");
      }

      feedbackTimer = 90;
      setTimeout(() => { siguientePregunta(); }, 1200);
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
  feedbackTimer = 0;

  if (currentQ >= preguntas.length) {
    juegoTerminado = true;
    const puntaje = (aciertos / preguntas.length) * 100;

    fetch("/guardar_progreso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grado: 4, unidad: 4, aciertos, total: preguntas.length, puntaje })
    })
    .then(r => r.json()).then(d => console.log("✅ Geometría guardada:", d))
    .catch(err => console.error("Error guardando progreso G4U4:", err));
  } else {
    generarPlanos();
  }
}

// ─── RENDERIZADO GRÁFICO ─────────────────────────────────────────────────────
function drawFondo() {
  ctx.fillStyle = "#1a365d"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)"; ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 25) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 25) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
}

function drawFoxObrero() {
  ctx.save();
  ctx.translate(60, 120);
  ctx.fillStyle = "#e66000"; ctx.fillRect(0, 0, 45, 45); 
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 25, 12, 20); ctx.fillRect(33, 25, 12, 20);
  ctx.fillStyle = "#f1c40f"; ctx.fillRect(-5, -8, 55, 12); 
  ctx.fillRect(8, -16, 28, 10); 
  ctx.fillStyle = "#111"; ctx.fillRect(12, 18, 4, 5); ctx.fillRect(28, 18, 4, 5);
  ctx.restore();
}

function drawPlanos() {
  opcionesPlanos.forEach(p => {
    ctx.fillStyle = "#2c3e50"; ctx.strokeStyle = "#3498db"; ctx.lineWidth = 3;
    roundRect(ctx, p.x, p.y, p.wBox, p.hBox, 10); ctx.fill(); ctx.stroke();

    const tamañoCelda = 16;
    const centroX = p.x + (p.wBox - (p.anchoUnidades * tamañoCelda)) / 2;
    const centroY = p.y + (p.hBox - (p.altoUnidades * tamañoCelda)) / 2;

    ctx.fillStyle = "#e74c3c"; 
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5;

    for (let uAncho = 0; uAncho < p.anchoUnidades; uAncho++) {
      for (let uAlto = 0; uAlto < p.altoUnidades; uAlto++) {
        let cx = centroX + (uAncho * tamañoCelda);
        let cy = centroY + (uAlto * tamañoCelda);
        ctx.fillRect(cx, cy, tamañoCelda, tamañoCelda);
        ctx.strokeRect(cx, cy, tamañoCelda, tamañoCelda);
      }
    }

    ctx.fillStyle = "#00ffcc"; ctx.font = "14px Minecraftia"; ctx.textAlign = "center";
    ctx.fillText(`${p.anchoUnidades} u de ancho`, p.x + p.wBox/2, p.y + 25);
    ctx.fillText(`${p.altoUnidades} u de alto`, p.x + p.wBox/2, p.y + p.hBox - 15);
  });
}

function drawHUD() {
  // Letrero del plano guía
  ctx.fillStyle = "rgba(44, 62, 80, 0.95)"; ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 4;
  roundRect(ctx, 130, 100, canvas.width - 180, 105, 12); ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#ffffff"; ctx.font = "bold 17px Minecraftia"; ctx.textAlign = "center";
  
  // Renderizado dinámico multilínea para evitar desborde
  let lineas = fragmentarTexto(preguntas[currentQ].enunciado, canvas.width - 240);
  let inicioY = 140;
  if(lineas.length === 1) inicioY = 155; // Centrado si es una sola línea
  
  lineas.forEach((linea, index) => {
    ctx.fillText(linea, canvas.width / 2 + 35, inicioY + (index * 26));
  });

  ctx.fillStyle = "#bdc3c7"; ctx.font = "16px Minecraftia"; ctx.textAlign = "left";
  ctx.fillText(`📐 Planos Correctos: ${aciertos} / ${preguntas.length}`, 40, 45);
}

function drawFeedback() {
  if (feedbackTimer <= 0) return;
  ctx.fillStyle = "rgba(11, 23, 44, 0.92)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = feedbackOk ? "#00ffcc" : "#ff4757";
  ctx.font = "bold 23px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText(feedbackMsg, canvas.width / 2, canvas.height / 2);
}

function drawPausa() {
  ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const bx = canvas.width / 2 - 125, by = canvas.height / 2 - 30;
  ctx.fillStyle = "#1c2d42"; ctx.strokeStyle = "#3498db"; ctx.lineWidth = 3;
  roundRect(ctx, bx, by, 250, 60, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#3498db"; ctx.font = "20px Minecraftia"; ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("▶ Continuar", canvas.width / 2, by + 30);
  ctx.textBaseline = "alphabetic"; // Reseteo
}

function drawFinal() {
  ctx.fillStyle = "#111b29"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#00ffcc"; ctx.font = "bold 32px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("¡OBRA TERMINADA CON ÉXITO!", canvas.width / 2, canvas.height / 2 - 50);
  ctx.fillStyle = "#fff"; ctx.font = "20px Minecraftia";
  ctx.fillText(`Fidelidad de Planos: ${Math.round((aciertos / preguntas.length) * 100)}%`, canvas.width / 2, canvas.height / 2 + 10);
  
  const bx = canvas.width / 2 - 125, by = 400;
  ctx.fillStyle = "#3498db"; roundRect(ctx, bx, by, 250, 54, 10); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "16px Minecraftia";
  ctx.fillText("🔄 Nueva Obra", canvas.width / 2, by + 34);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x+r, y); c.lineTo(x+w-r, y); c.quadraticCurveTo(x+w, y, x+w, y+r);
  c.lineTo(x+w, y+h-r); c.quadraticCurveTo(x+w, y+h, x+w-r, y+h); c.lineTo(x+r, y+h);
  c.quadraticCurveTo(x, y+h, x, y+h-r); c.lineTo(x, y+r); c.quadraticCurveTo(x, y, x+r, y);
  c.closePath();
}

function resetGame() { aciertos = 0; currentQ = 0; juegoTerminado = false; pausado = false; generarPlanos(); }

// ─── LOOP PRINCIPAL ───────────────────────────────────────────────────────────
function gameLoop() { 
  tiempo++; 
  
  // Actualización del feedback independiente de la pausa física de interacción
  if (feedbackTimer > 0) feedbackTimer--; 

  if (!pausado && !juegoTerminado) {
    // Solo vaciar y redibujar los componentes de juego dinámico si no está pausado
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFondo();
    drawFoxObrero(); 
    drawPlanos(); 
    drawHUD(); 
    drawFeedback();
    
    // Animación de partículas
    particulas.forEach((p, i) => { 
      p.x += p.vx; p.y += p.vy; p.life--; 
      if(p.life <= 0) particulas.splice(i,1); 
      ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.r, p.r); 
    });
  } else if (pausado && !juegoTerminado) {
    // Si se activa la pausa, se dibuja la pantalla estática encima
    drawPausa();
  } else if (juegoTerminado) {
    drawFinal();
  }
  
  requestAnimationFrame(gameLoop);
}

generarPlanos();
window.onload = () => { gameLoop(); };