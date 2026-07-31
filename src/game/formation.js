/**
 * FORMACIÓN — El corazón del juego.
 * =================================
 *
 * 24 enemigos en 3 filas de 8. La escuadra nunca está quieta:
 *
 *   - OSCILA: se desplaza lentamente a izquierda y derecha.
 *   - RESPIRA: los enemigos se separan y se juntan del centro.
 *   - Y cada fila va ligeramente desfasada, de modo que la respiración
 *     recorre la escuadra como una ola.
 *
 * Ese desfase cuesta una línea de código y multiplica la sensación de
 * "ejército perfectamente coordinado" que pide el documento de diseño.
 */

import { FORMACION, PANTALLA } from '../config/balance.js';
import { Enemigo } from './enemy.js';

export class Formacion {
  constructor() {
    this.tiempo = 0;
    this.anclaX = PANTALLA.ANCHO / 2;
    this.anclaY = FORMACION.ANCLA_Y;
    this.enemigos = [];
  }

  /**
   * @param {string[]} tipos  qué tipos pueden aparecer en esta fase
   */
  poblar(tipos) {
    this.enemigos = [];
    for (let fila = 0; fila < FORMACION.FILAS; fila++) {
      // Las filas de arriba llevan los enemigos más valiosos, como en los
      // clásicos: obliga a decidir si subes a por ellos o limpias abajo.
      const tipo = tipos[Math.min(fila, tipos.length - 1)];
      for (let col = 0; col < FORMACION.COLUMNAS; col++) {
        this.enemigos.push(new Enemigo(tipo, col, fila));
      }
    }
    // Se colocan ya en su sitio. Si no, habría un fotograma con los 24
    // enemigos amontonados en la esquina antes del primer paso de lógica.
    this.actualizar(0);
  }

  get vivos() {
    return this.enemigos.filter((e) => e.vivo);
  }

  get quedanVivos() {
    for (const e of this.enemigos) if (e.vivo) return true;
    return false;
  }

  actualizar(dt) {
    this.tiempo += dt;

    // Vaivén: la escuadra entera se desplaza despacio de lado a lado.
    const fase = (this.tiempo / FORMACION.VAIVEN_PERIODO) * Math.PI * 2;
    this.anclaX = PANTALLA.ANCHO / 2 + Math.sin(fase) * FORMACION.VAIVEN_AMPLITUD;

    for (const e of this.enemigos) e.actualizar(dt, this, this.tiempo);
  }

  /**
   * Dónde está AHORA MISMO la casilla (columna, fila).
   * Es solo aritmética, así que se puede llamar tantas veces como haga falta.
   *
   * Escribe el resultado en `destino` en lugar de devolver un objeto nuevo:
   * se llama 24 veces por paso, y crear 1.440 objetos por segundo para
   * tirarlos acto seguido es exactamente lo que provoca los tirones de
   * limpieza de memoria que este juego quiere evitar.
   */
  posicionDeCasilla(columna, fila, destino) {
    // Respiración: un factor que separa y acerca los enemigos del centro,
    // desfasado por fila para que se propague como una ola.
    const faseRespiro =
      (this.tiempo / FORMACION.RESPIRACION_PERIODO) * Math.PI * 2 +
      fila * FORMACION.DESFASE_POR_FILA;
    const respiro = 1 + Math.sin(faseRespiro) * FORMACION.RESPIRACION_AMPLITUD;

    const centrado = columna - (FORMACION.COLUMNAS - 1) / 2;
    destino.x = this.anclaX + centrado * FORMACION.SEPARACION_X * respiro;
    destino.y = this.anclaY + fila * FORMACION.SEPARACION_Y;
    return destino;
  }

  /**
   * Elige un enemigo que pueda disparar: el más adelantado de su columna,
   * porque disparar desde la fila de atrás sería dispararse a sí mismos.
   *
   * @param {boolean} todosPueden  provisional hasta que existan los picados
   */
  elegirTirador(todosPueden = false) {
    // Una sola pasada: se guarda la fila más avanzada de cada columna. Antes
    // esto recorría la lista de vivos una vez por candidato.
    const filaMasAvanzada = new Array(FORMACION.COLUMNAS).fill(-1);
    for (const e of this.enemigos) {
      if (!e.vivo) continue;
      if (e.fila > filaMasAvanzada[e.columna]) filaMasAvanzada[e.columna] = e.fila;
    }

    const candidatos = [];
    for (const e of this.enemigos) {
      if (!e.vivo || e.recarga > 0) continue;
      if (!todosPueden && !e.def.dispara) continue;
      if (e.fila !== filaMasAvanzada[e.columna]) continue;
      candidatos.push(e);
    }

    if (!candidatos.length) return null;
    return candidatos[Math.floor(Math.random() * candidatos.length)];
  }
}
