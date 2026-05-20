// ============================================================
//  RETOMATE · Grado 3 · Módulo 3: Todas las Tablas
//  Juego: El zorrito maneja un camión de cemento por la obra.
//  En cada semáforo aparece una tabla. Elige el cartel
//  con la respuesta correcta para que el semáforo abra.
//  ✅ Fuente Minecraftia · Pausa con P · Temática construcción
//  ✅ Mecánica diferente: semáforos con carteles laterales
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

// ── PREGUNTAS (todas las tablas del 1 al 10) ──────────────────
const preguntas = [
    { q:'1 × 7 = ?',  r:'7',   ops:['6','7','8']    },
    { q:'2 × 8 = ?',  r:'16',  ops:['14','16','18'] },
    { q:'3 × 6 = ?',  r:'18',  ops:['15','18','21'] },
    { q:'4 × 7 = ?',  r:'28',  ops:['24','28','32'] },
    { q:'5 × 9 = ?',  r:'45',  ops:['40','45','50'] },
    { q:'6 × 8 = ?',  r:'48',  ops:['42','48','54'] },
    { q:'7 × 7 = ?',  r:'49',  ops:['42','49','56'] },
    { q:'8 × 6 = ?',  r:'48',  ops:['40','48','56'] },
    { q:'9 × 9 = ?',  r:'81',  ops:['72','81','90'] },
    { q:'10 × 7 = ?', r:'70',  ops:['60','70','80'] },
];

// ── ESTADO ────────────────────────────────────────────────────
let pregIdx=0, aciertos=0, vidas=3;
let gameOver=false, ganado=false, guardado=false;
let flash='', flashT=0, tick=0;
let paused=false, pausandoCambio=false;
let semaforoAbierto=false; // cuando se responde correcto, semáforo abre
let semaforoTimer=0;       // frames que el semáforo permanece verde
let camionAvanza=false;    // el camión pasa cuando semáforo abre

// ── CAMIÓN ────────────────────────────────────────────────────
const camion = {
    x: 80,          // posición actual
    xBase: 80,      // posición de espera
    xMeta: W+200,   // sale de pantalla al responder bien
    vel: 0,
};

// ── CARTELES DE RESPUESTA ─────────────────────────────────────
let carteles=[];
const COL_CARTEL=[
    {fondo:'#1e3a5f',borde:'#3b82f6',txt:'#bae6fd',hover:'#2563eb'},
    {fondo:'#14532d',borde:'#22c55e',txt:'#bbf7d0',hover:'#16a34a'},
    {fondo:'#7f1d1d',borde:'#ef4444',txt:'#fecaca',hover:'#dc2626'},
];
// Carteles a derecha del semáforo, altura escalonada
const CARTEL_POS=[
    {x:W*0.55, y:220},
    {x:W*0.55, y:310},
    {x:W*0.55, y:400},
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
            w:180, h:60,
            valor:val, correcta:val===p.r,
            col:COL_CARTEL[i],
            hover:false, elegido:false,
            // Entrada animada desde la derecha
            xOffset: 300,
        });
    });
    semaforoAbierto=false;
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

// ── CAMIÓN DE CEMENTO ─────────────────────────────────────────
function drawCamion(x){
    const y=H-120;
    const ruedaAnim=camionAvanza?Math.sin(tick*0.25)*3:0;
    ctx.save();ctx.translate(x,y);

    // Sombra
    ctx.fillStyle='rgba(0,0,0,0.2)';
    ctx.beginPath();ctx.ellipse(80,48,80,10,0,0,Math.PI*2);ctx.fill();

    // Chasis
    ctx.fillStyle='#dc2626';
    ctx.beginPath();ctx.roundRect(0,10,160,38,4);ctx.fill();
    ctx.fillStyle='#b91c1c';
    ctx.fillRect(0,10,160,8);

    // Cabina
    ctx.fillStyle='#ef4444';
    ctx.beginPath();ctx.roundRect(110,0,50,48,6);ctx.fill();
    ctx.fillStyle='#b91c1c';ctx.fillRect(110,0,50,8);

    // Parabrisas
    ctx.fillStyle='rgba(186,230,253,0.85)';
    ctx.beginPath();ctx.roundRect(116,6,38,22,4);ctx.fill();
    ctx.strokeStyle='#7f1d1d';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.3)';
    ctx.fillRect(118,8,8,8);

    // Tambor de cemento (cilindro rotatorio)
    const rot=camionAvanza?tick*0.08:0;
    ctx.save();ctx.translate(65,16);
    ctx.fillStyle='#64748b';
    ctx.beginPath();ctx.ellipse(0,0,45,18,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#475569';
    ctx.beginPath();ctx.ellipse(0,0,45,18,rot,0,Math.PI*2);
    // Espirales del tambor
    for(let s=0;s<3;s++){
        const a=rot+s*(Math.PI*2/3);
        ctx.fillStyle='rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*30,Math.sin(a)*12);
        ctx.lineTo(Math.cos(a+0.5)*40,Math.sin(a+0.5)*16);
        ctx.lineTo(Math.cos(a+0.8)*38,Math.sin(a+0.8)*15);
        ctx.lineTo(Math.cos(a+0.3)*28,Math.sin(a+0.3)*11);
        ctx.closePath();ctx.fill();
    }
    ctx.strokeStyle='#334155';ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(0,0,45,18,0,0,Math.PI*2);ctx.stroke();
    // Tapa lateral
    ctx.fillStyle='#94a3b8';
    ctx.beginPath();ctx.ellipse(45,0,8,18,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#334155';ctx.lineWidth=2;ctx.stroke();
    ctx.restore();

    // Ruedas
    [30,130].forEach((rx,ri)=>{
        ctx.fillStyle='#1e293b';
        ctx.beginPath();ctx.arc(rx,46+ruedaAnim*(ri===0?1:-1),16,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#374151';
        ctx.beginPath();ctx.arc(rx,46+ruedaAnim*(ri===0?1:-1),10,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#94a3b8';
        ctx.beginPath();ctx.arc(rx,46+ruedaAnim*(ri===0?1:-1),4,0,Math.PI*2);ctx.fill();
        // Rayos
        ctx.strokeStyle='#94a3b8';ctx.lineWidth=2;
        for(let r2=0;r2<4;r2++){
            const a=tick*0.1*(camionAvanza?1:0)+r2*Math.PI/2;
            ctx.beginPath();
            ctx.moveTo(rx+Math.cos(a)*4,46+Math.cos(a)*4+ruedaAnim*(ri===0?1:-1));
            ctx.lineTo(rx+Math.cos(a)*11,46+Math.sin(a)*11+ruedaAnim*(ri===0?1:-1));
            ctx.stroke();
        }
    });

    // Zorrito dentro de la cabina
    ctx.fillStyle='#f48c06';
    ctx.fillRect(128,10,10,8);
    ctx.fillStyle='#e85d04';
    ctx.fillRect(128,9,3,3);ctx.fillRect(135,9,3,3);
    ctx.fillStyle='#000';
    ctx.fillRect(130,12,2,2);ctx.fillRect(134,12,2,2);
    ctx.fillStyle='#fbbf24';
    ctx.fillRect(127,9,12,3); // casco mini

    // Matrícula
    ctx.fillStyle='white';ctx.fillRect(5,38,30,10);
    ctx.font=`5px ${FONT_MC}`;ctx.fillStyle='#1e293b';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('OBRA-3',20,43);

    ctx.restore();
}

// ── SEMÁFORO DE OBRA ─────────────────────────────────────────
function drawSemaforo(){
    const sx=W*0.38, sy=H-280;

    // Poste
    ctx.fillStyle='#374151';
    ctx.fillRect(sx-8,sy,16,H-62-sy);
    // Base
    ctx.fillStyle='#1f2937';
    ctx.fillRect(sx-20,H-80,40,18);

    // Caja del semáforo
    ctx.fillStyle='#1e293b';
    ctx.beginPath();ctx.roundRect(sx-22,sy-10,44,100,6);ctx.fill();
    ctx.strokeStyle='#374151';ctx.lineWidth=2;ctx.stroke();

    // Luces
    const rojo    = !semaforoAbierto;
    const verde   = semaforoAbierto;
    const amarillo= semaforoTimer>0&&semaforoTimer<30;

    // Rojo
    ctx.fillStyle=rojo?'#ef4444':'#450a0a';
    ctx.shadowColor=rojo?'rgba(239,68,68,0.8)':'transparent';
    ctx.shadowBlur=rojo?15:0;
    ctx.beginPath();ctx.arc(sx,sy+18,14,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;

    // Amarillo
    ctx.fillStyle=amarillo?'#fbbf24':'#451a03';
    ctx.shadowColor=amarillo?'rgba(251,191,36,0.8)':'transparent';
    ctx.shadowBlur=amarillo?15:0;
    ctx.beginPath();ctx.arc(sx,sy+48,14,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;

    // Verde
    ctx.fillStyle=verde?'#22c55e':'#052e16';
    ctx.shadowColor=verde?'rgba(34,197,94,0.8)':'transparent';
    ctx.shadowBlur=verde?15:0;
    ctx.beginPath();ctx.arc(sx,sy+78,14,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;

    // Barrera de obra (baja/sube)
    const barrY=H-90;
    const barrLen=semaforoAbierto?20:130;
    const barrAngle=semaforoAbierto?-Math.PI/2.5:0;
    ctx.save();ctx.translate(sx,barrY);ctx.rotate(barrAngle);
    // Barra
    for(let i=0;i<barrLen;i+=20){
        ctx.fillStyle=i%40===0?'#f97316':'white';
        ctx.fillRect(i,0,20,8);
    }
    ctx.strokeStyle='rgba(0,0,0,0.3)';ctx.lineWidth=1;
    ctx.strokeRect(0,0,barrLen,8);
    ctx.restore();
    // Soporte barrera
    ctx.fillStyle='#374151';
    ctx.fillRect(sx-4,barrY-14,8,14);
}

// ── DIBUJAR CARTEL DE OPCIÓN ──────────────────────────────────
function drawCartel(c){
    // Entrada animada
    if(c.xOffset>0) c.xOffset=Math.max(0,c.xOffset-18);
    const rx=c.x-c.xOffset, ry=c.y;
    const {w,h,col,hover,valor}=c;
    const elev=hover?-6:0;

    ctx.save();

    // Poste del cartel
    ctx.fillStyle='#374151';
    ctx.fillRect(rx-4,ry+h/2-elev,8,H-62-(ry+h/2));

    // Sombra
    ctx.fillStyle='rgba(0,0,0,0.25)';
    ctx.beginPath();ctx.roundRect(rx-w/2+4,ry-h/2+6-elev,w,h,6);ctx.fill();

    // Fondo cartel
    ctx.fillStyle=hover?col.hover:col.fondo;
    ctx.beginPath();ctx.roundRect(rx-w/2,ry-h/2-elev,w,h,6);ctx.fill();

    // Borde
    ctx.strokeStyle=col.borde;ctx.lineWidth=hover?3:2;
    ctx.beginPath();ctx.roundRect(rx-w/2,ry-h/2-elev,w,h,6);ctx.stroke();

    // Tornillos en esquinas
    [[rx-w/2+8,ry-h/2-elev+8],[rx+w/2-8,ry-h/2-elev+8],
     [rx-w/2+8,ry+h/2-elev-8],[rx+w/2-8,ry+h/2-elev-8]].forEach(([bx,by])=>{
        ctx.fillStyle='#94a3b8';ctx.beginPath();ctx.arc(bx,by,4,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#334155';ctx.lineWidth=1;ctx.stroke();
    });

    // Número
    ctx.font=`bold 20px ${FONT_MC}`;
    ctx.fillStyle=col.txt;
    ctx.shadowColor='rgba(0,0,0,0.7)';ctx.shadowBlur=6;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(String(valor),rx,ry-elev);
    ctx.shadowBlur=0;

    // "ELEGIR" hover
    if(hover&&c.xOffset===0){
        ctx.font=`7px ${FONT_MC}`;ctx.fillStyle='#fbbf24';
        ctx.shadowColor='rgba(0,0,0,0.7)';ctx.shadowBlur=4;
        ctx.fillText('ELEGIR',rx,ry-h/2-elev-12);
        ctx.shadowBlur=0;
    }

    // Flecha apuntando al semáforo
    ctx.fillStyle=col.borde;ctx.globalAlpha=hover?1:0.6;
    ctx.beginPath();
    ctx.moveTo(rx-w/2-8,ry-elev);
    ctx.lineTo(rx-w/2,ry-elev-10);
    ctx.lineTo(rx-w/2,ry-elev+10);
    ctx.closePath();ctx.fill();
    ctx.globalAlpha=1;

    ctx.restore();
}

// ── FONDO CARRETERA DE OBRA ───────────────────────────────────
const EDIFICIOS_BG=[
    {x:0,w:70,h:180,col:'#1e293b'},{x:75,w:50,h:140,col:'#334155'},
    {x:130,w:80,h:220,col:'#1e293b'},{x:580,w:90,h:190,col:'#334155'},
    {x:675,w:60,h:160,col:'#1e293b'},{x:740,w:80,h:240,col:'#0f172a'},
    {x:825,w:40,h:150,col:'#334155'},
];
const ESTRELLAS=Array.from({length:40},()=>({
    x:Math.random()*W,y:Math.random()*(H*0.4),
    r:0.5+Math.random()*1.5,b:Math.random()*Math.PI*2,
}));
const NUBES_POLVO=Array.from({length:4},()=>({
    x:Math.random()*W,y:H*0.5+Math.random()*H*0.1,
    r:25+Math.random()*35,vel:camionAvanza?0.8:0.2,
}));
// Líneas de carretera (se mueven con el camión)
let roadOffset=0;

function drawFondo(){
    const sky=ctx.createLinearGradient(0,0,0,H*0.6);
    sky.addColorStop(0,'#0f172a');sky.addColorStop(0.6,'#1e293b');sky.addColorStop(1,'#334155');
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);

    const moonG=ctx.createRadialGradient(W*0.88,55,4,W*0.88,55,28);
    moonG.addColorStop(0,'#fef9c3');moonG.addColorStop(0.7,'#fde68a');moonG.addColorStop(1,'rgba(253,230,138,0)');
    ctx.fillStyle=moonG;ctx.beginPath();ctx.arc(W*0.88,55,28,0,Math.PI*2);ctx.fill();

    ESTRELLAS.forEach(s=>{
        const br=0.3+0.7*Math.sin(tick*0.04+s.b);
        ctx.globalAlpha=br;ctx.fillStyle='white';
        ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
    });
    ctx.globalAlpha=1;

    EDIFICIOS_BG.forEach(e=>{
        ctx.fillStyle=e.col;ctx.fillRect(e.x,H-62-e.h,e.w,e.h);
        for(let wy=H-62-e.h+15;wy<H-62-15;wy+=22)
            for(let wx=e.x+8;wx<e.x+e.w-14;wx+=18)
                if(Math.random()>0.4){
                    ctx.fillStyle=Math.random()>0.5?'#fde68a':'#bae6fd';
                    ctx.fillRect(wx,wy,10,14);
                }
    });

    NUBES_POLVO.forEach(n=>{
        if(camionAvanza) n.x=(n.x-1+W)%W;
        else n.x=(n.x+n.vel)%(W+100);
        ctx.save();ctx.globalAlpha=0.1;ctx.fillStyle='#d4b483';
        ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fill();ctx.restore();
    });

    // Carretera
    const suelo=ctx.createLinearGradient(0,H-62,0,H);
    suelo.addColorStop(0,'#374151');suelo.addColorStop(1,'#1f2937');
    ctx.fillStyle=suelo;ctx.fillRect(0,H-62,W,62);

    // Líneas de carretera animadas
    if(camionAvanza) roadOffset=(roadOffset+4)%80;
    ctx.strokeStyle='#fbbf24';ctx.lineWidth=3;ctx.setLineDash([40,40]);
    ctx.lineDashOffset=-roadOffset;
    ctx.beginPath();ctx.moveTo(0,H-30);ctx.lineTo(W,H-30);ctx.stroke();
    ctx.setLineDash([]);ctx.lineDashOffset=0;

    // Conos
    [200,350,680,780].forEach(cx=>{
        ctx.fillStyle='#f97316';
        ctx.beginPath();ctx.moveTo(cx,H-62);ctx.lineTo(cx-10,H-40);ctx.lineTo(cx+10,H-40);ctx.closePath();ctx.fill();
        ctx.fillStyle='white';ctx.fillRect(cx-8,H-52,16,4);
        ctx.fillStyle='#64748b';ctx.fillRect(cx-12,H-40,24,5);
    });

    // Cartel de obra en la pared izquierda
    ctx.fillStyle='#f59e0b';
    ctx.beginPath();ctx.roundRect(8,H-200,90,50,4);ctx.fill();
    ctx.fillStyle='#1e293b';
    ctx.font=`7px ${FONT_MC}`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('ZONA DE',53,H-185);ctx.fillText('OBRA',53,H-170);
    ctx.fillStyle='#dc2626';ctx.font='16px serif';
    ctx.fillText('⚠️',53,H-155);
}

// ── HUD ──────────────────────────────────────────────────────
function drawHUD(){
    if(pregIdx>=preguntas.length) return;
    const p=preguntas[pregIdx];
    const hg=ctx.createLinearGradient(0,0,W,58);
    hg.addColorStop(0,'rgba(15,23,42,0.97)');hg.addColorStop(1,'rgba(30,41,59,0.97)');
    ctx.fillStyle=hg;ctx.fillRect(0,0,W,58);
    ctx.strokeStyle='#f59e0b';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,58);ctx.lineTo(W,58);ctx.stroke();

    ctx.font=`16px ${FONT_MC}`;ctx.fillStyle='#fbbf24';
    ctx.shadowColor='rgba(251,191,36,0.5)';ctx.shadowBlur=10;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(p.q,W/2,29);ctx.shadowBlur=0;

    ctx.font='22px serif';ctx.textAlign='left';
    for(let i=0;i<vidas;i++) ctx.fillText('⛑️',12+i*30,32);

    ctx.font=`9px ${FONT_MC}`;ctx.fillStyle='#94a3b8';
    ctx.textAlign='right';ctx.textBaseline='middle';
    ctx.fillText(`${aciertos}/${preguntas.length}`,W-12,29);
    ctx.fillStyle='#1e293b';ctx.fillRect(W-120,40,108,10);
    ctx.fillStyle='#f59e0b';ctx.fillRect(W-120,40,108*(aciertos/preguntas.length),10);
    ctx.strokeStyle='#64748b';ctx.lineWidth=1;ctx.strokeRect(W-120,40,108,10);

    ctx.fillStyle='rgba(15,23,42,0.88)';ctx.fillRect(0,H-24,W,24);
    ctx.font=`8px ${FONT_MC}`;ctx.fillStyle='#94a3b8';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('CLIC EN EL CARTEL CON LA RESPUESTA CORRECTA PARA ABRIR EL SEMAFORO  |  P = PAUSA',W/2,H-12);
}

// ── FLASH ────────────────────────────────────────────────────
function drawFlash(){
    if(!flash||flashT<=0)return;
    ctx.globalAlpha=Math.min(1,flashT/20);
    ctx.font=`14px ${FONT_MC}`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor='rgba(0,0,0,0.6)';ctx.shadowBlur=12;
    ctx.fillStyle=flash.includes('CORRECTO')?'#22c55e':'#f87171';
    ctx.fillText(flash,W/2,H/2-50);
    ctx.shadowBlur=0;ctx.globalAlpha=1;flashT--;
}

// ── PANTALLA PAUSA ────────────────────────────────────────────
function drawPausa(){
    ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#1e293b';
    ctx.beginPath();ctx.roundRect(W/2-200,H/2-110,400,220,8);ctx.fill();
    ctx.strokeStyle='#f59e0b';ctx.lineWidth=3;ctx.stroke();
    ctx.font=`18px ${FONT_MC}`;ctx.fillStyle='#fbbf24';
    ctx.shadowColor='rgba(251,191,36,0.5)';ctx.shadowBlur=12;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('⏸  PAUSA',W/2,H/2-68);ctx.shadowBlur=0;
    ctx.font=`9px ${FONT_MC}`;ctx.fillStyle='#94a3b8';
    ctx.fillText(`PREGUNTA ${pregIdx+1} DE ${preguntas.length}`,W/2,H/2-35);
    ctx.fillStyle='#64748b';ctx.fillRect(W/2-160,H/2-20,320,1);
    [`ACIERTOS  :  ${aciertos}`,`VIDAS     :  ${vidas}`,`PUNTAJE   :  ${Math.round(aciertos/preguntas.length*100)}%`]
        .forEach((l,i)=>{ctx.font=`9px ${FONT_MC}`;ctx.fillStyle='#cbd5e1';ctx.fillText(l,W/2,H/2+10+i*26);});
    const bx=W/2-100,by=H/2+75;
    ctx.fillStyle='#f59e0b';ctx.beginPath();ctx.roundRect(bx,by,200,40,6);ctx.fill();
    ctx.font=`10px ${FONT_MC}`;ctx.fillStyle='#1e293b';ctx.textBaseline='middle';
    ctx.fillText('PRESIONA P PARA CONTINUAR',W/2,by+20);
}

// ── PANTALLA FINAL ───────────────────────────────────────────
function drawFinal(){
    ctx.fillStyle='rgba(0,0,0,0.82)';ctx.fillRect(0,0,W,H);
    ctx.font=`20px ${FONT_MC}`;
    ctx.fillStyle=ganado?'#fbbf24':'#f87171';
    ctx.shadowColor=ganado?'rgba(251,191,36,0.6)':'rgba(248,113,113,0.6)';ctx.shadowBlur=18;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(ganado?'!RUTA COMPLETADA!':'CAMION DETENIDO...',W/2,H/2-60);
    ctx.shadowBlur=0;
    ctx.font=`10px ${FONT_MC}`;ctx.fillStyle='#cbd5e1';
    ctx.fillText(`TABLAS CORRECTAS: ${aciertos} DE ${preguntas.length}`,W/2,H/2-15);
    ctx.fillText(`PUNTAJE FINAL: ${Math.round(aciertos/preguntas.length*100)}%`,W/2,H/2+18);
    const bx=W/2-110,by=H/2+55;
    ctx.fillStyle='#f59e0b';ctx.beginPath();ctx.roundRect(bx,by,220,44,6);ctx.fill();
    ctx.font=`10px ${FONT_MC}`;ctx.fillStyle='#1e293b';ctx.textBaseline='middle';
    ctx.fillText('JUGAR DE NUEVO',W/2,by+22);
}

// ── GUARDAR ──────────────────────────────────────────────────
async function guardar(){
    if(guardado)return;guardado=true;
    try{
        await fetch('/guardar_progreso',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({unidad:303,aciertos,total:preguntas.length,puntaje:Math.round(aciertos/preguntas.length*100)})});
    }catch(e){}
}

// ── ELEGIR CARTEL ─────────────────────────────────────────────
function elegirCartel(idx){
    if(gameOver||pausandoCambio||paused||semaforoAbierto) return;
    const c=carteles[idx];if(!c||c.elegido||c.xOffset>0) return;
    c.elegido=true;

    if(c.correcta){
        aciertos++;Sonidos.correcto();
        boom(c.x,c.y,'#22c55e',20);boom(c.x,c.y,'#fbbf24',12);
        flash='!CORRECTO! SEMAFORO VERDE';flashT=55;
        semaforoAbierto=true;
        semaforoTimer=90; // 1.5 segundos a 60fps
        camionAvanza=true;
    } else {
        vidas--;Sonidos.incorrecto();
        boom(c.x,c.y,'#f87171',18);
        flash='INCORRECTO! -1 VIDA';flashT=55;
        if(vidas<=0){gameOver=true;ganado=false;Sonidos.perder();guardar();}
        else{
            // Recrear carteles sin pausar para que intente de nuevo
            pausandoCambio=true;
            setTimeout(()=>{crearCarteles();pausandoCambio=false;},1200);
        }
    }
}

// ── DETECTAR CARTEL BAJO CURSOR ───────────────────────────────
function getCartelEnPos(mx,my){
    for(let i=0;i<carteles.length;i++){
        const c=carteles[i];
        if(c.xOffset>0) continue; // aún animando entrada
        const rx=c.x;
        if(mx>=rx-c.w/2&&mx<=rx+c.w/2&&my>=c.y-c.h/2-8&&my<=c.y+c.h/2+8) return i;
    }
    return -1;
}
function canvasPos(e){
    const r=canvas.getBoundingClientRect();
    return {x:(e.clientX-r.left)*(W/r.width),y:(e.clientY-r.top)*(H/r.height)};
}

// ── LOOP ─────────────────────────────────────────────────────
function loop(){
    tick++;

    // Lógica semáforo y avance del camión
    if(!paused&&!gameOver){
        if(semaforoAbierto){
            semaforoTimer--;
            // Camión avanza
            if(camionAvanza){
                camion.x+=5;
                // Cuando sale de pantalla, siguiente pregunta
                if(camion.x>W+220){
                    pregIdx++;
                    semaforoAbierto=false;
                    camionAvanza=false;
                    camion.x=camion.xBase;
                    if(pregIdx>=preguntas.length){
                        gameOver=true;
                        ganado=aciertos>=Math.ceil(preguntas.length*0.6);
                        if(ganado)Sonidos.ganar();else Sonidos.perder();
                        guardar();
                    } else {
                        pausandoCambio=true;
                        setTimeout(()=>{crearCarteles();pausandoCambio=false;},400);
                    }
                }
            }
            if(semaforoTimer<=0){
                semaforoAbierto=false;
            }
        }
    }

    ctx.clearRect(0,0,W,H);
    drawFondo();
    tickP();drawP();
    drawSemaforo();
    carteles.forEach(drawCartel);
    drawCamion(camion.x);

    if(!gameOver){
        drawHUD();drawFlash();
        if(paused) drawPausa();
    } else {
        drawFinal();
        if(ganado&&tick%4===0)
            boom(Math.random()*W,Math.random()*H*0.6,
                ['#fbbf24','#22c55e','#f59e0b','#94a3b8'][Math.floor(Math.random()*4)],4);
    }
    requestAnimationFrame(loop);
}

// ── REINICIAR ────────────────────────────────────────────────
function reiniciar(){
    pregIdx=0;aciertos=0;vidas=3;gameOver=false;ganado=false;guardado=false;
    flash='';flashT=0;particulas=[];pausandoCambio=false;paused=false;
    semaforoAbierto=false;semaforoTimer=0;camionAvanza=false;
    camion.x=camion.xBase;roadOffset=0;
    crearCarteles();
}

// ── PAUSA ────────────────────────────────────────────────────
document.addEventListener('keydown',e=>{
    if((e.key==='p'||e.key==='P')&&!gameOver) paused=!paused;
});

// ── EVENTOS ──────────────────────────────────────────────────
canvas.addEventListener('mousemove',e=>{
    if(gameOver||pausandoCambio||paused||semaforoAbierto){canvas.style.cursor='default';return;}
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
canvas.addEventListener('touchend',e=>{
    e.preventDefault();
    const t=e.changedTouches[0],r=canvas.getBoundingClientRect();
    const x=(t.clientX-r.left)*(W/r.width),y=(t.clientY-r.top)*(H/r.height);
    if(gameOver){if(x>W/2-110&&x<W/2+110&&y>H/2+55&&y<H/2+99)reiniciar();return;}
    if(paused)return;
    let mejor=-1,mejorDist=9999;
    carteles.forEach((c,i)=>{
        if(c.xOffset>0)return;
        const d=Math.hypot(x-c.x,y-c.y);
        if(d<100&&d<mejorDist){mejorDist=d;mejor=i;}
    });
    if(mejor>=0) elegirCartel(mejor);
},{passive:false});

let _au=false;
function _ia(){if(!_au){_au=true;Sonidos.iniciar(3);}}
canvas.addEventListener('click',_ia);
canvas.addEventListener('touchstart',_ia,{passive:true});
document.addEventListener('keydown',_ia,{once:true});

crearCarteles();
loop();