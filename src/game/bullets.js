/**
 * PROYECTILES — Los del jugador y los de los enemigos.
 * ====================================================
 *
 * Se reutilizan siempre los mismos objetos en lugar de crear uno nuevo por
 * disparo. Crear y tirar cientos de objetos por partida obliga al navegador
 * a hacer limpieza de memoria, y esa limpieza produce microtirones que a
 * 60 fps se notan.
 */

import { DISPARO, DISPARO_ENEMIGO, PANTALLA } from '../config/balance.js';

class Proyectil {
  constructor() {
    this.activo = false;
    this.x = 0;
    this.y = 0;
    this.yAnterior = 0;
    this.vy = 0;
    this.radio = 0;
    this.edad = 0;
  }
}

export class Proyectiles {
  /**
   * @param {number} capacidad
   * @param {boolean} deEnemigo
   */
  constructor(capacidad, deEnemigo) {
    this.lista = Array.from({ length: capacidad }, () => new Proyectil());
    this.deEnemigo = deEnemigo;
    this.radio = deEnemigo ? DISPARO_ENEMIGO.RADIO_COLISION : DISPARO.RADIO_COLISION;
  }

  get vivos() {
    return this.lista.filter((p) => p.activo);
  }

  get cantidad() {
    let n = 0;
    for (const p of this.lista) if (p.activo) n++;
    return n;
  }

  /** Devuelve false si no queda hueco: el límite es parte del diseño. */
  lanzar(x, y, velocidad) {
    const libre = this.lista.find((p) => !p.activo);
    if (!libre) return false;

    libre.activo = true;
    libre.x = x;
    libre.y = y;
    libre.yAnterior = y;
    libre.vy = this.deEnemigo ? velocidad : -velocidad;
    libre.radio = this.radio;
    libre.edad = 0;
    return true;
  }

  actualizar(dt) {
    for (const p of this.lista) {
      if (!p.activo) continue;
      p.yAnterior = p.y;
      p.y += p.vy * dt;
      p.edad += dt;

      // Fuera de pantalla: se apaga y su hueco queda libre.
      if (p.y < -20 || p.y > PANTALLA.ALTO + 20) p.activo = false;
    }
  }

  apagar(proyectil) {
    proyectil.activo = false;
  }

  limpiar() {
    for (const p of this.lista) p.activo = false;
  }
}
