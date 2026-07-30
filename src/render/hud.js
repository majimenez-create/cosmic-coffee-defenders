/**
 * HUD — La información mínima imprescindible.
 * ===========================================
 *
 * Solo cuatro cosas: puntuación, récord, vidas y fase. Nada más.
 *
 * Dónde va cada una no es casual. La mirada del jugador vive en el tercio
 * inferior central, así que:
 *   - La PUNTUACIÓN va arriba, porque se consulta poco durante la acción y
 *     mucho al morir.
 *   - Las VIDAS van abajo, en la periferia cercana, porque es lo que más se
 *     comprueba de reojo mientras se juega.
 *   - El RÉCORD es terciario: solo importa cuando te acercas.
 *
 * Regla para futuras peticiones: si un elemento no cambia la decisión que el
 * jugador tomará en los próximos 3 segundos, no va en el HUD.
 */

import { PANTALLA, HUD_LAYOUT } from '../config/balance.js';
import { HUD, TIPOGRAFIA } from '../config/palette.js';
import { dibujarTexto, dibujarNumero } from './text.js';
import { dibujarIconoVida } from './shapes.js';

const T = TIPOGRAFIA.TAMANOS;
const E = TIPOGRAFIA.ESPACIADOS;

/** Formatea 18700 como "018.700": ancho fijo, no baila al subir de cifra. */
function formatear(puntos) {
  const texto = String(Math.floor(puntos)).padStart(6, '0');
  return texto.slice(0, 3) + '.' + texto.slice(3);
}

export function dibujarHud(ctx, estado) {
  const { puntos, record, vidas, fase, puntosMostrados } = estado;

  // Degradado de contraste: sin caja, pero garantiza que el texto se lea
  // sobre cualquier fondo.
  const arriba = ctx.createLinearGradient(0, 0, 0, 44);
  arriba.addColorStop(0, 'rgba(5,4,11,0.5)');
  arriba.addColorStop(1, 'rgba(5,4,11,0)');
  ctx.fillStyle = arriba;
  ctx.fillRect(0, 0, PANTALLA.ANCHO, 44);

  const abajo = ctx.createLinearGradient(0, PANTALLA.ALTO, 0, PANTALLA.ALTO - 44);
  abajo.addColorStop(0, 'rgba(5,4,11,0.5)');
  abajo.addColorStop(1, 'rgba(5,4,11,0)');
  ctx.fillStyle = abajo;
  ctx.fillRect(0, PANTALLA.ALTO - 44, PANTALLA.ANCHO, 44);

  // --- Puntuación (arriba izquierda) ---
  dibujarTexto(ctx, 'PUNTOS', 10, 11, {
    tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA, espaciado: E.ETIQUETA,
  });
  dibujarNumero(ctx, formatear(puntosMostrados ?? puntos), 10, 27, {
    tamano: 16,
    color: puntosMostrados < puntos ? HUD.VALOR_DESTACADO : HUD.TEXTO_PRIMARIO,
  });

  // --- Récord (arriba centro) ---
  dibujarTexto(ctx, 'RÉCORD', PANTALLA.ANCHO / 2, 11, {
    tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA, espaciado: E.ETIQUETA,
    alineacion: 'centro',
  });
  dibujarNumero(ctx, formatear(record), PANTALLA.ANCHO / 2, 26, {
    tamano: 12, color: HUD.VALOR_DESTACADO, alineacion: 'centro',
  });

  // --- Vidas (abajo izquierda) ---
  // Se muestran hasta 4 iconos; con 5 se resume, para no invadir la zona
  // de juego con una fila larga.
  const visibles = Math.min(vidas, 4);
  for (let i = 0; i < visibles; i++) {
    ctx.save();
    ctx.translate(18 + i * 18, PANTALLA.ALTO - 18);
    dibujarIconoVida(ctx);
    ctx.restore();
  }
  if (vidas > 4) {
    dibujarTexto(ctx, '×' + vidas, 18 + 4 * 18, PANTALLA.ALTO - 18, {
      tamano: T.ETIQUETA_HUD, color: HUD.ETIQUETA,
    });
  }

  // --- Fase (abajo derecha) ---
  dibujarTexto(ctx, 'FASE ' + String(fase).padStart(2, '0'),
    PANTALLA.ANCHO - 10, PANTALLA.ALTO - 18, {
      tamano: T.VALOR_HUD, color: HUD.CUERPO_TEXTO,
      espaciado: E.VALOR, alineacion: 'derecha',
    });
}

/** El área realmente jugable, entre las dos bandas del HUD. */
export const AREA_JUEGO = {
  ARRIBA: HUD_LAYOUT.BANDA_SUPERIOR,
  ABAJO: PANTALLA.ALTO - HUD_LAYOUT.BANDA_INFERIOR,
};
