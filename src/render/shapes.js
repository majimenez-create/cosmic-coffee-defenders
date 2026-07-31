/**
 * FORMAS — Todo lo que se ve, dibujado por código.
 * ================================================
 *
 * No hay ni una sola imagen en el juego. Cada nave y cada enemigo es una
 * combinación de trapecios, elipses y arcos.
 *
 * Todas las funciones dibujan centradas en (0,0) y esperan que quien llama
 * haya movido y escalado el lienzo. Así una misma forma sirve para el juego,
 * para el icono de vida del HUD y para la pantalla de ayuda.
 */

import { JUGADOR, ENEMIGOS, DISPARO_JUGADOR, PELIGRO } from '../config/palette.js';

/**
 * Los degradados se crean UNA sola vez y se reutilizan. Crearlos dentro del
 * bucle significaba fabricar más de mil objetos por segundo solo para
 * tirarlos, que es justo lo que provoca los tirones de limpieza de memoria.
 * Como todas las formas se dibujan centradas en (0,0), el mismo degradado
 * vale para las 24 unidades de la escuadra.
 */
const cache = {};

function conCache(clave, crear) {
  if (!cache[clave]) cache[clave] = crear();
  return cache[clave];
}

// ---------------------------------------------------------------------------
// LA TAZA
// ---------------------------------------------------------------------------

/**
 * 30 x 34 px. Origen en el centro de la base. NUNCA rota.
 *
 * El orden importa: cada pieza tapa parcialmente la anterior, y de esa
 * superposición sale la sensación de volumen sin una sola sombra pintada.
 *
 * @param {number} retroceso  0 a 1, cuánto ha retrocedido al disparar
 * @param {number} tiempo     para animar las llamas
 */
export function dibujarTaza(ctx, retroceso = 0, tiempo = 0) {
  ctx.save();
  ctx.translate(0, retroceso * 2); // el retroceso empuja la taza hacia abajo

  // 1. Plato / alerón. Da anchura y lectura de "nave estable".
  ctx.fillStyle = conCache('platoTaza', () =>
    degradadoVertical(ctx, -17, 17, JUGADOR.PORCELANA_CLARA, JUGADOR.SOMBRA_CERAMICA));
  caminoRedondeado(ctx, [[-15, 12], [15, 12], [9, 17], [-9, 17]], 2);
  ctx.fill();

  // 2. Propulsores, con llama de altura variable.
  ctx.fillStyle = JUGADOR.SOMBRA_PROFUNDA;
  rectanguloRedondeado(ctx, -9, 12, 4, 5, 1);
  ctx.fill();
  rectanguloRedondeado(ctx, 5, 12, 4, 5, 1);
  ctx.fill();

  // La llama tiembla a 20 Hz: lo bastante rápido para leerse como fuego.
  const altoLlama = 4 + Math.abs(Math.sin(tiempo * 20 * Math.PI * 2)) * 5;
  for (const lado of [-7, 7]) {
    ctx.fillStyle = JUGADOR.PROPULSOR;
    ctx.beginPath();
    ctx.moveTo(lado - 2.5, 17);
    ctx.lineTo(lado + 2.5, 17);
    ctx.lineTo(lado, 17 + altoLlama);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = JUGADOR.PROPULSOR_NUCLEO;
    ctx.beginPath();
    ctx.moveTo(lado - 1, 17);
    ctx.lineTo(lado + 1, 17);
    ctx.lineTo(lado, 17 + altoLlama * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  // 3. Cuerpo. El degradado HORIZONTAL con la parada blanca descentrada al
  // 25 % es lo único que convierte un trapecio plano en un cilindro
  // cerámico. Es el truco más importante de todo el sprite.
  ctx.fillStyle = conCache('cuerpoTaza', () => {
    const g = ctx.createLinearGradient(-11, 0, 11, 0);
    g.addColorStop(0.00, JUGADOR.SOMBRA_CERAMICA);
    g.addColorStop(0.25, JUGADOR.PORCELANA_ESPECULAR);
    g.addColorStop(0.60, JUGADOR.PORCELANA_MEDIA);
    g.addColorStop(1.00, JUGADOR.SOMBRA_PROFUNDA);
    return g;
  });
  caminoRedondeado(ctx, [[-11, -6], [11, -6], [7, 12], [-7, 12]], 3);
  ctx.fill();

  // 4. Asa a la derecha. Es el único signo que dice "taza" de forma
  // inequívoca a este tamaño.
  ctx.strokeStyle = JUGADOR.PORCELANA_CLARA;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(11, 2, 6, -1.15, 1.15);
  ctx.stroke();
  ctx.strokeStyle = JUGADOR.SOMBRA_CERAMICA;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(11, 2, 5.2, -1.15, 1.15);
  ctx.stroke();

  // 5. Ala izquierda. Equilibra la masa del asa con distinto color y
  // longitud: así la asimetría se lee como intencional, no como error.
  ctx.strokeStyle = JUGADOR.CIAN;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-11, 4, 6, 0.2, 1.5);
  ctx.stroke();

  // 6. Labio de la taza: el cañón. Ese óvalo oscuro arriba es lo que hace
  // que se lea como taza aunque el jugador solo la vea de reojo.
  ctx.fillStyle = JUGADOR.PORCELANA_ESPECULAR;
  ctx.strokeStyle = JUGADOR.SOMBRA_CERAMICA;
  ctx.lineWidth = 1.5;
  elipse(ctx, 0, -6, 11, 3.5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = JUGADOR.CAFE_INTERIOR;
  elipse(ctx, 0, -6, 8.5, 2.4);
  ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.fillStyle = JUGADOR.CREMA;
  elipse(ctx, 1.5, -7.2, 8.5, 2.4);
  ctx.fill();
  ctx.restore();

  // 7. Núcleo de energía. De aquí salen los disparos.
  const pulso = 1 + 0.25 * Math.sin(tiempo * 12.6);
  ctx.save();
  ctx.translate(0, -8);
  ctx.scale(pulso, pulso);
  ctx.fillStyle = JUGADOR.CIAN;
  rombo(ctx, 0, 0, 2.5, 3.5);
  ctx.fill();
  ctx.fillStyle = JUGADOR.CIAN_NUCLEO;
  rombo(ctx, 0, 0, 1, 1.5);
  ctx.fill();
  ctx.restore();

  // 8. Banda técnica. El detalle "cafetera de alta gama": ancla la lectura
  // de máquina, no de vajilla.
  ctx.save();
  caminoRedondeado(ctx, [[-11, -6], [11, -6], [7, 12], [-7, 12]], 3);
  ctx.clip();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = JUGADOR.BANDA_TECNICA;
  ctx.fillRect(-11, 2.5, 22, 3);
  ctx.restore();

  ctx.fillStyle = JUGADOR.CIAN;
  for (const x of [-4, 4]) {
    ctx.beginPath();
    ctx.arc(x, 4, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/** Versión simplificada de 14 px para los iconos de vida del HUD. */
export function dibujarIconoVida(ctx) {
  ctx.save();
  ctx.scale(0.42, 0.42);
  ctx.fillStyle = JUGADOR.CIAN;
  caminoRedondeado(ctx, [[-11, -6], [11, -6], [7, 12], [-7, 12]], 3);
  ctx.fill();
  ctx.fillStyle = JUGADOR.HUECO_ICONO;
  elipse(ctx, 0, -6, 8.5, 2.4);
  ctx.fill();
  ctx.strokeStyle = JUGADOR.CIAN;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(11, 2, 6, -1.15, 1.15);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// GRANO EXPLORADOR
// ---------------------------------------------------------------------------

/**
 * 24 x 20 px. Óvalo inclinado con hendidura. Su movimiento es ROTACIÓN, y
 * ese es el rasgo que lo separa de los otros dos enemigos incluso en negro.
 *
 * @param {number} balanceo  ángulo en radianes
 */
export function dibujarGrano(ctx, balanceo = 0, escala = 1) {
  const c = ENEMIGOS.grano;

  ctx.save();
  ctx.rotate(balanceo - 0.21); // -12° de inclinación base
  ctx.scale(escala, escala);

  // Cuerpo, con el foco de luz desplazado arriba a la izquierda.
  ctx.fillStyle = conCache('cuerpoGrano', () => {
    const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, 12);
    g.addColorStop(0.00, c.brillo);
    g.addColorStop(0.45, c.cuerpo);
    g.addColorStop(1.00, c.sombra);
    return g;
  });
  elipse(ctx, 0, 0, 11, 9);
  ctx.fill();

  // La hendidura del grano de café, con su arista de luz al lado.
  ctx.strokeStyle = c.hendidura;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.bezierCurveTo(3.5, -3, -3.5, 3, 0, 8);
  ctx.stroke();

  ctx.strokeStyle = c.brillo;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-1, -8);
  ctx.bezierCurveTo(2.5, -3, -4.5, 3, -1, 8);
  ctx.stroke();

  // Sensores: dan cara sin dibujar una cara.
  for (const x of [-4, 4]) {
    ctx.fillStyle = c.sensores;
    ctx.beginPath();
    ctx.arc(x, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.brillo;
    ctx.beginPath();
    ctx.arc(x - 0.6, -3.6, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Antenas.
  ctx.strokeStyle = c.cuerpo;
  ctx.lineWidth = 1;
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(lado * 6, -7);
    ctx.lineTo(lado * 9, -11);
    ctx.stroke();
    ctx.fillStyle = c.acento;
    ctx.beginPath();
    ctx.arc(lado * 9, -11, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// PROYECTILES
// ---------------------------------------------------------------------------

/** Cápsula ámbar alargada. Sube. Proporción 4:1. */
export function dibujarDisparoJugador(ctx) {
  ctx.fillStyle = DISPARO_JUGADOR.HALO;
  rectanguloRedondeado(ctx, -2.5, -7, 5, 14, 2.5);
  ctx.fill();

  ctx.fillStyle = DISPARO_JUGADOR.CUERPO;
  rectanguloRedondeado(ctx, -1.5, -6, 3, 12, 1.5);
  ctx.fill();

  ctx.fillStyle = DISPARO_JUGADOR.NUCLEO;
  rectanguloRedondeado(ctx, -0.7, -4.5, 1.4, 9, 0.7);
  ctx.fill();
}

/**
 * Rombo magenta con contorno oscuro. Baja. Proporción 1:1.
 * Forma, proporción, dirección, brillo y animación: cinco canales distintos
 * para que jamás se confunda con un disparo del jugador.
 */
export function dibujarDisparoEnemigo(ctx, tiempo = 0, culpable = false) {
  const pulso = 1 + 0.125 * Math.sin(tiempo * 50);
  ctx.save();
  ctx.rotate(tiempo * Math.PI);
  ctx.scale(pulso, pulso);

  // El proyectil que ha matado al jugador se queda marcado con un halo, para
  // que se vea qué ha sido. Toda muerte debe dejar rastro.
  if (culpable) {
    ctx.strokeStyle = PELIGRO.PROYECTIL;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = PELIGRO.PROYECTIL;
  rombo(ctx, 0, 0, 3.5, 3.5);
  ctx.fill();
  ctx.strokeStyle = PELIGRO.PROYECTIL_CONTORNO;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = PELIGRO.PROYECTIL_NUCLEO;
  rombo(ctx, 0, 0, 1.4, 1.4);
  ctx.fill();

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Utilidades de dibujo
// ---------------------------------------------------------------------------

function degradadoVertical(ctx, y0, y1, colorArriba, colorAbajo) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, colorArriba);
  g.addColorStop(1, colorAbajo);
  return g;
}

function elipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function rombo(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.moveTo(x, y - ry);
  ctx.lineTo(x + rx, y);
  ctx.lineTo(x, y + ry);
  ctx.lineTo(x - rx, y);
  ctx.closePath();
}

function rectanguloRedondeado(ctx, x, y, ancho, alto, radio) {
  ctx.beginPath();
  ctx.roundRect(x, y, ancho, alto, radio);
}

/** Polígono con las esquinas redondeadas. */
function caminoRedondeado(ctx, puntos, radio) {
  ctx.beginPath();
  const n = puntos.length;
  for (let i = 0; i < n; i++) {
    const actual = puntos[i];
    const siguiente = puntos[(i + 1) % n];
    const anterior = puntos[(i - 1 + n) % n];

    const entrada = acercar(actual, anterior, radio);
    const salida = acercar(actual, siguiente, radio);

    if (i === 0) ctx.moveTo(entrada[0], entrada[1]);
    else ctx.lineTo(entrada[0], entrada[1]);

    ctx.quadraticCurveTo(actual[0], actual[1], salida[0], salida[1]);
  }
  ctx.closePath();
}

function acercar(desde, hacia, distancia) {
  const dx = hacia[0] - desde[0];
  const dy = hacia[1] - desde[1];
  const largo = Math.hypot(dx, dy) || 1;
  const d = Math.min(distancia, largo / 2);
  return [desde[0] + (dx / largo) * d, desde[1] + (dy / largo) * d];
}
