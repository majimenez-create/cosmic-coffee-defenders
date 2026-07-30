/**
 * RÉCORD — Guardado en el navegador.
 * ==================================
 *
 * Todo va envuelto en try/catch porque en modo privado, o si el juego está
 * dentro de un marco de otra web, el navegador puede prohibir el
 * almacenamiento. El juego NUNCA debe fallar por no poder guardar un número.
 */

const CLAVE = 'ccd_record';

export function leerRecord() {
  try {
    const valor = Number(localStorage.getItem(CLAVE));
    // Validación: si alguien ha manipulado el valor a mano o está corrupto,
    // se vuelve a cero en silencio en lugar de romper el arranque.
    if (!Number.isFinite(valor) || valor < 0 || valor > 99999999) return 0;
    return Math.floor(valor);
  } catch {
    return 0;
  }
}

export function guardarRecord(puntos) {
  try {
    localStorage.setItem(CLAVE, String(Math.floor(puntos)));
    return true;
  } catch {
    return false;
  }
}

export function hayAlmacenamiento() {
  try {
    const prueba = '__ccd_prueba__';
    localStorage.setItem(prueba, '1');
    localStorage.removeItem(prueba);
    return true;
  } catch {
    return false;
  }
}
