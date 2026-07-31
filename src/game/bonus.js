/**
 * FASE DE BONIFICACIÓN — La exhibición.
 * =====================================
 *
 * Cada cinco fases, una pantalla especial: veinte objetivos desfilan trazando
 * figuras amplias y NO atacan. No pueden matarte.
 *
 * ¿Por qué existe? Porque un juego que aprieta sin descanso agota. La fase
 * bonus es el respiro: se disfruta la coreografía, se recuperan puntos y se
 * vuelve al combate con ganas. Y decirle al jugador de forma explícita que
 * aquí no le pueden matar es lo que hace que se relaje y la disfrute de
 * verdad, en lugar de jugarla a la defensiva.
 *
 * No hay castigo por fallar. Solo recompensa por acertar, y una recompensa
 * grande por acertar a todos.
 */

import { BONUS, ENEMIGOS, PANTALLA } from '../config/balance.js';
import { COREOGRAFIAS } from './pathLibrary.js';

const NOMBRES = Object.keys(COREOGRAFIAS);
const punto = { x: 0, y: 0, angulo: 0 };

class Objetivo {
  constructor(tipo, camino, retraso, velocidad) {
    this.tipo = tipo;
    this.def = ENEMIGOS[tipo];
    this.camino = camino;
    this.velocidad = velocidad;
    this.distancia = -retraso * velocidad;

    this.vivo = true;
    this.escapado = false;
    this.x = 0;
    this.y = -100;
    this.angulo = 0;
    this.radio = this.def.radio;
    this.balanceo = 0;
    this.destello = 0;
    // Para que las avispas aleteen también aquí.
    this.escalaAlas = 1;
  }

  actualizar(dt, tiempo) {
    if (!this.vivo || this.escapado) return;

    this.distancia += this.velocidad * dt;
    if (this.distancia < 0) return;

    if (this.distancia >= this.camino.final) {
      this.escapado = true;
      return;
    }

    this.camino.posicionEn(this.distancia, punto);
    this.x = punto.x;
    this.y = punto.y;
    this.angulo = punto.angulo - Math.PI / 2;

    this.destello = Math.max(0, this.destello - dt);

    const anim = this.def.animacion;
    if (anim.tipo === 'deformacion') {
      const [a, b] = anim.escalaAlas;
      this.escalaAlas = b + (a - b) * (0.5 + 0.5 * Math.sin(tiempo * anim.hz * Math.PI * 2));
    }
  }

  recibirImpacto() {
    this.vivo = false;
    return true;   // en la fase bonus todo cae con un solo disparo
  }

  /** ¿Sigue en pantalla y se le puede disparar? */
  get alcanzable() {
    return this.vivo && !this.escapado && this.distancia >= 0;
  }
}

export class FaseBonus {
  /** @param {import('./paths.js').Caminos} caminos */
  constructor(caminos) {
    this.caminos = caminos;
    this.objetivos = [];
    this.tiempo = 0;
  }

  /**
   * @param {string[]} tipos     de qué tipos son los objetivos
   * @param {number} velocidad   multiplicador de dificultad del ciclo
   */
  empezar(tipos, velocidad = 1) {
    this.objetivos = [];
    this.tiempo = 0;
    this.abatidos = 0;

    for (let i = 0; i < BONUS.OBJETIVOS; i++) {
      // Salen en grupos de cinco, cada grupo por una figura distinta y
      // alternando el lado por el que entra.
      const grupo = Math.floor(i / BONUS.OBJETIVOS_POR_GRUPO);
      const nombre = NOMBRES[grupo % NOMBRES.length];
      const camino = this.caminos.variante(nombre, grupo % 2 === 1);

      const tipo = tipos[i % tipos.length];
      const retraso = grupo * BONUS.ESPERA_ENTRE_GRUPOS +
                      (i % BONUS.OBJETIVOS_POR_GRUPO) * BONUS.ESPERA_DENTRO_DEL_GRUPO;

      this.objetivos.push(new Objetivo(
        tipo, camino, retraso, ENEMIGOS[tipo].velocidad * velocidad * BONUS.FACTOR_VELOCIDAD
      ));
    }
  }

  actualizar(dt) {
    this.tiempo += dt;
    for (const o of this.objetivos) o.actualizar(dt, this.tiempo);
  }

  /** Los que se pueden disparar ahora mismo. */
  get alcanzables() {
    return this.objetivos.filter((o) => o.alcanzable);
  }

  /** ¿Ha terminado? Cuando no queda ninguno en pantalla ni por entrar. */
  get terminada() {
    for (const o of this.objetivos) {
      if (o.vivo && !o.escapado) return false;
    }
    return true;
  }

  get perfecta() {
    return this.abatidos === BONUS.OBJETIVOS;
  }

  get puntos() {
    const base = this.abatidos * BONUS.PUNTOS_POR_OBJETIVO;
    return base + (this.perfecta ? BONUS.BONIFICACION_PERFECTA : 0);
  }
}
