// 🎮 RETOMATE - Grado 4 | Unidad 8: Números Negativos
// 🦊 "El Zorro Botones: El Gran Hotel de la Secuoya" - VERSIÓN CORREGIDA
// Controles: ← / → Mover Zorro | ↓ Presionar Botón/Confirmar Piso | P Pausar

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
let tiempo = 0;

// ─── NUEVO PROTAGONISTA: ZORRO PIXEL ART CON PERSONALIDAD ──────────────────────
const fox = {
  x: 100, // Inicia seguro a la izquierda
  y: 405, // Altura ajustada para el nuevo sprite
  w: 74,
  h: 85,
  speed: 9
};

const keys = { ArrowLeft: false, ArrowRight: false };

// ─── BANCO DE PREGUNTAS (PISOS NEGATIVOS DEL HOTEL) ──────────────────────────
const preguntas = [
  { mision: "Lleva las maletas del oso al Sótano -2 (Almacén de Miel)", target: -2, opciones: [-1, -2, -3] },
  { mision: "Baja a la caldera en el Sótano -5 antes de que se enfríe", target: -5, opciones: [-3, -4, -5] },
  { mision: "Ve por las herramientas del castor al Sótano -1", target: -1, opciones: [0, -1, -2] },
  { mision: "Busca los vegetales congelados al Sótano -4", target: -4, opciones: [-2, -4, -5] },
  { mision: "Misión final: Baja al estacionamiento más profundo: Sótano -3", target: -3, opciones: [-1, -3, -4] }
];

// ─── CONFIGURACIÓN DE LOS BOTONES DE ASCENSOR EN EL SUELO ─────────────────────
let botonesPiso = [];

function cargarBotonesPiso() {
  botonesPiso = [];
  const opciones = preguntas[currentQ].opciones;
  const posicionesX = [250, 550, 850]; 

  for (let i = 0; i < 3; i++) {
    botonesPiso.push({
      x: posicionesX[i] - 70,
      y: 460,
      w: 140,
      h: 30,
      pisoValor: opciones[i],
      color: "#a0522d" // Color madera hotel base
    });
  }
}

// ─── CONTROLES REFORMADOS CON MECÁNICA DE SELECCIÓN VOLUNTARIA (↓) ────────────
window.addEventListener("keydown", e => {
  if (["ArrowLeft", "ArrowRight", "ArrowDown", "P", "p"].includes(e.key) && e.target === document.body) e.preventDefault();
  if (e.key === "ArrowLeft") keys.ArrowLeft = true;
  if (e.key === "ArrowRight") keys.ArrowRight = true;
  
  if ((e.key === "p" || e.key === "P") && !juegoTerminado && feedbackTimer <= 0) {
    pausado = !pausado;
  }

  // NUEVA MECÁNICA: Presionar flecha ABAJO para confirmar el piso
  if (e.key === "ArrowDown" && !pausado && !juegoTerminado && feedbackTimer <= 0) {
    confirmarSeleccionPiso();
  }
});

window.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") keys.ArrowLeft = false;
  if (e.key === "ArrowRight") keys.ArrowRight = false;
});

// ─── LÓGICA DE ACTUALIZACIÓN ──────────────────────────────────────────────────
function update() {
  if (pausado || juegoTerminado || feedbackTimer > 0) return;

  if (keys.ArrowLeft) fox.x = Math.max(50, fox.x - fox.speed);
  if (keys.ArrowRight) fox.x = Math.min(880, fox.x + fox.speed);

  // Marcar visualmente qué botón está enfocado pero NO activarlo
  let centroZorro = fox.x + fox.w / 2;
  botonesPiso.forEach(b => {
    if (centroZorro > b.x && centroZorro < b.x + b.w) {
      b.focused = true; // Efecto de hover visual
    } else {
      b.focused = false;
    }
  });
}

function confirmarSeleccionPiso() {
  let centroZorro = fox.x + fox.w / 2;
  let botonConfirmado = null;

  botonesPiso.forEach(b => {
    if (centroZorro > b.x && centroZorro < b.x + b.w) {
      botonConfirmado = b;
    }
  });

  if (botonConfirmado) {
    // Si estaba parado sobre un botón y presionó Abajo, evaluar
    if (botonConfirmado.pisoValor === preguntas[currentQ].target) {
      aciertos++;
      feedbackMsg = `¡Ascensor activado! Bajando correctamente al Sótano ${botonConfirmado.pisoValor} 🦊🛎️`;
      feedbackOk = true;
      feedbackTimer = 90;
      setTimeout(siguientePregunta, 1300);
    } else {
      feedbackMsg = `¡Piso equivocado! Ese botón te lleva al nivel ${botonConfirmado.pisoValor}. Busca el correcto.`;
      feedbackOk = false;
      feedbackTimer = 85;
      setTimeout(reposicionarZorro, 1200); 
    }
  }
}

function reposicionarZorro() {
  fox.x = 100; // Regresa al inicio del pasillo de forma segura
  feedbackTimer = 0;
}

function siguientePregunta() {
  currentQ++;
  feedbackTimer = 0;
  fox.x = 100; // Centrar de nuevo al zorro

  if (currentQ < preguntas.length) {
    cargarBotonesPiso();
  } else {
    juegoTerminado = true;
    const puntaje = (aciertos / preguntas.length) * 100;
    fetch("/guardar_progreso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grado: 4, unidad: 8, aciertos, total: preguntas.length, puntaje })
    })
    .then(r => r.json()).then(d => console.log("✅ Progreso de negativos guardado:", d));
  }
}

// ─── CAPA DE RENDERIZADO GRÁFICO (CON EL NUEVO ZORRO Y DISEÑO) ───────────────
function drawFondo() {
  // Fondo de madera cálido de hotel
  ctx.fillStyle = "#3e2723"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Alfombra elegante del hotel
  ctx.fillStyle = "#8a0303"; ctx.fillRect(0, 480, canvas.width, 120);
  ctx.strokeStyle = "#ff9100"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, 480); ctx.lineTo(canvas.width, 480); ctx.stroke();

  // Recta numérica educativa lateral sutil
  ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 2;
  ctx.font = "11px Minecraftia"; ctx.fillStyle = "#a1887f";
  for(let i = 2; i >= -6; i--) {
    let yMarker = 280 - (i * 35);
    ctx.beginPath(); ctx.moveTo(50, yMarker); ctx.lineTo(75, yMarker); ctx.stroke();
    ctx.fillText(i === 0 ? "Lobby (0)" : `Sótano (${i})`, 85, yMarker + 4);
  }
}

function drawBotones() {
  botonesPiso.forEach(b => {
    // Dibujar base estructural del ascensor en el suelo
    ctx.fillStyle = b.focused ? "#e67e22" : "#8d6e63"; // Brillo visual si está enfocado
    ctx.strokeStyle = b.focused ? "#fff" : "#fff"; ctx.lineWidth = b.focused ? 3 : 1.5;
    roundRect(ctx, b.x, b.y, b.w, b.h, 6); ctx.fill(); ctx.stroke();

    // Etiqueta indicadora del piso
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 13px Minecraftia"; ctx.textAlign = "center";
    ctx.fillText(`Piso ${b.pisoValor}`, b.x + b.w / 2, b.y + 20);
  });
}

function drawZorro() {
  // 🦊 NUEVO SPRITE ZORRO PIXEL ART: CON COLA, OREJAS Y UNIFORME DE HOTEL
  ctx.save();
  ctx.translate(fox.x, fox.y);
  
  // Cola esponjosa (atrás, con punta blanca)
  ctx.fillStyle = "#e66000"; ctx.beginPath();
  ctx.moveTo(-15, 65); ctx.quadraticCurveTo(-35, 60, -25, 40); ctx.quadraticCurveTo(-15, 20, -5, 50); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.beginPath(); // Punta de la cola
  ctx.moveTo(-25, 40); ctx.quadraticCurveTo(-15, 20, -5, 50); ctx.lineTo(-20, 50); ctx.fill();

  // Cuerpo y Chaqueta de botones (Rojo hotel)
  ctx.fillStyle = "#b71c1c"; ctx.fillRect(0, 20, fox.w, fox.h - 20); 
  // Botones dorados de la chaqueta
  ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.arc(15, 45, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(15, 60, 2.5, 0, Math.PI * 2); ctx.fill();
  
  // Rostro de Zorro
  ctx.fillStyle = "#e66000"; ctx.fillRect(12, -10, 50, 35);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(12, 12, 12, 13); ctx.fillRect(50, 12, 12, 13); // Mejillas
  ctx.fillStyle = "#000000"; ctx.fillRect(24, 7, 5, 6); ctx.fillRect(45, 7, 5, 6); // Ojos

  // Orejas bien definidas
  ctx.beginPath(); ctx.moveTo(12,-10); ctx.lineTo(5,-25); ctx.lineTo(20,-10); ctx.fill();
  ctx.beginPath(); ctx.moveTo(62,-10); ctx.lineTo(69,-25); ctx.lineTo(54,-10); ctx.fill();
  
  // Gorro formal del hotel con visera dorada
  ctx.fillStyle = "#112240"; ctx.fillRect(20, -20, 34, 11);
  ctx.fillStyle = "#f1c40f"; ctx.fillRect(20, -11, 34, 3); // Visera dorada

  // Patas pixel art
  ctx.fillStyle = "#e66000"; ctx.fillRect(10, 85, 12, 15); ctx.fillRect(52, 85, 12, 15);
  ctx.fillStyle = "#000"; ctx.fillRect(10, 95, 12, 5); ctx.fillRect(52, 95, 12, 5); // Zapatos

  ctx.restore();
}

function drawHUD() {
  // Pizarra de pedidos superior
  ctx.fillStyle = "rgba(17, 34, 64, 0.95)"; ctx.strokeStyle = "#ff9100"; ctx.lineWidth = 4;
  roundRect(ctx, 80, 20, canvas.width - 160, 95, 15); ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#ffffff"; ctx.font = "bold 15px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("🛎️ SOLICITUD DE LA RECEPCIÓN:", canvas.width / 2, 50);
  ctx.fillStyle = "#f1c40f"; ctx.font = "14px Minecraftia";
  ctx.fillText(preguntas[currentQ].mision, canvas.width / 2, 78);

  // Barra de estado base
  ctx.fillStyle = "#a1887f"; ctx.font = "12px Minecraftia"; ctx.textAlign = "left";
  ctx.fillText("🏨 RETOMATE G4 | Unidad 8: El Ascensor de los Números Negativos", 40, 575);
  ctx.textAlign = "right";
  ctx.fillText(`Huéspedes atendidos: ${currentQ + 1} / ${preguntas.length}`, canvas.width - 40, 575);
}

function drawFeedback() {
  if (feedbackTimer <= 0) return;
  ctx.fillStyle = "rgba(18, 12, 8, 0.96)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = feedbackOk ? "#00ffcc" : "#ff4757";
  ctx.font = "bold 20px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText(feedbackMsg, canvas.width / 2, canvas.height / 2);
}

function drawPausa() {
  ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1c140d"; ctx.strokeStyle = "#e67e22"; ctx.lineWidth = 3;
  roundRect(ctx, canvas.width / 2 - 125, 260, 250, 60, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#e67e22"; ctx.font = "16px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("▶ Juego Pausado", canvas.width / 2, 296);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x+r, y); c.lineTo(x+w-r, y); c.quadraticCurveTo(x+w, y, x+w, y+r);
  c.lineTo(x+w, y+h-r); c.quadraticCurveTo(x+w, y+h, x+w-r, y+h); c.lineTo(x+r, y+h);
  c.quadraticCurveTo(x, y+h, x, y+h-r); c.lineTo(x, y+r); c.quadraticCurveTo(x, y, x+r, y);
  c.closePath();
}

// ─── LOOP PRINCIPAL DE RENDERIZADO ───────────────────────────────────────────
function gameLoop() {
  tiempo++;
  if (feedbackTimer > 0) feedbackTimer--;

  if (!pausado && !juegoTerminado) {
    update();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFondo();
    drawBotones();
    drawZorro();
    drawHUD();
    drawFeedback();
  } else if (pausado && !juegoTerminado) {
    drawPausa();
  } else if (juegoTerminado) {
    // Pantalla final
    ctx.fillStyle = "#112240"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#00ffcc"; ctx.font = "bold 26px Minecraftia"; ctx.textAlign = "center";
    ctx.fillText("¡GERENCIA DEL HOTEL COMPLETADA! 🛎️🦊", 500, 260);
    ctx.fillStyle = "#ffffff"; ctx.font = "16px Minecraftia";
    ctx.fillText("¡Eres un experto en la recta numérica bajo el cero!", 500, 310);
  }

  requestAnimationFrame(gameLoop);
}

window.onload = () => { cargarBotonesPiso(); gameLoop(); };