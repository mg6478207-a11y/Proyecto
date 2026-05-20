// ============================================================
//   RETOMATE · Grado 3 · Módulo 8: Problemas de Dos Pasos
//   Juego: El Zorrito Constructor y el Templo Ancestral
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

// ── BANCO DE PROBLEMAS DE DOS PASOS (ESTÁNDAR GRADO 3) ──
const preguntas = [
    { preg: 'El zorrito tiene 4 cajas con 6 ladrillos cada una. Si gasta 5 ladrillos construyendo una columna, ¿cuántos le quedan?', r: '19', ops: ['24', '19', '15'] }, // (4*6)-5
    { preg: 'Para una pared se necesitan 30 bloques. Compraron 3 paquetes de 8 bloques cada uno. ¿Cuántos bloques faltan todavía?', r: '6', ops: ['6', '24', '12'] }, // 30-(3*8)
    { preg: 'Había 15 herramientas en el taller. El maestro compró 2 bolsas con 5 herramientas cada una. ¿Cuántas herramientas hay ahora?', r: '25', ops: ['20', '17', '25'] }, // 15+(2*5)
    { preg: 'Un carpintero corta 4 tablas de 10 metros cada una. Si une todas y luego corta un pedazo de 8 metros, ¿cuántos metros le quedan?', r: '32', ops: ['40', '32', '48'] }, // (4*10)-8
    { preg: 'Tengo 32 gemas mágicas. Reparto la mitad entre mis 4 ayudantes en partes iguales. ¿Cuántas gemas le tocan a cada uno?', r: '4', ops: ['8', '16', '4'] }, // (32/2)/4
    { preg: 'Tomás cosechó 3 filas de 8 zanahorias cada una. Si su familia se comió 6 zanahorias en la cena, ¿cuántas quedan?', r: '18', ops: ['24', '18', '14'] }, // (3*8)-6
    { preg: 'En el almacén hay 45 sacos de cemento. Se usan 5 sacos por día durante 4 días. ¿Cuántos sacos quedan al final?', r: '25', ops: ['25', '20', '40'] }, // 45-(5*4)
    { preg: 'Compré 6 paquetes de jugos de 4 botellas cada uno. Si comparto los jugos equitativamente con 3 amigos, ¿cuántos nos tocan a cada uno?', r: '6', ops: ['24', '8', '6'] }, // (6*4)/4 (Tomás + 3 amigos = 4 personas)
    { preg: 'Un constructor gana 10 monedas por hora. Trabajó 5 horas el lunes y gastó 15 monedas en comida. ¿Cuántas monedas guardó?', r: '35', ops: ['50', '35', '65'] }, // (10*5)-15
    { preg: 'Hay 2 grupos de obreros, cada grupo tiene 9 personas. Si se marchan 4 obreros a otra obra, ¿cuántos se quedan trabajando?', r: '14', ops: ['18', '14', '22'] } // (2*9)-4
];

// ── ESTADO DEL JUEGO ──────────────────────────────────────────
let pregIdx=0, aciertos=0, vidas=3;
let gameOver=false, ganado=false, guardado=false;
let flash='', flashT=0, tick=0;
let paused=false, pausandoCambio=false;
let compuertaAbierta=false; 
let zorritoAvanza=false;    

const constructor = {
    x: 80,          
    xBase: 80,      
    y: H - 125,
};

// Letreros tipo runa de piedra arqueológica
let runas=[];
const COL_RUNA=[
    {fondo:'#475569', borde:'#f59e0b', txt:'#fef3c7', hover:'#78350f'}, 
    {fondo:'#475569', borde:'#f59e0b', txt:'#fef3c7', hover:'#78350f'},
    {fondo:'#475569', borde:'#f59e0b', txt:'#fef3c7', hover:'#78350f'},
];
const RUNA_POS=[
    {x: W*0.70, y: 195},
    {x: W*0.70, y: 300},
    {x: W*0.70, y: 405},
];

function crearRunas(){
    runas=[];
    if(pregIdx >= preguntas.length) return;
    const p=preguntas[pregIdx];
    const ops=[...p.ops];
    
    // Mezclar opciones
    for(let i=ops.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [ops[i],ops[j]]=[ops[j],ops[i]];
    }
    ops.forEach((val,i)=>{
        runas.push({
            x:RUNA_POS[i].x, y:RUNA_POS[i].y,
            w:230, h:68,
            valor:val, correcta:val===p.r,
            col:COL_RUNA[i],
            hover:false, elegido:false,
            xOffset: 350,
        });
    });
    compuertaAbierta=false;
    constructor.x=constructor.xBase;
    zorritoAvanza=false;
}

// ── PARTÍCULAS: CHISPAS DORADAS DE PODER ANCESTRAL ────────────
let particulas=[];
function lanzarChispas(x,y,n=20){
    for(let i=0; i<n; i++){
        particulas.push({
            x, y,
            vx:(Math.random()-0.5)*6, vy:(Math.random()-0.5)*6,
            vida:1, dec:0.02, r:2+Math.random()*4
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
        ctx.fillStyle='#f59e0b';
        ctx.fillRect(p.x, p.y, p.r, p.r);
        ctx.restore();
    });
}

// ── RENDERIZADO DEL ENTORNO DEL TEMPLO ────────────────────────
function drawCompuertaTemplo(){
    const cx = W*0.42;
    const cy = H-235;
    
    // Marco de la puerta de piedra de los retos
    ctx.fillStyle='#1e293b';
    ctx.fillRect(cx, cy, 80, 170);
    ctx.strokeStyle='#f59e0b'; ctx.lineWidth=3;
    ctx.strokeRect(cx, cy, 80, 170);

    if(!compuertaAbierta){
        // Puerta cerrada (Bloques macizos de piedra tallada)
        ctx.fillStyle='#64748b';
        ctx.fillRect(cx+4, cy+4, 72, 162);
        
        // Líneas de división de rocas
        ctx.strokeStyle='#334155'; ctx.lineWidth=2;
        ctx.beginPath();
        ctx.moveTo(cx+4, cy+54); ctx.lineTo(cx+76, cy+54);
        ctx.moveTo(cx+4, cy+108); ctx.lineTo(cx+76, cy+108);
        ctx.stroke();

        // Runa brillante central indicando cerrojo mágico
        ctx.font=`14px serif`; ctx.textAlign='center';
        ctx.fillText('🔒', cx+40, cy+85);
    } else {
        // Puerta abierta (Se ve luz brillante dorada al fondo del pasadizo)
        ctx.fillStyle='#78350f';
        ctx.fillRect(cx+4, cy+4, 72, 162);
        ctx.font=`14px serif`; ctx.textAlign='center';
        ctx.fillText('✨', cx+40, cy+85);
    }
}

function drawSueloTemplo(){
    const sy = H-65;
    // Bloques de ladrillos ancestrales en el suelo
    ctx.fillStyle='#334155';
    ctx.fillRect(0, sy, W, 65);
    
    ctx.strokeStyle='#1e293b'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();

    // Textura pixelada de baldosas de piedra del templo
    ctx.fillStyle='#475569';
    for(let i=0; i<W; i+=60){
        ctx.fillRect(i, sy+4, 4, 56);
    }
}

// ── ZORRITO CONSTRUCTOR ───────────────────────────────────────
function drawZorritoConstructor(x){
    const y = constructor.y;
    const tambaleo = zorritoAvanza ? Math.sin(tick*0.5)*5 : 0;
    ctx.save(); ctx.translate(x, y + tambaleo);

    // Sombra del constructor
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(20, 52, 22, 5, 0, 0, Math.PI*2); ctx.fill();

    // Ropa de Constructor (Overol azul y cinturón de herramientas)
    ctx.fillStyle='#0284c7'; // Overol denim
    ctx.fillRect(8, 20, 24, 25);
    ctx.fillStyle='#b45309'; // Cinturón café de cuero
    ctx.fillRect(8, 36, 24, 5);

    // Botas industriales
    ctx.fillStyle='#1e293b';
    ctx.fillRect(9, 45, 7, 7);
    ctx.fillRect(24, 45, 7, 7);

    // Cabeza naranja del zorrito
    ctx.fillStyle='#ea580c';
    ctx.fillRect(10, 0, 20, 20);
    ctx.fillStyle='#fff'; ctx.fillRect(20, 10, 6, 6);
    ctx.fillStyle='#000'; ctx.fillRect(25, 11, 3, 3);

    // Casco amarillo de Seguridad del Constructor
    ctx.fillStyle='#eab308';
    ctx.fillRect(8, -4, 24, 6); // Base del casco
    ctx.fillRect(12, -8, 16, 5); // Cúpula del casco

    // Martillo pixelado en la mano
    ctx.fillStyle='#94a3b8'; ctx.fillRect(34, 18, 10, 6); // Cabeza de metal
    ctx.fillStyle='#78350f'; ctx.fillRect(37, 24, 4, 10); // Mango de madera

    ctx.restore();
}

// ── TEXTO EN PERGAMINO DEL PROBLEMA CENTRAL ───────────────────
function drawBloqueProblema(){
    if(pregIdx>=preguntas.length) return;
    const p = preguntas[pregIdx];

    // Gran tablón de piedra de los acertijos
    const px = 40;
    const py = 75;
    const pW = W*0.50;
    const pH = 180;

    ctx.fillStyle='#1f2937';
    ctx.beginPath(); ctx.roundRect(px, py, pW, pH, 12); ctx.fill();
    ctx.strokeStyle='#f59e0b'; ctx.lineWidth=2.5; ctx.stroke();

    ctx.font=`10px ${FONT_MC}`; ctx.fillStyle='#f59e0b'; ctx.textAlign='left';
    ctx.fillText("📜 ACERTIJO DE DOS PASOS:", px+20, py+30);

    // Ajuste de texto del problema matemático automático (Word wrap rudimentario)
    ctx.fillStyle='#f9fafb'; ctx.font=`10px ${FONT_MC}`;
    const palabras = p.preg.split(' ');
    let linea = '';
    let currY = py + 65;
    
    for(let n=0; n<palabras.length; n++){
        let testLinea = linea + palabras[n] + ' ';
        let metrics = ctx.measureText(testLinea);
        if(metrics.width > pW - 40 && n > 0){
            ctx.fillText(linea, px+20, currY);
            linea = palabras[n] + ' ';
            currY += 22;
        } else {
            linea = testLinea;
        }
    }
    ctx.fillText(linea, px+20, currY);
}

// ── DIBUJAR RUNAS DE PIEDRA (OPCIONES) ─────────────────────────
function drawRunaSeleccion(c){
    if(c.xOffset>0) c.xOffset=Math.max(0, c.xOffset-22);
    const rx=c.x+c.xOffset, ry=c.y;
    const {w,h,col,hover,valor}=c;
    const shiftX=hover?6:0;

    ctx.save();
    // Sombra proyectada en el muro
    ctx.fillStyle='rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.roundRect(rx-w/2+shiftX+4, ry-h/2+6, w, h, 6); ctx.fill();

    // Runa de piedra base
    ctx.fillStyle=hover?col.hover:col.fondo;
    ctx.beginPath(); ctx.roundRect(rx-w/2+shiftX, ry-h/2, w, h, 6); ctx.fill();

    // Detalles tallados de piedra pixelada antigua
    ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=3;
    ctx.strokeRect(rx-w/2+shiftX+4, ry-h/2+4, w-8, h-8);

    // Contorno dorado mágico
    ctx.strokeStyle=col.borde; ctx.lineWidth=hover?3:1.5;
    ctx.beginPath(); ctx.roundRect(rx-w/2+shiftX, ry-h/2, w, h, 6); ctx.stroke();

    // Texto del resultado numérico
    ctx.font=`12px ${FONT_MC}`;
    ctx.fillStyle=col.txt;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(valor, rx+shiftX, ry+2);

    if(hover && c.xOffset===0){
        ctx.font=`7px ${FONT_MC}`; ctx.fillStyle='#fef08a';
        ctx.fillText('ACTIVAR MECANISMO', rx+shiftX, ry-h/2-8);
    }
    ctx.restore();
}

function drawHUD(){
    if(pregIdx>=preguntas.length) return;
    
    ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,W,58);
    ctx.strokeStyle='#f59e0b'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,58); ctx.lineTo(W,58); ctx.stroke();

    ctx.font=`11px ${FONT_MC}`; ctx.fillStyle='#f59e0b';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText("MÓDULO DE GRADUACIÓN: RAZONAMIENTO LOGÍSTICO", W/2, 29);

    ctx.font='22px serif'; ctx.textAlign='left';
    for(let i=0; i<vidas; i++) ctx.fillText('🧱', 12+i*35, 36); // Ladrillos representan las vidas

    ctx.font=`9px ${FONT_MC}`; ctx.fillStyle='#94a3b8';
    ctx.textAlign='right';
    ctx.fillText(`${aciertos}/${preguntas.length}`, W-12, 29);
    ctx.fillStyle='#1e293b'; ctx.fillRect(W-120,40,108,10);
    ctx.fillStyle='#f59e0b'; ctx.fillRect(W-120,40,108*(aciertos/preguntas.length),10);
}

function drawFlash(){
    if(!flash||flashT<=0)return;
    ctx.save();
    ctx.globalAlpha=Math.min(1, flashT/20);
    ctx.font=`11px ${FONT_MC}`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=flash.includes('CORRECTO')?'#34d399':'#f87171';
    ctx.fillText(flash, W*0.28, H-120);
    ctx.restore();
    flashT--;
}

function drawPausa(){
    ctx.fillStyle='rgba(0,0,0,0.85)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#111827';
    ctx.beginPath(); ctx.roundRect(W/2-180, H/2-90, 360, 180, 8); ctx.fill();
    ctx.strokeStyle='#f59e0b'; ctx.lineWidth=3; ctx.stroke();
    ctx.font=`15px ${FONT_MC}`; ctx.fillStyle='#f59e0b';
    ctx.textAlign='center';
    ctx.fillText('⏸  CONSTRUCCIÓN EN PAUSA', W/2, H/2-20);
    ctx.font=`9px ${FONT_MC}`; ctx.fillStyle='#94a3b8';
    ctx.fillText('Pulsa P para regresar al Templo', W/2, H/2+25);
}

function drawFinal(){
    ctx.fillStyle='rgba(17,24,39,0.98)'; ctx.fillRect(0,0,W,H);
    ctx.font=`18px ${FONT_MC}`;
    ctx.fillStyle=ganado?'#f59e0b':'#f87171';
    ctx.textAlign='center';
    ctx.fillText(ganado?'¡GRADUADO: MAESTRO CONSTRUCTOR! 🏛️':'EL TEMPLO SE HA BLOQUEADO...', W/2, H/2-40);
    ctx.font=`11px ${FONT_MC}`; ctx.fillStyle='#e2e8f0';
    ctx.fillText(`PROBLEMAS COMPLEJOS RESUELTOS: ${aciertos} DE ${preguntas.length}`, W/2, H/2+10);
    
    const bx=W/2-120, by=H/2+60;
    ctx.fillStyle='#f59e0b'; ctx.beginPath(); ctx.roundRect(bx, by, 240, 46, 6); ctx.fill();
    ctx.font=`10px ${FONT_MC}`; ctx.fillStyle='#020617';
    ctx.fillText('REINTEGRAR AL TEMPLO', W/2, by+27);
}

async function guardar(){
    if(guardado)return; guardado=true;
    try{
        await fetch('/guardar_progreso', {method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({unidad:308, aciertos, total:preguntas.length, puntaje:Math.round(aciertos/preguntas.length*100)})});
    }catch(e){}
}

// ── EVALUACIÓN TÁCTICA ────────────────────────────────────────
function evaluarRuna(idx){
    if(gameOver||pausandoCambio||paused||zorritoAvanza) return;
    const c=runas[idx]; if(!c||c.elegido||c.xOffset>0) return;
    c.elegido=true;

    if(c.correcta){
        aciertos++; if(typeof Sonidos!=='undefined') Sonidos.correcto();
        lanzarChispas(c.x, c.y, 30);
        flash='¡MECANISMO CORRECTO!'; flashT=65;
        compuertaAbierta=true;
        zorritoAvanza=true;
    } else {
        vidas--; if(typeof Sonidos!=='undefined') Sonidos.incorrecto();
        flash='¡ERROR DE CÁLCULO EN LOS PASOS!'; flashT=65;
        if(vidas<=0){gameOver=true; ganado=false; if(typeof Sonidos!=='undefined') Sonidos.perder(); guardar();}
        else{
            pausandoCambio=true;
            setTimeout(()=>{crearRunas(); pausandoCambio=false;},1300);
        }
    }
}

function getRunaEnPos(mx,my){
    for(let i=0; i<runas.length; i++){
        const c=runas[i]; if(c.xOffset>0) continue;
        if(mx>=c.x-c.w/2 && mx<=c.x+c.w/2 && my>=c.y-c.h/2 && my<=c.y+c.h/2) return i;
    }
    return -1;
}
function canvasPos(e){
    const r=canvas.getBoundingClientRect();
    return {x:(e.clientX-r.left)*(W/r.width), y:(e.clientY-r.top)*(H/r.height)};
}

// ── LOOP MOTOR DE JUEGO ───────────────────────────────────────
function loop(){
    tick++;
    if(!paused && !gameOver){
        if(zorritoAvanza){
            // El zorrito camina alegremente cruzando el umbral de la puerta desbloqueada
            constructor.x += 6;
            
            if(constructor.x > W*0.43 && compuertaAbierta){
                lanzarChispas(W*0.46, H-150, 4);
            }
            if(constructor.x > W + 100){
                pregIdx++;
                compuertaAbierta=false;
                zorritoAvanza=false;
                constructor.x=constructor.xBase;
                if(pregIdx>=preguntas.length){
                    gameOver=true;
                    ganado=aciertos>=Math.ceil(preguntas.length*0.6);
                    if(typeof Sonidos!=='undefined') { if(ganado) Sonidos.ganar(); else Sonidos.perder(); }
                    guardar();
                } else {
                    pausandoCambio=true;
                    setTimeout(()=>{crearRunas(); pausandoCambio=false;},300);
                }
            }
        }
    }

    ctx.clearRect(0,0,W,H);
    // Fondo de templo oscuro/místico
    ctx.fillStyle='#1e152a'; ctx.fillRect(0,0,W,H);
    
    drawCompuertaTemplo();
    drawSueloTemplo();
    tickP(); drawP();
    drawBloqueProblema();
    runas.forEach(drawRunaSeleccion);
    drawZorritoConstructor(constructor.x);

    if(!gameOver){
        drawHUD(); drawFlash();
        if(paused) drawPausa();
    } else {
        drawFinal();
    }
    requestAnimationFrame(loop);
}

function reiniciar(){
    pregIdx=0; aciertos=0; vidas=3; gameOver=false; ganado=false; guardado=false;
    flash=''; flashT=0; particulas=[]; paused=false;
    compuertaAbierta=false; zorritoAvanza=false;
    constructor.x=constructor.xBase;
    crearRunas();
}

document.addEventListener('keydown', e=>{
    if((e.key==='p'||e.key==='P') && !gameOver) paused=!paused;
});

canvas.addEventListener('mousemove', e=>{
    if(gameOver||pausandoCambio||paused||zorritoAvanza){canvas.style.cursor='default'; return;}
    const {x,y}=canvasPos(e);
    const idx=getRunaEnPos(x,y);
    runas.forEach((c,i)=>c.hover=(i===idx));
    canvas.style.cursor=idx>=0?'pointer':'default';
});
canvas.addEventListener('click', e=>{
    const {x,y}=canvasPos(e);
    if(gameOver){
        if(x>W/2-120 && x<W/2+120 && y>H/2+60 && y<H/2+106) reiniciar();
        return;
    }
    if(paused) return;
    const idx=getRunaEnPos(x,y);
    if(idx>=0) evaluarRuna(idx);
});

crearRunas();
loop();