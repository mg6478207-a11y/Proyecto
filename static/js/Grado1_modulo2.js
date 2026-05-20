// ============================================================
//  RETOMATE - Grado 1, Módulo 2: Sumas Divertidas
//  Juego: El zorrito en cohete vuela hacia la nube correcta
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ── PREGUNTAS ────────────────────────────────────────────────
const preguntas = [
  { pregunta: '2 + 2 = ?',  correcta: 4,  opciones: [3, 4, 5]  },
  { pregunta: '3 + 4 = ?',  correcta: 7,  opciones: [6, 7, 8]  },
  { pregunta: '5 + 3 = ?',  correcta: 8,  opciones: [7, 8, 9]  },
  { pregunta: '6 + 2 = ?',  correcta: 8,  opciones: [8, 9, 7]  },
  { pregunta: '4 + 4 = ?',  correcta: 8,  opciones: [6, 8, 10] },
  { pregunta: '7 + 1 = ?',  correcta: 8,  opciones: [7, 8, 9]  },
  { pregunta: '5 + 5 = ?',  correcta: 10, opciones: [9, 10, 8] },
  { pregunta: '3 + 6 = ?',  correcta: 9,  opciones: [8, 9, 10] },
  { pregunta: '8 + 2 = ?',  correcta: 10, opciones: [9, 10, 11]},
  { pregunta: '4 + 6 = ?',  correcta: 10, opciones: [8, 9, 10] },
];

// ── ESTADO ───────────────────────────────────────────────────
let pregIdx   = 0;
let aciertos  = 0;
let vidas     = 3;
let gameOver  = false;
let ganado    = false;
let guardado  = false;
let flash     = '';
let flashT    = 0;
let frameCount = 0;

// ── ESTRELLAS FONDO ──────────────────────────────────────────
const estrellas = Array.from({length: 80}, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  r: Math.random() * 2 + 0.5,
  br: Math.random(),
}));

// ── COHETE + ZORRITO ─────────────────────────────────────────
const cohete = {
  x: 80,
  y: canvas.height / 2 - 35,
  w: 70,
  h: 70,
  vy: 0,
  subiendo: false,
  bajando:  false,
  speed: 3,
};

// ── NUBES ────────────────────────────────────────────────────
let nubes = [];
const COLORES_NUBE = ['#a78bfa', '#60a5fa', '#34d399'];

function crearNubes() {
  nubes = [];
  if (pregIdx >= preguntas.length) return;
  const p = preguntas[pregIdx];
  const opciones = [...p.opciones];
  // mezclar
  for (let i = opciones.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opciones[i], opciones[j]] = [opciones[j], opciones[i]];
  }
  const alturas = [80, 210, 340];
  opciones.forEach((val, i) => {
    nubes.push({
      x: canvas.width + 60 + i * 40,
      y: alturas[i],
      w: 140,
      h: 80,
      valor: val,
      correcta: val === p.correcta,
      color: COLORES_NUBE[i],
      speed: 1,
      tocada: false,
    });
  });
}

// ── DIBUJAR FONDO ESPACIAL ───────────────────────────────────
function dibujarFondo() {
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  estrellas.forEach(s => {
    const brillo = 0.5 + 0.5 * Math.sin(frameCount * 0.05 + s.br * 10);
    ctx.globalAlpha = brillo;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Luna
  ctx.fillStyle = '#fef9c3';
  ctx.beginPath();
  ctx.arc(700, 60, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(712, 52, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(695, 72, 7, 0, Math.PI * 2);
  ctx.fill();
}

// ── DIBUJAR COHETE ────────────────────────────────────────────
function dibujarCohete(x, y, w, h) {
  const cx = x + w / 2;
  const cy = y + h / 2;

  // Llama propulsión
  const llama = Math.sin(frameCount * 0.3) * 6;
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(cx - 10, y + h * 0.85);
  ctx.lineTo(cx, y + h + 16 + llama);
  ctx.lineTo(cx + 10, y + h * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(cx - 5, y + h * 0.85);
  ctx.lineTo(cx, y + h + 8 + llama * 0.6);
  ctx.lineTo(cx + 5, y + h * 0.85);
  ctx.closePath();
  ctx.fill();

  // Cuerpo cohete
  ctx.fillStyle = '#e94560';
  ctx.beginPath();
  ctx.roundRect(cx - 18, y + h * 0.25, 36, h * 0.6, 6);
  ctx.fill();

  // Punta
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(cx - 18, y + h * 0.28);
  ctx.lineTo(cx + 18, y + h * 0.28);
  ctx.closePath();
  ctx.fill();

  // Aletas
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.moveTo(cx - 18, y + h * 0.7);
  ctx.lineTo(cx - 32, y + h * 0.95);
  ctx.lineTo(cx - 18, y + h * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 18, y + h * 0.7);
  ctx.lineTo(cx + 32, y + h * 0.95);
  ctx.lineTo(cx + 18, y + h * 0.85);
  ctx.closePath();
  ctx.fill();

  // Ventana / zorrito
  ctx.fillStyle = '#a8d8ea';
  ctx.beginPath();
  ctx.arc(cx, y + h * 0.48, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Cara zorrito pequeña
  ctx.fillStyle = '#ff8c00';
  ctx.beginPath();
  ctx.arc(cx, y + h * 0.48, 10, 0, Math.PI * 2);
  ctx.fill();
  // Orejas
  ctx.fillStyle = '#ff8c00';
  ctx.beginPath();
  ctx.moveTo(cx - 8, y + h * 0.38);
  ctx.lineTo(cx - 13, y + h * 0.3);
  ctx.lineTo(cx - 4,  y + h * 0.38);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 4, y + h * 0.38);
  ctx.lineTo(cx + 13, y + h * 0.3);
  ctx.lineTo(cx + 8,  y + h * 0.38);
  ctx.fill();
  // Ojos
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(cx - 4, y + h * 0.46, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4, y + h * 0.46, 2, 0, Math.PI * 2); ctx.fill();
  // Nariz
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(cx, y + h * 0.5, 1.5, 0, Math.PI * 2); ctx.fill();
}

// ── DIBUJAR NUBE ─────────────────────────────────────────────
function dibujarNube(n) {
  if (n.tocada) return;
  const cx = n.x + n.w / 2;
  const cy = n.y + n.h / 2;

  // Forma nube
  ctx.fillStyle = n.color;
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.arc(cx,      cy,      38, 0, Math.PI * 2);
  ctx.arc(cx - 36, cy + 10, 28, 0, Math.PI * 2);
  ctx.arc(cx + 36, cy + 10, 28, 0, Math.PI * 2);
  ctx.arc(cx - 18, cy - 20, 24, 0, Math.PI * 2);
  ctx.arc(cx + 20, cy - 18, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Número
  ctx.font = 'bold 26px Comic Sans MS';
  ctx.fillStyle = 'white';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText(String(n.valor), cx, cy + 4);
  ctx.fillText(String(n.valor), cx, cy + 4);
}

// ── HUD ───────────────────────────────────────────────────────
function dibujarHUD() {
  if (pregIdx >= preguntas.length) return;
  const p = preguntas[pregIdx];

  ctx.fillStyle = 'rgba(15,52,96,0.92)';
  ctx.beginPath();
  ctx.roundRect(20, 10, canvas.width - 40, 52, 10);
  ctx.fill();

  ctx.font = 'bold 22px Comic Sans MS';
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(p.pregunta, canvas.width / 2, 36);

  // vidas
  ctx.font = '20px serif';
  ctx.textAlign = 'left';
  for (let i = 0; i < vidas; i++) ctx.fillText('❤️', 20 + i * 28, 76);

  // puntaje
  ctx.font = 'bold 15px Arial';
  ctx.fillStyle = '#a8d8ea';
  ctx.textAlign = 'right';
  ctx.fillText(`✅ ${aciertos}/${preguntas.length}`, canvas.width - 20, 76);
}

// ── FLASH ─────────────────────────────────────────────────────
function dibujarFlash() {
  if (!flash || flashT <= 0) return;
  ctx.globalAlpha = Math.min(1, flashT / 20);
  ctx.font = 'bold 34px Comic Sans MS';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.strokeText(flash, canvas.width / 2, canvas.height / 2 - 30);
  ctx.fillStyle = flash.includes('¡') ? '#fbbf24' : '#f87171';
  ctx.fillText(flash, canvas.width / 2, canvas.height / 2 - 30);
  ctx.globalAlpha = 1;
  flashT--;
}

// ── PANTALLA FINAL ────────────────────────────────────────────
function dibujarFinal() {
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = 'bold 38px Comic Sans MS';
  ctx.fillStyle = ganado ? '#fbbf24' : '#f87171';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ganado ? '🚀 ¡Llegaste a las estrellas!' : '💔 ¡Inténtalo de nuevo!', canvas.width / 2, canvas.height / 2 - 60);

  ctx.font = '22px Comic Sans MS';
  ctx.fillStyle = 'white';
  ctx.fillText(`Respuestas correctas: ${aciertos} de ${preguntas.length}`, canvas.width / 2, canvas.height / 2);
  ctx.fillText(`Puntaje: ${Math.round(aciertos / preguntas.length * 100)}%`, canvas.width / 2, canvas.height / 2 + 38);

  ctx.fillStyle = '#e94560';
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 100, canvas.height / 2 + 80, 200, 48, 12);
  ctx.fill();
  ctx.font = 'bold 19px Comic Sans MS';
  ctx.fillStyle = 'white';
  ctx.fillText('▶ Jugar de nuevo', canvas.width / 2, canvas.height / 2 + 104);
}

// ── GUARDAR PROGRESO ──────────────────────────────────────────
async function guardarProgreso() {
  if (guardado) return;
  guardado = true;
  try {
    await fetch('/guardar_progreso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unidad: 102,
        aciertos,
        total: preguntas.length,
        puntaje: Math.round(aciertos / preguntas.length * 100),
      }),
    });
  } catch (e) { console.log(e); }
}

// ── COLISIÓN ──────────────────────────────────────────────────
function colisiona(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ── LOOP ──────────────────────────────────────────────────────
function loop() {
  frameCount++;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dibujarFondo();

  if (gameOver) {
    dibujarCohete(cohete.x, cohete.y, cohete.w, cohete.h);
    dibujarFinal();
    requestAnimationFrame(loop);
    return;
  }

  // Mover cohete
  if (cohete.subiendo) cohete.vy = -cohete.speed;
  else if (cohete.bajando) cohete.vy = cohete.speed;
  else cohete.vy *= 0.85;

  cohete.y += cohete.vy;
  cohete.y = Math.max(0, Math.min(canvas.height - cohete.h, cohete.y));

  // Mover nubes y detectar colisión
  nubes.forEach(n => {
    if (n.tocada) return;
    n.x -= n.speed;
    if (colisiona(cohete, n)) {
      n.tocada = true;
      if (n.correcta) {
        aciertos++;
        Sonidos.correcto();
        flash  = '🌟 ¡Correcto!';
        flashT = 80;
      } else {
        vidas--;
        Sonidos.incorrecto();
        flash  = '💥 ¡Esa no!';
        flashT = 80;
        if (vidas <= 0) { gameOver = true; ganado = false; Sonidos.perder(); guardarProgreso(); return; }
      }
      pregIdx++;
      if (pregIdx >= preguntas.length) {
        gameOver = true;
        ganado = aciertos >= Math.ceil(preguntas.length * 0.6);
        if (ganado) Sonidos.ganar(); else Sonidos.perder();
        guardarProgreso();
      } else {
        crearNubes();
      }
    }
    // Nube salió sin tocar → pierde vida
    if (n.x + n.w < 0 && !n.tocada) {
      n.tocada = true;
      vidas--;
      Sonidos.incorrecto();
      flash  = '🌀 ¡Se escapó!';
      flashT = 80;
      if (vidas <= 0) { gameOver = true; ganado = false; Sonidos.perder(); guardarProgreso(); return; }
      pregIdx++;
      if (pregIdx >= preguntas.length) {
        gameOver = true;
        ganado = aciertos >= Math.ceil(preguntas.length * 0.6);
        guardarProgreso();
      } else {
        crearNubes();
      }
    }
  });

  nubes.forEach(dibujarNube);
  dibujarCohete(cohete.x, cohete.y, cohete.w, cohete.h);
  dibujarHUD();
  dibujarFlash();

  requestAnimationFrame(loop);
}

// ── REINICIAR ─────────────────────────────────────────────────
function reiniciar() {
  pregIdx  = 0; aciertos = 0; vidas = 3;
  gameOver = false; ganado = false; guardado = false;
  flash = ''; flashT = 0;
  cohete.y = canvas.height / 2 - 35;
  cohete.vy = 0;
  crearNubes();
}

// ── CONTROLES TECLADO ─────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp')   cohete.subiendo = true;
  if (e.key === 'ArrowDown') cohete.bajando  = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowUp')   cohete.subiendo = false;
  if (e.key === 'ArrowDown') cohete.bajando  = false;
});

// ── CONTROLES TOUCH ───────────────────────────────────────────
const btnUp   = document.getElementById('btnUp');
const btnDown = document.getElementById('btnDown');
btnUp.addEventListener('touchstart',   e => { e.preventDefault(); cohete.subiendo = true; });
btnUp.addEventListener('touchend',     e => { e.preventDefault(); cohete.subiendo = false; });
btnDown.addEventListener('touchstart', e => { e.preventDefault(); cohete.bajando  = true; });
btnDown.addEventListener('touchend',   e => { e.preventDefault(); cohete.bajando  = false; });
btnUp.addEventListener('mousedown',   () => cohete.subiendo = true);
btnUp.addEventListener('mouseup',     () => cohete.subiendo = false);
btnDown.addEventListener('mousedown', () => cohete.bajando  = true);
btnDown.addEventListener('mouseup',   () => cohete.bajando  = false);

// ── CLIC REINICIAR ────────────────────────────────────────────
canvas.addEventListener('click', e => {
  if (!gameOver) return;
  const r = canvas.getBoundingClientRect();
  const cx = (e.clientX - r.left) * (canvas.width / r.width);
  const cy = (e.clientY - r.top)  * (canvas.height / r.height);
  if (cx > canvas.width/2-100 && cx < canvas.width/2+100 && cy > canvas.height/2+80 && cy < canvas.height/2+128) reiniciar();
});
canvas.addEventListener('touchend', e => {
  if (!gameOver) return;
  const r = canvas.getBoundingClientRect();
  const t = e.changedTouches[0];
  const cx = (t.clientX - r.left) * (canvas.width / r.width);
  const cy = (t.clientY - r.top)  * (canvas.height / r.height);
  if (cx > canvas.width/2-100 && cx < canvas.width/2+100 && cy > canvas.height/2+80 && cy < canvas.height/2+128) reiniciar();
});

// ── INICIAR AUDIO ─────────────────────────────────────────────
let _audioIniciado = false;
function _iniciarAudio() {
  if (!_audioIniciado) { _audioIniciado = true; Sonidos.iniciar(1); }
}
canvas.addEventListener('click', _iniciarAudio);
canvas.addEventListener('touchstart', _iniciarAudio, { passive: true });
document.addEventListener('keydown', _iniciarAudio, { once: true });

// ── INICIO ────────────────────────────────────────────────────
crearNubes();
loop();