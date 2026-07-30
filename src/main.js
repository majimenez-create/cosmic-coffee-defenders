/**
 * MAIN — El arranque del juego.
 * =============================
 *
 * FASE 0 (cimientos). Todavía no hay juego: esta pantalla existe para
 * comprobar que funciona toda la maquinaria de base y que el despliegue en
 * internet está bien montado antes de que haya nada que perder.
 *
 * Lo que ya está probado aquí:
 *   - El lienzo de 360 x 640 se escala a cualquier pantalla sin recortarse.
 *   - El reloj piensa 60 veces por segundo pase lo que pase.
 *   - Los colores y los números salen del archivo de configuración.
 *   - El fondo de estrellas con profundidad.
 *   - La tipografía arcade sin descargar ninguna fuente.
 */

import { Lienzo } from './core/canvas.js';
import { Bucle } from './core/loop.js';
import { CampoDeEstrellas } from './render/starfield.js';
import { dibujarTexto } from './render/text.js';
import { PANTALLA } from './config/balance.js';
import { HUD, JUGADOR, TIPOGRAFIA, FONDO } from './config/palette.js';

const lienzo = new Lienzo(document.getElementById('juego'));
const estrellas = new CampoDeEstrellas();

let tiempo = 0;

function actualizar(dt) {
  tiempo += dt;
  estrellas.actualizar(dt);
}

function dibujar() {
  const ctx = lienzo.ctx;
  estrellas.dibujar(ctx, tiempo);

  const centroX = PANTALLA.ANCHO / 2;

  // El título respira muy despacio. Es el único movimiento de la portada
  // aparte de las estrellas, y por eso llama la atención sin agobiar.
  const respiracion = 1 + 0.02 * Math.sin(tiempo * 2.09);

  ctx.save();
  ctx.translate(centroX, 190);
  ctx.scale(respiracion, respiracion);

  // El resplandor solo se permite aquí, en una pantalla estática. Dentro del
  // juego está prohibido en el bucle: es la operación más cara del lienzo.
  ctx.shadowColor = JUGADOR.CIAN;
  ctx.shadowBlur = 18;
  dibujarTexto(ctx, 'COSMIC COFFEE', 0, 0, {
    tamano: TIPOGRAFIA.TAMANOS.TITULO,
    color: HUD.TEXTO_PRIMARIO,
    espaciado: TIPOGRAFIA.ESPACIADOS.TITULO,
    alineacion: 'centro',
  });
  ctx.shadowColor = HUD.VALOR_DESTACADO;
  dibujarTexto(ctx, 'DEFENDERS', 0, 40, {
    tamano: TIPOGRAFIA.TAMANOS.TITULO,
    color: HUD.VALOR_DESTACADO,
    espaciado: TIPOGRAFIA.ESPACIADOS.TITULO,
    alineacion: 'centro',
  });
  ctx.restore();

  // Filete decorativo: dos líneas que enmarcan el título.
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = HUD.MARCO;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centroX - 110, 262);
  ctx.lineTo(centroX + 110, 262);
  ctx.stroke();
  ctx.restore();

  dibujarTexto(ctx, 'EN CONSTRUCCIÓN', centroX, 300, {
    tamano: TIPOGRAFIA.TAMANOS.OPCION_MENU,
    color: HUD.CUERPO_TEXTO,
    espaciado: TIPOGRAFIA.ESPACIADOS.ENCABEZADO,
    alineacion: 'centro',
  });

  dibujarTexto(ctx, 'FASE 0 · CIMIENTOS', centroX, 326, {
    tamano: TIPOGRAFIA.TAMANOS.ETIQUETA_HUD,
    color: HUD.ETIQUETA,
    espaciado: TIPOGRAFIA.ESPACIADOS.ETIQUETA,
    alineacion: 'centro',
  });

  // Parpadeo lento, como el "insert coin" de una recreativa esperando.
  const visible = Math.sin(tiempo * 2.3) > -0.3;
  if (visible) {
    dibujarTexto(ctx, 'VUELVE PRONTO', centroX, 420, {
      tamano: TIPOGRAFIA.TAMANOS.OPCION_MENU,
      color: JUGADOR.CIAN,
      espaciado: TIPOGRAFIA.ESPACIADOS.ENCABEZADO,
      alineacion: 'centro',
    });
  }

  // Marco interior: hace que el área de juego parezca el cristal de un
  // mueble arcade en lugar de una página recortada.
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = FONDO.REJILLA_ZONA;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, PANTALLA.ANCHO - 1, PANTALLA.ALTO - 1);
  ctx.restore();
}

new Bucle(actualizar, dibujar).arrancar();
