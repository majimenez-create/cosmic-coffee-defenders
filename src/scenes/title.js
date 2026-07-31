/**
 * PORTADA — Los primeros cinco segundos.
 * ======================================
 *
 * Es lo primero que ve alguien que abre el enlace, y decide si va a jugar o va
 * a cerrar la pestaña. Tres cosas tiene que conseguir:
 *
 *   1. Que se entienda de qué va el juego sin leer nada.
 *   2. Que se sepa cómo se juega ANTES de empezar, con las teclas dibujadas.
 *   3. Que empezar cueste un solo gesto.
 *
 * De la portada a tener el control de la taza: menos de medio segundo. Ese
 * número es sagrado. Cualquier menú que se interponga es un fallo de diseño.
 */

import { PANTALLA, TIEMPOS } from '../config/balance.js';
import { HUD, JUGADOR as COL_JUGADOR, TIPOGRAFIA, FONDO } from '../config/palette.js';
import { dibujarTexto, dibujarTextoAjustado, dibujarNumero } from '../render/text.js';
import { dibujarTaza, dibujarGrano, dibujarAvispa, dibujarCafetera } from '../render/shapes.js';
import { leerRecord, hayAlmacenamiento } from '../services/scoreStore.js';

const T = TIPOGRAFIA.TAMANOS;
const E = TIPOGRAFIA.ESPACIADOS;

const VISTA = { PORTADA: 'portada', AYUDA: 'ayuda' };

export class Portada {
  /**
   * @param {import('../core/input.js').Entrada} entrada
   * @param {import('../core/audio.js').Audio} audio
   * @param {import('../render/background.js').Fondo} fondo
   * @param {import('../render/glow.js').Resplandor} resplandor
   */
  constructor(entrada, audio, fondo, resplandor) {
    this.entrada = entrada;
    this.audio = audio;
    this.fondo = fondo;
    this.resplandor = resplandor;
    this.tiempo = 0;
    this.vista = VISTA.PORTADA;
  }

  entrar() {
    this.tiempo = 0;
    this.vista = VISTA.PORTADA;
    this.record = leerRecord();
    this.sinAlmacenamiento = !hayAlmacenamiento();
    this.entrada.limpiar();
  }

  actualizar(dt) {
    this.tiempo += dt;
    this.entrada.actualizar();
    this.fondo.actualizar(dt);

    if (this.vista === VISTA.AYUDA) {
      // Cualquier tecla o toque cierra la ayuda. Nada de buscar el botón.
      if (this.entrada.confirmarPulsado || this.entrada.pausaPulsada ||
          this.entrada.disparoPulsado) {
        this.vista = VISTA.PORTADA;
      }
      this.entrada.finPaso();
      return;
    }

    // La ayuda se abre con una tecla concreta; empezar, con cualquier otra.
    if (this.entrada.ayudaPulsada) {
      this.vista = VISTA.AYUDA;
    } else if (this.entrada.confirmarPulsado || this.entrada.disparoPulsado ||
               this.entrada.hayTactil) {
      this.audio.comenzar();
      this.ir('partida');
    }

    if (this.entrada.silenciarPulsado) this.audio.alternarSilencio();

    this.entrada.finPaso();
  }

  dibujar(ctx) {
    this.fondo.dibujar(ctx);
    if (this.vista === VISTA.AYUDA) this._dibujarAyuda(ctx);
    else this._dibujarPortada(ctx);
  }

  // -------------------------------------------------------------------------

  _dibujarPortada(ctx) {
    const centro = PANTALLA.ANCHO / 2;

    // --- Título ---
    // Respira muy despacio. Es el único movimiento aparte del fondo, y por eso
    // atrae la mirada sin agobiar.
    const respiracion = 1 + 0.02 * Math.sin(this.tiempo * 2.09);
    ctx.save();
    ctx.translate(centro, 150);
    ctx.scale(respiracion, respiracion);

    // Aquí sí se permite el resplandor caro: es una pantalla estática, no el
    // bucle de juego.
    // El ancho máximo deja margen a los lados. "COSMIC COFFEE" es más largo
    // que "DEFENDERS", así que se ajusta solo y las dos líneas quedan
    // proporcionadas sin tener que cuadrar tamaños a mano.
    const anchoMaximo = PANTALLA.ANCHO - 40;

    ctx.shadowColor = COL_JUGADOR.CIAN;
    ctx.shadowBlur = 20;
    dibujarTextoAjustado(ctx, 'COSMIC COFFEE', 0, 0, anchoMaximo, {
      tamano: T.TITULO, color: HUD.TEXTO_PRIMARIO,
      espaciado: E.TITULO, alineacion: 'centro',
    });
    ctx.shadowColor = HUD.VALOR_DESTACADO;
    dibujarTextoAjustado(ctx, 'DEFENDERS', 0, 38, anchoMaximo, {
      tamano: T.TITULO, color: HUD.VALOR_DESTACADO,
      espaciado: E.TITULO, alineacion: 'centro',
    });
    ctx.restore();

    // --- La taza, girando su vapor, para que se vea al protagonista ---
    ctx.save();
    ctx.translate(centro, 250);
    ctx.scale(1.4, 1.4);
    this.resplandor.halo(ctx, 0, 0, 26, COL_JUGADOR.CIAN, 0.5);
    dibujarTaza(ctx, 0, this.tiempo);
    ctx.restore();

    // --- Récord ---
    dibujarTexto(ctx, 'RÉCORD', centro, 320, {
      tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA,
      espaciado: E.ETIQUETA, alineacion: 'centro',
    });
    if (this.record > 0) {
      const texto = String(this.record).padStart(6, '0');
      dibujarNumero(ctx, texto.slice(0, 3) + '.' + texto.slice(3), centro, 338, {
        tamano: T.VALOR_HUD, color: HUD.VALOR_DESTACADO, alineacion: 'centro',
      });
    } else {
      dibujarTexto(ctx, '——', centro, 338, {
        tamano: T.VALOR_HUD, color: HUD.ETIQUETA, alineacion: 'centro',
      });
    }

    // --- Llamada a empezar ---
    const visible = Math.sin(this.tiempo * 3.2) > -0.35;
    if (visible) {
      dibujarTexto(ctx, this.entrada.hayTactil ? 'TOCA PARA EMPEZAR' : 'PULSA PARA EMPEZAR',
        centro, 400, {
          tamano: T.OPCION_MENU, color: COL_JUGADOR.CIAN,
          espaciado: E.ENCABEZADO, alineacion: 'centro',
        });
    }

    // --- Controles, dibujados ---
    // Enseñar los controles ANTES de empezar es lo que permite que no haya
    // ningún tutorial estorbando después.
    this._dibujarControles(ctx, centro, 452);

    // --- Ayuda ---
    dibujarTexto(ctx, 'H · CÓMO JUGAR', centro, 560, {
      tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA,
      espaciado: E.ETIQUETA, alineacion: 'centro',
    });
    dibujarTexto(ctx, 'M · SILENCIAR', centro, 578, {
      tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA,
      espaciado: E.ETIQUETA, alineacion: 'centro',
    });

    if (this.sinAlmacenamiento) {
      dibujarTexto(ctx, 'EL RÉCORD NO SE GUARDARÁ EN ESTE NAVEGADOR', centro, 612, {
        tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA,
        espaciado: E.ETIQUETA, alineacion: 'centro', alpha: 0.8,
      });
    }
  }

  /** Las teclas dibujadas, o el gesto del dedo si se juega en el móvil. */
  _dibujarControles(ctx, centro, y) {
    if (this.entrada.hayTactil) {
      dibujarTexto(ctx, 'ARRASTRA EL DEDO PARA MOVER', centro, y, {
        tamano: T.ETIQUETA_HUD, color: HUD.CUERPO_TEXTO,
        espaciado: E.ETIQUETA, alineacion: 'centro',
      });
      dibujarTexto(ctx, 'DISPARO AUTOMÁTICO', centro, y + 18, {
        tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA,
        espaciado: E.ETIQUETA, alineacion: 'centro',
      });
      return;
    }

    this._tecla(ctx, centro - 46, y, '◀');
    this._tecla(ctx, centro - 14, y, '▶');
    dibujarTexto(ctx, 'MOVER', centro + 30, y + 13, {
      tamano: T.ETIQUETA_HUD, color: HUD.CUERPO_TEXTO, espaciado: E.ETIQUETA,
    });

    this._tecla(ctx, centro - 46, y + 34, '␣', 78);
    dibujarTexto(ctx, 'DISPARAR', centro + 42, y + 47, {
      tamano: T.ETIQUETA_HUD, color: HUD.CUERPO_TEXTO, espaciado: E.ETIQUETA,
    });
  }

  _tecla(ctx, x, y, simbolo, ancho = 26) {
    ctx.save();
    ctx.strokeStyle = HUD.ETIQUETA;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.roundRect(x, y, ancho, 26, 4);
    ctx.stroke();
    ctx.restore();

    dibujarTexto(ctx, simbolo, x + ancho / 2, y + 13, {
      tamano: 11, color: HUD.CUERPO_TEXTO, alineacion: 'centro',
    });
  }

  // -------------------------------------------------------------------------

  _dibujarAyuda(ctx) {
    const centro = PANTALLA.ANCHO / 2;

    ctx.fillStyle = FONDO.VELO_PANTALLA;
    ctx.fillRect(0, 0, PANTALLA.ANCHO, PANTALLA.ALTO);

    dibujarTexto(ctx, 'CÓMO JUGAR', centro, 90, {
      tamano: T.ENCABEZADO, color: HUD.TEXTO_PRIMARIO,
      espaciado: E.ENCABEZADO, alineacion: 'centro',
    });

    const lineas = [
      'Defiende el núcleo del universo del café.',
      'Muévete solo a izquierda y derecha.',
      'Tres vidas. Un impacto y mueres.',
      'Las oleadas no se acaban nunca:',
      'juega por la máxima puntuación.',
    ];
    lineas.forEach((linea, i) => {
      dibujarTexto(ctx, linea, centro, 140 + i * 20, {
        tamano: T.CUERPO, color: HUD.CUERPO_TEXTO,
        espaciado: 0.02, alineacion: 'centro',
      });
    });

    // Los tres enemigos con sus puntos. Es la información que de verdad
    // cambia cómo juegas: saber a quién conviene disparar primero.
    const enemigos = [
      { dibujo: (c) => dibujarGrano(c, 0), nombre: 'GRANO EXPLORADOR', puntos: '100' },
      { dibujo: (c) => dibujarAvispa(c, 1), nombre: 'AVISPA DE VAPOR', puntos: '200' },
      { dibujo: (c) => dibujarCafetera(c, this.tiempo, false), nombre: 'CAFETERA GUARDIANA', puntos: '400' },
    ];

    enemigos.forEach((e, i) => {
      const y = 290 + i * 54;
      ctx.save();
      ctx.translate(70, y);
      e.dibujo(ctx);
      ctx.restore();

      dibujarTexto(ctx, e.nombre, 108, y - 6, {
        tamano: T.ETIQUETA_HUD, color: HUD.TEXTO_PRIMARIO, espaciado: E.ETIQUETA,
      });
      dibujarTexto(ctx, e.puntos + ' PUNTOS', 108, y + 10, {
        tamano: T.ETIQUETA_HUD, color: HUD.VALOR_DESTACADO, espaciado: E.ETIQUETA,
      });
    });

    dibujarTexto(ctx, 'Abatirlos en pleno ataque vale el doble.', centro, 470, {
      tamano: T.CUERPO, color: HUD.CUERPO_TEXTO, espaciado: 0.02, alineacion: 'centro',
    });
    dibujarTexto(ctx, 'Vida extra cada 20.000 puntos.', centro, 492, {
      tamano: T.CUERPO, color: HUD.CUERPO_TEXTO, espaciado: 0.02, alineacion: 'centro',
    });
    dibujarTexto(ctx, 'P para pausar · M para silenciar', centro, 526, {
      tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA, espaciado: E.ETIQUETA, alineacion: 'centro',
    });

    const visible = Math.sin(this.tiempo * 3.2) > -0.35;
    if (visible) {
      dibujarTexto(ctx, 'PULSA PARA VOLVER', centro, 580, {
        tamano: T.OPCION_MENU, color: COL_JUGADOR.CIAN,
        espaciado: E.ENCABEZADO, alineacion: 'centro',
      });
    }
  }
}
