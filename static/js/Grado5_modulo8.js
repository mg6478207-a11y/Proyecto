// 🎮 RETOMATE - Grado 5 | Unidad 8: Problemas Complejos
// ⚙️ "La Fábrica de Dirigibles del Zorro"
// El zorro opera una grúa industrial y suelta engranajes sobre vagonetas en movimiento.
// Controles: ← → mover grúa | ↓ soltar engranaje pesado | P pausar | Clic en pantalla

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
let engranaje      = null; // Proyectil que cae
let vagonetas      = [];   // Objetivos móviles en el suelo

// ─── SONIDOS ──────────────────────────────────────────────────────────────────
const sonidoLanzar   = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_cowbell.ogg");
const sonidoCorrecto = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const sonidoError    = new Audio("https://actions.google.com/sounds/v1/cartoon/mechanical_clunk.ogg");
const musicaFondo    = new Audio(""); // Pega aquí tu link de audio preferido cuando lo tengas
musicaFondo.loop = true; musicaFondo.volume = 0.2;

// ─── BANCO DE 10 PREGUNTAS (PROBLEMAS COMPLEJOS) ──────────────────────────────
const preguntas = [
  { enunciado: "Si tengo $120, gasto la mitad y luego gano $35, ¿cuánto tengo?", opciones: ["$95", "$85", "$90"], respuesta: "$95" },
  { enunciado: "Un tren lleva 3 vagones con 25 pasajeros c/u. Se bajan 15. ¿Cuántos quedan?", opciones: ["60", "55", "65"], respuesta: "60" },
  { enunciado: "Resuelve la operación combinada: (4 + 6) × 5 - 12", opciones: ["38", "28", "42"], respuesta: "38" },
  { enunciado: "Compré 4 cuadernos a $8 c/u y pagué con $50. ¿Cuánto recibo de cambio?", opciones: ["$18", "$12", "$22"], respuesta: "$18" },
  { enunciado: "El doble de la suma de 15 y 25 es igual a:", opciones: ["80", "70", "90"], respuesta: "80" },
  { enunciado: "Una caja tiene 60 manzanas. 1/3 están maduras. ¿Cuántas no están maduras?", opciones: ["40", "20", "30"], respuesta: "40" },
  { enunciado: "Si un pastel se corta en 8 partes y me como 3/8, ¿qué fracción queda?", opciones: ["5/8", "4/8", "3/8"], respuesta: "5/8" },
  { enunciado: "Resuelve la operación combinada: 50 - 3 × (8 + 2)", opciones: ["20", "40", "10"], respuesta: "20" },
  { enunciado: "Si 3 camisas cuestan $45, ¿cuánto costarán 5 camisas iguales?", opciones: ["$75", "$60", "$70"], respuesta: "$75" },
  { enunciado: "Un tanque tiene 100L. Pierde 5L por hora. ¿Cuánto queda tras 6 horas?", opciones: ["70L", "75L", "80L"], respuesta: "70L" }
];

// ─── CONFIGURACIÓN DE PERSONAJE (GRÚA INDUSTRIAL) ──────────────────────────────
const grua = {
  x: 450,
  y: 60, // En la parte superior
  w: 70,
  h: 50,
  speed: 9
};

function generarVagonetas() {
  vagonetas = [];
  const q = preguntas[currentQ];
  
  // Posiciones iniciales escalonadas para que no caminen pegadas
  q.opciones.forEach((op, index) => {
    vagonetas.push({
      x: index * 320 + 50,
      y: 450, // En el suelo de la fábrica
      w: 140,
      h: 80,
      texto: op,
      correcta: op === q.respuesta,
      vx: 2.5 + Math.random() * 1.5, // Velocidades ligeramente distintas para obligar a calcular el tiro
      hit: false,
      hitTimer: 0
    });
  });
}

function crearParticulas(x, y, color, cantidad = 20) {
  for (let i = 0; i < cantidad; i++) {
    particulas.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6 - 2,
      life: 30, maxLife: 30,
      color: color,
      r: 1.5 + Math.random() * 3.5
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
  // SOLTAR ENGRANAJE CON FLECHA ABAJO
  if (e.key === "ArrowDown" && !engranaje && feedbackTimer <= 0 && !juegoTerminado && !pausado) {
    engranaje = { x: grua.x + grua.w / 2, y: grua.y + grua.h, vy: 11, rot: 0 };
    if (sonidoLanzar) { sonidoLanzar.currentTime = 0; sonidoLanzar.play(); }
  }
});
window.addEventListener("keyup", e => { keys[e.key] = false; });

canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

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

// ─── LÓGICA DE ACTUALIZACIÓN ──────────────────────────────────────────────────
function update() {
  if (pausado || juegoTerminado) return;
  tiempo++;

  if (feedbackTimer > 0) feedbackTimer--;

  // Movimiento Horizontal de la Grúa Mecánica (Techo)
  if (keys["ArrowLeft"]) grua.x -= grua.speed;
  if (keys["ArrowRight"]) grua.x += grua.speed;
  grua.x = Math.max(20, Math.min(grua.x, canvas.width - grua.w - 20));

  // Movimiento de las Vagonetas (Rebotes cíclicos en los extremos del mapa)
  vagonetas.forEach(v => {
    v.x += v.vx;
    if (v.x < 10 || v.x > canvas.width - v.w - 10) {
      v.vx *= -1; // Cambian de dirección si tocan los muros de la fábrica
    }
    if (v.hitTimer > 0) v.hitTimer--;
  });

  // Caída del Engranaje Pesado
  if (engranaje) {
    engranaje.y += engranaje.vy;
    engranaje.rot += 0.18;

    // Humo de fricción industrial
    if (tiempo % 3 === 0) {
      particulas.push({
        x: engranaje.x, y: engranaje.y - 10,
        vx: (Math.random() - 0.5) * 1.5, vy: -0.5,
        life: 18, maxLife: 18,
        color: "#888888", r: 2 + Math.random() * 2
      });
    }

    // Colisión: Engranaje cayendo sobre Vagonetas
    vagonetas.forEach(v => {
      if (!engranaje || colisionLock) return;

      const cx = v.x + v.w / 2;
      const cy = v.y + v.h / 2;

      // Detecta impacto físico preciso en coordenadas
      if (Math.abs(engranaje.x - cx) < v.w / 2 + 10 && Math.abs(engranaje.y - v.y) < 15) {
        colisionLock = true;
        v.hit = true;
        v.hitTimer = 30;

        crearParticulas(engranaje.x, engranaje.y, "#ffcc00", 25);
        crearParticulas(engranaje.x, engranaje.y, "#999999", 15);

        if (v.correcta) {
          aciertos++;
          feedbackMsg = "¡Componente Correcto! ⚙️📦";
          feedbackOk = true;
          if (sonidoCorrecto) { sonidoCorrecto.currentTime = 0; sonidoCorrecto.play(); }
        } else {
          feedbackMsg = `¡Error de Carga! El resultado era ${preguntas[currentQ].respuesta} 🏭`;
          feedbackOk = false;
          if (sonidoError) { sonidoError.currentTime = 0; sonidoError.play(); }
        }

        feedbackTimer = 90;
        engranaje = null;

        setTimeout(() => {
          siguientePregunta();
        }, 1100);
      }
    });

    // Romper si cae al suelo sin tocar ninguna vagoneta
    if (engranaje && engranaje.y > 520) {
      crearParticulas(engranaje.x, engranaje.y, "#999999", 12);
      engranaje = null;
    }
  }

  // Partículas
  particulas.forEach((p, idx) => {
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.life <= 0) particulas.splice(idx, 1);
  });
}

// ─── TRANSICIÓN Y GUARDADO EN SERVIDOR (UNIDAD 8) ─────────────────────────────
function siguientePregunta() {
  currentQ++;
  engranaje = null;
  colisionLock = false; // Desbloqueo garantizado
  feedbackTimer = 0;
  feedbackMsg = "";

  if (currentQ >= preguntas.length) {
    juegoTerminado = true;
    estrellasFinal = [];
    for (let i = 0; i < 180; i++) {
      estrellasFinal.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        vy: 1.5 + Math.random() * 2,
        r: 2 + Math.random() * 3.5,
        color: ["#ffcc00", "#ffffff", "#55ccff", "#ff7700"][Math.floor(Math.random() * 4)]
      });
    }
    const puntaje = (aciertos / preguntas.length) * 100;

    // Envío seguro de variables a Flask para la Unidad 8
    fetch("/guardar_progreso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grado: 5, unidad: 8, aciertos, total: preguntas.length, puntaje })
    })
    .then(r => r.json())
    .then(d => console.log("✅ Progreso de Problemas Complejos guardado:", d))
    .catch(e => console.error("❌ Error en persistencia U8:", e));
  } else {
    generarVagonetas();
  }
}

// ─── RENDERIZADO EN CANVAS (DISEÑO FÁBRICA DE DIRIGIBLES) ──────────────────────
function drawFondo() {
  // Entorno de hangar industrial metalizado
  let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#2c3e50"); grad.addColorStop(1, "#1a252f");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Vigas de acero cruzadas de fondo
  ctx.strokeStyle = "rgba(255,255,255,0.03)"; ctx.lineWidth = 6;
  for (let i = -100; i < canvas.width; i += 300) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 400, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i + 400, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
  }

  // Riel superior de la grúa
  ctx.fillStyle = "#111111"; ctx.fillRect(0, 45, canvas.width, 16);
  ctx.fillStyle = "#7f8c8d"; ctx.fillRect(0, 48, canvas.width, 6);

  // Suelo de concreto de la fábrica
  ctx.fillStyle = "#34495e"; ctx.fillRect(0, 520, canvas.width, 80);
  ctx.fillStyle = "#2c3e50"; ctx.fillRect(0, 520, canvas.width, 10);
}

function drawVagonetas() {
  vagonetas.forEach(v => {
    ctx.save();
    ctx.translate(v.x, v.y);

    if (v.hit && v.hitTimer % 4 < 2) ctx.translate((Math.random() - 0.5) * 8, 0);

    // Caja de carga contenedor de la vagoneta
    ctx.fillStyle = v.hit ? "#ffaa00" : "#95a5a6";
    ctx.strokeStyle = v.hit ? "#ffffff" : "#7f8c8d";
    ctx.lineWidth = 4;
    roundRect(ctx, 0, 15, v.w, v.h - 35, 10); ctx.fill(); ctx.stroke();

    // Ruedas industriales inferiores
    ctx.fillStyle = "#111";
    ctx.beginPath(); ctx.arc(30, v.h - 12, 14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(v.w - 30, v.h - 12, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#bdc3c7";
    ctx.beginPath(); ctx.arc(30, v.h - 12, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(v.w - 30, v.h - 12, 5, 0, Math.PI * 2); ctx.fill();

    // Texto del resultado matemático
    ctx.fillStyle = v.hit ? "#000000" : "#ffffff";
    ctx.font = "bold 24px Minecraftia"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(v.texto, v.w / 2, v.h / 2 + 3);

    ctx.restore();
  });
}

function drawEngranaje() {
  if (!engranaje) return;
  ctx.save();
  ctx.translate(engranaje.x, engranaje.y);
  ctx.rotate(engranaje.rot);
  
  // Renderizado del engranaje pesado de metal
  ctx.fillStyle = "#d35400"; ctx.strokeStyle = "#e67e22"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  
  // Dientes metálicos
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-5, -24, 10, 10);
  }
  ctx.fillStyle = "#2c3e50"; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawFoxYGrua() {
  // Cable tensor de metal
  if (engranaje) {
    ctx.strokeStyle = "#111111"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(grua.x + grua.w / 2, grua.y + grua.h - 10);
    ctx.lineTo(grua.x + grua.w / 2, engranaje.y); ctx.stroke();
  }

  ctx.save();
  ctx.translate(grua.x, grua.y);

  // Soporte mecánico de la grúa
  ctx.fillStyle = "#e74c3c"; ctx.fillRect(0, 0, grua.w, 15);
  ctx.fillStyle = "#c0392b"; ctx.fillRect(10, 15, grua.w - 20, grua.h - 15);

  // 🦊 El Zorro Ingeniero asomado manejando la grúa
  ctx.fillStyle = "#e66000"; ctx.fillRect(20, 15, 30, 22); // Rostro
  ctx.fillStyle = "#ffffff"; ctx.fillRect(20, 27, 8, 10); ctx.fillRect(42, 27, 8, 10); // Mejillas
  ctx.fillStyle = "#111"; ctx.fillRect(26, 22, 4, 5); ctx.fillRect(40, 22, 4, 5); // Ojos
  
  // Casco de protección industrial amarillo
  ctx.fillStyle = "#f1c40f"; ctx.beginPath();
  ctx.arc(35, 15, 16, Math.PI, 0); ctx.fill();
  ctx.fillRect(16, 13, 38, 4); // Ala del casco

  ctx.restore();
}

function drawHUD() {
  // Letrero industrial del problema complejo
  ctx.fillStyle = "rgba(15, 23, 30, 0.9)"; ctx.strokeStyle = "#ffcc00"; ctx.lineWidth = 2;
  roundRect(ctx, 40, 105, canvas.width - 80, 80, 14); ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#ffffff"; ctx.font = "18px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText(preguntas[currentQ].enunciado, canvas.width / 2, 150);

  // Barra lateral informativa
  ctx.fillStyle = "#fff"; ctx.font = "15px Minecraftia"; ctx.textAlign = "left";
  ctx.fillText(`Cargas Completadas: ${aciertos} / ${preguntas.length}`, 40, 575);
}

function drawFeedback() {
  if (feedbackTimer <= 0) return;
  ctx.fillStyle = "rgba(10, 15, 20, 0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = feedbackOk ? "#ffcc00" : "#ff4444";
  ctx.font = "26px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText(feedbackMsg, canvas.width / 2, canvas.height / 2);
}

function drawParticulas() {
  particulas.forEach(p => {
    ctx.fillStyle = p.color; ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * (p.life / p.maxLife), 0, Math.PI * 2); ctx.fill();
  });
}

function drawPausa() {
  ctx.fillStyle = "rgba(10, 15, 20, 0.75)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const bx = canvas.width / 2 - 125, by = canvas.height / 2 - 30;
  ctx.fillStyle = "#2c3e50"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3;
  roundRect(ctx, bx, by, 250, 60, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.font = "22px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("▶ Continuar", canvas.width / 2, by + 38);
}

function drawFinal() {
  ctx.fillStyle = "rgba(15, 20, 25, 0.98)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  estrellasFinal.forEach(e => {
    e.y += e.vy; if (e.y > canvas.height) e.y = -10;
    ctx.fillStyle = e.color; ctx.fillRect(e.x, e.y, e.r, e.r);
  });

  ctx.fillStyle = "#ffcc00"; ctx.font = "bold 36px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("¡PRODUCCIÓN COMPLETADA!", canvas.width / 2, canvas.height / 2 - 80);
  
  ctx.fillStyle = "#ffffff"; ctx.font = "22px Minecraftia";
  ctx.fillText(`Eficiencia de Operación: ${Math.round((aciertos / preguntas.length) * 100)}%`, canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillText(`Problemas Resueltos: ${aciertos} de ${preguntas.length}`, canvas.width / 2, canvas.height / 2 + 35);

  const bx = canvas.width / 2 - 125, by = 380;
  ctx.fillStyle = "#e74c3c"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3;
  roundRect(ctx, bx, by, 250, 54, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ffffff"; ctx.font = "20px Minecraftia";
  ctx.fillText("🔄 Reiniciar Fábrica", canvas.width / 2, by + 34);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x+r, y); c.lineTo(x+w-r, y); c.quadraticCurveTo(x+w, y, x+w, y+r);
  c.lineTo(x+w, y+h-r); c.quadraticCurveTo(x+w, y+h, x+w-r, y+h); c.lineTo(x+r, y+h);
  c.quadraticCurveTo(x, y+h, x, y+h-r); c.lineTo(x, y+r); c.quadraticCurveTo(x, y, x+r, y);
  c.closePath();
}

function resetGame() {
  aciertos = 0; currentQ = 0; juegoTerminado = false; pausado = false;
  colisionLock = false; feedbackTimer = 0; engranaje = null;
  generarVagonetas();
}

// ─── BUCLE PRINCIPAL (LOOP) ──────────────────────────────────────────────────
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFondo();
  if (!juegoTerminado) {
    drawVagonetas();
    drawEngranaje();
    drawFoxYGrua();
    drawHUD();
    drawFeedback();
  }
  drawParticulas();
  if (pausado && !juegoTerminado) drawPausa();
  if (juegoTerminado) drawFinal();
}

generarVagonetas();
window.onload = () => { gameLoop(); };