// ============================================================
//   RETOMATE · Grado 3 · Módulo 6: Perímetros
//   Juego: El Zorrito Arquitecto / Constructor de Cercas
//   Calcula la suma de los lados para cerrar el terreno.
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

// ── BANCO DE PREGUNTAS ENFOCADAS EN PERÍMETRO (GRADO 3) ──
// tipo: 'cuadrado', 'rectangulo', 'trianguloEquilatero'
const preguntas = [
    { tipo: 'cuadrado', lados: [5, 5, 5, 5], r: '20 cm', ops: ['20 cm', '15 cm', '25 cm'], desc: 'Cuadrado de lado 5cm' },
    { tipo: 'rectangulo', lados: [8, 4, 8, 4], r: '24 m', ops: ['12 m', '24 m', '32 m'], desc: 'Rectángulo de 8m x 4m' },
    { tipo: 'triangulo', lados: [6, 6, 6], r: '18 cm', ops: ['12 cm', '18 cm', '24 cm'], desc: 'Triángulo de lados iguales de 6cm' },
    { tipo: 'cuadrado', lados: [10, 10, 10, 10], r: '40 m', ops: ['30 m', '40 m', '100 m'], desc: 'Terreno cuadrado de 10m' },
    { tipo: 'rectangulo', lados: [7, 3, 7, 3], r: '20 cm', ops: ['20 cm', '14 cm', '21 cm'], desc: 'Caja de 7cm x 3cm' },
    { tipo: 'triangulo', lados: [5, 5, 5], r: '15 m', ops: ['10 m', '15 m', '20 m'], desc: 'Triángulo equilátero de 5m' },
    { tipo: 'cuadrado', lados: [4, 4, 4, 4], r: '16 cm', ops: ['12 cm', '16 cm', '8 cm'], desc: 'Ventana cuadrada de 4cm' },
    { tipo: 'rectangulo', lados: [9, 5, 9, 5], r: '28 m', ops: ['28 m', '23 m', '45 m'], desc: 'Piscina de 9m x 5m' },
    { tipo: 'triangulo', lados: [8, 8, 8], r: '24 cm', ops: ['16 cm', '24 cm', '32 cm'], desc: 'Señal de tránsito de 8cm' },
    { tipo: 'rectangulo', lados: [12, 6, 12, 6], r: '36 m', ops: ['30 m', '72 m', '36 m'], desc: 'Cancha de 12m x 6m' }
];

// ── ESTADO ────────────────────────────────────────────────────
let pregIdx=0, aciertos=0, vidas=3;
let gameOver=false, ganado=false, guardado=false;
let flash='', flashT=0, tick=0;
let paused=false, pausandoCambio=false;
let planoCompletado=false; 
let zorritoAvanza=false;    

// ── PERSONAJE: ZORRITO CONSTRUCTOR ──────────────────────────
const constructor = {
    x: 60,          
    xBase: 60,      
    y: H - 120,
};

// ── CARTELERAS DE MADERA (Opciones de Respuesta) ─────────────────
let carteles=[];
const COL_CARTEL=[
    {fondo:'#b45309',borde:'#facc15',txt:'#fef08a',hover:'#78350f'}, // Estilo Madera de construcción rústica
    {fondo:'#b45309',borde:'#facc15',txt:'#fef08a',hover:'#78350f'},
    {fondo:'#b45309',borde:'#facc15',txt:'#fef08a',hover:'#78350f'},
];
const CARTEL_POS=[
    {x:W*0.65, y:190},
    {x:W*0.65, y:295},
    {x:W*0.65, y:400},
];

function crearCarteles(){
    carteles=[];
    if(pregIdx>=preguntas.length) return;
    const p=preguntas[pregIdx];
    const ops=[...p.ops];
    
    // Mezclar opciones
    for(let i=ops.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [ops[i],ops[j]]=[ops[j],ops[i]];
    }
    ops.forEach((val,i)=>{
        carteles.push({
            x:CARTEL_POS[i].x, y:CARTEL_POS[i].y,
            w:250, h:68,
            valor:val, correcta:val===p.r,
            col:COL_CARTEL[i],
            hover:false, elegido:false,
            xOffset: 350,
        });
    });
    planoCompletado=false;
    constructor.x=constructor.xBase;
    zorritoAvanza=false;
}

// ── PARTÍCULAS (Chispas de aserrín o estrellas de construcción) ──
let particulas=[];
function boomConstruccion(x,y,col='#facc15',n=20){
    for(let i=0;i<n;i++){
        const a=Math.random()*Math.PI*2, v=3+Math.random()*4;
        particulas.push({
            x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-2,
            vida:1,dec:0.02+Math.random()*0.02,r:4+Math.random()*4,col,
            rot:Math.random()*Math.PI*2,rvel:(Math.random()-0.5)*0.2
        });
    }
}
function tickP(){
    particulas=particulas.filter(p=>p.vida>0);
    particulas.forEach(p=>{
        p.x+=p.vx;p.y+=p.vy;p.vy+=0.12;p.vx*=0.95;
        p.vida-=p.dec;p.rot+=p.rvel;
    });
}
function drawP(){
    particulas.forEach(p=>{
        ctx.save();ctx.globalAlpha=p.vida;
        ctx.translate(p.x,p.y);ctx.rotate(p.rot);
        ctx.fillStyle=p.col;
        ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r);
        ctx.restore();
    });
}

// ── DIBUJAR GEOMETRÍA DEL PLANO EN PANTALLA ───────────────────
function drawPlanoGeometrico(){
    if(pregIdx>=preguntas.length||planoCompletado) return;
    const p = preguntas[pregIdx];
    const cx = W*0.30;
    const cy = H/2 + 20;

    // Fondo tipo "papel blueprint" o plano de diseño
    ctx.fillStyle='rgba(30, 41, 59, 0.85)';
    ctx.beginPath();ctx.roundRect(cx-110, cy-120, 220, 210, 8);ctx.fill();
    ctx.strokeStyle='#38bdf8';ctx.lineWidth=2;ctx.stroke();

    // Rejilla interna del plano
    ctx.strokeStyle='rgba(56, 189, 248, 0.15)';ctx.lineWidth=1;
    for(let i=-90; i<=90; i+=30){
        ctx.beginPath();ctx.moveTo(cx+i, cy-110);ctx.lineTo(cx+i, cy+80);ctx.stroke();
        ctx.beginPath();ctx.moveTo(cx-100, cy+i-10);ctx.lineTo(cx+100, cy+i-10);ctx.stroke();
    }

    // Dibujo de la figura geométrica activa
    ctx.strokeStyle='#facc15'; ctx.lineWidth=4;
    ctx.fillStyle='rgba(250, 204, 21, 0.1)';
    
    ctx.font=`12px ${FONT_MC}`;
    ctx.fillStyle='#ffffff';
    ctx.textAlign='center';

    if(p.tipo === 'cuadrado'){
        let ladoPx = 90;
        ctx.beginPath();
        ctx.rect(cx-ladoPx/2, cy-ladoPx/2, ladoPx, ladoPx);
        ctx.fill(); ctx.stroke();
        
        // Cotas/Indicadores de longitud
        ctx.fillStyle='#38bdf8';
        ctx.fillText(`${p.lados[0]} m`, cx, cy - ladoPx/2 - 12); // Arriba
        ctx.fillText(`${p.lados[1]} m`, cx + ladoPx/2 + 25, cy + 4); // Derecha
        ctx.fillText(`${p.lados[2]} m`, cx, cy + ladoPx/2 + 18); // Abajo
        ctx.fillText(`${p.lados[3]} m`, cx - ladoPx/2 - 25, cy + 4); // Izquierda

    } else if(p.tipo === 'rectangulo'){
        let wPx = 130, hPx = 70;
        ctx.beginPath();
        ctx.rect(cx-wPx/2, cy-hPx/2, wPx, hPx);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle='#38bdf8';
        ctx.fillText(`${p.lados[0]} m`, cx, cy - hPx/2 - 12); 
        ctx.fillText(`${p.lados[1]} m`, cx + wPx/2 + 25, cy + 4); 
        ctx.fillText(`${p.lados[2]} m`, cx, cy + hPx/2 + 18); 
        ctx.fillText(`${p.lados[3]} m`, cx - wPx/2 - 25, cy + 4);

    } else if(p.tipo === 'triangulo'){
        ctx.beginPath();
        ctx.moveTo(cx, cy - 55);
        ctx.lineTo(cx + 60, cy + 45);
        ctx.lineTo(cx - 60, cy + 45);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.fillStyle='#38bdf8';
        ctx.fillText(`${p.lados[0]} m`, cx + 45, cy - 5);  // Lado derecho
        ctx.fillText(`${p.lados[1]} m`, cx, cy + 65);     // Base abajo
        ctx.fillText(`${p.lados[2]} m`, cx - 45, cy - 5);  // Lado izquierdo
    }
}

// ── ZORRITO CONSTRUCTOR ───────────────────────────────────────
function drawZorritoConstructor(x){
    const y = constructor.y;
    const tambaleo = zorritoAvanza ? Math.sin(tick*0.5)*4 : 0;
    ctx.save();ctx.translate(x, y + tambaleo);

    // Sombra del muñeco
    ctx.fillStyle='rgba(0,0,0,0.2)';
    ctx.beginPath();ctx.ellipse(20,52,22,6,0,0,Math.PI*2);ctx.fill();

    // Cuerpo/Overol de constructor
    ctx.fillStyle='#3b82f6'; // Overol Azul denim
    ctx.fillRect(8, 20, 24, 24);
    
    // Botas de seguridad
    ctx.fillStyle='#451a03';
    ctx.fillRect(8, 44, 8, 8);
    ctx.fillRect(24, 44, 8, 8);

    // Rostro y cabeza (Zorrito)
    ctx.fillStyle='#ea580c'; // Naranja zorro
    ctx.fillRect(10,0,20,20);
    ctx.fillStyle='#fff'; ctx.fillRect(20,10,6,6); // Hocico
    ctx.fillStyle='#000'; ctx.fillRect(25,11,3,3);  // Nariz
    
    // Casco amarillo de ingeniero/constructor
    ctx.fillStyle='#facc15'; 
    ctx.fillRect(6,-5,28,7);
    ctx.fillRect(12,-10,16,6);

    // Herramienta (Martillo pixelado en la mano)
    ctx.fillStyle='#94a3b8'; ctx.fillRect(34, 15, 8, 6);
    ctx.fillStyle='#78350f'; ctx.fillRect(37, 21, 3, 10);

    ctx.restore();
}

// ── SUELO / PLATAFORMA DE OBRA ────────────────────────────────
function drawTerreno(){
    const sy = H-65;
    
    // Capa de pasto superior
    ctx.fillStyle='#22c55e';
    ctx.fillRect(0, sy, W, 10);

    // Capa de tierra inferior arcillosa
    ctx.fillStyle='#78350f';
    ctx.fillRect(0, sy+10, W, H);

    // Bloques o estacas decorativas en el fondo del paisaje de construcción
    ctx.fillStyle='#15803d';
    for(let bx=15; bx<W; bx+=60){
        ctx.fillRect(bx, sy-15, 6, 15);
    }
}

// ── DIBUJAR UN CARTEL OPCIÓN (Tronco labrado de madera) ────────
function drawCartelMadera(c){
    if(c.xOffset>0) c.xOffset=Math.max(0,c.xOffset-20);
    const rx=c.x+c.xOffset, ry=c.y;
    const {w,h,col,hover,valor}=c;
    const shiftX=hover?6:0;

    ctx.save();

    // Sombra proyectada del letrero
    ctx.fillStyle='rgba(0,0,0,0.4)';
    ctx.beginPath();ctx.roundRect(rx-w/2+shiftX+4,ry-h/2+6,w,h,6);ctx.fill();

    // Bloque de Madera estructural principal
    ctx.fillStyle=hover?col.hover:col.fondo;
    ctx.beginPath();ctx.roundRect(rx-w/2+shiftX,ry-h/2,w,h,6);ctx.fill();

    // Remate o clavos en las esquinas
    ctx.fillStyle='#e2e8f0';
    ctx.fillRect(rx-w/2+shiftX+6, ry-h/2+6, 4, 4);
    ctx.fillRect(rx+w/2+shiftX-10, ry-h/2+6, 4, 4);

    // Borde de encastre dorado
    ctx.strokeStyle=col.borde;ctx.lineWidth=hover?3:1.5;
    ctx.beginPath();ctx.roundRect(rx-w/2+shiftX,ry-h/2,w,h,6);ctx.stroke();

    // Medida numérica interna (Perímetro respuesta)
    ctx.font=`bold 14px ${FONT_MC}`;
    ctx.fillStyle=col.txt;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(valor, rx+shiftX, ry+2);

    if(hover && c.xOffset===0){
        ctx.font=`7px ${FONT_MC}`;ctx.fillStyle='#fef08a';
        ctx.fillText('¡CONSTRUIR CONTORNO!',rx+shiftX,ry-h/2-8);
    }

    ctx.restore();
}

// ── ESCENARIO DE FONDO (Bosque / Obra al aire libre) ──────────
function drawFondoObra(){
    // Cielo celeste de día despejado
    ctx.fillStyle='#38bdf8';
    ctx.fillRect(0,0,W,H);

    // Montañas distantes al fondo
    ctx.fillStyle='#0284c7';
    ctx.beginPath();
    ctx.moveTo(0, H-65); ctx.lineTo(150, 250); ctx.lineTo(320, H-65);
    ctx.moveTo(250, H-65); ctx.lineTo(480, 200); ctx.lineTo(700, H-65);
    ctx.closePath(); ctx.fill();

    // Sol pixelado arriba
    ctx.fillStyle='#facc15';
    ctx.fillRect(40, 40, 50, 50);
}

// ── HUD MÓDULO PERÍMETROS ─────────────────────────────────────
function drawHUD(){
    if(pregIdx>=preguntas.length) return;
    
    ctx.fillStyle='#0f172a';ctx.fillRect(0,0,W,58);
    ctx.strokeStyle='#facc15';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,58);ctx.lineTo(W,58);ctx.stroke();

    ctx.font=`11px ${FONT_MC}`;ctx.fillStyle='#facc15';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText("¡CALCULA EL PERÍMETRO EXACTO SUMANDO LOS LADOS!",W/2,29);

    ctx.font='22px serif';ctx.textAlign='left';
    for(let i=0;i<vidas;i++) ctx.fillText('👷',12+i*35,35); // Cascos de constructor como vidas

    ctx.font=`9px ${FONT_MC}`;ctx.fillStyle='#94a3b8';
    ctx.textAlign='right';
    ctx.fillText(`${aciertos}/${preguntas.length}`,W-12,29);
    ctx.fillStyle='#1e293b';ctx.fillRect(W-120,40,108,10);
    ctx.fillStyle='#facc15';ctx.fillRect(W-120,40,108*(aciertos/preguntas.length),10);
}

function drawFlash(){
    if(!flash||flashT<=0)return;
    ctx.save();
    ctx.globalAlpha=Math.min(1,flashT/20);
    ctx.font=`12px ${FONT_MC}`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=flash.includes('PERFECTO')?'#4ade80':'#f87171';
    ctx.fillText(flash,W*0.30,H/2-140);
    ctx.restore();
    flashT--;
}

// ── PANTALLAS DE CONTROL (PAUSA / FINALIZACIÓN) ───────────────
function drawPausa(){
    ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#1e293b';
    ctx.beginPath();ctx.roundRect(W/2-180,H/2-90,360,180,8);ctx.fill();
    ctx.strokeStyle='#facc15';ctx.lineWidth=3;ctx.stroke();
    ctx.font=`16px ${FONT_MC}`;ctx.fillStyle='#facc15';
    ctx.textAlign='center';
    ctx.fillText('⏸  OBRA EN PAUSA',W/2,H/2-20);
    ctx.font=`9px ${FONT_MC}`;ctx.fillStyle='#94a3b8';
    ctx.fillText('Pulsa P para regresar al plano',W/2,H/2+25);
}

function drawFinal(){
    ctx.fillStyle='rgba(15,23,42,0.95)';ctx.fillRect(0,0,W,H);
    ctx.font=`18px ${FONT_MC}`;
    ctx.fillStyle=ganado?'#facc15':'#f87171';
    ctx.textAlign='center';
    ctx.fillText(ganado?'¡EDIFICIO Y CERCA CONSTRUIDOS CON ÉXITO! 🏆':'PLANO RETIRADO POR ERRORES...',W/2,H/2-40);
    ctx.font=`11px ${FONT_MC}`;ctx.fillStyle='#e2e8f0';
    ctx.fillText(`TERRENOS MEDIDOS CORRECTAMENTE: ${aciertos} DE ${preguntas.length}`,W/2,H/2+10);
    
    const bx=W/2-120,by=H/2+60;
    ctx.fillStyle='#facc15';ctx.beginPath();ctx.roundRect(bx,by,240,46,6);ctx.fill();
    ctx.font=`10px ${FONT_MC}`;ctx.fillStyle='#0f172a';
    ctx.fillText('NUEVA CONSTRUCCIÓN',W/2,by+27);
}

async function guardar(){
    if(guardado)return;guardado=true;
    try{
        await fetch('/guardar_progreso',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({unidad:306,aciertos,total:preguntas.length,puntaje:Math.round(aciertos/preguntas.length*100)})});
    }catch(e){}
}

// ── ACCION DE SELECCION DE RESPUESTA ──────────────────────────
function elegirCartelMadera(idx){
    if(gameOver||pausandoCambio||paused||zorritoAvanza) return;
    const c=carteles[idx];if(!c||c.elegido||c.xOffset>0) return;
    c.elegido=true;

    if(c.correcta){
        aciertos++; if(typeof Sonidos!=='undefined') Sonidos.correcto();
        flash='¡PERÍMETRO PERFECTO!';flashT=65;
        zorritoAvanza=true;
    } else {
        vidas--; if(typeof Sonidos!=='undefined') Sonidos.incorrecto();
        boomConstruccion(c.x,c.y,'#f87171',12);
        flash='¡MAL CÁLCULO! CERCA ASYIMÉTRICA';flashT=65;
        if(vidas<=0){gameOver=true;ganado=false;if(typeof Sonidos!=='undefined') Sonidos.perder();guardar();}
        else{
            pausandoCambio=true;
            setTimeout(()=>{crearCarteles();pausandoCambio=false;},1300);
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

// ── BUCLE DE ANIMACIONES PRINCIPAL ─────────────────────────────
function loop(){
    tick++;
    if(!paused&&!gameOver){
        if(zorritoAvanza){
            // El zorrito avanza hacia el plano arquitectónico a clavar las maderas
            constructor.x += 10;
            
            // Impacto visual al llegar al plano
            if(constructor.x >= W*0.30 - 30 && !planoCompletado){
                planoCompletado=true;
                boomConstruccion(W*0.30, H/2+20, '#4ade80', 30); // Estrellas verdes de construcción limpia
            }
            // Sale de pantalla y reinicia ciclo de la siguiente figura
            if(constructor.x > W + 100){
                pregIdx++;
                planoCompletado=false;
                zorritoAvanza=false;
                constructor.x=constructor.xBase;
                if(pregIdx>=preguntas.length){
                    gameOver=true;
                    ganado=aciertos>=Math.ceil(preguntas.length*0.6);
                    if(typeof Sonidos!=='undefined') { if(ganado) Sonidos.ganar(); else Sonidos.perder(); }
                    guardar();
                } else {
                    pausandoCambio=true;
                    setTimeout(()=>{crearCarteles();pausandoCambio=false;},300);
                }
            }
        }
    }

    ctx.clearRect(0,0,W,H);
    drawFondoObra();
    drawTerreno();
    tickP();drawP();
    drawPlanoGeometrico();
    carteles.forEach(drawCartelMadera);
    drawZorritoConstructor(constructor.x);

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
    planoCompletado=false;zorritoAvanza=false;
    constructor.x=constructor.xBase;
    crearCarteles();
}

document.addEventListener('keydown',e=>{
    if((e.key==='p'||e.key==='P')&&!gameOver) paused=!paused;
});

canvas.addEventListener('mousemove',e=>{
    if(gameOver||pausandoCambio||paused||zorritoAvanza){canvas.style.cursor='default';return;}
    const {x,y}=canvasPos(e);
    const idx=getCartelEnPos(x,y);
    carteles.forEach((c,i)=>c.hover=(i===idx));
    canvas.style.cursor=idx>=0?'pointer':'default';
});
canvas.addEventListener('click',e=>{
    const {x,y}=canvasPos(e);
    if(gameOver){
        if(x>W/2-120&&x<W/2+120&&y>H/2+60&&y<H/2+106) reiniciar();
        return;
    }
    if(paused) return;
    const idx=getCartelEnPos(x,y);
    if(idx>=0) elegirCartelMadera(idx);
});

crearCarteles();
loop();