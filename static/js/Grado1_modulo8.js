// ============================================================
//  RETOMATE - Grado 1, Módulo 8: Comparar Cantidades
//  Juego: El zorrito juez compara dos grupos con una balanza
//         Elige: izquierda tiene MÁS / derecha tiene MÁS / son IGUALES
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// ── PREGUNTAS ─────────────────────────────────────────────────
// r: 'izq' | 'der' | 'igual'
const preguntas = [
    { izq:7,  der:4,  emoji:'🍎', r:'izq',   q:'¿Qué lado tiene más manzanas?' },
    { izq:3,  der:8,  emoji:'⭐', r:'der',   q:'¿Qué lado tiene más estrellas?' },
    { izq:5,  der:5,  emoji:'🌸', r:'igual', q:'¿Son iguales o uno tiene más?' },
    { izq:9,  der:6,  emoji:'🐢', r:'izq',   q:'¿Qué lado tiene más tortugas?' },
    { izq:2,  der:7,  emoji:'🍭', r:'der',   q:'¿Qué lado tiene más dulces?' },
    { izq:6,  der:6,  emoji:'🎈', r:'igual', q:'¿Son iguales o uno tiene más?' },
    { izq:8,  der:3,  emoji:'🌙', r:'izq',   q:'¿Qué lado tiene más lunas?' },
    { izq:4,  der:9,  emoji:'🦋', r:'der',   q:'¿Qué lado tiene más mariposas?' },
    { izq:10, der:7,  emoji:'🍦', r:'izq',   q:'¿Qué lado tiene más helados?' },
    { izq:5,  der:5,  emoji:'🐝', r:'igual', q:'¿Son iguales o uno tiene más?' },
];

// ── ESTADO ───────────────────────────────────────────────────
let pregIdx  = 0, aciertos = 0, vidas = 3;
let gameOver = false, ganado = false, guardado = false;
let flash = '', flashT = 0, tick = 0;
let anguloBalanza = 0;    // ángulo actual de la balanza animada
let anguloObjetivo = 0;   // ángulo al que debe llegar
let mostrandoResp = false;
let respTimer = 0;

// ── CALCULAR ÁNGULO DE BALANZA ────────────────────────────────
function calcularAngulo(p) {
    if (p.r === 'igual') return 0;
    if (p.r === 'izq') return -0.18;  // izq baja
    return 0.18;                       // der baja
}

function iniciarPregunta() {
    if (pregIdx >= preguntas.length) return;
    anguloObjetivo = calcularAngulo(preguntas[pregIdx]);
    anguloBalanza  = 0;
    mostrandoResp  = false;
}

// ── DIBUJAR FONDO ─────────────────────────────────────────────
function dibujarFondo() {
    // Sala del tribunal
    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(0, 0, W, H);

    // Paredes
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(0, 0, W, H * 0.55);

    // Zócalo
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(0, H * 0.55, W, 8);

    // Suelo
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0, H * 0.55 + 8, W, H - H * 0.55 - 8);

    // Patrón suelo
    ctx.strokeStyle = 'rgba(234,88,12,0.15)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 50) {
        ctx.beginPath(); ctx.moveTo(gx, H*0.56); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = H*0.56; gy < H; gy += 50) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // Ventanas decorativas
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(60, 30, 80, 100);
    ctx.fillRect(W-140, 30, 80, 100);
    ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 3;
    ctx.strokeRect(60, 30, 80, 100);
    ctx.strokeRect(W-140, 30, 80, 100);
    // Cruces ventanas
    ctx.beginPath();
    ctx.moveTo(100, 30); ctx.lineTo(100, 130);
    ctx.moveTo(60, 80);  ctx.lineTo(140, 80);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W-100, 30); ctx.lineTo(W-100, 130);
    ctx.moveTo(W-140, 80); ctx.lineTo(W-60, 80);
    ctx.stroke();
}

// ── DIBUJAR OBJETOS EN BANDEJA ────────────────────────────────
function dibujarObjetos(emoji, cantidad, cx, cy) {
    const cols = Math.min(cantidad, 5);
    const rows = Math.ceil(cantidad / 5);
    const tam  = cantidad > 6 ? 20 : 24;
    const padX = tam + 4;
    const padY = tam + 4;
    const totalW = cols * padX;
    const totalH = rows * padY;

    for (let i = 0; i < cantidad; i++) {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const ox  = cx - totalW / 2 + col * padX + padX / 2;
        const oy  = cy - totalH / 2 + row * padY + padY / 2;
        ctx.font = `${tam}px serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(emoji, ox, oy);
    }

    // Número
    ctx.font = 'bold 20px Comic Sans MS';
    ctx.fillStyle = '#7c2d12';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(cantidad), cx, cy + totalH / 2 + 16);
}

// ── DIBUJAR BALANZA ───────────────────────────────────────────
function dibujarBalanza(p) {
    const cx = W / 2;
    const cy = 290;
    const brazoL = 200;

    // Animar ángulo hacia objetivo
    anguloBalanza += (anguloObjetivo - anguloBalanza) * 0.06;

    // Poste vertical
    ctx.fillStyle = '#92400e';
    ctx.fillRect(cx - 8, cy - 20, 16, 160);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(cx - 5, cy - 20, 6, 160);

    // Base
    ctx.fillStyle = '#78350f';
    ctx.beginPath(); ctx.ellipse(cx, cy + 140, 60, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.fillRect(cx - 50, cy + 128, 100, 14);

    // Pivote central
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(cx, cy - 20, 12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b45309'; ctx.lineWidth = 2; ctx.stroke();

    // Brazo giratorio
    const ang  = anguloBalanza;
    const lx   = cx + Math.cos(Math.PI + ang) * brazoL;
    const ly   = cy - 20 + Math.sin(Math.PI + ang) * brazoL;
    const rx   = cx + Math.cos(ang) * brazoL;
    const ry   = cy - 20 + Math.sin(ang) * brazoL;

    ctx.strokeStyle = '#92400e'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx, ry); ctx.stroke();
    ctx.strokeStyle = '#b45309'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx, ry); ctx.stroke();

    // Cuerdas y bandejas
    const bandH = 50;
    // Bandeja izquierda
    const lbx = lx, lby = ly + bandH;
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lbx - 40, lby); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lbx + 40, lby); ctx.stroke();
    ctx.fillStyle = '#d97706';
    ctx.beginPath(); ctx.ellipse(lbx, lby, 55, 14, ang, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2; ctx.stroke();

    // Bandeja derecha
    const rbx = rx, rby = ry + bandH;
    ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rbx - 40, rby); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rbx + 40, rby); ctx.stroke();
    ctx.fillStyle = '#d97706';
    ctx.beginPath(); ctx.ellipse(rbx, rby, 55, 14, ang, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2; ctx.stroke();

    // Objetos en bandejas
    dibujarObjetos(p.emoji, p.izq, lbx, lby - 30);
    dibujarObjetos(p.emoji, p.der, rbx, rby - 30);

    // Etiquetas IZQ / DER
    ctx.font = 'bold 14px Comic Sans MS';
    ctx.fillStyle = '#7c2d12'; ctx.textAlign = 'center';
    ctx.fillText('IZQUIERDA', lbx, lby + 26);
    ctx.fillText('DERECHA', rbx, rby + 26);
}

// ── BOTONES DE RESPUESTA ──────────────────────────────────────
function dibujarBotones() {
    if (mostrandoResp || gameOver) return;
    const opciones = [
        { label:'⬅️ Izquierda\ntiene más', val:'izq', col:'#2563eb' },
        { label:'Son iguales\n⚖️',          val:'igual', col:'#16a34a' },
        { label:'Derecha\ntiene más ➡️',    val:'der', col:'#dc2626' },
    ];
    const bw = 180, bh = 58;
    const startX = W / 2 - (3 * bw + 2 * 16) / 2;
    const by = H - 80;

    opciones.forEach((op, i) => {
        const bx = startX + i * (bw + 16);
        ctx.fillStyle = op.col;
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 12); ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();

        const lines = op.label.split('\n');
        ctx.font = 'bold 14px Comic Sans MS';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (lines.length === 1) {
            ctx.fillText(lines[0], bx + bw/2, by + bh/2);
        } else {
            ctx.fillText(lines[0], bx + bw/2, by + bh/2 - 10);
            ctx.fillText(lines[1], bx + bw/2, by + bh/2 + 12);
        }
    });
}

// ── ZORRITO JUEZ ──────────────────────────────────────────────
function dibujarZorritoJuez(tick) {
    const cx = W / 2;
    const cy = H - 175;
    const bob = Math.sin(tick * 0.05) * 2;

    // Toga / vestido juez
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy + 5 + bob);
    ctx.lineTo(cx - 35, cy + 55 + bob);
    ctx.lineTo(cx + 35, cy + 55 + bob);
    ctx.lineTo(cx + 22, cy + 5 + bob);
    ctx.closePath(); ctx.fill();

    // Cuello blanco
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.ellipse(cx, cy + 5 + bob, 12, 8, 0, 0, Math.PI * 2); ctx.fill();

    // Orejas
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath(); ctx.moveTo(cx-10,cy-30+bob); ctx.lineTo(cx-20,cy-46+bob); ctx.lineTo(cx-2,cy-30+bob); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+2,cy-30+bob); ctx.lineTo(cx+20,cy-46+bob); ctx.lineTo(cx+10,cy-30+bob); ctx.fill();
    ctx.fillStyle='#ffb347';
    ctx.beginPath(); ctx.moveTo(cx-9,cy-30+bob); ctx.lineTo(cx-15,cy-38+bob); ctx.lineTo(cx-3,cy-30+bob); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+3,cy-30+bob); ctx.lineTo(cx+15,cy-38+bob); ctx.lineTo(cx+9,cy-30+bob); ctx.fill();

    // Peluca de juez (blanca, rizada)
    ctx.fillStyle = '#f0fdf4';
    ctx.beginPath(); ctx.ellipse(cx, cy - 28 + bob, 26, 20, 0, 0, Math.PI * 2); ctx.fill();
    // Rulos peluca
    [-18,-8,2,12,22].forEach(px => {
        ctx.beginPath(); ctx.arc(cx + px - 2, cy - 14 + bob, 8, 0, Math.PI * 2); ctx.fill();
    });
    // Colitas peluca
    ctx.beginPath(); ctx.ellipse(cx-24, cy-5+bob, 7, 16, -0.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+24, cy-5+bob, 7, 16, 0.2, 0, Math.PI*2); ctx.fill();

    // Cabeza
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath(); ctx.arc(cx, cy - 18 + bob, 20, 0, Math.PI * 2); ctx.fill();

    // Hocico
    ctx.fillStyle = '#fff5e6';
    ctx.beginPath(); ctx.ellipse(cx, cy-13+bob, 10, 7, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(cx, cy-18+bob, 2.5, 0, Math.PI*2); ctx.fill();

    // Ojos
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(cx-8, cy-24+bob, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+8, cy-24+bob, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(cx-7, cy-25+bob, 1.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+9, cy-25+bob, 1.2, 0, Math.PI*2); ctx.fill();

    // Mazo de juez
    ctx.strokeStyle = '#92400e'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx+20, cy+2+bob); ctx.lineTo(cx+44, cy-22+bob); ctx.stroke();
    ctx.fillStyle = '#b45309';
    ctx.beginPath(); ctx.roundRect(cx+36, cy-32+bob, 22, 14, 4); ctx.fill();
}

// ── HUD ───────────────────────────────────────────────────────
function dibujarHUD() {
    if (pregIdx >= preguntas.length) return;
    const p = preguntas[pregIdx];
    ctx.fillStyle = 'rgba(124,45,18,0.9)';
    ctx.beginPath(); ctx.roundRect(20, 10, W-40, 52, 10); ctx.fill();
    ctx.font = 'bold 20px Comic Sans MS';
    ctx.fillStyle = '#fff7ed';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.q, W/2, 36);
    ctx.font = '20px serif'; ctx.textAlign = 'left';
    for(let i=0;i<vidas;i++) ctx.fillText('❤️', 28+i*28, 52);
    ctx.font = 'bold 13px Arial'; ctx.fillStyle = '#fed7aa'; ctx.textAlign = 'right';
    ctx.fillText(`✅ ${aciertos}/${preguntas.length}`, W-28, 52);
}

// ── FLASH ─────────────────────────────────────────────────────
function dibujarFlash() {
    if(!flash||flashT<=0) return;
    ctx.globalAlpha = Math.min(1, flashT/20);
    ctx.font = 'bold 32px Comic Sans MS';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
    ctx.strokeText(flash, W/2, 130);
    ctx.fillStyle = flash.includes('!')&&!flash.includes('no') ? '#fbbf24' : '#f87171';
    ctx.fillText(flash, W/2, 130);
    ctx.globalAlpha = 1; flashT--;
}

// ── PANTALLA FINAL ────────────────────────────────────────────
function dibujarFinal() {
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0,0,W,H);
    ctx.font = 'bold 36px Comic Sans MS';
    ctx.fillStyle = ganado ? '#fbbf24' : '#f87171';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ganado ? '⚖️ ¡Justicia cumplida!' : '🔨 ¡Inténtalo de nuevo!', W/2, H/2-55);
    ctx.font = '22px Comic Sans MS'; ctx.fillStyle = 'white';
    ctx.fillText(`Respuestas correctas: ${aciertos} de ${preguntas.length}`, W/2, H/2);
    ctx.fillText(`Puntaje: ${Math.round(aciertos/preguntas.length*100)}%`, W/2, H/2+38);
    ctx.fillStyle = '#ea580c';
    ctx.beginPath(); ctx.roundRect(W/2-100, H/2+78, 200, 48, 12); ctx.fill();
    ctx.font = 'bold 19px Comic Sans MS'; ctx.fillStyle = 'white';
    ctx.fillText('▶ Jugar de nuevo', W/2, H/2+102);
}

// ── GUARDAR ───────────────────────────────────────────────────
async function guardarProgreso() {
    if(guardado) return; guardado=true;
    try {
        await fetch('/guardar_progreso',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({unidad:108,aciertos,total:preguntas.length,puntaje:Math.round(aciertos/preguntas.length*100)})});
    } catch(e){}
}

// ── RESPONDER ─────────────────────────────────────────────────
function responder(val) {
    if(gameOver||mostrandoResp) return;
    const p = preguntas[pregIdx];
    mostrandoResp = true;

    if(val === p.r) {
        aciertos++;
        Sonidos.correcto();
        flash = '⚖️ ¡Correcto!'; flashT = 40;
    } else {
        vidas--;
        Sonidos.incorrecto();
        flash = '¡Ese no es!'; flashT = 40;
        if(vidas<=0){
            setTimeout(()=>{gameOver=true;ganado=false;Sonidos.perder();guardarProgreso();},800);
            return;
        }
    }

    setTimeout(()=>{
        pregIdx++;
        if(pregIdx>=preguntas.length){
            gameOver=true;
            ganado=aciertos>=Math.ceil(preguntas.length*0.6);
            if(ganado)Sonidos.ganar(); else Sonidos.perder();
            guardarProgreso();
        } else {
            iniciarPregunta();
        }
    },900);
}

function detectarClic(mx,my) {
    if(gameOver||mostrandoResp) return;
    const opciones = ['izq','igual','der'];
    const bw=180,bh=58,startX=W/2-(3*bw+2*16)/2,by=H-80;
    opciones.forEach((val,i)=>{
        const bx=startX+i*(bw+16);
        if(mx>=bx&&mx<=bx+bw&&my>=by&&my<=by+bh) responder(val);
    });
}

// ── LOOP ──────────────────────────────────────────────────────
function loop() {
    tick++;
    ctx.clearRect(0,0,W,H);
    dibujarFondo();
    if(!gameOver&&pregIdx<preguntas.length){
        dibujarBalanza(preguntas[pregIdx]);
        dibujarZorritoJuez(tick);
        dibujarBotones();
        dibujarHUD();
        dibujarFlash();
    } else if(gameOver){
        if(pregIdx<preguntas.length) dibujarBalanza(preguntas[pregIdx]);
        dibujarZorritoJuez(tick);
        dibujarFinal();
    }
    requestAnimationFrame(loop);
}

function reiniciar(){
    pregIdx=0;aciertos=0;vidas=3;
    gameOver=false;ganado=false;guardado=false;
    flash='';flashT=0;mostrandoResp=false;
    iniciarPregunta();
}

canvas.addEventListener('click',e=>{
    const r=canvas.getBoundingClientRect();
    const mx=(e.clientX-r.left)*(W/r.width),my=(e.clientY-r.top)*(H/r.height);
    if(gameOver){if(mx>W/2-100&&mx<W/2+100&&my>H/2+78&&my<H/2+126)reiniciar();return;}
    detectarClic(mx,my);
});
canvas.addEventListener('touchend',e=>{
    e.preventDefault();
    const t=e.changedTouches[0],r=canvas.getBoundingClientRect();
    const mx=(t.clientX-r.left)*(W/r.width),my=(t.clientY-r.top)*(H/r.height);
    if(gameOver){if(mx>W/2-100&&mx<W/2+100&&my>H/2+78&&my<H/2+126)reiniciar();return;}
    detectarClic(mx,my);
});

let _au=false;
function _ia(){if(!_au){_au=true;Sonidos.iniciar(1);}}
canvas.addEventListener('click',_ia);
canvas.addEventListener('touchstart',_ia,{passive:true});
document.addEventListener('keydown',_ia,{once:true});

iniciarPregunta();
loop();