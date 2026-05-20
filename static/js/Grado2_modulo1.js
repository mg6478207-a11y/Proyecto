// ============================================================
//  RETOMATE - Grado 2, Módulo 1: Sumas con Lleva
//  Juego: Zorrito buzo dispara burbujas a los peces correctos
//  CALIDAD MEJORADA: gradientes, partículas, efectos de luz
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// ── PREGUNTAS ────────────────────────────────────────────────
const preguntas = [
    { q:'17 + 15 = ?', r:32, ops:[29,32,35] },
    { q:'28 + 14 = ?', r:42, ops:[40,42,44] },
    { q:'36 + 27 = ?', r:63, ops:[61,63,65] },
    { q:'45 + 18 = ?', r:63, ops:[62,63,64] },
    { q:'53 + 29 = ?', r:82, ops:[80,82,84] },
    { q:'67 + 14 = ?', r:81, ops:[79,81,83] },
    { q:'48 + 35 = ?', r:83, ops:[81,83,85] },
    { q:'76 + 17 = ?', r:93, ops:[91,93,95] },
    { q:'59 + 23 = ?', r:82, ops:[80,82,84] },
    { q:'84 + 16 = ?', r:100,ops:[98,100,102]},
];

// ── ESTADO ───────────────────────────────────────────────────
let pregIdx=0, aciertos=0, vidas=3;
let gameOver=false, ganado=false, guardado=false;
let flash='', flashT=0, tick=0;

// ── PARTÍCULAS ────────────────────────────────────────────────
let particulas = [];
function crearParticulas(x, y, color, cantidad=18) {
    for (let i=0; i<cantidad; i++) {
        const ang = (Math.random()*Math.PI*2);
        const vel = 2+Math.random()*4;
        particulas.push({
            x, y,
            vx: Math.cos(ang)*vel,
            vy: Math.sin(ang)*vel - 2,
            vida: 1,
            decaimiento: 0.025+Math.random()*0.02,
            r: 3+Math.random()*5,
            color,
        });
    }
}
function actualizarParticulas() {
    particulas = particulas.filter(p => p.vida > 0);
    particulas.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.12; p.vida -= p.decaimiento;
        p.vx *= 0.97;
    });
}
function dibujarParticulas() {
    particulas.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.vida;
        const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
        g.addColorStop(0, p.color);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        ctx.restore();
    });
}

// ── BURBUJA DISPARADA ─────────────────────────────────────────
let burbuja = null;

// ── BUZO (zorrito) ────────────────────────────────────────────
const buzo = {
    x: W/2, y: H-80,
    vel: 6,
    izq: false, der: false,
    animo: 0, // frame de animación
};

// ── PECES ─────────────────────────────────────────────────────
let peces = [];
const COLORES_PEZ = [
    {cuerpo:'#f97316',aleta:'#ea580c'},
    {cuerpo:'#f472b6',aleta:'#db2777'},
    {cuerpo:'#34d399',aleta:'#059669'},
    {cuerpo:'#fb923c',aleta:'#f97316'},
];

function crearPeces() {
    peces = [];
    if (pregIdx >= preguntas.length) return;
    const p = preguntas[pregIdx];
    const ops = [...p.ops];
    for (let i=ops.length-1;i>0;i--) {
        const j=Math.floor(Math.random()*(i+1));
        [ops[i],ops[j]]=[ops[j],ops[i]];
    }
    ops.forEach((val, i) => {
        const col = COLORES_PEZ[i % COLORES_PEZ.length];
        peces.push({
            x: 150 + i*240 + Math.random()*60-30,
            y: 80 + Math.random()*60,
            vx: (Math.random()-0.5)*1.2,
            vy: (Math.random()-0.5)*0.6,
            valor: val,
            correcta: val===p.r,
            cuerpo: col.cuerpo,
            aleta: col.aleta,
            r: 38,
            fase: Math.random()*Math.PI*2,
            golpeado: false,
            golpeT: 0,
        });
    });
}

// ── FONDO OCEÁNICO CON GRADIENTE ──────────────────────────────
function dibujarFondo() {
    // Gradiente profundidad
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, '#0c4a6e');
    grad.addColorStop(0.4,'#075985');
    grad.addColorStop(1, '#0c2444');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);

    // Rayos de luz desde arriba
    ctx.save();
    for (let i=0;i<6;i++) {
        const lx = 80+i*130;
        const alpha = 0.04+0.03*Math.sin(tick*0.02+i);
        const g = ctx.createLinearGradient(lx,0,lx+40,H*0.7);
        g.addColorStop(0,`rgba(125,211,252,${alpha*2})`);
        g.addColorStop(1,'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(lx-20,0);
        ctx.lineTo(lx+60,H*0.7);
        ctx.lineTo(lx+20,H*0.7);
        ctx.lineTo(lx-60,0);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();

    // Burbujas de fondo decorativas
    for (let i=0;i<8;i++) {
        const bx = (i*127+tick*0.3)%W;
        const by = H - (tick*0.5+i*60)%(H+20);
        ctx.save();
        ctx.globalAlpha = 0.15+0.1*Math.sin(tick*0.05+i);
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(bx,by,4+i%5,0,Math.PI*2); ctx.stroke();
        ctx.restore();
    }

    // Arena del fondo con gradiente
    const sandGrad = ctx.createLinearGradient(0,H-60,0,H);
    sandGrad.addColorStop(0,'#d97706');
    sandGrad.addColorStop(1,'#92400e');
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0,H-60,W,60);

    // Detalle arena — ondas
    ctx.strokeStyle = 'rgba(251,191,36,0.3)';
    ctx.lineWidth = 2;
    for (let i=0;i<6;i++) {
        const wy = H-50+i*8;
        ctx.beginPath();
        for (let x=0;x<W;x+=40) {
            ctx.quadraticCurveTo(x+20,wy-5,x+40,wy);
        }
        ctx.stroke();
    }

    // Corales con gradiente
    dibujarCoral(ctx, 60,  H-60, '#f87171', '#fca5a5', tick);
    dibujarCoral(ctx, 200, H-60, '#a78bfa', '#c4b5fd', tick+20);
    dibujarCoral(ctx, 580, H-60, '#34d399', '#6ee7b7', tick+10);
    dibujarCoral(ctx, 730, H-60, '#fb923c', '#fdba74', tick+15);

    // Algas
    [120,350,460,650].forEach((ax,i)=>dibujarAlgaMejorada(ctx,ax,H-60,tick+i*15));
}

function dibujarCoral(ctx,x,y,c1,c2,tick) {
    const sw=Math.sin(tick*0.025)*4;
    ctx.save();
    ctx.translate(x,y);
    const g=ctx.createLinearGradient(0,-50,0,0);
    g.addColorStop(0,c2); g.addColorStop(1,c1);
    ctx.strokeStyle=g; ctx.lineWidth=5; ctx.lineCap='round';
    for (let i=-2;i<=2;i++) {
        ctx.beginPath();
        ctx.moveTo(i*12,0);
        ctx.quadraticCurveTo(i*12+sw,-22,i*10+sw*0.7,-44);
        ctx.stroke();
        // Cabeza coral con gradiente radial
        const rg=ctx.createRadialGradient(i*10+sw*0.7,-44,0,i*10+sw*0.7,-44,8);
        rg.addColorStop(0,c2); rg.addColorStop(1,c1);
        ctx.fillStyle=rg;
        ctx.beginPath(); ctx.arc(i*10+sw*0.7,-44,7,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
}

function dibujarAlgaMejorada(ctx,x,y,tick) {
    ctx.save();
    ctx.translate(x,y);
    const g=ctx.createLinearGradient(0,-80,0,0);
    g.addColorStop(0,'#4ade80'); g.addColorStop(1,'#15803d');
    ctx.strokeStyle=g; ctx.lineWidth=4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(0,0);
    for (let i=0;i<5;i++) {
        const sw=Math.sin(tick*0.03+i)*12;
        ctx.quadraticCurveTo(sw,-14-i*14,0,-20-i*16);
    }
    ctx.stroke();
    ctx.restore();
}

// ── DIBUJAR PEZ MEJORADO ──────────────────────────────────────
function dibujarPez(p) {
    const fl = Math.sin(tick*0.04+p.fase)*5;
    const escala = p.golpeado ? 1+p.golpeT*0.05 : 1;
    ctx.save();
    ctx.translate(p.x, p.y+fl);
    ctx.scale(escala, escala);

    // Sombra suave
    ctx.save();
    ctx.globalAlpha = 0.3;
    const sg = ctx.createRadialGradient(0,5,0,0,5,p.r+10);
    sg.addColorStop(0,'rgba(0,0,0,0.4)');
    sg.addColorStop(1,'transparent');
    ctx.fillStyle=sg;
    ctx.beginPath(); ctx.ellipse(0,5,p.r+10,p.r*0.4,0,0,Math.PI*2); ctx.fill();
    ctx.restore();

    // Aleta superior
    ctx.fillStyle=p.aleta;
    ctx.beginPath();
    ctx.moveTo(-10,-p.r*0.4);
    ctx.quadraticCurveTo(0,-p.r*0.9,14,-p.r*0.4);
    ctx.closePath(); ctx.fill();

    // Cuerpo con gradiente
    const cg=ctx.createRadialGradient(-8,-8,0,0,0,p.r);
    cg.addColorStop(0,'#ffffff');
    cg.addColorStop(0.2,p.cuerpo);
    cg.addColorStop(1,p.aleta);
    ctx.fillStyle=cg;
    ctx.beginPath(); ctx.ellipse(0,0,p.r,p.r*0.65,0,0,Math.PI*2); ctx.fill();

    // Cola
    ctx.fillStyle=p.aleta;
    ctx.beginPath();
    ctx.moveTo(-p.r,0);
    ctx.lineTo(-p.r-20,-18);
    ctx.lineTo(-p.r-20,18);
    ctx.closePath(); ctx.fill();

    // Ojo con brillo
    const eg=ctx.createRadialGradient(p.r*0.45,-5,0,p.r*0.45,-5,9);
    eg.addColorStop(0,'white');
    eg.addColorStop(0.4,'#93c5fd');
    eg.addColorStop(1,'#1d4ed8');
    ctx.fillStyle=eg;
    ctx.beginPath(); ctx.arc(p.r*0.45,-5,9,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#111';
    ctx.beginPath(); ctx.arc(p.r*0.5,-5,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='white';
    ctx.beginPath(); ctx.arc(p.r*0.52,-7,2,0,Math.PI*2); ctx.fill();

    // Número con sombra
    ctx.font='bold 17px Comic Sans MS';
    ctx.shadowColor='rgba(0,0,0,0.5)';
    ctx.shadowBlur=4;
    ctx.fillStyle='white';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(p.valor),0,2);
    ctx.shadowBlur=0;

    // Escamas decorativas
    ctx.strokeStyle='rgba(255,255,255,0.2)';
    ctx.lineWidth=1;
    [-10,0,10].forEach(sx=>{
        ctx.beginPath();
        ctx.arc(sx,0,8,Math.PI*0.3,Math.PI*0.7);
        ctx.stroke();
    });

    ctx.restore();
}

// ── DIBUJAR BURBUJA ───────────────────────────────────────────
function dibujarBurbuja(b) {
    if (!b) return;
    ctx.save();
    // Resplandor exterior
    const og=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r+8);
    og.addColorStop(0,'rgba(125,211,252,0.3)');
    og.addColorStop(1,'transparent');
    ctx.fillStyle=og;
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r+8,0,Math.PI*2); ctx.fill();
    // Burbuja principal
    const g=ctx.createRadialGradient(b.x-b.r*0.3,b.y-b.r*0.3,0,b.x,b.y,b.r);
    g.addColorStop(0,'rgba(255,255,255,0.9)');
    g.addColorStop(0.3,'rgba(186,230,253,0.6)');
    g.addColorStop(0.8,'rgba(125,211,252,0.3)');
    g.addColorStop(1,'rgba(14,165,233,0.1)');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(186,230,253,0.8)';
    ctx.lineWidth=2;
    ctx.stroke();
    // Brillo
    ctx.fillStyle='rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.ellipse(b.x-b.r*0.3,b.y-b.r*0.3,b.r*0.25,b.r*0.15,-0.5,0,Math.PI*2); ctx.fill();
    ctx.restore();
}

// ── DIBUJAR ZORRITO BUZO ─────────────────────────────────────
function dibujarBuzo() {
    const cx=buzo.x, cy=buzo.y;
    const bob=Math.sin(tick*0.05)*3;

    // Tanque de oxígeno
    const tg=ctx.createLinearGradient(cx+16,cy-20,cx+28,cy-20);
    tg.addColorStop(0,'#94a3b8'); tg.addColorStop(0.5,'#e2e8f0'); tg.addColorStop(1,'#64748b');
    ctx.fillStyle=tg;
    ctx.beginPath(); ctx.roundRect(cx+16,cy-22+bob,14,36,5); ctx.fill();
    ctx.strokeStyle='#475569'; ctx.lineWidth=1.5; ctx.stroke();
    // Burbujitas del tanque
    if (tick%8===0) {
        crearParticulas(cx+23,cy-28+bob,'rgba(186,230,253,0.8)',2);
    }

    // Traje buzo (cuerpo)
    const tgb=ctx.createLinearGradient(cx-20,cy,cx+20,cy);
    tgb.addColorStop(0,'#1d4ed8'); tgb.addColorStop(0.5,'#3b82f6'); tgb.addColorStop(1,'#1d4ed8');
    ctx.fillStyle=tgb;
    ctx.beginPath(); ctx.ellipse(cx,cy+20+bob,20,22,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#1e40af'; ctx.lineWidth=2; ctx.stroke();

    // Orejas zorrito
    ctx.fillStyle='#ff8c00';
    ctx.beginPath(); ctx.moveTo(cx-10,cy-32+bob); ctx.lineTo(cx-20,cy-48+bob); ctx.lineTo(cx-2,cy-32+bob); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+2,cy-32+bob); ctx.lineTo(cx+20,cy-48+bob); ctx.lineTo(cx+10,cy-32+bob); ctx.fill();
    ctx.fillStyle='#ffb347';
    ctx.beginPath(); ctx.moveTo(cx-9,cy-32+bob); ctx.lineTo(cx-15,cy-41+bob); ctx.lineTo(cx-3,cy-32+bob); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+3,cy-32+bob); ctx.lineTo(cx+15,cy-41+bob); ctx.lineTo(cx+9,cy-32+bob); ctx.fill();

    // Cabeza
    const hg=ctx.createRadialGradient(cx-6,cy-22+bob,0,cx,cy-18+bob,22);
    hg.addColorStop(0,'#ffb347'); hg.addColorStop(1,'#ff8c00');
    ctx.fillStyle=hg;
    ctx.beginPath(); ctx.arc(cx,cy-18+bob,22,0,Math.PI*2); ctx.fill();

    // Máscara de buceo con reflejo
    const mg=ctx.createLinearGradient(cx-18,cy-28+bob,cx+18,cy-8+bob);
    mg.addColorStop(0,'rgba(186,230,253,0.7)');
    mg.addColorStop(1,'rgba(14,165,233,0.4)');
    ctx.fillStyle=mg;
    ctx.beginPath(); ctx.roundRect(cx-18,cy-30+bob,36,26,8); ctx.fill();
    ctx.strokeStyle='#0369a1'; ctx.lineWidth=3; ctx.stroke();
    // Reflejo máscara
    ctx.fillStyle='rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.ellipse(cx-8,cy-24+bob,8,5,-0.3,0,Math.PI*2); ctx.fill();

    // Cara dentro de máscara
    ctx.fillStyle='#fff5e6';
    ctx.beginPath(); ctx.ellipse(cx,cy-16+bob,8,6,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#222';
    ctx.beginPath(); ctx.arc(cx,cy-20+bob,2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx-6,cy-24+bob,2.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+6,cy-24+bob,2.5,0,Math.PI*2); ctx.fill();

    // Aletas
    const fg=ctx.createLinearGradient(cx-30,cy+40+bob,cx+30,cy+40+bob);
    fg.addColorStop(0,'#0369a1'); fg.addColorStop(0.5,'#0ea5e9'); fg.addColorStop(1,'#0369a1');
    ctx.fillStyle=fg;
    ctx.beginPath(); ctx.ellipse(cx-24,cy+40+bob,20,8,0.4,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+24,cy+40+bob,20,8,-0.4,0,Math.PI*2); ctx.fill();

    // Brazos
    ctx.strokeStyle='#3b82f6'; ctx.lineWidth=8; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx-16,cy+6+bob); ctx.lineTo(cx-32,cy+22+bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+16,cy+6+bob); ctx.lineTo(cx+32,cy+22+bob); ctx.stroke();

    // Indicador de dirección de disparo
    ctx.save();
    ctx.globalAlpha=0.5+0.3*Math.sin(tick*0.1);
    ctx.strokeStyle='#7dd3fc'; ctx.lineWidth=2;
    ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(cx,cy-40+bob); ctx.lineTo(cx,cy-80+bob); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#7dd3fc';
    ctx.beginPath(); ctx.moveTo(cx,cy-86+bob); ctx.lineTo(cx-6,cy-74+bob); ctx.lineTo(cx+6,cy-74+bob); ctx.closePath(); ctx.fill();
    ctx.restore();
}

// ── HUD MEJORADO ─────────────────────────────────────────────
function dibujarHUD() {
    if (pregIdx>=preguntas.length) return;
    const p=preguntas[pregIdx];
    // Panel con gradiente
    const hg=ctx.createLinearGradient(20,10,W-20,62);
    hg.addColorStop(0,'rgba(12,74,110,0.95)');
    hg.addColorStop(1,'rgba(3,105,161,0.95)');
    ctx.fillStyle=hg;
    ctx.beginPath(); ctx.roundRect(20,10,W-40,52,12); ctx.fill();
    ctx.strokeStyle='rgba(14,165,233,0.5)'; ctx.lineWidth=1.5; ctx.stroke();

    // Pregunta con efecto brillo
    ctx.font='bold 24px Comic Sans MS';
    ctx.shadowColor='rgba(125,211,252,0.6)'; ctx.shadowBlur=8;
    ctx.fillStyle='#e0f2fe';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(p.q,W/2,36);
    ctx.shadowBlur=0;

    ctx.font='20px serif'; ctx.textAlign='left';
    for(let i=0;i<vidas;i++) ctx.fillText('❤️',28+i*28,56);
    ctx.font='bold 14px Arial'; ctx.fillStyle='#7dd3fc'; ctx.textAlign='right';
    ctx.fillText(`✅ ${aciertos}/${preguntas.length}`,W-28,56);
}

// ── FLASH ─────────────────────────────────────────────────────
function dibujarFlash() {
    if(!flash||flashT<=0) return;
    ctx.globalAlpha=Math.min(1,flashT/20);
    ctx.font='bold 34px Comic Sans MS';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.shadowColor=flash.includes('!')&&!flash.includes('no')?'rgba(251,191,36,0.8)':'rgba(248,113,113,0.8)';
    ctx.shadowBlur=20;
    ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=4;
    ctx.strokeText(flash,W/2,H/2-50);
    ctx.fillStyle=flash.includes('!')&&!flash.includes('no')?'#fbbf24':'#f87171';
    ctx.fillText(flash,W/2,H/2-50);
    ctx.shadowBlur=0; ctx.globalAlpha=1; flashT--;
}

// ── PANTALLA FINAL ────────────────────────────────────────────
function dibujarFinal() {
    // Overlay con gradiente
    const og=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.7);
    og.addColorStop(0,'rgba(0,0,0,0.7)');
    og.addColorStop(1,'rgba(0,0,0,0.85)');
    ctx.fillStyle=og; ctx.fillRect(0,0,W,H);

    ctx.font='bold 40px Comic Sans MS';
    ctx.shadowColor=ganado?'rgba(251,191,36,0.8)':'rgba(248,113,113,0.8)';
    ctx.shadowBlur=20;
    ctx.fillStyle=ganado?'#fbbf24':'#f87171';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(ganado?'🐠 ¡Misión cumplida!':'🌊 ¡Inténtalo de nuevo!',W/2,H/2-55);
    ctx.shadowBlur=0;

    ctx.font='22px Comic Sans MS'; ctx.fillStyle='white';
    ctx.fillText(`Respuestas correctas: ${aciertos} de ${preguntas.length}`,W/2,H/2);
    ctx.fillText(`Puntaje: ${Math.round(aciertos/preguntas.length*100)}%`,W/2,H/2+38);

    // Botón con gradiente
    const bg=ctx.createLinearGradient(W/2-100,H/2+78,W/2+100,H/2+126);
    bg.addColorStop(0,'#0369a1'); bg.addColorStop(1,'#0ea5e9');
    ctx.fillStyle=bg;
    ctx.shadowColor='rgba(14,165,233,0.5)'; ctx.shadowBlur=15;
    ctx.beginPath(); ctx.roundRect(W/2-100,H/2+78,200,48,12); ctx.fill();
    ctx.shadowBlur=0;
    ctx.font='bold 19px Comic Sans MS'; ctx.fillStyle='white';
    ctx.fillText('▶ Jugar de nuevo',W/2,H/2+102);
}

// ── GUARDAR ───────────────────────────────────────────────────
async function guardarProgreso() {
    if(guardado) return; guardado=true;
    try {
        await fetch('/guardar_progreso',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({unidad:201,aciertos,total:preguntas.length,puntaje:Math.round(aciertos/preguntas.length*100)})});
    } catch(e){}
}

// ── LOOP ──────────────────────────────────────────────────────
function loop() {
    tick++;
    ctx.clearRect(0,0,W,H);
    dibujarFondo();
    actualizarParticulas();
    dibujarParticulas();

    // Mover buzo
    if(buzo.izq&&buzo.x-50>0) buzo.x-=buzo.vel;
    if(buzo.der&&buzo.x+50<W) buzo.x+=buzo.vel;

    // Mover peces
    peces.forEach(p=>{
        if(p.golpeado){p.golpeT--;if(p.golpeT<=0)p.golpeado=false;return;}
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<60||p.x>W-60) p.vx*=-1;
        if(p.y<60||p.y>H*0.45) p.vy*=-1;
        dibujarPez(p);
    });

    // Mover burbuja
    if(burbuja){
        burbuja.y-=burbuja.vel;
        burbuja.x+=Math.sin(tick*0.1)*0.5;
        dibujarBurbuja(burbuja);

        // Colisión con peces — usar bandera para no modificar array durante iteración
        let impacto = null;
        for(let i=0; i<peces.length; i++){
            const p = peces[i];
            if(p.golpeado) continue;
            if(Math.hypot(burbuja.x-p.x, burbuja.y-p.y) < p.r+burbuja.r){
                impacto = p; break;
            }
        }
        if(impacto){
            const px=impacto.x, py=impacto.y, esCorrecta=impacto.correcta;
            impacto.golpeado=true; impacto.golpeT=15;
            burbuja=null;
            if(esCorrecta){
                aciertos++;
                Sonidos.correcto();
                crearParticulas(px,py,'#fbbf24',25);
                crearParticulas(px,py,'#7dd3fc',15);
                flash='🐠 ¡Impacto!'; flashT=40;
                pregIdx++;
                if(pregIdx>=preguntas.length){
                    gameOver=true; ganado=aciertos>=Math.ceil(preguntas.length*0.6);
                    crearParticulas(W/2,H/2,ganado?'#fbbf24':'#f87171',40);
                    if(ganado)Sonidos.ganar(); else Sonidos.perder();
                    guardarProgreso();
                } else {
                    setTimeout(()=>crearPeces(), 400);
                }
            } else {
                vidas--;
                Sonidos.incorrecto();
                crearParticulas(px,py,'#f87171',20);
                flash='¡Ese no es!'; flashT=40;
                if(vidas<=0){gameOver=true;ganado=false;Sonidos.perder();guardarProgreso();}
                else { setTimeout(()=>crearPeces(), 400); }
            }
        }
        if(burbuja&&burbuja.y<-20) burbuja=null;
    }

    if(!gameOver) {
        dibujarBuzo();
        dibujarHUD();
        dibujarFlash();
    } else {
        dibujarBuzo();
        dibujarFinal();
        if(ganado) {
            // Confeti continuo
            if(tick%3===0) crearParticulas(Math.random()*W,Math.random()*H*0.5,
                ['#fbbf24','#f87171','#34d399','#a78bfa','#60a5fa'][Math.floor(Math.random()*5)],3);
        }
    }
    requestAnimationFrame(loop);
}

// ── DISPARAR ──────────────────────────────────────────────────
function disparar() {
    if(gameOver||burbuja) return;
    burbuja={x:buzo.x, y:buzo.y-55, r:16, vel:7};
    // Pequeña ráfaga de burbujas al disparar
    crearParticulas(buzo.x,buzo.y-55,'rgba(186,230,253,0.9)',5);
}

// ── REINICIAR ─────────────────────────────────────────────────
function reiniciar(){
    pregIdx=0;aciertos=0;vidas=3;gameOver=false;ganado=false;guardado=false;
    flash='';flashT=0;burbuja=null;particulas=[];buzo.x=W/2;
    crearPeces();
}

// ── CONTROLES ─────────────────────────────────────────────────
document.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft') buzo.izq=true;
    if(e.key==='ArrowRight') buzo.der=true;
    if(e.key===' '||e.key==='ArrowUp'){e.preventDefault();disparar();}
});
document.addEventListener('keyup',e=>{
    if(e.key==='ArrowLeft') buzo.izq=false;
    if(e.key==='ArrowRight') buzo.der=false;
});
document.getElementById('btnL').addEventListener('mousedown',()=>buzo.izq=true);
document.getElementById('btnL').addEventListener('mouseup',()=>buzo.izq=false);
document.getElementById('btnL').addEventListener('touchstart',e=>{e.preventDefault();buzo.izq=true;});
document.getElementById('btnL').addEventListener('touchend',e=>{e.preventDefault();buzo.izq=false;});
document.getElementById('btnR').addEventListener('mousedown',()=>buzo.der=true);
document.getElementById('btnR').addEventListener('mouseup',()=>buzo.der=false);
document.getElementById('btnR').addEventListener('touchstart',e=>{e.preventDefault();buzo.der=true;});
document.getElementById('btnR').addEventListener('touchend',e=>{e.preventDefault();buzo.der=false;});
document.getElementById('btnFire').addEventListener('click',disparar);
document.getElementById('btnFire').addEventListener('touchstart',e=>{e.preventDefault();disparar();});

canvas.addEventListener('click',e=>{
    if(gameOver){
        const r=canvas.getBoundingClientRect();
        const cx=(e.clientX-r.left)*(W/r.width),cy=(e.clientY-r.top)*(H/r.height);
        if(cx>W/2-100&&cx<W/2+100&&cy>H/2+78&&cy<H/2+126)reiniciar();
    }
});
canvas.addEventListener('touchend',e=>{
    if(!gameOver) return;
    e.preventDefault();
    const t=e.changedTouches[0],r=canvas.getBoundingClientRect();
    const cx=(t.clientX-r.left)*(W/r.width),cy=(t.clientY-r.top)*(H/r.height);
    if(cx>W/2-100&&cx<W/2+100&&cy>H/2+78&&cy<H/2+126)reiniciar();
});

// ── AUDIO ─────────────────────────────────────────────────────
let _au=false;
function _ia(){if(!_au){_au=true;Sonidos.iniciar(2);}}
canvas.addEventListener('click',_ia);
canvas.addEventListener('touchstart',_ia,{passive:true});
document.addEventListener('keydown',_ia,{once:true});

// ── INICIO ────────────────────────────────────────────────────
crearPeces();
loop();