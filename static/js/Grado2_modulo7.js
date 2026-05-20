// ============================================================
//  RETOMATE - Grado 2, Módulo 7: Figuras Planas
//  Juego: Zorrito buzo nada y toca la burbuja correcta
//  ✅ Colisión automática · Sin intro en canvas · P=4
//  ✅ Pausa 1800ms entre preguntas · Velocidad suave
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
    { q:'¿Qué figura tiene 3 lados?',                      r:'Triángulo',  ops:['Círculo','Triángulo','Cuadrado']   },
    { q:'¿Qué figura tiene 4 lados iguales?',              r:'Cuadrado',   ops:['Cuadrado','Rectángulo','Triángulo'] },
    { q:'¿Qué figura NO tiene esquinas?',                  r:'Círculo',    ops:['Triángulo','Círculo','Cuadrado']   },
    { q:'¿Cuántos lados tiene un rectángulo?',             r:'4',          ops:['3','4','5']                        },
    { q:'¿Qué figura parece una pelota plana?',            r:'Círculo',    ops:['Círculo','Cuadrado','Triángulo']   },
    { q:'¿Cuántos vértices tiene un triángulo?',           r:'3',          ops:['2','3','4']                        },
    { q:'¿Qué figura tiene 4 lados iguales y 4 esquinas?', r:'Cuadrado',   ops:['Cuadrado','Rectángulo','Rombo']    },
    { q:'¿Qué figura tiene 2 lados largos y 2 cortos?',    r:'Rectángulo', ops:['Rectángulo','Cuadrado','Triángulo'] },
    { q:'¿Cuántos lados tiene un triángulo?',              r:'3',          ops:['2','3','4']                        },
    { q:'¿Cuántos lados tiene un cuadrado?',               r:'4',          ops:['3','4','6']                        },
];

// ── ESTADO ────────────────────────────────────────────────────
let pregIdx=0, aciertos=0, vidas=3;
let gameOver=false, ganado=false, guardado=false;
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

// ── ZORRITO ───────────────────────────────────────────────────
const zorrito = {
    x: W/2, y: H/2,
    vx:0, vy:0,
    speed: 2.2,
    facing: 'right',
    stepT: 0,
};
const keys={};

// ── BURBUJAS CON FIGURAS ──────────────────────────────────────
let burbujas=[];
const BURBUJA_COLS=[
    {fig:'#fbbf24',texto:'#92400e'},
    {fig:'#34d399',texto:'#065f46'},
    {fig:'#f87171',texto:'#7f1d1d'},
];

function crearBurbujas(){
    burbujas=[];
    if(pregIdx>=preguntas.length) return;
    const p=preguntas[pregIdx];
    const ops=[...p.ops];
    for(let i=ops.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [ops[i],ops[j]]=[ops[j],ops[i]];
    }
    const pos=[{x:130,y:160},{x:W-130,y:160},{x:W/2,y:H-130}];
    ops.forEach((val,i)=>{
        burbujas.push({
            x:pos[i].x, y:pos[i].y,
            r:42, valor:val,
            correcta:val===p.r,
            col:BURBUJA_COLS[i],
            fase:Math.random()*Math.PI*2,
            recogida:false,
        });
    });
    pausandoCambio=false;
}

// ── DIBUJAR FIGURA DENTRO DE BURBUJA ─────────────────────────
function dibujarFigura(tipo, cx, cy, tam, color){
    ctx.fillStyle=color;
    ctx.strokeStyle='rgba(255,255,255,0.8)';
    ctx.lineWidth=2.5;
    switch(tipo){
        case 'Círculo':
            ctx.beginPath(); ctx.arc(cx,cy,tam,0,Math.PI*2); ctx.fill(); ctx.stroke(); break;
        case 'Cuadrado':
            ctx.fillRect(cx-tam,cy-tam,tam*2,tam*2);
            ctx.strokeRect(cx-tam,cy-tam,tam*2,tam*2); break;
        case 'Triángulo':
            ctx.beginPath();
            ctx.moveTo(cx,cy-tam); ctx.lineTo(cx+tam,cy+tam); ctx.lineTo(cx-tam,cy+tam);
            ctx.closePath(); ctx.fill(); ctx.stroke(); break;
        case 'Rectángulo':
            ctx.fillRect(cx-tam*1.4,cy-tam*0.7,tam*2.8,tam*1.4);
            ctx.strokeRect(cx-tam*1.4,cy-tam*0.7,tam*2.8,tam*1.4); break;
        case 'Rombo':
            ctx.beginPath();
            ctx.moveTo(cx,cy-tam); ctx.lineTo(cx+tam,cy); ctx.lineTo(cx,cy+tam); ctx.lineTo(cx-tam,cy);
            ctx.closePath(); ctx.fill(); ctx.stroke(); break;
        default:
            ctx.font=`bold 20px Comic Sans MS`;
            ctx.fillStyle='white';
            ctx.shadowColor='rgba(0,0,0,0.7)'; ctx.shadowBlur=5;
            ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText(String(tipo),cx,cy);
            ctx.shadowBlur=0;
    }
}

function drawBurbuja(b){
    if(b.recogida) return;
    const bob=Math.sin(tick*0.05+b.fase)*5;
    const x=b.x, y=b.y+bob;

    ctx.save(); ctx.translate(x,y);

    // Resplandor
    const og=ctx.createRadialGradient(0,0,0,0,0,b.r+18);
    og.addColorStop(0,'rgba(255,255,255,0.1)'); og.addColorStop(1,'transparent');
    ctx.fillStyle=og; ctx.beginPath(); ctx.arc(0,0,b.r+18,0,Math.PI*2); ctx.fill();

    // Sombra
    ctx.fillStyle='rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(0,b.r+6,b.r*0.6,7,0,0,Math.PI*2); ctx.fill();

    // Burbuja translúcida
    const grad=ctx.createRadialGradient(-b.r*0.3,-b.r*0.3,2,0,0,b.r);
    grad.addColorStop(0,'rgba(255,255,255,0.55)');
    grad.addColorStop(0.4,'rgba(186,230,253,0.35)');
    grad.addColorStop(1,'rgba(56,189,248,0.15)');
    ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(0,0,b.r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=2; ctx.stroke();

    // Figura dentro
    dibujarFigura(b.valor, 0, -6, 13, b.col.fig);

    // Texto
    ctx.font='bold 13px Comic Sans MS';
    ctx.shadowColor='rgba(0,0,0,0.8)'; ctx.shadowBlur=4;
    ctx.fillStyle='white'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(b.valor),0,22);
    ctx.shadowBlur=0;

    // Brillo
    ctx.fillStyle='rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.ellipse(-b.r*0.28,-b.r*0.3,b.r*0.2,b.r*0.11,-0.4,0,Math.PI*2); ctx.fill();

    ctx.restore();
}

// ── ZORRITO PIXEL ART BUZO ────────────────────────────────────
function drawZorrito(){
    const x=zorrito.x, y=zorrito.y;
    const bob=Math.sin(tick*0.08)*2;
    const step=Math.sin(zorrito.stepT*0.25)*2;
    const tailSwing=Math.sin(zorrito.stepT*0.18)*3;

    ctx.save();
    if(zorrito.facing==='left'){ ctx.translate(x+16*P,0); ctx.scale(-1,1); }
    else ctx.translate(x,0);
    const bY=y+bob;

    if(tick%14===0) boom(x+(zorrito.facing==='right'?16*P:0),y-8,'rgba(186,230,253,0.8)',2);

    // Cola
    ctx.fillStyle='#e76f51'; ctx.fillRect(-5*P,bY+12*P+tailSwing,5*P,3*P);
    ctx.fillStyle='#f48c06'; ctx.fillRect(-9*P,bY+10*P+tailSwing,4*P,3*P);
    ctx.fillStyle='#fff';    ctx.fillRect(-11*P,bY+9*P+tailSwing,3*P,2*P);

    // Traje buzo naranja
    ctx.fillStyle='#ea580c'; ctx.fillRect(5*P,bY+8*P,10*P,10*P);
    ctx.fillStyle='#1c1917'; ctx.fillRect(6*P,bY+10*P,3*P,4*P);
    ctx.fillStyle='#374151'; ctx.fillRect(9*P,bY+11*P,5*P,2*P);

    // Cabeza
    ctx.fillStyle='#f48c06'; ctx.fillRect(4*P,bY+1*P,12*P,9*P);
    ctx.fillStyle='#e85d04';
    ctx.fillRect(4*P,bY-1*P,3*P,3*P);
    ctx.fillRect(13*P,bY-1*P,3*P,3*P);

    // Máscara buzo
    ctx.fillStyle='#0c4a6e'; ctx.fillRect(4*P,bY+1*P,12*P,7*P);
    ctx.fillStyle='rgba(125,211,252,0.7)';
    ctx.beginPath(); ctx.arc(7*P,bY+5*P,3*P,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(13*P,bY+5*P,3*P,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.fillRect(6*P,bY+3*P,1*P,1*P); ctx.fillRect(12*P,bY+3*P,1*P,1*P);
    ctx.fillStyle='#1c1917';
    ctx.fillRect(3*P,bY+3*P,1*P,2*P); ctx.fillRect(16*P,bY+3*P,1*P,2*P);

    // Aletas
    ctx.fillStyle='#1d4ed8'; ctx.fillRect(5*P,bY+16*P,10*P,5*P);
    ctx.fillStyle='#2563eb';
    ctx.fillRect(3*P,bY+21*P+step,5*P,3*P);
    ctx.fillRect(11*P,bY+21*P-step,5*P,3*P);

    // Brazos
    ctx.fillStyle='#ea580c';
    ctx.fillRect(2*P,bY+8*P,3*P,5*P);
    ctx.fillRect(15*P,bY+8*P,3*P,5*P);

    ctx.restore();
    zorrito.stepT++;
}

// ── COLISIÓN AUTOMÁTICA ───────────────────────────────────────
function checkColisiones(){
    if(gameOver||pausandoCambio) return;
    for(let i=0;i<burbujas.length;i++){
        const b=burbujas[i];
        if(b.recogida) continue;
        const bob=Math.sin(tick*0.05+b.fase)*5;
        const dx=(zorrito.x+8*P)-b.x;
        const dy=(zorrito.y+12*P)-(b.y+bob);
        if(Math.hypot(dx,dy)<b.r+14){
            b.recogida=true;
            boom(b.x,b.y+bob,'rgba(125,211,252,0.8)',20);
            if(b.correcta){
                aciertos++; Sonidos.correcto();
                boom(b.x,b.y+bob,'#fbbf24',15);
                flash='💨 ¡Correcto!'; flashT=45;
                pregIdx++;
                if(pregIdx>=preguntas.length){
                    gameOver=true; ganado=aciertos>=Math.ceil(preguntas.length*0.6);
                    if(ganado)Sonidos.ganar(); else Sonidos.perder();
                    guardar();
                } else {
                    pausandoCambio=true; zorrito.vx=0; zorrito.vy=0;
                    setTimeout(()=>{ zorrito.x=W/2; zorrito.y=H/2; crearBurbujas(); },1800);
                }
            } else {
                vidas--; Sonidos.incorrecto();
                boom(b.x,b.y+bob,'#f87171',18);
                flash='¡Esa no es!'; flashT=45;
                if(vidas<=0){ gameOver=true; ganado=false; Sonidos.perder(); guardar(); }
                else {
                    pausandoCambio=true; zorrito.vx=0; zorrito.vy=0;
                    setTimeout(()=>{ zorrito.x=W/2; zorrito.y=H/2; crearBurbujas(); },1800);
                }
            }
            break;
        }
    }
}

// ── FONDO SUBMARINO ───────────────────────────────────────────
function drawFondo(){
    const bg=ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#082f49'); bg.addColorStop(0.5,'#0c4a6e'); bg.addColorStop(1,'#0a3649');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    for(let i=0;i<5;i++){
        const lx=100+i*150+Math.sin(tick*0.015+i)*20;
        const g=ctx.createLinearGradient(lx,0,lx+40,H*0.6);
        g.addColorStop(0,'rgba(125,211,252,0.1)'); g.addColorStop(1,'rgba(125,211,252,0)');
        ctx.fillStyle=g;
        ctx.beginPath(); ctx.moveTo(lx,0); ctx.lineTo(lx+45,H*0.6); ctx.lineTo(lx-5,H*0.6); ctx.closePath();
        ctx.fill();
    }

    for(let i=0;i<10;i++){
        const bx=(i*80+tick*0.3)%W;
        const by=H-((tick*0.5+i*50)%(H+20));
        ctx.save(); ctx.globalAlpha=0.1+0.06*Math.sin(tick*0.04+i);
        ctx.strokeStyle='#7dd3fc'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(bx,by,3+i%5,0,Math.PI*2); ctx.stroke();
        ctx.restore();
    }

    const sg=ctx.createLinearGradient(0,H-55,0,H);
    sg.addColorStop(0,'#d97706'); sg.addColorStop(1,'#92400e');
    ctx.fillStyle=sg; ctx.fillRect(0,H-55,W,55);
    ctx.fillStyle='#f59e0b'; ctx.fillRect(0,H-60,W,5);

    [[80,'#f87171','#fca5a5'],[250,'#a78bfa','#c4b5fd'],
     [480,'#34d399','#6ee7b7'],[660,'#fb923c','#fdba74']].forEach(([ax,c1,c2])=>{
        ctx.save(); ctx.translate(ax,H-55);
        const cg=ctx.createLinearGradient(0,-45,0,0);
        cg.addColorStop(0,c2); cg.addColorStop(1,c1);
        ctx.strokeStyle=cg; ctx.lineWidth=5; ctx.lineCap='round';
        const sw=Math.sin(tick*0.025)*3;
        for(let i=-2;i<=2;i++){
            ctx.beginPath(); ctx.moveTo(i*11,0);
            ctx.quadraticCurveTo(i*11+sw,-18,i*8+sw*0.7,-40); ctx.stroke();
            ctx.fillStyle=c2; ctx.beginPath(); ctx.arc(i*8+sw*0.7,-41,5,0,Math.PI*2); ctx.fill();
        }
        ctx.restore();
    });

    [[180,90],[420,140],[650,80]].forEach(([px,py],i)=>{
        const pfx=(px+tick*0.3*(i%2===0?1:-1))%W;
        const pfy=py+Math.sin(tick*0.03+i*2)*12;
        ctx.save(); ctx.globalAlpha=0.25;
        ctx.fillStyle=['#fbbf24','#f87171','#34d399'][i];
        ctx.beginPath(); ctx.ellipse(pfx,pfy,13,7,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(pfx-13,pfy); ctx.lineTo(pfx-21,pfy-6); ctx.lineTo(pfx-21,pfy+6); ctx.closePath(); ctx.fill();
        ctx.restore();
    });
}

// ── HUD ───────────────────────────────────────────────────────
function drawHUD(){
    if(pregIdx>=preguntas.length) return;
    const p=preguntas[pregIdx];
    const hg=ctx.createLinearGradient(20,10,W-20,62);
    hg.addColorStop(0,'rgba(8,47,73,0.95)'); hg.addColorStop(1,'rgba(12,74,110,0.95)');
    ctx.fillStyle=hg; ctx.beginPath(); ctx.roundRect(20,10,W-40,52,12); ctx.fill();
    ctx.strokeStyle='rgba(125,211,252,0.5)'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.font='bold 21px Comic Sans MS';
    ctx.shadowColor='rgba(125,211,252,0.6)'; ctx.shadowBlur=8;
    ctx.fillStyle='#e0f2fe'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(p.q,W/2,36); ctx.shadowBlur=0;
    ctx.font='20px serif'; ctx.textAlign='left';
    for(let i=0;i<vidas;i++) ctx.fillText('❤️',28+i*28,56);
    ctx.font='bold 14px Arial'; ctx.fillStyle='#7dd3fc'; ctx.textAlign='right';
    ctx.fillText(`✅ ${aciertos}/${preguntas.length}`,W-28,56);
    if(pausandoCambio){
        ctx.fillStyle='rgba(251,191,36,0.9)'; ctx.font='bold 15px Comic Sans MS';
        ctx.textAlign='center'; ctx.fillText('🐠 ¡Siguiente burbuja llegando!',W/2,H-28);
    }
}

// ── FLASH ─────────────────────────────────────────────────────
function drawFlash(){
    if(!flash||flashT<=0) return;
    ctx.globalAlpha=Math.min(1,flashT/20);
    ctx.font='bold 32px Comic Sans MS';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    const ok=flash.includes('Correcto');
    ctx.shadowColor=ok?'rgba(52,211,153,0.9)':'rgba(248,113,113,0.9)'; ctx.shadowBlur=20;
    ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=4;
    ctx.strokeText(flash,W/2,H/2-60);
    ctx.fillStyle=ok?'#6ee7b7':'#f87171';
    ctx.fillText(flash,W/2,H/2-60);
    ctx.shadowBlur=0; ctx.globalAlpha=1; flashT--;
}

// ── PANTALLA FINAL ────────────────────────────────────────────
function drawFinal(){
    const og=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.7);
    og.addColorStop(0,'rgba(8,47,73,0.88)'); og.addColorStop(1,'rgba(12,74,110,0.96)');
    ctx.fillStyle=og; ctx.fillRect(0,0,W,H);
    ctx.font='bold 36px Comic Sans MS';
    ctx.shadowColor=ganado?'rgba(251,191,36,0.8)':'rgba(248,113,113,0.8)'; ctx.shadowBlur=20;
    ctx.fillStyle=ganado?'#fbbf24':'#f87171';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(ganado?'🐠 ¡Súper buzo!':'🌊 ¡Sigue practicando!',W/2,H/2-55);
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
        body:JSON.stringify({unidad:207,aciertos,total:preguntas.length,puntaje:Math.round(aciertos/preguntas.length*100)})});
    }catch(e){}
}

// ── LOOP ──────────────────────────────────────────────────────
function loop(){
    tick++;
    ctx.clearRect(0,0,W,H);
    drawFondo(); tickP(); drawP();

    if(!gameOver&&!pausandoCambio){
        if(keys['ArrowRight']||keys['d']){ zorrito.vx=Math.min(zorrito.vx+0.3,zorrito.speed); zorrito.facing='right'; }
        else if(keys['ArrowLeft']||keys['a']){ zorrito.vx=Math.max(zorrito.vx-0.3,-zorrito.speed); zorrito.facing='left'; }
        else zorrito.vx*=0.85;
        if(keys['ArrowUp']||keys['w']) zorrito.vy=Math.max(zorrito.vy-0.3,-zorrito.speed);
        else if(keys['ArrowDown']||keys['s']) zorrito.vy=Math.min(zorrito.vy+0.3,zorrito.speed);
        else zorrito.vy*=0.85;
        zorrito.x=Math.max(0,Math.min(W-16*P,zorrito.x+zorrito.vx));
        zorrito.y=Math.max(70,Math.min(H-60,zorrito.y+zorrito.vy));
        checkColisiones();
    }

    burbujas.forEach(drawBurbuja);
    drawZorrito();

    if(!gameOver){ drawHUD(); drawFlash(); }
    else{
        drawFinal();
        if(ganado&&tick%3===0)
            boom(Math.random()*W,Math.random()*H*0.6,['#fbbf24','#7dd3fc','#34d399','#a78bfa'][Math.floor(Math.random()*4)],3);
    }
    requestAnimationFrame(loop);
}

// ── REINICIAR ─────────────────────────────────────────────────
function reiniciar(){
    pregIdx=0;aciertos=0;vidas=3;gameOver=false;ganado=false;guardado=false;
    flash='';flashT=0;particulas=[];pausandoCambio=false;
    zorrito.x=W/2;zorrito.y=H/2;zorrito.vx=0;zorrito.vy=0;
    crearBurbujas();
}

// ── CONTROLES ─────────────────────────────────────────────────
document.addEventListener('keydown',e=>{ keys[e.key]=true; });
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

zorrito.x=W/2; zorrito.y=H/2;
crearBurbujas();
loop();