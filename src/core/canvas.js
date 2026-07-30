/**
 * CANVAS — El lienzo y su escalado.
 * =================================
 *
 * El juego se dibuja SIEMPRE sobre un lienzo imaginario de 360 x 640 puntos.
 * Nadie fuera de este archivo sabe cuál es el tamaño real de la pantalla.
 *
 * ¿Por qué? Porque las velocidades de la biblia (230 px/s la taza, 520 el
 * disparo) están calibradas para ese tamaño. Si el área de juego cambiara de
 * proporción según el dispositivo, el juego se sentiría distinto en cada sitio
 * y el ranking mundial dejaría de comparar cosas comparables.
 *
 * El lienzo se amplía hasta llenar la pantalla sin recortar nunca nada, y lo
 * que sobra a los lados no son barras negras: es el marco del mueble arcade.
 */

import { PANTALLA } from '../config/balance.js';

export class Lienzo {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;

    // alpha: false le dice al navegador que el lienzo es opaco. Se ahorra una
    // composición por fotograma, que en móvil se nota.
    this.ctx = canvas.getContext('2d', { alpha: false });

    this.ancho = PANTALLA.ANCHO;
    this.alto = PANTALLA.ALTO;
    this.escala = 1;
    this.dpr = 1;

    this._alRedimensionar = [];
    this._temporizador = null;

    window.addEventListener('resize', () => this._redimensionarConEspera());
    window.addEventListener('orientationchange', () => this._redimensionarConEspera());

    this.redimensionar();
  }

  /**
   * Al girar el móvil, iOS informa de medidas equivocadas si se le pregunta
   * inmediatamente. Por eso se espera un cuarto de segundo antes de medir.
   */
  _redimensionarConEspera() {
    clearTimeout(this._temporizador);
    this._temporizador = setTimeout(() => this.redimensionar(), 250);
  }

  redimensionar() {
    const anchoDisponible = window.innerWidth;
    const altoDisponible = window.innerHeight;

    // Se elige la escala que quepa por ambos lados: así nunca se recorta.
    this.escala = Math.min(
      anchoDisponible / PANTALLA.ANCHO,
      altoDisponible / PANTALLA.ALTO,
      PANTALLA.ESCALA_MAXIMA
    );

    // Por encima de 2 el coste se dispara en móvil sin ganancia visible.
    this.dpr = Math.min(window.devicePixelRatio || 1, PANTALLA.DPR_MAXIMO);

    const anchoCss = Math.floor(PANTALLA.ANCHO * this.escala);
    const altoCss = Math.floor(PANTALLA.ALTO * this.escala);

    this.canvas.style.width = anchoCss + 'px';
    this.canvas.style.height = altoCss + 'px';

    // El búfer real es nítido, pero el sistema de coordenadas sigue siendo
    // virtual: quien dibuja sigue pensando en 360 x 640.
    this.canvas.width = Math.round(anchoCss * this.dpr);
    this.canvas.height = Math.round(altoCss * this.dpr);

    this.ctx.setTransform(
      this.canvas.width / PANTALLA.ANCHO, 0,
      0, this.canvas.height / PANTALLA.ALTO,
      0, 0
    );

    // No es pixel art: interesa que el suavizado esté activo.
    this.ctx.imageSmoothingEnabled = true;

    this._alRedimensionar.forEach((fn) => fn(this));
  }

  /** Registra algo que deba recalcularse cuando cambie el tamaño. */
  cuandoCambieTamano(fn) {
    this._alRedimensionar.push(fn);
  }

  /**
   * Convierte una posición de la pantalla real (un clic, un dedo) a las
   * coordenadas del lienzo lógico.
   */
  aCoordenadasLogicas(clienteX, clienteY) {
    const caja = this.canvas.getBoundingClientRect();
    return {
      x: (clienteX - caja.left) / this.escala,
      y: (clienteY - caja.top) / this.escala,
    };
  }

  limpiar(color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, PANTALLA.ANCHO, PANTALLA.ALTO);
  }
}
