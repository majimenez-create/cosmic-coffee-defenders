/**
 * COLISIONES
 * ==========
 *
 * Un proyectil NO se comprueba como un punto, sino como el SEGMENTO que ha
 * recorrido desde el paso anterior.
 *
 * ¿Por qué? Un disparo va a 520 px/s, o sea 8,7 px por paso. Un enemigo
 * pequeño mide 20 px, así que ahora mismo no habría problema. Pero en las
 * fases avanzadas todo se acelera, y llega un momento en que el proyectil
 * "salta por encima" del enemigo de un paso al siguiente y lo atraviesa sin
 * tocarlo. Comprobar el recorrido completo lo elimina para siempre, y cuesta
 * lo mismo.
 */

/** Distancia al cuadrado de un punto al segmento (ax,ay)-(bx,by). */
function distanciaPuntoSegmento(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const largoCuadrado = dx * dx + dy * dy;

  let t = 0;
  if (largoCuadrado > 0) {
    t = ((px - ax) * dx + (py - ay) * dy) / largoCuadrado;
    t = Math.max(0, Math.min(1, t));
  }

  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return (px - cx) ** 2 + (py - cy) ** 2;
}

/**
 * ¿El recorrido del proyectil ha tocado el círculo del objetivo?
 */
export function proyectilTocaCirculo(proyectil, x, y, radio) {
  const alcance = radio + proyectil.radio;
  const d2 = distanciaPuntoSegmento(
    x, y,
    proyectil.xAnterior, proyectil.yAnterior,
    proyectil.x, proyectil.y
  );
  return d2 <= alcance * alcance;
}

/** Dos círculos, para el choque entre la taza y un enemigo. */
export function circulosTocan(x1, y1, r1, x2, y2, r2) {
  const suma = r1 + r2;
  return (x1 - x2) ** 2 + (y1 - y2) ** 2 <= suma * suma;
}
