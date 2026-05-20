// ============================================================
//  RETOMATE - sonidos.js
//  Audio generado con Web Audio API (sin archivos externos)
//  Uso: incluir este script antes del JS del juego
//  Luego llamar: Sonidos.iniciar(grado)
// ============================================================

const Sonidos = (() => {
  let ctx = null;
  let musicaNode = null;
  let gananciaMusica = null;
  let musicaActiva = false;
  let gradoActual = 1;

  // ── INICIALIZAR CONTEXTO ─────────────────────────────────
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ── UTILIDAD: tocar nota ─────────────────────────────────
  function tocarNota(freq, tipo, inicio, duracion, volumen = 0.3, destino = null) {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(destino || c.destination);
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, c.currentTime + inicio);
    gain.gain.setValueAtTime(0, c.currentTime + inicio);
    gain.gain.linearRampToValueAtTime(volumen, c.currentTime + inicio + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + inicio + duracion);
    osc.start(c.currentTime + inicio);
    osc.stop(c.currentTime + inicio + duracion + 0.05);
  }

  // ── SONIDO CORRECTO ──────────────────────────────────────
  function correcto() {
    // Melodía ascendente alegre
    const notas = [523, 659, 784, 1047];
    notas.forEach((f, i) => tocarNota(f, 'sine', i * 0.12, 0.18, 0.35));
  }

  // ── SONIDO INCORRECTO ────────────────────────────────────
  function incorrecto() {
    // Dos notas bajas descendentes
    tocarNota(220, 'sawtooth', 0,    0.18, 0.3);
    tocarNota(180, 'sawtooth', 0.2,  0.25, 0.3);
  }

  // ── SONIDO FIN GANADO ────────────────────────────────────
  function ganar() {
    const notas = [523, 659, 784, 659, 784, 1047];
    notas.forEach((f, i) => tocarNota(f, 'sine', i * 0.13, 0.2, 0.4));
  }

  // ── SONIDO FIN PERDIDO ───────────────────────────────────
  function perder() {
    const notas = [392, 349, 330, 262];
    notas.forEach((f, i) => tocarNota(f, 'sawtooth', i * 0.18, 0.25, 0.3));
  }

  // ══════════════════════════════════════════════════════════
  //  MÚSICAS DE FONDO POR GRADO
  //  Cada grado tiene su propio patrón de notas y tempo
  // ══════════════════════════════════════════════════════════

  // Notas musicales en Hz
  const DO4=262, RE4=294, MI4=330, FA4=349, SOL4=392, LA4=440, SI4=494,
        DO5=523, RE5=587, MI5=659, FA5=698, SOL5=784, LA5=880,
        DO3=131, SOL3=196, LA3=220;

  // ── GRADO 1: Melodía infantil tipo calesita ───────────────
  const MELODIA_G1 = [
    [DO5,0.25],[MI5,0.25],[SOL5,0.25],[MI5,0.25],
    [DO5,0.25],[RE5,0.25],[MI5,0.5],
    [FA5,0.25],[LA5,0.25],[SOL5,0.25],[MI5,0.25],
    [DO5,0.5],[DO5,0.5],
    [SOL4,0.25],[LA4,0.25],[SI4,0.25],[DO5,0.25],
    [RE5,0.25],[MI5,0.25],[FA5,0.5],
    [MI5,0.25],[RE5,0.25],[DO5,0.25],[SI4,0.25],
    [DO5,1.0],
  ];

  // ── GRADO 2: Melodía exploradora tipo aventura ────────────
  const MELODIA_G2 = [
    [DO5,0.2],[SOL4,0.2],[MI5,0.2],[SOL4,0.2],
    [FA5,0.2],[RE5,0.2],[SOL5,0.4],
    [MI5,0.2],[DO5,0.2],[RE5,0.2],[SI4,0.2],
    [DO5,0.6],[DO5,0.2],
    [LA4,0.2],[DO5,0.2],[MI5,0.2],[SOL5,0.2],
    [FA5,0.2],[MI5,0.2],[RE5,0.4],
    [DO5,0.2],[SI4,0.2],[LA4,0.2],[SOL4,0.2],
    [DO5,0.8],
  ];

  // ── GRADO 3: Melodía construida, más marcada ──────────────
  const MELODIA_G3 = [
    [MI5,0.18],[MI5,0.18],[FA5,0.18],[SOL5,0.18],
    [SOL5,0.18],[FA5,0.18],[MI5,0.18],[RE5,0.18],
    [DO5,0.18],[DO5,0.18],[RE5,0.18],[MI5,0.18],
    [MI5,0.36],[RE5,0.18],[RE5,0.36],
    [MI5,0.18],[MI5,0.18],[FA5,0.18],[SOL5,0.18],
    [SOL5,0.18],[FA5,0.18],[MI5,0.18],[RE5,0.18],
    [DO5,0.18],[DO5,0.18],[RE5,0.18],[MI5,0.18],
    [DO5,0.6],
  ];

  // ── GRADO 4: Melodía de acción tipo plataformas ───────────
  const MELODIA_G4 = [
    [MI5,0.15],[DO5,0.15],[RE5,0.15],[FA5,0.15],
    [MI5,0.15],[DO5,0.15],[SOL5,0.3],
    [LA5,0.15],[SOL5,0.15],[FA5,0.15],[MI5,0.15],
    [RE5,0.3],[DO5,0.3],
    [SOL4,0.15],[LA4,0.15],[SI4,0.15],[DO5,0.15],
    [RE5,0.15],[MI5,0.15],[FA5,0.15],[SOL5,0.15],
    [LA5,0.15],[SOL5,0.15],[FA5,0.15],[MI5,0.15],
    [DO5,0.6],
  ];

  // ── GRADO 5: Melodía científica misteriosa ────────────────
  const MELODIA_G5 = [
    [LA4,0.2],[DO5,0.2],[MI5,0.2],[LA5,0.2],
    [SOL5,0.2],[MI5,0.2],[FA5,0.4],
    [RE5,0.2],[FA5,0.2],[LA5,0.2],[RE5,0.2],  // usa RE5 dos veces
    [DO5,0.4],[SI4,0.4],
    [LA4,0.2],[SI4,0.2],[DO5,0.2],[RE5,0.2],
    [MI5,0.2],[FA5,0.2],[SOL5,0.4],
    [LA5,0.2],[SOL5,0.2],[FA5,0.2],[MI5,0.2],
    [LA4,0.8],
  ];

  // ── GRADO 6: Melodía dinámica tipo RPG ───────────────────
  const MELODIA_G6 = [
    [MI5,0.12],[MI5,0.12],[SOL5,0.12],[MI5,0.12],
    [LA5,0.12],[SI4,0.12],[DO5,0.12],[RE5,0.12],
    [MI5,0.12],[FA5,0.12],[SOL5,0.12],[LA5,0.12],
    [SOL5,0.24],[FA5,0.12],[MI5,0.24],
    [DO5,0.12],[RE5,0.12],[MI5,0.12],[FA5,0.12],
    [SOL5,0.12],[LA5,0.12],[SI4,0.12],[DO5,0.12], // SI4 aquí
    [RE5,0.12],[MI5,0.12],[FA5,0.12],[SOL5,0.12],
    [MI5,0.48],
  ];

  const MELODIAS = {
    1: MELODIA_G1,
    2: MELODIA_G2,
    3: MELODIA_G3,
    4: MELODIA_G4,
    5: MELODIA_G5,
    6: MELODIA_G6,
  };

  // ── BAJOS (acompañamiento) ────────────────────────────────
  function bajoGrado(grado, tiempo, destino) {
    const c = getCtx();
    const patrones = {
      1: [[DO3,0.5],[DO3,0.5],[SOL3,0.5],[SOL3,0.5]],
      2: [[DO3,0.4],[SOL3,0.4],[LA3,0.4],[SOL3,0.4]],
      3: [[DO3,0.36],[SOL3,0.36],[LA3,0.36],[MI4,0.36]],
      4: [[DO3,0.3],[SOL3,0.3],[LA3,0.3],[FA4,0.3]],
      5: [[LA3,0.4],[MI4,0.4],[DO3,0.4],[SOL3,0.4]],
      6: [[MI4,0.24],[LA3,0.24],[DO3,0.24],[SOL3,0.24]],
    };
    const patron = patrones[grado] || patrones[1];
    let t = tiempo;
    patron.forEach(([f, dur]) => {
      tocarNota(f, 'triangle', t - c.currentTime, dur * 0.8, 0.15, destino);
      t += dur;
    });
    return t - c.currentTime;
  }

  // ── MOTOR DE MÚSICA EN LOOP ───────────────────────────────
  let schedulerTimer = null;
  let melodiaIdx     = 0;
  let tiempoSig      = 0;

  function scheduleMusica() {
    if (!musicaActiva) return;
    const c = getCtx();
    const ADELANTO = 0.3; // segundos adelante para programar

    while (tiempoSig < c.currentTime + ADELANTO) {
      const melodia = MELODIAS[gradoActual] || MELODIAS[1];
      const [freq, dur] = melodia[melodiaIdx % melodia.length];

      // Nota melodía
      tocarNota(freq, 'sine', tiempoSig - c.currentTime, dur * 0.85,
                gradoActual <= 2 ? 0.28 : 0.22, gananciaMusica);

      tiempoSig += dur;
      melodiaIdx++;

      // Cada 4 notas agrega bajo
      if (melodiaIdx % 4 === 0) {
        bajoGrado(gradoActual, tiempoSig, gananciaMusica);
      }
    }
    schedulerTimer = setTimeout(scheduleMusica, 100);
  }

  // ── INICIAR MÚSICA ────────────────────────────────────────
  function iniciarMusica(grado) {
    detenerMusica();
    gradoActual    = grado || 1;
    musicaActiva   = true;
    melodiaIdx     = 0;
    const c        = getCtx();
    tiempoSig      = c.currentTime + 0.1;
    gananciaMusica = c.createGain();
    gananciaMusica.gain.setValueAtTime(0.5, c.currentTime);
    gananciaMusica.connect(c.destination);
    scheduleMusica();
  }

  // ── DETENER MÚSICA ────────────────────────────────────────
  function detenerMusica() {
    musicaActiva = false;
    if (schedulerTimer) clearTimeout(schedulerTimer);
    if (gananciaMusica) {
      try {
        gananciaMusica.gain.setValueAtTime(0, getCtx().currentTime);
        gananciaMusica.disconnect();
      } catch(e) {}
      gananciaMusica = null;
    }
  }

  // ── VOLUMEN ───────────────────────────────────────────────
  function setVolumen(v) {
    if (gananciaMusica) gananciaMusica.gain.setValueAtTime(v, getCtx().currentTime);
  }

  // ── API PÚBLICA ───────────────────────────────────────────
  return {
    // Inicia todo: llama esto en el primer clic/touch del juego
    iniciar(grado) {
      iniciarMusica(grado);
    },
    detener() {
      detenerMusica();
    },
    correcto,
    incorrecto,
    ganar() { detenerMusica(); ganar(); },
    perder() { detenerMusica(); perder(); },
    setVolumen,
  };
})();