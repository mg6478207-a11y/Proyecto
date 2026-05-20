// ============================================================
//  RETOMATE - Grado 1, Módulo 4: Figuras y Formas
//  Juego: El zorrito pintor atrapa la figura geométrica correcta
//         Las figuras giran al caer desde el techo
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// ── PREGUNTAS ────────────────────────────────────────────────
const preguntas = [
    { q:'¿Cuál tiene 3 lados?',        r:'triangulo',  ops:['circulo','triangulo','cuadrado'] },
    { q:'¿Cuál tiene 4 lados iguales?', r:'cuadrado',  ops:['triangulo','cuadrado','rectangulo'] },
    { q:'¿Cuál es redondo?',            r:'circulo',   ops:['circulo','cuadrado','triangulo'] },
    { q:'¿Cuál tiene 4 lados?',         r:'rectangulo',ops:['circulo','rectangulo','triangulo'] },
    { q:'¿Cuál tiene 5 lados?',         r:'pentagono', ops:['cuadrado','pentagono','circulo'] },
    { q:'¿Cuál tiene 6 lados?',         r:'hexagono',  ops:['hexagono','triangulo','rectangulo'] },
    { q:'¿Cuál no tiene esquinas?',     r:'circulo',   ops:['rectangulo','triangulo','circulo'] },
    { q:'¿Cuál parece un techo?',       r:'triangulo', ops:['cuadrado','circulo','triangulo'] },
    { q:'¿Cuál tiene 4 lados distintos?',r:'rectangulo',ops:['cuadrado','rectangulo','pentagono'] },
    { q:'¿Cuál tiene 3 vértices?',      r:'triangulo', ops:['hexagono','circulo','triangulo'] },
];

// ── COLORES POR FIGURA ────────────────────────────────────────
const COLORES = {
    circulo:    { fill:'#f87171', stroke:'#b91c1c' },
    triangulo:  { fill:'#fbbf24', stroke:'#b45309' },
    cuadrado:   { fill:'#60a5fa', stroke:'#1d4ed8' },
    rectangulo: { fill:'#34d399', stroke:'#065f46' },
    pentagono:  { fill:'#a78bfa', stroke:'#4c1d95' },
    hexagono:   { fill:'#fb923c', stroke:'#9a3412' },
};

// ── ESTADO ───────────────────────────────────────────────────
let pregIdx = 0, aciertos = 0, vidas = 3;
let gameOver = false, ganado = false, guardado = false;
let flash = '', flashT = 0, tick = 0;

// ── PINCEL (zorrito con pincel) ───────────────────────────────
const pincel = {
    x: W / 2,
    y: H - 80,
    w: 80,
    h: 20,
    vel: 2.5,
    izq: false,
    der: false,
};

// ── FIGURAS CAYENDO ───────────────────────────────────────────
let figuras = [];

function crearFiguras() {
    figuras = [];
    if (pregIdx >= preguntas.length) return;
    const p  = preguntas[pregIdx];
    const ops = [...p.ops];
    // Mezclar
    for (let i = ops.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ops[i], ops[j]] = [ops[j], ops[i]];
    }
    const posX = [160, 400, 640];
    ops.forEach((tipo, i) => {
        figuras.push({
            x: posX[i],
            y: -60 - i * 80,
            tipo,
            correcta: tipo === p.r,
            speed: 0.7,
            rot: 0,
            rotVel: (Math.random() - 0.5) * 0.01,
            capturada: false,
            escala: 1,
        });
    });
}

// ── DIBUJAR FIGURA ────────────────────────────────────────────
function dibujarFigura(ctx, tipo, x, y, tam, rot, alpha) {
    const c = COLORES[tipo] || { fill:'#aaa', stroke:'#555' };
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;

    ctx.fillStyle   = c.fill;
    ctx.strokeStyle = c.stroke;
    ctx.lineWidth   = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur  = 6;

    ctx.beginPath();
    switch (tipo) {
        case 'circulo':
            ctx.arc(0, 0, tam, 0, Math.PI * 2);
            break;
        case 'triangulo':
            ctx.moveTo(0, -tam);
            ctx.lineTo(-tam, tam * 0.7);
            ctx.lineTo(tam, tam * 0.7);
            ctx.closePath();
            break;
        case 'cuadrado':
            ctx.rect(-tam, -tam, tam * 2, tam * 2);
            break;
        case 'rectangulo':
            ctx.rect(-tam * 1.4, -tam * 0.7, tam * 2.8, tam * 1.4);
            break;
        case 'pentagono':
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
                i === 0 ? ctx.moveTo(Math.cos(a)*tam, Math.sin(a)*tam)
                        : ctx.lineTo(Math.cos(a)*tam, Math.sin(a)*tam);
            }
            ctx.closePath();
            break;
        case 'hexagono':
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                i === 0 ? ctx.moveTo(Math.cos(a)*tam, Math.sin(a)*tam)
                        : ctx.lineTo(Math.cos(a)*tam, Math.sin(a)*tam);
            }
            ctx.closePath();
            break;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Etiqueta nombre de la figura
    ctx.rotate(-rot);
    ctx.fillStyle   = 'white';
    ctx.strokeStyle = c.stroke;
    ctx.lineWidth   = 3;
    ctx.font        = 'bold 13px Comic Sans MS';
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.strokeText(tipo, 0, tam + 18);
    ctx.fillText(tipo, 0, tam + 18);

    ctx.globalAlpha = 1;
    ctx.restore();
}

// ── DIBUJAR ZORRITO CON PINCEL ────────────────────────────────
function dibujarZorritoPincel(px, py) {
    const cx = px;
    const bounce = Math.sin(tick * 0.15) * 3;

    // Pincel (bandeja que atrapa)
    const gradPincel = ctx.createLinearGradient(cx - 50, py, cx + 50, py + 20);
    gradPincel.addColorStop(0, '#92400e');
    gradPincel.addColorStop(1, '#b45309');
    ctx.fillStyle = gradPincel;
    ctx.beginPath();
    ctx.roundRect(cx - 50, py + 5, 100, 18, 6);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Detalle pincel
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.roundRect(cx - 46, py + 9, 92, 6, 3);
    ctx.fill();

    // Zorrito encima del pincel
    const zy = py - 55 + bounce;
    // Orejas
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath(); ctx.moveTo(cx-8, zy+8); ctx.lineTo(cx-18, zy-8); ctx.lineTo(cx-2, zy+8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+2, zy+8); ctx.lineTo(cx+18, zy-8); ctx.lineTo(cx+8, zy+8); ctx.fill();
    ctx.fillStyle = '#ffb347';
    ctx.beginPath(); ctx.moveTo(cx-8, zy+8); ctx.lineTo(cx-14, zy+1); ctx.lineTo(cx-3, zy+8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+3, zy+8); ctx.lineTo(cx+14, zy+1); ctx.lineTo(cx+8, zy+8); ctx.fill();
    // Cabeza
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath(); ctx.arc(cx, zy+12, 16, 0, Math.PI*2); ctx.fill();
    // Cuerpo
    ctx.beginPath(); ctx.ellipse(cx, zy+32, 16, 14, 0, 0, Math.PI*2); ctx.fill();
    // Hocico
    ctx.fillStyle = '#fff5e6';
    ctx.beginPath(); ctx.ellipse(cx, zy+15, 9, 6, 0, 0, Math.PI*2); ctx.fill();
    // Nariz
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(cx, zy+11, 2.5, 0, Math.PI*2); ctx.fill();
    // Ojos felices (arcos hacia arriba = feliz)
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx-6, zy+8, 3, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx+6, zy+8, 3, Math.PI, 0); ctx.stroke();
    // Brazos sosteniendo pincel
    ctx.strokeStyle = '#ff8c00'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx-14, zy+28); ctx.lineTo(cx-36, zy+42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+14, zy+28); ctx.lineTo(cx+36, zy+42); ctx.stroke();
    // Manos
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath(); ctx.arc(cx-36, zy+42, 5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+36, zy+42, 5, 0, Math.PI*2); ctx.fill();
}

// ── DIBUJAR FONDO TALLER ──────────────────────────────────────
function dibujarFondo() {
    // Pared
    ctx.fillStyle = '#fce4ec';
    ctx.fillRect(0, 0, W, H);

    // Azulejos decorativos
    ctx.strokeStyle = 'rgba(194,24,91,0.1)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 50) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += 50) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // Pinturas de fondo decorativas
    const deco = [
        {x:60,  y:80,  tipo:'circulo',    tam:22, col:'rgba(248,113,113,0.15)'},
        {x:740, y:100, tipo:'cuadrado',   tam:20, col:'rgba(96,165,250,0.15)'},
        {x:100, y:320, tipo:'triangulo',  tam:25, col:'rgba(251,191,36,0.15)'},
        {x:720, y:300, tipo:'pentagono',  tam:22, col:'rgba(167,139,250,0.15)'},
        {x:400, y:60,  tipo:'hexagono',   tam:20, col:'rgba(251,146,60,0.15)'},
    ];
    deco.forEach(d => {
        ctx.fillStyle = d.col;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.tam, 0, Math.PI * 2);
        ctx.fill();
    });

    // Suelo
    ctx.fillStyle = '#f48fb1';
    ctx.fillRect(0, H - 40, W, 40);
    ctx.fillStyle = '#c2185b';
    ctx.fillRect(0, H - 44, W, 6);

    // Manchas de pintura en suelo
    const manchas = [
        {x:80,  c:'#f87171'}, {x:200, c:'#60a5fa'}, {x:350, c:'#fbbf24'},
        {x:500, c:'#34d399'}, {x:650, c:'#a78bfa'}, {x:760, c:'#fb923c'},
    ];
    manchas.forEach(m => {
        ctx.fillStyle = m.c;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(m.x, H - 28, 18, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    // Cuerdas del techo de las que cuelgan las figuras
    figuras.forEach(f => {
        if (f.capturada) return;
        ctx.strokeStyle = 'rgba(180,100,50,0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(f.x, 0);
        ctx.lineTo(f.x, f.y - 30);
        ctx.stroke();
        ctx.setLineDash([]);
    });
}

// ── HUD ───────────────────────────────────────────────────────
function dibujarHUD() {
    if (pregIdx >= preguntas.length) return;
    const p = preguntas[pregIdx];
    ctx.fillStyle = 'rgba(136,14,79,0.9)';
    ctx.beginPath(); ctx.roundRect(20, 10, W - 40, 52, 10); ctx.fill();
    ctx.font = 'bold 22px Comic Sans MS';
    ctx.fillStyle = '#fce4ec';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.q, W / 2, 36);
    ctx.font = '20px serif'; ctx.textAlign = 'left';
    for (let i = 0; i < vidas; i++) ctx.fillText('❤️', 22 + i * 28, 76);
    ctx.font = 'bold 14px Arial'; ctx.fillStyle = '#fce4ec'; ctx.textAlign = 'right';
    ctx.fillText(`✅ ${aciertos}/${preguntas.length}`, W - 22, 76);
}

// ── FLASH ─────────────────────────────────────────────────────
function dibujarFlash() {
    if (!flash || flashT <= 0) return;
    ctx.globalAlpha = Math.min(1, flashT / 20);
    ctx.font = 'bold 34px Comic Sans MS';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#333'; ctx.lineWidth = 4;
    ctx.strokeText(flash, W / 2, H / 2 - 40);
    ctx.fillStyle = flash.includes('!') ? '#fbbf24' : '#f87171';
    ctx.fillText(flash, W / 2, H / 2 - 40);
    ctx.globalAlpha = 1;
    flashT--;
}

// ── PANTALLA FINAL ────────────────────────────────────────────
function dibujarFinal() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.font = 'bold 38px Comic Sans MS';
    ctx.fillStyle = ganado ? '#fbbf24' : '#f87171';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ganado ? '🎨 ¡Eres un artista!' : '🖌️ ¡Inténtalo de nuevo!', W / 2, H / 2 - 55);
    ctx.font = '22px Comic Sans MS'; ctx.fillStyle = 'white';
    ctx.fillText(`Respuestas correctas: ${aciertos} de ${preguntas.length}`, W / 2, H / 2);
    ctx.fillText(`Puntaje: ${Math.round(aciertos / preguntas.length * 100)}%`, W / 2, H / 2 + 38);
    ctx.fillStyle = '#c2185b';
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
            body: JSON.stringify({
                unidad: 104, aciertos,
                total: preguntas.length,
                puntaje: Math.round(aciertos / preguntas.length * 100),
            }),
        });
    } catch (e) {}
}

// ── COLISIÓN PINCEL - FIGURA ──────────────────────────────────
function colisionaPincel(f) {
    return (
        f.y + 30 >= pincel.y + 5 &&
        f.y - 30 <= pincel.y + 23 &&
        f.x >= pincel.x - 50 &&
        f.x <= pincel.x + 50
    );
}

// ── LOOP ──────────────────────────────────────────────────────
function loop() {
    tick++;
    ctx.clearRect(0, 0, W, H);
    dibujarFondo();

    if (gameOver) {
        dibujarZorritoPincel(pincel.x, pincel.y);
        dibujarFinal();
        requestAnimationFrame(loop);
        return;
    }

    // Mover pincel
    if (pincel.izq && pincel.x - 50 > 0)  pincel.x -= pincel.vel;
    if (pincel.der && pincel.x + 50 < W)  pincel.x += pincel.vel;

    // Mover figuras y detectar colisión
    figuras.forEach(f => {
        if (f.capturada) return;
        f.y   += f.speed;
        f.rot += f.rotVel;

        dibujarFigura(ctx, f.tipo, f.x, f.y, 30, f.rot, 1);

        if (colisionaPincel(f)) {
            f.capturada = true;
            if (f.correcta) {
                aciertos++;
                Sonidos.correcto();
                flash  = '¡Forma correcta! 🎨';
                flashT = 45;
            } else {
                vidas--;
                Sonidos.incorrecto();
                flash  = '¡Esa no es! 🖌️';
                flashT = 45;
                if (vidas <= 0) {
                    gameOver = true; ganado = false;
                    Sonidos.perder(); guardarProgreso(); return;
                }
            }
            pregIdx++;
            if (pregIdx >= preguntas.length) {
                gameOver = true;
                ganado   = aciertos >= Math.ceil(preguntas.length * 0.6);
                if (ganado) Sonidos.ganar(); else Sonidos.perder();
                guardarProgreso();
            } else {
                crearFiguras();
            }
            return;
        }

        // Figura escapó por abajo
        if (f.y > H + 40 && !f.capturada) {
            f.capturada = true;
            vidas--;
            Sonidos.incorrecto();
            flash  = '¡Se escapó! 😅';
            flashT = 45;
            if (vidas <= 0) {
                gameOver = true; ganado = false;
                Sonidos.perder(); guardarProgreso(); return;
            }
            pregIdx++;
            if (pregIdx >= preguntas.length) {
                gameOver = true;
                ganado   = aciertos >= Math.ceil(preguntas.length * 0.6);
                if (ganado) Sonidos.ganar(); else Sonidos.perder();
                guardarProgreso();
            } else {
                crearFiguras();
            }
        }
    });

    dibujarZorritoPincel(pincel.x, pincel.y);
    dibujarHUD();
    dibujarFlash();
    requestAnimationFrame(loop);
}

// ── REINICIAR ─────────────────────────────────────────────────
function reiniciar() {
    pregIdx = 0; aciertos = 0; vidas = 3;
    gameOver = false; ganado = false; guardado = false;
    flash = ''; flashT = 0;
    pincel.x = W / 2;
    crearFiguras();
}

// ── CONTROLES TECLADO ─────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  pincel.izq = true;
    if (e.key === 'ArrowRight') pincel.der = true;
});
document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft')  pincel.izq = false;
    if (e.key === 'ArrowRight') pincel.der = false;
});

// ── CONTROLES TÁCTILES ────────────────────────────────────────
const btnL = document.getElementById('btnL');
const btnR = document.getElementById('btnR');
btnL.addEventListener('touchstart', e => { e.preventDefault(); pincel.izq = true; });
btnL.addEventListener('touchend',   e => { e.preventDefault(); pincel.izq = false; });
btnR.addEventListener('touchstart', e => { e.preventDefault(); pincel.der = true; });
btnR.addEventListener('touchend',   e => { e.preventDefault(); pincel.der = false; });
btnL.addEventListener('mousedown',  () => pincel.izq = true);
btnL.addEventListener('mouseup',    () => pincel.izq = false);
btnR.addEventListener('mousedown',  () => pincel.der = true);
btnR.addEventListener('mouseup',    () => pincel.der = false);

// ── CLIC REINICIAR ────────────────────────────────────────────
canvas.addEventListener('click', e => {
    if (!gameOver) return;
    const r  = canvas.getBoundingClientRect();
    const cx = (e.clientX - r.left) * (W / r.width);
    const cy = (e.clientY - r.top)  * (H / r.height);
    if (cx > W/2-100 && cx < W/2+100 && cy > H/2+78 && cy < H/2+126) reiniciar();
});
canvas.addEventListener('touchend', e => {
    if (!gameOver) return;
    const t  = e.changedTouches[0];
    const r  = canvas.getBoundingClientRect();
    const cx = (t.clientX - r.left) * (W / r.width);
    const cy = (t.clientY - r.top)  * (H / r.height);
    if (cx > W/2-100 && cx < W/2+100 && cy > H/2+78 && cy < H/2+126) reiniciar();
});

// ── AUDIO ─────────────────────────────────────────────────────
let _au = false;
function _ia() { if (!_au) { _au = true; Sonidos.iniciar(1); } }
canvas.addEventListener('click',      _ia);
canvas.addEventListener('touchstart', _ia, { passive: true });
document.addEventListener('keydown',  _ia, { once: true });

// ── INICIO ────────────────────────────────────────────────────
crearFiguras();
loop();