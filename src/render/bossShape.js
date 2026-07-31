/**
 * EL DIBUJO DEL JEFE — Gran Tostadora Cósmica.
 * ============================================
 *
 * 176 x 140 px. Una máquina industrial de metal y latón, no una criatura.
 * Dibujada centrada en (0,0): quien llama la coloca y la sacude.
 *
 * SU SILUETA: masa horizontal ancha y baja, dos chimeneas y una tolva
 * escalonadas arriba, dos cañones colgando por debajo. Es la proporción más
 * achatada del juego y no se parece a ninguna silueta enemiga.
 *
 * EL DAÑO SE VE EN EL CUERPO, y no en una barra. Cada seis impactos cambia
 * algo: se agrieta el cristal, salta una placa, se rompe un manómetro, se
 * desprende la tolva. Es la información de vida puesta donde el jugador ya
 * está mirando.
 */

import { JEFE as COL, EXPLOSION, PELIGRO, JUGADOR } from '../config/palette.js';
import { JEFE as CFG, PANTALLA, ZONA_JUGADOR } from '../config/balance.js';
import { ESTADO_JEFE } from '../game/boss.js';

/**
 * @param {import('../game/boss.js').Jefe} jefe
 * @param {number} tiempo
 * @param {number} [encendido]  0 apagado (durante la entrada) · 1 encendido
 */
export function dibujarJefe(ctx, jefe, tiempo, encendido = 1) {
  const dano = jefe.nivelDano;

  // Durante la entrada llega apagado: una silueta plana que crece. La silueta
  // llega antes que el detalle, y la silueta es lo que hay que memorizar.
  if (encendido < 1) {
    _dibujarSilueta(ctx);
    if (encendido <= 0) return;
    ctx.globalAlpha = encendido;
  }

  _aura(ctx, tiempo, dano);
  _chimeneas(ctx, tiempo, dano);
  _tolva(ctx, tiempo, dano);
  _tambor(ctx, dano);
  _mirilla(ctx, tiempo, dano);
  _canones(ctx);
  _manometros(ctx, tiempo, dano);
  _quemador(ctx, tiempo, dano);
  _fisuras(ctx, tiempo, dano);

  ctx.globalAlpha = 1;
}

/**
 * EL TELEGRAFIADO — Lo que hace que el jefe sea justo.
 * ===================================================
 *
 * Se dibuja DEBAJO de la acción, nunca encima, y en dos tiempos:
 *
 *   CARGA  — pasa en el cuerpo del jefe, en tonos cálidos. Dice "va a pasar
 *            algo", pero todavía no dice dónde.
 *   MARCA  — dice exactamente dónde. Es el único momento en que el color de
 *            peligro aparece antes que el proyectil.
 *
 * Y en la lluvia de granos, el hueco seguro se marca EN POSITIVO: en cian, que
 * es el color del jugador, en su propia zona, y antes de que caiga un solo
 * grano. No basta con marcar el peligro; hay que marcar la salvación.
 *
 * @param {import('../game/boss.js').Jefe} jefe
 */
export function dibujarTelegrafiadoJefe(ctx, jefe, tiempo) {
  const marcando = jefe.estado === ESTADO_JEFE.MARCANDO;
  const disparando = jefe.estado === ESTADO_JEFE.DISPARANDO;
  if (!marcando && !disparando) return;

  if (jefe.ataque === 'verticales') _marcaVerticales(ctx, jefe, tiempo, marcando);
  else if (jefe.ataque === 'abanico') _marcaAbanico(ctx, jefe, tiempo, marcando);
  else if (jefe.ataque === 'granos') _marcaCarriles(ctx, jefe, tiempo, marcando);
}

/** Una línea de guiones desciende desde cada cañón hasta el borde inferior. */
function _marcaVerticales(ctx, jefe, tiempo, marcando) {
  if (!marcando) return;

  ctx.save();
  ctx.strokeStyle = PELIGRO.PROYECTIL;
  ctx.globalAlpha = 0.35 * (Math.sin(tiempo * 19) > -0.3 ? 1 : 0.35);
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.lineDashOffset = -tiempo * 200;

  for (const boca of jefe.bocasDeCanon()) {
    ctx.beginPath();
    ctx.moveTo(boca.x, boca.y);
    ctx.lineTo(boca.x, PANTALLA.ALTO);
    ctx.stroke();

    // El punto que crece en la boca: el aviso de que va a salir de ahí.
    ctx.setLineDash([]);
    ctx.fillStyle = PELIGRO.PROYECTIL;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(boca.x, boca.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.setLineDash([6, 6]);
    ctx.globalAlpha = 0.35;
  }
  ctx.restore();
}

/**
 * Cinco rayos guía que se abren desde la vertical. La información está en los
 * HUECOS: el jugador ve medio segundo antes los pasillos por los que no va a
 * pasar nada.
 */
function _marcaAbanico(ctx, jefe, tiempo, marcando) {
  if (!marcando) return;

  const origen = jefe.mirilla();
  const avance = Math.min(1, 1 - jefe.temporizador / CFG.ATAQUES.abanico.marcaEn);
  const apertura = Math.min(1, avance / 0.4);   // se despliega en el primer 40 %

  ctx.save();
  ctx.strokeStyle = PELIGRO.PROYECTIL;
  ctx.globalAlpha = 0.30 * (Math.sin(tiempo * 38) > -0.2 ? 1 : 0.4);
  ctx.lineWidth = 1.5;

  for (const grados of CFG.ATAQUES.abanico.angulos) {
    const rad = ((grados * apertura) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(origen.x, origen.y);
    ctx.lineTo(
      origen.x + Math.sin(rad) * PANTALLA.ALTO,
      origen.y + Math.cos(rad) * PANTALLA.ALTO
    );
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Seis carriles: cuatro peligrosos rellenos de magenta y dos seguros marcados
 * en cian, vacíos y con una flecha.
 *
 * Doble codificación deliberada: el peligro es RELLENO magenta, la seguridad es
 * CONTORNO cian y vacío. Funciona por color, por relleno/vacío y por
 * presencia/ausencia de icono, así que ni el daltonismo ni una nebulosa detrás
 * lo rompen.
 */
function _marcaCarriles(ctx, jefe, tiempo, marcando) {
  const ancho = CFG.ANCHO_CARRIL;
  // La marca empieza cerca de la zona del jugador, no arriba. Pintar la
  // columna entera daba la información igual de bien pero llenaba media
  // pantalla de magenta, y entonces el color de peligro deja de significar
  // "cuidado" y pasa a ser decoración.
  const desde = ZONA_JUGADOR.Y - 200;

  ctx.save();

  // Carriles peligrosos: muy tenues. Lo que tiene que destacar es el hueco
  // seguro, no la amenaza.
  const alphaPeligro = marcando
    ? 0.06 + (Math.sin(tiempo * 38) > 0 ? 0.05 : 0)
    : 0.05;   // durante la lluvia baja aún más, para no competir con los granos
  ctx.fillStyle = PELIGRO.PROYECTIL;
  ctx.strokeStyle = PELIGRO.PROYECTIL;
  ctx.lineWidth = 1;
  for (const carril of jefe.carrilesPeligrosos) {
    const x = carril * ancho;
    ctx.globalAlpha = alphaPeligro;
    ctx.fillRect(x, desde, ancho, PANTALLA.ALTO - desde);
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(x + 0.5, desde);
    ctx.lineTo(x + 0.5, PANTALLA.ALTO);
    ctx.moveTo(x + ancho - 0.5, desde);
    ctx.lineTo(x + ancho - 0.5, PANTALLA.ALTO);
    ctx.stroke();
  }

  // Carriles seguros: contorno cian y flecha, en la zona del jugador.
  const arriba = ZONA_JUGADOR.Y - 102;
  const alto = 150;
  ctx.strokeStyle = JUGADOR.CIAN;
  ctx.lineWidth = 2;
  ctx.globalAlpha = marcando ? 0.7 : 0.5;
  for (const carril of jefe.carrilesSeguros) {
    const x = carril * ancho + 4;
    const w = ancho - 8;

    // Rectángulo con las esquinas en chaflán.
    ctx.beginPath();
    ctx.moveTo(x + 6, arriba);
    ctx.lineTo(x + w - 6, arriba);
    ctx.lineTo(x + w, arriba + 6);
    ctx.lineTo(x + w, arriba + alto - 6);
    ctx.lineTo(x + w - 6, arriba + alto);
    ctx.lineTo(x + 6, arriba + alto);
    ctx.lineTo(x, arriba + alto - 6);
    ctx.lineTo(x, arriba + 6);
    ctx.closePath();
    ctx.stroke();

    // Flecha latiendo: "aquí es donde tú vas".
    const escala = 1 + 0.15 * Math.sin(tiempo * 12.6);
    ctx.save();
    ctx.translate(x + w / 2, arriba + alto / 2);
    ctx.scale(escala, escala);
    ctx.fillStyle = JUGADOR.CIAN;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(7, 5);
    ctx.lineTo(-7, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/** La forma en negro plano, para la entrada en escena. */
function _dibujarSilueta(ctx) {
  ctx.fillStyle = COL.METAL_OSCURO;
  _caminoChimenea(ctx, -56); ctx.fill();
  _caminoChimenea(ctx, 56); ctx.fill();
  _caminoTolva(ctx, 0); ctx.fill();
  _caminoTambor(ctx); ctx.fill();
  for (const lado of [-1, 1]) { _caminoCanon(ctx, lado); ctx.fill(); }
  ctx.fillRect(-58, 46, 116, 12);
}

// ---------------------------------------------------------------------------

/** Halo de calor. Crece cuanto más dañado está: se le escapa la energía. */
function _aura(ctx, tiempo, dano) {
  const base = 0.10 + dano * 0.03;
  const latido = 1 + 0.08 * Math.sin(tiempo * 1.57);
  const g = ctx.createRadialGradient(0, 10, 20, 0, 10, 105);
  g.addColorStop(0, `rgba(255,138,61,${base * latido})`);
  g.addColorStop(1, 'rgba(255,138,61,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 10, 105, 82, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function _caminoChimenea(ctx, x) {
  ctx.beginPath();
  ctx.moveTo(x - 13, -56);
  ctx.lineTo(x + 13, -56);
  ctx.lineTo(x + 9, -50);
  ctx.lineTo(x + 9, -24);
  ctx.lineTo(x - 9, -24);
  ctx.lineTo(x - 9, -50);
  ctx.closePath();
}

function _chimeneas(ctx, tiempo, dano) {
  for (const x of [-56, 56]) {
    // Con cuatro umbrales de daño, la chimenea izquierda se ha desprendido.
    if (dano >= 4 && x < 0) {
      ctx.fillStyle = COL.METAL_OSCURO;
      ctx.fillRect(x - 9, -32, 18, 8);
      _humo(ctx, x, -32, tiempo, COL.HUMO_NEGRO, 0.3);
      continue;
    }

    const g = ctx.createLinearGradient(0, -56, 0, -24);
    g.addColorStop(0, COL.CHIMENEA);
    g.addColorStop(1, COL.CHIMENEA_SOMBRA);
    ctx.fillStyle = g;
    _caminoChimenea(ctx, x);
    ctx.fill();

    ctx.strokeStyle = COL.LATON;
    ctx.lineWidth = 2;
    for (const y of [-46, -38, -30]) {
      ctx.beginPath();
      ctx.moveTo(x - 9, y);
      ctx.lineTo(x + 9, y);
      ctx.stroke();
    }

    // La derecha empieza a echar humo negro al saltarle la placa.
    const negro = dano >= 2 && x > 0;
    _humo(ctx, x, -58, tiempo, negro ? COL.HUMO_NEGRO : '#DCE9F5', negro ? 0.3 : 0.22);
  }
}

/** Volutas de vapor ascendiendo. Se calculan sin memoria, solo con el reloj. */
function _humo(ctx, x, y, tiempo, color, alpha) {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < 4; i++) {
    const fase = (tiempo * 0.7 + i * 0.25) % 1;
    const radio = 4 + fase * 10;
    ctx.globalAlpha = alpha * (1 - fase);
    ctx.beginPath();
    ctx.arc(x + Math.sin(fase * 5 + i) * 5, y - fase * 34, radio, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function _caminoTolva(ctx, inclinacion) {
  ctx.save();
  ctx.translate(0, -41);
  ctx.rotate(inclinacion);
  ctx.beginPath();
  ctx.moveTo(-30, -17);
  ctx.lineTo(30, -17);
  ctx.lineTo(18, 17);
  ctx.lineTo(-18, 17);
  ctx.closePath();
  ctx.restore();
}

/**
 * La tolva de granos, con su ventana de nivel. Cuantos menos granos se ven,
 * menos vida le queda: es un segundo indicador, sutil pero honesto.
 */
function _tolva(ctx, tiempo, dano) {
  // Con cuatro umbrales se ha desprendido: queda inclinada y vacía.
  const inclinacion = dano >= 4 ? 0.21 : 0;

  const g = ctx.createLinearGradient(0, -58, 0, -24);
  g.addColorStop(0, COL.METAL_CLARO);
  g.addColorStop(1, COL.METAL_MEDIO);
  ctx.fillStyle = g;
  _caminoTolva(ctx, inclinacion);
  ctx.fill();

  ctx.save();
  ctx.translate(0, -41);
  ctx.rotate(inclinacion);

  ctx.fillStyle = COL.METAL_BRILLO;
  ctx.fillRect(-34, -21, 68, 4);

  // Ventana de nivel.
  ctx.fillStyle = COL.CRISTAL_MIRILLA;
  ctx.beginPath();
  ctx.roundRect(-12, -13, 24, 20, 2);
  ctx.fill();

  const granos = dano >= 4 ? 0 : dano >= 3 ? 4 : dano >= 1 ? 7 : 10;
  for (let i = 0; i < granos; i++) {
    const gx = -8 + (i % 5) * 4;
    const gy = -8 + Math.floor(i / 5) * 6 + Math.sin(tiempo * 18.8 + i) * 1;
    ctx.fillStyle = i % 2 ? COL.GRANO_TOSTANDOSE : COL.LATON;
    ctx.beginPath();
    ctx.ellipse(gx, gy, 1.6, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function _caminoTambor(ctx) {
  ctx.beginPath();
  ctx.roundRect(-72, -22, 144, 68, 26);
}

/** El tambor tostador: la masa dominante. */
function _tambor(ctx, dano) {
  const g = ctx.createLinearGradient(0, -22, 0, 46);
  g.addColorStop(0.00, COL.METAL_OSCURO);
  g.addColorStop(0.22, COL.METAL_BRILLO);
  g.addColorStop(0.45, COL.METAL_CLARO);
  g.addColorStop(0.75, COL.METAL_MEDIO);
  g.addColorStop(1.00, COL.METAL_OSCURO);
  ctx.fillStyle = g;
  _caminoTambor(ctx);
  ctx.fill();

  // Costillas del tambor.
  ctx.save();
  _caminoTambor(ctx);
  ctx.clip();
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = COL.METAL_MEDIO;
  ctx.lineWidth = 2;
  for (const x of [-44, 0, 44]) {
    ctx.beginPath();
    ctx.ellipse(x, 12, 8, 34, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Remaches.
  ctx.fillStyle = COL.METAL_LUZ;
  for (let i = 0; i < 10; i++) {
    const x = -63 + i * 14;
    for (const y of [-16, 40]) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Placas que saltan: la derecha al segundo umbral, la izquierda al tercero.
  if (dano >= 2) _hueco(ctx, 46, -4);
  if (dano >= 3) _hueco(ctx, -46, -4);
}

/** Un boquete dentado con fuego dentro. */
function _hueco(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#1A2230';
  ctx.beginPath();
  ctx.moveTo(-11, -8);
  ctx.lineTo(-4, -6);
  ctx.lineTo(2, -8);
  ctx.lineTo(11, -3);
  ctx.lineTo(8, 5);
  ctx.lineTo(0, 8);
  ctx.lineTo(-8, 6);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = COL.METAL_CLARO;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.save();
  ctx.clip();
  ctx.fillStyle = COL.FUEGO_INTERIOR;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.arc(0, 2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/** La mirilla: el punto focal, y donde mejor se lee el daño. */
function _mirilla(ctx, tiempo, dano) {
  const cx = 0;
  const cy = 12;

  // Cristal.
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
  g.addColorStop(0, COL.CRISTAL_MIRILLA);
  g.addColorStop(1, COL.CRISTAL_BORDE);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, Math.PI * 2);
  ctx.clip();

  // Fuego interior. Crece con el daño hasta desbordar el bisel.
  const radioFuego = 14 + dano * 4;
  const f = ctx.createRadialGradient(cx, cy, 0, cx, cy, radioFuego);
  f.addColorStop(0, COL.FUEGO_INTERIOR);
  f.addColorStop(1, 'rgba(255,138,61,0)');
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = f;
  ctx.fillRect(cx - 26, cy - 26, 52, 52);
  ctx.globalAlpha = 1;

  // Los granos tostándose, girando a velocidad invariable. Son el reloj del
  // jefe: si algo se sale de ese ritmo, es que va a pasar algo.
  ctx.fillStyle = COL.GRANO_TOSTANDOSE;
  for (let i = 0; i < 10; i++) {
    const a = tiempo * 1.05 + (i / 10) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * 17, cy + Math.sin(a) * 13);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, 0, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Grietas: tres al primer umbral, seis y teñidas de calor al tercero.
  if (dano >= 1) {
    const cuantas = dano >= 3 ? 6 : 3;
    ctx.strokeStyle = dano >= 3 ? COL.FISURA : '#F4F7FB';
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < cuantas; i++) {
      const a = (i / cuantas) * Math.PI * 2 + 0.4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 25, cy + Math.sin(a) * 25);
      ctx.lineTo(cx + Math.cos(a + 0.3) * 9, cy + Math.sin(a + 0.3) * 9);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Bisel de latón con su brillo superior.
  ctx.strokeStyle = COL.LATON;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = COL.LATON_BRILLO;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 26, -2.6, -1.2);
  ctx.stroke();
}

function _caminoCanon(ctx, lado) {
  ctx.beginPath();
  ctx.roundRect(lado * 72 - 6, 30, 12, 22, 2);
}

function _canones(ctx) {
  for (const lado of [-1, 1]) {
    // Módulo hexagonal.
    ctx.fillStyle = COL.METAL_MEDIO;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const x = lado * 72 + Math.cos(a) * 14;
      const y = 30 + Math.sin(a) * 14;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COL.METAL_OSCURO;
    _caminoCanon(ctx, lado);
    ctx.fill();

    // Boca.
    ctx.fillStyle = '#1A2230';
    ctx.beginPath();
    ctx.ellipse(lado * 72, 52, 6, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COL.LATON;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

/**
 * Los dos manómetros. Al saltar cada placa se rompe el manómetro de ese lado:
 * la aguja se queda clavada al máximo y deja de moverse.
 */
function _manometros(ctx, tiempo, dano) {
  const lados = [
    { x: -38, roto: dano >= 3 },
    { x: 38, roto: dano >= 2 },
  ];

  for (const { x, roto } of lados) {
    ctx.fillStyle = COL.ESFERA_MANOMETRO;
    ctx.beginPath();
    ctx.arc(x, -10, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COL.LATON;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (roto) {
      // Esfera agrietada.
      ctx.strokeStyle = COL.METAL_OSCURO;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 7, -14);
      ctx.lineTo(x + 3, -6);
      ctx.moveTo(x + 6, -14);
      ctx.lineTo(x - 2, -4);
      ctx.stroke();
    }

    const angulo = roto
      ? Math.PI * 0.33
      : -Math.PI / 2 + Math.sin(tiempo * 2.5 + (x > 0 ? Math.PI : 0)) * 0.35;

    ctx.strokeStyle = COL.AGUJA;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, -10);
    ctx.lineTo(x + Math.cos(angulo) * 6, -10 + Math.sin(angulo) * 6);
    ctx.stroke();
  }
}

/** El quemador: siete llamas temblando. El único elemento rápido del jefe. */
function _quemador(ctx, tiempo, dano) {
  ctx.fillStyle = COL.METAL_OSCURO;
  ctx.fillRect(-58, 46, 116, 12);

  const alturaBase = dano >= 3 ? 8 : 4;
  const variacion = dano >= 3 ? 10 : 8;

  for (let i = 0; i < 7; i++) {
    const x = -48 + i * 16;
    const alto = alturaBase + Math.abs(Math.sin(tiempo * 75 + i * 1.7)) * variacion;

    ctx.fillStyle = COL.LLAMA_QUEMADOR;
    ctx.beginPath();
    ctx.moveTo(x - 4, 58);
    ctx.lineTo(x + 4, 58);
    ctx.lineTo(x, 58 + alto);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COL.LLAMA_NUCLEO;
    ctx.beginPath();
    ctx.moveTo(x - 1.5, 58);
    ctx.lineTo(x + 1.5, 58);
    ctx.lineTo(x, 58 + alto * 0.55);
    ctx.closePath();
    ctx.fill();
  }

  // Faldón.
  ctx.fillStyle = COL.METAL_OSCURO;
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(lado * 70, 46);
    ctx.lineTo(lado * 46, 46);
    ctx.lineTo(lado * 52, 64);
    ctx.lineTo(lado * 64, 64);
    ctx.closePath();
    ctx.fill();
  }
}

/** Agonía: fisuras luminosas recorriendo el tambor de lado a lado. */
function _fisuras(ctx, tiempo, dano) {
  if (dano < 5) return;

  ctx.save();
  _caminoTambor(ctx);
  ctx.clip();
  ctx.strokeStyle = COL.FISURA;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const y = -14 + i * 16;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(tiempo * 8 + i);
    ctx.beginPath();
    ctx.moveTo(-72, y);
    ctx.lineTo(-24, y + 5);
    ctx.lineTo(20, y - 4);
    ctx.lineTo(72, y + 3);
    ctx.stroke();
  }
  ctx.restore();

  // Chorros de vapor a presión escapándose de las juntas.
  const ciclo = (tiempo % 0.4) / 0.4;
  if (ciclo < 0.35) {
    ctx.save();
    ctx.globalAlpha = (1 - ciclo / 0.35) * 0.5;
    ctx.fillStyle = EXPLOSION.ESQUIRLA_PORCELANA;
    for (const x of [-50, 10, 55]) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x - 6, 20 + 40 * ciclo);
      ctx.lineTo(x + 6, 20 + 40 * ciclo);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
