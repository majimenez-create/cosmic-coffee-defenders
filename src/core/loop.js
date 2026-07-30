/**
 * BUCLE — El reloj del juego.
 * ===========================
 *
 * El juego PIENSA exactamente 60 veces por segundo, ni una más ni una menos,
 * da igual lo potente que sea el dispositivo. Dibuja tantas veces como pueda.
 *
 * ¿Por qué es tan importante? La biblia exige que los patrones de ataque sean
 * aprendibles. Eso solo se cumple si un ataque recorre siempre exactamente el
 * mismo camino en un móvil viejo y en un ordenador rápido. Si el juego pensara
 * "lo que dé tiempo en cada fotograma", la misma coreografía recorrería
 * distancias distintas en cada máquina y el juego sería más fácil o imposible
 * según el hardware. Además hace que el ranking mundial compare partidas
 * comparables.
 */

import { PANTALLA } from '../config/balance.js';

const PASO_MS = 1000 / PANTALLA.FPS_LOGICOS;
const PASO_S = 1 / PANTALLA.FPS_LOGICOS;

export class Bucle {
  /**
   * @param {(dt:number) => void} actualizar  Un paso de lógica. Recibe siempre 1/60.
   * @param {(alpha:number) => void} dibujar
   */
  constructor(actualizar, dibujar) {
    this.actualizar = actualizar;
    this.dibujar = dibujar;

    this.corriendo = false;
    this.acumulador = 0;
    this.ultimoInstante = 0;
    this.escalaTiempo = 1;   // 1 normal, 0 en pausa o congelación de impacto
    this._id = null;

    // Si la pestaña se oculta, el navegador deja de dibujar y al volver
    // entregaría un salto de varios segundos. Se pausa y se limpia el reloj.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pausar();
    });
    window.addEventListener('blur', () => this.pausar());
  }

  arrancar() {
    if (this.corriendo) return;
    this.corriendo = true;
    this.ultimoInstante = performance.now();
    this.acumulador = 0;
    this._id = requestAnimationFrame((t) => this._frame(t));
  }

  pausar() {
    this.corriendo = false;
    if (this._id !== null) cancelAnimationFrame(this._id);
    this._id = null;
  }

  /** Congela la lógica sin dejar de dibujar: el "golpe" al destruir algo. */
  congelar(ms) {
    this._congeladoHasta = performance.now() + ms;
  }

  _frame(instante) {
    if (!this.corriendo) return;
    this._id = requestAnimationFrame((t) => this._frame(t));

    let transcurrido = instante - this.ultimoInstante;
    this.ultimoInstante = instante;

    // Tope de seguridad: nunca se procesan más de 5 pasos seguidos. Sin esto,
    // volver de una pestaña en segundo plano dispararía cientos de pasos de
    // golpe y el jugador moriría sin haber visto nada.
    const maximo = PASO_MS * PANTALLA.PASOS_MAXIMOS_POR_FRAME;
    if (transcurrido > maximo) transcurrido = maximo;

    const congelado = this._congeladoHasta && instante < this._congeladoHasta;
    if (!congelado) {
      this.acumulador += transcurrido * this.escalaTiempo;
      while (this.acumulador >= PASO_MS) {
        this.actualizar(PASO_S);
        this.acumulador -= PASO_MS;
      }
    }

    this.dibujar(this.acumulador / PASO_MS);
  }
}
