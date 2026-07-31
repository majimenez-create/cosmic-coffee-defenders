/**
 * PANTALLA DE AJUSTES
 * ===================
 *
 * Una lista navegable. Se sube y baja con las flechas verticales, se cambia el
 * valor con las horizontales, y se sale con Escape o Enter.
 *
 * Cada cambio se aplica y se guarda EN EL MOMENTO, sin botón de "guardar".
 * Un botón de guardar solo sirve para que alguien pierda sus cambios por no
 * haberlo pulsado.
 */

import { PANTALLA } from '../config/balance.js';
// OPCIONES se usa tanto para dibujar la lista como para saber qué fila se ha
// tocado, así que el orden de este array es el orden visual de la pantalla.
import { HUD, JUGADOR as COL_JUGADOR, TIPOGRAFIA, FONDO } from '../config/palette.js';
import { dibujarTexto } from '../render/text.js';
import { OPCIONES } from '../services/settings.js';

const T = TIPOGRAFIA.TAMANOS;
const E = TIPOGRAFIA.ESPACIADOS;

export class PantallaAjustes {
  /**
   * @param {import('../core/input.js').Entrada} entrada
   * @param {import('../core/audio.js').Audio} audio
   * @param {import('../render/background.js').Fondo} fondo
   * @param {import('../services/settings.js').Ajustes} ajustes
   */
  constructor(entrada, audio, fondo, ajustes) {
    this.entrada = entrada;
    this.audio = audio;
    this.fondo = fondo;
    this.ajustes = ajustes;
    this.seleccion = 0;
    this.tiempo = 0;
  }

  entrar() {
    this.tiempo = 0;
    this.entrada.limpiar();
  }

  actualizar(dt) {
    this.tiempo += dt;
    this.entrada.actualizar();
    this.fondo.actualizar(dt);

    const e = this.entrada;

    if (e.arribaPulsado) {
      this.seleccion = (this.seleccion - 1 + OPCIONES.length) % OPCIONES.length;
      this.audio.impacto();
    }
    if (e.abajoPulsado) {
      this.seleccion = (this.seleccion + 1) % OPCIONES.length;
      this.audio.impacto();
    }

    // Las flechas horizontales cambian el valor. Se usa el pulso, no el
    // mantenido, para que no se pase de golpe todo el rango.
    const opcion = OPCIONES[this.seleccion];
    if (e.izquierdaPulsada) {
      this.ajustes.cambiar(opcion.id, -1);
      this.audio.disparo();
    }
    if (e.derechaPulsada) {
      this.ajustes.cambiar(opcion.id, 1);
      this.audio.disparo();
    }

    // En el móvil se toca la mitad izquierda o derecha de una fila para
    // cambiar su valor, y el botón de abajo para volver. Sin esto, la pantalla
    // de ajustes sería inalcanzable sin teclado.
    if (e.toquePulsado && e.ultimoToque) {
      const { x, y } = e.ultimoToque;
      if (y > 580) {
        this.ir('portada');
        e.finPaso();
        return;
      }
      const fila = Math.round((y - 118) / 42);
      if (fila >= 0 && fila < OPCIONES.length) {
        this.seleccion = fila;
        this.ajustes.cambiar(OPCIONES[fila].id, x < PANTALLA.ANCHO / 2 ? -1 : 1);
        this.audio.disparo();
      }
    }

    if (e.pausaPulsada || e.confirmarPulsado) {
      this.ir('portada');
    }

    e.finPaso();
  }

  dibujar(ctx) {
    this.fondo.dibujar(ctx);

    ctx.fillStyle = FONDO.VELO_PANTALLA;
    ctx.fillRect(0, 0, PANTALLA.ANCHO, PANTALLA.ALTO);

    const centro = PANTALLA.ANCHO / 2;

    dibujarTexto(ctx, 'AJUSTES', centro, 64, {
      tamano: T.ENCABEZADO, color: HUD.TEXTO_PRIMARIO,
      espaciado: E.ENCABEZADO, alineacion: 'centro',
    });

    OPCIONES.forEach((opcion, i) => {
      const y = 118 + i * 42;
      const elegida = i === this.seleccion;

      if (elegida) {
        // El cursor parpadea despacio: señala sin distraer.
        dibujarTexto(ctx, '▸', 14, y, {
          tamano: T.OPCION_MENU, color: COL_JUGADOR.CIAN,
          alpha: Math.sin(this.tiempo * 6) > -0.4 ? 1 : 0.3,
        });
      }

      dibujarTexto(ctx, opcion.nombre, 30, y, {
        tamano: T.ETIQUETA_HUD,
        color: elegida ? HUD.TEXTO_PRIMARIO : HUD.ETIQUETA,
        espaciado: E.ETIQUETA,
      });

      dibujarTexto(ctx, this.ajustes.textoDe(opcion.id), PANTALLA.ANCHO - 24, y, {
        tamano: T.VALOR_HUD,
        color: elegida ? HUD.VALOR_DESTACADO : HUD.CUERPO_TEXTO,
        espaciado: E.VALOR, alineacion: 'derecha',
      });

      // La explicación solo aparece en la opción elegida: así hay ayuda sin
      // llenar la pantalla de texto.
      if (elegida && opcion.ayuda) {
        dibujarTexto(ctx, opcion.ayuda, 30, y + 15, {
          tamano: T.ETIQUETA_HUD, color: COL_JUGADOR.CIAN,
          espaciado: 0.04, alpha: 0.85,
        });
      }
    });

    if (this.ajustes.movimientoReducidoDetectado) {
      dibujarTexto(ctx, 'MOVIMIENTO REDUCIDO DETECTADO EN TU SISTEMA', centro, 572, {
        tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA,
        espaciado: E.ETIQUETA, alineacion: 'centro', alpha: 0.8,
      });
    }

    // La ayuda cambia según el dispositivo: en el móvil no hay flechas.
    if (this.entrada.esTactil) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = HUD.MARCO;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(centro - 70, 586, 140, 28, 4);
      ctx.stroke();
      ctx.restore();

      dibujarTexto(ctx, 'VOLVER', centro, 600, {
        tamano: T.ETIQUETA_HUD, color: HUD.TEXTO_PRIMARIO,
        espaciado: E.ETIQUETA, alineacion: 'centro',
      });
      dibujarTexto(ctx, 'TOCA A UN LADO U OTRO PARA CAMBIAR', centro, 566, {
        tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA,
        espaciado: E.ETIQUETA, alineacion: 'centro', alpha: 0.8,
      });
    } else {
      dibujarTexto(ctx, '↑ ↓ ELEGIR   ← → CAMBIAR   P VOLVER', centro, 600, {
        tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA,
        espaciado: E.ETIQUETA, alineacion: 'centro',
      });
    }
  }
}
