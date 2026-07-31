/**
 * ENEMIGO — Una unidad de la escuadra.
 * ====================================
 *
 * Detalle importante: un enemigo NO guarda su posición en pantalla. Guarda su
 * CASILLA (fila 2, columna 5). La posición se le pregunta a la formación cada
 * paso.
 *
 * Gracias a eso, la escuadra puede moverse y respirar sin que ningún enemigo
 * se desalinee, y cuando en la fase 2 uno vuelva de atacar, aterrizará exacto
 * en su hueco aunque la formación se haya desplazado mientras tanto. Es lo
 * que impide que la formación se tuerza con el tiempo.
 */

import { ENEMIGOS, FORMACION, ATAQUES, TIEMPOS } from '../config/balance.js';

export const ESTADO_ENEMIGO = {
  EN_FORMACION: 'formacion',
  MURIENDO: 'muriendo',
};

export class Enemigo {
  /**
   * @param {'grano'|'avispa'|'cafetera'} tipo
   */
  constructor(tipo, columna, fila) {
    this.tipo = tipo;
    this.def = ENEMIGOS[tipo];
    this.columna = columna;
    this.fila = fila;

    this.vida = this.def.vida;
    this.estado = ESTADO_ENEMIGO.EN_FORMACION;
    this.vivo = true;

    this.x = 0;
    this.y = 0;
    this.radio = this.def.radio;

    // Cada unidad anima con un desfase propio para que la escuadra respire
    // en ola diagonal en lugar de moverse como un bloque.
    this.desfase =
      columna * this.def.animacion.desfasePorColumna +
      fila * FORMACION.DESFASE_POR_FILA;

    this.destello = 0;   // parpadeo blanco al recibir un impacto
    this.recarga = Math.random() * ATAQUES.RECARGA_INICIAL_MAXIMA;
  }

  /** @returns {boolean} true si ha muerto con este impacto */
  recibirImpacto() {
    this.vida--;
    this.destello = TIEMPOS.DESTELLO_IMPACTO;
    if (this.vida <= 0) {
      this.vivo = false;
      this.estado = ESTADO_ENEMIGO.MURIENDO;
      return true;
    }
    return false;
  }

  actualizar(dt, formacion, tiempo) {
    if (!this.vivo) return;

    // Se escribe directamente sobre el propio enemigo: sin objetos nuevos.
    formacion.posicionDeCasilla(this.columna, this.fila, this);

    this.destello = Math.max(0, this.destello - dt);
    this.recarga = Math.max(0, this.recarga - dt);

    // El ángulo de balanceo del grano. Su tipo de movimiento es ROTACIÓN, y
    // eso lo distingue de los otros dos incluso viéndolo en negro.
    const anim = this.def.animacion;
    if (anim.tipo === 'rotacion') {
      const amplitud = (anim.amplitudGrados * Math.PI) / 180;
      this.balanceo = Math.sin(tiempo * anim.hz * Math.PI * 2 + this.desfase) * amplitud;
    } else {
      this.balanceo = 0;
    }
  }
}
