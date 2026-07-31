/**
 * RESPLANDOR — El neón, sin hundir el rendimiento.
 * ================================================
 *
 * EL PROBLEMA
 * El navegador trae una función para dibujar cosas con halo (`shadowBlur`),
 * y es preciosa, pero cuesta entre diez y cincuenta veces más que dibujar la
 * forma a secas. Con cuarenta objetos en pantalla y sesenta fotogramas por
 * segundo, un móvil de gama media se queda en quince imágenes por segundo. Por
 * eso en este proyecto está PROHIBIDA dentro del bucle de juego.
 *
 * LA SOLUCIÓN
 * Al arrancar se dibuja, una única vez, un halo redondo difuminado por cada
 * color que el juego necesita, y se guarda en memoria como una estampa.
 * Durante la partida no se calcula ningún desenfoque: solo se estampa esa
 * imagen ya hecha, estirada al tamaño que toque.
 *
 * Es entre diez y cien veces más barato y a este tamaño se ve prácticamente
 * igual. Sigue siendo "todo dibujado por código": simplemente el código se
 * ejecuta al arrancar en lugar de sesenta veces por segundo.
 */

const TAMANO = 64;

export class Resplandor {
  constructor() {
    this.estampas = new Map();
  }

  /**
   * Devuelve (creándola la primera vez) la estampa de halo de un color.
   */
  _estampa(color) {
    let estampa = this.estampas.get(color);
    if (estampa) return estampa;

    estampa = document.createElement('canvas');
    estampa.width = TAMANO;
    estampa.height = TAMANO;
    const c = estampa.getContext('2d');

    const centro = TAMANO / 2;
    const g = c.createRadialGradient(centro, centro, 0, centro, centro, centro);
    // Tres paradas: núcleo intenso, caída rápida y desvanecido largo. Esa
    // caída desigual es lo que hace que parezca luz y no una pelota de color.
    g.addColorStop(0.00, this._conAlpha(color, 0.55));
    g.addColorStop(0.35, this._conAlpha(color, 0.28));
    g.addColorStop(1.00, this._conAlpha(color, 0));

    c.fillStyle = g;
    c.fillRect(0, 0, TAMANO, TAMANO);

    this.estampas.set(color, estampa);
    return estampa;
  }

  /** Convierte "#3FD2FF" en "rgba(63,210,255,alpha)". */
  _conAlpha(hex, alpha) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /**
   * Pinta un halo centrado en (x, y).
   *
   * Se compone en modo aditivo: los halos que se solapan se suman y dan un
   * blanco caliente, que es exactamente lo que hace la luz de verdad.
   *
   * @param {number} radio  radio del halo en píxeles del lienzo lógico
   */
  halo(ctx, x, y, radio, color, intensidad = 1) {
    const estampa = this._estampa(color);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = intensidad;
    ctx.drawImage(estampa, x - radio, y - radio, radio * 2, radio * 2);
    ctx.restore();
  }

  /**
   * Prepara de antemano los colores que se van a usar, para que la primera
   * explosión de la partida no tenga que crear su estampa a mitad de la
   * acción y provoque un microtirón justo en el peor momento.
   */
  precalentar(colores) {
    for (const color of colores) this._estampa(color);
  }
}
