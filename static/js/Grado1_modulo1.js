// ============================================================
//  RETOMATE - Grado 1, Módulo 1: Contemos juntos
//  Juego: El zorrito atrapa frutas con la respuesta correcta
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ── PREGUNTAS DEL MÓDULO 1 ─────────────────────────────────
const preguntas = [
  { pregunta: "¿Cuánto es 2 + 3?",        correcta: 5,  opciones: [3, 5, 7] },
  { pregunta: "¿Cuánto es 4 + 1?",        correcta: 5,  opciones: [5, 6, 2] },
  { pregunta: "¿Cuánto es 1 + 1?",        correcta: 2,  opciones: [2, 3, 1] },
  { pregunta: "¿Cuánto es 3 + 3?",        correcta: 6,  opciones: [5, 6, 4] },
  { pregunta: "¿Cuánto es 7 + 2?",        correcta: 9,  opciones: [8, 9, 7] },
  { pregunta: "¿Cuánto es 5 + 5?",        correcta: 10, opciones: [9, 10, 8] },
  { pregunta: "¿Qué número sigue: 3, 4, ?",correcta: 5, opciones: [5, 6, 4] },
  { pregunta: "¿Cuánto es 8 - 3?",        correcta: 5,  opciones: [4, 5, 6] },
  { pregunta: "¿Cuánto es 10 - 4?",       correcta: 6,  opciones: [5, 6, 7] },
  { pregunta: "¿Cuánto es 6 + 3?",        correcta: 9,  opciones: [8, 9, 7] },
];

// ── FRUTAS (emoji + color de fondo) ───────────────────────
const FRUTAS = [
  { emoji: '🍎', color: '#ff6b6b' },
  { emoji: '🍌', color: '#ffd93d' },
  { emoji: '🍇', color: '#a855f7' },
  { emoji: '🍊', color: '#fb923c' },
  { emoji: '🍓', color: '#f43f5e' },
  { emoji: '🍉', color: '#4ade80' },
];

// ── ESTADO DEL JUEGO ────────────────────────────────────────
let preguntaActual = 0;
let aciertos = 0;
let errores  = 0;
let vidas    = 3;
let gameOver = false;
let ganado   = false;
let mensajeFlash = '';
let mensajeTimer = 0;
let guardado = false;

// ── ZORRITO ─────────────────────────────────────────────────
const zorrito = {
  x: canvas.width / 2 - 30,
  y: canvas.height - 90,
  w: 60,
  h: 70,
  vel: 3,
  moviendoIzq: false,
  moviendoDer: false,
  frameAnim: 0,
  frameTimer: 0,
};

// ── FRUTAS CAYENDO ───────────────────────────────────────────
let frutas = [];
let frameCount = 0;

function crearFrutas() {
  frutas = [];
  if (preguntaActual >= preguntas.length) return;
  const p = preguntas[preguntaActual];
  const opciones = [...p.opciones];
  // Mezclar posiciones
  const posX = [80, 320, 560];
  for (let i = posX.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [posX[i], posX[j]] = [posX[j], posX[i]];
  }
  const tipoFruta = FRUTAS[Math.floor(Math.random() * FRUTAS.length)];
  opciones.forEach((val, i) => {
    frutas.push({
      x: posX[i],
      y: -80 - i * 60,
      w: 80,
      h: 80,
      valor: val,
      speed: 0.8,
      fruta: tipoFruta,
      capturada: false,
      correcta: val === p.correcta,
    });
  });
}

// ── DIBUJAR ZORRITO ─────────────────────────────────────────
function dibujarZorrito(x, y, w, h) {
  const p = 3;
  const baseX = x;
  const baseY = y;

  ctx.save();

  // Cola
  ctx.fillStyle = "#e76f51";
  ctx.fillRect(baseX - 18, baseY + 36, 18, 9);

  ctx.fillStyle = "#f48c06";
  ctx.fillRect(baseX - 30, baseY + 30, 12, 9);

  ctx.fillStyle = "#fff";
  ctx.fillRect(baseX - 36, baseY + 27, 9, 6);

  // Cuerpo
  ctx.fillStyle = "#3fa34d";
  ctx.fillRect(baseX + 15, baseY + 24, 30, 30);

  // Cabeza
  ctx.fillStyle = "#f48c06";
  ctx.fillRect(baseX + 12, baseY + 3, 36, 27);

  // Orejas
  ctx.fillStyle = "#e85d04";
  ctx.fillRect(baseX + 12, baseY - 3, 9, 9);
  ctx.fillRect(baseX + 39, baseY - 3, 9, 9);

  // Patas
  ctx.fillStyle = "#264653";
  ctx.fillRect(baseX + 15, baseY + 48, 30, 15);

  // Zapatos animados
  const anim = Math.sin(frameCount * 0.2) * 2;

  ctx.fillStyle = "#1d3557";
  ctx.fillRect(baseX + 15, baseY + 63 + anim, 12, 6);
  ctx.fillRect(baseX + 33, baseY + 63 - anim, 12, 6);

  // Brazos
  ctx.fillStyle = "#f48c06";
  ctx.fillRect(baseX + 6, baseY + 24, 9, 15);
  ctx.fillRect(baseX + 45, baseY + 24, 9, 15);

  // Ojos
  ctx.fillStyle = "#000";
  ctx.fillRect(baseX + 21, baseY + 12, 6, 6);
  ctx.fillRect(baseX + 39, baseY + 12, 6, 6);

  // Boca
  ctx.fillRect(baseX + 27, baseY + 18, 12, 3);

  ctx.restore();
}

// ── DIBUJAR FRUTA ────────────────────────────────────────────
function dibujarFruta(f) {
  if (f.capturada) return;
  // Fondo circular
  ctx.fillStyle = f.fruta.color;
  ctx.beginPath();
  ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Emoji fruta
  ctx.font = '36px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(f.fruta.emoji, f.x + f.w / 2, f.y + f.h / 2 - 8);

  // Número
  ctx.font = 'bold 18px Arial';
  ctx.fillStyle = 'white';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.strokeText(String(f.valor), f.x + f.w / 2, f.y + f.h - 14);
  ctx.fillText(String(f.valor), f.x + f.w / 2, f.y + f.h - 14);
}

// ── DIBUJAR FONDO ────────────────────────────────────────────
function dibujarFondo() {
  // Cielo
  ctx.fillStyle = '#9cd1ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Nubes
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  [[80, 60, 70], [300, 40, 90], [600, 70, 60], [450, 30, 80]].forEach(([cx, cy, r]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.4, cy - r * 0.2, r * 0.4, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.4, cy - r * 0.1, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  });

  // Suelo verde
  ctx.fillStyle = '#5dbb63';
  ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

  // Flores en el suelo
  ['#ff6b6b', '#ffd93d', '#a855f7', '#fb923c'].forEach((color, i) => {
    const fx = 60 + i * 180;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(fx, canvas.height - 38, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(fx, canvas.height - 38, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Pasto
  ctx.strokeStyle = '#3a9940';
  ctx.lineWidth = 2;
  for (let gx = 0; gx < canvas.width; gx += 20) {
    ctx.beginPath();
    ctx.moveTo(gx, canvas.height - 40);
    ctx.lineTo(gx + 5, canvas.height - 52);
    ctx.lineTo(gx + 10, canvas.height - 40);
    ctx.stroke();
  }
}

// ── DIBUJAR HUD ───────────────────────────────────────────────
function dibujarHUD() {
  if (preguntaActual >= preguntas.length) return;
  const p = preguntas[preguntaActual];

  // Caja de pregunta
  ctx.fillStyle = 'rgba(26,82,118,0.9)';
  ctx.beginPath();
  ctx.roundRect(20, 10, canvas.width - 40, 54, 12);
  ctx.fill();

  ctx.font = 'bold 22px Comic Sans MS';
  ctx.fillStyle = '#ffd93d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(p.pregunta, canvas.width / 2, 37);

  // Vidas
  ctx.font = '22px serif';
  ctx.textAlign = 'left';
  for (let i = 0; i < vidas; i++) {
    ctx.fillText('❤️', 20 + i * 30, 80);
  }

  // Puntaje
  ctx.font = 'bold 16px Minecraftia, Arial';
  ctx.fillStyle = '#1a5276';
  ctx.textAlign = 'right';
  ctx.fillText(`✅ ${aciertos} / ${preguntas.length}`, canvas.width - 20, 80);
}

// ── MENSAJE FLASH ─────────────────────────────────────────────
function dibujarMensaje() {
  if (!mensajeFlash || mensajeTimer <= 0) return;
  ctx.globalAlpha = Math.min(1, mensajeTimer / 20);
  ctx.font = 'bold 36px Comic Sans MS';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 4;
  ctx.strokeText(mensajeFlash, canvas.width / 2, canvas.height / 2 - 40);
  ctx.fillStyle = mensajeFlash.includes('¡') ? '#ffd93d' : '#ff6b6b';
  ctx.fillText(mensajeFlash, canvas.width / 2, canvas.height / 2 - 40);
  ctx.globalAlpha = 1;
  mensajeTimer--;
}

// ── PANTALLA FINAL ────────────────────────────────────────────
function dibujarFinal() {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const titulo = ganado ? '🎉 ¡Lo lograste!' : '💔 ¡Inténtalo de nuevo!';
  const color  = ganado ? '#ffd93d' : '#ff6b6b';

  ctx.font = 'bold 40px Comic Sans MS';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(titulo, canvas.width / 2, canvas.height / 2 - 60);

  ctx.font = '24px Comic Sans MS';
  ctx.fillStyle = 'white';
  ctx.fillText(`Respuestas correctas: ${aciertos} de ${preguntas.length}`, canvas.width / 2, canvas.height / 2);

  const puntaje = Math.round((aciertos / preguntas.length) * 100);
  ctx.fillText(`Puntaje: ${puntaje}%`, canvas.width / 2, canvas.height / 2 + 40);

  // Botón reiniciar
  ctx.fillStyle = '#56d1a0';
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 100, canvas.height / 2 + 80, 200, 50, 12);
  ctx.fill();
  ctx.font = 'bold 20px Comic Sans MS';
  ctx.fillStyle = '#1a5276';
  ctx.fillText('▶ Jugar de nuevo', canvas.width / 2, canvas.height / 2 + 105);
}

// ── GUARDAR PROGRESO ──────────────────────────────────────────
async function guardarProgreso() {
  if (guardado) return;
  guardado = true;
  const puntaje = Math.round((aciertos / preguntas.length) * 100);
  try {
    await fetch('/guardar_progreso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unidad: 101, // grado 1, módulo 1
        aciertos,
        total: preguntas.length,
        puntaje,
      }),
    });
  } catch (e) { console.log('Error guardando progreso:', e); }
}

// ── COLISIÓN ──────────────────────────────────────────────────
function colisiona(z, f) {
  return (
    z.x < f.x + f.w &&
    z.x + z.w > f.x &&
    z.y < f.y + f.h &&
    z.y + z.h > f.y
  );
}

// ── LOOP PRINCIPAL ────────────────────────────────────────────
function loop() {
  frameCount++;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dibujarFondo();

  if (gameOver) {
    dibujarZorrito(zorrito.x, zorrito.y, zorrito.w, zorrito.h);
    dibujarFinal();
    requestAnimationFrame(loop);
    return;
  }

  // Mover zorrito
  if (zorrito.moviendoIzq && zorrito.x > 0)
    zorrito.x -= zorrito.vel;
  if (zorrito.moviendoDer && zorrito.x + zorrito.w < canvas.width)
    zorrito.x += zorrito.vel;

  // Mover y dibujar frutas
  let todasPasaron = true;
  frutas.forEach(f => {
    if (f.capturada) return;
    f.y += f.speed;

    // Colisión con zorrito
    if (colisiona(zorrito, f)) {
      f.capturada = true;
      if (f.correcta) {
        aciertos++;
        Sonidos.correcto();
        mensajeFlash = '¡Muy bien! 🌟';
        mensajeTimer = 45;
      } else {
        vidas--;
        Sonidos.incorrecto();
        mensajeFlash = '¡Uy! Esa no era 😅';
        mensajeTimer = 45;
        if (vidas <= 0) { gameOver = true; ganado = false; guardarProgreso(); }
      }
      // Siguiente pregunta
      preguntaActual++;
      if (preguntaActual >= preguntas.length) {
        gameOver = true;
        ganado = aciertos >= Math.ceil(preguntas.length * 0.6);
        if (ganado) Sonidos.ganar(); else Sonidos.perder();
        guardarProgreso();
      } else {
        crearFrutas();
      }
      return;
    }

    // Fruta pasó sin capturar
    if (f.y < canvas.height) todasPasaron = false;

    dibujarFruta(f);
  });

  // Si todas las frutas pasaron sin capturar ninguna → pierde vida
  const activas = frutas.filter(f => !f.capturada && f.y < canvas.height);
  if (activas.length === 0 && !gameOver && frutas.every(f => f.capturada || f.y >= canvas.height)) {
    const algunaCapturada = frutas.some(f => f.capturada);
    if (!algunaCapturada) {
      vidas--;
      Sonidos.incorrecto();
      mensajeFlash = '¡Se escaparon! 🏃';
      mensajeTimer = 45;
      if (vidas <= 0) { gameOver = true; ganado = false; Sonidos.perder(); guardarProgreso(); }
      else { crearFrutas(); }
    }
  }

  dibujarZorrito(zorrito.x, zorrito.y, zorrito.w, zorrito.h);
  dibujarHUD();
  dibujarMensaje();

  requestAnimationFrame(loop);
}

// ── REINICIAR ─────────────────────────────────────────────────
function reiniciar() {
  preguntaActual = 0;
  aciertos = 0;
  errores  = 0;
  vidas    = 3;
  gameOver = false;
  ganado   = false;
  guardado = false;
  mensajeFlash = '';
  mensajeTimer = 0;
  zorrito.x = canvas.width / 2 - 30;
  crearFrutas();
}

// ── CONTROLES TECLADO ─────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft')  zorrito.moviendoIzq = true;
  if (e.key === 'ArrowRight') zorrito.moviendoDer = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft')  zorrito.moviendoIzq = false;
  if (e.key === 'ArrowRight') zorrito.moviendoDer = false;
});

// ── CONTROLES TOUCH ───────────────────────────────────────────
const btnLeft  = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');

btnLeft.addEventListener('touchstart',  e => { e.preventDefault(); zorrito.moviendoIzq = true; });
btnLeft.addEventListener('touchend',    e => { e.preventDefault(); zorrito.moviendoIzq = false; });
btnRight.addEventListener('touchstart', e => { e.preventDefault(); zorrito.moviendoDer = true; });
btnRight.addEventListener('touchend',   e => { e.preventDefault(); zorrito.moviendoDer = false; });

// También con mouse para tablet con mouse
btnLeft.addEventListener('mousedown',  () => zorrito.moviendoIzq = true);
btnLeft.addEventListener('mouseup',   () => zorrito.moviendoIzq = false);
btnRight.addEventListener('mousedown', () => zorrito.moviendoDer = true);
btnRight.addEventListener('mouseup',  () => zorrito.moviendoDer = false);

// ── CLIC EN CANVAS (reiniciar) ────────────────────────────────
canvas.addEventListener('click', e => {
  if (!gameOver) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const cx = (e.clientX - rect.left) * scaleX;
  const cy = (e.clientY - rect.top)  * scaleY;
  // Zona del botón reiniciar
  if (cx > canvas.width/2 - 100 && cx < canvas.width/2 + 100 &&
      cy > canvas.height/2 + 80  && cy < canvas.height/2 + 130) {
    reiniciar();
  }
});
canvas.addEventListener('touchend', e => {
  if (!gameOver) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const t = e.changedTouches[0];
  const cx = (t.clientX - rect.left) * scaleX;
  const cy = (t.clientY - rect.top)  * scaleY;
  if (cx > canvas.width/2 - 100 && cx < canvas.width/2 + 100 &&
      cy > canvas.height/2 + 80  && cy < canvas.height/2 + 130) {
    reiniciar();
  }
});

// ── INICIAR AUDIO (los navegadores requieren un gesto del usuario) ──
let _audioIniciado = false;
function _iniciarAudio() {
  if (!_audioIniciado) { _audioIniciado = true; Sonidos.iniciar(1); }
}
canvas.addEventListener('click', _iniciarAudio);
canvas.addEventListener('touchstart', _iniciarAudio, { passive: true });
document.addEventListener('keydown', _iniciarAudio, { once: true });

// ── INICIAR ───────────────────────────────────────────────────
crearFrutas();
loop();