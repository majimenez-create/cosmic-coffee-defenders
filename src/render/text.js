/**
 * TEXTO — Tipografía arcade sin descargar nada.
 * =============================================
 *
 * Lo que evoca una recreativa no es una fuente concreta: es la combinación de
 * un tipo geométrico muy pesado, MAYÚSCULAS y mucho espacio entre letras.
 * Con eso basta, y así el juego no depende de ningún archivo externo.
 *
 * El espaciado entre letras se dibuja carácter a carácter porque la propiedad
 * del navegador que lo hace automáticamente (letterSpacing) no existe en
 * todos, y el juego tiene que verse igual en todas partes.
 */

import { TIPOGRAFIA } from '../config/palette.js';

export function fuente(tamano) {
  return `${TIPOGRAFIA.PESO} ${tamano}px ${TIPOGRAFIA.PILA}`;
}

/**
 * Mide un texto ya contando el espaciado entre letras.
 */
export function medir(ctx, texto, tamano, espaciado = 0) {
  ctx.font = fuente(tamano);
  const separacion = tamano * espaciado;
  let ancho = 0;
  for (const c of texto) ancho += ctx.measureText(c).width + separacion;
  return ancho - separacion;
}

/**
 * Dibuja texto con espaciado entre letras.
 * @param {'izquierda'|'centro'|'derecha'} alineacion
 */
export function dibujarTexto(ctx, texto, x, y, opciones = {}) {
  const {
    tamano = 14,
    color = '#FFFFFF',
    espaciado = 0,
    alineacion = 'izquierda',
    alpha = 1,
  } = opciones;

  ctx.save();
  ctx.font = fuente(tamano);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;

  const separacion = tamano * espaciado;
  const ancho = medir(ctx, texto, tamano, espaciado);

  let cursor = x;
  if (alineacion === 'centro') cursor = x - ancho / 2;
  else if (alineacion === 'derecha') cursor = x - ancho;

  for (const c of texto) {
    ctx.fillText(c, cursor, y);
    cursor += ctx.measureText(c).width + separacion;
  }
  ctx.restore();
}

/**
 * Dibuja los números con paso fijo para que la puntuación no "baile" al
 * cambiar de cifra. Un marcador que se mueve solo distrae en mitad de la
 * acción, y es un detalle que separa un arcade cuidado de uno que no lo es.
 */
export function dibujarNumero(ctx, texto, x, y, opciones = {}) {
  const { tamano = 14, color = '#FFFFFF', alineacion = 'izquierda', alpha = 1 } = opciones;

  ctx.save();
  ctx.font = fuente(tamano);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;

  const paso = ctx.measureText('0').width;
  const ancho = paso * texto.length;

  let cursor = x;
  if (alineacion === 'centro') cursor = x - ancho / 2;
  else if (alineacion === 'derecha') cursor = x - ancho;

  for (const c of texto) {
    const anchoCaracter = ctx.measureText(c).width;
    ctx.fillText(c, cursor + (paso - anchoCaracter) / 2, y);
    cursor += paso;
  }
  ctx.restore();
}
