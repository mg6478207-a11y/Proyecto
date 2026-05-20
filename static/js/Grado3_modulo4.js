// ============================================================
//   RETOMATE · Grado 3 · Módulo 4: Fracciones Simples
//   Juego: El zorrito maneja una grúa en la obra.
//   Completa el puente eligiendo la fracción que representa la viga.
//   ✅ Fuente Minecraftia · Pausa con P · Temática construcción
//   ✅ Mecánica: Vigas fraccionadas y bloques de cemento
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width  = 860;
const H = canvas.height = 540;
const FONT_MC = "'Minecraftia', monospace";

window.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))
        e.preventDefault();
}, { passive: false });

// ── PREGUNTAS DE FRACCIONES (Grado 3: Denominadores del 2 al 8) ──
const preguntas = [
    { num: 1, den: 2, r: '1/2', ops: ['1/2', '2/2', '1/3'] },
    { num: 2, den: 3, r: '2/3', ops: ['1/3', '2/3', '3/2'] },
    { num: 3, den: 4, r: '3/4', ops: ['1/4', '3/4', '4/3'] },
    { num: 2, den: 5, r: '2/5', ops: ['2/5', '5/2', '3/5'] },
    { num: 4, den: 6, r: '4/6', ops: ['2/6', '4/6', '6/4'] },
    { num: 3, den: 8, r: '3/8', ops: ['3/8', '5/8', '1/8'] },
    { num: 1, den: 4, r: '1/4', ops: ['1/2', '1/4', '4/1'] },
    { num: 5, den: 6, r: '5/6', ops: ['1/6', '5/6', '6/5'] },
    { num: 4, den: 7, r: '4/7', ops: ['3/7', '4/7', '7/4'] },
    { num: 7, den: 8, r: '7/8', ops: ['1/8', '7/8', '8/7'] },
];

// ── ESTADO ────────────────────────────────────────────────────
let pregIdx=0, aciertos=0, vidas=3;
let gameOver=false, ganado=false, guardado=false;
let flash='', flashT=0, tick=0;
let paused=false, pausandoCambio=false;
let puenteCompleto=false; 
let puenteTimer=0;       
let camionAvanza=false;    

// ── CAMIÓN GRÚA ───────────────────────────────────────────────
const camion = {
    x: 80,          
    xBase: 80,      
    vel: 0,
};

// ── CARTELES DE RESPUESTA (Pilares de concreto) ───────────────
let carteles=[];
const COL_CARTEL=[
    {fondo:'#1e3a5f',borde:'#3b82f6',txt:'#bae6fd',hover:'#2563eb'},
    {fondo:'#14532d',borde:'#22c55e',txt:'#bbf7d0',hover:'#16a34a'},
    {fondo:'#7f1d1d',borde:'#ef4444',txt:'#fecaca',hover:'#dc2626'},
];
const CARTEL_POS=[
    {x:W*0.55, y:220},
    {x:W*0.55, y:310},
    {x:W*0.55, y:400},
];

function crearCarteles(){
    carteles=[];
    if(pregIdx >= preguntas.length) return;
    const p=preguntas[pregIdx];
    const ops=[...p.ops];
    for(let i=ops.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [ops[i],ops[j]]=[ops[j],ops[i]];
    }
    ops.forEach((val,i)=>{
        carteles.push({
            x:CARTEL_POS[i].x, y:CARTEL_POS[i].y,
            w:180, h:60,
            valor:val, correcta:val===p.r,
            col:COL_CARTEL[i],
            hover:false, elegido:false,
            xOffset: 300,
        });
    });
    puenteCompleto=false;
    camion.x=camion.xBase;
    camionAvanza=false;
}

// ── PARTÍCULAS ────────────────────────────────────────────────
let particulas=[];
function boom(x,y,col,n=18){
    for(let i=0;i<n;i++){
        const a=Math.random()*Math.PI*2,v=1.5+Math.random()*4;
        particulas.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-2,
            vida:1,dec:0.02+Math.random()*0.02,r:4+Math.random()*6,col,
            forma:Math.random()>0.5?'rect':'circ',
            rot:Math.random()*Math.PI*2,rvel:(Math.random()-0.5)*0.15});
    }
}
function tickP(){
    particulas=particulas.filter(p=>p.vida>0);
    particulas.forEach(p=>{
        p.x+=p.vx;p.y+=p.vy;p.vy+=0.12;p.vx*=0.97;
        p.vida-=p.dec;p.rot+=p.rvel;
    });
}
function drawP(){
    particulas.forEach(p=>{
        ctx.save();ctx.globalAlpha=p.vida;
        ctx.translate(p.x,p.y);ctx.rotate(p.rot);
        ctx.fillStyle=p.col;
        if(p.forma==='rect')ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r);
        else{ctx.beginPath();ctx.arc(0,0,p.r/2,0,Math.PI*2);ctx.fill();}
        ctx.restore();
    });
}

// ── DIBUJAR VIGA FRACCIONADA (El desafío visual) ──────────────
function drawVigaPregunta(){
    if(pregIdx>=preguntas.length) return;
    const p = preguntas[pregIdx];
    
    const vx = W*0.15;
    const vy = 120;
    const vw = 320;
    const vh = 45;
    const anchoBloque = vw / p.den;

    // Contenedor / Sombra de la viga
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(vx+4, vy+4, vw, vh);

    // Dibujar cada pedazo de la fracción
    for(let i=0; i<p.den; i++){
        const bx = vx + i * anchoBloque;
        
        // Si está seleccionado (numerador), color construcción llamativo, si no, gris vacío
        if(i < p.num) {
            ctx.fillStyle = '#f97316'; // Naranja obra relleno
        } else {
            ctx.fillStyle = '#475569'; // Gris oscuro vacío
        }
        
        ctx.fillRect(bx, vy, anchoBloque, vh);
        
        // Bordes de estructura de acero pixelada
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, vy, anchoBloque, vh);

        // Detalles de vigas mecánicas (cruces internas de refuerzo tipo grúa)
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx+4, vy+4); ctx.lineTo(bx+anchoBloque-4, vy+vh-4);
        ctx.moveTo(bx+anchoBloque-4, vy+4); ctx.lineTo(bx+4, vy+vh-4);
        ctx.stroke();
    }

    // Cartel colgante que dice "¿Qué fracción es?"
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(vx + vw/2 - 70, vy - 35, 140, 25);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(vx + vw/2 - 70, vy - 35, 140, 25);
    
    ctx.font = `9px ${FONT_MC}`;
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.fillText("¿QUE FRACCION ES?", vx + vw/2, vy - 18);
}

// ── CAMIÓN PLATA-GRÚA DE CONSTRUCCIÓN ─────────────────────────
function drawCamionGrua(x){
    const y=H-120;
    const ruedaAnim=camionAvanza?Math.sin(tick*0.25)*3:0;
    ctx.save();ctx.translate(x,y);

    // Sombra del vehículo
    ctx.fillStyle='rgba(0,0,0,0.2)';
    ctx.beginPath();ctx.ellipse(80,48,80,10,0,0,Math.PI*2);ctx.fill();

    // Chasis Amarillo Maquinaria
    ctx.fillStyle='#eab308';
    ctx.beginPath();ctx.roundRect(0,15,160,33,4);ctx.fill();
    ctx.fillStyle='#ca8a04';
    ctx.fillRect(0,15,160,6);

    // Cabina de control
    ctx.fillStyle='#facc15';
    ctx.beginPath();ctx.roundRect(110,5,50,40,6);ctx.fill();
    ctx.fillStyle='#ca8a04';ctx.fillRect(110,5,50,6);

    // Ventana de la grúa
    ctx.fillStyle='rgba(186,230,253,0.85)';
    ctx.beginPath();ctx.roundRect(118,12,32,20,4);ctx.fill();
    ctx.strokeStyle='#451a03';ctx.lineWidth=2;ctx.stroke();

    // Brazo de la grúa hidráulica trasera
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=8;
    ctx.beginPath();
    ctx.moveTo(30, 20);
    if(puenteCompleto) {
        ctx.lineTo(70, -10); // Animación levantado
    } else {
        ctx.lineTo(50, -30); // Apuntando arriba
    }
    ctx.stroke();

    // Ruedas de oruga de construcción
    [25,65,105,140].forEach((rx,ri)=>{
        ctx.fillStyle='#1e293b';
        ctx.beginPath();ctx.arc(rx,46+ruedaAnim*(ri%2===0?1:-1),14,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#94a3b8';
        ctx.beginPath();ctx.arc(rx,46+ruedaAnim*(ri%2===0?1:-1),5,0,Math.PI*2);ctx.fill();
    });

    // Zorrito con casco de seguridad
    ctx.fillStyle='#f48c06'; // Piel fox
    ctx.fillRect(125,18,12,10);
    ctx.fillStyle='#000'; // Ojos
    ctx.fillRect(133,21,2,2);
    ctx.fillStyle='#fbbf24'; // Casco amarillo de ingeniero
    ctx.fillRect(122,14,16,5);

    ctx.restore();
}

// ── DIBUJAR PILARES Y PUENTE EN CONSTRUCCIÓN ─────────────────
function drawPuente(){
    const px = W*0.38;
    const py = H-72;

    // Pilares base estables
    ctx.fillStyle='#64748b';
    ctx.fillRect(0, py, W*0.4, 20); // Lado izquierdo estable
    ctx.fillRect(W*0.75, py, W*0.25, 20); // Lado derecho lejano

    // Columnas de soporte estructural
    ctx.fillStyle='#475569';
    ctx.fillRect(W*0.35, py, 35, H);
    ctx.fillRect(W*0.75, py, 35, H);

    // Hueco del puente / Viga faltante provisional
    if(!puenteCompleto){
        // Línea punteada de peligro/guía de construcción
        ctx.strokeStyle='#eab308';
        ctx.lineWidth=3;
        ctx.setLineDash([6,6]);
        ctx.strokeRect(W*0.4, py, W*0.35, 10);
        ctx.setLineDash([]);
    } else {
        // ¡Viga colocada con éxito!
        ctx.fillStyle='#f97316';
        ctx.fillRect(W*0.4, py, W*0.35, 20);
        ctx.strokeStyle='#1e293b';
        ctx.lineWidth=2;
        ctx.strokeRect(W*0.4, py, W*0.35, 20);
    }
}

// ── DIBUJAR CARTEL (Pilares interactivos a la derecha) ────────
function drawCartel(c){
    if(c.xOffset>0) c.xOffset=Math.max(0,c.xOffset-18);
    const rx=c.x-c.xOffset, ry=c.y;
    const {w,h,col,hover,valor}=c;
    const elev=hover?-6:0;

    ctx.save();

    // Soporte metálico del cartel de opción
    ctx.fillStyle='#475569';
    ctx.fillRect(rx-4,ry+h/2-elev,8,H-62-(ry+h/2));

    // Sombra del cartel
    ctx.fillStyle='rgba(0,0,0,0.25)';
    ctx.beginPath();ctx.roundRect(rx-w/2+4,ry-h/2+6-elev,w,h,6);ctx.fill();

    // Fondo
    ctx.fillStyle=hover?col.hover:col.fondo;
    ctx.beginPath();ctx.roundRect(rx-w/2,ry-h/2-elev,w,h,6);ctx.fill();

    // Borde reforzado de seguridad
    ctx.strokeStyle=col.borde;ctx.lineWidth=hover?4:2;
    ctx.beginPath();ctx.roundRect(rx-w/2,ry-h/2-elev,w,h,6);ctx.stroke();

    // Texto de la Fracción (Modificado para verse apilado de forma tradicional elegante)
    const partes = valor.split('/');
    ctx.font=`bold 18px ${FONT_MC}`;
    ctx.fillStyle=col.txt;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    
    // Numerador arriba, Denominador abajo, línea en medio
    ctx.fillText(partes[0], rx, ry - 12 - elev);
    ctx.fillStyle = col.borde;
    ctx.fillRect(rx - 15, ry - elev, 30, 3); // Línea divisoria
    ctx.fillStyle = col.txt;
    ctx.fillText(partes[1], rx, ry + 14 - elev);

    if(hover&&c.xOffset===0){
        ctx.font=`7px ${FONT_MC}`;ctx.fillStyle='#fbbf24';
        ctx.fillText('COLOCAR VIGA',rx,ry-h/2-elev-12);
    }

    ctx.restore();
}

// ── FONDO (Idéntico estilo visual nocturno/industrial) ───────
const EDIFICIOS_BG=[
    {x:0,w:70,h:180,col:'#1e293b'},{x:75,w:50,h:140,col:'#334155'},
    {x:130,w:80,h:220,col:'#1e293b'},{x:580,w:90,h:190,col:'#334155'},
    {x:675,w:60,h:160,col:'#1e293b'},{x:740,w:80,h:240,col:'#0f172a'},
];
const ESTRELLAS=Array.from({length:40},()=>({
    x:Math.random()*W,y:Math.random()*(H*0.4),
    r:0.5+Math.random()*1.5,b:Math.random()*Math.PI*2,
}));

let roadOffset=0;

function drawFondo(){
    const sky=ctx.createLinearGradient(0,0,0,H*0.6);
    sky.addColorStop(0,'#0f172a');sky.addColorStop(0.6,'#1e293b');sky.addColorStop(1,'#334155');
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);

    ESTRELLAS.forEach(s=>{
        const br=0.3+0.7*Math.sin(tick*0.04+s.b);
        ctx.globalAlpha=br;ctx.fillStyle='white';
        ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
    });
    ctx.globalAlpha=1;

    EDIFICIOS_BG.forEach(e=>{
        ctx.fillStyle=e.col;ctx.fillRect(e.x,H-62-e.h,e.w,e.h);
    });

    // Dibujar base del puente inferior (Abismo de la obra)
    ctx.fillStyle='#111827';
    ctx.fillRect(0, H-52, W, 52);
}

// ── HUD MÓDULO FRACCIONES ────────────────────────────────────
function drawHUD(){
    if(pregIdx>=preguntas.length) return;
    const hg=ctx.createLinearGradient(0,0,W,58);
    hg.addColorStop(0,'rgba(15,23,42,0.97)');hg.addColorStop(1,'rgba(30,41,59,0.97)');
    ctx.fillStyle=hg;ctx.fillRect(0,0,W,58);
    ctx.strokeStyle='#eab308';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,58);ctx.lineTo(W,58);ctx.stroke();

    ctx.font=`12px ${FONT_MC}`;ctx.fillStyle='#eab308';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText("¡MIDE E INSTALA LA VIGA CORRECTA!",W/2,29);

    ctx.font='22px serif';ctx.textAlign='left';
    for(let i=0;i<vidas;i++) ctx.fillText('⛑️',12+i*30,32);

    ctx.font=`9px ${FONT_MC}`;ctx.fillStyle='#94a3b8';
    ctx.textAlign='right';
    ctx.fillText(`${aciertos}/${preguntas.length}`,W-12,29);
    ctx.fillStyle='#1e293b';ctx.fillRect(W-120,40,108,10);
    ctx.fillStyle='#eab308';ctx.fillRect(W-120,40,108*(aciertos/preguntas.length),10);
}

function drawFlash(){
    if(!flash||flashT<=0)return;
    ctx.globalAlpha=Math.min(1,flashT/20);
    ctx.font=`14px ${FONT_MC}`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=flash.includes('CORRECTO')?'#22c55e':'#f87171';
    ctx.fillText(flash,W/2,H/2-20);
    ctx.globalAlpha=1;flashT--;
}

// ── INTERFACES FINALES Y PAUSA ──────────────────────────────
function drawPausa(){
    ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#1e293b';
    ctx.beginPath();ctx.roundRect(W/2-200,H/2-110,400,220,8);ctx.fill();
    ctx.strokeStyle='#eab308';ctx.lineWidth=3;ctx.stroke();
    ctx.font=`18px ${FONT_MC}`;ctx.fillStyle='#facc15';
    ctx.textAlign='center';
    ctx.fillText('⏸  PAUSA DE OBRA',W/2,H/2-50);
}

function drawFinal(){
    ctx.fillStyle='rgba(0,0,0,0.85)';ctx.fillRect(0,0,W,H);
    ctx.font=`20px ${FONT_MC}`;
    ctx.fillStyle=ganado?'#facc15':'#f87171';
    ctx.textAlign='center';
    ctx.fillText(ganado?'¡PUENTE CONSTRUIDO!':'OBRA SUSPENDIDA...',W/2,H/2-50);
    ctx.font=`10px ${FONT_MC}`;ctx.fillStyle='#cbd5e1';
    ctx.fillText(`FRACCIONES CORRECTAS: ${aciertos} DE ${preguntas.length}`,W/2,H/2);
    
    const bx=W/2-110,by=H/2+55;
    ctx.fillStyle='#eab308';ctx.beginPath();ctx.roundRect(bx,by,220,44,6);ctx.fill();
    ctx.font=`10px ${FONT_MC}`;ctx.fillStyle='#1e293b';
    ctx.fillText('NUEVA OBRA',W/2,by+26);
}

async function guardar(){
    if(guardado)return;guardado=true;
    try{
        await fetch('/guardar_progreso',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({unidad:304,aciertos,total:preguntas.length,puntaje:Math.round(aciertos/preguntas.length*100)})});
    }catch(e){}
}

// ── SELECCIÓN ─────────────────────────────────────────────────
function elegirCartel(idx){
    if(gameOver||pausandoCambio||paused||puenteCompleto) return;
    const c=carteles[idx];if(!c||c.elegido||c.xOffset>0) return;
    c.elegido=true;

    if(c.correcta){
        aciertos++; if(typeof Sonidos!=='undefined') Sonidos.correcto();
        boom(c.x,c.y,'#22c55e',20);
        flash='¡EXCELENTE! VIGA INSTALADA';flashT=55;
        puenteCompleto=true;
        puenteTimer=90; 
        camionAvanza=true;
    } else {
        vidas--; if(typeof Sonidos!=='undefined') Sonidos.incorrecto();
        boom(c.x,c.y,'#f87171',18);
        flash='¡MEDIDA INCORRECTA! -1 CASCO';flashT=55;
        if(vidas<=0){gameOver=true;ganado=false;if(typeof Sonidos!=='undefined') Sonidos.perder();guardar();}
        else{
            pausandoCambio=true;
            setTimeout(()=>{crearCarteles();pausandoCambio=false;},1200);
        }
    }
}

function getCartelEnPos(mx,my){
    for(let i=0;i<carteles.length;i++){
        const c=carteles[i];if(c.xOffset>0) continue;
        if(mx>=c.x-c.w/2&&mx<=c.x+c.w/2&&my>=c.y-c.h/2&&my<=c.y+c.h/2) return i;
    }
    return -1;
}
function canvasPos(e){
    const r=canvas.getBoundingClientRect();
    return {x:(e.clientX-r.left)*(W/r.width),y:(e.clientY-r.top)*(H/r.height)};
}

// ── LOOP PRINCIPAL ────────────────────────────────────────────
function loop(){
    tick++;
    if(!paused&&!gameOver){
        if(puenteCompleto){
            puenteTimer--;
            if(camionAvanza){
                camion.x+=5;
                if(camion.x>W+220){
                    pregIdx++;
                    puenteCompleto=false;
                    camionAvanza=false;
                    camion.x=camion.xBase;
                    if(pregIdx>=preguntas.length){
                        gameOver=true;
                        ganado=aciertos>=Math.ceil(preguntas.length*0.6);
                        if(typeof Sonidos!=='undefined') { if(ganado) Sonidos.ganar(); else Sonidos.perder(); }
                        guardar();
                    } else {
                        pausandoCambio=true;
                        setTimeout(()=>{crearCarteles();pausandoCambio=false;},400);
                    }
                }
            }
        }
    }

    ctx.clearRect(0,0,W,H);
    drawFondo();
    tickP();drawP();
    drawPuente();
    drawVigaPregunta();
    carteles.forEach(drawCartel);
    drawCamionGrua(camion.x);

    if(!gameOver){
        drawHUD();drawFlash();
        if(paused) drawPausa();
    } else {
        drawFinal();
    }
    requestAnimationFrame(loop);
}

function reiniciar(){
    pregIdx=0;aciertos=0;vidas=3;gameOver=false;ganado=false;guardado=false;
    flash='';flashT=0;particulas=[];pausandoCambio=false;paused=false;
    puenteCompleto=false;puenteTimer=0;camionAvanza=false;
    camion.x=camion.xBase;
    crearCarteles();
}

document.addEventListener('keydown',e=>{
    if((e.key==='p'||e.key==='P')&&!gameOver) paused=!paused;
});

canvas.addEventListener('mousemove',e=>{
    if(gameOver||pausandoCambio||paused||puenteCompleto){canvas.style.cursor='default';return;}
    const {x,y}=canvasPos(e);
    const idx=getCartelEnPos(x,y);
    carteles.forEach((c,i)=>c.hover=(i===idx));
    canvas.style.cursor=idx>=0?'pointer':'default';
});
canvas.addEventListener('click',e=>{
    const {x,y}=canvasPos(e);
    if(gameOver){
        if(x>W/2-110&&x<W/2+110&&y>H/2+55&&y<H/2+99) reiniciar();
        return;
    }
    if(paused) return;
    const idx=getCartelEnPos(x,y);
    if(idx>=0) elegirCartel(idx);
});

crearCarteles();
loop();