// ============================================================
//  RETOMATE - Grado 1, Módulo 5: ¿Cuánto Mide?
//  Juego: El zorrito chef elige el vaso con la medida correcta
//         3 vasos con distintos niveles de líquido, uno correcto
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// ── PREGUNTAS ────────────────────────────────────────────────
const preguntas = [
    { q:'¿Cuál tiene la mitad?',          r:1, niveles:[0.25, 0.50, 0.80], col:'#38bdf8' },
    { q:'¿Cuál está casi lleno?',         r:2, niveles:[0.30, 0.55, 0.90], col:'#34d399' },
    { q:'¿Cuál tiene muy poco?',          r:0, niveles:[0.15, 0.50, 0.75], col:'#f87171' },
    { q:'¿Cuál tiene más?',               r:2, niveles:[0.25, 0.55, 0.85], col:'#fbbf24' },
    { q:'¿Cuál tiene menos?',             r:0, niveles:[0.20, 0.60, 0.80], col:'#a78bfa' },
    { q:'¿Cuál está a la mitad?',         r:1, niveles:[0.20, 0.50, 0.85], col:'#fb923c' },
    { q:'¿Cuál está lleno?',              r:2, niveles:[0.30, 0.60, 1.00], col:'#38bdf8' },
    { q:'¿Cuál tiene un cuarto?',         r:0, niveles:[0.25, 0.50, 0.75], col:'#34d399' },
    { q:'¿Cuál tiene tres cuartos?',      r:2, niveles:[0.25, 0.50, 0.75], col:'#f87171' },
    { q:'¿Cuál tiene más que la mitad?',  r:2, niveles:[0.20, 0.50, 0.70], col:'#a78bfa' },
];

// ── ESTADO ───────────────────────────────────────────────────
let pregIdx  = 0, aciertos = 0, vidas = 3;
let gameOver = false, ganado = false, guardado = false;
let flash = '', flashT = 0, tick = 0;
let seleccion = 1; // vaso seleccionado (0, 1, 2)
let animLiquido = [0, 0, 0]; // animación de llenado
let confirmando = false;
let confirmT    = 0;

// Posiciones de los 3 vasos
const VASOS_X = [180, 400, 620];
const VASO_Y  = H - 80;
const VASO_H  = 200;
const VASO_W  = 100;

// ── INICIALIZAR ANIMACIÓN DE LÍQUIDO ─────────────────────────
function iniciarNiveles() {
    if (pregIdx >= preguntas.length) return;
    animLiquido = [0, 0, 0]; // empieza vacío y llena animado
}

// ── DIBUJAR FONDO COCINA ─────────────────────────────────────
function dibujarFondo() {
    // Pared azul
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(0, 0, W, H);

    // Azulejos
    ctx.strokeStyle = 'rgba(3,105,161,0.12)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 60) {
        for (let gy = 0; gy < H - 80; gy += 60) {
            ctx.strokeRect(gx, gy, 60, 60);
            // Cruz central azulejo
            ctx.beginPath();
            ctx.moveTo(gx + 30, gy + 10); ctx.lineTo(gx + 30, gy + 50);
            ctx.moveTo(gx + 10, gy + 30); ctx.lineTo(gx + 50, gy + 30);
            ctx.stroke();
        }
    }

    // Mesón de cocina
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(0, H - 80, W, 80);
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, H - 84, W, 6);

    // Decoración estante
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(20, 60, 200, 16);
    ctx.fillRect(580, 60, 200, 16);
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(20, 56, 200, 6);
    ctx.fillRect(580, 56, 200, 6);
}

// ── DIBUJAR VASO ─────────────────────────────────────────────
function dibujarVaso(x, y, w, h, nivel, color, seleccionado, correcto, mostrarCorr) {
    const liqH   = h * nivel;
    const vasoX  = x - w / 2;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(x, y + 8, w / 2 + 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Borde selección
    if (seleccionado) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(vasoX - 6, y - h - 6, w + 12, h + 12, 8);
        ctx.stroke();
        // Flecha arriba animada
        const fy = y - h - 36 + Math.sin(tick * 0.1) * 5;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(x,     fy + 16);
        ctx.lineTo(x - 12, fy);
        ctx.lineTo(x + 12, fy);
        ctx.closePath();
        ctx.fill();
    }

    // Vaso (cristal)
    ctx.fillStyle = 'rgba(224,242,254,0.4)';
    ctx.strokeStyle = seleccionado ? '#0369a1' : '#7dd3fc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(vasoX, y - h, w, h, [0, 0, 8, 8]);
    ctx.fill();

    // Líquido
    if (nivel > 0) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.roundRect(vasoX + 3, y - liqH + 3, w - 6, liqH - 3, [0, 0, 6, 6]);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Brillo líquido
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.roundRect(vasoX + 6, y - liqH + 6, (w - 12) * 0.4, liqH - 10, 4);
        ctx.fill();

        // Ola superficie
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(vasoX + 4, y - liqH + 8);
        ctx.quadraticCurveTo(x, y - liqH + 3, vasoX + w - 4, y - liqH + 8);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Cristal del vaso encima del líquido
    ctx.strokeStyle = seleccionado ? '#0369a1' : '#bae6fd';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(vasoX, y - h, w, h, [0, 0, 8, 8]);
    ctx.stroke();

    // Líneas de medida
    ctx.strokeStyle = 'rgba(3,105,161,0.3)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([3, 3]);
    [0.25, 0.5, 0.75].forEach(mark => {
        const my = y - h * mark;
        ctx.beginPath();
        ctx.moveTo(vasoX + w - 18, my);
        ctx.lineTo(vasoX + w - 4,  my);
        ctx.stroke();
    });
    ctx.setLineDash([]);

    // Indicador correcto/incorrecto al confirmar
    if (mostrarCorr) {
        ctx.font = '28px serif';
        ctx.textAlign = 'center';
        ctx.fillText(correcto ? '✅' : '❌', x, y - h - 50);
    }
}

// ── DIBUJAR ZORRITO CHEF ─────────────────────────────────────
function dibujarZorritoChef(tick) {
    const cx = W / 2;
    const cy = H - 220;
    const bounce = Math.sin(tick * 0.05) * 3;

    // Gorro de chef
    ctx.fillStyle = 'white';
    ctx.fillRect(cx - 22, cy - 60, 44, 14);
    ctx.beginPath();
    ctx.ellipse(cx, cy - 68, 20, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 22, cy - 60, 44, 14);

    // Orejas
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath(); ctx.moveTo(cx-10, cy-38+bounce); ctx.lineTo(cx-20, cy-54+bounce); ctx.lineTo(cx-3, cy-38+bounce); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+3, cy-38+bounce); ctx.lineTo(cx+20, cy-54+bounce); ctx.lineTo(cx+10, cy-38+bounce); ctx.fill();
    ctx.fillStyle = '#ffb347';
    ctx.beginPath(); ctx.moveTo(cx-10, cy-38+bounce); ctx.lineTo(cx-15, cy-46+bounce); ctx.lineTo(cx-4, cy-38+bounce); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+4, cy-38+bounce); ctx.lineTo(cx+15, cy-46+bounce); ctx.lineTo(cx+10, cy-38+bounce); ctx.fill();

    // Cabeza
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath(); ctx.arc(cx, cy - 26 + bounce, 22, 0, Math.PI * 2); ctx.fill();

    // Cuerpo con delantal
    ctx.beginPath(); ctx.ellipse(cx, cy + 10 + bounce, 24, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.ellipse(cx, cy + 12 + bounce, 14, 18, 0, 0, Math.PI * 2); ctx.fill();

    // Hocico
    ctx.fillStyle = '#fff5e6';
    ctx.beginPath(); ctx.ellipse(cx, cy - 22 + bounce, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(cx, cy - 27 + bounce, 3, 0, Math.PI * 2); ctx.fill();

    // Ojos
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(cx - 8, cy - 32 + bounce, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 8, cy - 32 + bounce, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(cx - 7, cy - 33 + bounce, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 9, cy - 33 + bounce, 1.2, 0, Math.PI * 2); ctx.fill();

    // Brazos apuntando
    ctx.strokeStyle = '#ff8c00'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 20, cy + 5 + bounce); ctx.lineTo(cx - 55, cy - 10 + bounce); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 20, cy + 5 + bounce); ctx.lineTo(cx + 55, cy - 10 + bounce); ctx.stroke();
}

// ── HUD ───────────────────────────────────────────────────────
function dibujarHUD() {
    if (pregIdx >= preguntas.length) return;
    const p = preguntas[pregIdx];
    ctx.fillStyle = 'rgba(12,74,110,0.92)';
    ctx.beginPath(); ctx.roundRect(20, 10, W - 40, 52, 10); ctx.fill();
    ctx.font = 'bold 22px Comic Sans MS';
    ctx.fillStyle = '#bae6fd';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.q, W / 2, 36);
    ctx.font = '20px serif'; ctx.textAlign = 'left';
    for (let i = 0; i < vidas; i++) ctx.fillText('❤️', 22 + i * 28, 76);
    ctx.font = 'bold 14px Arial'; ctx.fillStyle = '#7dd3fc'; ctx.textAlign = 'right';
    ctx.fillText(`✅ ${aciertos}/${preguntas.length}`, W - 22, 76);
}

// ── FLASH ─────────────────────────────────────────────────────
function dibujarFlash() {
    if (!flash || flashT <= 0) return;
    ctx.globalAlpha = Math.min(1, flashT / 20);
    ctx.font = 'bold 34px Comic Sans MS';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
    ctx.strokeText(flash, W / 2, H / 2 - 40);
    ctx.fillStyle = flash.includes('!') ? '#fbbf24' : '#f87171';
    ctx.fillText(flash, W / 2, H / 2 - 40);
    ctx.globalAlpha = 1;
    flashT--;
}

// ── PANTALLA FINAL ────────────────────────────────────────────
function dibujarFinal() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
    ctx.font = 'bold 36px Comic Sans MS';
    ctx.fillStyle = ganado ? '#fbbf24' : '#f87171';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ganado ? '🧪 ¡Excelente medición!' : '💧 ¡Inténtalo de nuevo!', W / 2, H / 2 - 55);
    ctx.font = '22px Comic Sans MS'; ctx.fillStyle = 'white';
    ctx.fillText(`Respuestas correctas: ${aciertos} de ${preguntas.length}`, W / 2, H / 2);
    ctx.fillText(`Puntaje: ${Math.round(aciertos / preguntas.length * 100)}%`, W / 2, H / 2 + 38);
    ctx.fillStyle = '#0369a1';
    ctx.beginPath(); ctx.roundRect(W / 2 - 100, H / 2 + 78, 200, 48, 12); ctx.fill();
    ctx.font = 'bold 19px Comic Sans MS'; ctx.fillStyle = 'white';
    ctx.fillText('▶ Jugar de nuevo', W / 2, H / 2 + 102);
}

// ── GUARDAR PROGRESO ──────────────────────────────────────────
async function guardarProgreso() {
    if (guardado) return; guardado = true;
    try {
        await fetch('/guardar_progreso', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unidad: 105, aciertos, total: preguntas.length, puntaje: Math.round(aciertos / preguntas.length * 100) }),
        });
    } catch (e) {}
}

// ── CONFIRMAR RESPUESTA ───────────────────────────────────────
function confirmar() {
    if (gameOver || confirmando) return;
    const p = preguntas[pregIdx];
    confirmando = true;
    confirmT    = 60;

    if (seleccion === p.r) {
        aciertos++;
        Sonidos.correcto();
        flash = '¡Correcto! 🧪'; flashT = 45;
    } else {
        vidas--;
        Sonidos.incorrecto();
        flash = '¡Esa no es! 💧'; flashT = 45;
        if (vidas <= 0) {
            setTimeout(() => { gameOver = true; ganado = false; Sonidos.perder(); guardarProgreso(); }, 800);
            return;
        }
    }
    setTimeout(() => {
        confirmando = false;
        pregIdx++;
        if (pregIdx >= preguntas.length) {
            gameOver = true;
            ganado   = aciertos >= Math.ceil(preguntas.length * 0.6);
            if (ganado) Sonidos.ganar(); else Sonidos.perder();
            guardarProgreso();
        } else {
            seleccion = 1;
            iniciarNiveles();
        }
    }, 900);
}

// ── LOOP ──────────────────────────────────────────────────────
function loop() {
    tick++;
    ctx.clearRect(0, 0, W, H);
    dibujarFondo();

    if (!gameOver && pregIdx < preguntas.length) {
        const p = preguntas[pregIdx];

        // Animar llenado gradual al inicio de cada pregunta
        p.niveles.forEach((niv, i) => {
            if (animLiquido[i] < niv) animLiquido[i] = Math.min(niv, animLiquido[i] + 0.012);
        });

        // Dibujar 3 vasos
        VASOS_X.forEach((vx, i) => {
            dibujarVaso(
                vx, VASO_Y, VASO_W, VASO_H,
                animLiquido[i], p.col,
                seleccion === i,
                i === p.r,
                confirmando,
            );
        });

        dibujarZorritoChef(tick);
        dibujarHUD();
        dibujarFlash();
    }

    if (gameOver) {
        // Mostrar vasos congelados
        if (pregIdx < preguntas.length) {
            const p = preguntas[pregIdx];
            VASOS_X.forEach((vx, i) => {
                dibujarVaso(vx, VASO_Y, VASO_W, VASO_H, animLiquido[i], p.col, false, false, false);
            });
        }
        dibujarZorritoChef(tick);
        dibujarFinal();
    }

    requestAnimationFrame(loop);
}

// ── REINICIAR ─────────────────────────────────────────────────
function reiniciar() {
    pregIdx = 0; aciertos = 0; vidas = 3;
    gameOver = false; ganado = false; guardado = false;
    flash = ''; flashT = 0; seleccion = 1; confirmando = false;
    iniciarNiveles();
}

// ── CONTROLES ─────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (gameOver) return;
    if (e.key === 'ArrowLeft')  seleccion = Math.max(0, seleccion - 1);
    if (e.key === 'ArrowRight') seleccion = Math.min(2, seleccion + 1);
    if (e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); confirmar(); }
});

document.getElementById('btnL').addEventListener('click',  () => { if (!gameOver) seleccion = Math.max(0, seleccion - 1); });
document.getElementById('btnR').addEventListener('click',  () => { if (!gameOver) seleccion = Math.min(2, seleccion + 1); });
document.getElementById('btnOk').addEventListener('click', () => confirmar());

// Click en vaso
canvas.addEventListener('click', e => {
    if (gameOver) {
        const r  = canvas.getBoundingClientRect();
        const cx = (e.clientX - r.left) * (W / r.width);
        const cy = (e.clientY - r.top)  * (H / r.height);
        if (cx > W/2-100 && cx < W/2+100 && cy > H/2+78 && cy < H/2+126) reiniciar();
        return;
    }
    const r  = canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (W / r.width);
    VASOS_X.forEach((vx, i) => {
        if (Math.abs(mx - vx) < 60) { seleccion = i; confirmar(); }
    });
});
canvas.addEventListener('touchend', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    const r = canvas.getBoundingClientRect();
    const mx = (t.clientX - r.left) * (W / r.width);
    const my = (t.clientY - r.top)  * (H / r.height);
    if (gameOver) {
        if (mx > W/2-100 && mx < W/2+100 && my > H/2+78 && my < H/2+126) reiniciar();
        return;
    }
    VASOS_X.forEach((vx, i) => {
        if (Math.abs(mx - vx) < 60) { seleccion = i; confirmar(); }
    });
});

// ── AUDIO ─────────────────────────────────────────────────────
let _au = false;
function _ia() { if (!_au) { _au = true; Sonidos.iniciar(1); } }
canvas.addEventListener('click',      _ia);
canvas.addEventListener('touchstart', _ia, { passive: true });
document.addEventListener('keydown',  _ia, { once: true });

// ── INICIO ────────────────────────────────────────────────────
iniciarNiveles();
loop();