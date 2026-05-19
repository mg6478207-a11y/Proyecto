// 🎮 RETOMATE - Grado 5 | Unidad 6: Potencias y Raíces
// 🐉 "La Guarida del Dragón Zorro"
// El zorro dragón corre sobre plataformas volcánicas y lanza bolas de fuego.
// Dispara hacia la cueva (derecha) que tiene la respuesta correcta a la potencia.
// Controles: ← → mover | ↑ lanzar bola de fuego | P pausar

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");
canvas.width  = 1000;
canvas.height = 600;

// ─── ESTADO ────────────────────────────────────────────────────────────────────
let aciertos       = 0;
let currentQ       = 0;
let juegoTerminado = false;
let pausado        = false;
let colisionLock   = false;
let tiempo         = 0;
let feedbackTimer  = 0;
let feedbackMsg    = "";
let feedbackOk     = true;
let particulas     = [];
let estrellasFinal = [];
let bola           = null;
let cuevas         = [];
let lava           = [];
let humos          = [];
let lavasAltas     = 0;

// ─── SONIDOS ──────────────────────────────────────────────────────────────────
const sonidoLanzar   = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");
const sonidoCorrecto = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const sonidoError    = new Audio("https://actions.google.com/sounds/v1/cartoon/concussive_guitar_hit.ogg");
const musicaFondo    = new Audio("/static/sounds/fondo.mp3");
musicaFondo.volume   = 0.35; musicaFondo.loop = true;
sonidoLanzar.volume  = 0.4; sonidoCorrecto.volume = 0.6; sonidoError.volume = 0.5;

// ─── DRAGÓN ZORRO ─────────────────────────────────────────────────────────────
let fox = { x: 80, y: 460, w: 56, h: 52, vx: 0, anim: 0, alasAnim: 0, dir: 1 };
const FOX_SPEED = 5;
const SUELO_Y   = 460;

// ─── PREGUNTAS ─────────────────────────────────────────────────────────────────
const preguntas = [
  { enunciado:"2³ = ?",      respuesta:8,   opciones:[6,8,9],     correcta:1, tipo:"potencia" },
  { enunciado:"3² = ?",      respuesta:9,   opciones:[9,6,12],    correcta:0, tipo:"potencia" },
  { enunciado:"4² = ?",      respuesta:16,  opciones:[12,20,16],  correcta:2, tipo:"potencia" },
  { enunciado:"√25 = ?",     respuesta:5,   opciones:[4,5,6],     correcta:1, tipo:"raiz"     },
  { enunciado:"5² = ?",      respuesta:25,  opciones:[25,20,30],  correcta:0, tipo:"potencia" },
  { enunciado:"√36 = ?",     respuesta:6,   opciones:[7,5,6],     correcta:2, tipo:"raiz"     },
  { enunciado:"2⁵ = ?",      respuesta:32,  opciones:[32,16,64],  correcta:0, tipo:"potencia" },
  { enunciado:"√49 = ?",     respuesta:7,   opciones:[6,7,8],     correcta:1, tipo:"raiz"     },
  { enunciado:"10² = ?",     respuesta:100, opciones:[10,100,200],correcta:1, tipo:"potencia" },
  { enunciado:"√81 = ?",     respuesta:9,   opciones:[8,9,10],    correcta:1, tipo:"raiz"     },
];

// Colores de las cuevas
const CUEVA_COLS = [
  { base:"#cc4400", glow:"rgba(255,100,0,0.8)",  fuego:"#ff6600" },
  { base:"#aa2200", glow:"rgba(200,50,0,0.8)",   fuego:"#ff4400" },
  { base:"#882200", glow:"rgba(160,40,0,0.8)",   fuego:"#ee3300" },
];

const CUEVA_XS = [720, 820, 920];
const CUEVA_Y  = 320;

// ─── INIT LAVA ────────────────────────────────────────────────────────────────
function initLava() {
  lava = [];
  for (let i = 0; i < 30; i++) {
    lava.push({
      x: Math.random() * canvas.width,
      y: 540 + Math.random() * 60,
      r: 8 + Math.random() * 20,
      vel: 0.3 + Math.random() * 0.5,
      fase: Math.random() * Math.PI * 2,
      color: ["#ff4400","#ff6600","#ff8800","#ffaa00"][Math.floor(Math.random()*4)]
    });
  }
  humos = [];
  for (let i = 0; i < 25; i++) {
    humos.push({
      x: Math.random() * canvas.width,
      y: 500 + Math.random() * 60,
      r: 5 + Math.random() * 12,
      vy: -(0.3 + Math.random() * 0.4),
      alfa: 0.3 + Math.random() * 0.3,
      fase: Math.random() * Math.PI * 2
    });
  }
}

// ─── GENERAR CUEVAS ───────────────────────────────────────────────────────────
function generarCuevas() {
  if (currentQ >= preguntas.length) return;
  const q = preguntas[currentQ];
  cuevas = q.opciones.map((val, i) => ({
    x:       CUEVA_XS[i],
    y:       CUEVA_Y,
    w:       70,
    h:       90,
    valor:   val,
    correcta: i === q.correcta,
    color:   CUEVA_COLS[i],
    llama:   0,
    hit:     false,
    hitTimer: 0,
    fase:    Math.random() * Math.PI * 2
  }));
}

// ─── FONDO VOLCÁNICO ──────────────────────────────────────────────────────────
function drawFondo() {
  // Cielo oscuro con brillo de lava
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#0a0200");
  g.addColorStop(0.5, "#1a0500");
  g.addColorStop(1, "#330800");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Luz de lava desde abajo
  const lavaglow = ctx.createLinearGradient(0, 480, 0, canvas.height);
  lavaglow.addColorStop(0, "rgba(255,100,0,0.0)");
  lavaglow.addColorStop(1, "rgba(255,100,0,0.35)");
  ctx.fillStyle = lavaglow;
  ctx.fillRect(0, 480, canvas.width, 120);

  // Montañas volcánicas de fondo
  [[0,200,200],[150,150,250],[280,180,220],[450,160,300],[600,190,200],[750,170,260],[900,200,200]].forEach(([mx,mh,mw])=>{
    const mg = ctx.createLinearGradient(mx, canvas.height-mh, mx+mw/2, canvas.height);
    mg.addColorStop(0, "#1a0800");
    mg.addColorStop(1, "#330d00");
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.moveTo(mx, canvas.height);
    ctx.lineTo(mx + mw/2, canvas.height - mh);
    ctx.lineTo(mx + mw, canvas.height);
    ctx.closePath(); ctx.fill();
    // Resplandor del cráter
    ctx.fillStyle = "rgba(255,100,0,0.15)";
    ctx.beginPath(); ctx.arc(mx + mw/2, canvas.height - mh + 10, 20, 0, Math.PI*2); ctx.fill();
  });

  // Plataformas de piedra volcánica
  [[0, SUELO_Y + fox.h + 5, canvas.width, 60]].forEach(([px,py,pw,ph])=>{
    const rg = ctx.createLinearGradient(0, py, 0, py+ph);
    rg.addColorStop(0, "#221100");
    rg.addColorStop(1, "#110800");
    ctx.fillStyle = rg;
    ctx.fillRect(px, py, pw, ph);
    // Grietas con brillo de lava
    ctx.strokeStyle = "rgba(255,100,0,0.4)"; ctx.lineWidth = 1.5;
    for (let xi = 40; xi < canvas.width - 40; xi += 80) {
      ctx.beginPath();
      ctx.moveTo(xi, py);
      ctx.lineTo(xi + 20, py + 20);
      ctx.lineTo(xi + 10, py + ph);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,60,0,0.6)"; ctx.lineWidth = 2;
    ctx.shadowColor = "#ff4400"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(canvas.width, py); ctx.stroke();
    ctx.shadowBlur = 0;
  });

  // Lava burbujeante en el fondo
  ctx.fillStyle = "#331100";
  ctx.fillRect(0, 540, canvas.width, 60);
  lava.forEach(l => {
    l.fase += 0.04;
    l.y = 548 + Math.sin(l.fase) * 6;
    ctx.fillStyle = l.color;
    ctx.shadowColor = l.color; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(l.x, l.y, l.r, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
  });

  // Humos de lava
  humos.forEach(h => {
    h.fase += 0.02;
    h.y += h.vy;
    if (h.y < 460) { h.y = 550; h.x = Math.random() * canvas.width; }
    ctx.globalAlpha = h.alfa * Math.abs(Math.sin(h.fase));
    ctx.fillStyle = "#553300";
    ctx.beginPath(); ctx.arc(h.x + Math.sin(h.fase)*10, h.y, h.r, 0, Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Plataforma donde están las cuevas
  ctx.fillStyle = "#1a0800";
  ctx.fillRect(680, CUEVA_Y + 90, 340, 30);
  ctx.strokeStyle = "rgba(255,100,0,0.5)"; ctx.lineWidth = 2;
  ctx.shadowColor = "#ff4400"; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(680, CUEVA_Y + 90); ctx.lineTo(1020, CUEVA_Y + 90); ctx.stroke();
  ctx.shadowBlur = 0;
}

// ─── CUEVAS ───────────────────────────────────────────────────────────────────
function drawCuevas() {
  cuevas.forEach((c, i) => {
    c.llama += 0.08;
    c.fase += 0.05;

    if (c.hit) {
      c.hitTimer--;
      if (c.hitTimer <= 0) c.hit = false;
    }

    // Sombra de la cueva
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath(); ctx.ellipse(c.x + c.w/2, c.y + c.h + 10, c.w*0.6, 8, 0, 0, Math.PI*2); ctx.fill();

    // Roca de la cueva
    ctx.fillStyle = c.hit ? "#ff6600" : "#221100";
    ctx.strokeStyle = c.color.base;
    ctx.lineWidth = 3;
    ctx.shadowColor = c.hit ? "#ffffff" : c.color.glow;
    ctx.shadowBlur = c.hit ? 30 : 12;
    ctx.beginPath();
    ctx.moveTo(c.x + 10, c.y);
    ctx.lineTo(c.x + c.w - 10, c.y);
    ctx.lineTo(c.x + c.w + 5, c.y + c.h);
    ctx.lineTo(c.x - 5, c.y + c.h);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;

    // Interior oscuro de la cueva
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(c.x + c.w/2, c.y + 30, c.w/2 - 8, 28, 0, 0, Math.PI*2); ctx.fill();

    // Llamas en la entrada
    for (let f = 0; f < 3; f++) {
      const fx = c.x + 15 + f * 15;
      const fh = 20 + Math.sin(c.llama + f * 1.2) * 8;
      const fg = ctx.createLinearGradient(fx, c.y + 30, fx, c.y + 30 - fh);
      fg.addColorStop(0, "#ff8800");
      fg.addColorStop(1, "#ffff00");
      ctx.fillStyle = fg;
      ctx.shadowColor = "#ff6600"; ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(fx, c.y + 30);
      ctx.quadraticCurveTo(fx - 5, c.y + 30 - fh*0.5, fx, c.y + 30 - fh);
      ctx.quadraticCurveTo(fx + 5, c.y + 30 - fh*0.5, fx + 8, c.y + 30);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Valor en la roca
    ctx.fillStyle = "#ffdd88";
    ctx.font = "bold 20px Minecraftia"; ctx.textAlign = "center";
    ctx.shadowColor = "#ff6600"; ctx.shadowBlur = 10;
    ctx.fillText(c.valor, c.x + c.w/2, c.y + c.h - 8);
    ctx.shadowBlur = 0;
    ctx.textAlign = "left";
  });
}

// ─── BOLA DE FUEGO ────────────────────────────────────────────────────────────
function drawBola() {
  if (!bola) return;
  bola.x += bola.vx;
  bola.y += bola.vy;
  bola.rot += 0.15;

  // Estela de fuego
  for (let i = 0; i < 4; i++) {
    particulas.push({
      x: bola.x + (Math.random()-0.5)*8,
      y: bola.y + (Math.random()-0.5)*8,
      vx: -bola.vx * 0.2 + (Math.random()-0.5)*2,
      vy: (Math.random()-0.5)*2,
      life: 25, maxLife: 25,
      color: ["#ff8800","#ff4400","#ffff00"][Math.floor(Math.random()*3)],
      r: 3 + Math.random()*5
    });
  }

  // Bola de fuego
  const bg = ctx.createRadialGradient(bola.x - 4, bola.y - 4, 2, bola.x, bola.y, 16);
  bg.addColorStop(0, "#ffffff");
  bg.addColorStop(0.3, "#ffff00");
  bg.addColorStop(0.7, "#ff6600");
  bg.addColorStop(1, "#cc2200");
  ctx.fillStyle = bg;
  ctx.shadowColor = "#ff6600"; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.arc(bola.x, bola.y, 16, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  // Colisión con cuevas
  cuevas.forEach(c => {
    const cx = c.x + c.w/2;
    const cy = c.y + c.h/2;
    if (bola && Math.abs(bola.x - cx) < c.w/2 + 10 && Math.abs(bola.y - cy) < c.h/2 + 10 && !colisionLock) {
      colisionLock = true;
      c.hit = true; c.hitTimer = 30;
      crearParticulas(bola.x, bola.y, "#ff6600");
      crearParticulas(bola.x, bola.y, "#ffff00");
      bola = null;

      if (c.correcta) {
        aciertos++;
        feedbackMsg = "¡Cueva conquistada! 🔥⭐";
        feedbackOk  = true;
        sonidoCorrecto.currentTime = 0; sonidoCorrecto.play();
      } else {
        feedbackMsg = `¡Equivocado! La respuesta era ${preguntas[currentQ].respuesta} 😤`;
        feedbackOk  = false;
        sonidoError.currentTime = 0; sonidoError.play();
      }
      feedbackTimer = 90;
      setTimeout(() => { siguientePregunta(); colisionLock = false; }, 1100);
    }
  });

  if (bola && bola.x > canvas.width + 20) bola = null;
}

// ─── DRAGÓN ZORRO ─────────────────────────────────────────────────────────────
function drawFox() {
  fox.anim += 0.1;
  fox.alasAnim += 0.15;
  const bob = Math.sin(fox.anim) * (fox.vx !== 0 ? 2.5 : 1);
  ctx.save();
  ctx.translate(fox.x + fox.w/2, fox.y + fox.h/2 + bob);
  if (fox.vx < 0) ctx.scale(-1, 1);

  // Alas de dragón
  const alaAng = Math.sin(fox.alasAnim) * 0.3;
  ctx.save();
  ctx.rotate(-alaAng);
  ctx.fillStyle = "#662200";
  ctx.beginPath();
  ctx.moveTo(-8, -5);
  ctx.lineTo(-40, -30);
  ctx.lineTo(-35, -5);
  ctx.lineTo(-50, 5);
  ctx.lineTo(-8, 10);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#441100"; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.rotate(alaAng);
  ctx.fillStyle = "#662200";
  ctx.beginPath();
  ctx.moveTo(8, -5);
  ctx.lineTo(40, -30);
  ctx.lineTo(35, -5);
  ctx.lineTo(50, 5);
  ctx.lineTo(8, 10);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#441100"; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();

  // Cola de dragón
  ctx.fillStyle = "#ff6600";
  ctx.beginPath();
  ctx.moveTo(16, 15);
  ctx.quadraticCurveTo(30, 25, 28, 35);
  ctx.quadraticCurveTo(20, 40, 14, 30);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#ffaa00";
  ctx.beginPath(); ctx.arc(26, 33, 5, 0, Math.PI*2); ctx.fill();

  // Cuerpo (naranja escamado)
  ctx.fillStyle = "#ff6600";
  ctx.shadowColor = "#ff4400"; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.ellipse(0, 8, 18, 22, 0, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  // Escamas pecho
  ctx.fillStyle = "#ffaa44";
  ctx.beginPath(); ctx.ellipse(0, 10, 10, 14, 0, 0, Math.PI*2); ctx.fill();
  // Escamas líneas
  for (let s = -8; s <= 8; s += 4) {
    ctx.strokeStyle = "#ff8800"; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(s, 8, 5, 0, Math.PI); ctx.stroke();
  }

  // Cabeza de zorro
  ctx.fillStyle = "#ff6600";
  ctx.beginPath(); ctx.ellipse(0, -14, 14, 12, 0, 0, Math.PI*2); ctx.fill();
  // Hocico
  ctx.fillStyle = "#ffaa66";
  ctx.beginPath(); ctx.ellipse(4, -10, 7, 5, 0.3, 0, Math.PI*2); ctx.fill();
  // Orejas puntiagudas (también con cuernos pequeños de dragón)
  ctx.fillStyle = "#ff4400";
  ctx.beginPath(); ctx.moveTo(-12,-20); ctx.lineTo(-16,-30); ctx.lineTo(-6,-20); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(12,-20); ctx.lineTo(16,-30); ctx.lineTo(6,-20); ctx.closePath(); ctx.fill();
  // Cuernitos de dragón
  ctx.fillStyle = "#884400";
  ctx.beginPath(); ctx.moveTo(-8,-22); ctx.lineTo(-6,-28); ctx.lineTo(-4,-22); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(4,-22); ctx.lineTo(6,-28); ctx.lineTo(8,-22); ctx.closePath(); ctx.fill();
  // Ojos con brillo de fuego
  ctx.fillStyle = "#ffff00";
  ctx.beginPath(); ctx.arc(-5, -15, 3.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -15, 3.5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#cc0000";
  ctx.beginPath(); ctx.arc(-5, -15, 2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -15, 2, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.arc(-4.5, -15.5, 1, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(5.5, -15.5, 1, 0, Math.PI*2); ctx.fill();
  // Nariz
  ctx.fillStyle = "#441100";
  ctx.beginPath(); ctx.arc(6, -10, 2, 0, Math.PI*2); ctx.fill();

  // Patas
  ctx.fillStyle = "#ff5500";
  ctx.fillRect(-16, 22, 10, 12);
  ctx.fillRect(6, 22, 10, 12);
  // Garras
  ctx.fillStyle = "#884400";
  [[-16,-2],[-12,-2],[-8,-2],[6,-2],[10,-2],[14,-2]].forEach(([gx,gy])=>{
    ctx.beginPath(); ctx.moveTo(gx,34+gy); ctx.lineTo(gx+2,38+gy); ctx.lineTo(gx+4,34+gy); ctx.closePath(); ctx.fill();
  });

  ctx.restore();
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function drawHUD() {
  if (currentQ >= preguntas.length) return;
  const q = preguntas[currentQ];

  ctx.fillStyle = "rgba(20,5,0,0.88)";
  roundRect(ctx, 10, 10, 980, 90, 12); ctx.fill();
  ctx.strokeStyle = "rgba(255,136,0,0.5)"; ctx.lineWidth = 2;
  roundRect(ctx, 10, 10, 980, 90, 12); ctx.stroke();

  ctx.fillStyle = "#ff8844"; ctx.font = "12px Minecraftia"; ctx.textAlign = "left";
  ctx.fillText(`🔥 Aciertos: ${aciertos}`, 22, 33);

  const bW = 120;
  ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(22, 42, bW, 7);
  ctx.fillStyle = "#ff6600"; ctx.fillRect(22, 42, bW*(currentQ/preguntas.length), 7);
  ctx.strokeStyle = "#ff6600"; ctx.lineWidth=1; ctx.strokeRect(22,42,bW,7);
  ctx.fillStyle = "#ffaa66"; ctx.font = "10px Minecraftia";
  ctx.fillText(`${currentQ+1}/${preguntas.length}`, 148, 50);

  ctx.fillStyle = "#ffffff"; ctx.font = "bold 28px Minecraftia"; ctx.textAlign = "center";
  ctx.shadowColor = "#ff6600"; ctx.shadowBlur = 10;
  ctx.fillText(`🔥 Calcula: ${q.enunciado}`, canvas.width/2 + 60, 42);
  ctx.shadowBlur = 0;

  const tipColor = q.tipo === "potencia" ? "#ffaa44" : "#44ffaa";
  ctx.fillStyle = tipColor; ctx.font = "12px Minecraftia";
  const hint = q.tipo === "potencia" ? "Multiplica la base por sí misma tantas veces como indica el exponente"
                                     : "¿Qué número multiplicado por sí mismo da ese resultado?";
  ctx.fillText(`💡 ${hint}`, canvas.width/2 + 60, 64);
  ctx.fillStyle = "#ffe066"; ctx.font = "11px Minecraftia";
  ctx.fillText("↑ = LANZAR BOLA DE FUEGO A LA CUEVA CORRECTA", canvas.width/2 + 60, 83);
  ctx.textAlign = "left";
}

// ─── FEEDBACK ─────────────────────────────────────────────────────────────────
function drawFeedback() {
  if (feedbackTimer <= 0) return;
  feedbackTimer--;
  ctx.globalAlpha = Math.min(1, feedbackTimer/20);
  const color = feedbackOk ? "#ffff44" : "#ff4444";
  ctx.font = "bold 28px Minecraftia"; ctx.textAlign = "center";
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 28;
  ctx.fillText(feedbackMsg, canvas.width/2, canvas.height/2);
  ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.textAlign = "left";
}

// ─── PARTÍCULAS ───────────────────────────────────────────────────────────────
function crearParticulas(x, y, color) {
  for (let i = 0; i < 30; i++) {
    particulas.push({
      x, y,
      vx:(Math.random()*12)-6,
      vy:(Math.random()*-10)-1,
      life:65, maxLife:65,
      color, r:2+Math.random()*6
    });
  }
}
function drawParticulas() {
  particulas.forEach(p => {
    ctx.globalAlpha = p.life/p.maxLife;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.2; p.r*=0.97; p.life--;
  });
  ctx.globalAlpha = 1;
  particulas = particulas.filter(p=>p.life>0);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x+r,y); c.lineTo(x+w-r,y);
  c.quadraticCurveTo(x+w,y,x+w,y+r);
  c.lineTo(x+w,y+h-r);
  c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  c.lineTo(x+r,y+h);
  c.quadraticCurveTo(x,y+h,x,y+h-r);
  c.lineTo(x,y+r);
  c.quadraticCurveTo(x,y,x+r,y);
  c.closePath();
}

// ─── CONTROLES ────────────────────────────────────────────────────────────────
const keys = {};
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
  if (juegoTerminado || pausado || colisionLock) return;
  if (e.key === "ArrowUp" && !keys["_act"] && !bola) {
    keys["_act"] = true;
    lanzarBola();
  }
  if (e.key==="p"||e.key==="P") {
    pausado=!pausado;
    if(pausado) musicaFondo.pause(); else musicaFondo.play();
  }
});
document.addEventListener("keyup", e => {
  keys[e.key]=false;
  if(e.key==="ArrowUp") keys["_act"]=false;
});

function lanzarBola() {
  bola = { x: fox.x + fox.w, y: fox.y + 10, vx: 9, vy: -3, rot: 0 };
  sonidoLanzar.currentTime = 0; sonidoLanzar.play();
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
function update() {
  if (juegoTerminado||pausado) return;
  tiempo++;
  if(keys["ArrowRight"]) { fox.vx= FOX_SPEED; fox.dir=1; }
  else if(keys["ArrowLeft"]) { fox.vx=-FOX_SPEED; fox.dir=-1; }
  else fox.vx*=0.7;
  fox.x+=fox.vx;
  fox.x = Math.max(0, Math.min(fox.x, canvas.width - fox.w));  
}

function siguientePregunta() {
  currentQ++;
  bola=null;
  if(currentQ>=preguntas.length) {
    juegoTerminado=true;
    estrellasFinal=[];
    for(let i=0;i<180;i++) {
      estrellasFinal.push({
        x:Math.random()*canvas.width,
        y:Math.random()*-canvas.height,
        vy:1+Math.random()*2.5,
        r:2+Math.random()*4,
        color:["#ff6600","#ff8800","#ffaa00","#ffff44","#ff4400"][Math.floor(Math.random()*5)]
      });
    }
    const puntaje=(aciertos/preguntas.length)*100;
    fetch("/guardar_progreso",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({grado:5,unidad:6,aciertos,total:preguntas.length,puntaje})
    }).then(r=>r.json()).then(d=>console.log("✅",d)).catch(e=>console.error("❌",e));
  } else {
    generarCuevas();
  }
}

function drawFinal() {
  estrellasFinal.forEach(e=>{
    ctx.fillStyle=e.color; ctx.shadowColor=e.color; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    e.y+=e.vy; if(e.y>canvas.height+10) e.y=-10;
  });
  const pW=620,pH=280;
  const px=(canvas.width-pW)/2,py=(canvas.height-pH)/2;
  ctx.fillStyle="rgba(20,5,0,0.95)";
  roundRect(ctx,px,py,pW,pH,22); ctx.fill();
  ctx.strokeStyle="#ff6600"; ctx.lineWidth=4;
  ctx.shadowColor="#ff6600"; ctx.shadowBlur=22;
  roundRect(ctx,px+4,py+4,pW-8,pH-8,20); ctx.stroke();
  ctx.shadowBlur=0;
  ctx.fillStyle="#ffaa44"; ctx.font="26px Minecraftia"; ctx.textAlign="center";
  ctx.shadowColor="#ff6600"; ctx.shadowBlur=10;
  ctx.fillText("🐉 ¡Guarida completada!", canvas.width/2, py+58);
  ctx.shadowBlur=0;
  ctx.fillStyle="#ffe066"; ctx.font="22px Minecraftia";
  ctx.fillText(`⭐ ${aciertos} / ${preguntas.length} correctas`, canvas.width/2, py+105);
  const pct=Math.round((aciertos/preguntas.length)*100);
  const msg=pct===100?"¡Dragón matemático! 🏆":pct>=70?"¡Gran poder! 🔥":"¡Sigue entrenando! 🐲";
  ctx.fillStyle="#ffcc88"; ctx.font="13px Minecraftia";
  ctx.fillText(`${pct}% — ${msg}`, canvas.width/2, py+143);
  const bW=250,bH=54,bx=canvas.width/2-125,by=py+178;
  ctx.fillStyle="#1a0800";
  roundRect(ctx,bx,by,bW,bH,12); ctx.fill();
  ctx.strokeStyle="#ff6600"; ctx.lineWidth=2.5;
  ctx.shadowColor="#ff6600"; ctx.shadowBlur=12;
  roundRect(ctx,bx,by,bW,bH,12); ctx.stroke();
  ctx.shadowBlur=0;
  ctx.fillStyle="#fff"; ctx.font="20px Minecraftia";
  ctx.fillText("🔁 Reiniciar", canvas.width/2, by+36);
  ctx.textAlign="left";
}

function drawPausa() {
  ctx.fillStyle="rgba(20,5,0,0.88)"; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#ffaa44"; ctx.font="42px Minecraftia"; ctx.textAlign="center";
  ctx.shadowColor="#ff6600"; ctx.shadowBlur=18;
  ctx.fillText("⏸ Pausa", canvas.width/2, canvas.height/2-44);
  ctx.shadowBlur=0;
  const bW=250,bH=60,bx=canvas.width/2-125,by=canvas.height/2;
  ctx.fillStyle="#1a0800"; roundRect(ctx,bx,by,bW,bH,12); ctx.fill();
  ctx.strokeStyle="#ff6600"; ctx.lineWidth=2.5; roundRect(ctx,bx,by,bW,bH,12); ctx.stroke();
  ctx.fillStyle="#fff"; ctx.font="22px Minecraftia";
  ctx.fillText("▶ Continuar", canvas.width/2, by+39);
  ctx.textAlign="left";
}

canvas.addEventListener("click",e=>{
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left,my=e.clientY-rect.top;
  if(pausado&&!juegoTerminado){
    if(mx>=canvas.width/2-125&&mx<=canvas.width/2+125&&my>=canvas.height/2&&my<=canvas.height/2+60){
      pausado=false; musicaFondo.play();
    }
  }
  if(juegoTerminado){
    const pH=280,py=(canvas.height-pH)/2;
    const bx=canvas.width/2-125,by=py+178;
    if(mx>=bx&&mx<=bx+250&&my>=by&&my<=by+54) resetGame();
  }
});

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawFondo();
  if(!juegoTerminado) {
    drawCuevas();
    drawBola();
    drawFox();
    drawHUD();
    drawFeedback();
  }
  drawParticulas();
  if(pausado&&!juegoTerminado) drawPausa();
  if(juegoTerminado) drawFinal();
}

function resetGame() {
  aciertos=0; currentQ=0; juegoTerminado=false; pausado=false; colisionLock=false;
  particulas=[]; estrellasFinal=[]; feedbackTimer=0; feedbackMsg=""; bola=null;
  fox.x=80; fox.y=SUELO_Y; fox.vx=0;
  initLava(); generarCuevas();
}

function gameLoop(){ update(); draw(); requestAnimationFrame(gameLoop); }
resetGame();
gameLoop();
musicaFondo.play().catch(()=>{
  document.addEventListener("keydown",()=>musicaFondo.play(),{once:true});
});