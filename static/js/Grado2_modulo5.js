// ============================================================
//  RETOMATE - Grado 2, Módulo 5: Números hasta 1000
//  Juego: Zorrito en cohete recoge cristales con el número
//         correcto flotando en el espacio
//  ✅ Sin scroll · Zorrito pixel art P=4 en cohete
//  ✅ CORRECCIONES: velocidad reducida, pausa entre preguntas
//     aumentada, cohete se recentra al cambiar pregunta
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const P = 4;

// ── BLOQUEAR SCROLL ───────────────────────────────────────────
window.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))
        e.preventDefault();
}, { passive: false });

// ── PREGUNTAS ─────────────────────────────────────────────────
const preguntas = [
    { q:'¿Cuál es mayor: 345 o 435?',   r:'435',  ops:['345','435','354'] },
    { q:'¿Qué número va después de 599?',r:'600',  ops:['598','601','600'] },
    { q:'¿Cuánto es 400 + 50 + 3?',     r:'453',  ops:['435','453','543'] },
    { q:'¿Qué número está entre 299 y 301?', r:'300', ops:['290','300','310'] },
    { q:'¿Cuál es menor: 728 o 782?',   r:'728',  ops:['782','728','872'] },
    { q:'¿Cuánto es 600 + 70 + 8?',     r:'678',  ops:['678','687','768'] },
    { q:'¿Qué número va antes de 800?',  r:'799',  ops:['790','799','801'] },
    { q:'¿Cuántas centenas tiene 750?',  r:'7',    ops:['5','7','75']      },
    { q:'¿Qué número es 9C + 9D + 9U?', r:'999',  ops:['909','990','999'] },
    { q:'¿Cuánto es 500 + 500?',        r:'1000', ops:['100','999','1000']},
];

// ── ESTADO ────────────────────────────────────────────────────
let pregIdx=0, aciertos=0, vidas=3;
let gameOver=false, ganado=false, guardado=false;
let flash='', flashT=0, tick=0;

// ── PAUSA ENTRE PREGUNTAS ─────────────────────────────────────
// Cuando se recoge un cristal, bloqueamos controles y esperamos
// antes de crear los nuevos cristales para que el cohete no los
// recoja automáticamente al aparecer encima.
let pausandoCambio = false;

// ── PARTÍCULAS ────────────────────────────────────────────────
let particulas=[];
function boom(x,y,col,n=20){
    for(let i=0;i<n;i++){
        const a=Math.random()*Math.PI*2,v=1.5+Math.random()*5;
        particulas.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,
            vida:1,dec:0.02+Math.random()*0.02,r:3+Math.random()*6,col});
    }
}
function tickP(){
    particulas=particulas.filter(p=>p.vida>0);
    particulas.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.06;p.vida-=p.dec;p.vx*=0.97;});
}
function drawP(){
    particulas.forEach(p=>{
        ctx.save(); ctx.globalAlpha=p.vida;
        const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
        g.addColorStop(0,p.col); g.addColorStop(1,'transparent');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        ctx.restore();
    });
}

// ── COHETE (zorrito dentro) ───────────────────────────────────
const cohete = {
    x: W/2, y: H/2,
    vx:0, vy:0,
    speed: 2.2,          // ← REDUCIDO (era 3.8) para niños de grado 2
};
const keys={};

// ── CRISTALES ─────────────────────────────────────────────────
let cristales=[];
const CRISTAL_COLS=[
    {a:'#a78bfa',b:'#7c3aed',shine:'#ddd6fe'},
    {a:'#67e8f9',b:'#0891b2',shine:'#cffafe'},
    {a:'#86efac',b:'#15803d',shine:'#dcfce7'},
];

function crearCristales(){
    cristales=[];
    if(pregIdx>=preguntas.length) return;
    const p=preguntas[pregIdx];
    const ops=[...p.ops];
    for(let i=ops.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [ops[i],ops[j]]=[ops[j],ops[i]];
    }
    // Posiciones FIJAS bien alejadas del centro donde reaparece el cohete
    // El cohete siempre vuelve al centro (W/2, H/2), así que los cristales
    // se colocan en las esquinas para que no aparezcan encima del cohete.
    const posiciones=[
        {x:120,  y:160},          // esquina superior izquierda
        {x:W-120,y:160},          // esquina superior derecha
        {x:W/2,  y:H-120},        // borde inferior centro
    ];
    ops.forEach((val,i)=>{
        const col=CRISTAL_COLS[i];
        cristales.push({
            x:posiciones[i].x, y:posiciones[i].y,
            r:40,
            valor:val,
            correcta:val===p.r,
            col,
            fase:Math.random()*Math.PI*2,
            rot:Math.random()*Math.PI*2,
            rotVel:(Math.random()-0.5)*0.02,
            recogido:false,
        });
    });
    pausandoCambio = false; // ya se puede mover y colisionar de nuevo
}

// ── DIBUJAR CRISTAL ───────────────────────────────────────────
function drawCristal(c){
    if(c.recogido) return;
    const fl=Math.sin(tick*0.04+c.fase)*6;
    const x=c.x, y=c.y+fl;

    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(c.rot);
    c.rot+=c.rotVel;

    // Resplandor exterior
    const og=ctx.createRadialGradient(0,0,0,0,0,c.r+20);
    og.addColorStop(0,`rgba(196,181,253,0.2)`);
    og.addColorStop(1,'transparent');
    ctx.fillStyle=og;
    ctx.beginPath(); ctx.arc(0,0,c.r+20,0,Math.PI*2); ctx.fill();

    // Sombra
    ctx.fillStyle='rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(0,c.r+8,c.r*0.6,8,0,0,Math.PI*2); ctx.fill();

    // Forma cristal (hexágono irregular)
    const puntos=6;
    ctx.beginPath();
    for(let i=0;i<puntos;i++){
        const a=(i/puntos)*Math.PI*2-Math.PI/2;
        const r=c.r*(0.85+0.15*Math.sin(i*2));
        i===0?ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r):ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
    }
    ctx.closePath();

    // Gradiente cristal
    const g=ctx.createRadialGradient(-c.r*0.3,-c.r*0.3,0,0,0,c.r);
    g.addColorStop(0,c.col.shine);
    g.addColorStop(0.4,c.col.a);
    g.addColorStop(1,c.col.b);
    ctx.fillStyle=g; ctx.fill();
    ctx.strokeStyle=c.col.shine; ctx.lineWidth=2; ctx.stroke();

    // Facetas internas
    ctx.strokeStyle=`rgba(255,255,255,0.2)`; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(-c.r*0.5,-c.r*0.5); ctx.lineTo(c.r*0.3,c.r*0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(c.r*0.4,-c.r*0.3); ctx.lineTo(-c.r*0.2,c.r*0.5); ctx.stroke();

    // Brillo
    ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.ellipse(-c.r*0.25,-c.r*0.3,c.r*0.18,c.r*0.1,-0.5,0,Math.PI*2); ctx.fill();

    ctx.rotate(-c.rot*2);
    // Número
    ctx.font=`bold ${c.r>35?18:15}px Comic Sans MS`;
    ctx.shadowColor='rgba(0,0,0,0.8)'; ctx.shadowBlur=5;
    ctx.fillStyle='white'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(c.valor),0,1);
    ctx.shadowBlur=0;

    ctx.restore();
}

// ── DIBUJAR COHETE CON ZORRITO ────────────────────────────────
function drawCohete(){
    const cx=cohete.x, cy=cohete.y;
    const bob=Math.sin(tick*0.06)*3;

    ctx.save();
    ctx.translate(cx,cy+bob);

    // Llama propulsora animada
    const llama=1+Math.sin(tick*0.25)*0.4;
    const fg=ctx.createRadialGradient(0,30,0,0,30,22*llama);
    fg.addColorStop(0,'rgba(255,200,50,0.9)');
    fg.addColorStop(0.4,'rgba(255,100,0,0.7)');
    fg.addColorStop(1,'rgba(255,0,0,0)');
    ctx.fillStyle=fg;
    ctx.beginPath(); ctx.ellipse(0,28,10,22*llama,0,0,Math.PI*2); ctx.fill();

    // Aletas cohete
    const ag=ctx.createLinearGradient(-28,10,28,10);
    ag.addColorStop(0,'#dc2626'); ag.addColorStop(0.5,'#ef4444'); ag.addColorStop(1,'#dc2626');
    ctx.fillStyle=ag;
    ctx.beginPath(); ctx.moveTo(-12,8); ctx.lineTo(-26,22); ctx.lineTo(-12,18); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12,8); ctx.lineTo(26,22); ctx.lineTo(12,18); ctx.closePath(); ctx.fill();

    // Cuerpo cohete
    const cg=ctx.createLinearGradient(-16,-30,16,30);
    cg.addColorStop(0,'#e2e8f0'); cg.addColorStop(0.3,'#f8fafc'); cg.addColorStop(1,'#94a3b8');
    ctx.fillStyle=cg;
    ctx.beginPath(); ctx.roundRect(-14,-28,28,56,6); ctx.fill();
    ctx.strokeStyle='#64748b'; ctx.lineWidth=1.5; ctx.stroke();

    // Franja roja
    ctx.fillStyle='#dc2626';
    ctx.fillRect(-14,8,28,8);
    ctx.fillStyle='white'; ctx.font='10px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('⭐',0,12);

    // Punta cohete
    const pg=ctx.createLinearGradient(-14,-28,14,-50);
    pg.addColorStop(0,'#e2e8f0'); pg.addColorStop(1,'#cbd5e1');
    ctx.fillStyle=pg;
    ctx.beginPath(); ctx.moveTo(-14,-28); ctx.lineTo(14,-28); ctx.lineTo(0,-50); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#64748b'; ctx.lineWidth=1; ctx.stroke();

    // Ventana / casco con zorrito dentro
    const wg=ctx.createRadialGradient(-4,-10,0,0,-8,16);
    wg.addColorStop(0,'rgba(186,230,253,0.9)');
    wg.addColorStop(1,'rgba(14,165,233,0.5)');
    ctx.fillStyle=wg;
    ctx.beginPath(); ctx.arc(0,-8,14,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#7dd3fc'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.ellipse(-5,-13,5,3,-0.4,0,Math.PI*2); ctx.fill();

    // Zorrito mini dentro de ventana (P=2)
    const mp=2;
    const mx=-5, my=-14;
    ctx.fillStyle='#f48c06';
    ctx.fillRect(mx+1*mp,my+1*mp,5*mp,4*mp);
    ctx.fillStyle='#e85d04';
    ctx.fillRect(mx+1*mp,my,1*mp,1*mp);
    ctx.fillRect(mx+5*mp,my,1*mp,1*mp);
    ctx.fillStyle='#000';
    ctx.fillRect(mx+2*mp,my+2*mp,1*mp,1*mp);
    ctx.fillRect(mx+4*mp,my+2*mp,1*mp,1*mp);
    ctx.fillRect(mx+2*mp,my+4*mp,3*mp,1*mp);

    // Partículas de propulsión
    if(tick%5===0) boom(cx,cy+bob+28,'rgba(255,150,50,0.8)',2);

    ctx.restore();
}

// ── FONDO ESPACIO ─────────────────────────────────────────────
const ESTRELLAS=Array.from({length:90},()=>({
    x:Math.random()*W, y:Math.random()*H,
    r:Math.random()*1.8+0.3, b:Math.random()*Math.PI*2,
}));

function drawFondo(){
    ctx.fillStyle='#030014'; ctx.fillRect(0,0,W,H);
    ESTRELLAS.forEach(s=>{
        const br=0.3+0.7*Math.sin(tick*0.04+s.b);
        ctx.globalAlpha=br;
        ctx.fillStyle='white';
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1;

    const n1=ctx.createRadialGradient(W*0.3,H*0.4,0,W*0.3,H*0.4,200);
    n1.addColorStop(0,'rgba(124,58,237,0.08)'); n1.addColorStop(1,'transparent');
    ctx.fillStyle=n1; ctx.beginPath(); ctx.arc(W*0.3,H*0.4,200,0,Math.PI*2); ctx.fill();

    const n2=ctx.createRadialGradient(W*0.75,H*0.6,0,W*0.75,H*0.6,180);
    n2.addColorStop(0,'rgba(14,165,233,0.07)'); n2.addColorStop(1,'transparent');
    ctx.fillStyle=n2; ctx.beginPath(); ctx.arc(W*0.75,H*0.6,180,0,Math.PI*2); ctx.fill();

    [[120,420,25],[680,80,18],[750,380,22],[50,100,15],[400,460,20]].forEach(([ax,ay,ar])=>{
        const ag=ctx.createRadialGradient(ax-ar*0.3,ay-ar*0.3,0,ax,ay,ar);
        ag.addColorStop(0,'#44403c'); ag.addColorStop(1,'#1c1917');
        ctx.fillStyle=ag;
        ctx.beginPath(); ctx.arc(ax,ay,ar,0,Math.PI*2); ctx.fill();
    });

    const pg=ctx.createRadialGradient(W-120,60,10,W-120,60,70);
    pg.addColorStop(0,'#4c1d95'); pg.addColorStop(0.6,'#2e1065'); pg.addColorStop(1,'#0f0028');
    ctx.fillStyle=pg;
    ctx.beginPath(); ctx.arc(W-120,60,70,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(167,139,250,0.3)'; ctx.lineWidth=6;
    ctx.beginPath(); ctx.ellipse(W-120,60,100,20,-0.3,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle='rgba(167,139,250,0.15)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.ellipse(W-120,60,120,25,-0.3,0,Math.PI*2); ctx.stroke();
}

// ── HUD ───────────────────────────────────────────────────────
function drawHUD(){
    if(pregIdx>=preguntas.length) return;
    const p=preguntas[pregIdx];
    const hg=ctx.createLinearGradient(20,10,W-20,62);
    hg.addColorStop(0,'rgba(15,12,41,0.95)'); hg.addColorStop(1,'rgba(48,43,99,0.95)');
    ctx.fillStyle=hg; ctx.beginPath(); ctx.roundRect(20,10,W-40,52,12); ctx.fill();
    ctx.strokeStyle='rgba(124,58,237,0.5)'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.font='bold 22px Comic Sans MS';
    ctx.shadowColor='rgba(196,181,253,0.5)'; ctx.shadowBlur=8;
    ctx.fillStyle='#e9d5ff'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(p.q,W/2,36); ctx.shadowBlur=0;
    ctx.font='20px serif'; ctx.textAlign='left';
    for(let i=0;i<vidas;i++) ctx.fillText('❤️',28+i*28,56);
    ctx.font='bold 14px Arial'; ctx.fillStyle='#c4b5fd'; ctx.textAlign='right';
    ctx.fillText(`✅ ${aciertos}/${preguntas.length}`,W-28,56);

    // ── Indicador de pausa entre preguntas ────────────────────
    // Muestra un aviso mientras el cohete vuelve al centro
    if(pausandoCambio){
        ctx.fillStyle='rgba(251,191,36,0.9)';
        ctx.font='bold 16px Comic Sans MS';
        ctx.textAlign='center';
        ctx.fillText('¡Siguiente cristal llegando! 🚀',W/2,H-30);
    }
}

// ── FLASH ─────────────────────────────────────────────────────
function drawFlash(){
    if(!flash||flashT<=0) return;
    ctx.globalAlpha=Math.min(1,flashT/20);
    ctx.font='bold 34px Comic Sans MS';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.shadowColor=flash.includes('!')&&!flash.includes('no')?'rgba(251,191,36,0.8)':'rgba(248,113,113,0.8)';
    ctx.shadowBlur=20;
    ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=4;
    ctx.strokeText(flash,W/2,H/2-60);
    ctx.fillStyle=flash.includes('!')&&!flash.includes('no')?'#fbbf24':'#f87171';
    ctx.fillText(flash,W/2,H/2-60);
    ctx.shadowBlur=0; ctx.globalAlpha=1; flashT--;
}

// ── PANTALLA FINAL ────────────────────────────────────────────
function drawFinal(){
    const og=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.7);
    og.addColorStop(0,'rgba(0,0,0,0.8)'); og.addColorStop(1,'rgba(0,0,0,0.92)');
    ctx.fillStyle=og; ctx.fillRect(0,0,W,H);
    ctx.font='bold 40px Comic Sans MS';
    ctx.shadowColor=ganado?'rgba(251,191,36,0.8)':'rgba(248,113,113,0.8)'; ctx.shadowBlur=20;
    ctx.fillStyle=ganado?'#fbbf24':'#f87171';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(ganado?'🚀 ¡Misión espacial cumplida!':'⭐ ¡Inténtalo de nuevo!',W/2,H/2-55);
    ctx.shadowBlur=0;
    ctx.font='22px Comic Sans MS'; ctx.fillStyle='white';
    ctx.fillText(`Respuestas correctas: ${aciertos} de ${preguntas.length}`,W/2,H/2);
    ctx.fillText(`Puntaje: ${Math.round(aciertos/preguntas.length*100)}%`,W/2,H/2+38);
    const bg=ctx.createLinearGradient(W/2-100,H/2+78,W/2+100,H/2+126);
    bg.addColorStop(0,'#4c1d95'); bg.addColorStop(1,'#7c3aed');
    ctx.fillStyle=bg; ctx.shadowColor='rgba(124,58,237,0.5)'; ctx.shadowBlur=15;
    ctx.beginPath(); ctx.roundRect(W/2-100,H/2+78,200,48,12); ctx.fill();
    ctx.shadowBlur=0;
    ctx.font='bold 19px Comic Sans MS'; ctx.fillStyle='white';
    ctx.fillText('▶ Jugar de nuevo',W/2,H/2+102);
}

// ── GUARDAR ───────────────────────────────────────────────────
async function guardar(){
    if(guardado) return; guardado=true;
    try{
        await fetch('/guardar_progreso',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({unidad:205,aciertos,total:preguntas.length,puntaje:Math.round(aciertos/preguntas.length*100)})});
    }catch(e){}
}

// ── COLISIÓN ──────────────────────────────────────────────────
function checkCol(){
    // No detectar colisiones durante la pausa de cambio de pregunta
    if(gameOver || pausandoCambio) return;

    let impacto=null;
    for(let i=0;i<cristales.length;i++){
        const c=cristales[i];
        if(c.recogido) continue;
        const fl=Math.sin(tick*0.04+c.fase)*6;
        if(Math.hypot(cohete.x-c.x,cohete.y-(c.y+fl))<c.r+22){
            impacto=c; break;
        }
    }
    if(!impacto) return;

    const cx=impacto.x, cy=impacto.y;
    impacto.recogido=true;

    if(impacto.correcta){
        aciertos++; Sonidos.correcto();
        boom(cx,cy,impacto.col.a,25); boom(cx,cy,'#fbbf24',15);
        flash='💎 ¡Correcto!'; flashT=45;
        pregIdx++;
        if(pregIdx>=preguntas.length){
            gameOver=true; ganado=aciertos>=Math.ceil(preguntas.length*0.6);
            boom(W/2,H/2,ganado?'#fbbf24':'#f87171',50);
            if(ganado)Sonidos.ganar(); else Sonidos.perder();
            guardar();
        } else {
            // ── PAUSA ANTES DE NUEVOS CRISTALES ──────────────
            // 1) Marcamos pausa para bloquear movimiento y colisión
            // 2) Frenamos y recentramos el cohete suavemente
            // 3) Esperamos 1800ms antes de aparecer nuevos cristales
            pausandoCambio = true;
            cohete.vx = 0;
            cohete.vy = 0;
            setTimeout(() => {
                cohete.x = W / 2;
                cohete.y = H / 2;
                crearCristales(); // también pone pausandoCambio=false
            }, 1800);  // ← 1.8 segundos (era 500ms)
        }
    } else {
        vidas--; Sonidos.incorrecto();
        boom(cx,cy,'#f87171',20);
        flash='¡Ese no es!'; flashT=45;
        if(vidas<=0){
            gameOver=true; ganado=false; Sonidos.perder(); guardar();
        } else {
            // También pausamos al fallar para que el niño
            // pueda leer el mensaje de error tranquilo
            pausandoCambio = true;
            cohete.vx = 0;
            cohete.vy = 0;
            setTimeout(() => {
                cohete.x = W / 2;
                cohete.y = H / 2;
                crearCristales();
            }, 1800);
        }
    }
}

// ── LOOP ──────────────────────────────────────────────────────
function loop(){
    tick++;
    ctx.clearRect(0,0,W,H);
    drawFondo();
    tickP(); drawP();

    if(!gameOver){
        // Solo mover el cohete si no estamos en pausa de cambio
        if(!pausandoCambio){
            if(keys['ArrowRight']) cohete.vx=Math.min(cohete.vx+0.3, cohete.speed);
            else if(keys['ArrowLeft']) cohete.vx=Math.max(cohete.vx-0.3,-cohete.speed);
            else cohete.vx*=0.88;

            if(keys['ArrowUp']) cohete.vy=Math.max(cohete.vy-0.3,-cohete.speed);
            else if(keys['ArrowDown']) cohete.vy=Math.min(cohete.vy+0.3,cohete.speed);
            else cohete.vy*=0.88;

            cohete.x=Math.max(30,Math.min(W-30,cohete.x+cohete.vx));
            cohete.y=Math.max(70,Math.min(H-50,cohete.y+cohete.vy));
            checkCol();
        }
    }

    cristales.forEach(drawCristal);
    drawCohete();

    if(!gameOver){ drawHUD(); drawFlash(); }
    else{
        drawFinal();
        if(ganado&&tick%3===0)
            boom(Math.random()*W,Math.random()*H*0.6,
                ['#fbbf24','#f87171','#34d399','#a78bfa','#60a5fa'][Math.floor(Math.random()*5)],3);
    }
    requestAnimationFrame(loop);
}

// ── REINICIAR ─────────────────────────────────────────────────
function reiniciar(){
    pregIdx=0; aciertos=0; vidas=3;
    gameOver=false; ganado=false; guardado=false;
    flash=''; flashT=0; particulas=[];
    pausandoCambio=false;
    cohete.x=W/2; cohete.y=H/2; cohete.vx=0; cohete.vy=0;
    crearCristales();
}

// ── CONTROLES ─────────────────────────────────────────────────
document.addEventListener('keydown',e=>{ keys[e.key]=true; });
document.addEventListener('keyup',  e=>{ keys[e.key]=false; });

[['btnU','ArrowUp'],['btnD','ArrowDown'],['btnL','ArrowLeft'],['btnR','ArrowRight']].forEach(([id,k])=>{
    const el=document.getElementById(id); if(!el) return;
    el.addEventListener('touchstart',e=>{e.preventDefault();keys[k]=true;},{passive:false});
    el.addEventListener('touchend',  e=>{e.preventDefault();keys[k]=false;});
    el.addEventListener('mousedown', ()=>keys[k]=true);
    el.addEventListener('mouseup',   ()=>keys[k]=false);
});

canvas.addEventListener('click',e=>{
    if(!gameOver) return;
    const r=canvas.getBoundingClientRect();
    const cx=(e.clientX-r.left)*(W/r.width),cy=(e.clientY-r.top)*(H/r.height);
    if(cx>W/2-100&&cx<W/2+100&&cy>H/2+78&&cy<H/2+126) reiniciar();
});
canvas.addEventListener('touchend',e=>{
    if(!gameOver) return; e.preventDefault();
    const t=e.changedTouches[0],r=canvas.getBoundingClientRect();
    const cx=(t.clientX-r.left)*(W/r.width),cy=(t.clientY-r.top)*(H/r.height);
    if(cx>W/2-100&&cx<W/2+100&&cy>H/2+78&&cy<H/2+126) reiniciar();
});

// ── AUDIO ─────────────────────────────────────────────────────
let _au=false;
function _ia(){if(!_au){_au=true;Sonidos.iniciar(2);}}
canvas.addEventListener('click',_ia);
canvas.addEventListener('touchstart',_ia,{passive:true});
document.addEventListener('keydown',_ia,{once:true});

crearCristales();
loop();