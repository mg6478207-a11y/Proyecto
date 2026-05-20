// ============================================================
//  RETOMATE - Grado 2, Módulo 3: Tablas del 2 y 5
//  Juego: Zorrito submarinista recoge perlas con respuestas
//         correctas de las tablas del 2 y del 5
//  ✅ Sin scroll de página · Zorrito pixel art P=4
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const P = 4; // tamaño pixel zorrito

// ── BLOQUEAR SCROLL DE PÁGINA ────────────────────────────────
window.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))
        e.preventDefault();
}, { passive: false });

// ── PREGUNTAS ────────────────────────────────────────────────
const preguntas = [
    { q:'2 × 3 = ?',  r:6,  ops:[4,6,8]    },
    { q:'5 × 4 = ?',  r:20, ops:[15,20,25]  },
    { q:'2 × 7 = ?',  r:14, ops:[12,14,16]  },
    { q:'5 × 6 = ?',  r:30, ops:[25,30,35]  },
    { q:'2 × 9 = ?',  r:18, ops:[14,16,18]  },
    { q:'5 × 8 = ?',  r:40, ops:[35,40,45]  },
    { q:'2 × 6 = ?',  r:12, ops:[10,12,14]  },
    { q:'5 × 3 = ?',  r:15, ops:[10,15,20]  },
    { q:'2 × 8 = ?',  r:16, ops:[14,16,18]  },
    { q:'5 × 9 = ?',  r:45, ops:[40,45,50]  },
];

// ── ESTADO ───────────────────────────────────────────────────
let pregIdx=0, aciertos=0, vidas=3;
let gameOver=false, ganado=false, guardado=false;
let flash='', flashT=0, tick=0;

// ── PARTÍCULAS ────────────────────────────────────────────────
let particulas=[];
function boom(x,y,col,n=20){
    for(let i=0;i<n;i++){
        const a=Math.random()*Math.PI*2,v=1.5+Math.random()*4;
        particulas.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,
            vida:1,dec:0.022+Math.random()*0.018,r:3+Math.random()*5,col});
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

// ── ZORRITO ───────────────────────────────────────────────────
const zorrito = {
    x: 80, y: H/2,
    vx:0, vy:0,
    speed: 3.5,
    facing: 'right',
    stepT: 0,
};
const keys = {};

// ── PERLAS ────────────────────────────────────────────────────
let perlas=[];
const PERLA_COLS = [
    {base:'#f0abfc',shine:'#fae8ff',borde:'#a21caf'},
    {base:'#67e8f9',shine:'#cffafe',borde:'#0891b2'},
    {base:'#86efac',shine:'#dcfce7',borde:'#15803d'},
    {base:'#fda4af',shine:'#ffe4e6',borde:'#be123c'},
];

function crearPerlas(){
    perlas=[];
    if(pregIdx>=preguntas.length) return;
    const p=preguntas[pregIdx];
    const ops=[...p.ops];
    // Mezclar
    for(let i=ops.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ops[i],ops[j]]=[ops[j],ops[i]];}
    // Distribuir en posiciones distintas
    const posY=[130,250,370];
    ops.forEach((val,i)=>{
        const col=PERLA_COLS[i%PERLA_COLS.length];
        perlas.push({
            x:W-80-i*20,
            y:posY[i],
            r:32,
            valor:val,
            correcta:val===p.r,
            col,
            fase:Math.random()*Math.PI*2,
            recogida:false,
            brilloT:0,
        });
    });
}

// ── DIBUJAR PERLA ─────────────────────────────────────────────
function drawPerla(p){
    if(p.recogida) return;
    const fl=Math.sin(tick*0.04+p.fase)*5;
    const x=p.x, y=p.y+fl;

    ctx.save();
    // Resplandor exterior
    const og=ctx.createRadialGradient(x,y,0,x,y,p.r+14);
    og.addColorStop(0,`rgba(255,255,255,0.15)`);
    og.addColorStop(1,'transparent');
    ctx.fillStyle=og; ctx.beginPath(); ctx.arc(x,y,p.r+14,0,Math.PI*2); ctx.fill();

    // Sombra
    ctx.fillStyle='rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(x,y+p.r+6,p.r*0.7,8,0,0,Math.PI*2); ctx.fill();

    // Cuerpo perla con gradiente
    const g=ctx.createRadialGradient(x-p.r*0.3,y-p.r*0.3,0,x,y,p.r);
    g.addColorStop(0,'white');
    g.addColorStop(0.3,p.col.shine);
    g.addColorStop(0.7,p.col.base);
    g.addColorStop(1,p.col.borde);
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.arc(x,y,p.r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=p.col.borde; ctx.lineWidth=2; ctx.stroke();

    // Brillos
    ctx.fillStyle='rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.ellipse(x-p.r*0.3,y-p.r*0.3,p.r*0.22,p.r*0.14,-0.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.ellipse(x-p.r*0.1,y-p.r*0.5,p.r*0.1,p.r*0.06,-0.3,0,Math.PI*2); ctx.fill();

    // Número
    ctx.font=`bold ${p.r>28?20:16}px Comic Sans MS`;
    ctx.shadowColor='rgba(0,0,0,0.5)'; ctx.shadowBlur=4;
    ctx.fillStyle='#1e293b'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(p.valor),x,y+1);
    ctx.shadowBlur=0;

    ctx.restore();
}

// ── DIBUJAR ZORRITO PIXEL ART (P=4, estilo grado 6) ──────────
function drawZorrito(){
    const x=zorrito.x, y=zorrito.y;
    const bob=Math.sin(tick*0.06)*2;
    const step=Math.sin(zorrito.stepT*0.25)*2;
    const tailSwing=Math.sin(zorrito.stepT*0.18)*3;
    const bx = zorrito.facing==='right' ? x : x;

    ctx.save();
    if(zorrito.facing==='left'){
        ctx.translate(x+16*P,0); ctx.scale(-1,1);
    } else {
        ctx.translate(x,0);
    }

    const baseY = y+bob;

    // Burbujas del traje
    if(tick%12===0){boom(bx+(zorrito.facing==='right'?16*P:0),y-8,'rgba(186,230,253,0.8)',2);}

    // Cola
    ctx.fillStyle='#e76f51';
    ctx.fillRect(0-6*P, baseY+12*P+tailSwing, 6*P, 3*P);
    ctx.fillStyle='#f48c06';
    ctx.fillRect(0-10*P, baseY+10*P+tailSwing, 4*P, 3*P);
    ctx.fillStyle='#fff';
    ctx.fillRect(0-12*P, baseY+9*P+tailSwing, 3*P, 2*P);

    // Traje buzo (cuerpo)
    const tg=ctx.createLinearGradient(0,baseY+7*P,20*P,baseY+7*P);
    tg.addColorStop(0,'#1d4ed8'); tg.addColorStop(0.5,'#3b82f6'); tg.addColorStop(1,'#1d4ed8');
    ctx.fillStyle=tg;
    ctx.fillRect(0+5*P, baseY+8*P, 10*P, 10*P);

    // Cabeza con traje
    ctx.fillStyle='#f48c06';
    ctx.fillRect(0+4*P, baseY+1*P, 12*P, 9*P);

    // Orejas
    ctx.fillStyle='#e85d04';
    ctx.fillRect(0+4*P, baseY-1*P, 3*P, 3*P);
    ctx.fillRect(0+13*P, baseY-1*P, 3*P, 3*P);

    // Máscara de buceo
    const mg=ctx.createLinearGradient(0+3*P,baseY+2*P,0+17*P,baseY+8*P);
    mg.addColorStop(0,'rgba(186,230,253,0.85)');
    mg.addColorStop(1,'rgba(14,165,233,0.5)');
    ctx.fillStyle=mg;
    ctx.fillRect(0+3*P, baseY+2*P, 14*P, 7*P);
    ctx.strokeStyle='#0369a1'; ctx.lineWidth=2;
    ctx.strokeRect(0+3*P, baseY+2*P, 14*P, 7*P);
    // Reflejo máscara
    ctx.fillStyle='rgba(255,255,255,0.4)';
    ctx.fillRect(0+4*P, baseY+3*P, 5*P, 2*P);

    // Ojos dentro de máscara
    ctx.fillStyle='#000';
    ctx.fillRect(0+6*P, baseY+4*P, 2*P, 2*P);
    ctx.fillRect(0+12*P, baseY+4*P, 2*P, 2*P);
    ctx.fillRect(0+9*P, baseY+6*P, 4*P, 1*P); // nariz

    // Pantalón
    ctx.fillStyle='#264653';
    ctx.fillRect(0+5*P, baseY+16*P, 10*P, 5*P);
    // Aletas
    ctx.fillStyle='#0ea5e9';
    ctx.fillRect(0+3*P, baseY+21*P+step, 5*P, 3*P);
    ctx.fillRect(0+10*P, baseY+21*P-step, 6*P, 3*P);

    // Brazos
    ctx.fillStyle='#1d4ed8';
    ctx.fillRect(0+2*P, baseY+8*P, 3*P, 6*P);
    ctx.fillRect(0+15*P, baseY+8*P, 3*P, 6*P);

    // Tanque de oxígeno
    const tank=ctx.createLinearGradient(0+16*P,baseY+8*P,0+18*P,baseY+8*P);
    tank.addColorStop(0,'#94a3b8'); tank.addColorStop(0.5,'#e2e8f0'); tank.addColorStop(1,'#64748b');
    ctx.fillStyle=tank;
    ctx.fillRect(0+16*P, baseY+8*P, 3*P, 9*P);
    ctx.strokeStyle='#475569'; ctx.lineWidth=1;
    ctx.strokeRect(0+16*P, baseY+8*P, 3*P, 9*P);

    ctx.restore();
    zorrito.stepT++;
}

// ── FONDO OCEÁNICO ────────────────────────────────────────────
function drawFondo(){
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#0c4a6e'); g.addColorStop(0.4,'#075985'); g.addColorStop(1,'#0c2444');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    // Rayos de luz
    ctx.save();
    for(let i=0;i<5;i++){
        const lx=80+i*160;
        const alpha=0.04+0.025*Math.sin(tick*0.02+i);
        const lg=ctx.createLinearGradient(lx,0,lx+25,H*0.65);
        lg.addColorStop(0,`rgba(125,211,252,${alpha*2})`);
        lg.addColorStop(1,'transparent');
        ctx.fillStyle=lg;
        ctx.beginPath();
        ctx.moveTo(lx-20,0); ctx.lineTo(lx+45,H*0.65);
        ctx.lineTo(lx+15,H*0.65); ctx.lineTo(lx-50,0);
        ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // Burbujas decorativas
    for(let i=0;i<8;i++){
        const bx=(i*97+tick*0.35)%W;
        const by=H-((tick*0.55+i*55)%(H+20));
        ctx.save(); ctx.globalAlpha=0.1+0.08*Math.sin(tick*0.04+i);
        ctx.strokeStyle='#bae6fd'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(bx,by,3+i%5,0,Math.PI*2); ctx.stroke();
        ctx.restore();
    }

    // Arena
    const sg=ctx.createLinearGradient(0,H-55,0,H);
    sg.addColorStop(0,'#d97706'); sg.addColorStop(1,'#92400e');
    ctx.fillStyle=sg; ctx.fillRect(0,H-55,W,55);
    ctx.strokeStyle='rgba(251,191,36,0.2)'; ctx.lineWidth=2;
    for(let i=0;i<4;i++){
        const wy=H-44+i*10;
        ctx.beginPath();
        for(let x=0;x<W;x+=50) ctx.quadraticCurveTo(x+25,wy-4,x+50,wy);
        ctx.stroke();
    }

    // Corales
    [[80,'#f87171','#fca5a5'],[280,'#a78bfa','#c4b5fd'],
     [500,'#34d399','#6ee7b7'],[700,'#fb923c','#fdba74']].forEach(([ax,c1,c2])=>{
        ctx.save(); ctx.translate(ax,H-55);
        const cg=ctx.createLinearGradient(0,-48,0,0);
        cg.addColorStop(0,c2); cg.addColorStop(1,c1);
        ctx.strokeStyle=cg; ctx.lineWidth=5; ctx.lineCap='round';
        const sw=Math.sin(tick*0.025)*3;
        for(let i=-2;i<=2;i++){
            ctx.beginPath(); ctx.moveTo(i*12,0);
            ctx.quadraticCurveTo(i*12+sw,-20,i*9+sw*0.7,-42); ctx.stroke();
            ctx.fillStyle=c2; ctx.beginPath(); ctx.arc(i*9+sw*0.7,-43,6,0,Math.PI*2); ctx.fill();
        }
        ctx.restore();
    });

    // Algas
    [140,340,460,620].forEach((ax,i)=>{
        ctx.save(); ctx.translate(ax,H-55);
        const ag=ctx.createLinearGradient(0,-70,0,0);
        ag.addColorStop(0,'#4ade80'); ag.addColorStop(1,'#15803d');
        ctx.strokeStyle=ag; ctx.lineWidth=3; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(0,0);
        for(let j=0;j<5;j++){const sw=Math.sin(tick*0.03+i+j)*10;ctx.quadraticCurveTo(sw,-12-j*12,0,-18-j*14);}
        ctx.stroke(); ctx.restore();
    });
}

// ── HUD ───────────────────────────────────────────────────────
function drawHUD(){
    if(pregIdx>=preguntas.length) return;
    const p=preguntas[pregIdx];
    const hg=ctx.createLinearGradient(20,10,W-20,62);
    hg.addColorStop(0,'rgba(12,74,110,0.95)'); hg.addColorStop(1,'rgba(3,105,161,0.95)');
    ctx.fillStyle=hg; ctx.beginPath(); ctx.roundRect(20,10,W-40,52,12); ctx.fill();
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
    og.addColorStop(0,'rgba(0,0,0,0.75)'); og.addColorStop(1,'rgba(0,0,0,0.88)');
    ctx.fillStyle=og; ctx.fillRect(0,0,W,H);
    ctx.font='bold 40px Comic Sans MS';
    ctx.shadowColor=ganado?'rgba(251,191,36,0.8)':'rgba(248,113,113,0.8)'; ctx.shadowBlur=20;
    ctx.fillStyle=ganado?'#fbbf24':'#f87171';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(ganado?'🐚 ¡Perlas recogidas!':'🌊 ¡Inténtalo de nuevo!',W/2,H/2-55);
    ctx.shadowBlur=0;
    ctx.font='22px Comic Sans MS'; ctx.fillStyle='white';
    ctx.fillText(`Respuestas correctas: ${aciertos} de ${preguntas.length}`,W/2,H/2);
    ctx.fillText(`Puntaje: ${Math.round(aciertos/preguntas.length*100)}%`,W/2,H/2+38);
    const bg=ctx.createLinearGradient(W/2-100,H/2+78,W/2+100,H/2+126);
    bg.addColorStop(0,'#0369a1'); bg.addColorStop(1,'#0ea5e9');
    ctx.fillStyle=bg; ctx.shadowColor='rgba(14,165,233,0.5)'; ctx.shadowBlur=15;
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
        body:JSON.stringify({unidad:203,aciertos,total:preguntas.length,puntaje:Math.round(aciertos/preguntas.length*100)})});
    }catch(e){}
}

// ── COLISIÓN ZORRITO-PERLA ────────────────────────────────────
function checkColisiones(){
    if(gameOver) return;
    perlas.forEach(p=>{
        if(p.recogida) return;
        const fl=Math.sin(tick*0.04+p.fase)*5;
        const dx=(zorrito.x+8*P)-p.x;
        const dy=(zorrito.y+12*P)-(p.y+fl);
        if(Math.hypot(dx,dy)<p.r+20){
            p.recogida=true;
            if(p.correcta){
                aciertos++; Sonidos.correcto();
                boom(p.x,p.y+fl,p.col.base,25);
                boom(p.x,p.y+fl,'#fbbf24',10);
                flash='🐚 ¡Correcto!'; flashT=40;
                pregIdx++;
                if(pregIdx>=preguntas.length){
                    gameOver=true; ganado=aciertos>=Math.ceil(preguntas.length*0.6);
                    boom(W/2,H/2,ganado?'#fbbf24':'#f87171',50);
                    if(ganado)Sonidos.ganar(); else Sonidos.perder();
                    guardar();
                } else setTimeout(()=>crearPerlas(),500);
            } else {
                vidas--; Sonidos.incorrecto();
                boom(p.x,p.y+fl,'#f87171',20);
                flash='¡Esa no es!'; flashT=40;
                if(vidas<=0){gameOver=true;ganado=false;Sonidos.perder();guardar();}
                else setTimeout(()=>crearPerlas(),500);
            }
        }
    });
}

// ── LOOP ──────────────────────────────────────────────────────
function loop(){
    tick++;
    ctx.clearRect(0,0,W,H);
    drawFondo();
    tickP(); drawP();

    // Mover zorrito
    if(!gameOver){
        if(keys['ArrowRight']||keys['d']||keys['D']){ zorrito.vx=zorrito.speed; zorrito.facing='right'; }
        else if(keys['ArrowLeft']||keys['a']||keys['A']){ zorrito.vx=-zorrito.speed; zorrito.facing='left'; }
        else zorrito.vx*=0.8;

        if(keys['ArrowUp']||keys['w']||keys['W']) zorrito.vy=-zorrito.speed;
        else if(keys['ArrowDown']||keys['s']||keys['S']) zorrito.vy=zorrito.speed;
        else zorrito.vy*=0.8;

        zorrito.x=Math.max(0,Math.min(W-16*P,zorrito.x+zorrito.vx));
        zorrito.y=Math.max(70,Math.min(H-60,zorrito.y+zorrito.vy));
        checkColisiones();
    }

    perlas.forEach(drawPerla);
    drawZorrito();

    if(!gameOver){ drawHUD(); drawFlash(); }
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
    flash='';flashT=0;particulas=[];
    zorrito.x=80;zorrito.y=H/2;zorrito.vx=0;zorrito.vy=0;
    crearPerlas();
}

// ── CONTROLES TECLADO ─────────────────────────────────────────
document.addEventListener('keydown',e=>{ keys[e.key]=true; });
document.addEventListener('keyup',e=>{ keys[e.key]=false; });

// ── CONTROLES TÁCTILES ────────────────────────────────────────
[['btnU','ArrowUp'],['btnD','ArrowDown'],['btnL','ArrowLeft'],['btnR','ArrowRight']].forEach(([id,k])=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.addEventListener('touchstart',e=>{e.preventDefault();keys[k]=true;},{passive:false});
    el.addEventListener('touchend',e=>{e.preventDefault();keys[k]=false;});
    el.addEventListener('mousedown',()=>keys[k]=true);
    el.addEventListener('mouseup',()=>keys[k]=false);
});

// ── CLIC REINICIAR ────────────────────────────────────────────
canvas.addEventListener('click',e=>{
    if(!gameOver) return;
    const r=canvas.getBoundingClientRect();
    const cx=(e.clientX-r.left)*(W/r.width),cy=(e.clientY-r.top)*(H/r.height);
    if(cx>W/2-100&&cx<W/2+100&&cy>H/2+78&&cy<H/2+126) reiniciar();
});
canvas.addEventListener('touchend',e=>{
    if(!gameOver) return;
    e.preventDefault();
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

// ── INICIO ────────────────────────────────────────────────────
crearPerlas();
loop();