/**
 * BUCLE — El reloj del juego.
 * ===========================
 *
 * El juego PIENSA exactamente 60 veces por segundo, ni una más ni una menos,
 * da igual lo potente que sea el dispositivo. Dibuja tantas veces como pueda.
 *
 * ¿Por qué es tan importante? La biblia exige que los patrones de ataque sean
 * aprendibles. Eso solo se cumple si un ataque recorre siempre exactamente el
 * mismo camino en un móvil viejo y en un ordenador rápido. También hace que
 * el ranking mundial compare partidas comparables.
 *
 * El bucle NUNCA se detiene solo. Si se detuviera al perder el foco, habría
 * que acordarse de arrancarlo otra vez, y olvidarlo deja el juego congelado
 * sin forma de recuperarlo salvo recargando. En su lugar avisa a quien
 * corresponda, y es el juego quien decide ponerse en pausa.
 */

import { PANTALLA } from '../config/balance.js';

const PASO_MS = 1000 / PANTALLA.FPS_LOGICOS;
const PASO_S = 1 / PANTALLA.FPS_LOGICOS;

export class Bucle {
  /**
   * @param {(dt:number) => void} actualizar        Un paso de lógica. Recibe siempre 1/60.
   * @param {(alpha:number) => void} dibujar
   * @param {(dt:number) => void} [actualizarEfectos]
   *        Lo único que sigue avanzando durante la congelación de impacto.
   */
  constructor(actualizar, dibujar, actualizarEfectos = null) {
    this.actualizar = actualizar;
    this.dibujar = dibujar;
    this.actualizarEfectos = actualizarEfectos;

    /** Se llama cuando el jugador deja de mirar la pantalla. */
    this.alPerderFoco = null;

    this.corriendo = false;
    this.acumulador = 0;
    this.ultimoInstante = 0;
    this.escalaTiempo = 1;
    this._congeladoHasta = 0;
    this._id = null;

    // Al ocultarse la pestaña el navegador deja de entregar fotogramas por su
    // cuenta; al volver, el tope de pasos evita el salto de simulación. Lo
    // único que hace falta aquí es avisar para que el juego se pause.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.alPerderFoco?.();
    });
    window.addEventListener('blur', () => this.alPerderFoco?.());
  }

  arrancar() {
    if (this.corriendo) return;
    this.corriendo = true;
    this.ultimoInstante = performance.now();
    this.acumulador = 0;
    this._id = requestAnimationFrame((t) => this._frame(t));
  }

  detener() {
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
    // volver de otra pestaña dispararía cientos de pasos de golpe y el
    // jugador moriría sin haber visto nada.
    const maximo = PASO_MS * PANTALLA.PASOS_MAXIMOS_POR_FRAME;
    if (transcurrido > maximo) transcurrido = maximo;

    this.acumulador += transcurrido * this.escalaTiempo;
    const congelado = instante < this._congeladoHasta;

    while (this.acumulador >= PASO_MS) {
      this.acumulador -= PASO_MS;
      // Durante la congelación se sigue animando la explosión que la ha
      // provocado. Si se congelara TODO parecería un tirón, no un impacto.
      if (congelado) this.actualizarEfectos?.(PASO_S);
      else this.actualizar(PASO_S);
    }

    this.dibujar();
  }
}
