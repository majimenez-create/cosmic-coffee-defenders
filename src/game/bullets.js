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
    // Se guarda la posición anterior en los DOS ejes. Hoy los proyectiles
    // solo bajan, pero el abanico del jefe tendrá desplazamiento horizontal,
    // y sin esto volvería el problema de atravesar objetivos sin tocarlos.
    this.xAnterior = 0;
    this.yAnterior = 0;
    this.vx = 0;
    this.vy = 0;
    this.radio = 0;
    this.edad = 0;
    this.opacidad = 1;
    this.culpable = false;   // el que ha matado al jugador: se marca y se ve
    this.congelado = false;
    this.desvaneciendo = 0;
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

  get cantidad() {
    let n = 0;
    for (const p of this.lista) if (p.activo) n++;
    return n;
  }

  /** Devuelve false si no queda hueco: el límite es parte del diseño. */
  lanzar(x, y, velocidad, vx = 0) {
    const libre = this.lista.find((p) => !p.activo);
    if (!libre) return false;

    libre.activo = true;
    libre.x = x;
    libre.y = y;
    libre.xAnterior = x;
    libre.yAnterior = y;
    libre.vx = vx;
    libre.vy = this.deEnemigo ? velocidad : -velocidad;
    libre.radio = this.radio;
    libre.edad = 0;
    libre.opacidad = 1;
    libre.culpable = false;
    libre.congelado = false;
    libre.desvaneciendo = 0;
    return true;
  }

  actualizar(dt) {
    for (const p of this.lista) {
      if (!p.activo) continue;
      p.edad += dt;

      // Los que se están desvaneciendo tras la muerte del jugador ya no se
      // mueven ni matan: solo se apagan.
      if (p.desvaneciendo > 0) {
        p.desvaneciendo -= dt;
        // El culpable dura el doble, así que se recorta a 1: durante la
        // primera mitad se ve a plena opacidad y luego se apaga.
        const avance = p.desvaneciendo / DISPARO_ENEMIGO.FUNDIDO_AL_LIMPIAR;
        p.opacidad = Math.max(0, Math.min(1, avance));
        if (p.desvaneciendo <= 0) p.activo = false;
        continue;
      }

      if (p.congelado) continue;

      p.xAnterior = p.x;
      p.yAnterior = p.y;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Fuera de pantalla: se apaga y su hueco queda libre.
      if (p.y < -20 || p.y > PANTALLA.ALTO + 20 ||
          p.x < -20 || p.x > PANTALLA.ANCHO + 20) {
        p.activo = false;
      }
    }
  }

  apagar(proyectil) {
    proyectil.activo = false;
  }

  /**
   * Al morir el jugador se limpia la amenaza, pero no de golpe:
   *   - el proyectil culpable se queda quieto y marcado, para que se vea
   *     qué te ha matado;
   *   - los demás se apagan poco a poco.
   * Que una muerte deje rastro es lo que la convierte en justa.
   */
  apagarTodos(culpable = null) {
    for (const p of this.lista) {
      if (!p.activo) continue;
      if (p === culpable) {
        p.culpable = true;
        p.congelado = true;
        p.desvaneciendo = DISPARO_ENEMIGO.FUNDIDO_AL_LIMPIAR * 2;
      } else {
        p.congelado = true;
        p.desvaneciendo = DISPARO_ENEMIGO.FUNDIDO_AL_LIMPIAR;
      }
    }
  }

  limpiar() {
    for (const p of this.lista) p.activo = false;
  }
}
