/**
 * INICIALES Y RANKING — Las dos pantallas del ranking mundial.
 * ===========================================================
 *
 * Una misma pantalla con dos momentos:
 *
 *   INICIALES — solo si la puntuación entra en el top 10. Tres ruedas de
 *   letras, como en una recreativa, con un temporizador de 20 segundos que
 *   confirma solo si el jugador se distrae. Nadie se queda atascado aquí.
 *
 *   TABLA — las diez mejores. La fila propia se resalta en ámbar, para que se
 *   encuentre de un vistazo.
 *
 * Si no hay conexión el juego no se rompe: se dice con claridad que el récord
 * local está a salvo y el envío queda en cola para más adelante.
 */

import { PANTALLA, TIEMPOS } from '../config/balance.js';
import { HUD, JUGADOR as COL_JUGADOR, TIPOGRAFIA, FONDO } from '../config/palette.js';
import { dibujarTexto, dibujarNumero } from '../render/text.js';
import {
  leerRanking, enviarPuntuacion, normalizarIniciales, reintentarPendientes,
} from '../services/leaderboard.js';

const T = TIPOGRAFIA.TAMANOS;
const E = TIPOGRAFIA.ESPACIADOS;

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ';
const VISTA = { INICIALES: 'iniciales', ENVIANDO: 'enviando', TABLA: 'tabla' };
const SEGUNDOS_PARA_ESCRIBIR = 20;

const CLAVE_INICIALES = 'ccd_iniciales';

export class PantallaRanking {
  constructor(entrada, audio, fondo) {
    this.entrada = entrada;
    this.audio = audio;
    this.fondo = fondo;
    this.tiempo = 0;
  }

  /**
   * @param {{puntos:number, fase:number, entra:boolean}|null} datos
   *   Si no se pasan datos, se muestra directamente la tabla (desde la portada).
   */
  entrar(datos) {
    this.tiempo = 0;
    this.entrada.limpiar();
    this.datos = datos;
    this.ranking = null;
    this.error = null;

    // Se prerrellena con las últimas iniciales usadas: casi siempre son las
    // mismas, y así no hay que escribirlas otra vez.
    this.letras = this._leerUltimasIniciales();
    this.rueda = 0;
    this.restante = SEGUNDOS_PARA_ESCRIBIR;

    this.vista = datos?.entra ? VISTA.INICIALES : VISTA.TABLA;
    if (this.vista === VISTA.TABLA) this._cargarTabla();

    reintentarPendientes();
  }

  _leerUltimasIniciales() {
    try {
      const guardadas = normalizarIniciales(localStorage.getItem(CLAVE_INICIALES) || 'AAA');
      return guardadas.split('');
    } catch {
      return ['A', 'A', 'A'];
    }
  }

  async _cargarTabla() {
    this.ranking = await leerRanking();
    if (this.ranking === null) this.error = 'SIN CONEXIÓN CON EL RANKING';
  }

  async _confirmar() {
    const iniciales = normalizarIniciales(this.letras.join(''));
    try {
      localStorage.setItem(CLAVE_INICIALES, iniciales);
    } catch { /* modo privado */ }

    this.vista = VISTA.ENVIANDO;
    this.misIniciales = iniciales;
    this.audio.oleadaDespejada();

    const enviada = await enviarPuntuacion(iniciales, this.datos.puntos, this.datos.fase);
    if (!enviada) this.error = 'SIN CONEXIÓN · TU RÉCORD LOCAL ESTÁ A SALVO';

    this.vista = VISTA.TABLA;
    await this._cargarTabla();
  }

  actualizar(dt) {
    this.tiempo += dt;
    this.entrada.actualizar();
    this.fondo.actualizar(dt);
    const e = this.entrada;

    if (this.vista === VISTA.INICIALES) {
      // Temporizador de recreativa: si nadie toca nada, se confirma lo que
      // haya. Es mejor que dejar a alguien atascado sin saber qué hacer.
      this.restante -= dt;
      if (this.restante <= 0) { this._confirmar(); return; }

      if (e.izquierdaPulsada) { this.rueda = (this.rueda + 2) % 3; this.audio.impacto(); }
      if (e.derechaPulsada) { this.rueda = (this.rueda + 1) % 3; this.audio.impacto(); }
      if (e.arribaPulsado) { this._girar(-1); }
      if (e.abajoPulsado) { this._girar(1); }
      if (e.letraPulsada) {
        this.letras[this.rueda] = e.letraPulsada;
        this.rueda = Math.min(2, this.rueda + 1);
        this.audio.disparo();
      }
      if (e.confirmarPulsado) { this._confirmar(); }
      e.finPaso();
      return;
    }

    if (this.vista === VISTA.TABLA) {
      // También con el dedo: en un móvil no hay teclas con las que salir.
      if (e.confirmarPulsado || e.pausaPulsada || e.toquePulsado) this.ir('portada');
    }

    e.finPaso();
  }

  _girar(direccion) {
    const actual = LETRAS.indexOf(this.letras[this.rueda]);
    const indice = (actual + direccion + LETRAS.length) % LETRAS.length;
    this.letras[this.rueda] = LETRAS[indice];
    this.audio.impacto();
  }

  // -------------------------------------------------------------------------

  dibujar(ctx) {
    this.fondo.dibujar(ctx);
    ctx.fillStyle = FONDO.VELO_PANTALLA;
    ctx.fillRect(0, 0, PANTALLA.ANCHO, PANTALLA.ALTO);

    if (this.vista === VISTA.INICIALES) this._dibujarIniciales(ctx);
    else if (this.vista === VISTA.ENVIANDO) this._dibujarEnviando(ctx);
    else this._dibujarTabla(ctx);
  }

  _dibujarIniciales(ctx) {
    const centro = PANTALLA.ANCHO / 2;

    dibujarTexto(ctx, '¡HAS ENTRADO EN EL RANKING!', centro, 120, {
      tamano: T.OPCION_MENU, color: HUD.RECORD_NUEVO,
      espaciado: E.ENCABEZADO, alineacion: 'centro',
    });

    dibujarNumero(ctx, String(this.datos.puntos), centro, 170, {
      tamano: T.ENCABEZADO, color: HUD.VALOR_DESTACADO, alineacion: 'centro',
    });

    dibujarTexto(ctx, 'ESCRIBE TUS INICIALES', centro, 220, {
      tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA,
      espaciado: E.ETIQUETA, alineacion: 'centro',
    });

    // Las tres ruedas.
    const anchoRueda = 52;
    const inicioX = centro - anchoRueda - 26;
    for (let i = 0; i < 3; i++) {
      const x = inicioX + i * (anchoRueda + 26);
      const elegida = i === this.rueda;

      ctx.save();
      ctx.strokeStyle = elegida ? COL_JUGADOR.CIAN : HUD.ETIQUETA;
      ctx.lineWidth = elegida ? 2 : 1;
      ctx.globalAlpha = elegida ? 1 : 0.5;
      ctx.beginPath();
      ctx.roundRect(x, 260, anchoRueda, 64, 6);
      ctx.stroke();
      ctx.restore();

      dibujarTexto(ctx, this.letras[i] === ' ' ? '␣' : this.letras[i],
        x + anchoRueda / 2, 292, {
          tamano: T.ENCABEZADO,
          color: elegida ? HUD.TEXTO_PRIMARIO : HUD.CUERPO_TEXTO,
          alineacion: 'centro',
        });

      // Flechas de la rueda elegida, latiendo.
      if (elegida) {
        const late = Math.sin(this.tiempo * 8) > 0 ? 1 : 0.4;
        dibujarTexto(ctx, '▲', x + anchoRueda / 2, 246, {
          tamano: 10, color: COL_JUGADOR.CIAN, alineacion: 'centro', alpha: late,
        });
        dibujarTexto(ctx, '▼', x + anchoRueda / 2, 338, {
          tamano: 10, color: COL_JUGADOR.CIAN, alineacion: 'centro', alpha: late,
        });
      }
    }

    dibujarTexto(ctx, '↑ ↓ LETRA    ← → RUEDA    ENTER CONFIRMAR', centro, 388, {
      tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA,
      espaciado: E.ETIQUETA, alineacion: 'centro',
    });
    dibujarTexto(ctx, 'O ESCRIBE DIRECTAMENTE CON EL TECLADO', centro, 404, {
      tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA,
      espaciado: E.ETIQUETA, alineacion: 'centro', alpha: 0.7,
    });

    // Barra de tiempo. Se llena de rojo cuando queda poco.
    const proporcion = Math.max(0, this.restante / SEGUNDOS_PARA_ESCRIBIR);
    const ancho = 200;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = HUD.ETIQUETA;
    ctx.fillRect(centro - ancho / 2, 450, ancho, 3);
    ctx.globalAlpha = 1;
    ctx.fillStyle = proporcion < 0.25 ? HUD.AVISO : COL_JUGADOR.CIAN;
    ctx.fillRect(centro - ancho / 2, 450, ancho * proporcion, 3);
    ctx.restore();
  }

  _dibujarEnviando(ctx) {
    const centro = PANTALLA.ANCHO / 2;
    const puntos = '.'.repeat(1 + Math.floor(this.tiempo * 3) % 3);
    dibujarTexto(ctx, 'ENVIANDO' + puntos, centro, 300, {
      tamano: T.OPCION_MENU, color: COL_JUGADOR.CIAN,
      espaciado: E.ENCABEZADO, alineacion: 'centro',
    });
  }

  _dibujarTabla(ctx) {
    const centro = PANTALLA.ANCHO / 2;

    dibujarTexto(ctx, 'RÉCORDS', centro, 70, {
      tamano: T.ENCABEZADO, color: HUD.TEXTO_PRIMARIO,
      espaciado: E.ENCABEZADO, alineacion: 'centro',
    });

    if (this.ranking === null && !this.error) {
      dibujarTexto(ctx, 'CARGANDO...', centro, 300, {
        tamano: T.OPCION_MENU, color: HUD.ETIQUETA,
        espaciado: E.ENCABEZADO, alineacion: 'centro',
      });
      return;
    }

    if (this.error) {
      dibujarTexto(ctx, this.error, centro, 280, {
        tamano: T.ETIQUETA_HUD, color: HUD.AVISO,
        espaciado: E.ETIQUETA, alineacion: 'centro',
      });
      dibujarTexto(ctx, 'SE ENVIARÁ CUANDO VUELVA LA CONEXIÓN', centro, 300, {
        tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA,
        espaciado: E.ETIQUETA, alineacion: 'centro',
      });
    }

    const filas = this.ranking ?? [];
    if (!filas.length && !this.error) {
      dibujarTexto(ctx, 'TODAVÍA NO HAY NADIE.', centro, 280, {
        tamano: T.CUERPO, color: HUD.CUERPO_TEXTO,
        espaciado: 0.02, alineacion: 'centro',
      });
      dibujarTexto(ctx, 'SÉ EL PRIMERO.', centro, 302, {
        tamano: T.CUERPO, color: COL_JUGADOR.CIAN,
        espaciado: 0.02, alineacion: 'centro',
      });
    }

    let yaResaltada = false;
    filas.forEach((fila, i) => {
      const y = 120 + i * 34;
      // Solo se resalta UNA fila: la primera que coincide con las iniciales y
      // la puntuación que se acaban de enviar.
      const mia = !yaResaltada && this.misIniciales === fila.iniciales &&
                  this.datos && fila.puntos === Math.floor(this.datos.puntos);
      if (mia) yaResaltada = true;

      const color = mia ? HUD.VALOR_DESTACADO : HUD.CUERPO_TEXTO;

      dibujarTexto(ctx, String(i + 1).padStart(2, '0'), 26, y, {
        tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA, espaciado: E.ETIQUETA,
      });
      dibujarTexto(ctx, fila.iniciales, 62, y, {
        tamano: T.VALOR_HUD, color, espaciado: E.ETIQUETA,
      });
      dibujarNumero(ctx, String(fila.puntos), 250, y, {
        tamano: T.VALOR_HUD, color, alineacion: 'derecha',
      });
      dibujarTexto(ctx, 'F' + fila.fase, PANTALLA.ANCHO - 26, y, {
        tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA,
        espaciado: E.ETIQUETA, alineacion: 'derecha',
      });
    });

    const visible = Math.sin(this.tiempo * 3.2) > -0.35;
    if (visible) {
      dibujarTexto(ctx, 'PULSA PARA VOLVER', centro, 596, {
        tamano: T.OPCION_MENU, color: COL_JUGADOR.CIAN,
        espaciado: E.ENCABEZADO, alineacion: 'centro',
      });
    }
  }
}
