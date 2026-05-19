// 🎮 RETOMATE - Grado 4 | Unidad 3: Decimales
// 🌌 "Zorro el Coleccionista de Luciérnagas"
// El zorro gira en el centro y atrapa luciérnagas que orbitan a su alrededor.
// Controles: ← → rotar zorro | Espacio lanzar red de luz | P pausar

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
let redMagica      = null; // Proyectil que sale del centro
let luciernagas    = [];   // Objetivos que orbitan

// ─── SONIDOS ──────────────────────────────────────────────────────────────────
const sonidoLanzar   = new Audio("https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg");
const sonidoCorrecto = new Audio("https://actions.google.com/sounds/v1/cartoon/clime_up_and_down.ogg");
const sonidoError    = new Audio("https://actions.google.com/sounds/v1/cartoon/glitch_error.ogg");
const musicaFondo    = new Audio(""); // Pega aquí tu link ambiental nocturno
musicaFondo.loop = true; musicaFondo.volume = 0.15;

// ─── BANCO DE 10 PREGUNTAS (DECIMALES - GRADO 4) ──────────────────────────────
const preguntas = [
  { clave: "0.5",  enunciado: "¿Cuál representa 5 décimas?", opciones: ["0.5", "0.05", "5.0"], respuesta: "0.5" },
  { clave: "2/10", enunciado: "Convierte 2/10 a decimal", opciones: ["0.02", "2.0", "0.2"], respuesta: "0.2" },
  { clave: "0.25", enunciado: "¿Cuál representa 25 centésimas?", opciones: ["2.5", "0.25", "0.025"], respuesta: "0.25" },
  { clave: "0.8",  enunciado: "Ocho décimas se escribe como:", opciones: ["0.08", "8.0", "0.8"], respuesta: "0.8" },
  { clave: "75/100", enunciado: "Convierte 75/100 a decimal", opciones: ["0.75", "7.5", "0.075"], respuesta: "0.75" },
  { clave: "mayor", enunciado: "¿Qué número es MAYOR?", opciones: ["0.4", "0.09", "0.15"], respuesta: "0.4" },
  { clave: "1.2",  enunciado: "Un entero con dos décimas es:", opciones: ["0.12", "1.2", "12.0"], respuesta: "1.2" },
  { clave: "0.01", enunciado: "¿Cuál representa UNA centésima?", opciones: ["0.1", "0.01", "1.0"], respuesta: "0.01" },
  { clave: "0.50", enunciado: "0.5 es EQUIVALENTE a:", opciones: ["0.05", "0.50", "5.0"], respuesta: "0.50" },
  { clave: "3.4",  enunciado: "3 enteros y 4 décimas:", opciones: ["3.4", "0.34", "3.04"], respuesta: "3.4" }
];

// ─── CONFIGURACIÓN DEL PERSONAJE (ZORRO CENTRAL) ──────────────────────────────
const fox = {
  x: canvas.width / 2,
  y: canvas.height / 2 + 30,
  angle: 0, // Ángulo de rotación inicial en radianes
  rotSpeed: 0.07
};

function generarLuciernagas() {
  luciernagas = [];
  const q = preguntas[currentQ];
  const radioOrbita = 230;
  
  q.opciones.forEach((op, index) => {
    // Distribución perfecta de los 3 objetivos en el círculo (0, 120 y 240 grados)
    let anguloInicial = (index * (Math.PI * 2 / 3));
    luciernagas.push({
      angle: anguloInicial,
      dist: radioOrbita,
      texto: op,
      correcta: op === q.respuesta,
      r: 35,
      speed: 0.018 + (Math.random() * 0.005),
      color: `hsl(${index * 120}, 85%, 65%)`,
      hit: false
    });
  });
}

function crearParticulas(x, y, color, cantidad = 20) {
  for (let i = 0; i < cantidad; i++) {
    particulas.push({
      x, y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 25 + Math.random() * 10, maxLife: 35,
      color: color,
      r: 1 + Math.random() * 3
    });
  }
}

// ─── CONTROLES ────────────────────────────────────────────────────────────────
const keys = {};
window.addEventListener("keydown", e => {
  keys[e.key] = true;
  
  // Evitar scroll con espacio y flechas del teclado
  if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && e.target === document.body) {
    e.preventDefault();
  }
  
  if ((e.key === "p" || e.key === "P") && !juegoTerminado) {
    pausado = !pausado;
    pausado ? musicaFondo.pause() : (musicaFondo.src && musicaFondo.play());
  }

  // LANZAR RED CON ESPACIO (Usa exactamente el ángulo hacia donde apunta el zorro)
  if (e.key === " " && !redMagica && feedbackTimer <= 0 && !juegoTerminado && !pausado) {
    redMagica = { 
        x: fox.x, 
        y: fox.y, 
        angle: fox.angle - Math.PI / 2, // Ajuste de compensación para disparar hacia la nariz
        dist: 0, 
        maxDist: 340, 
        speed: 13 
    };
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

  // Rotación del Zorro (360 grados libres)
  if (keys["ArrowLeft"])  fox.angle -= fox.rotSpeed;
  if (keys["ArrowRight"]) fox.angle += fox.rotSpeed;

  // Actualizar Luciérnagas (Órbita circular)
  luciernagas.forEach(l => {
    if (!l.hit) {
      l.angle += l.speed;
      l.x = fox.x + Math.cos(l.angle) * l.dist;
      l.y = fox.y + Math.sin(l.angle) * l.dist;
    }
  });

  // Movimiento de la Red Mágica
  if (redMagica) {
    redMagica.dist += redMagica.speed;
    let rx = fox.x + Math.cos(redMagica.angle) * redMagica.dist;
    let ry = fox.y + Math.sin(redMagica.angle) * redMagica.dist;

    // Chispas del rastro de luz
    if (tiempo % 2 === 0) {
      particulas.push({
        x: rx, y: ry, vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2, life: 12, maxLife: 12, color: "#fff", r: 1.5
      });
    }

    // Colisión con luciérnagas
    luciernagas.forEach(l => {
      if (!redMagica || colisionLock || l.hit) return;

      let dx = rx - l.x;
      let dy = ry - l.y;
      let distCol = Math.sqrt(dx*dx + dy*dy);

      if (distCol < l.r + 12) {
        colisionLock = true;
        l.hit = true;
        crearParticulas(l.x, l.y, l.color, 25);
        crearParticulas(l.x, l.y, "#ffffff", 15);

        if (l.correcta) {
          aciertos++;
          feedbackMsg = "¡Luciérnaga Atrapada! ✨🧤";
          feedbackOk = true;
          if (sonidoCorrecto) { sonidoCorrecto.currentTime = 0; sonidoCorrecto.play(); }
        } else {
          feedbackMsg = `¡Se escapó! El decimal era ${preguntas[currentQ].respuesta} 🪵`;
          feedbackOk = false;
          if (sonidoError) { sonidoError.currentTime = 0; sonidoError.play(); }
        }

        feedbackTimer = 90;
        redMagica = null;
        setTimeout(() => { siguientePregunta(); }, 1100);
      }
    });

    if (redMagica && redMagica.dist > redMagica.maxDist) redMagica = null;
  }

  // Partículas
  particulas.forEach((p, idx) => {
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.life <= 0) particulas.splice(idx, 1);
  });
}

// ─── PERSISTENCIA CON EL SERVIDOR FLASK (GRADO 4 UNIDAD 3) ───────────────────
function siguientePregunta() {
  currentQ++;
  redMagica = null;
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
        r: 2 + Math.random() * 3,
        color: ["#00ffcc", "#ffffff", "#ffeaa7", "#a29bfe"][Math.floor(Math.random() * 4)]
      });
    }
    const puntaje = (aciertos / preguntas.length) * 100;
    
    fetch("/guardar_progreso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grado: 4, unidad: 3, aciertos, total: preguntas.length, puntaje })
    })
    .then(r => r.json())
    .then(d => console.log("✅ Progreso de Decimales guardado con éxito:", d))
    .catch(e => console.error("❌ Error salvando datos G4U3:", e));
  } else {
    generarLuciernagas();
  }
}

// ─── GRÁFICOS Y RENDERIZADO ──────────────────────────────────────────────────
function drawFondo() {
  // Cielo nocturno estrellado profundo
  let grad = ctx.createRadialGradient(fox.x, fox.y, 40, fox.x, fox.y, 550);
  grad.addColorStop(0, "#16162b"); grad.addColorStop(1, "#090912");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Siluetas de pinos del bosque de fondo
  ctx.fillStyle = "rgba(10, 15, 28, 0.4)";
  for(let i = -50; i < canvas.width + 100; i += 130) {
    ctx.beginPath(); 
    ctx.moveTo(i, 600); 
    ctx.lineTo(i + 65, 240); 
    ctx.lineTo(i + 130, 600); 
    ctx.fill();
  }
}

function drawLuciernagas() {
  luciernagas.forEach(l => {
    if (l.hit) return;
    ctx.save();
    
    // Aura brillante exterior
    ctx.shadowBlur = 22; ctx.shadowColor = l.color;
    ctx.fillStyle = l.color; ctx.beginPath();
    ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2); ctx.fill();
    
    // Núcleo central blanco brillante
    ctx.shadowBlur = 0; ctx.fillStyle = "#ffffff"; ctx.beginPath();
    ctx.arc(l.x, l.y, l.r - 11, 0, Math.PI * 2); ctx.fill();
    
    // Texto del número decimal
    ctx.fillStyle = "#111111"; ctx.font = "bold 21px Minecraftia";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(l.texto, l.x, l.y + 2);
    
    ctx.restore();
  });
}

function drawRed() {
  if (!redMagica) return;
  let rx = fox.x + Math.cos(redMagica.angle) * redMagica.dist;
  let ry = fox.y + Math.sin(redMagica.angle) * redMagica.dist;

  // Hilo o haz de luz conector
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(fox.x, fox.y - 10); ctx.lineTo(rx, ry); ctx.stroke();

  // Esfera de la red mágica expandible
  ctx.fillStyle = "rgba(0, 255, 204, 0.35)"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(rx, ry, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

function drawFox() {
  // 1. Dibujamos el tronco base fijo en el suelo (No gira, evita mareos visuales)
  ctx.fillStyle = "#4a2f13"; ctx.strokeStyle = "#2c1b0a"; ctx.lineWidth = 3;
  roundRect(ctx, fox.x - 45, fox.y + 15, 90, 32, 6); ctx.fill(); ctx.stroke();

  ctx.save();
  // 2. Trasladamos el origen al centro exacto del zorro y aplicamos rotación
  ctx.translate(fox.x, fox.y);
  ctx.rotate(fox.angle);

  // Cuerpo (Centrado perfectamente en x:0, y:0 para un giro limpio de pivote)
  ctx.fillStyle = "#e66000"; 
  ctx.fillRect(-18, -22, 36, 44);
  
  // Pecho Blanco
  ctx.fillStyle = "#ffffff"; 
  ctx.fillRect(-12, -10, 24, 24);
  
  // Cabeza orientada hacia el frente (Norte de la rotación)
  ctx.fillStyle = "#e66000"; 
  ctx.fillRect(-14, -46, 28, 24);
  
  // Orejas puntiagudas
  ctx.beginPath(); ctx.moveTo(-14,-46); ctx.lineTo(-19,-60); ctx.lineTo(-5,-46); ctx.fill();
  ctx.beginPath(); ctx.moveTo(14,-46); ctx.lineTo(19,-60); ctx.lineTo(5,-46); ctx.fill();
  
  // Ojos astutos y Nariz en la punta superior
  ctx.fillStyle = "#111111"; 
  ctx.fillRect(-7, -37, 4, 5); 
  ctx.fillRect(3, -37, 4, 5); 
  ctx.fillRect(-2, -28, 4, 4); // Nariz/Hocico

  ctx.restore();

  // 3. Texto del decimal central impreso encima, plano para que no rote de cabeza
  ctx.fillStyle = "#2d3436"; 
  ctx.font = "bold 15px Minecraftia"; 
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(preguntas[currentQ].clave, fox.x, fox.y + 2);
}

function drawHUD() {
  // Marco superior del enigma
  ctx.fillStyle = "rgba(26, 26, 43, 0.85)"; ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 3;
  roundRect(ctx, 70, 20, canvas.width - 140, 72, 14); ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#ffffff"; ctx.font = "bold 21px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText(preguntas[currentQ].enunciado, canvas.width / 2, 62);

  // Contador inferior
  ctx.font = "16px Minecraftia"; ctx.textAlign = "left";
  ctx.fillText(`✨ Luciérnagas en el Frasco: ${aciertos} / ${preguntas.length}`, 40, 575);
}

function drawFeedback() {
  if (feedbackTimer <= 0) return;
  ctx.fillStyle = "rgba(5, 5, 10, 0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = feedbackOk ? "#00ffcc" : "#ff4757";
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
  ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const bx = canvas.width / 2 - 125, by = canvas.height / 2 - 30;
  ctx.fillStyle = "#16162b"; ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 3;
  roundRect(ctx, bx, by, 250, 60, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#00ffcc"; ctx.font = "20px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("▶ Continuar", canvas.width / 2, by + 38);
}

function drawFinal() {
  ctx.fillStyle = "#090912"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  estrellasFinal.forEach(e => {
    e.y += e.vy; if (e.y > canvas.height) e.y = -10;
    ctx.fillStyle = e.color; ctx.fillRect(e.x, e.y, e.r, e.r);
  });

  ctx.fillStyle = "#00ffcc"; ctx.font = "bold 34px Minecraftia"; ctx.textAlign = "center";
  ctx.fillText("¡BOSQUE TOTALMENTE ILUMINADO!", canvas.width / 2, canvas.height / 2 - 80);
  
  ctx.fillStyle = "#ffffff"; ctx.font = "20px Minecraftia";
  ctx.fillText(`Eficiencia del Frasco: ${Math.round((aciertos / preguntas.length) * 100)}%`, canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillText(`Atrapadas con éxito: ${aciertos} de ${preguntas.length}`, canvas.width / 2, canvas.height / 2 + 35);

  const bx = canvas.width / 2 - 125, by = 380;
  ctx.fillStyle = "#00ffcc"; ctx.fillRect(bx, by, 250, 54);
  ctx.fillStyle = "#000000"; ctx.font = "bold 18px Minecraftia";
  ctx.fillText("🔄 Reiniciar Caza", canvas.width / 2, by + 34);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x+r, y); c.lineTo(x+w-r, y); c.quadraticCurveTo(x+w, y, x+w, y+r);
  c.lineTo(x+w, y+h-r); c.quadraticCurveTo(x+w, y+h, x+w-r, y+h); c.lineTo(x+r, y+h);
  c.quadraticCurveTo(x, y+h, x, y+h-r); c.lineTo(x, y+r); c.quadraticCurveTo(x, y, x+r, y);
  c.closePath();
}

function resetGame() {
  aciertos = 0; currentQ = 0; juegoTerminado = false; pausado = false;
  colisionLock = false; feedbackTimer = 0; redMagica = null;
  generarLuciernagas();
}

// ─── LOOP PRINCIPAL ───────────────────────────────────────────────────────────
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFondo();
  if (!juegoTerminado) {
    drawLuciernagas();
    drawRed();
    drawFox();
    drawHUD();
    drawFeedback();
  }
  drawParticulas();
  if (pausado && !juegoTerminado) drawPausa();
  if (juegoTerminado) drawFinal();
}

generarLuciernagas();
window.onload = () => { gameLoop(); };