/**
 * JUGADOR — La taza.
 * ==================
 *
 * Movimiento instantáneo: sin aceleración, sin inercia, sin física. Lo que
 * pide la tecla o el dedo, se aplica en ese mismo paso.
 *
 * El límite de DOS disparos en pantalla es la regla que define el juego
 * entero: machacar el botón no te hace disparar más rápido; si fallas los dos
 * tiros, esperas a que salgan de pantalla. Esa es la decisión interesante.
 */

import { JUGADOR, DISPARO, ZONA_JUGADOR, PANTALLA, TACTIL } from '../config/balance.js';

export const ESTADO = {
  VIVO: 'vivo',
  MURIENDO: 'muriendo',
  REAPARECIENDO: 'reapareciendo',
};

export class Taza {
  constructor(proyectiles) {
    this.proyectiles = proyectiles;
    this.reiniciar();
  }

  reiniciar() {
    this.x = JUGADOR.X_REAPARICION;
    this.y = ZONA_JUGADOR.Y;
    this.estado = ESTADO.VIVO;
    this.vidas = JUGADOR.VIDAS_INICIALES;
    this.invulnerable = 0;
    this.retroceso = 0;
    this.disparosRealizados = 0; // para poder medir la puntería
    this._recarga = 0;
    this._buferDisparo = 0;
    this._temporizador = 0;
  }

  get esVulnerable() {
    return this.estado === ESTADO.VIVO && this.invulnerable <= 0;
  }

  actualizar(dt, entrada, tiempo) {
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this._recarga = Math.max(0, this._recarga - dt);
    this._buferDisparo = Math.max(0, this._buferDisparo - dt);
    this.retroceso = Math.max(0, this.retroceso - dt * JUGADOR.RECUPERACION_RETROCESO);

    if (this.estado === ESTADO.MURIENDO) {
      this._temporizador -= dt;
      if (this._temporizador <= 0) this._reaparecer();
      return;
    }

    if (this.estado === ESTADO.REAPARECIENDO) {
      this._temporizador -= dt;
      // Sube desde debajo del borde hasta su altura de combate.
      const avance = 1 - Math.max(0, this._temporizador) / JUGADOR.ENTRADA_REAPARICION;
      const desde = PANTALLA.ALTO;
      this.y = desde + (ZONA_JUGADOR.Y - desde) * Math.min(1, avance);
      if (this._temporizador <= 0) {
        this.y = ZONA_JUGADOR.Y;
        this.estado = ESTADO.VIVO;
      }
      return;
    }

    this._mover(dt, entrada);
    this._disparar(entrada, tiempo);
    entrada.sincronizarPosicion(this.x);
  }

  _mover(dt, entrada) {
    if (entrada.ejeX !== 0) {
      // Teclado y mando mandan sobre el dedo si están en uso.
      this.x += entrada.ejeX * JUGADOR.VELOCIDAD * dt;
      entrada.objetivoX = null;
    } else if (entrada.objetivoX !== null) {
      // El dedo pide una posición absoluta, pero se limita la velocidad para
      // que un gesto brusco no teletransporte la taza: el ranking mundial
      // tiene que comparar partidas comparables.
      const maximo = TACTIL.VELOCIDAD_MAXIMA * dt;
      const diferencia = entrada.objetivoX - this.x;
      this.x += Math.max(-maximo, Math.min(maximo, diferencia));
    }

    this.x = Math.max(ZONA_JUGADOR.MARGEN_IZQUIERDO,
             Math.min(ZONA_JUGADOR.MARGEN_DERECHO, this.x));
  }

  _disparar(entrada, tiempo) {
    // Búfer: si pulsas justo antes de que la recarga termine, el disparo no
    // se pierde, sale en cuanto puede. Es invisible y hace que el arma se
    // sienta obediente.
    if (entrada.disparoPulsado) this._buferDisparo = DISPARO.BUFER_MS / 1000;

    const quiereDisparar = entrada.disparoMantenido || this._buferDisparo > 0;
    if (!quiereDisparar || this._recarga > 0) return;

    // El tope de proyectiles en pantalla es lo que regula la cadencia real.
    if (this.proyectiles.cantidad >= DISPARO.MAXIMO_EN_PANTALLA) return;

    const salio = this.proyectiles.lanzar(
      this.x, this.y - JUGADOR.ALTURA_BOCA, DISPARO.VELOCIDAD
    );
    if (!salio) return;

    this._recarga = DISPARO.CADENCIA;
    this._buferDisparo = 0;
    this.retroceso = 1;
    this.disparosRealizados++;
  }

  /** Devuelve true si era la última vida. */
  morir() {
    if (!this.esVulnerable) return false;
    this.vidas--;
    this.estado = ESTADO.MURIENDO;
    this._temporizador = JUGADOR.ESPERA_REAPARICION;
    return this.vidas <= 0;
  }

  _reaparecer() {
    // Siempre en el centro: previsible. Y con invulnerabilidad, para que
    // nadie muera dos veces por lo mismo.
    this.x = JUGADOR.X_REAPARICION;
    this.estado = ESTADO.REAPARECIENDO;
    this._temporizador = JUGADOR.ENTRADA_REAPARICION;
    this.invulnerable = JUGADOR.ENTRADA_REAPARICION + JUGADOR.INVULNERABILIDAD;
  }

  ganarVida() {
    if (this.vidas < JUGADOR.VIDAS_MAXIMAS) {
      this.vidas++;
      return true;
    }
    return false;
  }
}
