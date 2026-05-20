// ============================================================
//  RETOMATE - Grado 2, Módulo 2: Restas con Presta
//  Juego: Zorrito en barco pirata dispara torpedos a submarinos
//  Zorrito pixel art inspirado en unidad2.js del grado 6
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const P = 4; // tamaño de cada pixel del zorrito

// ── PREGUNTAS ────────────────────────────────────────────────
const preguntas = [
    { q:'32 - 15 = ?', r:17, ops:[15,17,19] },
    { q:'45 - 28 = ?', r:17, ops:[16,17,18] },
    { q:'63 - 37 = ?', r:26, ops:[24,26,28] },
    { q:'52 - 24 = ?', r:28, ops:[26,28,30] },
    { q:'71 - 46 = ?', r:25, ops:[23,25,27] },
    { q:'84 - 57 = ?', r:27, ops:[25,27,29] },
    { q:'93 - 68 = ?', r:25, ops:[24,25,26] },
    { q:'60 - 33 = ?', r:27, ops:[26,27,28] },
    { q:'75 - 48 = ?', r:27, ops:[25,27,29] },
    { q:'100- 64 = ?', r:36, ops:[34,36,38] },
];

// ── ESTADO ───────────────────────────────────────────────────
let pregIdx=0, aciertos=0, vidas=3;
let gameOver=false, ganado=false, guardado=false;
let flash='', flashT=0, tick=0;

// ── PARTÍCULAS ────────────────────────────────────────────────
let particulas=[];
function boom(x,y,col,n=20) {
    for(let i=0;i<n;i++){
        const a=Math.random()*Math.PI*2, v=2+Math.random()*3;
        particulas.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,
            vida:1,dec:0.02+Math.random()*0.02,r:3+Math.random()*6,col});
    }
}
function tickParticulas() {
    particulas=particulas.filter(p=>p.vida>0);
    particulas.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.04;p.vida-=p.dec;p.vx*=0.96;});
}
function drawParticulas() {
    particulas.forEach(p=>{
        ctx.save(); ctx.globalAlpha=p.vida;
        const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
        g.addColorStop(0,p.col); g.addColorStop(1,'transparent');
        ctx.fillStyle=g;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        ctx.restore();
    });
}

// ── TORPEDO ───────────────────────────────────────────────────
let torpedo=null;

// ── BARCO (posición fija izquierda) ───────────────────────────
const barco = { x:60, y:H-200, canon_y:H-230 };
let canonY = H/2; // posición Y del cañón apuntando

// ── SUBMARINOS ────────────────────────────────────────────────
let subs=[];
const FILAS_Y = [120, 220, 330]; // 3 filas de profundidad

function crearSubs() {
    subs=[];
    if(pregIdx>=preguntas.length) return;
    const p=preguntas[pregIdx];
    const ops=[...p.ops];
    for(let i=ops.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ops[i],ops[j]]=[ops[j],ops[i]];}
    ops.forEach((val,i)=>{
        subs.push({
            x: W+60+i*80,
            y: FILAS_Y[i],
            valor: val,
            correcta: val===p.r,
            vx: -(0.22 + Math.random() * 0.08),
            golpeado: false,
            golpeT: 0,
            fase: Math.random()*Math.PI*2,
        });
    });
    canonY=FILAS_Y[1]; // apuntar al centro por defecto
}

// ── DIBUJAR ZORRITO PIXEL ART (estilo grado 6) ───────────────
function drawZorrito(bx, by, facing='right') {
    const bob = Math.sin(tick*0.03)*1.5;
    const stepOffset = Math.sin(tick*0.08)*1;
    const p = P;

    ctx.save();
    if(facing==='left'){
        ctx.translate(bx+16*p,0); ctx.scale(-1,1);
    } else {
        ctx.translate(bx,0);
    }

    const baseX=0, baseY=by+bob;

    // Cola
    const tailSwing = Math.sin(tick*0.15)*3;
    ctx.fillStyle='#e76f51';
    ctx.fillRect(baseX-6*p, baseY+12*p+tailSwing, 6*p, 3*p);
    ctx.fillStyle='#f48c06';
    ctx.fillRect(baseX-10*p, baseY+10*p+tailSwing, 4*p, 3*p);
    ctx.fillStyle='#fff';
    ctx.fillRect(baseX-12*p, baseY+9*p+tailSwing, 3*p, 2*p);

    // Ropa (traje pirata)
    ctx.fillStyle='#1e3a5f';
    ctx.fillRect(baseX+5*p, baseY+8*p, 10*p, 10*p);
    // Franja camisa
    ctx.fillStyle='#fff';
    ctx.fillRect(baseX+5*p, baseY+9*p, 10*p, 2*p);
    ctx.fillRect(baseX+5*p, baseY+12*p, 10*p, 2*p);

    // Cabeza
    ctx.fillStyle='#f48c06';
    ctx.fillRect(baseX+4*p, baseY+1*p, 12*p, 9*p);
    // Orejas puntiagudas
    ctx.fillStyle='#e85d04';
    ctx.fillRect(baseX+4*p, baseY-1*p, 3*p, 3*p);
    ctx.fillRect(baseX+13*p, baseY-1*p, 3*p, 3*p);

    // Sombrero pirata
    ctx.fillStyle='#111';
    ctx.fillRect(baseX+3*p, baseY-4*p, 14*p, 4*p);
    ctx.fillRect(baseX+5*p, baseY-8*p, 10*p, 5*p);
    ctx.fillStyle='#fff';
    ctx.fillRect(baseX+7*p, baseY-6*p, 6*p, 2*p); // calavera
    ctx.fillStyle='#111';
    ctx.fillRect(baseX+8*p, baseY-6*p, 1*p, 2*p);
    ctx.fillRect(baseX+10*p, baseY-6*p, 1*p, 2*p);
    ctx.fillRect(baseX+12*p, baseY-6*p, 1*p, 2*p);

    // Pantalón
    ctx.fillStyle='#264653';
    ctx.fillRect(baseX+5*p, baseY+16*p, 10*p, 5*p);
    // Botas
    ctx.fillStyle='#1d3557';
    ctx.fillRect(baseX+5*p, baseY+21*p+stepOffset, 4*p, 2*p);
    ctx.fillRect(baseX+11*p, baseY+21*p-stepOffset, 4*p, 2*p);

    // Brazos
    ctx.fillStyle='#f48c06';
    ctx.fillRect(baseX+2*p, baseY+8*p, 3*p, 5*p);
    ctx.fillRect(baseX+15*p, baseY+8*p, 3*p, 5*p);

    // Ojos
    ctx.fillStyle='#000';
    ctx.fillRect(baseX+7*p, baseY+4*p, 2*p, 2*p);
    ctx.fillRect(baseX+13*p, baseY+4*p, 2*p, 2*p);
    // Nariz
    ctx.fillRect(baseX+9*p, baseY+6*p, 4*p, 1*p);

    ctx.restore();
}

// ── DIBUJAR BARCO ─────────────────────────────────────────────
function drawBarco() {
    const bx=20, by=H-160;

    // Casco barco
    const cg=ctx.createLinearGradient(bx,by,bx,by+80);
    cg.addColorStop(0,'#92400e'); cg.addColorStop(1,'#78350f');
    ctx.fillStyle=cg;
    ctx.beginPath();
    ctx.moveTo(bx,by+20);
    ctx.lineTo(bx+120,by+20);
    ctx.lineTo(bx+110,by+80);
    ctx.lineTo(bx+10,by+80);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#451a03'; ctx.lineWidth=2; ctx.stroke();

    // Cubierta
    const dg=ctx.createLinearGradient(bx,by,bx,by+22);
    dg.addColorStop(0,'#b45309'); dg.addColorStop(1,'#92400e');
    ctx.fillStyle=dg;
    ctx.fillRect(bx-5,by+10,130,14);

    // Mástil
    ctx.fillStyle='#78350f';
    ctx.fillRect(bx+55,by-80,6,90);

    // Vela
    const vg=ctx.createLinearGradient(bx+61,by-75,bx+100,by-20);
    vg.addColorStop(0,'#fef3c7'); vg.addColorStop(1,'#fde68a');
    ctx.fillStyle=vg;
    ctx.beginPath();
    ctx.moveTo(bx+61,by-75);
    ctx.lineTo(bx+105,by-45);
    ctx.lineTo(bx+61,by-10);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#d97706'; ctx.lineWidth=1; ctx.stroke();
    // Cruz vela
    ctx.strokeStyle='#d97706'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(bx+61,by-55); ctx.lineTo(bx+95,by-38); ctx.stroke();

    // Bandera pirata
    ctx.fillStyle='#111';
    ctx.fillRect(bx+55,by-100,30,22);
    ctx.fillStyle='#fff';
    ctx.font='14px serif';
    ctx.fillText('☠',bx+58,by-83);

    // Cañón apuntando
    const canonAngle = Math.atan2(canonY-(by+10), W-20-(bx+110));
    ctx.save();
    ctx.translate(bx+110, by+10);
    ctx.rotate(canonAngle);
    const canonG=ctx.createLinearGradient(-5,-8,30,8);
    canonG.addColorStop(0,'#475569'); canonG.addColorStop(1,'#1e293b');
    ctx.fillStyle=canonG;
    ctx.beginPath(); ctx.roundRect(-5,-8,50,16,4); ctx.fill();
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=1; ctx.stroke();
    ctx.restore();

    // Zorrito en cubierta
    drawZorrito(bx+30, by-60, 'right');
}

// ── DIBUJAR SUBMARINO ─────────────────────────────────────────
function drawSub(s) {
    if(s.golpeado) return;
    const fl=Math.sin(tick*0.05+s.fase)*4;
    const x=s.x, y=s.y+fl;

    ctx.save();

    // Resplandor
    const og=ctx.createRadialGradient(x,y,0,x,y,55);
    og.addColorStop(0,'rgba(14,165,233,0.15)');
    og.addColorStop(1,'transparent');
    ctx.fillStyle=og;
    ctx.beginPath(); ctx.ellipse(x,y,55,35,0,0,Math.PI*2); ctx.fill();

    // Sombra
    ctx.fillStyle='rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(x,y+28,40,8,0,0,Math.PI*2); ctx.fill();

    // Cuerpo principal
    const bg=ctx.createLinearGradient(x-45,y-18,x+45,y+18);
    bg.addColorStop(0,'#64748b'); bg.addColorStop(0.4,'#94a3b8'); bg.addColorStop(1,'#475569');
    ctx.fillStyle=bg;
    ctx.beginPath(); ctx.ellipse(x,y,45,18,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#334155'; ctx.lineWidth=2; ctx.stroke();

    // Torreta
    ctx.fillStyle='#475569';
    ctx.beginPath(); ctx.ellipse(x+5,y-16,18,10,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#334155'; ctx.lineWidth=1.5; ctx.stroke();

    // Periscopio
    ctx.strokeStyle='#64748b'; ctx.lineWidth=3; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x+10,y-24); ctx.lineTo(x+10,y-36); ctx.lineTo(x+20,y-36); ctx.stroke();
    ctx.fillStyle='#7dd3fc';
    ctx.beginPath(); ctx.arc(x+20,y-36,4,0,Math.PI*2); ctx.fill();

    // Hélice animada
    ctx.save(); ctx.translate(x-45,y); ctx.rotate(tick*0.15);
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=3;
    for(let i=0;i<3;i++){
        const a=(i/3)*Math.PI*2;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*14,Math.sin(a)*14); ctx.stroke();
    }
    ctx.restore();

    // Ventanillas
    [x-15,x+5,x+22].forEach(wx=>{
        const wg=ctx.createRadialGradient(wx,y,0,wx,y,8);
        wg.addColorStop(0,'#e0f2fe'); wg.addColorStop(0.5,'#7dd3fc'); wg.addColorStop(1,'#0369a1');
        ctx.fillStyle=wg;
        ctx.beginPath(); ctx.arc(wx,y,8,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#475569'; ctx.lineWidth=1.5; ctx.stroke();
        // Brillo
        ctx.fillStyle='rgba(255,255,255,0.5)';
        ctx.beginPath(); ctx.ellipse(wx-3,y-3,3,2,-0.4,0,Math.PI*2); ctx.fill();
    });

    // Número
    ctx.font='bold 18px Comic Sans MS';
    ctx.shadowColor='rgba(0,0,0,0.6)'; ctx.shadowBlur=4;
    ctx.fillStyle='white'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(s.valor),x,y);
    ctx.shadowBlur=0;

    // Burbujas
    if(Math.sin(tick*0.08+s.fase)>0.7){
        ctx.globalAlpha=0.4; ctx.strokeStyle='#bae6fd'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(x-35,y-20+Math.sin(tick*0.1)*5,3,0,Math.PI*2); ctx.stroke();
        ctx.globalAlpha=1;
    }

    ctx.restore();
}

// ── DIBUJAR TORPEDO ───────────────────────────────────────────
function drawTorpedo(t) {
    if(!t) return;
    ctx.save();
    // Estela
    for(let i=0;i<6;i++){
        ctx.globalAlpha=(6-i)*0.08;
        ctx.fillStyle='#fbbf24';
        ctx.beginPath(); ctx.ellipse(t.x-i*8,t.y,6-i,4,0,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
    // Cuerpo torpedo
    const tg=ctx.createLinearGradient(t.x-20,t.y-6,t.x+20,t.y+6);
    tg.addColorStop(0,'#fbbf24'); tg.addColorStop(0.5,'#f97316'); tg.addColorStop(1,'#dc2626');
    ctx.fillStyle=tg;
    ctx.beginPath(); ctx.ellipse(t.x,t.y,20,7,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#7f1d1d'; ctx.lineWidth=1.5; ctx.stroke();
    // Punta
    ctx.fillStyle='#dc2626';
    ctx.beginPath(); ctx.moveTo(t.x+20,t.y); ctx.lineTo(t.x+30,t.y-3); ctx.lineTo(t.x+30,t.y+3); ctx.closePath(); ctx.fill();
    // Llama trasera
    const fr=1+Math.sin(tick*0.3)*0.3;
    ctx.fillStyle='#fbbf24';
    ctx.beginPath(); ctx.moveTo(t.x-20,t.y); ctx.lineTo(t.x-28*fr,t.y-5); ctx.lineTo(t.x-28*fr,t.y+5); ctx.closePath(); ctx.fill();
    ctx.restore();
}

// ── FONDO OCEÁNICO ────────────────────────────────────────────
function drawFondo() {
    // Gradiente profundidad
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#0c4a6e'); g.addColorStop(0.3,'#075985'); g.addColorStop(1,'#0c2444');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    // Superficie del agua
    const sg=ctx.createLinearGradient(0,0,0,60);
    sg.addColorStop(0,'#0ea5e9'); sg.addColorStop(1,'rgba(14,165,233,0)');
    ctx.fillStyle=sg; ctx.fillRect(0,0,W,60);

    // Olas superficie
    ctx.strokeStyle='rgba(186,230,253,0.5)'; ctx.lineWidth=2;
    for(let i=0;i<3;i++){
        const oy=12+i*15+Math.sin(tick*0.03+i)*4;
        ctx.beginPath();
        for(let x=0;x<W;x+=40) ctx.quadraticCurveTo(x+20,oy-6,x+40,oy);
        ctx.stroke();
    }

    // Rayos de luz
    ctx.save();
    for(let i=0;i<5;i++){
        const lx=60+i*160;
        const alpha=0.04+0.02*Math.sin(tick*0.02+i);
        const lg=ctx.createLinearGradient(lx,0,lx+30,H*0.6);
        lg.addColorStop(0,`rgba(125,211,252,${alpha*2})`);
        lg.addColorStop(1,'transparent');
        ctx.fillStyle=lg;
        ctx.beginPath(); ctx.moveTo(lx-15,0); ctx.lineTo(lx+45,H*0.6); ctx.lineTo(lx+15,H*0.6); ctx.lineTo(lx-45,0); ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // Burbujas fondo
    for(let i=0;i<6;i++){
        const bx=(i*137+tick*0.4)%W;
        const by=H-((tick*0.6+i*70)%(H+20));
        ctx.save(); ctx.globalAlpha=0.12+0.08*Math.sin(tick*0.05+i);
        ctx.strokeStyle='#bae6fd'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(bx,by,3+i%4,0,Math.PI*2); ctx.stroke();
        ctx.restore();
    }

    // Fondo marino
    const sg2=ctx.createLinearGradient(0,H-50,0,H);
    sg2.addColorStop(0,'#d97706'); sg2.addColorStop(1,'#92400e');
    ctx.fillStyle=sg2; ctx.fillRect(0,H-50,W,50);
    // Ondas arena
    ctx.strokeStyle='rgba(251,191,36,0.2)'; ctx.lineWidth=2;
    for(let i=0;i<4;i++){
        const wy=H-40+i*10;
        ctx.beginPath();
        for(let x=0;x<W;x+=50) ctx.quadraticCurveTo(x+25,wy-4,x+50,wy);
        ctx.stroke();
    }

    // Algas fondo
    [60,200,380,550,700].forEach((ax,i)=>{
        ctx.save(); ctx.translate(ax,H-50);
        const ag=ctx.createLinearGradient(0,-60,0,0);
        ag.addColorStop(0,'#4ade80'); ag.addColorStop(1,'#15803d');
        ctx.strokeStyle=ag; ctx.lineWidth=3; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(0,0);
        for(let j=0;j<4;j++){const sw=Math.sin(tick*0.03+i+j)*10;ctx.quadraticCurveTo(sw,-12-j*12,0,-18-j*14);}
        ctx.stroke(); ctx.restore();
    });

    // Líneas de profundidad
    ctx.strokeStyle='rgba(125,211,252,0.06)'; ctx.lineWidth=1;
    [H*0.25,H*0.5,H*0.75].forEach(ly=>{
        ctx.beginPath(); ctx.moveTo(0,ly); ctx.lineTo(W,ly); ctx.stroke();
    });

    // Indicador de profundidad del cañón
    ctx.save();
    ctx.strokeStyle='rgba(251,191,36,0.3)'; ctx.lineWidth=1; ctx.setLineDash([6,6]);
    ctx.beginPath(); ctx.moveTo(140,canonY); ctx.lineTo(W,canonY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

// ── HUD ───────────────────────────────────────────────────────
function drawHUD() {
    if(pregIdx>=preguntas.length) return;
    const p=preguntas[pregIdx];
    const hg=ctx.createLinearGradient(20,10,W-20,62);
    hg.addColorStop(0,'rgba(12,74,110,0.95)'); hg.addColorStop(1,'rgba(3,105,161,0.95)');
    ctx.fillStyle=hg;
    ctx.beginPath(); ctx.roundRect(20,10,W-40,52,12); ctx.fill();
    ctx.strokeStyle='rgba(14,165,233,0.4)'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.font='bold 24px Comic Sans MS';
    ctx.shadowColor='rgba(125,211,252,0.5)'; ctx.shadowBlur=8;
    ctx.fillStyle='#e0f2fe'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(p.q,W/2,36); ctx.shadowBlur=0;
    ctx.font='20px serif'; ctx.textAlign='left';
    for(let i=0;i<vidas;i++) ctx.fillText('❤️',28+i*28,56);
    ctx.font='bold 14px Arial'; ctx.fillStyle='#7dd3fc'; ctx.textAlign='right';
    ctx.fillText(`✅ ${aciertos}/${preguntas.length}`,W-28,56);
}

// ── FLASH ─────────────────────────────────────────────────────
function drawFlash() {
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
function drawFinal() {
    const og=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.7);
    og.addColorStop(0,'rgba(0,0,0,0.75)'); og.addColorStop(1,'rgba(0,0,0,0.88)');
    ctx.fillStyle=og; ctx.fillRect(0,0,W,H);
    ctx.font='bold 40px Comic Sans MS';
    ctx.shadowColor=ganado?'rgba(251,191,36,0.8)':'rgba(248,113,113,0.8)';
    ctx.shadowBlur=20;
    ctx.fillStyle=ganado?'#fbbf24':'#f87171';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(ganado?'🚢 ¡Victoria en el mar!':'🌊 ¡Inténtalo de nuevo!',W/2,H/2-55);
    ctx.shadowBlur=0;
    ctx.font='22px Comic Sans MS'; ctx.fillStyle='white';
    ctx.fillText(`Respuestas correctas: ${aciertos} de ${preguntas.length}`,W/2,H/2);
    ctx.fillText(`Puntaje: ${Math.round(aciertos/preguntas.length*100)}%`,W/2,H/2+38);
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
async function guardar() {
    if(guardado) return; guardado=true;
    try {
        await fetch('/guardar_progreso',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({unidad:202,aciertos,total:preguntas.length,puntaje:Math.round(aciertos/preguntas.length*100)})});
    } catch(e){}
}

// ── DISPARAR ──────────────────────────────────────────────────
function disparar() {
    if(gameOver||torpedo) return;
    torpedo={x:140, y:canonY, vel:5.5};
    boom(140,canonY,'rgba(251,191,36,0.8)',4);
}

// ── LOOP ──────────────────────────────────────────────────────
function loop() {
    tick++;
    ctx.clearRect(0,0,W,H);
    drawFondo();
    tickParticulas(); drawParticulas();

    // Mover y dibujar subs
    subs.forEach(s=>{
        if(s.golpeado){s.golpeT--;return;}
        s.x+=s.vx;
        if(s.x<-100){
            // Sub escapó sin golpear
            if(!s.golpeado){
                s.golpeado=true;
                vidas--;
                flash='¡Se escapó! 🚤'; flashT=40;
                Sonidos.incorrecto();
                if(vidas<=0){gameOver=true;ganado=false;Sonidos.perder();guardar();}
                else setTimeout(()=>crearSubs(),1200);
            }
        }
        drawSub(s);
    });

    // Mover torpedo
    if(torpedo){
        torpedo.x+=torpedo.vel;
        drawTorpedo(torpedo);
        // Colisión
        let impacto=null;
        for(let i=0;i<subs.length;i++){
            const s=subs[i];
            if(s.golpeado) continue;
            if(Math.hypot(torpedo.x-s.x,torpedo.y-s.y)<50){impacto=s;break;}
        }
        if(impacto){
            const esCorrecta=impacto.correcta, sx=impacto.x, sy=impacto.y;
            impacto.golpeado=true; impacto.golpeT=20;
            torpedo=null;
            if(esCorrecta){
                aciertos++; Sonidos.correcto();
                boom(sx,sy,'#fbbf24',30); boom(sx,sy,'#f97316',20);
                flash='💥 ¡Hundido!'; flashT=45;
                pregIdx++;
                if(pregIdx>=preguntas.length){
                    gameOver=true; ganado=aciertos>=Math.ceil(preguntas.length*0.6);
                    boom(W/2,H/2,ganado?'#fbbf24':'#f87171',50);
                    if(ganado)Sonidos.ganar(); else Sonidos.perder();
                    guardar();
                } else setTimeout(()=>crearSubs(),500);
            } else {
                vidas--; Sonidos.incorrecto();
                boom(sx,sy,'#f87171',20);
                flash='¡Ese no es!'; flashT=40;
                if(vidas<=0){gameOver=true;ganado=false;Sonidos.perder();guardar();}
                else setTimeout(()=>crearSubs(),500);
            }
        }
        if(torpedo&&torpedo.x>W+30) torpedo=null;
    }

    // Indicador de apuntado: resaltar el submarino más cercano a la línea del cañón
    let subApuntado = null;
    let menorDist = 999;
    subs.forEach(s=>{
        if(s.golpeado) return;
        const dist = Math.abs(s.y - canonY);
        if(dist < menorDist){ menorDist = dist; subApuntado = s; }
    });
    if(subApuntado && !subApuntado.golpeado){
        // Círculo pulsante alrededor del sub apuntado
        const pulso = 4 + Math.sin(tick*0.15)*3;
        ctx.save();
        ctx.strokeStyle='rgba(251,191,36,0.9)';
        ctx.lineWidth=3;
        ctx.setLineDash([8,4]);
        ctx.beginPath();
        ctx.arc(subApuntado.x, subApuntado.y+Math.sin(tick*0.05+subApuntado.fase)*4, 55+pulso, 0, Math.PI*2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Etiqueta encima
        ctx.font='bold 13px Comic Sans MS';
        ctx.fillStyle='#fbbf24';
        ctx.shadowColor='rgba(0,0,0,0.8)'; ctx.shadowBlur=6;
        ctx.textAlign='center';
        ctx.fillText('◀ APUNTANDO', subApuntado.x, subApuntado.y - 40);
        ctx.shadowBlur=0;
        ctx.restore();
    }

    drawBarco();
    if(!gameOver){drawHUD();drawFlash();}
    else{
        drawFinal();
        if(ganado&&tick%3===0)
            boom(Math.random()*W,Math.random()*H*0.5,['#fbbf24','#f87171','#34d399','#a78bfa'][Math.floor(Math.random()*4)],3);
    }
    requestAnimationFrame(loop);
}

// ── REINICIAR ─────────────────────────────────────────────────
function reiniciar(){
    pregIdx=0;aciertos=0;vidas=3;gameOver=false;ganado=false;guardado=false;
    flash='';flashT=0;torpedo=null;particulas=[];canonY=H/2;
    crearSubs();
}

// ── CONTROLES ─────────────────────────────────────────────────
document.addEventListener('keydown',e=>{
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
    if(e.key==='ArrowUp')   canonY=Math.max(80,canonY-10);
    if(e.key==='ArrowDown') canonY=Math.min(H-80,canonY+10);
    if(e.key===' '||e.key==='ArrowRight') disparar();
});
['btnU','btnD','btnFire'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.addEventListener('click',()=>{
        if(id==='btnU') canonY=Math.max(80,canonY-10);
        if(id==='btnD') canonY=Math.min(H-80,canonY+10);
        if(id==='btnFire') disparar();
    });
    el.addEventListener('touchstart',e=>{
        e.preventDefault();
        if(id==='btnU') canonY=Math.max(80,canonY-10);
        if(id==='btnD') canonY=Math.min(H-80,canonY+10);
        if(id==='btnFire') disparar();
    });
});
canvas.addEventListener('click',e=>{
    if(!gameOver) return;
    const r=canvas.getBoundingClientRect();
    const cx=(e.clientX-r.left)*(W/r.width),cy=(e.clientY-r.top)*(H/r.height);
    if(cx>W/2-100&&cx<W/2+100&&cy>H/2+78&&cy<H/2+126) reiniciar();
});
canvas.addEventListener('touchend',e=>{
    if(!gameOver) return;
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

crearSubs();
loop();