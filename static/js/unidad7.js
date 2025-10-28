// 🎮 RETOMATE - Unidad 7: Razón, Proporción y Porcentaje
// Versión Zorrito + Fondo N3-A (ciudad pixel-art colorida) + Pausa + Sonidos + Envío de puntaje
// Autores: Laura Nataly & Diego Andrés - 2025 (adaptado para Unidad 7)

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 600;

// === CONFIGURACIÓN GENERAL ===
const floorY = 530;
let aciertos = 0;
let currentQuestion = 0;
let bloques = [];
let particulas = [];
let estrellasFinal = [];
let juegoTerminado = false;
let pausado = false;
let colisionLock = false;

// === SONIDOS ===
const sonidoSalto = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");
const sonidoCorrecto = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const sonidoError = new Audio("https://actions.google.com/sounds/v1/cartoon/concussive_guitar_hit.ogg");

// === MÚSICA DE FONDO (misma que Unidades 1 y 5) ===
const musicaFondo = new Audio("/static/sounds/fondo.mp3");
musicaFondo.volume = 0.35;
musicaFondo.loop = true;

sonidoSalto.volume = 0.5;
sonidoCorrecto.volume = 0.6;
sonidoError.volume = 0.5;

// === PERSONAJE ===
let fox = {
  x: 100, y: floorY - 40,
  w: 40, h: 40,
  vy: 0,
  grounded: true
};

// === FONDO PIXEL-ART CIUDAD N3-A ===
const bgImage = new Image();
bgImage.src = "/static/img/city_pixel_n3a.jpg"; // coloca aquí la imagen pixel-art colorida (segunda imagen que elegiste)
let parallaxX = 0;

// edificios simplificados para parallax (dibujo por canvas en caso de no cargar imagen)
const buildings = [];
for (let i = 0; i < 12; i++) {
  buildings.push({
    x: i * 180,
    w: 160,
    h: 80 + Math.random() * 120,
    color: `hsl(${Math.floor(180 + Math.random() * 60)}, 60%, ${40 + Math.random()*20}%)`
  });
}

// === PREGUNTAS (10 preguntas: 4 Razón, 3 Proporción, 3 Porcentaje) ===
const preguntas = [
  // RAZÓN (4)
  { pregunta: "En una caja hay 8 lápices rojos y 4 lápices azules. ¿Cuál es la razón rojo : azul?", opciones: ["2:1", "1:2", "8:4"], correcta: 0 },
  { pregunta: "En un grupo de 12 estudiantes, 3 juegan fútbol y 9 juegan baloncesto. ¿Razón fútbol : baloncesto?", opciones: ["3:9", "1:3", "3:1"], correcta: 1 },
  { pregunta: "Si hay 10 manzanas y 5 naranjas, ¿cuál es la razón manzanas : naranjas?", opciones: ["5:10", "2:1", "1:2"], correcta: 1 },
  { pregunta: "En una bolsa hay 6 canicas verdes y 2 rojas. ¿Razón verde : rojo?", opciones: ["3:1", "1:3", "6:2"], correcta: 0 },

  // PROPORCIÓN (3) — regla de 3 básica
  { pregunta: "Si 2 cuadernos cuestan $8.000, ¿cuánto cuestan 6 cuadernos?", opciones: ["$24.000", "$14.000", "$16.000"], correcta: 0 },
  { pregunta: "Si 3 vasos se llenan con 9 litros, ¿cuántos litros llenan 1 vaso?", opciones: ["3 litros", "27 litros", "0.33 litros"], correcta: 0 },
  { pregunta: "Si 4 camisetas cuestan $60.000, ¿cuánto cuesta 1 camiseta?", opciones: ["$15.000", "$240.000", "$30.000"], correcta: 0 },

  // PORCENTAJE (3)
  { pregunta: "Un cuaderno cuesta $10.000 y tiene 50% de descuento. ¿Cuánto pagarás?", opciones: ["$5.000", "$15.000", "$8.000"], correcta: 0 },
  { pregunta: "¿Cuál es el 25% de 200?", opciones: ["50", "25", "75"], correcta: 0 },
  { pregunta: "Si una tienda aplica 10% a $20.000, ¿cuánto es el valor del 10%?", opciones: ["$2.000", "$200", "$20.000"], correcta: 0 }
];

// === GENERAR BLOQUES DE OPCIONES ===
function generarBloquesPregunta() {
  if (juegoTerminado) return;
  if (currentQuestion >= preguntas.length) return;

  const opciones = preguntas[currentQuestion].opciones;
  bloques = [];

  const startY = 350;
  const separacion = 250;

  for (let i = 0; i < opciones.length; i++) {
    bloques.push({
      x: 200 + i * separacion,
      y: startY,
      w: 140,
      h: 64,
      texto: opciones[i],
      correcta: i === preguntas[currentQuestion].correcta,
      vx: 2 * (Math.random() < 0.5 ? 1 : -1)
    });
  }
}

// === DIBUJAR FONDO CIUDAD PIXEL-ART / PARALLAX ===
function drawCityBackground() {
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // si la imagen carga, la usamos (se estira para cubrir)
  if (bgImage.complete && bgImage.naturalWidth !== 0) {
    // parallax horizontal lento
    parallaxX -= 0.3;
    if (parallaxX < -canvas.width) parallaxX = 0;
    // dibujar imagen dos veces para loop
    ctx.drawImage(bgImage, parallaxX, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImage, parallaxX + canvas.width, 0, canvas.width, canvas.height);
  } else {
    // fallback: dibujar edificios simples (pixel-like)
    ctx.fillStyle = "#061225";
    ctx.fillRect(0, 0, canvas.width, 220);

    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      const bx = (b.x + parallaxX * 0.5 * (i % 3 + 1)) % (canvas.width + 200);
      ctx.fillStyle = b.color;
      ctx.fillRect(bx - 40, canvas.height - b.h - 120, b.w, b.h);
      // ventanas (pixel)
      for (let wy = 20; wy < b.h; wy += 22) {
        for (let wx = 8; wx < b.w - 8; wx += 22) {
          if (Math.random() > 0.6) {
            ctx.fillStyle = "#fff5a8";
            ctx.fillRect(bx - 40 + wx, canvas.height - b.h - 120 + wy, 10, 10);
          }
        }
      }
    }
    parallaxX -= 0.2;
  }

  // suelo / calle
  ctx.fillStyle = "#2b2b2b";
  ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);
  // línea amarilla
  for (let i = 0; i < canvas.width; i += 40) {
    ctx.fillStyle = "#ffd12a";
    ctx.fillRect(i + (Date.now() / 50 % 40), floorY + 28, 24, 6);
  }
}

// === DIBUJAR SUELO (oscuro sobre ciudad) ===
function drawGround() {
  ctx.fillStyle = "#173b2b";
  ctx.fillRect(0, floorY, canvas.width, 60);
  ctx.fillStyle = "#0f291d";
  ctx.fillRect(0, floorY + 40, canvas.width, 60);
}

// === DIBUJAR ZORRITO ===
// === DIBUJAR ZORRITO TIERNO PIXEL ART ===
function drawFox() {
  // Cabeza grande
  ctx.fillStyle = "#ff9933";
  ctx.fillRect(fox.x + 4, fox.y, 28, 24);

  // Orejas pequeñas
  ctx.fillStyle = "#ff8000";
  ctx.fillRect(fox.x + 6, fox.y - 5, 6, 5);
  ctx.fillRect(fox.x + 24, fox.y - 5, 6, 5);
  ctx.fillStyle = "#000";
  ctx.fillRect(fox.x + 6, fox.y - 5, 3, 3);
  ctx.fillRect(fox.x + 27, fox.y - 5, 3, 3);

  // Mejillas blancas / hocico
  ctx.fillStyle = "#fff0cc";
  ctx.fillRect(fox.x + 10, fox.y + 14, 16, 8);

  // Nariz
  ctx.fillStyle = "#000";
  ctx.fillRect(fox.x + 17, fox.y + 13, 4, 3);

  // Ojos (más separados)
  ctx.fillRect(fox.x + 10, fox.y + 10, 3, 3);
  ctx.fillRect(fox.x + 23, fox.y + 10, 3, 3);

  // Cuerpo pequeño
  ctx.fillStyle = "#3ca34a";
  ctx.fillRect(fox.x + 8, fox.y + 22, 20, 14);

  // Brazos cortos
  ctx.fillStyle = "#ff9933";
  ctx.fillRect(fox.x + 4, fox.y + 24, 4, 8);
  ctx.fillRect(fox.x + 28, fox.y + 24, 4, 8);

  // Pantaloncito
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(fox.x + 8, fox.y + 36, 20, 6);

  // Patitas
  ctx.fillRect(fox.x + 10, fox.y + 42, 6, 4);
  ctx.fillRect(fox.x + 20, fox.y + 42, 6, 4);

  // Cola (más gruesa, con punta blanca)
  ctx.fillStyle = "#ff9933";
  ctx.fillRect(fox.x + 28, fox.y + 34, 10, 5);
  ctx.fillStyle = "#fff";
  ctx.fillRect(fox.x + 36, fox.y + 34, 4, 5);

  // Contorno general
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(fox.x + 4, fox.y, 28, 24); // cabeza
  ctx.strokeRect(fox.x + 8, fox.y + 22, 20, 20); // cuerpo
}



// === DIBUJAR BLOQUES ===
function drawBlock(b) {
  ctx.fillStyle = b.correcta ? "#8fbf9e" : "#8fbf9e";
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.strokeRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = "#000";
  ctx.font = "18px Minecraftia";
  ctx.textAlign = "center";
  const lines = ("" + b.texto).split("\n");
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], b.x + b.w / 2, b.y + 30 + i * 20);
  }
  ctx.textAlign = "left";
}

// === HUD (wrap para preguntas largas) ===
function drawHUD() {
  ctx.fillStyle = "#fff";
  ctx.font = "20px Minecraftia";
  ctx.textAlign = "left";
  ctx.fillText(`⭐ Aciertos: ${aciertos}`, 30, 50);
  ctx.fillText(`Pregunta ${Math.min(currentQuestion + 1, preguntas.length)}/${preguntas.length}`, 30, 80);

  if (!juegoTerminado && currentQuestion < preguntas.length) {
    const pregunta = preguntas[currentQuestion].pregunta;
    ctx.fillStyle = "#fff";
    ctx.font = "26px Minecraftia";
    ctx.textAlign = "center";
    
    const px = canvas.width / 2;
    const maxW = 820;
    if (pregunta.includes("\n")) {
      const lines = pregunta.split("\n");
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], px, 150 + i * 34);
      }
    } else {
      // automatic wrap
      const words = pregunta.split(' ');
      let line = '';
      let lines = [];
      for (let i = 0; i < words.length; i++) {
        const test = line + words[i] + ' ';
        if (ctx.measureText(test).width > maxW && line.length > 0) {
          lines.push(line.trim());
          line = words[i] + ' ';
        } else {
          line = test;
        }
      }
      lines.push(line.trim());
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], px, 130 + i * 34);
      }
    }
    ctx.textAlign = "left";
  }
}

// === PARTÍCULAS ===
function crearParticulas(x, y, color) {
  for (let i = 0; i < 16; i++) {
    particulas.push({
      x, y,
      vx: (Math.random() * 4) - 2,
      vy: (Math.random() * -3),
      life: 50,
      color
    });
  }
}
function drawParticulas() {
  particulas.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 4, 4);
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08;
    p.life--;
  });
  particulas = particulas.filter(p => p.life > 0);
}

// === ACTUALIZACIÓN DE JUEGO ===
function update() {
  if (juegoTerminado) return;

  if (!fox.grounded) {
    fox.vy += 0.8;
    fox.y += fox.vy;
    if (fox.y >= floorY - fox.h) {
      fox.y = floorY - fox.h;
      fox.grounded = true;
      fox.vy = 0;
    }
  }

  bloques.forEach(b => {
    b.x += b.vx;
    if (b.x <= 20 || b.x + b.w >= canvas.width - 20) b.vx *= -1;
  });

  for (let b of bloques) {
    if (
      fox.x < b.x + b.w &&
      fox.x + fox.w > b.x &&
      fox.y < b.y + b.h &&
      fox.y + fox.h > b.y
    ) {
      if (colisionLock) break;
      colisionLock = true;

      if (b.correcta) {
        aciertos++;
        sonidoCorrecto.currentTime = 0;
        sonidoCorrecto.play();
        crearParticulas(b.x + b.w / 2, b.y + 10, "#FFD700");
      } else {
        sonidoError.currentTime = 0;
        sonidoError.play();
        crearParticulas(b.x + b.w / 2, b.y + 10, "#ff5555");
      }

      setTimeout(() => {
        siguientePregunta();
        colisionLock = false;
      }, 700);
      break;
    }
  }
}

// === CONTROLES ===
document.addEventListener("keydown", (e) => {
  if (juegoTerminado) return;
  if (e.key === "ArrowRight") fox.x = Math.min(fox.x + 25, canvas.width - fox.w);
  if (e.key === "ArrowLeft") fox.x = Math.max(fox.x - 25, 0);
  if (e.key === "ArrowUp" && fox.grounded) {
    fox.vy = -13;
    fox.grounded = false;
    sonidoSalto.currentTime = 0;
    sonidoSalto.play();
  }
  if (e.key === "p" || e.key === "P") {
    pausado = !pausado;
    if (pausado) musicaFondo.pause();
    else musicaFondo.play();
  }
});

// === SIGUIENTE PREGUNTA ===
function siguientePregunta() {
  currentQuestion++;
  if (currentQuestion >= preguntas.length) {
    juegoTerminado = true;
    estrellasFinal = [];
    for (let i = 0; i < 120; i++) {
      estrellasFinal.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        vy: 1 + Math.random() * 2
      });
    }

    // === 🔹 Enviar puntaje al servidor ===
    const totalPreguntas = preguntas.length;
    const puntaje = (aciertos / totalPreguntas) * 100;

    fetch("/guardar_progreso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unidad: 7,
        aciertos: aciertos,
        total: totalPreguntas,
        puntaje: puntaje
      })
    })
    .then(res => res.json())
    .then(data => console.log("✅ Progreso guardado:", data))
    .catch(err => console.error("❌ Error:", err));
  } else {
    generarBloquesPregunta();
  }
}

// === DIBUJAR ESCENA ===
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCityBackground();
  drawGround();
  drawHUD();
  bloques.forEach(drawBlock);
  drawFox();
  drawParticulas();

  // Pausa
  if (pausado && !juegoTerminado) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFD700";
    ctx.font = "42px Minecraftia";
    ctx.textAlign = "center";
    ctx.fillText("⏸️ Juego en pausa", canvas.width / 2, canvas.height / 2 - 40);

    // botón para continuar
    const btnW = 220, btnH = 60;
    const bx = canvas.width / 2 - btnW / 2;
    const by = canvas.height / 2;
    ctx.fillStyle = "#3d9435";
    ctx.fillRect(bx, by, btnW, btnH);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, btnW, btnH);
    ctx.fillStyle = "#fff";
    ctx.font = "26px Minecraftia";
    ctx.fillText("▶️ Continuar", canvas.width / 2, by + 38);
    ctx.textAlign = "left";
  }

  if (juegoTerminado) {
    drawEstrellasFinal();
    const panelW = 560, panelH = 220;
    const px = (canvas.width - panelW) / 2;
    const py = (canvas.height - panelH) / 2;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(px, py, panelW, panelH);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 4;
    ctx.strokeRect(px + 6, py + 6, panelW - 12, panelH - 12);
    ctx.fillStyle = "#FFD700";
    ctx.font = "42px Minecraftia";
    ctx.textAlign = "center";
    // Mensaje final (opción A seleccionada previamente)
    ctx.fillText("🎉 ¡Juego Completado!", canvas.width / 2, py + 70);
    ctx.font = "28px Minecraftia";
    ctx.fillText(`⭐ Aciertos: ${aciertos}/${preguntas.length}`, canvas.width / 2, py + 120);

    // Botón Reiniciar
    const btnW = 200, btnH = 56;
    const bx = canvas.width / 2 - btnW / 2;
    const by = py + 140;
    ctx.fillStyle = "#3d9435";
    ctx.fillRect(bx, by, btnW, btnH);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, btnW, btnH);
    ctx.fillStyle = "#fff";
    ctx.font = "22px Minecraftia";
    ctx.fillText("🔁 Reiniciar", canvas.width / 2, by + 36);
  }
}

// === ESTRELLAS FINALES ===
function drawEstrellasFinal() {
  estrellasFinal.forEach(e => {
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
    ctx.fill();
    e.y += e.vy;
    if (e.y > canvas.height + 10) e.y = -10;
  });
}

// === REINICIAR ===
function resetGame() {
  aciertos = 0;
  currentQuestion = 0;
  bloques = [];
  particulas = [];
  estrellasFinal = [];
  juegoTerminado = false;
  pausado = false;
  fox.x = 100;
  fox.y = floorY - fox.h;
  fox.vy = 0;
  fox.grounded = true;
  generarBloquesPregunta();
}

// === CLICK BOTONES ===
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (pausado && !juegoTerminado) {
    const btnW = 220, btnH = 60;
    const bx = canvas.width / 2 - btnW / 2;
    const by = canvas.height / 2;
    if (x >= bx && x <= bx + btnW && y >= by && y <= by + btnH) {
      pausado = false;
      musicaFondo.play();
    }
  }

  if (juegoTerminado) {
    const panelW = 560, panelH = 220;
    const py = (canvas.height - panelH) / 2;
    const btnW = 200, btnH = 56;
    const bx = canvas.width / 2 - btnW / 2;
    const by = py + 140;
    if (x >= bx && x <= bx + btnW && y >= by && y <= by + btnH) {
      resetGame();
    }
  }
});

// === LOOP PRINCIPAL ===
function gameLoop() {
  if (!pausado) update();
  draw();
  requestAnimationFrame(gameLoop);
}

// === INICIO ===
resetGame();
gameLoop();
musicaFondo.play().catch(() => {
  document.addEventListener("keydown", () => musicaFondo.play(), { once: true });
});
