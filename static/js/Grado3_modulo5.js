// ============================================================
//   RETOMATE · Grado 3 · Módulo 5: Números hasta 10.000
//   Juego: El zorrito en el carrito minero de oro.
//   Rompe la roca eligiendo la descomposición o lectura correcta.
//   ✅ Fuente Minecraftia · Pausa con P · Temática Mina/Oro
//   ✅ Mecánica: Carrito sobre rieles y partículas de oro
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

// ── PREGUNTAS DE NÚMEROS HASTA 10.000 ──
const preguntas = [
    { num: 3425, r: '3UM + 4C + 2D + 5U', ops: ['3UM + 4C + 2D + 5U', '3UM + 2C + 4D + 5U', '4UM + 3C + 2D + 5U'] },
    { num: 6182, r: 'Seis mil ciento ochenta y dos', ops: ['Seis mil ochenta y dos', 'Seis mil ciento ochenta y dos', 'Mil de a seis y ochenta'] },
    { num: 7054, r: '7UM + 5D + 4U', ops: ['7UM + 5C + 4U', '7UM + 5D + 4U', '7UM + 5D + 4C'] },
    { num: 1290, r: '1.000 + 200 + 90', ops: ['1.000 + 200 + 90', '1.000 + 900 + 20', '100 + 200 + 90'] },
    { num: 8503, r: 'Ocho mil quinientos tres', ops: ['Ocho mil cincuenta y tres', 'Ocho mil quinientos treinta', 'Ocho mil quinientos tres'] },
    { num: 4916, r: '4UM + 9C + 1D + 6U', ops: ['4UM + 9C + 1D + 6U', '4UM + 1C + 9D + 6U', '9UM + 4C + 1D + 6U'] },
    { num: 2008, r: 'Dos mil ocho', ops: ['Doscientos ocho', 'Dos mil ochenta', 'Dos mil ocho'] },
    { num: 9340, r: '9.000 + 300 + 40', ops: ['9.000 + 300 + 4', '9.000 + 300 + 40', '9.300 + 4'] },
    { num: 5671, r: '5UM + 6C + 7D + 1U', ops: ['5UM + 6C + 7D + 1U', '5UM + 7C + 6D + 1U', '1UM + 7C + 6D + 5U'] },
    { num: 9999, r: 'Nueve mil novecientos noventa y nueve', ops: ['Nueve mil noventa y nueve', 'Nueve mil novecientos noventa y nueve', 'Nueve mil novecientos nueve'] }
];

// ── ESTADO ────────────────────────────────────────────────────
let pregIdx=0, aciertos=0, vidas=3;
let gameOver=false, ganado=false, guardado=false;
let flash='', flashT=0, tick=0;
let paused=false, pausandoCambio=false;
let rocaRota=false; 
let carritoAvanza=false;    

// ── VEHÍCULO: CARRITO MINERO ──────────────────────────────────
const carrito = {
    x: 60,          
    xBase: 60,      
    y: H - 115,
};

// ── PILARES DE PIEDRA (Opciones de Respuesta) ─────────────────
let carteles=[];
const COL_CARTEL=[
    {fondo:'#2d2d30',borde:'#eab308',txt:'#fef08a',hover:'#444446'}, // Estilo piedra oscura con filón de oro
    {fondo:'#2d2d30',borde:'#eab308',txt:'#fef08a',hover:'#444446'},
    {fondo:'#2d2d30',borde:'#eab308',txt:'#fef08a',hover:'#444446'},
];
const CARTEL_POS=[
    {x:W*0.62, y:190},
    {x:W*0.62, y:295},
    {x:W*0.62, y:400},
];

function crearCarteles(){
    carteles=[];
    if(pregIdx>=preguntas.length) return;
    const p=preguntas[pregIdx];
    const ops=[...p.ops];
    for(let i=ops.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [ops[i],ops[j]]=[ops[j],ops[i]];
    }
    ops.forEach((val,i)=>{
        carteles.push({
            x:CARTEL_POS[i].x, y:CARTEL_POS[i].y,
            w:270, h:68,
            valor:val, correcta:val===p.r,
            col:COL_CARTEL[i],
            hover:false, elegido:false,
            xOffset: 350,
        });
    });
    rocaRota=false;
    carrito.x=carrito.xBase;
    carritoAvanza=false;
}

// ── PARTÍCULAS (Explosión de pepitas de Oro) ──────────────────
let particulas=[];
function boomOro(x,y,col='#fbbf24',n=25){
    for(let i=0;i<n;i++){
        const a=Math.random()*Math.PI*2, v=2+Math.random()*5;
        particulas.push({
            x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-3,
            vida:1,dec:0.015+Math.random()*0.02,r:3+Math.random()*5,col,
            rot:Math.random()*Math.PI*2,rvel:(Math.random()-0.5)*0.2
        });
    }
}
function tickP(){
    particulas=particulas.filter(p=>p.vida>0);
    particulas.forEach(p=>{
        p.x+=p.vx;p.y+=p.vy;p.vy+=0.15;p.vx*=0.96;
        p.vida-=p.dec;p.rot+=p.rvel;
    });
}
function drawP(){
    particulas.forEach(p=>{
        ctx.save();ctx.globalAlpha=p.vida;
        ctx.translate(p.x,p.y);ctx.rotate(p.rot);
        ctx.fillStyle=p.col;
        ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r); // Pepitas cuadradas pixeladas
        ctx.restore();
    });
}

// ── DIBUJAR ROCA CON NÚMERO OBJETIVO ──────────────────────────
function drawRocaObjetivo(){
    if(pregIdx>=preguntas.length||rocaRota) return;
    const p = preguntas[pregIdx];
    const rx = W*0.32;
    const ry = H-140;

    // Sombra de la roca
    ctx.fillStyle='rgba(0,0,0,0.4)';
    ctx.beginPath();ctx.ellipse(rx+10,ry+50,45,12,0,0,Math.PI*2);ctx.fill();

    // Cuerpo de la roca de piedra (Polígono pixelado)
    ctx.fillStyle='#4b5563';
    ctx.beginPath();
    ctx.moveTo(rx-40,ry+40); ctx.lineTo(rx-50,ry);
    ctx.lineTo(rx-10,ry-45); ctx.lineTo(rx+30,ry-40);
    ctx.lineTo(rx+55,ry+10); ctx.lineTo(rx+45,ry+45);
    ctx.closePath();ctx.fill();

    // Detalles/Brillos de filones de Oro puro incrustados
    ctx.fillStyle='#facc15';
    ctx.fillRect(rx-20, ry-20, 10, 8);
    ctx.fillRect(rx+15, ry+10, 12, 6);
    ctx.fillRect(rx-5, ry+25, 8, 8);

    // Líneas de relieve de piedra oscuras
    ctx.strokeStyle='#1f2937';ctx.lineWidth=3;ctx.stroke();

    // El Gran Número de 4 cifras impreso en la roca
    ctx.font=`bold 15px ${FONT_MC}`;
    ctx.fillStyle='#ffffff';
    ctx.textAlign='center';
    // Formatear número con punto de miles de forma elegante
    const numFormateado = p.num.toLocaleString('es-CO');
    
    // Pequeña placa minera de fondo para el texto
    ctx.fillStyle='rgba(15,23,42,0.75)';
    ctx.beginPath();ctx.roundRect(rx-45,ry-15,90,24,4);ctx.fill();
    ctx.fillStyle='#ffffff';
    ctx.fillText(numFormateado, rx, ry+2);
}

// ── CARRITO MINERO CON EL ZORRITO ─────────────────────────────
function drawCarritoMinero(x){
    const y = carrito.y;
    const tambaleo = carritoAvanza ? Math.sin(tick*0.4)*3 : 0;
    ctx.save();ctx.translate(x, y + tambaleo);

    // Caja del carrito de hierro fundido
    ctx.fillStyle='#78716c'; // Gris hierro
    ctx.beginPath();
    ctx.moveTo(0,0); ctx.lineTo(65,0);
    ctx.lineTo(55,32); ctx.lineTo(10,32);
    ctx.closePath();ctx.fill();
    
    // Borde superior grueso
    ctx.fillStyle='#44403c';
    ctx.fillRect(-2, -3, 69, 5);

    // Eje y Ruedas de hierro pulido
    ctx.fillStyle='#1c1917';
    ctx.beginPath();ctx.arc(16,36,8,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(48,36,8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#a8a29e';
    ctx.beginPath();ctx.arc(16,36,3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(48,36,3,0,Math.PI*2);ctx.fill();

    // Zorrito minero asomado
    ctx.fillStyle='#f48c06'; // Cara fox
    ctx.fillRect(18,-15,14,15);
    ctx.fillStyle='#fff'; ctx.fillRect(26,-10,4,4); // Hocico
    ctx.fillStyle='#000'; ctx.fillRect(29,-9,2,2);  // Nariz
    
    // Casco minero con linterna encendida
    ctx.fillStyle='#ef4444'; // Casco Rojo de seguridad minera
    ctx.fillRect(14,-20,20,6);
    ctx.fillStyle='#fef08a'; // Foco de luz encendido
    ctx.fillRect(31,-18,5,4);

    // Haz de luz de la linterna hacia el frente
    if(!rocaRota){
        const gradLuz = ctx.createLinearGradient(35,-16,140,-16);
        gradLuz.addColorStop(0,'rgba(254,240,138,0.4)');
        gradLuz.addColorStop(1,'rgba(254,240,138,0)');
        ctx.fillStyle=gradLuz;
        ctx.beginPath();
        ctx.moveTo(35,-18); ctx.lineTo(150,-40); ctx.lineTo(150,10);
        ctx.closePath();ctx.fill();
    }

    ctx.restore();
}

// ── DIBUJAR LOS RIELES DE LA MINA ─────────────────────────────
function drawRieles(){
    const ry = H-76;
    
    // Viga de madera de base continua
    ctx.fillStyle='#7c2d12';
    ctx.fillRect(0, ry, W, 6);

    // Durmientes de madera transversales cada ciertos pixeles
    ctx.fillStyle='#451a03';
    for(let rx=0; rx<W; rx+=28){
        ctx.fillRect(rx, ry+6, 10, 8);
    }

    // El riel de acero brillante superior
    ctx.fillStyle='#94a3b8';
    ctx.fillRect(0, ry-2, W, 3);
}

// ── DIBUJAR UN CARTEL OPCIÓN (Pilares de piedra labrada) ──────
function drawCartelMina(c){
    if(c.xOffset>0) c.xOffset=Math.max(0,c.xOffset-20);
    const rx=c.x+c.xOffset, ry=c.y;
    const {w,h,col,hover,valor}=c;
    const shiftX=hover?5:0; // Efecto de desplazamiento lateral al hover

    ctx.save();

    // Sombra trasera del bloque
    ctx.fillStyle='rgba(0,0,0,0.35)';
    ctx.beginPath();ctx.roundRect(rx-w/2+shiftX+4,ry-h/2+5,w,h,4);ctx.fill();

    // Bloque principal de piedra
    ctx.fillStyle=hover?col.hover:col.fondo;
    ctx.beginPath();ctx.roundRect(rx-w/2+shiftX,ry-h/2,w,h,4);ctx.fill();

    // Borde de filón dorado
    ctx.strokeStyle=col.borde;ctx.lineWidth=hover?3:1.5;
    ctx.beginPath();ctx.roundRect(rx-w/2+shiftX,ry-h/2,w,h,4);ctx.stroke();

    // Esquineras decorativas tipo bloque minero
    ctx.fillStyle='#eab308';
    ctx.fillRect(rx-w/2+shiftX, ry-h/2, 6, 6);
    ctx.fillRect(rx+w/2+shiftX-6, ry-h/2, 6, 6);
    ctx.fillRect(rx-w/2+shiftX, ry+h/2-6, 6, 6);
    ctx.fillRect(rx+w/2+shiftX-6, ry+h/2-6, 6, 6);

    // Texto descriptivo del número (Ajustado el tamaño dinámicamente según longitud)
    const esTextoLargo = valor.length > 18;
    ctx.font=(esTextoLargo)?`9px ${FONT_MC}`:`11px ${FONT_MC}`;
    ctx.fillStyle=col.txt;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(valor, rx+shiftX, ry+2);

    if(hover&&c.xOffset===0){
        ctx.font=`7px ${FONT_MC}`;ctx.fillStyle='#a1a1aa';
        ctx.fillText('ENVIAR CARRITO',rx+shiftX,ry-h/2-8);
    }

    ctx.restore();
}

// ── FONDO DE CAVERNA SUBTERRÁNEA ──────────────────────────────
function drawCavernaBg(){
    // Fondo base roca oscura
    ctx.fillStyle='#1c1917';
    ctx.fillRect(0,0,W,H);

    // Dibujar arcos de madera de soporte de la mina (Puntales)
    ctx.fillStyle='#292524';
    for(let ax=40; ax<W; ax+=180){
        ctx.fillRect(ax, 58, 20, H);
        ctx.fillRect(ax-10, 58, 40, 15);
    }

    // Techo y relieves rocosos superiores oscuros
    ctx.fillStyle='#0c0a09';
    ctx.beginPath();
    ctx.moveTo(0,58);
    for(let tx=0; tx<=W; tx+=40){
        ctx.lineTo(tx, 70 + Math.sin(tx)*12);
    }
    ctx.lineTo(W,0);ctx.lineTo(0,0);
    ctx.closePath();ctx.fill();
}

// ── HUD MÓDULO NÚMEROS DE CUATRO CIFRAS ───────────────────────
function drawHUD(){
    if(pregIdx>=preguntas.length) return;
    const hg=ctx.createLinearGradient(0,0,W,58);
    hg.addColorStop(0,'#0c0a09');hg.addColorStop(1,'#292524');
    ctx.fillStyle=hg;ctx.fillRect(0,0,W,58);
    ctx.strokeStyle='#eab308';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,58);ctx.lineTo(W,58);ctx.stroke();

    ctx.font=`11px ${FONT_MC}`;ctx.fillStyle='#facc15';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText("¡DESCUBRE LA COMBINACION DE LA ROCA DE ORO!",W/2,29);

    ctx.font='22px serif';ctx.textAlign='left';
    for(let i=0;i<vidas;i++) ctx.fillText('🤠',12+i*30,32); // Sombreros de explorador/minero

    ctx.font=`9px ${FONT_MC}`;ctx.fillStyle='#a8a29e';
    ctx.textAlign='right';
    ctx.fillText(`${aciertos}/${preguntas.length}`,W-12,29);
    ctx.fillStyle='#44403c';ctx.fillRect(W-120,40,108,10);
    ctx.fillStyle='#facc15';ctx.fillRect(W-120,40,108*(aciertos/preguntas.length),10);
}

function drawFlash(){
    if(!flash||flashT<=0)return;
    ctx.globalAlpha=Math.min(1,flashT/20);
    ctx.font=`13px ${FONT_MC}`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=flash.includes('MINADO')?'#facc15':'#f87171';
    ctx.fillText(flash,W*0.32,H/2-60);
    ctx.globalAlpha=1;flashT--;
}

// ── PANTALLAS DE CONTROL ──────────────────────────────────────
function drawPausa(){
    ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#292524';
    ctx.beginPath();ctx.roundRect(W/2-180,H/2-90,360,180,6);ctx.fill();
    ctx.strokeStyle='#eab308';ctx.lineWidth=3;ctx.stroke();
    ctx.font=`16px ${FONT_MC}`;ctx.fillStyle='#facc15';
    ctx.textAlign='center';
    ctx.fillText('⏸  MINA EN PAUSA',W/2,H/2-30);
    ctx.font=`9px ${FONT_MC}`;ctx.fillStyle='#a8a29e';
    ctx.fillText('Pulsa P para retomar los rieles',W/2,H/2+20);
}

function drawFinal(){
    ctx.fillStyle='rgba(0,0,0,0.9)';ctx.fillRect(0,0,W,H);
    ctx.font=`20px ${FONT_MC}`;
    ctx.fillStyle=ganado?'#facc15':'#f87171';
    ctx.textAlign='center';
    ctx.fillText(ganado?'¡VAGON DE ORO LLENO!':'MINA SIN ENERGIA...',W/2,H/2-50);
    ctx.font=`10px ${FONT_MC}`;ctx.fillStyle='#d6d3d1';
    ctx.fillText(`ROCAS DESCIFRADAS: ${aciertos} DE ${preguntas.length}`,W/2,H/2);
    
    const bx=W/2-110,by=H/2+55;
    ctx.fillStyle='#eab308';ctx.beginPath();ctx.roundRect(bx,by,220,44,6);ctx.fill();
    ctx.font=`10px ${FONT_MC}`;ctx.fillStyle='#1c1917';
    ctx.fillText('VOLVER A ENTRAR',W/2,by+26);
}

async function guardar(){
    if(guardado)return;guardado=true;
    try{
        await fetch('/guardar_progreso',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({unidad:305,aciertos,total:preguntas.length,puntaje:Math.round(aciertos/preguntas.length*100)})});
    }catch(e){}
}

// ── ACCION DE SELECCION ───────────────────────────────────────
function elegirCartelMina(idx){
    if(gameOver||pausandoCambio||paused||carritoAvanza) return;
    const c=carteles[idx];if(!c||c.elegido||c.xOffset>0) return;
    c.elegido=true;

    if(c.correcta){
        aciertos++; if(typeof Sonidos!=='undefined') Sonidos.correcto();
        flash='¡CODIGO MINADO CON EXGITO!';flashT=60;
        carritoAvanza=true;
    } else {
        vidas--; if(typeof Sonidos!=='undefined') Sonidos.incorrecto();
        boomOro(c.x,c.y,'#f87171',15);
        flash='¡FALLA EN EL CODIGO! -1 CASCO';flashT=60;
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

// ── ENGINE LOOP ───────────────────────────────────────────────
function loop(){
    tick++;
    if(!paused&&!gameOver){
        if(carritoAvanza){
            // El vagon acelera por la vía hacia la roca
            carrito.x += 11;
            // Detectar impacto con el centro de la roca objetivo (W * 0.32)
            if(carrito.x >= W*0.32 - 40 && !rocaRota){
                rocaRota=true;
                boomOro(W*0.32, H-140, '#facc15', 35); // Espectacular lluvia de oro puro
                flash='¡ROCA ROMPIDA! +1 ORO';
            }
            // Continuar viaje fuera de pantalla hacia los carteles
            if(carrito.x > W + 100){
                pregIdx++;
                rocaRota=false;
                carritoAvanza=false;
                carrito.x=carrito.xBase;
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
    drawCavernaBg();
    drawRieles();
    tickP();drawP();
    drawRocaObjetivo();
    carteles.forEach(drawCartelMina);
    drawCarritoMinero(carrito.x);

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
    rocaRota=false;carritoAvanza=false;
    carrito.x=carrito.xBase;
    crearCarteles();
}

document.addEventListener('keydown',e=>{
    if((e.key==='p'||e.key==='P')&&!gameOver) paused=!paused;
});

canvas.addEventListener('mousemove',e=>{
    if(gameOver||pausandoCambio||paused||carritoAvanza){canvas.style.cursor='default';return;}
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
    if(idx>=0) elegirCartelMina(idx);
});

crearCarteles();
loop();