// ============================================================
//   RETOMATE · Grado 3 · Módulo 7: Datos y Gráficos
//   Juego: El Zorrito Científico Marino
//   Interpreta gráficos de barras y tablas de datos.
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

// ── BANCO DE PREGUNTAS EDITADO PARA INTERPRETACIÓN DE GRÁFICOS (GRADO 3) ──
// Cada pregunta define los valores de las barras [Peces, Cangrejos, Pulpos] de forma estricta para que el gráfico coincida perfectamente.
const preguntas = [
    { valores: [5, 8, 3], preg: '¿Cuántos cangrejos se contaron?', r: '8', ops: ['5', '8', '3'] },
    { valores: [6, 4, 9], preg: '¿Cuál es el animal más común (mayor frecuencia)?', r: 'Pulpo', ops: ['Pez', 'Cangrejo', 'Pulpo'] },
    { valores: [7, 2, 5], preg: '¿Cuántos peces más que pulpos hay?', r: '2', ops: ['2', '5', '7'] },
    { valores: [4, 4, 8], preg: '¿Cuántos animales se registraron en total?', r: '16', ops: ['12', '16', '8'] },
    { valores: [3, 9, 6], preg: '¿Cuál es el animal con menor frecuencia?', r: 'Pez', ops: ['Pez', 'Cangrejo', 'Pulpo'] },
    { valores: [8, 5, 4], preg: '¿Cuántos peces se avistaron?', r: '8', ops: ['4', '5', '8'] },
    { valores: [5, 5, 7], preg: 'Si unes los peces y cangrejos, ¿cuántos hay?', r: '10', ops: ['10', '12', '14'] },
    { valores: [9, 3, 6], preg: '¿Cuántos pulpos menos que peces hay?', r: '3', ops: ['6', '2', '3'] },
    { valores: [4, 7, 5], preg: '¿Cuántos cangrejos y pulpos hay juntos?', r: '12', ops: ['11', '12', '13'] },
    { valores: [10, 6, 4], preg: '¿Cuál es el total de la población marina estudiada?', r: '20', ops: ['16', '20', '10'] }
];

// ── ESTADO ────────────────────────────────────────────────────
let pregIdx=0, aciertos=0, vidas=3;
let gameOver=false, ganado=false, guardado=false;
let flash='', flashT=0, tick=0;
let paused=false, pausandoCambio=false;
let datosRegistrados=false; 
let zorritoAvanza=false;    

// ── PERSONAJE: ZORRITO CIENTÍFICO ─────────────────────────────
const cientifico = {
    x: 60,          
    xBase: 60,      
    y: H - 120,
};

// ── LETREROS DE BURBUJA (Opciones de Respuesta) ───────────────
let carteles=[];
const COL_CARTEL=[
    {fondo:'#0284c7',borde:'#38bdf8',txt:'#f0f9ff',hover:'#0369a1'}, // Estilo Burbuja tecnológica/marina
    {fondo:'#0284c7',borde:'#38bdf8',txt:'#f0f9ff',hover:'#0369a1'},
    {fondo:'#0284c7',borde:'#38bdf8',txt:'#f0f9ff',hover:'#0369a1'},
];
const CARTEL_POS=[
    {x:W*0.68, y:195},
    {x:W*0.68, y:300},
    {x:W*0.68, y:405},
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
            w:220, h:68,
            valor:val, correcta:val===p.r,
            col:COL_CARTEL[i],
            hover:false, elegido:false,
            xOffset: 350,
        });
    });
    datosRegistrados=false;
    cientifico.x=cientifico.xBase;
    zorritoAvanza=false;
}

// ── PARTÍCULAS (Burbujas de agua pura que suben) ──────────────
let particulas=[];
function lanzarBurbujas(x,y,n=15){
    for(let i=0;i<n;i++){
        particulas.push({
            x, y,
            vx:(Math.random()-0.5)*4, vy:-1 - Math.random()*3,
            vida:1, dec:0.015+Math.random()*0.015, r:3+Math.random()*6
        });
    }
}
function tickP(){
    particulas=particulas.filter(p=>p.vida>0);
    particulas.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy;
        p.vida-=p.dec;
    });
}
function drawP(){
    particulas.forEach(p=>{
        ctx.save(); ctx.globalAlpha=p.vida;
        ctx.strokeStyle='#38bdf8'; ctx.lineWidth=1.5;
        ctx.fillStyle='rgba(186, 230, 253, 0.3)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();
        ctx.restore();
    });
}

// ── DIBUJAR GRÁFICO DE BARRAS DINÁMICO ────────────────────────
function drawGraficoDeBarras(){
    if(pregIdx>=preguntas.length||datosRegistrados) return;
    const p = preguntas[pregIdx];
    
    // Origen del plano del gráfico
    const gx = 100;
    const gy = H - 150;
    const gW = 340;
    const gH = 180;

    // Panel de fondo de la pantalla de datos
    ctx.fillStyle='rgba(15, 23, 42, 0.9)';
    ctx.beginPath();ctx.roundRect(gx-20, gy-gH-30, gW+50, gH+80, 10);ctx.fill();
    ctx.strokeStyle='#06b6d4';ctx.lineWidth=2;ctx.stroke();

    // Dibujar Ejes (X / Y)
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(gx, gy - gH - 10); ctx.lineTo(gx, gy); // Eje Y
    ctx.lineTo(gx + gW, gy); // Eje X
    ctx.stroke();

    // Líneas de escala horizontal y números (Escala de 1 en 1 hasta 10)
    ctx.font=`9px ${FONT_MC}`; ctx.fillStyle='#94a3b8'; ctx.textAlign='right'; ctx.textBaseline='middle';
    let pasos = 10;
    for(let i=0; i<=pasos; i++){
        let yPx = gy - (gH / pasos) * i;
        ctx.beginPath(); ctx.moveTo(gx-5, yPx); ctx.lineTo(gx+gW, yPx);
        ctx.strokeStyle='rgba(148, 163, 184, 0.15)'; ctx.lineWidth=1; ctx.stroke();
        if(i % 2 === 0) ctx.fillText(i, gx - 10, yPx); // Muestra números pares para limpiar el gráfico
    }

    // Configuración de las 3 barras categóricas
    const nombres = ['Peces', 'Cangrejos', 'Pulpos'];
    const colores = ['#f43f5e', '#f97316', '#a855f7']; // Rojo, Naranja, Morado
    const iconOceano = ['🐟', '🦀', '🐙'];
    const barW = 55;
    const gap = 45;

    for(let i=0; i<3; i++){
        let val = p.valores[i];
        let hBarPx = (gH / pasos) * val;
        let bx = gx + gap + i * (barW + gap);
        let by = gy - hBarPx;

        // Dibujar cuerpo de la barra pixelada
        ctx.fillStyle = colores[i];
        ctx.fillRect(bx, by, barW, hBarPx);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, barW, hBarPx);

        // Texto del valor exacto arriba de la barra (Opcional didáctico)
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
        ctx.fillText(val, bx + barW/2, by - 10);

        // Etiquetas del eje X (Categorías)
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(iconOceano[i], bx + barW/2, gy + 16);
        ctx.font=`7px ${FONT_MC}`;
        ctx.fillText(nombres[i], bx + barW/2, gy + 32);
        ctx.font=`9px ${FONT_MC}`; // Reset font
    }
}

// ── ZORRITO CIENTÍFICO MARINO ─────────────────────────────────
function drawZorritoCientifico(x){
    const y = cientifico.y;
    const tambaleo = zorritoAvanza ? Math.sin(tick*0.6)*4 : 0;
    ctx.save();ctx.translate(x, y + tambaleo);

    // Sombra en el suelo metálico
    ctx.fillStyle='rgba(0,0,0,0.25)';
    ctx.beginPath();ctx.ellipse(20,52,22,5,0,0,Math.PI*2);ctx.fill();

    // Cuerpo con bata blanca de laboratorio
    ctx.fillStyle='#f8fafc'; // Bata blanca
    ctx.fillRect(8, 20, 24, 25);
    ctx.fillStyle='#0284c7'; // Camiseta interna azul
    ctx.fillRect(16, 20, 8, 8);

    // Patas/Botas
    ctx.fillStyle='#334155';
    ctx.fillRect(9, 45, 7, 7);
    ctx.fillRect(24, 45, 7, 7);

    // Cabeza de Zorrito
    ctx.fillStyle='#ea580c';
    ctx.fillRect(10,0,20,20);
    ctx.fillStyle='#fff'; ctx.fillRect(20,10,6,6);
    ctx.fillStyle='#000'; ctx.fillRect(25,11,3,3);

    // Gafas de protección de laboratorio/químico
    ctx.strokeStyle='#38bdf8'; ctx.lineWidth=2;
    ctx.strokeRect(12, 4, 8, 6); ctx.strokeRect(21, 4, 8, 6);
    ctx.beginPath(); ctx.moveTo(20, 7); ctx.lineTo(21, 7); ctx.stroke();

    // Portapapeles con apuntes científicos en la mano
    ctx.fillStyle='#78350f'; ctx.fillRect(33, 18, 12, 16); // Tabla madera
    ctx.fillStyle='#ffffff'; ctx.fillRect(35, 20, 8, 12);  // Hoja de datos

    ctx.restore();
}

// ── PISO DE LABORATORIO DE SUBMARINO ──────────────────────────
function drawPisoLaboratorio(){
    const ly = H-65;
    
    // Suelo de rejilla metálica industrial
    ctx.fillStyle='#475569';
    ctx.fillRect(0, ly, W, 12);

    // Remaches metálicos del submarino
    ctx.fillStyle='#1e293b';
    for(let lx=0; lx<W; lx+=40){
        ctx.fillRect(lx, ly+4, 12, 4);
    }

    // El fondo de agua abisal debajo del suelo
    ctx.fillStyle='#0f172a';
    ctx.fillRect(0, ly+12, W, H);
}

// ── BURBUJA RECUADRO DE PREGUNTA CENTRAL ──────────────────────
function drawCuadroPregunta(){
    if(pregIdx>=preguntas.length) return;
    const p = preguntas[pregIdx];

    // Banner flotante superior de la investigación
    ctx.fillStyle='#1e1b4b';
    ctx.beginPath();ctx.roundRect(40, 75, W-80, 48, 8);ctx.fill();
    ctx.strokeStyle='#38bdf8';ctx.lineWidth=2;ctx.stroke();

    ctx.font=`10px ${FONT_MC}`; ctx.fillStyle='#38bdf8'; ctx.textAlign='left';
    ctx.fillText("🔬 PREGUNTA DE ANÁLISIS:", 60, 93);
    
    ctx.fillStyle='#ffffff'; ctx.font=`11px ${FONT_MC}`;
    ctx.fillText(p.preg, 60, 111);
}

// ── DIBUJAR LOS CARTELES DE RESPUESTA ─────────────────────────
function drawCartelBurbuja(c){
    if(c.xOffset>0) c.xOffset=Math.max(0,c.xOffset-20);
    const rx=c.x+c.xOffset, ry=c.y;
    const {w,h,col,hover,valor}=c;
    const shiftX=hover?6:0;

    ctx.save();

    // Sombra del letrero de información
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.beginPath();ctx.roundRect(rx-w/2+shiftX+4,ry-h/2+6,w,h,20);ctx.fill();

    // Botón ovalado tecnológico
    ctx.fillStyle=hover?col.hover:col.fondo;
    ctx.beginPath();ctx.roundRect(rx-w/2+shiftX,ry-h/2,w,h,20);ctx.fill();

    // Brillo de cristal de pantalla
    ctx.fillStyle='rgba(255,255,255,0.08)';
    ctx.fillRect(rx-w/2+shiftX, ry-h/2, w, h/2);

    // Contorno cian/celeste
    ctx.strokeStyle=col.borde;ctx.lineWidth=hover?3:1.5;
    ctx.beginPath();ctx.roundRect(rx-w/2+shiftX,ry-h/2,w,h,20);ctx.stroke();

    // Texto de respuesta
    ctx.font=`11px ${FONT_MC}`;
    ctx.fillStyle=col.txt;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(valor, rx+shiftX, ry+2);

    if(hover && c.xOffset===0){
        ctx.font=`7px ${FONT_MC}`;ctx.fillStyle='#a5f3fc';
        ctx.fillText('REGISTRAR EN BITÁCORA',rx+shiftX,ry-h/2-8);
    }

    ctx.restore();
}

// ── FONDO OCEÁNICO GENERAL ────────────────────────────────────
function drawFondoMarino(){
    // Degradado de agua profunda
    const bgGrad = ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0, '#0c4a6e');
    bgGrad.addColorStop(1, '#0c1829');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);

    // Algas marinas decorativas pixeladas en el fondo
    ctx.fillStyle='rgba(13, 148, 136, 0.2)';
    for(let x=20; x<W; x+=140){
        ctx.beginPath();
        ctx.moveTo(x, H-65);
        ctx.lineTo(x+15, H-180);
        ctx.lineTo(x+40, H-65);
        ctx.fill();
    }
}

// ── HUD MÓDULO ESTADÍSTICA Y GRÁFICOS ──────────────────────────
function drawHUD(){
    if(pregIdx>=preguntas.length) return;
    
    ctx.fillStyle='#020617';ctx.fillRect(0,0,W,58);
    ctx.strokeStyle='#38bdf8';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,58);ctx.lineTo(W,58);ctx.stroke();

    ctx.font=`11px ${FONT_MC}`;ctx.fillStyle='#38bdf8';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText("¡LEER Y COMPARAR BARRAS ESTADÍSTICAS!",W/2,29);

    ctx.font='22px serif';ctx.textAlign='left';
    for(let i=0;i<vidas;i++) ctx.fillText('🧪',12+i*35,35); // Tubos de ensayo como vidas

    ctx.font=`9px ${FONT_MC}`;ctx.fillStyle='#94a3b8';
    ctx.textAlign='right';
    ctx.fillText(`${aciertos}/${preguntas.length}`,W-12,29);
    ctx.fillStyle='#1e293b';ctx.fillRect(W-120,40,108,10);
    ctx.fillStyle='#38bdf8';ctx.fillRect(W-120,40,108*(aciertos/preguntas.length),10);
}

function drawFlash(){
    if(!flash||flashT<=0)return;
    ctx.save();
    ctx.globalAlpha=Math.min(1,flashT/20);
    ctx.font=`12px ${FONT_MC}`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=flash.includes('CORRECTO')?'#34d399':'#f87171';
    ctx.fillText(flash,W*0.30,H/2-10);
    ctx.restore();
    flashT--;
}

// ── CONTROLES DE PANTALLA EXTRAS ──────────────────────────────
function drawPausa(){
    ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#0f172a';
    ctx.beginPath();ctx.roundRect(W/2-180,H/2-90,360,180,8);ctx.fill();
    ctx.strokeStyle='#38bdf8';ctx.lineWidth=3;ctx.stroke();
    ctx.font=`16px ${FONT_MC}`;ctx.fillStyle='#38bdf8';
    ctx.textAlign='center';
    ctx.fillText('⏸  ANÁLISIS PAUSADO',W/2,H/2-20);
    ctx.font=`9px ${FONT_MC}`;ctx.fillStyle='#94a3b8';
    ctx.fillText('Pulsa P para reanudar el conteo',W/2,H/2+25);
}

function drawFinal(){
    ctx.fillStyle='rgba(2,6,17,0.96)';ctx.fillRect(0,0,W,H);
    ctx.font=`18px ${FONT_MC}`;
    ctx.fillStyle=ganado?'#38bdf8':'#f87171';
    ctx.textAlign='center';
    ctx.fillText(ganado?'¡REPORTE CIENTÍFICO PUBLICADO! 🐬':'ERRORES EN LA BASE DE DATOS...',W/2,H/2-40);
    ctx.font=`11px ${FONT_MC}`;ctx.fillStyle='#e2e8f0';
    ctx.fillText(`GRÁFICOS RESUELTOS COMPLETAMENTE: ${aciertos} DE ${preguntas.length}`,W/2,H/2+10);
    
    const bx=W/2-120,by=H/2+60;
    ctx.fillStyle='#38bdf8';ctx.beginPath();ctx.roundRect(bx,by,240,46,6);ctx.fill();
    ctx.font=`10px ${FONT_MC}`;ctx.fillStyle='#020617';
    ctx.fillText('INICIAR NUEVO CONTEO',W/2,by+27);
}

async function guardar(){
    if(guardado)return;guardado=true;
    try{
        await fetch('/guardar_progreso',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({unidad:307,aciertos,total:preguntas.length,puntaje:Math.round(aciertos/preguntas.length*100)})});
    }catch(e){}
}

// ── EVALUACIÓN DE RESPUESTA ───────────────────────────────────
function elegirCartelBurbuja(idx){
    if(gameOver||pausandoCambio||paused||zorritoAvanza) return;
    const c=carteles[idx];if(!c||c.elegido||c.xOffset>0) return;
    c.elegido=true;

    if(c.correcta){
        aciertos++; if(typeof Sonidos!=='undefined') Sonidos.correcto();
        lanzarBurbujas(c.x, c.y, 25);
        flash='¡DATO REGISTRADO CORRECTAMENTE!';flashT=65;
        zorritoAvanza=true;
    } else {
        vidas--; if(typeof Sonidos!=='undefined') Sonidos.incorrecto();
        flash='¡ERROR DE LECTURA DE BARRA!';flashT=65;
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

// ── ENGINE LOOP AUTOMÁTICO ───────────────────────────────────
function loop(){
    tick++;
    if(!paused&&!gameOver){
        if(zorritoAvanza){
            // El científico corre hacia la derecha a tomar muestras o archivar datos
            cientifico.x += 10;
            
            if(cientifico.x >= W*0.35 && !datosRegistrados){
                datosRegistrados=true;
                lanzarBurbujas(W*0.30, H/2, 15);
            }
            if(cientifico.x > W + 100){
                pregIdx++;
                datosRegistrados=false;
                zorritoAvanza=false;
                cientifico.x=cientifico.xBase;
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
    drawFondoMarino();
    drawPisoLaboratorio();
    tickP();drawP();
    drawGraficoDeBarras();
    drawCuadroPregunta();
    carteles.forEach(drawCartelBurbuja);
    drawZorritoCientifico(cientifico.x);

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
    datosRegistrados=false;zorritoAvanza=false;
    cientifico.x=cientifico.xBase;
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
    if(idx>=0) elegirCartelBurbuja(idx);
});

crearCarteles();
loop();