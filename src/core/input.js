/**
 * ENTRADA — Teclado, dedos y mando, en un solo sitio.
 * ===================================================
 *
 * El resto del juego NO escucha eventos: pregunta por el estado actual. Eso
 * permite que mañana una demo automática o un tutorial "muevan" la taza sin
 * tocar ni una línea del jugador.
 *
 * Regla de oro nº 1 de la experiencia: la entrada se lee cada paso y se aplica
 * en ese mismo paso. Cero inercia, cero suavizado, cero zonas muertas.
 */

import { TECLAS, TACTIL, MANDO, ZONA_JUGADOR } from '../config/balance.js';

export class Entrada {
  /** @param {import('./canvas.js').Lienzo} lienzo */
  constructor(lienzo) {
    this.lienzo = lienzo;

    // Estado que lee el juego.
    this.ejeX = 0;               // -1 izquierda, 0 quieto, 1 derecha
    this.objetivoX = null;       // posición absoluta pedida por el dedo
    this.disparoMantenido = false;
    this.disparoPulsado = false; // solo durante un paso, hay que consumirlo
    this.pausaPulsada = false;
    this.confirmarPulsado = false;
    this.hayTactil = false;      // se activa al primer toque real
    this.sensibilidad = TACTIL.SENSIBILIDADES.normal;

    // Pila de teclas de dirección: si se pulsan las dos, gana la ÚLTIMA.
    // Cancelarlas entre sí produce paradas fantasma que el jugador percibe
    // como un fallo del juego; y que gane siempre la izquierda es injusto.
    this._pilaDirecciones = [];
    this._teclas = new Set();

    // Arrastre relativo: al tocar, la taza no se mueve. Se recuerda dónde
    // estaba el dedo y dónde la taza, y a partir de ahí se mueven igual.
    this._toqueId = null;
    this._anclaDedo = 0;
    this._anclaTaza = 0;

    this._instalarTeclado();
    this._instalarPuntero();
  }

  // -------------------------------------------------------------------------
  // Teclado
  // -------------------------------------------------------------------------

  _instalarTeclado() {
    window.addEventListener('keydown', (e) => {
      // Se usa e.code y no e.key: con e.key, un teclado francés AZERTY o un
      // Dvorak rompería el WASD.
      const codigo = e.code;
      if (this._esDeJuego(codigo)) e.preventDefault();
      if (e.repeat) return;

      this._teclas.add(codigo);

      if (TECLAS.IZQUIERDA.includes(codigo)) this._empujarDireccion(-1);
      if (TECLAS.DERECHA.includes(codigo)) this._empujarDireccion(1);
      if (TECLAS.DISPARO.includes(codigo)) {
        this.disparoMantenido = true;
        this.disparoPulsado = true;
      }
      if (TECLAS.PAUSA.includes(codigo)) this.pausaPulsada = true;
      if (TECLAS.CONFIRMAR.includes(codigo)) this.confirmarPulsado = true;
    });

    window.addEventListener('keyup', (e) => {
      const codigo = e.code;
      this._teclas.delete(codigo);

      if (TECLAS.IZQUIERDA.includes(codigo)) this._quitarDireccion(-1);
      if (TECLAS.DERECHA.includes(codigo)) this._quitarDireccion(1);
      if (TECLAS.DISPARO.includes(codigo)) {
        // Solo se suelta si ninguna otra tecla de disparo sigue pulsada.
        this.disparoMantenido = TECLAS.DISPARO.some((c) => this._teclas.has(c));
      }
    });

    // Si la ventana pierde el foco con una tecla pulsada, el navegador nunca
    // entrega el "keyup" y la taza se quedaría moviéndose sola al volver.
    window.addEventListener('blur', () => this.limpiar());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.limpiar();
    });
  }

  _esDeJuego(codigo) {
    return (
      TECLAS.IZQUIERDA.includes(codigo) ||
      TECLAS.DERECHA.includes(codigo) ||
      TECLAS.DISPARO.includes(codigo) ||
      codigo === 'Space'
    );
  }

  _empujarDireccion(dir) {
    this._quitarDireccion(dir);
    this._pilaDirecciones.push(dir);
    this._recalcularEje();
  }

  _quitarDireccion(dir) {
    this._pilaDirecciones = this._pilaDirecciones.filter((d) => d !== dir);
    this._recalcularEje();
  }

  _recalcularEje() {
    this.ejeX = this._pilaDirecciones.length
      ? this._pilaDirecciones[this._pilaDirecciones.length - 1]
      : 0;
  }

  // -------------------------------------------------------------------------
  // Dedos y ratón
  // -------------------------------------------------------------------------

  _instalarPuntero() {
    const lienzo = this.lienzo.canvas;

    // pointer* cubre ratón, dedo y lápiz con un solo camino de código.
    lienzo.addEventListener('pointerdown', (e) => {
      const pos = this.lienzo.aCoordenadasLogicas(e.clientX, e.clientY);
      if (pos.y < TACTIL.Y_MINIMA_CAPTURA) return;

      e.preventDefault();
      this.hayTactil = true;

      if (this._toqueId === null) {
        this._toqueId = e.pointerId;
        this._anclaDedo = pos.x;
        // El ancla de la taza la fija el jugador al arrancar el arrastre.
        this._anclaTaza = this.objetivoX ?? pos.x;
        lienzo.setPointerCapture?.(e.pointerId);
      }
    });

    lienzo.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this._toqueId) return;
      e.preventDefault();

      const pos = this.lienzo.aCoordenadasLogicas(e.clientX, e.clientY);
      const destino = this._anclaTaza + (pos.x - this._anclaDedo) * this.sensibilidad;

      const min = ZONA_JUGADOR.MARGEN_IZQUIERDO;
      const max = ZONA_JUGADOR.MARGEN_DERECHO;
      this.objetivoX = Math.max(min, Math.min(max, destino));

      // Reanclaje: si la taza está pegada a un borde y el dedo sigue
      // empujando en esa dirección, se reajusta el ancla para que el gesto de
      // vuelta responda al instante. Sin esto se acumula una "zona muerta" y
      // el control se siente roto.
      if (destino < min || destino > max) {
        this._anclaDedo = pos.x;
        this._anclaTaza = this.objetivoX;
      }
    });

    const soltar = (e) => {
      if (e.pointerId !== this._toqueId) return;
      this._toqueId = null;
      // La taza se queda donde está. No vuelve al centro ni se desliza.
    };
    lienzo.addEventListener('pointerup', soltar);
    lienzo.addEventListener('pointercancel', soltar);

    // El navegador no debe interpretar ningún gesto sobre el lienzo.
    lienzo.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    lienzo.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // -------------------------------------------------------------------------
  // Mando
  // -------------------------------------------------------------------------

  _leerMando() {
    if (!navigator.getGamepads) return;
    const mandos = navigator.getGamepads();
    for (const m of mandos) {
      if (!m) continue;

      const eje = m.axes[0] ?? 0;
      const cruzIzq = m.buttons[14]?.pressed;
      const cruzDer = m.buttons[15]?.pressed;

      if (cruzIzq) this.ejeX = -1;
      else if (cruzDer) this.ejeX = 1;
      else if (Math.abs(eje) > MANDO.ZONA_MUERTA) this.ejeX = Math.sign(eje);

      const dispara = m.buttons[0]?.pressed;
      if (dispara && !this._mandoDisparaba) this.disparoPulsado = true;
      if (dispara) this.disparoMantenido = true;
      this._mandoDisparaba = dispara;

      const pausa = m.buttons[9]?.pressed;
      if (pausa && !this._mandoPausaba) this.pausaPulsada = true;
      this._mandoPausaba = pausa;

      return; // solo el primer mando conectado
    }
  }

  // -------------------------------------------------------------------------

  /** Se llama al principio de cada paso lógico. */
  actualizar() {
    this._leerMando();
  }

  /** Se llama al final: consume los eventos de un solo paso. */
  finPaso() {
    this.disparoPulsado = false;
    this.pausaPulsada = false;
    this.confirmarPulsado = false;
  }

  limpiar() {
    this._teclas.clear();
    this._pilaDirecciones = [];
    this.ejeX = 0;
    this.disparoMantenido = false;
    this.disparoPulsado = false;
    this._toqueId = null;
  }

  /** Le dice a la entrada dónde está la taza, para que el arrastre se ancle bien. */
  sincronizarPosicion(x) {
    if (this._toqueId === null) this.objetivoX = x;
  }
}
