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

    this._crearRuido();
    this.listo = true;
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
   */
  _tono({ frecuencia, hasta = null, tipo = 'square', duracion = 0.1, volumen = 0.3, ataque = 0.005, destino = null }) {
    if (!this.listo) return;
    const t = this.ctx.currentTime;

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
  // Música: el zumbido de la escuadra
  // -------------------------------------------------------------------------

  /**
   * No es una melodía: es un latido de bajo que sigue el pulso de la
   * formación, como el zumbido amenazante del Galaga original. Sube de tono
   * conforme quedan menos enemigos, así que el propio ritmo del juego te dice
   * cuánto te queda sin mirar la pantalla.
   */
  arrancarMusica() {
    this._musicaActiva = true;
    this._pasoMusica = 0;
    this._proximoPaso = 0;
  }

  pararMusica() {
    this._musicaActiva = false;
  }

  /**
   * @param {number} tensión  0 = escuadra completa · 1 = quedan poquísimos
   */
  actualizarMusica(dt, tension = 0) {
    if (!this.listo || !this._musicaActiva) return;

    this._proximoPaso -= dt;
    if (this._proximoPaso > 0) return;

    // El compás se acelera con la tensión: de 0,50 s a 0,26 s por golpe.
    const intervalo = 0.50 - tension * 0.24;
    this._proximoPaso = intervalo;

    // Cuatro notas graves que suben medio tono conforme aprieta la cosa.
    const base = 55 * (1 + tension * 0.5);
    const patron = [1, 1.5, 1.25, 1.5];
    const nota = base * patron[this._pasoMusica % patron.length];
    this._pasoMusica++;

    this._tono({
      frecuencia: nota, hasta: nota * 0.75, tipo: 'triangle',
      duracion: intervalo * 0.7, volumen: 0.20, destino: this.musica,
    });

    // Cada cuatro golpes, un armónico agudo que da el aire "espacial".
    if (this._pasoMusica % 4 === 0) {
      this._tono({
        frecuencia: nota * 6, tipo: 'sine',
        duracion: 0.10, volumen: 0.05, destino: this.musica,
      });
    }
  }
}
