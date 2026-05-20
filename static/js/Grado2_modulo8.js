// ============================================================
//  RETOMATE - Grado 2, Módulo 8: El Tiempo y el Calendario
//  Juego: Zorrito pescador en balsa atrapa peces correctos
//  ✅ Flecha abajo para atrapar peces (anzuelo dinámico)
//  ✅ Tecla 'P' para pausar el juego
//  ✅ Letra de pausa estilo Minecraftia
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const P = 4;

window.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))
        e.preventDefault();
}, { passive: false });

let tick = 0;

// ── PREGUNTAS ─────────────────────────────────────────────────
const preguntas = [
    { q:'¿Cuántos días tiene una semana?',       r:'7',      ops:['5','7','8']               },
    { q:'¿Cuántos meses tiene un año?',           r:'12',     ops:['10','12','15']            },
    { q:'¿Qué mes viene después de marzo?',       r:'Abril',  ops:['Mayo','Abril','Febrero']  },
    { q:'¿Cuántos minutos tiene una hora?',       r:'60',     ops:['30','60','100']           },
    { q:'¿Cuántos días tiene febrero?',           r:'28',     ops:['28','30','31']            },
    { q:'¿Qué día viene después del miércoles?',  r:'Jueves', ops:['Martes','Viernes','Jueves']},
    { q:'¿Cuántas horas tiene un día?',           r:'24',     ops:['12','24','48']            },
    { q:'¿Qué mes viene antes de junio?',         r:'Mayo',   ops:['Abril','Mayo','Julio']    },
    { q:'¿Cuántos segundos tiene un minuto?',     r:'60',     ops:['30','60','90']            },
    { q:'¿Cuántos días tiene un año normal?',     r:'365',    ops:['300','365','366']         },
];

// ── ESTADO ────────────────────────────────────────────────────
let pregIdx=0, aciertos=0, vidas=3;
let gameOver=false, ganado=false, guardado=false;
let isPaused=false; 
let flash='', flashT=0;
let pausandoCambio=false;

// ── PARTÍCULAS ────────────────────────────────────────────────
let particulas=[];
function boom(x,y,col,n=18){
    for(let i=0;i<n;i++){
        const a=Math.random()*Math.PI*2, v=1.5+Math.random()*4;
        particulas.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.5,
            vida:1,dec:0.025+Math.random()*0.02,r:3+Math.random()*5,col});
    }
}
function tickP(){
    particulas=particulas.filter(p=>p.vida>0);
    particulas.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;p.vida-=p.dec;p.vx*=0.97;});
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

// ── ZORRITO en balsa — solo se mueve en X ─────────────────────
const zorrito = {
    x: W/2,
    vx: 0,
    speed: 2.2,
    facing: 'right',
    stepT: 0,
    hookL: 0, 
};
const keys={};

// Nivel del agua y la balsa
const AGUA_Y    = H * 0.48;          
const BALSA_Y   = AGUA_Y - 6;        
const ZORRITO_Y = BALSA_Y - 24*P;    

const PEZ_Y_BASE = AGUA_Y + 55;      

// ── PECES CON RESPUESTA ───────────────────────────────────────
let peces=[];
const PEZ_COLS=[
    {cuerpo:'#f97316',aleta:'#ea580c'},
    {cuerpo:'#34d399',aleta:'#059669'},
    {cuerpo:'#a78bfa',aleta:'#7c3aed'},
];

function crearPeces(){
    peces=[];
    if(pregIdx>=preguntas.length) return;
    const p=preguntas[pregIdx];
    const ops=[...p.ops];
    for(let i=ops.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [ops[i],ops[j]]=[ops[j],ops[i]];
    }
    const posX=[150, W/2, W-150];
    const offsetY=[0, 30, 15];
    ops.forEach((val,i)=>{
        peces.push({
            x: posX[i],
            y: PEZ_Y_BASE + offsetY[i],
            r: 36,
            valor: val,
            correcta: val===p.r,
            col: PEZ_COLS[i],
            vx: (Math.random()-0.5)*0.8,
            fase: Math.random()*Math.PI*2,
            tocado: false,
        });
    });
    pausandoCambio=false;
}

// ── DIBUJAR PEZ ───────────────────────────────────────────────
function drawPez(p){
    if(p.tocado) return;
    const fl=Math.sin(tick*0.04+p.fase)*4;
    const x=p.x, y=p.y+fl;

    ctx.save(); ctx.translate(x,y);

    ctx.fillStyle='rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(0,p.r*0.55,p.r*0.7,7,0,0,Math.PI*2); ctx.fill();

    ctx.fillStyle=p.col.aleta;
    ctx.beginPath(); ctx.moveTo(-8,-p.r*0.35); ctx.quadraticCurveTo(0,-p.r*0.85,12,-p.r*0.35); ctx.closePath(); ctx.fill();

    const cg=ctx.createRadialGradient(-p.r*0.2,-p.r*0.2,0,0,0,p.r);
    cg.addColorStop(0,'white'); cg.addColorStop(0.2,p.col.cuerpo); cg.addColorStop(1,p.col.aleta);
    ctx.fillStyle=cg;
    ctx.beginPath(); ctx.ellipse(0,0,p.r,p.r*0.6,0,0,Math.PI*2); ctx.fill();

    ctx.fillStyle=p.col.aleta;
    ctx.beginPath(); ctx.moveTo(-p.r,0); ctx.lineTo(-p.r-16,-12); ctx.lineTo(-p.r-16,12); ctx.closePath(); ctx.fill();

    const eg=ctx.createRadialGradient(p.r*0.42,-4,0,p.r*0.42,-4,7);
    eg.addColorStop(0,'white'); eg.addColorStop(0.5,'#93c5fd'); eg.addColorStop(1,'#1d4ed8');
    ctx.fillStyle=eg; ctx.beginPath(); ctx.arc(p.r*0.42,-4,7,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(p.r*0.48,-4,3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='white'; ctx.beginPath(); ctx.arc(p.r*0.5,-6,1.3,0,Math.PI*2); ctx.fill();

    ctx.font='bold 13px Comic Sans MS';
    ctx.shadowColor='rgba(0,0,0,0.6)'; ctx.shadowBlur=4;
    ctx.fillStyle='white'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(p.valor),0,2);
    ctx.shadowBlur=0;

    ctx.restore();
}

// ── ZORRITO PIXEL ART PESCADOR ────────────────────────────────
function drawZorrito(){
    const balsaOla = Math.sin(tick*0.04)*4;
    const bY_balsa = BALSA_Y + balsaOla;
    const x = zorrito.x;
    const y = bY_balsa - 24*P;         

    const bob=Math.sin(tick*0.04)*2;
    const step=Math.sin(zorrito.stepT*0.28)*2;
    const tailSwing=Math.sin(zorrito.stepT*0.18)*3;

    ctx.save();
    if(zorrito.facing==='left'){ ctx.translate(x+16*P,0); ctx.scale(-1,1); }
    else ctx.translate(x,0);
    const bY=y+bob;

    ctx.fillStyle='#e76f51'; ctx.fillRect(-5*P,bY+12*P+tailSwing,5*P,3*P);
    ctx.fillStyle='#f48c06'; ctx.fillRect(-9*P,bY+10*P+tailSwing,4*P,3*P);
    ctx.fillStyle='#fff';    ctx.fillRect(-11*P,bY+9*P+tailSwing,3*P,2*P);

    ctx.fillStyle='#dc2626'; ctx.fillRect(5*P,bY+8*P,10*P,10*P);
    ctx.fillStyle='rgba(255,255,255,0.3)';
    ctx.fillRect(5*P,bY+8*P,5*P,5*P); ctx.fillRect(10*P,bY+13*P,5*P,5*P);

    ctx.fillStyle='#f48c06'; ctx.fillRect(4*P,bY+1*P,12*P,9*P);
    ctx.fillStyle='#e85d04';
    ctx.fillRect(4*P,bY-1*P,3*P,3*P); ctx.fillRect(13*P,bY-1*P,3*P,3*P);

    ctx.fillStyle='#d97706'; ctx.fillRect(2*P,bY-4*P,16*P,3*P);
    ctx.fillStyle='#f59e0b'; ctx.fillRect(5*P,bY-8*P,10*P,5*P);
    ctx.fillStyle='#92400e'; ctx.fillRect(5*P,bY-5*P,10*P,1*P);

    ctx.fillStyle='#000';
    ctx.fillRect(7*P,bY+4*P,2*P,2*P); ctx.fillRect(13*P,bY+4*P,2*P,2*P);
    ctx.fillRect(9*P,bY+6*P,4*P,1*P);

    ctx.fillStyle='#1e3a8a'; ctx.fillRect(5*P,bY+16*P,10*P,5*P);
    ctx.fillStyle='#1c0a00';
    ctx.fillRect(5*P,bY+21*P+step,4*P,2*P);
    ctx.fillRect(11*P,bY+21*P-step,4*P,2*P);

    ctx.fillStyle='#f48c06';
    ctx.fillRect(2*P,bY+8*P,3*P,5*P);
    ctx.fillRect(15*P,bY+8*P,3*P,5*P);

    ctx.restore();

    const cañaBaseX = zorrito.facing==='right' ? x+17*P : x-1*P;
    const cañaBaseY = y+bob+7*P;
    const dir = zorrito.facing==='right' ? 1 : -1;
    const anzueloX = cañaBaseX + dir*30;
    const anzueloY = bY_balsa + zorrito.hookL;   

    ctx.strokeStyle='#78350f'; ctx.lineWidth=2.5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cañaBaseX, cañaBaseY);
    ctx.lineTo(cañaBaseX+dir*35, cañaBaseY-18); ctx.stroke();

    ctx.strokeStyle='rgba(220,220,220,0.7)'; ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(cañaBaseX+dir*35, cañaBaseY-18);
    ctx.lineTo(anzueloX, anzueloY);
    ctx.stroke();

    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(anzueloX, anzueloY+4, 5, 0, Math.PI); ctx.stroke();

    const balsaX = zorrito.x - 12*P;
    ctx.fillStyle='#92400e';
    ctx.fillRect(balsaX, bY_balsa, 26*P, 4*P);
    ctx.fillStyle='#78350f';
    ctx.fillRect(balsaX+2, bY_balsa+P, 26*P-4, 2*P);
    ctx.strokeStyle='#451a03'; ctx.lineWidth=1;
    for(let li=0;li<5;li++){
        ctx.beginPath(); ctx.moveTo(balsaX+li*20, bY_balsa);
        ctx.lineTo(balsaX+li*20, bY_balsa+4*P); ctx.stroke();
    }

    if(!isPaused) zorrito.stepT++;
}

// ── COLISIÓN: anzuelo toca pez ────────────────────────────────
function checkColisiones(){
    if(gameOver||pausandoCambio||isPaused) return;

    const balsaOla = Math.sin(tick*0.04)*4;
    const bY_balsa = BALSA_Y + balsaOla;
    const dir = zorrito.facing==='right' ? 1 : -1;
    const cañaBaseX = zorrito.facing==='right' ? zorrito.x+17*P : zorrito.x-1*P;
    const anzueloX = cañaBaseX + dir*30;
    const anzueloY = bY_balsa + zorrito.hookL;

    for(let i=0;i<peces.length;i++){
        const p=peces[i];
        if(p.tocado) continue;
        const fl=Math.sin(tick*0.04+p.fase)*4;
        
        const dxA=anzueloX-p.x, dyA=anzueloY-(p.y+fl);
        const tocaAnzuelo=Math.hypot(dxA,dyA)<p.r+12;
        
        if(tocaAnzuelo){
            p.tocado=true;
            boom(p.x,p.y+fl,p.col.cuerpo,20);
            if(p.correcta){
                aciertos++; Sonidos.correcto();
                boom(p.x,p.y+fl,'#fbbf24',15);
                flash='🐟 ¡Correcto!'; flashT=45;
                pregIdx++;
                if(pregIdx>=preguntas.length){
                    gameOver=true; ganado=aciertos>=Math.ceil(preguntas.length*0.6);
                    if(ganado)Sonidos.ganar(); else Sonidos.perder();
                    guardar();
                } else {
                    pausandoCambio=true; zorrito.vx=0;
                    setTimeout(()=>{ zorrito.x=W/2; crearPeces(); },1800);
                }
            } else {
                vidas--; Sonidos.incorrecto();
                boom(p.x,p.y+fl,'#f87171',18);
                flash='¡Ese no es!'; flashT=45;
                if(vidas<=0){ gameOver=true; ganado=false; Sonidos.perder(); guardar(); }
                else {
                    pausandoCambio=true; zorrito.vx=0;
                    setTimeout(()=>{ zorrito.x=W/2; crearPeces(); },1800);
                }
            }
            break;
        }
    }
}

// ── FONDO MAR SUPERFICIE ──────────────────────────────────────
function drawFondo(){
    const sky=ctx.createLinearGradient(0,0,0,AGUA_Y);
    sky.addColorStop(0,'#0c4a6e'); sky.addColorStop(1,'#0ea5e9');
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,AGUA_Y);

    const solG=ctx.createRadialGradient(W-90,60,0,W-90,60,50);
    solG.addColorStop(0,'rgba(255,240,100,0.95)');
    solG.addColorStop(0.5,'rgba(255,200,50,0.7)');
    solG.addColorStop(1,'rgba(255,180,0,0)');
    ctx.fillStyle=solG; ctx.beginPath(); ctx.arc(W-90,60,50,0,Math.PI*2); ctx.fill();

    [[130,48,0.9],[330,32,0.75],[560,55,0.85]].forEach(([cx,cy,a])=>{
        const nx=cx+Math.sin(tick*0.003+cx)*5;
        ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='white';
        ctx.beginPath(); ctx.arc(nx,cy,24,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(nx+26,cy+4,19,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(nx-18,cy+6,15,0,Math.PI*2); ctx.fill();
        ctx.restore();
    });

    const agua=ctx.createLinearGradient(0,AGUA_Y,0,H);
    agua.addColorStop(0,'#0284c7'); agua.addColorStop(0.5,'#0369a1'); agua.addColorStop(1,'#0c4a6e');
    ctx.fillStyle=agua; ctx.fillRect(0,AGUA_Y,W,H-AGUA_Y);

    ctx.strokeStyle='rgba(255,255,255,0.28)'; ctx.lineWidth=2.5;
    for(let o=0;o<3;o++){
        ctx.beginPath();
        for(let x=0;x<W;x+=4){
            const oy=AGUA_Y+10*o+Math.sin((x*0.022)+(tick*0.04)+(o*1.3))*8;
            x===0?ctx.moveTo(x,oy):ctx.lineTo(x,oy);
        }
        ctx.stroke();
    }

    for(let i=0;i<6;i++){
        const bx=(i*130+tick*0.4)%W;
        const by=AGUA_Y+20+(i%3)*25;
        ctx.save(); ctx.globalAlpha=0.1+0.07*Math.sin(tick*0.07+i);
        ctx.fillStyle='#7dd3fc';
        ctx.beginPath(); ctx.arc(bx,by,2.5,0,Math.PI*2); ctx.fill();
        ctx.restore();
    }

    const sg=ctx.createLinearGradient(0,H-65,0,H);
    sg.addColorStop(0,'#d97706'); sg.addColorStop(1,'#92400e');
    ctx.fillStyle=sg; ctx.fillRect(0,H-65,W,65);
    ctx.fillStyle='#f59e0b'; ctx.fillRect(0,H-70,W,5);

    [90,240,430,590,730].forEach((ax,i)=>{
        ctx.strokeStyle=`hsl(${138+i*12},55%,30%)`; ctx.lineWidth=3;
        ctx.beginPath(); ctx.moveTo(ax,H-65);
        ctx.quadraticCurveTo(ax+13*Math.sin(tick*0.04+i),H-100,ax,H-125);
        ctx.stroke();
    });

    for(let i=0;i<6;i++){
        const bx=(i*120+tick*0.3)%W;
        const by=H-30-((tick*0.4+i*40)%(H-AGUA_Y-30));
        ctx.save(); ctx.globalAlpha=0.1+0.06*Math.sin(tick*0.04+i);
        ctx.strokeStyle='#7dd3fc'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(bx,by,2+i%4,0,Math.PI*2); ctx.stroke();
        ctx.restore();
    }
}

// ── HUD ───────────────────────────────────────────────────────
function drawHUD(){
    if(pregIdx>=preguntas.length) return;
    const p=preguntas[pregIdx];
    const hg=ctx.createLinearGradient(20,10,W-20,62);
    hg.addColorStop(0,'rgba(12,74,110,0.95)'); hg.addColorStop(1,'rgba(2,132,199,0.95)');
    ctx.fillStyle=hg; ctx.beginPath(); ctx.roundRect(20,10,W-40,52,12); ctx.fill();
    ctx.strokeStyle='rgba(56,189,248,0.5)'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.font='bold 21px Comic Sans MS';
    ctx.shadowColor='rgba(125,211,252,0.5)'; ctx.shadowBlur=8;
    ctx.fillStyle='#e0f2fe'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(p.q,W/2,36); ctx.shadowBlur=0;
    ctx.font='20px serif'; ctx.textAlign='left';
    for(let i=0;i<vidas;i++) ctx.fillText('❤️',28+i*28,56);
    ctx.font='bold 14px Arial'; ctx.fillStyle='#7dd3fc'; ctx.textAlign='right';
    ctx.fillText(`✅ ${aciertos}/${preguntas.length}`,W-28,56);
    if(pausandoCambio){
        ctx.fillStyle='rgba(251,191,36,0.9)'; ctx.font='bold 15px Comic Sans MS';
        ctx.textAlign='center'; ctx.fillText('🎣 ¡Siguiente pez llegando!',W/2,H-28);
    }
}

// ── FLASH ─────────────────────────────────────────────────────
function drawFlash(){
    if(!flash||flashT<=0) return;
    ctx.globalAlpha=Math.min(1,flashT/20);
    ctx.font='bold 32px Comic Sans MS';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    const ok=flash.includes('Correcto');
    ctx.shadowColor=ok?'rgba(251,191,36,0.8)':'rgba(248,113,113,0.8)'; ctx.shadowBlur=20;
    ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=4;
    ctx.strokeText(flash,W/2,H/2-60);
    ctx.fillStyle=ok?'#fbbf24':'#f87171';
    ctx.fillText(flash,W/2,H/2-60);
    ctx.shadowBlur=0; ctx.globalAlpha=1; 
    
    if (!isPaused) flashT--; 
}

// ── PANTALLA FINAL ────────────────────────────────────────────
function drawFinal(){
    const og=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.7);
    og.addColorStop(0,'rgba(12,74,110,0.88)'); og.addColorStop(1,'rgba(12,74,110,0.96)');
    ctx.fillStyle=og; ctx.fillRect(0,0,W,H);
    ctx.font='bold 36px Comic Sans MS';
    ctx.shadowColor=ganado?'rgba(251,191,36,0.8)':'rgba(248,113,113,0.8)'; ctx.shadowBlur=20;
    ctx.fillStyle=ganado?'#fbbf24':'#f87171';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(ganado?'🎣 ¡Gran pescador!':'🌊 ¡Inténtalo de nuevo!',W/2,H/2-55);
    ctx.shadowBlur=0;
    ctx.font='22px Comic Sans MS'; ctx.fillStyle='white';
    ctx.fillText(`Respuestas correctas: ${aciertos} de ${preguntas.length}`,W/2,H/2+5);
    ctx.fillText(`Puntaje: ${Math.round(aciertos/preguntas.length*100)}%`,W/2,H/2+42);
    const bg=ctx.createLinearGradient(W/2-100,H/2+80,W/2+100,H/2+128);
    bg.addColorStop(0,'#0369a1'); bg.addColorStop(1,'#38bdf8');
    ctx.fillStyle=bg; ctx.shadowColor='rgba(56,189,248,0.5)'; ctx.shadowBlur=15;
    ctx.beginPath(); ctx.roundRect(W/2-100,H/2+80,200,48,12); ctx.fill();
    ctx.shadowBlur=0;
    ctx.font='bold 19px Comic Sans MS'; ctx.fillStyle='white';
    ctx.fillText('▶ Jugar de nuevo',W/2,H/2+104);
}

async function guardar(){
    if(guardado) return; guardado=true;
    try{
        await fetch('/guardar_progreso',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({unidad:208,aciertos,total:preguntas.length,puntaje:Math.round(aciertos/preguntas.length*100)})});
    }catch(e){}
}

// ── LOOP ──────────────────────────────────────────────────────
function loop(){
    if (!isPaused) tick++;

    ctx.clearRect(0,0,W,H);
    drawFondo(); 
    if (!isPaused) tickP(); 
    drawP();

    peces.forEach(p=>{
        if(p.tocado) return;
        if (!isPaused) {
            p.x+=p.vx;
            if(p.x<60||p.x>W-60) p.vx*=-1;
        }
    });

    if(!gameOver && !pausandoCambio && !isPaused){
        if(keys['ArrowRight']||keys['d']){ zorrito.vx=Math.min(zorrito.vx+0.3,zorrito.speed); zorrito.facing='right'; }
        else if(keys['ArrowLeft']||keys['a']){ zorrito.vx=Math.max(zorrito.vx-0.3,-zorrito.speed); zorrito.facing='left'; }
        else zorrito.vx*=0.85;
        zorrito.x=Math.max(12*P, Math.min(W-14*P, zorrito.x+zorrito.vx));
        
        if(keys['ArrowDown']||keys['s']){
            zorrito.hookL = Math.min(zorrito.hookL + 6, 95);
        } else {
            zorrito.hookL = Math.max(zorrito.hookL - 6, 0);
        }

        checkColisiones();
    } else if (pausandoCambio && !isPaused) {
        zorrito.hookL = Math.max(zorrito.hookL - 6, 0);
    }

    peces.forEach(drawPez);
    drawZorrito();

    if(!gameOver){ 
        drawHUD(); 
        drawFlash(); 
    }
    else{
        drawFinal();
        if(ganado && tick%3===0 && !isPaused)
            boom(Math.random()*W,Math.random()*H*0.6,['#fbbf24','#7dd3fc','#34d399','#a78bfa'][Math.floor(Math.random()*4)],3);
    }

    // CARTEL DE PAUSA CON LETRA MINECRAFTIA
    if(isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(0, 0, W, H);
        ctx.font = '35px Minecraftia, monospace'; // <--- TIPO DE LETRA ACTUALIZADO
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 15;
        ctx.fillText('⏸ JUEGO EN PAUSA', W/2, H/2);
        ctx.shadowBlur = 0;
    }

    requestAnimationFrame(loop);
}

// ── REINICIAR ─────────────────────────────────────────────────
function reiniciar(){
    pregIdx=0;aciertos=0;vidas=3;gameOver=false;ganado=false;guardado=false;
    isPaused=false;
    flash='';flashT=0;particulas=[];pausandoCambio=false;
    zorrito.x=W/2; zorrito.vx=0; zorrito.hookL=0;
    crearPeces();
}

// ── CONTROLES ─────────────────────────────────────────────────
document.addEventListener('keydown',e=>{ 
    if (!e.repeat && e.key.toLowerCase() === 'p' && !gameOver) {
        isPaused = !isPaused;
    }
    keys[e.key]=true; 
});
document.addEventListener('keyup',  e=>{ keys[e.key]=false; });

canvas.addEventListener('click',e=>{
    if(!gameOver) return;
    const r=canvas.getBoundingClientRect();
    const cx=(e.clientX-r.left)*(W/r.width),cy=(e.clientY-r.top)*(H/r.height);
    if(cx>W/2-100&&cx<W/2+100&&cy>H/2+80&&cy<H/2+128) reiniciar();
});
canvas.addEventListener('touchend',e=>{
    if(!gameOver) return; e.preventDefault();
    const t=e.changedTouches[0],r=canvas.getBoundingClientRect();
    const cx=(t.clientX-r.left)*(W/r.width),cy=(t.clientY-r.top)*(H/r.height);
    if(cx>W/2-100&&cx<W/2+100&&cy>H/2+80&&cy<H/2+128) reiniciar();
});

[['btnU','ArrowUp'],['btnD','ArrowDown'],['btnL','ArrowLeft'],['btnR','ArrowRight']].forEach(([id,k])=>{
    const el=document.getElementById(id); if(!el) return;
    el.addEventListener('touchstart',e=>{e.preventDefault();keys[k]=true;},{passive:false});
    el.addEventListener('touchend',  e=>{e.preventDefault();keys[k]=false;});
    el.addEventListener('mousedown', ()=>keys[k]=true);
    el.addEventListener('mouseup',   ()=>keys[k]=false);
});

let _au=false;
function _ia(){ if(!_au){ _au=true; Sonidos.iniciar(2); } }
canvas.addEventListener('click',_ia);
canvas.addEventListener('touchstart',_ia,{passive:true});
document.addEventListener('keydown',_ia,{once:true});

zorrito.x=W/2;
crearPeces();
loop();