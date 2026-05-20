// ============================================================
//  RETOMATE - Grado 1, Módulo 6: Números hasta 100
//  Juego: El zorrito astronauta toca números en orden
//         Se hacen 10 rondas con 10 números cada una
//         Hay que tocar el siguiente número correcto entre opciones
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// ── RONDAS: cada una pide ordenar una secuencia ───────────────
// Cada ronda muestra la secuencia recorrida y pide el siguiente número
const RONDAS = [
    { inicio:1,  fin:10  },
    { inicio:11, fin:20  },
    { inicio:21, fin:30  },
    { inicio:31, fin:40  },
    { inicio:41, fin:50  },
    { inicio:51, fin:60  },
    { inicio:61, fin:70  },
    { inicio:71, fin:80  },
    { inicio:81, fin:90  },
    { inicio:91, fin:100 },
];

// ── ESTADO ───────────────────────────────────────────────────
let rondaIdx   = 0;
let paso       = 0;      // qué número de la secuencia va (0..9)
let aciertos   = 0;
let errores    = 0;
let vidas      = 3;
let gameOver   = false;
let ganado     = false;
let guardado   = false;
let flash      = '';
let flashT     = 0;
let tick       = 0;
let secuenciaCompleta = false;

// Posiciones de los números en pantalla (estrellas)
let estrellas  = [];   // todos los números de la ronda como estrellas
let opciones   = [];   // 3 opciones para el siguiente número
let tocados    = [];   // índices ya tocados en orden

// ── ESTRELLAS DE FONDO ────────────────────────────────────────
const ESTRELLAS_FONDO = Array.from({length: 80}, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.8 + 0.4,
    b: Math.random() * Math.PI * 2,
}));

// ── INICIAR RONDA ─────────────────────────────────────────────
function iniciarRonda() {
    if (rondaIdx >= RONDAS.length) return;
    const r = RONDAS[rondaIdx];
    paso = 0;
    tocados = [];
    secuenciaCompleta = false;

    // Distribuir los 10 números de la ronda en posiciones fijas tipo cuadrícula
    // 5 columnas x 2 filas en el área central
    estrellas = [];
    const nums = [];
    for (let n = r.inicio; n <= r.fin; n++) nums.push(n);

    // Posiciones predefinidas para 10 estrellas en serpentina
    const posiciones = [
        {x:120, y:180}, {x:240, y:180}, {x:360, y:180}, {x:480, y:180}, {x:600, y:180},
        {x:600, y:320}, {x:480, y:320}, {x:360, y:320}, {x:240, y:320}, {x:120, y:320},
    ];

    nums.forEach((n, i) => {
        estrellas.push({
            num:  n,
            x:    posiciones[i].x,
            y:    posiciones[i].y,
            r:    28,
            fase: Math.random() * Math.PI * 2,
            tocada: false,
            error:  false,
        });
    });

    generarOpciones();
}

function generarOpciones() {
    if (rondaIdx >= RONDAS.length) return;
    const r   = RONDAS[rondaIdx];
    const sig = r.inicio + paso; // número correcto

    // 3 opciones: la correcta + 2 distractores
    const pool = new Set([sig]);
    while (pool.size < 3) {
        const d = sig + Math.floor(Math.random() * 6) - 3;
        if (d >= r.inicio && d <= r.fin && d !== sig) pool.add(d);
    }

    // Mezclar
    opciones = [...pool].sort(() => Math.random() - 0.5).map(n => ({
        num: n,
        correcta: n === sig,
    }));
}

// ── DIBUJAR FONDO ESPACIO ─────────────────────────────────────
function dibujarFondo() {
    ctx.fillStyle = '#0a0818';
    ctx.fillRect(0, 0, W, H);

    // Estrellas fondo parpadeantes
    ESTRELLAS_FONDO.forEach(s => {
        const br = 0.4 + 0.6 * Math.sin(tick * 0.04 + s.b);
        ctx.globalAlpha = br;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Nebulosa decorativa
    ctx.fillStyle = 'rgba(124,58,237,0.06)';
    ctx.beginPath(); ctx.ellipse(W*0.3, H*0.4, 200, 120, 0.3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(59,130,246,0.05)';
    ctx.beginPath(); ctx.ellipse(W*0.7, H*0.6, 180, 100, -0.2, 0, Math.PI*2); ctx.fill();

    // Línea de conexión entre tocados
    if (tocados.length > 1) {
        ctx.save();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth   = 2.5;
        ctx.lineCap     = 'round';
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        tocados.forEach((idx, i) => {
            const s = estrellas[idx];
            i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y);
        });
        ctx.stroke();
        ctx.restore();
    }
}

// ── DIBUJAR ESTRELLAS-NÚMERO ──────────────────────────────────
function dibujarEstrellas() {
    estrellas.forEach((s, i) => {
        const float = Math.sin(tick * 0.03 + s.fase) * 4;
        const esTocada = s.tocada;
        const esError  = s.error;

        // Resplandor
        if (!esTocada) {
            ctx.fillStyle = 'rgba(167,139,250,0.15)';
            ctx.beginPath();
            ctx.arc(s.x, s.y + float, s.r + 10, 0, Math.PI * 2);
            ctx.fill();
        }

        // Círculo principal
        if (esTocada) {
            ctx.fillStyle = '#fbbf24';
        } else if (esError) {
            ctx.fillStyle = '#ef4444';
        } else {
            ctx.fillStyle = '#1e1b4b';
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y + float, s.r, 0, Math.PI * 2);
        ctx.fill();

        // Borde
        ctx.strokeStyle = esTocada ? '#f59e0b' : esError ? '#b91c1c' : '#7c3aed';
        ctx.lineWidth   = esTocada ? 3 : 2;
        ctx.stroke();

        // Número
        ctx.font        = `bold ${esTocada ? 16 : 15}px Comic Sans MS`;
        ctx.fillStyle   = esTocada ? '#1a1a1a' : '#e2e8f0';
        ctx.textAlign   = 'center';
        ctx.textBaseline= 'middle';
        ctx.fillText(String(s.num), s.x, s.y + float);

        // Estrellita decorativa si ya tocada
        if (esTocada) {
            ctx.font = '14px serif';
            ctx.fillText('⭐', s.x + s.r + 2, s.y + float - s.r - 2);
        }
    });
}

// ── DIBUJAR OPCIONES (parte inferior) ────────────────────────
function dibujarOpciones() {
    if (secuenciaCompleta || gameOver) return;
    const r = RONDAS[rondaIdx];
    const sig = r.inicio + paso;

    // Fondo panel
    ctx.fillStyle = 'rgba(15,12,41,0.92)';
    ctx.beginPath(); ctx.roundRect(20, H - 90, W - 40, 76, 12); ctx.fill();
    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pregunta
    ctx.font = 'bold 16px Comic Sans MS';
    ctx.fillStyle = '#c4b5fd';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`¿Cuál es el número ${paso + 1}? Toca el ${sig}`, W / 2, H - 76);

    // 3 botones de opción
    const bw = 120, bh = 40;
    const startX = W / 2 - (3 * bw + 2 * 20) / 2;
    opciones.forEach((op, i) => {
        const bx = startX + i * (bw + 20);
        const by = H - 55;
        ctx.fillStyle = '#312e81';
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 10); ctx.fill();
        ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = 'bold 20px Comic Sans MS';
        ctx.fillStyle = 'white';
        ctx.fillText(String(op.num), bx + bw / 2, by + bh / 2);
    });
}

// ── DIBUJAR ZORRITO ASTRONAUTA ────────────────────────────────
function dibujarZorritoAstronauta(tick) {
    const cx = W - 90;
    const cy = 90;
    const fl = Math.sin(tick * 0.04) * 4;

    // Traje espacial (cuerpo blanco)
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath(); ctx.ellipse(cx, cy + 25 + fl, 26, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke();

    // Casco (círculo transparente)
    ctx.fillStyle = 'rgba(186,230,253,0.5)';
    ctx.beginPath(); ctx.arc(cx, cy + fl, 28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 3;
    ctx.stroke();

    // Cara dentro del casco
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath(); ctx.arc(cx, cy + fl, 20, 0, Math.PI * 2); ctx.fill();
    // Orejas
    ctx.beginPath(); ctx.moveTo(cx-10, cy-8+fl); ctx.lineTo(cx-20, cy-22+fl); ctx.lineTo(cx-3, cy-8+fl); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+3, cy-8+fl); ctx.lineTo(cx+20, cy-22+fl); ctx.lineTo(cx+10, cy-8+fl); ctx.fill();
    // Hocico
    ctx.fillStyle = '#fff5e6';
    ctx.beginPath(); ctx.ellipse(cx, cy+4+fl, 8, 5, 0, 0, Math.PI*2); ctx.fill();
    // Nariz
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(cx, cy+fl, 2.5, 0, Math.PI*2); ctx.fill();
    // Ojos
    ctx.beginPath(); ctx.arc(cx-7, cy-5+fl, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+7, cy-5+fl, 2.5, 0, Math.PI*2); ctx.fill();

    // Brazos traje
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx-28, cy+22+fl, 9, 16, -0.4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx+28, cy+22+fl, 9, 16, 0.4, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // Piernas traje
    ctx.beginPath(); ctx.ellipse(cx-14, cy+46+fl, 10, 14, -0.1, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx+14, cy+46+fl, 10, 14, 0.1, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // Mochila propulsora
    ctx.fillStyle = '#64748b';
    ctx.beginPath(); ctx.roundRect(cx-10, cy+10+fl, 20, 28, 4); ctx.fill();
    // Llamas propulsoras
    if (Math.sin(tick * 0.15) > 0) {
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.ellipse(cx-4, cy+42+fl, 5, 8, -0.2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx+4, cy+42+fl, 5, 8, 0.2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.ellipse(cx, cy+44+fl, 3, 5, 0, 0, Math.PI*2); ctx.fill();
    }

    // Número siguiente en globo de pensamiento
    if (rondaIdx < RONDAS.length && !secuenciaCompleta) {
        const sig = RONDAS[rondaIdx].inicio + paso;
        ctx.fillStyle = 'rgba(30,27,75,0.9)';
        ctx.beginPath(); ctx.roundRect(cx - 68, cy - 45 + fl, 52, 30, 8); ctx.fill();
        ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.font = '11px Comic Sans MS'; ctx.fillStyle = '#c4b5fd';
        ctx.textAlign = 'center';
        ctx.fillText('¡Busca el', cx - 42, cy - 34 + fl);
        ctx.font = 'bold 14px Comic Sans MS'; ctx.fillStyle = '#fbbf24';
        ctx.fillText(String(sig) + '!', cx - 42, cy - 20 + fl);
        // Colita del globo
        ctx.fillStyle = 'rgba(30,27,75,0.9)';
        ctx.beginPath();
        ctx.moveTo(cx - 38, cy - 16 + fl);
        ctx.lineTo(cx - 30, cy - 8 + fl);
        ctx.lineTo(cx - 46, cy - 8 + fl);
        ctx.closePath(); ctx.fill();
    }
}

// ── HUD ───────────────────────────────────────────────────────
function dibujarHUD() {
    ctx.fillStyle = 'rgba(15,12,41,0.92)';
    ctx.beginPath(); ctx.roundRect(20, 10, W - 40, 52, 10); ctx.fill();
    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1.5; ctx.stroke();

    const r = rondaIdx < RONDAS.length ? RONDAS[rondaIdx] : RONDAS[9];
    ctx.font = 'bold 18px Comic Sans MS';
    ctx.fillStyle = '#a78bfa';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`Ronda ${rondaIdx + 1}/10 · Del ${r.inicio} al ${r.fin}`, W / 2, 28);

    ctx.font = 'bold 14px Comic Sans MS';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`Progreso: ${paso}/10`, W / 2, 48);

    ctx.font = '20px serif'; ctx.textAlign = 'left';
    for (let i = 0; i < vidas; i++) ctx.fillText('❤️', 28 + i * 28, 34);

    ctx.font = 'bold 13px Arial'; ctx.fillStyle = '#a78bfa'; ctx.textAlign = 'right';
    ctx.fillText(`✅ ${aciertos}/${RONDAS.length}`, W - 28, 34);
}

// ── FLASH ─────────────────────────────────────────────────────
function dibujarFlash() {
    if (!flash || flashT <= 0) return;
    ctx.globalAlpha = Math.min(1, flashT / 20);
    ctx.font = 'bold 32px Comic Sans MS';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
    ctx.strokeText(flash, W / 2, H / 2 - 120);
    ctx.fillStyle = flash.includes('!') ? '#fbbf24' : '#f87171';
    ctx.fillText(flash, W / 2, H / 2 - 120);
    ctx.globalAlpha = 1;
    flashT--;
}

// ── PANTALLA FINAL ────────────────────────────────────────────
function dibujarFinal() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
    ctx.font = 'bold 36px Comic Sans MS';
    ctx.fillStyle = ganado ? '#fbbf24' : '#f87171';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ganado ? '🚀 ¡Llegaste a las estrellas!' : '⭐ ¡Inténtalo de nuevo!', W / 2, H / 2 - 55);
    ctx.font = '22px Comic Sans MS'; ctx.fillStyle = 'white';
    ctx.fillText(`Rondas completadas: ${aciertos} de ${RONDAS.length}`, W / 2, H / 2);
    ctx.fillText(`Puntaje: ${Math.round(aciertos / RONDAS.length * 100)}%`, W / 2, H / 2 + 38);
    ctx.fillStyle = '#7c3aed';
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
            body: JSON.stringify({ unidad: 106, aciertos, total: RONDAS.length, puntaje: Math.round(aciertos / RONDAS.length * 100) }),
        });
    } catch (e) {}
}

// ── MANEJAR TOQUE EN OPCIÓN ───────────────────────────────────
function tocarOpcion(opIdx) {
    if (gameOver || secuenciaCompleta) return;
    const op = opciones[opIdx];
    if (!op) return;

    if (op.correcta) {
        // Marcar la estrella correcta como tocada
        const idx = estrellas.findIndex(s => s.num === op.num);
        if (idx >= 0) { estrellas[idx].tocada = true; tocados.push(idx); }
        paso++;
        Sonidos.correcto();
        flash = `¡Sí! Es el ${op.num} ⭐`; flashT = 30;

        if (paso >= 10) {
            // Ronda completada
            secuenciaCompleta = true;
            aciertos++;
            flash = '🎉 ¡Ronda completa!'; flashT = 60;
            setTimeout(() => {
                rondaIdx++;
                if (rondaIdx >= RONDAS.length) {
                    gameOver = true;
                    ganado   = aciertos >= Math.ceil(RONDAS.length * 0.6);
                    if (ganado) Sonidos.ganar(); else Sonidos.perder();
                    guardarProgreso();
                } else {
                    iniciarRonda();
                }
            }, 1200);
        } else {
            generarOpciones();
        }
    } else {
        // Error
        vidas--;
        Sonidos.incorrecto();
        flash = `¡No! Era el ${RONDAS[rondaIdx].inicio + paso}`; flashT = 40;
        if (vidas <= 0) {
            gameOver = true; ganado = false;
            Sonidos.perder(); guardarProgreso();
        } else {
            generarOpciones();
        }
    }
}

// ── DETECTAR CLIC EN OPCIONES ─────────────────────────────────
function detectarClic(mx, my) {
    if (gameOver || secuenciaCompleta) return;

    const bw = 120, bh = 40;
    const startX = W / 2 - (3 * bw + 2 * 20) / 2;
    const by = H - 55;
    opciones.forEach((op, i) => {
        const bx = startX + i * (bw + 20);
        if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) {
            tocarOpcion(i);
        }
    });

    // También detectar clic directo en estrella
    estrellas.forEach((s, i) => {
        const float = Math.sin(tick * 0.03 + s.fase) * 4;
        if (!s.tocada && Math.hypot(mx - s.x, my - (s.y + float)) < s.r + 5) {
            const r = RONDAS[rondaIdx];
            if (s.num === r.inicio + paso) {
                // Clic directo correcto
                const opIdx = opciones.findIndex(o => o.correcta);
                if (opIdx >= 0) tocarOpcion(opIdx);
            }
        }
    });
}

// ── LOOP ──────────────────────────────────────────────────────
function loop() {
    tick++;
    ctx.clearRect(0, 0, W, H);
    dibujarFondo();

    if (!gameOver) {
        dibujarEstrellas();
        dibujarOpciones();
        dibujarZorritoAstronauta(tick);
        dibujarHUD();
        dibujarFlash();
    } else {
        dibujarEstrellas();
        dibujarZorritoAstronauta(tick);
        dibujarFinal();
    }

    requestAnimationFrame(loop);
}

// ── REINICIAR ─────────────────────────────────────────────────
function reiniciar() {
    rondaIdx = 0; aciertos = 0; vidas = 3;
    gameOver = false; ganado = false; guardado = false;
    flash = ''; flashT = 0;
    iniciarRonda();
}

// ── EVENTOS ───────────────────────────────────────────────────
canvas.addEventListener('click', e => {
    const r  = canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (W / r.width);
    const my = (e.clientY - r.top)  * (H / r.height);
    if (gameOver) {
        if (mx > W/2-100 && mx < W/2+100 && my > H/2+78 && my < H/2+126) reiniciar();
        return;
    }
    detectarClic(mx, my);
});

canvas.addEventListener('touchend', e => {
    e.preventDefault();
    const t  = e.changedTouches[0];
    const r  = canvas.getBoundingClientRect();
    const mx = (t.clientX - r.left) * (W / r.width);
    const my = (t.clientY - r.top)  * (H / r.height);
    if (gameOver) {
        if (mx > W/2-100 && mx < W/2+100 && my > H/2+78 && my < H/2+126) reiniciar();
        return;
    }
    detectarClic(mx, my);
});

// ── AUDIO ─────────────────────────────────────────────────────
let _au = false;
function _ia() { if (!_au) { _au = true; Sonidos.iniciar(1); } }
canvas.addEventListener('click',      _ia);
canvas.addEventListener('touchstart', _ia, { passive: true });
document.addEventListener('keydown',  _ia, { once: true });

// ── INICIO ────────────────────────────────────────────────────
iniciarRonda();
loop();