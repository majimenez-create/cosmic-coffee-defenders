/**
 * TRAYECTORIAS — Las curvas que recorren los enemigos.
 * ====================================================
 *
 * Los enemigos NO deciden por dónde van reaccionando a ti. Recorren caminos
 * dibujados de antemano, como coreografías. Es una decisión de diseño, no una
 * comodidad: la biblia exige que los patrones sean aprendibles y que la
 * dificultad nunca dependa del azar. Si los enemigos te persiguieran, el
 * ataque de la oleada 3 sería distinto cada vez y no habría nada que aprender.
 *
 * EL PROBLEMA QUE RESUELVE ESTE ARCHIVO
 * Una curva de Bézier se recorre con un parámetro de 0 a 1, pero avanzar ese
 * parámetro a ritmo constante NO da velocidad constante: el enemigo correría
 * en las rectas y se arrastraría en las curvas cerradas. Y se nota mucho.
 *
 * La solución: al arrancar el juego se mide cada camino en 128 trocitos y se
 * guarda cuánta distancia hay recorrida en cada punto. Luego el enemigo avanza
 * en DISTANCIA (píxeles por segundo, como todo lo demás) y aquí se traduce a
 * posición. Se hace una sola vez al arrancar y sale gratis durante la partida.
 */

import { PANTALLA } from '../config/balance.js';

const MUESTRAS = 128;

/**
 * Un camino ya medido y listo para recorrer.
 */
class Camino {
  /**
   * @param {number[][]} control  puntos de control en coordenadas 0..1
   * @param {boolean} espejo      si se voltea horizontalmente
   * @param {boolean} relativo    si es un desplazamiento desde donde esté el
   *   enemigo (los picados) en lugar de una posición en pantalla (las entradas)
   */
  constructor(control, espejo = false, relativo = false) {
    this.puntos = new Float32Array(MUESTRAS * 2);
    this.distancias = new Float32Array(MUESTRAS);
    this.relativo = relativo;

    this._medir(control, espejo, relativo);
  }

  _medir(control, espejo, relativo) {
    let acumulada = 0;
    let anteriorX = 0;
    let anteriorY = 0;

    for (let i = 0; i < MUESTRAS; i++) {
      const t = i / (MUESTRAS - 1);
      const p = evaluarBezier(control, t);

      // Las coordenadas de control van de 0 a 1 para que un mismo camino
      // funcione igual si algún día cambia el tamaño del lienzo.
      let x = p.x * PANTALLA.ANCHO;
      const y = p.y * PANTALLA.ALTO;
      // Un camino absoluto se voltea respecto a la pantalla; uno relativo, que
      // es un desplazamiento, simplemente cambia de signo.
      if (espejo) x = relativo ? -x : PANTALLA.ANCHO - x;

      if (i > 0) acumulada += Math.hypot(x - anteriorX, y - anteriorY);

      this.puntos[i * 2] = x;
      this.puntos[i * 2 + 1] = y;
      this.distancias[i] = acumulada;

      anteriorX = x;
      anteriorY = y;
    }

    this.longitud = acumulada;
  }

  /**
   * Posición a `distancia` píxeles del inicio del camino.
   * Escribe en `destino` para no crear un objeto por enemigo y por paso.
   */
  posicionEn(distancia, destino) {
    const d = Math.max(0, Math.min(this.longitud, distancia));

    // Búsqueda binaria en la tabla de distancias.
    let bajo = 0;
    let alto = MUESTRAS - 1;
    while (alto - bajo > 1) {
      const medio = (bajo + alto) >> 1;
      if (this.distancias[medio] <= d) bajo = medio;
      else alto = medio;
    }

    const d0 = this.distancias[bajo];
    const d1 = this.distancias[alto];
    const t = d1 > d0 ? (d - d0) / (d1 - d0) : 0;

    const x0 = this.puntos[bajo * 2];
    const y0 = this.puntos[bajo * 2 + 1];
    const x1 = this.puntos[alto * 2];
    const y1 = this.puntos[alto * 2 + 1];

    destino.x = x0 + (x1 - x0) * t;
    destino.y = y0 + (y1 - y0) * t;

    // La orientación sale de hacia dónde apunta el camino en ese punto. Es lo
    // que hace que un enemigo "gire" al trazar la curva en lugar de deslizarse
    // de lado como una pegatina.
    destino.angulo = Math.atan2(y1 - y0, x1 - x0);
    return destino;
  }

  get final() {
    return this.longitud;
  }
}

/**
 * Bézier cúbica por tramos: cada 4 puntos de control forman un tramo, y el
 * último punto de un tramo es el primero del siguiente. Así se pueden encadenar
 * bucles y ochos completos con una sola lista.
 */
function evaluarBezier(control, t) {
  const tramos = (control.length - 1) / 3;
  const escalado = t * tramos;
  let tramo = Math.floor(escalado);
  if (tramo >= tramos) tramo = tramos - 1;
  const local = escalado - tramo;

  const i = tramo * 3;
  const p0 = control[i];
  const p1 = control[i + 1];
  const p2 = control[i + 2];
  const p3 = control[i + 3];

  const u = 1 - local;
  const a = u * u * u;
  const b = 3 * u * u * local;
  const c = 3 * u * local * local;
  const d = local * local * local;

  return {
    x: a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    y: a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  };
}

/**
 * Almacén de caminos. Se miden una vez al arrancar y se piden por nombre.
 */
export class Caminos {
  /**
   * @param {Record<string, number[][]>} definiciones
   * @param {Set<string>} relativos  nombres que son desplazamientos (picados)
   */
  constructor(definiciones, relativos = new Set()) {
    this.caminos = new Map();

    for (const [nombre, control] of Object.entries(definiciones)) {
      const relativo = relativos.has(nombre);
      this.caminos.set(nombre, new Camino(control, false, relativo));
      // Cada camino sirve para dos: el espejo sale gratis y duplica el
      // repertorio sin duplicar los datos ni perder la reproducibilidad.
      this.caminos.set(nombre + '_espejo', new Camino(control, true, relativo));
    }
  }

  obtener(nombre) {
    const camino = this.caminos.get(nombre);
    if (!camino) throw new Error(`No existe la trayectoria "${nombre}"`);
    return camino;
  }

  /** Un nombre al azar de la lista, pero con la variante espejada decidida. */
  variante(nombre, espejo) {
    return this.obtener(espejo ? nombre + '_espejo' : nombre);
  }
}
