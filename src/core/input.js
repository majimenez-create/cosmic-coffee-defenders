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

    /**
     * Se llama UNA vez, en la primera tecla o el primer toque de verdad.
     * Los navegadores prohíben hacer sonar nada antes de eso, así que es el
     * momento exacto en el que se puede encender el audio.
     */
    this.alPrimerGesto = null;
    this._huboGesto = false;

    this._instalarTeclado();
    this._instalarPuntero();
  }

  _primerGesto() {
    if (this._huboGesto) return;
    this._huboGesto = true;
    this.alPrimerGesto?.();
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

      this._primerGesto();
      this._teclas.add(codigo);

      if (TECLAS.IZQUIERDA.includes(codigo)) {
        this._empujarDireccion(-1);
        this.izquierdaPulsada = true;
      }
      if (TECLAS.DERECHA.includes(codigo)) {
        this._empujarDireccion(1);
        this.derechaPulsada = true;
      }
      // Arriba y abajo solo se usan para navegar menús, no para jugar: la taza
      // nunca sube ni baja.
      if (TECLAS.ARRIBA.includes(codigo)) this.arribaPulsado = true;
      if (TECLAS.ABAJO.includes(codigo)) this.abajoPulsado = true;
      if (TECLAS.DISPARO.includes(codigo)) {
        this.disparoMantenido = true;
        this.disparoPulsado = true;
      }
      if (TECLAS.PAUSA.includes(codigo)) this.pausaPulsada = true;
      if (TECLAS.CONFIRMAR.includes(codigo)) this.confirmarPulsado = true;
      if (TECLAS.SILENCIAR.includes(codigo)) this.silenciarPulsado = true;
      if (TECLAS.AYUDA.includes(codigo)) this.ayudaPulsada = true;
      if (TECLAS.AJUSTES.includes(codigo)) this.ajustesPulsado = true;
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

  /**
   * Teclas cuyo comportamiento por defecto del navegador hay que anular
   * (la barra espaciadora hace scroll, las flechas también).
   *
   * La pausa NO está aquí a propósito: en pantalla completa el navegador se
   * queda con Escape para salir y el juego nunca lo recibe. Por eso la tecla
   * de pausa documentada es P.
   */
  _esDeJuego(codigo) {
    return (
      TECLAS.IZQUIERDA.includes(codigo) ||
      TECLAS.DERECHA.includes(codigo) ||
      TECLAS.DISPARO.includes(codigo)
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
      this._primerGesto();
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
      // La sensibilidad la elige el jugador en Ajustes.
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

  /**
   * El estado del mando se calcula aparte y se COMBINA con el del teclado.
   * Escribir directamente sobre el estado compartido dejaba la taza
   * moviéndose sola: al soltar el stick nadie devolvía el eje a cero.
   */
  _leerMando() {
    let ejeMando = 0;
    let disparaMando = false;
    let pausaMando = false;

    if (navigator.getGamepads) {
      for (const m of navigator.getGamepads()) {
        if (!m) continue;

        const eje = m.axes[0] ?? 0;
        if (m.buttons[14]?.pressed) ejeMando = -1;
        else if (m.buttons[15]?.pressed) ejeMando = 1;
        else if (Math.abs(eje) > MANDO.ZONA_MUERTA) ejeMando = Math.sign(eje);

        disparaMando = !!m.buttons[0]?.pressed;
        pausaMando = !!m.buttons[9]?.pressed;
        break; // solo el primer mando conectado
      }
    }

    if (ejeMando !== 0 && this.ejeX === 0) this.ejeX = ejeMando;

    if (disparaMando) {
      this.disparoMantenido = true;
      if (!this._mandoDisparaba) this.disparoPulsado = true;
    } else if (this._mandoDisparaba && !this._teclasDeDisparoPulsadas()) {
      this.disparoMantenido = false;
    }
    this._mandoDisparaba = disparaMando;

    if (pausaMando && !this._mandoPausaba) this.pausaPulsada = true;
    this._mandoPausaba = pausaMando;
  }

  _teclasDeDisparoPulsadas() {
    return TECLAS.DISPARO.some((c) => this._teclas.has(c));
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
    this.silenciarPulsado = false;
    this.ayudaPulsada = false;
    this.ajustesPulsado = false;
    this.izquierdaPulsada = false;
    this.derechaPulsada = false;
    this.arribaPulsado = false;
    this.abajoPulsado = false;
  }

  limpiar() {
    this._teclas.clear();
    this._pilaDirecciones = [];
    this.ejeX = 0;
    this.disparoMantenido = false;
    this.disparoPulsado = false;
    this.pausaPulsada = false;
    this.confirmarPulsado = false;
    this._toqueId = null;
    // También los flancos del mando: si no, tras volver de otra pestaña con
    // el gatillo pulsado, el juego no detectaría la siguiente pulsación.
    this._mandoDisparaba = false;
    this._mandoPausaba = false;
  }

  /** Le dice a la entrada dónde está la taza, para que el arrastre se ancle bien. */
  sincronizarPosicion(x) {
    if (this._toqueId === null) this.objetivoX = x;
  }
}
