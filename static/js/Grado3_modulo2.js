// ============================================================
//  RETOMATE · Grado 3 · Módulo 2: División Exacta
//  Juego: El zorrito capataz reparte materiales en cajas.
//  Elige la caja con el cociente correcto.
//  ✅ Fuente Minecraftia · Pausa con P · Temática construcción
//  ✅ Sistema de clic · Mismo estilo que Módulo 1
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

// ── PREGUNTAS ─────────────────────────────────────────────────
const preguntas = [
    { q:'12 ÷ 3 = ?',  r:'4',  ops:['3','4','6']   },
    { q:'20 ÷ 4 = ?',  r:'5',  ops:['4','5','6']   },
    { q:'18 ÷ 6 = ?',  r:'3',  ops:['2','3','4']   },
    { q:'35 ÷ 5 = ?',  r:'7',  ops:['6','7','8']   },
    { q:'24 ÷ 8 = ?',  r:'3',  ops:['2','3','4']   },
    { q:'36 ÷ 9 = ?',  r:'4',  ops:['3','4','5']   },
    { q:'42 ÷ 7 = ?',  r:'6',  ops:['5','6','7']   },
    { q:'30 ÷ 6 = ?',  r:'5',  ops:['4','5','6']   },
    { q:'48 ÷ 8 = ?',  r:'6',  ops:['5','6','7']   },
    { q:'63 ÷ 9 = ?',  r:'7',  ops:['6','7','8']   },
];

// ── ESTADO ────────────────────────────────────────────────────
let pregIdx=0, aciertos=0, vidas=3;
let gameOver=false, ganado=false, guardado=false;
let flash='', flashT=0, tick=0;
let paused=false, pausandoCambio=false;
let cajasLlenas=0;

// ── CAJAS DE OPCIÓN ───────────────────────────────────────────
let cajas=[];
const COL_CAJA=[
    {cara:'#f59e0b',borde:'#b45309',top:'#fde68a',sombra:'#92400e'},
    {cara:'#64748b',borde:'#334155',top:'#94a3b8',sombra:'#1e293b'},
    {cara:'#dc2626',borde:'#7f1d1d',top:'#f87171',sombra:'#450a0a'},
];
const CAJA_POS=[{x:160,y:360},{x:430,y:360},{x:700,y:360}];

function crearCajas(){
    cajas=[];
    if(pregIdx>=preguntas.length) return;
    const p=preguntas[pregIdx];
    const ops=[...p.ops];
    for(let i=ops.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [ops[i],ops[j]]=[ops[j],ops[i]];
    }
    ops.forEach((val,i)=>{
        cajas.push({
            x:CAJA_POS[i].x, y:CAJA_POS[i].y,
            w:140, h:80,
            valor:val, correcta:val===p.r,
            col:COL_CAJA[i], hover:false, elegida:false,
        });
    });
}

// ── PARTÍCULAS ────────────────────────────────────────────────
let particulas=[];
function boom(x,y,col,n=18){
    for(let i=0;i<n;i++){
        const a=Math.random()*Math.PI*2,v=1.5+Math.random()*4;
        particulas.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-2,
            vida:1,dec:0.02+Math.random()*0.02,r:4+Math.random()*6,col,
            forma:Math.random()>0.5?'rect':'circ',rot:Math.random()*Math.PI*2,rvel:(Math.random()-0.5)*0.15});
    }
}
function tickP(){
    particulas=particulas.filter(p=>p.vida>0);
    particulas.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.12;p.vx*=0.97;p.vida-=p.dec;p.rot+=p.rvel;});
}
function drawP(){
    particulas.forEach(p=>{
        ctx.save();ctx.globalAlpha=p.vida;ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.col;
        if(p.forma==='rect')ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r);
        else{ctx.beginPath();ctx.arc(0,0,p.r/2,0,Math.PI*2);ctx.fill();}
        ctx.restore();
    });
}

// ── GRÚA ANIMADA (igual que módulo 1) ────────────────────────
let gruaY=-40, gruaDir=1;
const gruaX=W-120;

function drawGrua(){
    ctx.fillStyle='#f59e0b';
    ctx.fillRect(gruaX,80,20,H-80-60);
    for(let y=90;y<H-60;y+=40){ctx.fillStyle='#1e293b';ctx.fillRect(gruaX,y,20,18);}
    ctx.fillStyle='#f59e0b';
    ctx.fillRect(gruaX-160,80,180,16);
    ctx.fillStyle='#334155';
    ctx.fillRect(gruaX+20,80,40,30);
    const cableY=96+gruaY;
    ctx.strokeStyle='#94a3b8';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(gruaX-60,96);ctx.lineTo(gruaX-60,Math.max(96,cableY));ctx.stroke();
    ctx.strokeStyle='#64748b';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(gruaX-60,Math.max(96,cableY)+10,8,0.2,Math.PI-0.2);ctx.stroke();
    if(gruaY>30){
        ctx.fillStyle='#f59e0b';
        ctx.fillRect(gruaX-80,cableY+18,40,22);
        ctx.fillStyle='rgba(0,0,0,0.25)';
        ctx.fillRect(gruaX-80,cableY+18,40,6);
    }
}

// ── PILAS DE MATERIALES REPARTIDOS (reemplaza edificio) ───────
function drawMaterialesRepartidos(){
    const base=H-62;
    const ex=50, ew=100, eh=32;

    // Plataforma base
    ctx.fillStyle='#78716c';ctx.fillRect(ex-10,base,ew+20,12);
    ctx.fillStyle='#57534e';ctx.fillRect(ex-10,base+12,ew+20,6);

    // Cajas apiladas por cada acierto
    for(let i=0;i<cajasLlenas;i++){
        const by=base-(i+1)*eh;
        // Caja apilada 3D
        const cg=ctx.createLinearGradient(ex,by,ex+ew,by);
        cg.addColorStop(0,'#92400e');cg.addColorStop(1,'#451a03');
        ctx.fillStyle=cg;ctx.fillRect(ex,by,ew,eh);
        // Tapa
        ctx.fillStyle='#b45309';ctx.fillRect(ex,by,ew,5);
        // Cruz caja
        ctx.strokeStyle='rgba(0,0,0,0.2)';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(ex+8,by+8);ctx.lineTo(ex+ew-8,by+eh-8);ctx.stroke();
        ctx.beginPath();ctx.moveTo(ex+ew-8,by+8);ctx.lineTo(ex+8,by+eh-8);ctx.stroke();
        // Borde
        ctx.strokeStyle='#1e293b';ctx.lineWidth=1;ctx.strokeRect(ex,by,ew,eh);
        // Lateral 3D
        ctx.fillStyle='#451a03';
        ctx.beginPath();ctx.moveTo(ex+ew,by);ctx.lineTo(ex+ew+10,by-8);ctx.lineTo(ex+ew+10,by+eh-8);ctx.lineTo(ex+ew,by+eh);ctx.closePath();ctx.fill();
        // Tope 3D
        ctx.fillStyle='#d97706';
        ctx.beginPath();ctx.moveTo(ex,by);ctx.lineTo(ex+10,by-8);ctx.lineTo(ex+ew+10,by-8);ctx.lineTo(ex+ew,by);ctx.closePath();ctx.fill();
        // Número de caja
        ctx.font=`7px ${FONT_MC}`;ctx.fillStyle='rgba(255,255,255,0.55)';
        ctx.textAlign='right';ctx.textBaseline='middle';
        ctx.fillText(`C${i+1}`,ex+ew-5,by+eh/2);
    }

    // Cartel "ALMACEN"
    ctx.font=`7px ${FONT_MC}`;ctx.fillStyle='#64748b';ctx.textAlign='center';
    ctx.fillText('ALMACEN',ex+ew/2,base+22);
}

// ── ZORRITO CAPATAZ (mismo pixel art que módulo 1 base) ───────
const zorro={x:220,y:H-130};

function drawZorritoCapataz(x,y){
    const bob=Math.sin(tick*0.07)*3;
    const by=y+bob;
    const P=4;
    ctx.save();ctx.translate(x,by);

    // Sombra
    ctx.fillStyle='rgba(0,0,0,0.18)';
    ctx.beginPath();ctx.ellipse(10*P,26*P,14*P,4*P,0,0,Math.PI*2);ctx.fill();

    // Cola
    const tail=Math.sin(tick*0.09)*4;
    ctx.fillStyle='#e76f51';ctx.fillRect(-6*P,12*P+tail,6*P,3*P);
    ctx.fillStyle='#f48c06';ctx.fillRect(-10*P,10*P+tail,4*P,3*P);
    ctx.fillStyle='#fff';ctx.fillRect(-12*P,9*P+tail,3*P,2*P);

    // Chaleco seguridad naranja con bandas
    ctx.fillStyle='#f97316';ctx.fillRect(4*P,8*P,12*P,12*P);
    ctx.fillStyle='#fef08a';
    ctx.fillRect(4*P,11*P,12*P,2*P);
    ctx.fillRect(4*P,16*P,12*P,2*P);
    ctx.fillStyle='#ea580c';ctx.fillRect(13*P,9*P,3*P,3*P);
    ctx.fillStyle='#fbbf24';ctx.fillRect(14*P,8*P,1*P,2*P);

    // Cabeza
    ctx.fillStyle='#f48c06';ctx.fillRect(4*P,1*P,12*P,9*P);
    ctx.fillStyle='#e85d04';
    ctx.fillRect(4*P,-1*P,3*P,3*P);ctx.fillRect(13*P,-1*P,3*P,3*P);

    // Casco amarillo
    ctx.fillStyle='#fbbf24';
    ctx.fillRect(2*P,0,16*P,3*P);ctx.fillRect(5*P,-5*P,10*P,6*P);
    ctx.fillStyle='#f59e0b';ctx.fillRect(5*P,-5*P,10*P,2*P);
    ctx.fillStyle='#92400e';
    ctx.fillRect(4*P,3*P,2*P,2*P);ctx.fillRect(14*P,3*P,2*P,2*P);

    // Ojos
    ctx.fillStyle='#000';
    ctx.fillRect(7*P,4*P,2*P,2*P);ctx.fillRect(13*P,4*P,2*P,2*P);
    ctx.fillStyle='white';
    ctx.fillRect(8*P,4*P,1*P,1*P);ctx.fillRect(14*P,4*P,1*P,1*P);
    // Boca
    ctx.fillStyle='#000';
    ctx.fillRect(9*P,7*P,4*P,1*P);

    // Pantalón y botas
    ctx.fillStyle='#1e3a5f';ctx.fillRect(5*P,18*P,10*P,6*P);
    ctx.fillStyle='#422006';
    ctx.fillRect(4*P,23*P,6*P,3*P);ctx.fillRect(10*P,23*P,6*P,3*P);
    ctx.fillStyle='#713f12';
    ctx.fillRect(4*P,23*P,6*P,1*P);ctx.fillRect(10*P,23*P,6*P,1*P);

    // Brazo con tablilla (clipboard)
    ctx.fillStyle='#f48c06';ctx.fillRect(2*P,8*P,3*P,7*P);
    ctx.fillStyle='#d97706';ctx.fillRect(-2*P,10*P,5*P,7*P);
    ctx.fillStyle='#fef9c3';ctx.fillRect(-1*P,12*P,4*P,5*P);
    ctx.fillStyle='#94a3b8';
    ctx.fillRect(0,12*P,3*P,1*P);ctx.fillRect(0,14*P,3*P,1*P);ctx.fillRect(0,16*P,2*P,1*P);
    // Brazo derecho
    ctx.fillStyle='#f48c06';ctx.fillRect(15*P,8*P,3*P,7*P);

    ctx.restore();
}

// ── DIBUJAR CAJA 3D (mismo estilo ladrillo que módulo 1) ──────
function drawCaja(b){
    const {x,y,w,h,col,hover,valor}=b;
    const elev=hover?-8:0;
    ctx.save();

    // Sombra
    ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(x-w/2+5,y-h/2+8-elev,w,h);

    // Cara lateral 3D
    ctx.fillStyle=col.sombra;
    ctx.beginPath();
    ctx.moveTo(x+w/2,y-h/2-elev);ctx.lineTo(x+w/2+14,y-h/2-10-elev);
    ctx.lineTo(x+w/2+14,y+h/2-10-elev);ctx.lineTo(x+w/2,y+h/2-elev);
    ctx.closePath();ctx.fill();

    // Cara superior 3D
    ctx.fillStyle=col.top;
    ctx.beginPath();
    ctx.moveTo(x-w/2,y-h/2-elev);ctx.lineTo(x-w/2+14,y-h/2-10-elev);
    ctx.lineTo(x+w/2+14,y-h/2-10-elev);ctx.lineTo(x+w/2,y-h/2-elev);
    ctx.closePath();ctx.fill();

    // Cara frontal
    const grad=ctx.createLinearGradient(x-w/2,y-h/2,x+w/2,y+h/2);
    grad.addColorStop(0,hover?'#fef9c3':col.cara);
    grad.addColorStop(1,col.borde);
    ctx.fillStyle=grad;ctx.fillRect(x-w/2,y-h/2-elev,w,h);

    // Textura tablillas madera
    ctx.strokeStyle='rgba(0,0,0,0.14)';ctx.lineWidth=1;
    for(let row=0;row<3;row++){
        const ry=y-h/2-elev+row*(h/3);
        const off=row%2===0?0:w/4;
        for(let c2=0;c2<3;c2++){
            ctx.strokeRect(x-w/2+off+c2*(w/2),ry,w/2,h/3);
        }
    }

    // Cruz metálica caja
    ctx.strokeStyle='rgba(0,0,0,0.18)';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(x-w/2+10,y-h/2-elev+8);ctx.lineTo(x+w/2-10,y+h/2-elev-8);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+w/2-10,y-h/2-elev+8);ctx.lineTo(x-w/2+10,y+h/2-elev-8);ctx.stroke();

    // Borde hover dorado
    if(hover){ctx.strokeStyle='#fbbf24';ctx.lineWidth=3;ctx.strokeRect(x-w/2,y-h/2-elev,w,h);}

    // Número
    ctx.font=`bold 22px ${FONT_MC}`;
    ctx.fillStyle=hover?'#1e3a5f':'white';
    ctx.shadowColor='rgba(0,0,0,0.8)';ctx.shadowBlur=6;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(String(valor),x,y-elev);
    ctx.shadowBlur=0;

    if(hover){
        ctx.font=`8px ${FONT_MC}`;ctx.fillStyle='#fbbf24';
        ctx.shadowColor='rgba(0,0,0,0.7)';ctx.shadowBlur=4;
        ctx.fillText('ELEGIR',x,y-h/2-elev-14);
        ctx.shadowBlur=0;
    }
    ctx.restore();
}

// ── FONDO CIUDAD NOCTURNA (idéntico al módulo 1) ──────────────
const EDIFICIOS_BG=[
    {x:0,w:70,h:180,col:'#1e293b'},{x:75,w:50,h:140,col:'#334155'},
    {x:130,w:80,h:220,col:'#1e293b'},{x:580,w:90,h:190,col:'#334155'},
    {x:675,w:60,h:160,col:'#1e293b'},{x:740,w:80,h:240,col:'#0f172a'},
    {x:825,w:40,h:150,col:'#334155'},
];
const ESTRELLAS=Array.from({length:40},()=>({
    x:Math.random()*W,y:Math.random()*(H*0.45),
    r:0.5+Math.random()*1.5,b:Math.random()*Math.PI*2,
}));
const NUBES_POLVO=Array.from({length:5},()=>({
    x:Math.random()*W,y:H*0.55+Math.random()*H*0.1,
    r:20+Math.random()*30,vel:0.2+Math.random()*0.3,
}));

function drawFondo(){
    const sky=ctx.createLinearGradient(0,0,0,H*0.6);
    sky.addColorStop(0,'#0f172a');sky.addColorStop(0.6,'#1e293b');sky.addColorStop(1,'#334155');
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);

    const moonG=ctx.createRadialGradient(W*0.12,55,4,W*0.12,55,30);
    moonG.addColorStop(0,'#fef9c3');moonG.addColorStop(0.7,'#fde68a');moonG.addColorStop(1,'rgba(253,230,138,0)');
    ctx.fillStyle=moonG;ctx.beginPath();ctx.arc(W*0.12,55,30,0,Math.PI*2);ctx.fill();

    ESTRELLAS.forEach(s=>{
        const br=0.3+0.7*Math.sin(tick*0.04+s.b);
        ctx.globalAlpha=br;ctx.fillStyle='white';
        ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
    });
    ctx.globalAlpha=1;

    EDIFICIOS_BG.forEach(e=>{
        ctx.fillStyle=e.col;ctx.fillRect(e.x,H-60-e.h,e.w,e.h);
        for(let wy=H-60-e.h+15;wy<H-60-15;wy+=22)
            for(let wx=e.x+8;wx<e.x+e.w-14;wx+=18)
                if(Math.random()>0.4){
                    ctx.fillStyle=Math.random()>0.5?'#fde68a':'#bae6fd';
                    ctx.fillRect(wx,wy,10,14);
                }
    });

    NUBES_POLVO.forEach(n=>{
        n.x=(n.x+n.vel)%(W+100);
        ctx.save();ctx.globalAlpha=0.12;ctx.fillStyle='#d4b483';
        ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fill();ctx.restore();
    });

    const suelo=ctx.createLinearGradient(0,H-62,0,H);
    suelo.addColorStop(0,'#374151');suelo.addColorStop(1,'#1f2937');
    ctx.fillStyle=suelo;ctx.fillRect(0,H-62,W,62);
    ctx.strokeStyle='#fbbf24';ctx.lineWidth=3;ctx.setLineDash([30,20]);
    ctx.beginPath();ctx.moveTo(0,H-30);ctx.lineTo(W,H-30);ctx.stroke();
    ctx.setLineDash([]);
    [230,370,500,630].forEach(cx=>{
        ctx.fillStyle='#f97316';
        ctx.beginPath();ctx.moveTo(cx,H-60);ctx.lineTo(cx-10,H-38);ctx.lineTo(cx+10,H-38);ctx.closePath();ctx.fill();
        ctx.fillStyle='white';ctx.fillRect(cx-8,H-50,16,4);
        ctx.fillStyle='#64748b';ctx.fillRect(cx-12,H-38,24,5);
    });
}

// ── HUD (mismo estilo módulo 1) ───────────────────────────────
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
    ctx.fillText('HAZ CLIC EN LA CAJA CON EL RESULTADO CORRECTO  |  P = PAUSA',W/2,H-12);
}

// ── FLASH ────────────────────────────────────────────────────
function drawFlash(){
    if(!flash||flashT<=0) return;
    ctx.globalAlpha=Math.min(1,flashT/20);
    ctx.font=`14px ${FONT_MC}`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor='rgba(0,0,0,0.6)';ctx.shadowBlur=12;
    ctx.fillStyle=flash.includes('CORRECTO')?'#fbbf24':'#f87171';
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
    ctx.fillText(ganado?'!REPARTO EXITOSO!':'MATERIALES PERDIDOS...',W/2,H/2-60);
    ctx.shadowBlur=0;
    ctx.font=`10px ${FONT_MC}`;ctx.fillStyle='#cbd5e1';
    ctx.fillText(`DIVISIONES: ${aciertos} DE ${preguntas.length}`,W/2,H/2-15);
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
        body:JSON.stringify({unidad:302,aciertos,total:preguntas.length,puntaje:Math.round(aciertos/preguntas.length*100)})});
    }catch(e){}
}

// ── ELEGIR CAJA ───────────────────────────────────────────────
function elegirCaja(idx){
    if(gameOver||pausandoCambio||paused) return;
    const b=cajas[idx];if(!b||b.elegida)return;
    b.elegida=true;
    if(b.correcta){
        aciertos++;Sonidos.correcto();cajasLlenas++;
        boom(b.x,b.y,'#fbbf24',20);boom(b.x,b.y,'#f59e0b',10);boom(b.x,b.y,'#94a3b8',8);
        flash='!CORRECTO! CAJA REPARTIDA';flashT=55;
        pregIdx++;pausandoCambio=true;
        if(pregIdx>=preguntas.length){
            gameOver=true;ganado=aciertos>=Math.ceil(preguntas.length*0.6);
            if(ganado)Sonidos.ganar();else Sonidos.perder();
            guardar();pausandoCambio=false;
        } else {
            setTimeout(()=>{crearCajas();pausandoCambio=false;},1800);
        }
    } else {
        vidas--;Sonidos.incorrecto();
        boom(b.x,b.y,'#f87171',18);
        flash='INCORRECTO! -1 VIDA';flashT=55;
        if(vidas<=0){gameOver=true;ganado=false;Sonidos.perder();guardar();}
        else{pausandoCambio=true;setTimeout(()=>{crearCajas();pausandoCambio=false;},1800);}
    }
}

// ── DETECTAR CAJA ────────────────────────────────────────────
function getCajaEnPos(mx,my){
    for(let i=0;i<cajas.length;i++){
        const b=cajas[i];
        if(mx>=b.x-b.w/2&&mx<=b.x+b.w/2&&my>=b.y-b.h/2-8&&my<=b.y+b.h/2+8) return i;
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
    gruaY+=gruaDir*0.5;
    if(gruaY>80||gruaY<0) gruaDir*=-1;

    ctx.clearRect(0,0,W,H);
    drawFondo();
    tickP();drawP();
    drawMaterialesRepartidos();
    drawGrua();
    cajas.forEach(drawCaja);
    drawZorritoCapataz(zorro.x,zorro.y);

    if(!gameOver){
        drawHUD();drawFlash();
        if(paused) drawPausa();
    } else {
        drawFinal();
        if(ganado&&tick%4===0)
            boom(Math.random()*W,Math.random()*H*0.6,
                ['#fbbf24','#f59e0b','#94a3b8','#f97316'][Math.floor(Math.random()*4)],4);
    }
    requestAnimationFrame(loop);
}

// ── REINICIAR ────────────────────────────────────────────────
function reiniciar(){
    pregIdx=0;aciertos=0;vidas=3;gameOver=false;ganado=false;guardado=false;
    flash='';flashT=0;particulas=[];pausandoCambio=false;paused=false;cajasLlenas=0;
    crearCajas();
}

// ── PAUSA ────────────────────────────────────────────────────
document.addEventListener('keydown',e=>{
    if((e.key==='p'||e.key==='P')&&!gameOver) paused=!paused;
});

// ── EVENTOS ──────────────────────────────────────────────────
canvas.addEventListener('mousemove',e=>{
    if(gameOver||pausandoCambio||paused){canvas.style.cursor='default';return;}
    const {x,y}=canvasPos(e);
    const idx=getCajaEnPos(x,y);
    cajas.forEach((b,i)=>b.hover=(i===idx));
    canvas.style.cursor=idx>=0?'pointer':'default';
});
canvas.addEventListener('click',e=>{
    const {x,y}=canvasPos(e);
    if(gameOver){
        if(x>W/2-110&&x<W/2+110&&y>H/2+55&&y<H/2+99) reiniciar();
        return;
    }
    if(paused) return;
    const idx=getCajaEnPos(x,y);
    if(idx>=0) elegirCaja(idx);
});
canvas.addEventListener('touchend',e=>{
    e.preventDefault();
    const t=e.changedTouches[0],r=canvas.getBoundingClientRect();
    const x=(t.clientX-r.left)*(W/r.width),y=(t.clientY-r.top)*(H/r.height);
    if(gameOver){if(x>W/2-110&&x<W/2+110&&y>H/2+55&&y<H/2+99)reiniciar();return;}
    if(paused) return;
    let mejor=-1,mejorDist=9999;
    cajas.forEach((b,i)=>{
        const d=Math.hypot(x-b.x,y-b.y);
        if(d<85&&d<mejorDist){mejorDist=d;mejor=i;}
    });
    if(mejor>=0) elegirCaja(mejor);
},{passive:false});

let _au=false;
function _ia(){if(!_au){_au=true;Sonidos.iniciar(3);}}
canvas.addEventListener('click',_ia);
canvas.addEventListener('touchstart',_ia,{passive:true});
document.addEventListener('keydown',_ia,{once:true});

crearCajas();
loop();