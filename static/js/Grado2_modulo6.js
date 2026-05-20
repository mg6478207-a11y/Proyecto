// ============================================================
//  RETOMATE - Grado 2, Módulo 6: Patrones y Series
//  Juego: El zorrito surfista. Las 3 olas aparecen juntas
//         en pantalla y el estudiante hace CLIC en la ola
//         con el número correcto. Apto para Grado 2.
//  ✅ Sin scroll · Zorrito pixel art P=4 · Mar temático
//  ✅ CORREGIDO: interacción por clic, no colisión física
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width  = 800;
const H = canvas.height = 500;
const P = 4;

window.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))
        e.preventDefault();
}, { passive: false });

// ── PATRONES ─────────────────────────────────────────────────
const patrones = [
    { serie:[2,4,6,8],         r:'10',   ops:['9','10','12']    },
    { serie:[5,10,15,20],      r:'25',   ops:['22','25','30']   },
    { serie:[1,3,5,7],         r:'9',    ops:['8','9','11']     },
    { serie:[10,20,30,40],     r:'50',   ops:['45','50','55']   },
    { serie:[3,6,9,12],        r:'15',   ops:['13','15','18']   },
    { serie:[100,90,80,70],    r:'60',   ops:['55','60','65']   },
    { serie:[2,4,8,16],        r:'32',   ops:['24','32','30']   },
    { serie:[50,45,40,35],     r:'30',   ops:['28','30','32']   },
    { serie:[11,22,33,44],     r:'55',   ops:['50','55','60']   },
    { serie:[200,400,600,800], r:'1000', ops:['900','1000','1100']},
];

// ── ESTADO ────────────────────────────────────────────────────
let pregIdx=0, aciertos=0, vidas=3;
let gameOver=false, ganado=false, guardado=false;
let flash='', flashT=0, tick=0;
let pausando=false;

// ── PARTÍCULAS ────────────────────────────────────────────────
let particulas=[];
function splash(x,y,col,n=18){
    for(let i=0;i<n;i++){
        const a=Math.random()*Math.PI*2, v=1+Math.random()*4;
        particulas.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-2,
            vida:1,dec:0.022+Math.random()*0.018,r:3+Math.random()*5,col});
    }
}
function tickP(){
    particulas=particulas.filter(p=>p.vida>0);
    particulas.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.07;p.vida-=p.dec;});
}
function drawP(){
    particulas.forEach(p=>{
        ctx.save();ctx.globalAlpha=p.vida;
        ctx.fillStyle=p.col;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
        ctx.restore();
    });
}

// ── ZORRITO SURFISTA ─────────────────────────────────────────
const zorro = { x:120, y:H-155, tx:120 };

function drawZorritoSurfista(x, y){
    const bob=Math.sin(tick*0.07)*4;
    const by=y+bob;
    ctx.save();
    ctx.translate(x,by);

    // Tabla de surf
    const tg=ctx.createLinearGradient(-30,0,30,0);
    tg.addColorStop(0,'#0891b2');tg.addColorStop(0.5,'#67e8f9');tg.addColorStop(1,'#0891b2');
    ctx.fillStyle=tg;
    ctx.beginPath();ctx.ellipse(0,22,32,8,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#0e7490';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='#fbbf24';
    ctx.beginPath();ctx.ellipse(0,22,8,3,0,0,Math.PI*2);ctx.fill();

    // Cola
    const tail=Math.sin(tick*0.1)*3;
    ctx.fillStyle='#e76f51';ctx.fillRect(-6*P,12*P+tail,6*P,3*P);
    ctx.fillStyle='#f48c06';ctx.fillRect(-10*P,10*P+tail,4*P,3*P);
    ctx.fillStyle='#fff';ctx.fillRect(-12*P,9*P+tail,3*P,2*P);

    // Cuerpo traje
    ctx.fillStyle='#0891b2';ctx.fillRect(5*P,8*P,10*P,10*P);
    // Cabeza
    ctx.fillStyle='#f48c06';ctx.fillRect(4*P,1*P,12*P,9*P);
    // Orejas
    ctx.fillStyle='#e85d04';
    ctx.fillRect(4*P,-1*P,3*P,3*P);ctx.fillRect(13*P,-1*P,3*P,3*P);
    // Gafas
    ctx.fillStyle='#1e3a5f';
    ctx.fillRect(6*P,4*P,3*P,2*P);ctx.fillRect(11*P,4*P,3*P,2*P);
    ctx.strokeStyle='#fbbf24';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(9*P,5*P);ctx.lineTo(11*P,5*P);ctx.stroke();
    // Boca
    ctx.fillStyle='#000';ctx.fillRect(9*P,6*P,4*P,1*P);
    // Pantalón
    ctx.fillStyle='#1d4ed8';ctx.fillRect(5*P,16*P,10*P,5*P);
    ctx.fillStyle='#fff';ctx.fillRect(7*P,17*P,2*P,3*P);
    // Pies
    ctx.fillStyle='#f48c06';
    ctx.fillRect(5*P,21*P,4*P,2*P);ctx.fillRect(11*P,21*P,4*P,2*P);
    // Brazos
    ctx.fillStyle='#f48c06';
    ctx.fillRect(15*P,6*P,3*P,5*P);ctx.fillRect(2*P,8*P,3*P,5*P);

    ctx.restore();
}

// ── OLAS FIJAS EN PANTALLA ────────────────────────────────────
let olas=[];
const OLA_COLS=[
    {agua:'#0891b2',espuma:'#cffafe',txt:'#fff'},
    {agua:'#0e7490',espuma:'#a5f3fc',txt:'#fef9c3'},
    {agua:'#155e75',espuma:'#67e8f9',txt:'#fff'},
];
// Posiciones fijas bien separadas y visibles
const OLA_POS=[
    {x:165, y:H-158},
    {x:400, y:H-152},
    {x:635, y:H-158},
];

function crearOlas(){
    olas=[];
    if(pregIdx>=patrones.length) return;
    const p=patrones[pregIdx];
    const ops=[...p.ops];
    for(let i=ops.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [ops[i],ops[j]]=[ops[j],ops[i]];
    }
    ops.forEach((val,i)=>{
        olas.push({
            x:OLA_POS[i].x, y:OLA_POS[i].y,
            w:130, h:90,
            valor:val,
            correcta:val===p.r,
            col:OLA_COLS[i],
            fase:Math.random()*Math.PI*2,
            hover:false,
            elegida:false,
        });
    });
}

function olaRect(o){
    // Zona de clic generosa para niños de grado 2
    return { x:o.x-o.w/2-10, y:o.y-o.h*0.75, w:o.w+20, h:o.h*1.4 };
}

function drawOla(o){
    const fl=Math.sin(tick*0.05+o.fase)*5;
    const x=o.x, y=o.y+fl;
    const hover=o.hover&&!pausando;

    ctx.save();

    // Resplandor hover
    if(hover){
        ctx.fillStyle='rgba(255,251,150,0.22)';
        ctx.beginPath();ctx.ellipse(x,y,o.w*0.65,o.h*0.8,0,0,Math.PI*2);ctx.fill();
    }

    // Sombra
    ctx.fillStyle='rgba(0,0,0,0.15)';
    ctx.beginPath();ctx.ellipse(x,y+o.h/2+6,o.w*0.45,10,0,0,Math.PI*2);ctx.fill();

    // Cuerpo ola
    const og=ctx.createLinearGradient(x-o.w/2,y-o.h/2,x+o.w/2,y+o.h/2);
    if(o.elegida&&o.correcta)      og.addColorStop(0,'#bbf7d0');
    else if(o.elegida&&!o.correcta)og.addColorStop(0,'#fecaca');
    else                            og.addColorStop(0,o.col.espuma);
    og.addColorStop(0.3,o.col.agua);
    og.addColorStop(1,o.col.agua);
    ctx.fillStyle=og;
    ctx.beginPath();
    ctx.moveTo(x-o.w/2,y+o.h/2);
    ctx.quadraticCurveTo(x-o.w/2,y-o.h/2,x,y-o.h*0.6);
    ctx.quadraticCurveTo(x+o.w/2,y-o.h/2,x+o.w/2,y+o.h/2);
    ctx.quadraticCurveTo(x,y+o.h*0.7,x-o.w/2,y+o.h/2);
    ctx.fill();

    // Borde hover
    if(hover){
        ctx.strokeStyle='#fbbf24';ctx.lineWidth=3;
        ctx.beginPath();
        ctx.moveTo(x-o.w/2,y+o.h/2);
        ctx.quadraticCurveTo(x-o.w/2,y-o.h/2,x,y-o.h*0.6);
        ctx.quadraticCurveTo(x+o.w/2,y-o.h/2,x+o.w/2,y+o.h/2);
        ctx.quadraticCurveTo(x,y+o.h*0.7,x-o.w/2,y+o.h/2);
        ctx.stroke();
    }

    // Espuma
    ctx.fillStyle=o.col.espuma;
    ctx.beginPath();ctx.ellipse(x,y-o.h*0.55,o.w*0.38,14,0,0,Math.PI*2);ctx.fill();
    [[-20,-2],[10,4],[-5,8],[18,-6]].forEach(([dx,dy])=>{
        ctx.beginPath();ctx.arc(x+dx,y-o.h*0.45+dy,4,0,Math.PI*2);ctx.fill();
    });

    // Número grande y legible
    ctx.font='bold 30px Comic Sans MS';
    ctx.fillStyle='white';
    ctx.shadowColor='rgba(0,0,0,0.7)';ctx.shadowBlur=8;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(String(o.valor),x,y+6);
    ctx.shadowBlur=0;

    // Puntero "¡Toca aquí!"
    if(hover){
        ctx.font='bold 12px Comic Sans MS';
        ctx.fillStyle='#fbbf24';
        ctx.textAlign='center';
        ctx.fillText('¡Toca aquí!',x,y-o.h*0.8);
    }

    ctx.restore();
}

// ── FONDO MAR ────────────────────────────────────────────────
const PECES=Array.from({length:8},()=>({
    x:Math.random()*W,y:H*0.55+Math.random()*H*0.3,
    vx:0.4+Math.random()*0.6,
    col:['#f87171','#fbbf24','#34d399','#60a5fa'][Math.floor(Math.random()*4)],
    fase:Math.random()*Math.PI*2,tam:8+Math.random()*8,
}));
const NUBES=[
    {x:100,y:60,r:30},{x:280,y:40,r:25},{x:500,y:70,r:35},{x:700,y:50,r:28}
];

function drawFondo(){
    const sky=ctx.createLinearGradient(0,0,0,H*0.55);
    sky.addColorStop(0,'#0ea5e9');sky.addColorStop(1,'#7dd3fc');
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H*0.55);

    const sg=ctx.createRadialGradient(W*0.85,80,5,W*0.85,80,50);
    sg.addColorStop(0,'#fef08a');sg.addColorStop(0.6,'#fde047');sg.addColorStop(1,'rgba(253,224,71,0)');
    ctx.fillStyle=sg;ctx.beginPath();ctx.arc(W*0.85,80,50,0,Math.PI*2);ctx.fill();
    for(let i=0;i<8;i++){
        const a=(i/8)*Math.PI*2+tick*0.005;
        ctx.strokeStyle='rgba(253,224,71,0.5)';ctx.lineWidth=3;
        ctx.beginPath();
        ctx.moveTo(W*0.85+Math.cos(a)*38,80+Math.sin(a)*38);
        ctx.lineTo(W*0.85+Math.cos(a)*55,80+Math.sin(a)*55);
        ctx.stroke();
    }

    ctx.fillStyle='rgba(255,255,255,0.9)';
    NUBES.forEach(n=>{
        const nx=(n.x+tick*0.15)%W;
        ctx.beginPath();
        ctx.arc(nx,n.y,n.r*0.6,0,Math.PI*2);
        ctx.arc(nx+n.r*0.7,n.y-n.r*0.2,n.r*0.45,0,Math.PI*2);
        ctx.arc(nx-n.r*0.5,n.y-n.r*0.1,n.r*0.4,0,Math.PI*2);
        ctx.fill();
    });

    const mar=ctx.createLinearGradient(0,H*0.5,0,H);
    mar.addColorStop(0,'#0891b2');mar.addColorStop(0.4,'#0e7490');mar.addColorStop(1,'#164e63');
    ctx.fillStyle=mar;ctx.fillRect(0,H*0.52,W,H*0.48);

    for(let i=0;i<3;i++){
        const oy=H*0.52+i*25;
        const ox=(tick*0.6+i*80)%W;
        ctx.strokeStyle=`rgba(103,232,249,${0.25-i*0.07})`;
        ctx.lineWidth=2+i;
        ctx.beginPath();
        for(let wx=0;wx<W;wx+=60){
            const wox=(wx+ox)%W;
            const wy=oy+Math.sin((wox/W)*Math.PI*4+tick*0.04)*8;
            wx===0?ctx.moveTo(wox,wy):ctx.lineTo(wox,wy);
        }
        ctx.stroke();
    }

    PECES.forEach(f=>{
        f.x=(f.x+f.vx)%W;
        const fy=f.y+Math.sin(tick*0.04+f.fase)*8;
        ctx.save();ctx.translate(f.x,fy);
        ctx.fillStyle=f.col;
        ctx.beginPath();ctx.ellipse(0,0,f.tam,f.tam*0.55,0,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.moveTo(-f.tam,0);ctx.lineTo(-f.tam-f.tam*0.7,-f.tam*0.5);ctx.lineTo(-f.tam-f.tam*0.7,f.tam*0.5);ctx.closePath();ctx.fill();
        ctx.fillStyle='white';ctx.beginPath();ctx.arc(f.tam*0.5,-f.tam*0.15,f.tam*0.22,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#000';ctx.beginPath();ctx.arc(f.tam*0.55,-f.tam*0.15,f.tam*0.11,0,Math.PI*2);ctx.fill();
        ctx.restore();
    });

    const arena=ctx.createLinearGradient(0,H-60,0,H);
    arena.addColorStop(0,'#fde68a');arena.addColorStop(1,'#fbbf24');
    ctx.fillStyle=arena;ctx.fillRect(0,H-60,W,60);
    ctx.fillStyle='rgba(251,191,36,0.4)';
    for(let i=0;i<20;i++) ctx.fillRect(i*40+5,H-50,15,4);
    ['🐚','🐠','⭐','🦀'].forEach((e,i)=>{
        ctx.font='16px serif';ctx.textAlign='center';
        ctx.fillText(e,60+i*180,H-22);
    });
}

// ── SERIE EN PANTALLA ────────────────────────────────────────
function drawSerie(){
    if(pregIdx>=patrones.length) return;
    const p=patrones[pregIdx];
    const serie=[...p.serie,'?'];
    const cw=72,gap=10;
    const total=serie.length;
    const startX=W/2-(total*cw+(total-1)*gap)/2;
    const y=14;

    ctx.fillStyle='rgba(7,89,133,0.93)';
    ctx.beginPath();ctx.roundRect(startX-12,y-6,total*(cw+gap)+14,54,12);ctx.fill();
    ctx.strokeStyle='rgba(103,232,249,0.35)';ctx.lineWidth=1.5;ctx.stroke();

    serie.forEach((v,i)=>{
        const x=startX+i*(cw+gap);
        const esQ=v==='?';
        const pulse=esQ?Math.sin(tick*0.1)*3:0;
        ctx.fillStyle=esQ?'#fbbf24':'rgba(255,255,255,0.12)';
        ctx.beginPath();ctx.roundRect(x,y+pulse,cw,42,8);ctx.fill();
        ctx.font=`bold ${esQ?22:17}px Comic Sans MS`;
        ctx.fillStyle=esQ?'#1e3a5f':'white';
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(String(v),x+cw/2,y+21+pulse);
        if(i<total-1){
            ctx.fillStyle='rgba(255,255,255,0.45)';
            ctx.font='13px Arial';
            ctx.fillText('→',x+cw+gap/2,y+21);
        }
    });
}

// ── HUD ──────────────────────────────────────────────────────
function drawHUD(){
    ctx.font='20px serif';ctx.textAlign='left';
    for(let i=0;i<vidas;i++) ctx.fillText('❤️',10+i*28,H-10);
    ctx.font='bold 14px Comic Sans MS';ctx.fillStyle='white';
    ctx.textAlign='right';
    ctx.fillText(`✅ ${aciertos}/${patrones.length}`,W-10,H-10);

    if(!pausando&&!gameOver&&pregIdx<patrones.length){
        ctx.fillStyle='rgba(7,89,133,0.84)';
        ctx.beginPath();ctx.roundRect(W/2-170,H*0.56,340,32,10);ctx.fill();
        ctx.font='bold 14px Comic Sans MS';ctx.fillStyle='#67e8f9';
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText('🌊 Haz clic en la ola con el número correcto',W/2,H*0.56+16);
    }

    if(pausando){
        ctx.fillStyle='rgba(7,89,133,0.9)';
        ctx.beginPath();ctx.roundRect(W/2-140,H/2-20,280,40,12);ctx.fill();
        ctx.font='bold 17px Comic Sans MS';ctx.fillStyle='#fbbf24';
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText('🌊 ¡Siguiente patrón llegando!',W/2,H/2);
    }
}

// ── FLASH ────────────────────────────────────────────────────
function drawFlash(){
    if(!flash||flashT<=0) return;
    ctx.globalAlpha=Math.min(1,flashT/18);
    ctx.font='bold 32px Comic Sans MS';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor='rgba(0,0,0,0.4)';ctx.shadowBlur=10;
    ctx.fillStyle=flash.includes('¡')&&!flash.includes('no')?'#fbbf24':'#f87171';
    ctx.fillText(flash,W/2,H/2-60);
    ctx.shadowBlur=0;ctx.globalAlpha=1;flashT--;
}

// ── PANTALLA FINAL ───────────────────────────────────────────
function drawFinal(){
    ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(0,0,W,H);
    ctx.font='bold 38px Comic Sans MS';
    ctx.fillStyle=ganado?'#fbbf24':'#f87171';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(ganado?'🏄 ¡Surfista experto!':'🌊 ¡Inténtalo de nuevo!',W/2,H/2-55);
    ctx.font='22px Comic Sans MS';ctx.fillStyle='white';
    ctx.fillText(`Patrones correctos: ${aciertos} de ${patrones.length}`,W/2,H/2);
    ctx.fillText(`Puntaje: ${Math.round(aciertos/patrones.length*100)}%`,W/2,H/2+38);
    const bg=ctx.createLinearGradient(W/2-100,H/2+78,W/2+100,H/2+126);
    bg.addColorStop(0,'#0891b2');bg.addColorStop(1,'#0e7490');
    ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(W/2-100,H/2+78,200,48,12);ctx.fill();
    ctx.font='bold 18px Comic Sans MS';ctx.fillStyle='white';
    ctx.fillText('▶ Jugar de nuevo',W/2,H/2+102);
}

// ── GUARDAR ──────────────────────────────────────────────────
async function guardar(){
    if(guardado)return;guardado=true;
    try{
        await fetch('/guardar_progreso',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({unidad:206,aciertos,total:patrones.length,puntaje:Math.round(aciertos/patrones.length*100)})});
    }catch(e){}
}

// ── ELEGIR OLA POR CLIC ───────────────────────────────────────
function elegirOla(idx){
    if(gameOver||pausando) return;
    const o=olas[idx];
    if(!o||o.elegida) return;
    o.elegida=true;
    zorro.tx=o.x; // zorrito se mueve hacia la ola elegida

    if(o.correcta){
        aciertos++;Sonidos.correcto();
        splash(o.x,o.y,'#67e8f9',20);splash(o.x,o.y,'#fbbf24',10);
        flash='🌊 ¡Correcto!';flashT=50;
        pregIdx++;
        pausando=true;
        if(pregIdx>=patrones.length){
            gameOver=true;ganado=aciertos>=Math.ceil(patrones.length*0.6);
            if(ganado)Sonidos.ganar();else Sonidos.perder();
            guardar();
            pausando=false;
        } else {
            setTimeout(()=>{zorro.x=120;zorro.tx=120;crearOlas();pausando=false;},1800);
        }
    } else {
        vidas--;Sonidos.incorrecto();
        splash(o.x,o.y,'#f87171',20);
        flash='¡Esa no era! 😅';flashT=50;
        if(vidas<=0){
            pausando=false;
            gameOver=true;ganado=false;Sonidos.perder();guardar();
        } else {
            pausando=true;
            setTimeout(()=>{zorro.x=120;zorro.tx=120;crearOlas();pausando=false;},1800);
        }
    }
}

// ── DETECTAR OLA BAJO EL PUNTERO ─────────────────────────────
function getOlaEnPos(mx,my){
    for(let i=0;i<olas.length;i++){
        const o=olas[i];
        const fl=Math.sin(tick*0.05+o.fase)*5;
        const r=olaRect({...o,y:o.y+fl});
        if(mx>=r.x&&mx<=r.x+r.w&&my>=r.y&&my<=r.y+r.h) return i;
    }
    return -1;
}
function olaRect(o){
    return {x:o.x-o.w/2-10, y:o.y-o.h*0.75, w:o.w+20, h:o.h*1.4};
}

function canvasPos(e){
    const r=canvas.getBoundingClientRect();
    const sx=W/r.width,sy=H/r.height;
    return {x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};
}

// ── LOOP ─────────────────────────────────────────────────────
function loop(){
    tick++;
    ctx.clearRect(0,0,W,H);
    drawFondo();
    tickP();drawP();

    // Zorrito se desliza suavemente hacia la ola elegida
    zorro.x+=(zorro.tx-zorro.x)*0.08;

    if(!gameOver){
        drawSerie();
        olas.forEach(drawOla);
        drawZorritoSurfista(zorro.x,zorro.y);
        drawHUD();
        drawFlash();
    } else {
        olas.forEach(drawOla);
        drawZorritoSurfista(zorro.x,zorro.y);
        drawFinal();
        if(ganado&&tick%4===0)
            splash(Math.random()*W,H-80,['#67e8f9','#fbbf24','#a5f3fc'][Math.floor(Math.random()*3)],4);
    }
    requestAnimationFrame(loop);
}

// ── REINICIAR ────────────────────────────────────────────────
function reiniciar(){
    pregIdx=0;aciertos=0;vidas=3;
    gameOver=false;ganado=false;guardado=false;
    flash='';flashT=0;particulas=[];pausando=false;
    zorro.x=120;zorro.tx=120;
    crearOlas();
}

// ── EVENTOS ───────────────────────────────────────────────────
canvas.addEventListener('mousemove',e=>{
    if(gameOver||pausando){canvas.style.cursor='default';return;}
    const {x,y}=canvasPos(e);
    const idx=getOlaEnPos(x,y);
    olas.forEach((o,i)=>o.hover=(i===idx));
    canvas.style.cursor=idx>=0?'pointer':'default';
});

canvas.addEventListener('click',e=>{
    const {x,y}=canvasPos(e);
    if(gameOver){
        if(x>W/2-100&&x<W/2+100&&y>H/2+78&&y<H/2+126) reiniciar();
        return;
    }
    const idx=getOlaEnPos(x,y);
    if(idx>=0) elegirOla(idx);
});

canvas.addEventListener('touchend',e=>{
    e.preventDefault();
    const t=e.changedTouches[0];
    const r=canvas.getBoundingClientRect();
    const x=(t.clientX-r.left)*(W/r.width);
    const y=(t.clientY-r.top)*(H/r.height);
    if(gameOver){
        if(x>W/2-100&&x<W/2+100&&y>H/2+78&&y<H/2+126) reiniciar();
        return;
    }
    if(pausando) return;
    // Zona ampliada para touch
    let mejor=-1,mejorDist=9999;
    olas.forEach((o,i)=>{
        const fl=Math.sin(tick*0.05+o.fase)*5;
        const dist=Math.hypot(x-o.x,y-(o.y+fl));
        if(dist<90&&dist<mejorDist){mejorDist=dist;mejor=i;}
    });
    if(mejor>=0) elegirOla(mejor);
},{passive:false});

// ── AUDIO ─────────────────────────────────────────────────────
let _au=false;
function _ia(){if(!_au){_au=true;Sonidos.iniciar(2);}}
canvas.addEventListener('click',_ia);
canvas.addEventListener('touchstart',_ia,{passive:true});
document.addEventListener('keydown',_ia,{once:true});

crearOlas();
loop();