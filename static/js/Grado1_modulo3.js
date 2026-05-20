// ============================================================
//  RETOMATE - Grado 1, Módulo 3: Restas con el zorrito
//  Juego: El zorrito salta de piedra en piedra en el río
//         Elige la piedra con la respuesta correcta
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// ── PREGUNTAS ────────────────────────────────────────────────
const preguntas = [
    { q:'5 - 2 = ?',  r:3,  ops:[1,3,5]  },
    { q:'8 - 3 = ?',  r:5,  ops:[4,5,6]  },
    { q:'7 - 4 = ?',  r:3,  ops:[2,3,4]  },
    { q:'10 - 6 = ?', r:4,  ops:[3,4,5]  },
    { q:'9 - 5 = ?',  r:4,  ops:[3,4,6]  },
    { q:'6 - 2 = ?',  r:4,  ops:[3,4,5]  },
    { q:'8 - 5 = ?',  r:3,  ops:[2,3,4]  },
    { q:'10 - 3 = ?', r:7,  ops:[6,7,8]  },
    { q:'9 - 4 = ?',  r:5,  ops:[4,5,6]  },
    { q:'7 - 2 = ?',  r:5,  ops:[4,5,3]  },
];

// ── ESTADO ───────────────────────────────────────────────────
let pregIdx = 0, aciertos = 0, vidas = 3;
let gameOver = false, ganado = false, guardado = false;
let flash = '', flashT = 0, tick = 0;

// ── ZORRITO ───────────────────────────────────────────────────
const zorrito = {
    x: 120, y: 0,       // y se calcula según piedra actual
    vy: 0, vx: 0,
    enSuelo: true,
    saltando: false,
    piedraObjetivo: 1,  // índice de piedra destino (0=izq,1=centro,2=der)
    piedraActual: -1,   // -1 = orilla izquierda
    animFrame: 0,
    animT: 0,
};

// ── PIEDRAS ───────────────────────────────────────────────────
// 3 piedras por pregunta, en columnas fijas
const COL_X = [250, 400, 550];  // x de cada piedra
const PIEDRA_Y = H - 130;       // y de la superficie de las piedras
const ORILLA_Y = H - 100;       // y de la orilla
let piedras = [];

function crearPiedras() {
    piedras = [];
    if (pregIdx >= preguntas.length) return;
    const p = preguntas[pregIdx];
    // Mezclar opciones con posiciones
    const ops = [...p.ops];
    for (let i = ops.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ops[i], ops[j]] = [ops[j], ops[i]];
    }
    COL_X.forEach((x, i) => {
        piedras.push({
            x, y: PIEDRA_Y,
            valor: ops[i],
            correcta: ops[i] === p.r,
            w: 90, h: 35,
            animY: 0,
        });
    });
}

// ── POSICIÓN ZORRITO SEGÚN ORILLA/PIEDRA ────────────────────
// ALTURA_ZORRITO = distancia desde y (tope cabeza) hasta las patas = 55px
const ALTURA_ZORRITO = 55;

function ySuperficie(idx) {
    if (idx === -1) return ORILLA_Y - ALTURA_ZORRITO;
    if (idx === 3)  return ORILLA_Y - ALTURA_ZORRITO;
    return piedras[idx] ? piedras[idx].y - piedras[idx].h/2 - ALTURA_ZORRITO : PIEDRA_Y - ALTURA_ZORRITO;
}
function xPosicion(idx) {
    if (idx === -1) return 100;
    if (idx === 3)  return W - 100;
    return COL_X[idx];
}

// ── INICIAR SALTO ─────────────────────────────────────────────
function saltar(destino) {
    if (!zorrito.enSuelo || gameOver) return;
    if (destino < 0 || destino > 2) return;
    zorrito.enSuelo    = false;
    zorrito.saltando   = true;
    zorrito.piedraObjetivo = destino;
    const tx = xPosicion(destino);
    const ty = ySuperficie(destino);
    const dx = tx - zorrito.x;
    const dy = ty - zorrito.y;
    // Velocidad parabólica
    const frames = 90;
    zorrito.vx = dx / frames;
    zorrito.vy = (dy - (-6)) / frames;  // arco hacia arriba
    zorrito.gravedad = (0.12) / (frames * frames);
}

// ── DIBUJAR FONDO RÍO ────────────────────────────────────────
function dibujarFondo() {
    // Cielo
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(0, 0, W, H);

    // Nubes
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    [[80,50,70],[280,35,90],[550,55,65],[730,40,80]].forEach(([cx,cy,r]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r*.6, 0, Math.PI*2);
        ctx.arc(cx+r*.4, cy-r*.2, r*.4, 0, Math.PI*2);
        ctx.arc(cx-r*.4, cy-r*.1, r*.35, 0, Math.PI*2);
        ctx.fill();
    });

    // Río
    const grad = ctx.createLinearGradient(0, H-170, 0, H);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(1, '#0369a1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, H-170, W, 170);

    // Olas animadas
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
        const oy = H - 150 + i*25 + Math.sin(tick*0.04+i)*5;
        ctx.beginPath();
        for (let ox = 0; ox < W; ox += 40) {
            ctx.quadraticCurveTo(ox+20, oy-8, ox+40, oy);
        }
        ctx.stroke();
    }

    // Orilla izquierda
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, H-105, 180, 105);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, H-100, 180, 100);

    // Orilla derecha
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(W-180, H-105, 180, 105);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(W-180, H-100, 180, 100);

    // Pasto orillaizq
    ctx.strokeStyle = '#15803d'; ctx.lineWidth = 2;
    for (let gx = 10; gx < 175; gx += 15) {
        ctx.beginPath();
        ctx.moveTo(gx, H-100);
        ctx.lineTo(gx+4, H-112);
        ctx.lineTo(gx+8, H-100);
        ctx.stroke();
    }
    // Pasto orillader
    for (let gx = W-175; gx < W-10; gx += 15) {
        ctx.beginPath();
        ctx.moveTo(gx, H-100);
        ctx.lineTo(gx+4, H-112);
        ctx.lineTo(gx+8, H-100);
        ctx.stroke();
    }

    // Florcitas orillas
    const colFlor = ['#f87171','#fde047','#a78bfa'];
    [30,60,90,120,150].forEach((fx,i) => {
        dibujarFlorcita(ctx, fx, H-102, colFlor[i%3]);
        dibujarFlorcita(ctx, W-fx, H-102, colFlor[(i+1)%3]);
    });
}

function dibujarFlorcita(ctx, x, y, c) {
    ctx.fillStyle = c;
    for (let i = 0; i < 5; i++) {
        const a = (i/5)*Math.PI*2;
        ctx.beginPath();
        ctx.arc(x+Math.cos(a)*5, y+Math.sin(a)*5, 4, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill();
}

// ── DIBUJAR PIEDRAS ───────────────────────────────────────────
function dibujarPiedras() {
    piedras.forEach((p, i) => {
        const sel = zorrito.piedraObjetivo === i && zorrito.enSuelo;

        // Flecha indicadora animada encima de la piedra seleccionada
        if (sel) {
            const fy = p.y - 58 + Math.sin(tick * 0.05) * 7;
            ctx.fillStyle = '#fde047';
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p.x,      fy + 18);
            ctx.lineTo(p.x - 14, fy);
            ctx.lineTo(p.x + 14, fy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + p.h/2 + 6, p.w/2, 8, 0, 0, Math.PI*2);
        ctx.fill();
        // Piedra base
        ctx.fillStyle = sel ? '#94a3b8' : '#64748b';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.w/2, p.h/2, 0, 0, Math.PI*2);
        ctx.fill();
        // Brillo piedra
        ctx.fillStyle = sel ? '#cbd5e1' : '#94a3b8';
        ctx.beginPath();
        ctx.ellipse(p.x-8, p.y-6, p.w/2-12, p.h/2-8, -0.3, 0, Math.PI*2);
        ctx.fill();
        // Número
        ctx.font = 'bold 22px Comic Sans MS';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(String(p.valor), p.x, p.y);
        ctx.fillText(String(p.valor), p.x, p.y);
    });
}

// ── DIBUJAR ZORRITO ───────────────────────────────────────────
function dibujarZorrito(x, y) {
    // y = posición del TOPE de la cabeza
    // Las patas tocan exactamente y + ALTURA_ZORRITO (55px)
    const cx = x;
    const B = y; // base de referencia desde arriba
    const animW = zorrito.enSuelo ? Math.sin(tick*0.2)*2 : 0;

    // Orejas (detrás de la cabeza)
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath(); ctx.moveTo(cx-8, B+10); ctx.lineTo(cx-18, B-6); ctx.lineTo(cx-2, B+10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+2, B+10); ctx.lineTo(cx+18, B-6); ctx.lineTo(cx+8, B+10); ctx.fill();
    ctx.fillStyle = '#ffb347';
    ctx.beginPath(); ctx.moveTo(cx-8, B+10); ctx.lineTo(cx-14, B+1); ctx.lineTo(cx-3, B+10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+3, B+10); ctx.lineTo(cx+14, B+1); ctx.lineTo(cx+8, B+10); ctx.fill();

    // Cuerpo
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath(); ctx.ellipse(cx, B+32, 18+animW, 16, 0, 0, Math.PI*2); ctx.fill();

    // Cabeza
    ctx.beginPath(); ctx.arc(cx, B+12, 16, 0, Math.PI*2); ctx.fill();

    // Hocico
    ctx.fillStyle = '#fff5e6';
    ctx.beginPath(); ctx.ellipse(cx, B+15, 9, 6, 0, 0, Math.PI*2); ctx.fill();

    // Nariz
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(cx, B+11, 2.5, 0, Math.PI*2); ctx.fill();

    // Ojos
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(cx-6, B+7, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+6, B+7, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(cx-5, B+6, 1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+7, B+6, 1, 0, Math.PI*2); ctx.fill();

    // Cola
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath();
    ctx.moveTo(cx+16, B+34);
    ctx.quadraticCurveTo(cx+32, B+18, cx+26, B+8);
    ctx.quadraticCurveTo(cx+40, B+16, cx+22, B+38);
    ctx.fill();
    ctx.fillStyle = '#fff5e6';
    ctx.beginPath(); ctx.arc(cx+26, B+8, 4, 0, Math.PI*2); ctx.fill();

    // Patas — tocan exactamente y+55 = superficie
    ctx.fillStyle = '#cc5500';
    if (zorrito.enSuelo) {
        const pa = Math.sin(tick*0.25)*5;
        ctx.beginPath(); ctx.ellipse(cx-9, B+50+pa, 9, 5, -0.15, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx+9, B+50-pa, 9, 5,  0.15, 0, Math.PI*2); ctx.fill();
    } else {
        ctx.beginPath(); ctx.ellipse(cx-13, B+46, 9, 5, -0.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx+13, B+46, 9, 5,  0.5, 0, Math.PI*2); ctx.fill();
    }
}

// ── HUD ───────────────────────────────────────────────────────
function dibujarHUD() {
    if (pregIdx >= preguntas.length) return;
    const p = preguntas[pregIdx];
    ctx.fillStyle = 'rgba(3,105,161,0.9)';
    ctx.beginPath(); ctx.roundRect(20, 10, W-40, 52, 10); ctx.fill();
    ctx.font = 'bold 24px Comic Sans MS';
    ctx.fillStyle = '#fde047';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.q, W/2, 36);
    // Vidas
    ctx.font = '20px serif'; ctx.textAlign = 'left';
    for (let i = 0; i < vidas; i++) ctx.fillText('❤️', 22+i*28, 76);
    // Puntaje
    ctx.font = 'bold 15px Arial'; ctx.fillStyle = '#bae6fd'; ctx.textAlign = 'right';
    ctx.fillText(`✅ ${aciertos}/${preguntas.length}`, W-22, 76);
}

// ── FLASH ─────────────────────────────────────────────────────
function dibujarFlash() {
    if (!flash || flashT <= 0) return;
    ctx.globalAlpha = Math.min(1, flashT/20);
    ctx.font = 'bold 34px Comic Sans MS';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
    ctx.strokeText(flash, W/2, H/2-40);
    ctx.fillStyle = flash.includes('!') ? '#fde047' : '#f87171';
    ctx.fillText(flash, W/2, H/2-40);
    ctx.globalAlpha = 1;
    flashT--;
}

// ── PANTALLA FINAL ────────────────────────────────────────────
function dibujarFinal() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.font = 'bold 38px Comic Sans MS';
    ctx.fillStyle = ganado ? '#fde047' : '#f87171';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ganado ? '🎉 ¡Cruzaste el río!' : '💧 ¡Inténtalo de nuevo!', W/2, H/2-55);
    ctx.font = '22px Comic Sans MS'; ctx.fillStyle = 'white';
    ctx.fillText(`Respuestas correctas: ${aciertos} de ${preguntas.length}`, W/2, H/2);
    ctx.fillText(`Puntaje: ${Math.round(aciertos/preguntas.length*100)}%`, W/2, H/2+38);
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath(); ctx.roundRect(W/2-100, H/2+78, 200, 48, 12); ctx.fill();
    ctx.font = 'bold 19px Comic Sans MS'; ctx.fillStyle = 'white';
    ctx.fillText('▶ Jugar de nuevo', W/2, H/2+102);
}

// ── GUARDAR PROGRESO ──────────────────────────────────────────
async function guardarProgreso() {
    if (guardado) return; guardado = true;
    try {
        await fetch('/guardar_progreso', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
                unidad: 103, aciertos,
                total: preguntas.length,
                puntaje: Math.round(aciertos/preguntas.length*100),
            }),
        });
    } catch(e) {}
}

// ── LÓGICA DE SALTO Y ATERRIZAJE ─────────────────────────────
function actualizarZorrito() {
    if (zorrito.enSuelo || gameOver) return;

    zorrito.x  += zorrito.vx;
    zorrito.y  += zorrito.vy;
    zorrito.vy += zorrito.gravedad;

    const destY = ySuperficie(zorrito.piedraObjetivo);
    const destX = xPosicion(zorrito.piedraObjetivo);

    // Detectar aterrizaje
    if (zorrito.y >= destY && Math.abs(zorrito.x - destX) < 12) {
        zorrito.y        = destY;
        zorrito.x        = destX;
        zorrito.enSuelo  = true;
        zorrito.saltando = false;
        zorrito.vy = 0; zorrito.vx = 0;

        const piedraIdx = zorrito.piedraObjetivo;
        zorrito.piedraActual = piedraIdx;

        if (piedras[piedraIdx].correcta) {
            aciertos++;
            Sonidos.correcto();
            flash = '¡Bien saltado! 🪨';
            flashT = 80;
            pregIdx++;
            if (pregIdx >= preguntas.length) {
                gameOver = true;
                ganado = aciertos >= Math.ceil(preguntas.length*0.6);
                if (ganado) Sonidos.ganar(); else Sonidos.perder();
                guardarProgreso();
            } else {
                // Mover zorrito a orilla der si terminó, sino volver orilla izq para nueva pregunta
                setTimeout(() => {
                    zorrito.x = 100; zorrito.y = ySuperficie(-1);
                    zorrito.piedraActual = -1;
                    zorrito.piedraObjetivo = 1;
                    crearPiedras();
                }, 1200);
            }
        } else {
            vidas--;
            Sonidos.incorrecto();
            flash = '¡Esa piedra es falsa! 💦';
            flashT = 80;
            if (vidas <= 0) {
                gameOver = true; ganado = false;
                Sonidos.perder(); guardarProgreso();
            } else {
                // Rebotar de vuelta a orilla
                setTimeout(() => {
                    zorrito.x = 100; zorrito.y = ySuperficie(-1);
                    zorrito.piedraActual = -1;
                    zorrito.piedraObjetivo = 1;
                    crearPiedras();
                }, 1200);
            }
        }
    }
}

// ── LOOP ──────────────────────────────────────────────────────
function loop() {
    tick+=0.40;
    ctx.clearRect(0, 0, W, H);
    dibujarFondo();
    dibujarPiedras();
    actualizarZorrito();
    dibujarZorrito(zorrito.x, zorrito.y);
    dibujarHUD();
    dibujarFlash();
    if (gameOver) dibujarFinal();
    requestAnimationFrame(loop);
}

// ── REINICIAR ─────────────────────────────────────────────────
function reiniciar() {
    pregIdx = 0; aciertos = 0; vidas = 3;
    gameOver = false; ganado = false; guardado = false;
    flash = ''; flashT = 0;
    zorrito.x = 100; zorrito.y = ySuperficie(-1);
    zorrito.enSuelo = true; zorrito.piedraActual = -1;
    zorrito.piedraObjetivo = 1;
    crearPiedras();
}

// ── CONTROLES ─────────────────────────────────────────────────
// TECLADO: flechas izq/der seleccionan, arriba/espacio salta
document.addEventListener('keydown', e => {
    if (gameOver) return;
    if (e.key === 'ArrowLeft')  { zorrito.piedraObjetivo = Math.max(0, zorrito.piedraObjetivo-1); }
    if (e.key === 'ArrowRight') { zorrito.piedraObjetivo = Math.min(2, zorrito.piedraObjetivo+1); }
    if (e.key === 'ArrowUp' || e.key === ' ') { e.preventDefault(); saltar(zorrito.piedraObjetivo); }
});

// BOTONES TÁCTILES: solo seleccionan la piedra
document.getElementById('btnIzq').addEventListener('click', () => {
    if (!gameOver && zorrito.enSuelo) zorrito.piedraObjetivo = Math.max(0, zorrito.piedraObjetivo-1);
});
document.getElementById('btnDer').addEventListener('click', () => {
    if (!gameOver && zorrito.enSuelo) zorrito.piedraObjetivo = Math.min(2, zorrito.piedraObjetivo+1);
});
// BOTÓN SALTAR táctil
document.getElementById('btnSaltar').addEventListener('click', () => {
    if (!gameOver) saltar(zorrito.piedraObjetivo);
});

// CLICK EN CANVAS: solo para reiniciar al terminar
canvas.addEventListener('click', e => {
    if (!gameOver) return;
    const r = canvas.getBoundingClientRect();
    const cx = (e.clientX - r.left) * (W / r.width);
    const cy = (e.clientY - r.top)  * (H / r.height);
    if (cx > W/2-100 && cx < W/2+100 && cy > H/2+78 && cy < H/2+126) reiniciar();
});
canvas.addEventListener('touchend', e => {
    e.preventDefault();
    if (!gameOver) return;
    const t = e.changedTouches[0];
    const r = canvas.getBoundingClientRect();
    const mx = (t.clientX - r.left) * (W / r.width);
    const my = (t.clientY - r.top)  * (H / r.height);
    if (mx > W/2-100 && mx < W/2+100 && my > H/2+78 && my < H/2+126) reiniciar();
});

// ── AUDIO ─────────────────────────────────────────────────────
let _au = false;
function _ia() { if (!_au) { _au=true; Sonidos.iniciar(1); } }
canvas.addEventListener('click', _ia);
canvas.addEventListener('touchstart', _ia, {passive:true});
document.addEventListener('keydown', _ia, {once:true});

// ── INICIO ────────────────────────────────────────────────────
zorrito.x = 100;
zorrito.y = ySuperficie(-1);
crearPiedras();
loop();