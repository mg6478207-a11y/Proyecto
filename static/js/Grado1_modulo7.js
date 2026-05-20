// ============================================================
//  RETOMATE - Grado 1, Módulo 7: Patrones y Series
//  Juego: El zorrito detective descubre qué sigue en el patrón
//         Se muestran 5 elementos con uno faltante (?) y 3 opciones
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// ── PATRONES ─────────────────────────────────────────────────
// tipo: 'num' = numérico, 'fig' = figuras, 'col' = colores
const patrones = [
    { serie:[2,4,6,8,'?'],      r:10,  ops:[9,10,12],   tipo:'num', desc:'¿Qué número sigue?' },
    { serie:[5,10,15,20,'?'],   r:25,  ops:[22,25,30],  tipo:'num', desc:'¿Qué número sigue?' },
    { serie:[1,3,5,7,'?'],      r:9,   ops:[8,9,11],    tipo:'num', desc:'¿Qué número sigue?' },
    { serie:[10,20,30,40,'?'],  r:50,  ops:[45,50,55],  tipo:'num', desc:'¿Qué número sigue?' },
    { serie:[3,6,9,12,'?'],     r:15,  ops:[14,15,18],  tipo:'num', desc:'¿Qué número sigue?' },
    { serie:['🔴','🔵','🔴','🔵','?'], r:'🔴', ops:['🔴','🔵','🟡'], tipo:'emo', desc:'¿Qué sigue en el patrón?' },
    { serie:['🌟','🌙','🌟','🌙','?'], r:'🌟', ops:['🌙','🌟','☀️'], tipo:'emo', desc:'¿Qué sigue en el patrón?' },
    { serie:[2,4,8,16,'?'],     r:32,  ops:[24,32,30],  tipo:'num', desc:'¿Qué número sigue?' },
    { serie:['🍎','🍌','🍎','🍌','?'], r:'🍎', ops:['🍊','🍌','🍎'], tipo:'emo', desc:'¿Qué sigue en el patrón?' },
    { serie:[100,90,80,70,'?'], r:60,  ops:[55,60,65],  tipo:'num', desc:'¿Qué número sigue?' },
];

// ── ESTADO ───────────────────────────────────────────────────
let pregIdx = 0, aciertos = 0, vidas = 3;
let gameOver = false, ganado = false, guardado = false;
let flash = '', flashT = 0, tick = 0;
let selAnim = -1, selAnimT = 0;

// ── ESTRELLAS FONDO ───────────────────────────────────────────
const ESTRELLAS = Array.from({length:60}, () => ({
    x: Math.random()*W, y: Math.random()*H,
    r: Math.random()*1.5+0.3, b: Math.random()*Math.PI*2,
}));

// ── DIBUJAR FONDO ────────────────────────────────────────────
function dibujarFondo() {
    ctx.fillStyle = '#0d0117';
    ctx.fillRect(0,0,W,H);

    ESTRELLAS.forEach(s => {
        const br = 0.3 + 0.7*Math.sin(tick*0.035+s.b);
        ctx.globalAlpha = br;
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Tablero de detective
    ctx.fillStyle = 'rgba(74,14,143,0.3)';
    ctx.beginPath(); ctx.roundRect(30,80,W-60,H-160,16); ctx.fill();
    ctx.strokeStyle = '#9333ea'; ctx.lineWidth = 2;
    ctx.stroke();

    // Cinta de policía decorativa arriba
    for (let x = 0; x < W; x += 60) {
        ctx.fillStyle = x%120===0 ? '#fbbf24' : '#1a0533';
        ctx.fillRect(x, 0, 60, 16);
    }
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = '#1a0533';
    ctx.textAlign = 'center';
    for (let x = 30; x < W; x += 60) {
        if ((x-30)%120===0) ctx.fillText('★ DETECTIVE ZORRITO ★', x, 11);
    }
}

// ── DIBUJAR SERIE ─────────────────────────────────────────────
function dibujarSerie(p) {
    const totalW = 5;
    const celW   = 110;
    const startX = W/2 - (totalW * celW)/2 + celW/2;
    const y      = 200;

    p.serie.forEach((elem, i) => {
        const x   = startX + i * celW;
        const esInterrogante = elem === '?';
        const pulso = esInterrogante ? Math.sin(tick*0.08)*4 : 0;

        // Caja
        ctx.fillStyle = esInterrogante ? 'rgba(147,51,234,0.4)' : 'rgba(30,5,60,0.8)';
        ctx.beginPath(); ctx.roundRect(x-42, y-42+pulso, 84, 84, 12); ctx.fill();
        ctx.strokeStyle = esInterrogante ? '#fbbf24' : '#9333ea';
        ctx.lineWidth   = esInterrogante ? 3 : 1.5;
        ctx.stroke();

        if (p.tipo === 'num') {
            ctx.font        = esInterrogante ? 'bold 36px Comic Sans MS' : 'bold 30px Comic Sans MS';
            ctx.fillStyle   = esInterrogante ? '#fbbf24' : '#e9d5ff';
            ctx.textAlign   = 'center';
            ctx.textBaseline= 'middle';
            ctx.fillText(String(elem), x, y+pulso);
        } else {
            ctx.font        = esInterrogante ? '36px serif' : '30px serif';
            ctx.textAlign   = 'center';
            ctx.textBaseline= 'middle';
            ctx.fillText(String(elem), x, y+pulso);
        }

        // Flecha entre cajas (excepto la última)
        if (i < totalW - 1) {
            ctx.fillStyle   = '#9333ea';
            ctx.font        = '18px serif';
            ctx.textAlign   = 'center';
            ctx.textBaseline= 'middle';
            ctx.fillText('→', x + celW/2, y);
        }
    });
}

// ── DIBUJAR OPCIONES ──────────────────────────────────────────
function dibujarOpciones(p) {
    const bw = 140, bh = 60;
    const startX = W/2 - (3*bw + 2*24)/2;
    const by     = H - 120;

    ctx.font = 'bold 15px Comic Sans MS';
    ctx.fillStyle = '#d8b4fe';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.desc, W/2, by - 22);

    p.ops.forEach((op, i) => {
        const bx    = startX + i*(bw+24);
        const pulse = selAnim === i ? Math.sin(tick*0.2)*3 : 0;

        ctx.fillStyle = selAnim === i ? '#7c3aed' : 'rgba(74,14,143,0.7)';
        ctx.beginPath(); ctx.roundRect(bx, by+pulse, bw, bh, 12); ctx.fill();
        ctx.strokeStyle = selAnim === i ? '#fbbf24' : '#9333ea';
        ctx.lineWidth   = selAnim === i ? 3 : 1.5;
        ctx.stroke();

        if (p.tipo === 'num') {
            ctx.font        = 'bold 26px Comic Sans MS';
            ctx.fillStyle   = 'white';
            ctx.textAlign   = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(String(op), bx+bw/2, by+bh/2+pulse);
        } else {
            ctx.font        = '28px serif';
            ctx.textAlign   = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(String(op), bx+bw/2, by+bh/2+pulse);
        }
    });
}

// ── ZORRITO DETECTIVE ─────────────────────────────────────────
function dibujarZorritoDetective(tick) {
    const cx = 90, cy = 200;
    const bob = Math.sin(tick*0.04)*3;

    // Lupa
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx+28, cy-20+bob, 16, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+40, cy-8+bob); ctx.lineTo(cx+52, cy+6+bob); ctx.stroke();

    // Sombrero detective
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath(); ctx.ellipse(cx, cy-52+bob, 24, 6, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillRect(cx-18, cy-70+bob, 36, 20);
    ctx.fillStyle = '#312e81';
    ctx.fillRect(cx-18, cy-52+bob, 36, 4);
    // Cinta sombrero
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(cx-18, cy-58+bob, 36, 5);

    // Orejas
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath(); ctx.moveTo(cx-10,cy-38+bob); ctx.lineTo(cx-20,cy-52+bob); ctx.lineTo(cx-2,cy-38+bob); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+2,cy-38+bob); ctx.lineTo(cx+20,cy-52+bob); ctx.lineTo(cx+10,cy-38+bob); ctx.fill();
    ctx.fillStyle='#ffb347';
    ctx.beginPath(); ctx.moveTo(cx-9,cy-38+bob); ctx.lineTo(cx-15,cy-46+bob); ctx.lineTo(cx-3,cy-38+bob); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+3,cy-38+bob); ctx.lineTo(cx+15,cy-46+bob); ctx.lineTo(cx+9,cy-38+bob); ctx.fill();

    // Cabeza
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath(); ctx.arc(cx, cy-24+bob, 20, 0, Math.PI*2); ctx.fill();

    // Hocico
    ctx.fillStyle='#fff5e6';
    ctx.beginPath(); ctx.ellipse(cx,cy-19+bob,10,7,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#222';
    ctx.beginPath(); ctx.arc(cx,cy-24+bob,2.5,0,Math.PI*2); ctx.fill();

    // Ojos con monóculo
    ctx.fillStyle='#222';
    ctx.beginPath(); ctx.arc(cx-8,cy-30+bob,3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+8,cy-30+bob,3,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#fbbf24'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(cx+8,cy-30+bob,6,0,Math.PI*2); ctx.stroke();

    // Cuerpo
    ctx.fillStyle='#ff8c00';
    ctx.beginPath(); ctx.ellipse(cx,cy+8+bob,18,20,0,0,Math.PI*2); ctx.fill();
    // Gabardina
    ctx.fillStyle='#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(cx-18,cy+bob);
    ctx.lineTo(cx-30,cy+35+bob);
    ctx.lineTo(cx+30,cy+35+bob);
    ctx.lineTo(cx+18,cy+bob);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle='#312e81';
    ctx.beginPath();
    ctx.moveTo(cx-4,cy+bob);
    ctx.lineTo(cx-6,cy+35+bob);
    ctx.lineTo(cx+6,cy+35+bob);
    ctx.lineTo(cx+4,cy+bob);
    ctx.closePath(); ctx.fill();

    // Brazo con lupa
    ctx.strokeStyle='#ff8c00'; ctx.lineWidth=5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx+14,cy+4+bob); ctx.lineTo(cx+26,cy-12+bob); ctx.stroke();
}

// ── HUD ───────────────────────────────────────────────────────
function dibujarHUD() {
    ctx.fillStyle='rgba(26,5,51,0.92)';
    ctx.beginPath(); ctx.roundRect(20,10,W-40,52,10); ctx.fill();
    ctx.strokeStyle='#9333ea'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.font='bold 20px Comic Sans MS';
    ctx.fillStyle='#e9d5ff';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(`Caso ${pregIdx+1} de ${patrones.length}`, W/2, 28);
    ctx.font='20px serif'; ctx.textAlign='left';
    for(let i=0;i<vidas;i++) ctx.fillText('❤️',28+i*28,50);
    ctx.font='bold 13px Arial'; ctx.fillStyle='#d8b4fe'; ctx.textAlign='right';
    ctx.fillText(`✅ ${aciertos}/${patrones.length}`,W-28,50);
}

// ── FLASH ─────────────────────────────────────────────────────
function dibujarFlash() {
    if(!flash||flashT<=0) return;
    ctx.globalAlpha=Math.min(1,flashT/20);
    ctx.font='bold 32px Comic Sans MS';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.strokeStyle='#000'; ctx.lineWidth=4;
    ctx.strokeText(flash,W/2,140);
    ctx.fillStyle=flash.includes('!')&&!flash.includes('no')?'#fbbf24':'#f87171';
    ctx.fillText(flash,W/2,140);
    ctx.globalAlpha=1; flashT--;
}

// ── PANTALLA FINAL ────────────────────────────────────────────
function dibujarFinal() {
    ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,W,H);
    ctx.font='bold 36px Comic Sans MS';
    ctx.fillStyle=ganado?'#fbbf24':'#f87171';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(ganado?'🔍 ¡Caso resuelto!':'🕵️ ¡Inténtalo de nuevo!',W/2,H/2-55);
    ctx.font='22px Comic Sans MS'; ctx.fillStyle='white';
    ctx.fillText(`Casos resueltos: ${aciertos} de ${patrones.length}`,W/2,H/2);
    ctx.fillText(`Puntaje: ${Math.round(aciertos/patrones.length*100)}%`,W/2,H/2+38);
    ctx.fillStyle='#7c3aed';
    ctx.beginPath(); ctx.roundRect(W/2-100,H/2+78,200,48,12); ctx.fill();
    ctx.font='bold 19px Comic Sans MS'; ctx.fillStyle='white';
    ctx.fillText('▶ Jugar de nuevo',W/2,H/2+102);
}

// ── GUARDAR ───────────────────────────────────────────────────
async function guardarProgreso() {
    if(guardado) return; guardado=true;
    try {
        await fetch('/guardar_progreso',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({unidad:107,aciertos,total:patrones.length,puntaje:Math.round(aciertos/patrones.length*100)})});
    } catch(e){}
}

// ── CLICK OPCIÓN ─────────────────────────────────────────────
function elegirOpcion(i) {
    if(gameOver) return;
    const p  = patrones[pregIdx];
    const op = p.ops[i];
    selAnim  = i; selAnimT = 20;

    if(String(op) === String(p.r)) {
        aciertos++;
        Sonidos.correcto();
        flash='🔍 ¡Caso resuelto!'; flashT=40;
    } else {
        vidas--;
        Sonidos.incorrecto();
        flash='¡No es eso!'; flashT=40;
        if(vidas<=0){gameOver=true;ganado=false;Sonidos.perder();guardarProgreso();return;}
    }
    pregIdx++;
    if(pregIdx>=patrones.length){
        gameOver=true; ganado=aciertos>=Math.ceil(patrones.length*0.6);
        if(ganado)Sonidos.ganar(); else Sonidos.perder();
        guardarProgreso();
    }
}

function detectarClic(mx,my) {
    if(gameOver) return;
    const p=patrones[pregIdx];
    const bw=140,bh=60,startX=W/2-(3*bw+2*24)/2,by=H-120;
    p.ops.forEach((_,i)=>{
        const bx=startX+i*(bw+24);
        if(mx>=bx&&mx<=bx+bw&&my>=by&&my<=by+bh) elegirOpcion(i);
    });
}

// ── LOOP ──────────────────────────────────────────────────────
function loop() {
    tick++;
    if(selAnimT>0) selAnimT--;
    else if(selAnimT===0&&selAnim>=0) selAnim=-1;
    ctx.clearRect(0,0,W,H);
    dibujarFondo();
    if(!gameOver&&pregIdx<patrones.length){
        dibujarSerie(patrones[pregIdx]);
        dibujarOpciones(patrones[pregIdx]);
        dibujarZorritoDetective(tick);
        dibujarHUD();
        dibujarFlash();
    } else if(!gameOver){
        dibujarFinal();
    } else {
        dibujarFinal();
    }
    requestAnimationFrame(loop);
}

function reiniciar(){
    pregIdx=0;aciertos=0;vidas=3;gameOver=false;ganado=false;guardado=false;
    flash='';flashT=0;selAnim=-1;selAnimT=0;
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

loop();