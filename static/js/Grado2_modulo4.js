// ============================================================
//  RETOMATE - Grado 2, Módulo 4: Decenas y Unidades
//  Juego: Zorrito arqueólogo se mueve y rompe rocas
//         Debe elegir la roca con la descomposición correcta
//  ✅ Sin scroll · Zorrito pixel art P=4
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
// r: texto correcto de descomposición
const preguntas = [
    { q:'¿Cómo se descompone 34?',  r:'3D + 4U',  ops:['3D + 4U','4D + 3U','2D + 4U'] },
    { q:'¿Cómo se descompone 57?',  r:'5D + 7U',  ops:['7D + 5U','5D + 7U','5D + 2U'] },
    { q:'¿Cuántas decenas tiene 82?',r:'8',        ops:['2','8','6']                   },
    { q:'¿Cuántas unidades tiene 65?',r:'5',       ops:['6','5','9']                   },
    { q:'¿Cómo se descompone 43?',  r:'4D + 3U',  ops:['3D + 4U','4D + 3U','4D + 7U'] },
    { q:'¿Qué número es 6D + 9U?',  r:'69',       ops:['96','69','66']                 },
    { q:'¿Cuántas decenas tiene 70?',r:'7',        ops:['0','7','10']                  },
    { q:'¿Cómo se descompone 28?',  r:'2D + 8U',  ops:['8D + 2U','2D + 8U','2D + 6U'] },
    { q:'¿Qué número es 9D + 1U?',  r:'91',       ops:['19','91','90']                 },
    { q:'¿Cuántas unidades tiene 47?',r:'7',       ops:['4','7','11']                  },
];

// ── ESTADO ────────────────────────────────────────────────────
let pregIdx=0, aciertos=0, vidas=3;
let gameOver=false, ganado=false, guardado=false;
let flash='', flashT=0, tick=0;
let excavando=false, excavandoT=0;

// ── PARTÍCULAS ────────────────────────────────────────────────
let particulas=[];
function boom(x,y,col,n=20){
    for(let i=0;i<n;i++){
        const a=Math.random()*Math.PI*2, v=2+Math.random()*5;
        particulas.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-2,
            vida:1,dec:0.022+Math.random()*0.02,r:3+Math.random()*6,col});
    }
}
function tickP(){
    particulas=particulas.filter(p=>p.vida>0);
    particulas.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.12;p.vida-=p.dec;p.vx*=0.96;});
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

// ── ZORRITO ───────────────────────────────────────────────────
const zorrito = {
    x:80, y:H-160,
    vx:0, vy:0,
    speed:3.5,
    facing:'right',
    stepT:0,
    grounded:true,
};
const keys={};
const gravity=0.5, jumpPower=10;

// ── ROCAS ─────────────────────────────────────────────────────
let rocas=[];
const ROCAS_Y = H-130;

const ROCA_COLS = [
    {base:'#78716c',light:'#a8a29e',dark:'#44403c',crack:'#1c1917'},
    {base:'#6b7280',light:'#9ca3af',dark:'#374151',crack:'#111827'},
    {base:'#7c5f44',light:'#a87d5a',dark:'#4a3020',crack:'#1c0a00'},
];

function crearRocas(){
    rocas=[];
    if(pregIdx>=preguntas.length) return;
    const p=preguntas[pregIdx];
    const ops=[...p.ops];
    for(let i=ops.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [ops[i],ops[j]]=[ops[j],ops[i]];
    }
    const posX=[180,400,620];
    ops.forEach((val,i)=>{
        rocas.push({
            x:posX[i], y:ROCAS_Y,
            w:110, h:90,
            valor:val,
            correcta:val===p.r,
            col:ROCA_COLS[i%ROCA_COLS.length],
            rota:false,
            rotaT:0,
            grietas:Math.floor(Math.random()*3),
            fase:Math.random()*Math.PI*2,
        });
    });
}

// ── DIBUJAR ROCA ──────────────────────────────────────────────
function drawRoca(r){
    if(r.rota) return;
    const x=r.x-r.w/2, y=r.y-r.h;
    const pulso = Math.sin(tick*0.08+r.fase)*2;

    ctx.save();

    // Sombra
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(r.x, r.y+4, r.w/2+8, 12, 0, 0, Math.PI*2);
    ctx.fill();

    // Cuerpo roca con gradiente
    const g=ctx.createRadialGradient(r.x-r.w*0.2,y+r.h*0.3,0,r.x,y+r.h/2,r.w*0.7);
    g.addColorStop(0,r.col.light);
    g.addColorStop(0.5,r.col.base);
    g.addColorStop(1,r.col.dark);
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.moveTo(x+10+pulso,    y+r.h*0.4);
    ctx.lineTo(x+r.w*0.2,    y+8);
    ctx.lineTo(x+r.w*0.5,    y+2);
    ctx.lineTo(x+r.w*0.8,    y+10);
    ctx.lineTo(x+r.w-8-pulso,y+r.h*0.35);
    ctx.lineTo(x+r.w-4,      y+r.h*0.7);
    ctx.lineTo(x+r.w*0.75,   y+r.h);
    ctx.lineTo(x+r.w*0.25,   y+r.h);
    ctx.lineTo(x+4,           y+r.h*0.7);
    ctx.closePath();
    ctx.fill();

    // Grietas decorativas
    ctx.strokeStyle=r.col.crack; ctx.lineWidth=1.5;
    if(r.grietas>=1){
        ctx.beginPath(); ctx.moveTo(r.x-10,y+20); ctx.lineTo(r.x-20,y+40); ctx.stroke();
    }
    if(r.grietas>=2){
        ctx.beginPath(); ctx.moveTo(r.x+15,y+15); ctx.lineTo(r.x+25,y+35); ctx.lineTo(r.x+15,y+50); ctx.stroke();
    }
    if(r.grietas>=3){
        ctx.beginPath(); ctx.moveTo(r.x-5,y+50); ctx.lineTo(r.x+10,y+65); ctx.stroke();
    }

    // Brillo
    ctx.fillStyle='rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.ellipse(r.x-r.w*0.18, y+r.h*0.25, r.w*0.18, r.h*0.12, -0.4, 0, Math.PI*2);
    ctx.fill();

    // Texto respuesta
    ctx.font='bold 16px Comic Sans MS';
    ctx.shadowColor='rgba(0,0,0,0.8)'; ctx.shadowBlur=5;
    ctx.fillStyle='#fef3c7';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(r.valor), r.x, y+r.h/2+2);
    ctx.shadowBlur=0;

    // Indicador de proximidad
    const dx=Math.abs(zorrito.x+8*P-r.x);
    const dy=Math.abs(zorrito.y+12*P-r.y);
    if(dx<80&&dy<60){
        const pulse=0.5+0.5*Math.sin(tick*0.15);
        ctx.strokeStyle=`rgba(251,191,36,${pulse})`;
        ctx.lineWidth=3;
        ctx.setLineDash([6,4]);
        ctx.beginPath();
        ctx.moveTo(x-4,y-4);
        ctx.lineTo(x+r.w+4,y-4);
        ctx.lineTo(x+r.w+4,y+r.h+4);
        ctx.lineTo(x-4,y+r.h+4);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font='bold 12px Comic Sans MS';
        ctx.fillStyle='#fbbf24';
        ctx.shadowColor='rgba(0,0,0,0.8)'; ctx.shadowBlur=4;
        ctx.fillText('⛏️ ESPACIO',r.x,y-16);
        ctx.shadowBlur=0;
    }

    ctx.restore();
}

// ── DIBUJAR ZORRITO ARQUEÓLOGO PIXEL ART (P=4) ───────────────
function drawZorrito(){
    const x=zorrito.x, y=zorrito.y;
    const bob=zorrito.grounded?Math.sin(tick*0.08)*1.5:0;
    const step=Math.sin(zorrito.stepT*0.28)*3;
    const tailSwing=Math.sin(zorrito.stepT*0.18)*3;
    const excAnim=excavando?Math.sin(tick*0.4)*8:0;

    ctx.save();
    if(zorrito.facing==='left'){
        ctx.translate(x+16*P,0); ctx.scale(-1,1);
    } else {
        ctx.translate(x,0);
    }
    const baseY=y+bob;

    // Cola
    ctx.fillStyle='#e76f51';
    ctx.fillRect(-6*P, baseY+12*P+tailSwing, 6*P, 3*P);
    ctx.fillStyle='#f48c06';
    ctx.fillRect(-10*P, baseY+10*P+tailSwing, 4*P, 3*P);
    ctx.fillStyle='#fff';
    ctx.fillRect(-12*P, baseY+9*P+tailSwing, 3*P, 2*P);

    // Cuerpo (ropa arqueólogo — caqui)
    ctx.fillStyle='#b45309';
    ctx.fillRect(5*P, baseY+8*P, 10*P, 10*P);
    // Bolsillo
    ctx.fillStyle='#92400e';
    ctx.fillRect(6*P, baseY+10*P, 4*P, 3*P);

    // Cabeza
    ctx.fillStyle='#f48c06';
    ctx.fillRect(4*P, baseY+1*P, 12*P, 9*P);
    // Orejas
    ctx.fillStyle='#e85d04';
    ctx.fillRect(4*P, baseY-1*P, 3*P, 3*P);
    ctx.fillRect(13*P, baseY-1*P, 3*P, 3*P);

    // Sombrero arqueólogo (ala ancha)
    ctx.fillStyle='#78350f';
    ctx.fillRect(1*P, baseY-3*P, 18*P, 3*P); // ala
    ctx.fillStyle='#92400e';
    ctx.fillRect(4*P, baseY-7*P, 12*P, 5*P); // copa
    // Cinta sombrero
    ctx.fillStyle='#fbbf24';
    ctx.fillRect(4*P, baseY-4*P, 12*P, 1*P);

    // Ojos
    ctx.fillStyle='#000';
    ctx.fillRect(7*P, baseY+4*P, 2*P, 2*P);
    ctx.fillRect(13*P, baseY+4*P, 2*P, 2*P);
    ctx.fillRect(9*P, baseY+6*P, 4*P, 1*P);

    // Pantalón
    ctx.fillStyle='#92400e';
    ctx.fillRect(5*P, baseY+16*P, 10*P, 5*P);
    // Botas
    ctx.fillStyle='#1c0a00';
    ctx.fillRect(5*P, baseY+21*P+step, 4*P, 2*P);
    ctx.fillRect(11*P, baseY+21*P-step, 4*P, 2*P);

    // Brazo con pico (animado al excavar)
    ctx.fillStyle='#f48c06';
    ctx.fillRect(2*P, baseY+8*P, 3*P, 5*P);
    ctx.fillRect(15*P, baseY+8*P, 3*P, 5*P);

    // Pico de excavar
    const picoY=baseY+4*P+excAnim;
    ctx.fillStyle='#78350f'; // mango
    ctx.fillRect(16*P, picoY, 2*P, 8*P);
    ctx.fillStyle='#9ca3af'; // metal
    ctx.fillRect(14*P, picoY-2*P, 6*P, 3*P);
    ctx.fillRect(13*P, picoY-3*P, 2*P, 2*P);
    ctx.fillRect(19*P, picoY-3*P, 2*P, 2*P);

    ctx.restore();
    zorrito.stepT++;
}

// ── FONDO CUEVA/EXCAVACIÓN ────────────────────────────────────
function drawFondo(){
    // Fondo tierra oscura con gradiente
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#1c0a00');
    g.addColorStop(0.4,'#2d1400');
    g.addColorStop(1,'#0f0700');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    // Textura tierra — motas
    ctx.fillStyle='rgba(92,45,5,0.3)';
    for(let i=0;i<30;i++){
        const tx=(i*137.5)%W, ty=(i*97.3)%(H-100);
        ctx.beginPath(); ctx.arc(tx,ty,3+i%8,0,Math.PI*2); ctx.fill();
    }

    // Antorchas en las paredes
    [[60,200],[W-80,200],[60,380],[W-80,380]].forEach(([ax,ay])=>{
        // Palo
        ctx.fillStyle='#78350f';
        ctx.fillRect(ax-3,ay,6,28);
        // Soporte
        ctx.fillStyle='#92400e';
        ctx.fillRect(ax-8,ay+25,16,5);
        // Llama animada
        const flicker=Math.sin(tick*0.2+ax)*4;
        const fg=ctx.createRadialGradient(ax,ay,0,ax,ay,18+flicker);
        fg.addColorStop(0,'rgba(255,220,50,0.9)');
        fg.addColorStop(0.4,'rgba(255,120,0,0.7)');
        fg.addColorStop(1,'rgba(255,50,0,0)');
        ctx.fillStyle=fg;
        ctx.beginPath(); ctx.ellipse(ax,ay-5,8,16+flicker,0,0,Math.PI*2); ctx.fill();
        // Resplandor en pared
        const wg=ctx.createRadialGradient(ax,ay,0,ax,ay,80);
        wg.addColorStop(0,`rgba(255,150,0,0.08)`);
        wg.addColorStop(1,'transparent');
        ctx.fillStyle=wg;
        ctx.beginPath(); ctx.arc(ax,ay,80,0,Math.PI*2); ctx.fill();
    });

    // Vetas de mineral en paredes
    ctx.strokeStyle='rgba(251,191,36,0.15)'; ctx.lineWidth=2;
    [[20,150,100,280],[W-30,120,W-120,300],[50,350,180,420],[W-60,300,W-200,430]].forEach(([x1,y1,x2,y2])=>{
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    });
    ctx.strokeStyle='rgba(148,163,184,0.1)';
    [[30,80,150,180],[W-40,90,W-180,200]].forEach(([x1,y1,x2,y2])=>{
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    });

    // Suelo con gradiente
    const sg=ctx.createLinearGradient(0,H-100,0,H);
    sg.addColorStop(0,'#451a03'); sg.addColorStop(1,'#1c0a00');
    ctx.fillStyle=sg; ctx.fillRect(0,H-100,W,100);
    ctx.fillStyle='#78350f';
    ctx.fillRect(0,H-104,W,6);

    // Piedras decorativas en suelo
    [100,260,480,640,760].forEach((sx,i)=>{
        ctx.fillStyle=ROCA_COLS[i%3].base;
        ctx.beginPath(); ctx.ellipse(sx,H-90,15+i%10,8,0,0,Math.PI*2); ctx.fill();
    });

    // Partículas de polvo flotante
    for(let i=0;i<5;i++){
        const px=(i*200+tick*0.2)%W;
        const py=100+(i*80+tick*0.3)%(H-200);
        ctx.save(); ctx.globalAlpha=0.06+0.04*Math.sin(tick*0.03+i);
        ctx.fillStyle='#d97706';
        ctx.beginPath(); ctx.arc(px,py,2+i%4,0,Math.PI*2); ctx.fill();
        ctx.restore();
    }
}

// ── HUD ───────────────────────────────────────────────────────
function drawHUD(){
    if(pregIdx>=preguntas.length) return;
    const p=preguntas[pregIdx];
    const hg=ctx.createLinearGradient(20,10,W-20,62);
    hg.addColorStop(0,'rgba(28,10,0,0.95)'); hg.addColorStop(1,'rgba(61,26,0,0.95)');
    ctx.fillStyle=hg; ctx.beginPath(); ctx.roundRect(20,10,W-40,52,12); ctx.fill();
    ctx.strokeStyle='rgba(245,158,11,0.5)'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.font='bold 22px Comic Sans MS';
    ctx.shadowColor='rgba(252,211,77,0.5)'; ctx.shadowBlur=8;
    ctx.fillStyle='#fcd34d'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(p.q,W/2,36); ctx.shadowBlur=0;
    ctx.font='20px serif'; ctx.textAlign='left';
    for(let i=0;i<vidas;i++) ctx.fillText('❤️',28+i*28,56);
    ctx.font='bold 14px Arial'; ctx.fillStyle='#fcd34d'; ctx.textAlign='right';
    ctx.fillText(`✅ ${aciertos}/${preguntas.length}`,W-28,56);
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
    ctx.shadowColor=ganado?'rgba(251,191,36,0.8)':'rgba(248,113,113,0.8)';
    ctx.shadowBlur=20;
    ctx.fillStyle=ganado?'#fbbf24':'#f87171';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(ganado?'⛏️ ¡Gran excavación!':'🪨 ¡Inténtalo de nuevo!',W/2,H/2-55);
    ctx.shadowBlur=0;
    ctx.font='22px Comic Sans MS'; ctx.fillStyle='white';
    ctx.fillText(`Respuestas correctas: ${aciertos} de ${preguntas.length}`,W/2,H/2);
    ctx.fillText(`Puntaje: ${Math.round(aciertos/preguntas.length*100)}%`,W/2,H/2+38);
    const bg=ctx.createLinearGradient(W/2-100,H/2+78,W/2+100,H/2+126);
    bg.addColorStop(0,'#92400e'); bg.addColorStop(1,'#f59e0b');
    ctx.fillStyle=bg; ctx.shadowColor='rgba(245,158,11,0.5)'; ctx.shadowBlur=15;
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
        body:JSON.stringify({unidad:204,aciertos,total:preguntas.length,puntaje:Math.round(aciertos/preguntas.length*100)})});
    }catch(e){}
}

// ── EXCAVAR ───────────────────────────────────────────────────
function excavar(){
    if(gameOver) return;
    let rocaGolpeada=null;
    for(let i=0;i<rocas.length;i++){
        const r=rocas[i];
        if(r.rota) continue;
        const dx=Math.abs(zorrito.x+8*P-r.x);
        const dy=Math.abs(zorrito.y+12*P-r.y);
        if(dx<85&&dy<70){ rocaGolpeada=r; break; }
    }
    if(!rocaGolpeada) return;

    excavando=true; excavandoT=20;
    const rx=rocaGolpeada.x, ry=rocaGolpeada.y;
    rocaGolpeada.rota=true;

    // Partículas de rotura
    boom(rx,ry,'#9ca3af',20);
    boom(rx,ry,'#78716c',15);
    boom(rx,ry,'rgba(251,191,36,0.8)',8);

    if(rocaGolpeada.correcta){
        aciertos++; Sonidos.correcto();
        boom(rx,ry,'#fbbf24',20);
        flash='⛏️ ¡Correcto!'; flashT=45;
        pregIdx++;
        if(pregIdx>=preguntas.length){
            gameOver=true; ganado=aciertos>=Math.ceil(preguntas.length*0.6);
            if(ganado)Sonidos.ganar(); else Sonidos.perder();
            guardar();
        } else setTimeout(()=>crearRocas(),600);
    } else {
        vidas--; Sonidos.incorrecto();
        boom(rx,ry,'#f87171',20);
        flash='¡Esa no es!'; flashT=45;
        if(vidas<=0){gameOver=true;ganado=false;Sonidos.perder();guardar();}
        else setTimeout(()=>crearRocas(),600);
    }
}

// ── LOOP ──────────────────────────────────────────────────────
function loop(){
    tick++;
    ctx.clearRect(0,0,W,H);
    drawFondo();
    tickP(); drawP();

    // Física zorrito
    if(!gameOver){
        let moveX=0;
        if(keys['ArrowRight']){ moveX=zorrito.speed; zorrito.facing='right'; }
        else if(keys['ArrowLeft']){ moveX=-zorrito.speed; zorrito.facing='left'; }

        zorrito.vx=moveX;
        zorrito.vy+=gravity;
        zorrito.x=Math.max(0,Math.min(W-16*P,zorrito.x+zorrito.vx));
        zorrito.y+=zorrito.vy;

        // Suelo
        const suelo=H-104-24*P;
        if(zorrito.y>=suelo){
            zorrito.y=suelo; zorrito.vy=0; zorrito.grounded=true;
        } else zorrito.grounded=false;

        // Salto
        if((keys['ArrowUp']||keys['w']||keys['W'])&&zorrito.grounded){
            zorrito.vy=-jumpPower; zorrito.grounded=false;
        }

        if(excavandoT>0) excavandoT--;
        else excavando=false;
    }

    rocas.forEach(drawRoca);
    drawZorrito();

    if(!gameOver){ drawHUD(); drawFlash(); }
    else{
        drawFinal();
        if(ganado&&tick%3===0)
            boom(Math.random()*W,Math.random()*H*0.6,['#fbbf24','#f87171','#34d399','#a78bfa'][Math.floor(Math.random()*4)],3);
    }
    requestAnimationFrame(loop);
}

// ── REINICIAR ─────────────────────────────────────────────────
function reiniciar(){
    pregIdx=0;aciertos=0;vidas=3;gameOver=false;ganado=false;guardado=false;
    flash='';flashT=0;particulas=[];excavando=false;excavandoT=0;
    zorrito.x=80;zorrito.y=H-200;zorrito.vx=0;zorrito.vy=0;zorrito.grounded=true;
    crearRocas();
}

// ── CONTROLES ─────────────────────────────────────────────────
document.addEventListener('keydown',e=>{ keys[e.key]=true; if(e.key===' ') excavar(); });
document.addEventListener('keyup',  e=>{ keys[e.key]=false; });

[['btnU','ArrowUp'],['btnD','ArrowDown'],['btnL','ArrowLeft'],['btnR','ArrowRight']].forEach(([id,k])=>{
    const el=document.getElementById(id); if(!el) return;
    el.addEventListener('touchstart',e=>{e.preventDefault();keys[k]=true;},{passive:false});
    el.addEventListener('touchend',  e=>{e.preventDefault();keys[k]=false;});
    el.addEventListener('mousedown', ()=>keys[k]=true);
    el.addEventListener('mouseup',   ()=>keys[k]=false);
});
document.getElementById('btnAct').addEventListener('click', excavar);
document.getElementById('btnAct').addEventListener('touchstart',e=>{e.preventDefault();excavar();},{passive:false});

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

crearRocas();
loop();