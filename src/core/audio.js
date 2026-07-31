/**
 * AUDIO — Sonidos y música creados por el propio navegador.
 * ========================================================
 *
 * No hay ni un solo archivo de audio en el proyecto. Todo se genera en el
 * momento combinando osciladores (tonos puros) y ruido (siseo). Es exactamente
 * como funcionaban las recreativas de los ochenta: no reproducían grabaciones,
 * fabricaban el sonido con circuitos.
 *
 * Ventajas para este proyecto: no pesa nada, no hay que buscar sonidos con
 * licencia libre, y suena auténticamente arcade.
 *
 * DETALLE IMPORTANTE — EL PRIMER GESTO
 * Los navegadores prohíben hacer sonar nada hasta que el usuario toca algo.
 * Por eso el motor de audio NO se crea al cargar la página: se crea en el
 * primer gesto real. Así no aparece ningún error en la consola y nadie se
 * lleva un susto sonoro al abrir el enlace.
 */

import { AJUSTES_POR_DEFECTO } from '../config/balance.js';

export class Audio {
  constructor() {
    this.ctx = null;
    this.listo = false;
    this.silenciado = false;

    this.volumenGeneral = AJUSTES_POR_DEFECTO.volumenGeneral / 100;
    this.volumenMusica = AJUSTES_POR_DEFECTO.volumenMusica / 100;
    this.volumenEfectos = AJUSTES_POR_DEFECTO.volumenEfectos / 100;

    this._musicaActiva = false;
    this._pasoMusica = 0;
    this._proximoPaso = 0;
  }

  /**
   * Se llama en el primer gesto del jugador. Antes de eso no existe nada.
   */
  despertar() {
    if (this.listo) return;

    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return; // navegador sin soporte: el juego funciona igual

    this.ctx = new Contexto();

    // Tres mandos de volumen independientes, como pide la biblia.
    this.general = this.ctx.createGain();
    this.general.gain.value = this.volumenGeneral;
    this.general.connect(this.ctx.destination);

    this.efectos = this.ctx.createGain();
    this.efectos.gain.value = this.volumenEfectos;
    this.efectos.connect(this.general);

    this.musica = this.ctx.createGain();
    this.musica.gain.value = this.volumenMusica;
    this.musica.connect(this.general);

    this._crearEco();
    this._crearRuido();
    this.listo = true;
  }

  /**
   * EL ECO — lo que hace que la música suene "a espacio".
   *
   * Es una repetición retardada que se va apagando. Nuestro oído interpreta
   * los ecos como distancia, así que un sonido con eco largo se percibe como
   * si ocurriera en un sitio enorme y vacío. Es el mismo truco que usan las
   * bandas sonoras de ciencia ficción, y en un chiptune convierte cuatro
   * pitidos secos en algo cósmico.
   */
  _crearEco() {
    this.eco = this.ctx.createDelay(1.0);
    // Eco CORTO. Uno largo suena espectacular en una nota sola, pero sobre
    // notas rápidas cada una se solapa con el eco de las anteriores y todo se
    // convierte en un barullo. Por eso el eco se reserva a la melodía, que va
    // despacio, y se mantiene breve.
    this.eco.delayTime.value = 0.16;

    // Cuánto del eco vuelve a entrar en el eco. Bajo: se quiere una sombra de
    // la nota, no una cola que se arrastre encima de la siguiente.
    const realimentacion = this.ctx.createGain();
    realimentacion.gain.value = 0.15;

    // Las repeticiones se van oscureciendo, como pasa de verdad cuando el
    // sonido rebota lejos.
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 2400;

    const mezcla = this.ctx.createGain();
    mezcla.gain.value = 0.18;

    this.eco.connect(filtro);
    filtro.connect(realimentacion);
    realimentacion.connect(this.eco);
    filtro.connect(mezcla);
    mezcla.connect(this.musica);

    // Bus al que se conectan las voces que deben sonar lejanas.
    this.musicaConEco = this.ctx.createGain();
    this.musicaConEco.gain.value = 1;
    this.musicaConEco.connect(this.musica);
    this.musicaConEco.connect(this.eco);
  }

  /** Un búfer de ruido reutilizable: la base de explosiones y siseos de vapor. */
  _crearRuido() {
    const duracion = 1;
    const muestras = this.ctx.sampleRate * duracion;
    this._ruido = this.ctx.createBuffer(1, muestras, this.ctx.sampleRate);
    const datos = this._ruido.getChannelData(0);
    for (let i = 0; i < muestras; i++) datos[i] = Math.random() * 2 - 1;
  }

  reanudar() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    // Se resincroniza el compás. Si no, al volver de una pausa larga el
    // programador intentaría recuperar todos los pasos perdidos de golpe y
    // sonarían encimados.
    if (this.ctx) this._instanteProximoPaso = this.ctx.currentTime + 0.08;
  }

  pausar() {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  }

  /** Silenciar nunca es un corte seco: se baja en 100 ms. */
  alternarSilencio() {
    this.silenciado = !this.silenciado;
    if (!this.listo) return this.silenciado;
    const destino = this.silenciado ? 0 : this.volumenGeneral;
    this.general.gain.cancelScheduledValues(this.ctx.currentTime);
    this.general.gain.linearRampToValueAtTime(destino, this.ctx.currentTime + 0.1);
    return this.silenciado;
  }

  // -------------------------------------------------------------------------
  // Ladrillos básicos
  // -------------------------------------------------------------------------

  /**
   * Un tono con envolvente. La envolvente (subida rápida, bajada suave) es lo
   * que convierte un pitido plano en algo que suena a instrumento.
   *
   * @param {number} [cuando]  instante exacto en que debe sonar. Para la
   *   música es imprescindible: si se programara "ahora" en cada fotograma,
   *   el ritmo cojearía porque los fotogramas no caen en tiempos exactos.
   */
  _tono({ frecuencia, hasta = null, tipo = 'square', duracion = 0.1, volumen = 0.3, ataque = 0.005, destino = null, cuando = null }) {
    if (!this.listo) return;
    const t = cuando ?? this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = tipo;
    osc.frequency.setValueAtTime(frecuencia, t);
    if (hasta !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, hasta), t + duracion);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volumen, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);

    osc.connect(g);
    g.connect(destino || this.efectos);
    osc.start(t);
    osc.stop(t + duracion + 0.02);
  }

  /** Ruido filtrado: la base de cualquier explosión o escape de vapor. */
  _ruidoFiltrado({ duracion = 0.3, volumen = 0.3, desde = 2000, hasta = 200, tipo = 'lowpass', q = 1 }) {
    if (!this.listo) return;
    const t = this.ctx.currentTime;

    const fuente = this.ctx.createBufferSource();
    fuente.buffer = this._ruido;

    const filtro = this.ctx.createBiquadFilter();
    filtro.type = tipo;
    filtro.Q.value = q;
    filtro.frequency.setValueAtTime(desde, t);
    filtro.frequency.exponentialRampToValueAtTime(Math.max(20, hasta), t + duracion);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(volumen, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);

    fuente.connect(filtro);
    filtro.connect(g);
    g.connect(this.efectos);
    fuente.start(t);
    fuente.stop(t + duracion);
  }

  // -------------------------------------------------------------------------
  // Los sonidos del juego
  // -------------------------------------------------------------------------

  /** Disparo de la taza: corto, agudo, descendente. */
  disparo() {
    this._tono({ frecuencia: 900, hasta: 320, tipo: 'square', duracion: 0.08, volumen: 0.14 });
  }

  /** Impacto que NO mata: golpe metálico seco. */
  impacto() {
    this._tono({ frecuencia: 380, hasta: 180, tipo: 'triangle', duracion: 0.06, volumen: 0.16 });
    this._ruidoFiltrado({ duracion: 0.05, volumen: 0.10, desde: 4000, hasta: 1200, tipo: 'bandpass', q: 2 });
  }

  /** Explosión de enemigo pequeño: porcelana rota. */
  explosionPequena() {
    this._ruidoFiltrado({ duracion: 0.22, volumen: 0.22, desde: 3200, hasta: 260 });
    this._tono({ frecuencia: 240, hasta: 60, tipo: 'triangle', duracion: 0.20, volumen: 0.14 });
  }

  /** Explosión de la cafetera: más grave y más larga, se siente el peso. */
  explosionGrande() {
    this._ruidoFiltrado({ duracion: 0.42, volumen: 0.28, desde: 2200, hasta: 120 });
    this._tono({ frecuencia: 150, hasta: 40, tipo: 'sawtooth', duracion: 0.40, volumen: 0.18 });
  }

  /** Muerte del jugador: porcelana estallando y un lamento descendente. */
  muerteJugador() {
    this._ruidoFiltrado({ duracion: 0.7, volumen: 0.3, desde: 5000, hasta: 90 });
    this._tono({ frecuencia: 500, hasta: 45, tipo: 'sawtooth', duracion: 0.65, volumen: 0.22 });
    this._tono({ frecuencia: 330, hasta: 30, tipo: 'square', duracion: 0.7, volumen: 0.12 });
  }

  /**
   * Aviso de ataque. Cada tipo suena distinto para que un jugador experto
   * pueda esquivar de oído sin mirar.
   */
  aviso(tipo) {
    const frecuencias = { grano: 1200, avispa: 1600, cafetera: 700 };
    this._tono({
      frecuencia: frecuencias[tipo] ?? 1200,
      hasta: (frecuencias[tipo] ?? 1200) * 1.4,
      tipo: 'square', duracion: 0.07, volumen: 0.09,
    });
  }

  /** Disparo enemigo: siseo de vapor, muy distinto del disparo del jugador. */
  disparoEnemigo() {
    this._ruidoFiltrado({ duracion: 0.14, volumen: 0.10, desde: 900, hasta: 2600, tipo: 'bandpass', q: 3 });
  }

  /** Vida extra: fanfarria ascendente. Tiene que dar alegría. */
  vidaExtra() {
    const notas = [523, 659, 784, 1047];
    notas.forEach((f, i) => {
      setTimeout(() => this._tono({
        frecuencia: f, tipo: 'square', duracion: 0.12, volumen: 0.16,
      }), i * 70);
    });
  }

  /** Nuevo récord: distinto de la vida extra, como pide la biblia. */
  nuevoRecord() {
    const notas = [784, 988, 1175, 1568, 1175, 1568];
    notas.forEach((f, i) => {
      setTimeout(() => this._tono({
        frecuencia: f, tipo: 'triangle', duracion: 0.16, volumen: 0.15,
      }), i * 90);
    });
  }

  /** Oleada despejada. */
  oleadaDespejada() {
    const notas = [659, 784, 1047];
    notas.forEach((f, i) => {
      setTimeout(() => this._tono({
        frecuencia: f, tipo: 'square', duracion: 0.14, volumen: 0.14,
      }), i * 90);
    });
  }

  /** Fin de la invulnerabilidad: aviso de que vuelves a ser mortal. */
  finInvulnerabilidad() {
    this._tono({ frecuencia: 1400, hasta: 700, tipo: 'sine', duracion: 0.12, volumen: 0.10 });
  }

  /** Empezar partida. */
  comenzar() {
    const notas = [392, 523, 659, 784];
    notas.forEach((f, i) => {
      setTimeout(() => this._tono({
        frecuencia: f, tipo: 'square', duracion: 0.1, volumen: 0.14,
      }), i * 60);
    });
  }

  /** Fin de partida: caída lenta y triste. */
  finPartida() {
    const notas = [523, 415, 330, 220];
    notas.forEach((f, i) => {
      setTimeout(() => this._tono({
        frecuencia: f, tipo: 'triangle', duracion: 0.3, volumen: 0.16,
      }), i * 180);
    });
  }

  // -------------------------------------------------------------------------
  // MÚSICA
  // -------------------------------------------------------------------------

  /**
   * Un tema de recreativa de verdad: melodía pegadiza, bajo que camina y
   * percusión. Tres voces sonando a la vez, como una máquina de los ochenta.
   *
   * Está en LA MENOR, que es la escala del arcade clásico: suena épica y algo
   * melancólica sin sonar triste.
   *
   * CÓMO SE MIDE EL TIEMPO
   * Las notas NO se lanzan "cuando toca el fotograma": se programan por
   * adelantado en el reloj del propio motor de audio, unas décimas antes de
   * sonar. Si dependieran de los fotogramas, el ritmo cojearía, porque los
   * fotogramas no caen en instantes musicalmente exactos. Esto es lo que
   * separa una música que suena bien de una que suena mal.
   */
  arrancarMusica() {
    if (this._musicaActiva) return;
    this._musicaActiva = true;
    this._paso = 0;
    this._instanteProximoPaso = this.listo ? this.ctx.currentTime + 0.1 : 0;
  }

  pararMusica() {
    this._musicaActiva = false;
  }

  /**
   * @param {number} tension  0 = escuadra completa · 1 = quedan poquísimos
   */
  actualizarMusica(dt, tension = 0) {
    if (!this.listo || !this._musicaActiva) return;
    this._tension = tension;

    // Arranque perezoso: si la música se pidió antes de que existiera el
    // motor de audio, se engancha aquí.
    if (!this._instanteProximoPaso) this._instanteProximoPaso = this.ctx.currentTime + 0.1;

    // El tempo sube con la tensión: de 132 a 168 pulsaciones por minuto.
    // Cuanto menos queda de la escuadra, más aprieta la música.
    const bpm = 132 + tension * 36;
    const duracionPaso = 60 / bpm / 4;   // un paso = una semicorchea

    // Se programan por adelantado todos los pasos que caigan en la próxima
    // décima de segundo.
    const horizonte = this.ctx.currentTime + 0.12;
    let vueltas = 0;
    while (this._instanteProximoPaso < horizonte && vueltas < 32) {
      this._programarPaso(this._paso, this._instanteProximoPaso, duracionPaso);
      this._paso = (this._paso + 1) % PATRON_PASOS;
      this._instanteProximoPaso += duracionPaso;
      vueltas++;
    }
  }

  _programarPaso(paso, cuando, duracionPaso) {
    const tension = this._tension ?? 0;
    const compas = Math.floor(paso / 16);

    // --- 1. LA CAPA DE FONDO ---
    // Un acorde larguísimo y muy suave que dura todo el compás. No se
    // "escucha", se siente: es lo que da la sensación de estar flotando en
    // algo inmenso. Sin esta capa la música suena a pitidos; con ella suena
    // a espacio.
    if (paso % 16 === 0) {
      const acorde = ACORDES[compas];
      for (let i = 0; i < acorde.length; i++) {
        this._tono({
          frecuencia: acorde[i] * 2,
          tipo: 'sine',
          duracion: duracionPaso * 17,
          volumen: 0.055,
          ataque: duracionPaso * 4,   // entra despacio, como una nebulosa
          // Va SIN eco: su amplitud ya viene de que la nota es larguísima y
          // entra despacio. Con eco solo añadía suciedad.
          destino: this.musica,
          cuando,
        });
      }
    }

    // --- 2. EL ARPEGIO ---
    // Las notas del acorde recorridas muy rápido, subiendo y bajando. Es la
    // firma sonora de los shooters espaciales: da movimiento constante y
    // sensación de velocidad sin necesitar melodía.
    const arpegio = _notaArpegio(compas, paso % 16);
    if (arpegio) {
      this._tono({
        frecuencia: arpegio,
        tipo: 'square',
        duracion: duracionPaso * 0.9,
        volumen: 0.095,
        ataque: 0.002,
        // SECO, y este es el arreglo importante. Con eco, cada nota del
        // arpegio se solapaba con el eco de las dos anteriores y el conjunto
        // sonaba sucio. Nítido suena mucho más arcade.
        destino: this.musica,
        cuando,
      });
    }

    // --- 3. LA MELODÍA ---
    // Pocas notas y largas, flotando por encima del arpegio. Con eco, para
    // que cada nota se aleje y deje rastro.
    const nota = MELODIA[paso];
    if (nota) {
      this._tono({
        frecuencia: nota,
        tipo: 'square',
        duracion: duracionPaso * 3.4,
        volumen: 0.15,
        ataque: 0.008,
        destino: this.musicaConEco,
        cuando,
      });
      // Segunda voz una quinta arriba: engorda la melodía y suena épico.
      // Seca, para que solo la voz principal deje rastro.
      this._tono({
        frecuencia: nota * 1.5,
        tipo: 'triangle',
        duracion: duracionPaso * 3.0,
        volumen: 0.05,
        destino: this.musica,
        cuando,
      });
    }

    // --- 4. EL BAJO ---
    // Grave, sostenido y seco (sin eco, para que no embarre el ritmo).
    const bajo = BAJO[paso];
    if (bajo) {
      this._tono({
        frecuencia: bajo,
        tipo: 'sawtooth',
        duracion: duracionPaso * 3.6,
        volumen: 0.13,
        destino: this.musica,
        cuando,
      });
    }

    // --- 5. PERCUSIÓN ---
    if (PERCUSION.bombo.includes(paso)) {
      this._tono({
        frecuencia: 120, hasta: 40, tipo: 'sine',
        duracion: 0.15, volumen: 0.30, destino: this.musica, cuando,
      });
    }
    if (PERCUSION.caja.includes(paso)) {
      this._percusionRuido(cuando, 0.12, 0.11, 1400, 'highpass', this.musica);
    }
    // El charles solo aparece cuando la cosa se pone tensa: es lo que hace
    // que el mismo tema suene más urgente sin cambiar de melodía.
    if (tension > 0.35 && paso % 2 === 1) {
      this._percusionRuido(cuando, 0.03, 0.045, 7500, 'highpass', this.musica);
    }
  }

  /** Golpe de percusión: un chasquido de ruido filtrado. */
  _percusionRuido(cuando, duracion, volumen, frecuencia, tipo, destino = null) {
    const fuente = this.ctx.createBufferSource();
    fuente.buffer = this._ruido;

    const filtro = this.ctx.createBiquadFilter();
    filtro.type = tipo;
    filtro.frequency.value = frecuencia;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(volumen, cuando);
    g.gain.exponentialRampToValueAtTime(0.0001, cuando + duracion);

    fuente.connect(filtro);
    filtro.connect(g);
    g.connect(destino || this.musica);
    fuente.start(cuando);
    fuente.stop(cuando + duracion);
  }
}

// ---------------------------------------------------------------------------
// EL TEMA
// ---------------------------------------------------------------------------

/**
 * Frecuencias de las notas que se usan. Se escriben así, con nombre, para que
 * la melodía de abajo se pueda leer y retocar sin saber de música.
 */
const N = {
  A2: 110.00, E3: 164.81, F3: 174.61, G3: 196.00, Gs3: 207.65, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, Gs4: 415.30,
  A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, Gs5: 830.61, A5: 880.00,
  C6: 1046.50, E6: 1318.51,
};

/**
 * LOS CUATRO ACORDES del tema, uno por compás.
 *
 * Está en LA MENOR ARMÓNICA, que es la menor de toda la vida pero con el sol
 * SOSTENIDO en lugar de natural. Ese medio tono cambia todo: es lo que hace
 * que suene misterioso y algo inquietante en lugar de simplemente triste. Es
 * la escala de la ciencia ficción y del arcade espacial.
 *
 * La progresión Am · F · Dm · E es de las más épicas que existen: los tres
 * primeros acordes van cayendo y el último tira hacia arriba, pidiendo volver
 * al principio. Por eso da ganas de que el bucle no pare.
 */
const ACORDES = [
  [N.A3, N.C4, N.E4],        // Am
  [N.F3, N.A3, N.C4],        // F
  [N.D4, N.F4, N.A4],        // Dm
  [N.E3, N.Gs3, N.B3],       // E  ← el sol sostenido, el color espacial
];

/**
 * El arpegio recorre el acorde del compás subiendo y bajando en 16 pasos.
 * Se calcula en lugar de escribirse a mano: así retocar un acorde cambia el
 * arpegio solo, y no hay 64 números que mantener sincronizados.
 */
function _notaArpegio(compas, pasoEnCompas) {
  const acorde = ACORDES[compas];
  // Tres octavas del acorde: sube seis notas y baja, con un hueco al final
  // para que el compás respire.
  const escalera = [
    acorde[0], acorde[1], acorde[2], acorde[0] * 2,
    acorde[1] * 2, acorde[2] * 2, acorde[0] * 4, acorde[2] * 2,
    acorde[1] * 2, acorde[0] * 2, acorde[2], acorde[1],
    acorde[0], acorde[1], acorde[2], 0,
  ];
  return escalera[pasoEnCompas];
}

/**
 * LA MELODÍA. Pocas notas y largas, flotando por encima del arpegio.
 * Cada hueco es una semicorchea; `0` es silencio.
 *
 * Antes tenía muchas notas seguidas y sonaba a marcha. Ahora respira: el
 * silencio entre notas es lo que da la sensación de vacío, y con el eco cada
 * nota se aleja dejando rastro. En el espacio, lo que se oye importa menos
 * que lo que no se oye.
 */
const MELODIA = [
  // Compás 1 — Am: la frase se abre hacia arriba
  N.A4, 0, 0, 0, 0, 0, N.C5, 0, N.E5, 0, 0, 0, 0, 0, 0, 0,
  // Compás 2 — F: sube más, la nota más alta del tema
  N.F5, 0, 0, 0, 0, 0, N.E5, 0, N.A5, 0, 0, 0, 0, 0, N.G5, 0,
  // Compás 3 — Dm: cae y se queda suspendida
  N.F5, 0, 0, 0, N.D5, 0, 0, 0, N.A4, 0, 0, 0, N.D5, 0, 0, 0,
  // Compás 4 — E: el sol sostenido, y el gancho que pide volver a empezar
  N.Gs5, 0, 0, 0, N.B4, 0, 0, 0, N.E5, 0, 0, N.Gs5, N.B4, 0, N.E5, 0,
];

/** El bajo, grave y sostenido: la nota de cada acorde con su octava. */
const BAJO = [
  N.A2, 0, 0, 0, 0, 0, 0, 0, N.A2, 0, 0, 0, 0, 0, N.E3, 0,
  N.F3, 0, 0, 0, 0, 0, 0, 0, N.F3, 0, 0, 0, 0, 0, N.C4, 0,
  N.D4, 0, 0, 0, 0, 0, 0, 0, N.D4, 0, 0, 0, 0, 0, N.A3, 0,
  N.E3, 0, 0, 0, 0, 0, 0, 0, N.E3, 0, 0, 0, 0, 0, N.Gs3, 0,
];

const PATRON_PASOS = MELODIA.length;

/** Bombo en los tiempos fuertes, caja en los débiles. Lo de siempre, y funciona. */
const PERCUSION = {
  bombo: [0, 8, 16, 24, 32, 40, 48, 56, 62],
  caja: [4, 12, 20, 28, 36, 44, 52, 60],
};
