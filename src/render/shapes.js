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
// AVISPA DE VAPOR
// ---------------------------------------------------------------------------

/**
 * 32 x 24 px. Punta de flecha con alas barridas. Es la más ANCHA y achatada
 * de las tres, y su movimiento es DEFORMACIÓN: las alas aletean a 6 Hz.
 * Ese aleteo rápido es lo que la distingue del grano (que rota despacio) y de
 * la cafetera (que late muy despacio), incluso viéndolas en negro.
 *
 * @param {number} escalaAlas  1,00 alas extendidas · 0,75 recogidas
 */
export function dibujarAvispa(ctx, escalaAlas = 1) {
  const c = ENEMIGOS.avispa;

  // Alas. Se dibujan primero para que el cuerpo las tape por el centro.
  ctx.save();
  ctx.scale(1, escalaAlas);
  for (const lado of [-1, 1]) {
    ctx.fillStyle = c.cuerpo;
    ctx.beginPath();
    ctx.moveTo(lado * 6, -2);
    ctx.lineTo(lado * 14, -8);
    ctx.lineTo(lado * 8, 3);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = c.brillo;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lado * 6, -2);
    ctx.lineTo(lado * 14, -8);
    ctx.stroke();
  }
  ctx.restore();

  // Cuerpo en punta hacia abajo.
  ctx.fillStyle = c.cuerpo;
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.lineTo(7, 2);
  ctx.lineTo(5, -6);
  ctx.lineTo(0, -10);
  ctx.lineTo(-5, -6);
  ctx.lineTo(-7, 2);
  ctx.closePath();
  ctx.fill();

  // Tres bandas oscuras: es lo que grita "avispa" sin necesidad de más.
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = c.acento;
  for (const y of [-3, 1, 5]) ctx.fillRect(-8, y, 16, 2);
  ctx.restore();

  // Visor. Parpadea en magenta al telegrafiar el ataque, pero eso lo hace
  // quien dibuja, no esta función.
  ctx.fillStyle = c.visor;
  ctx.beginPath();
  ctx.moveTo(-4, -5);
  ctx.lineTo(4, -5);
  ctx.lineTo(3, -9);
  ctx.lineTo(-3, -9);
  ctx.closePath();
  ctx.fill();

  // Aguijón.
  ctx.fillStyle = c.brillo;
  ctx.beginPath();
  ctx.moveTo(-2, 12);
  ctx.lineTo(2, 12);
  ctx.lineTo(0, 18);
  ctx.closePath();
  ctx.fill();
}

// ---------------------------------------------------------------------------
// CAFETERA GUARDIANA
// ---------------------------------------------------------------------------

/**
 * 34 x 36 px. Hexágono coronado. Es la ÚNICA unidad más alta que ancha de
 * toda la pantalla, y eso la hace inconfundible en silueta, en visión
 * periférica y a cualquier distancia. Su movimiento es TRASLACIÓN: un latido
 * vertical lento y pesado.
 *
 * Aguanta dos impactos, y es la única con un indicador de estado en el cuerpo:
 * su manómetro. Con un impacto recibido, la esfera se queda fija en ámbar y la
 * aguja tiembla. Así se comunican sus dos puntos de vida sin barras ni iconos.
 *
 * @param {number} tiempo
 * @param {boolean} dañada  si ya ha recibido un impacto
 */
export function dibujarCafetera(ctx, tiempo = 0, dañada = false) {
  const c = ENEMIGOS.cafetera;

  // Anillo orbital, mitad de atrás.
  const giro = tiempo * 0.21; // 12°/s
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = c.brillo;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 19, 6, 0, Math.PI + giro, Math.PI * 2 + giro);
  ctx.stroke();
  ctx.restore();

  // Corona: tapa y válvulas de presión. El único ámbar sobre un cuerpo
  // enemigo en todo el juego, y funciona como etiqueta de valor: 400 puntos.
  ctx.fillStyle = c.acento;
  for (const x of [-8, 8]) {
    ctx.fillRect(x - 1.5, -20, 3, 8);
    ctx.beginPath();
    ctx.arc(x, -20, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(-3, -12);
  ctx.lineTo(3, -12);
  ctx.lineTo(2.5, -20);
  ctx.lineTo(-2.5, -20);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -20, 2.5, Math.PI, Math.PI * 2);
  ctx.fill();

  // Placas laterales de cafetera italiana.
  ctx.fillStyle = c.placas;
  for (const x of [-17, 13]) {
    rectanguloRedondeado(ctx, x, -7, 4, 14, 1);
    ctx.fill();
  }
  ctx.fillStyle = c.brillo;
  for (const x of [-15, 15]) {
    for (const y of [-4, 6]) {
      ctx.beginPath();
      ctx.arc(x, y, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Cuerpo hexagonal.
  ctx.fillStyle = conCache('cuerpoCafetera', () => {
    const g = ctx.createLinearGradient(0, -13, 0, 13);
    g.addColorStop(0.0, c.cuerpoClaro);
    g.addColorStop(0.5, c.cuerpo);
    g.addColorStop(1.0, c.sombra);
    return g;
  });
  // Hexágono sin achatar: la cafetera tiene que leerse MÁS ALTA QUE ANCHA,
  // porque es la única unidad de la pantalla con proporción vertical y ese es
  // su discriminador de silueta.
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    const x = Math.cos(a) * 14;
    const y = Math.sin(a) * 14;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Manómetro: su indicador de daño.
  ctx.fillStyle = c.esferaManometro;
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = c.acento;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (dañada) {
    ctx.fillStyle = c.acento;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // La aguja oscila despacio; si está dañada, tiembla a 12 Hz.
  const angulo = dañada
    ? Math.PI * 0.55 + Math.sin(tiempo * 75) * 0.12
    : -Math.PI / 3 + Math.sin(tiempo * 2.2) * 0.44;
  ctx.strokeStyle = c.ojo;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(angulo) * 4, Math.sin(angulo) * 4);
  ctx.stroke();

  // Anillo orbital, mitad de delante.
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = c.brillo;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 19, 6, 0, giro, Math.PI + giro);
  ctx.stroke();
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
export function dibujarDisparoEnemigo(ctx, tiempo = 0, culpable = false, altoContraste = false) {
  const pulso = 1 + 0.125 * Math.sin(tiempo * 50);
  ctx.save();
  ctx.rotate(tiempo * Math.PI);
  ctx.scale(pulso, pulso);

  // Anillo blanco exterior: en alta legibilidad, el proyectil se separa del
  // fondo por brillo además de por color.
  if (altoContraste) {
    ctx.strokeStyle = PELIGRO.ANILLO_ALTO_CONTRASTE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.stroke();
  }

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
