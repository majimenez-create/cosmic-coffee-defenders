/**
 * FONDO — El universo del café.
 * =============================
 *
 * Nebulosas de vapor, una galaxia en espiral hecha de granos de café, planetas
 * cerámicos y tres capas de estrellas.
 *
 * REGLA DE ORO QUE MANDA AQUÍ
 * El fondo NUNCA puede robar protagonismo. Si durante una oleada el jugador
 * NOTA el fondo, el fondo ha ganado y el juego ha perdido. Por eso todo va con
 * opacidades bajas, se mueve muy despacio, y hay un tope de cuántas cosas
 * pueden aparecer a la vez.
 *
 * CÓMO SE CONSIGUE QUE SEA GRATIS
 * Las nebulosas y la galaxia son costosas de dibujar: decenas de degradados
 * cada una. Así que se pintan UNA sola vez al arrancar, en lienzos invisibles
 * guardados en memoria, y durante la partida solo se copian y se rotan. Pasan
 * de costar cientos de operaciones por fotograma a costar una.
 */

import { PANTALLA } from '../config/balance.js';
import { FONDO, ESTRELLAS, GALAXIA_GRANOS, PLANETA } from '../config/palette.js';
import { CampoDeEstrellas } from './starfield.js';

const NEBULOSAS = [
  { color: FONDO.NEBULOSA_FRIA, alpha: 0.30, escala: 2.5, velocidad: 5 },
  { color: FONDO.NEBULOSA_CALIDA, alpha: 0.22, escala: 2.0, velocidad: 7 },
  { color: FONDO.NEBULOSA_AZUL, alpha: 0.20, escala: 1.6, velocidad: 8 },
];

export class Fondo {
  constructor() {
    this.estrellas = new CampoDeEstrellas();
    this.tiempo = 0;

    this._prepararNebulosas();
    this._prepararGalaxia();
    this._prepararVineta();

    // Un planeta como máximo, y no siempre: apareciendo de vez en cuando
    // resulta un hallazgo, y estando siempre sería decorado.
    this.planeta = null;
    this.esperaPlaneta = 12;
  }

  // -------------------------------------------------------------------------
  // Preparación (una sola vez, al arrancar)
  // -------------------------------------------------------------------------

  /** Manchas de vapor difusas, hechas superponiendo degradados radiales. */
  _prepararNebulosas() {
    this.nebulosas = NEBULOSAS.map((def) => {
      const lienzo = document.createElement('canvas');
      lienzo.width = 256;
      lienzo.height = 256;
      const c = lienzo.getContext('2d');

      const cuantas = 14;
      for (let i = 0; i < cuantas; i++) {
        const x = 60 + Math.random() * 136;
        const y = 60 + Math.random() * 136;
        const radio = 40 + Math.random() * 50;
        const g = c.createRadialGradient(x, y, 0, x, y, radio);
        g.addColorStop(0, def.color);
        g.addColorStop(1, 'transparent');
        c.globalAlpha = 0.05;
        c.fillStyle = g;
        c.fillRect(0, 0, 256, 256);
      }

      return {
        lienzo,
        alpha: def.alpha,
        escala: def.escala,
        velocidad: def.velocidad,
        x: Math.random() * PANTALLA.ANCHO,
        y: Math.random() * PANTALLA.ALTO - PANTALLA.ALTO,
      };
    });
  }

  /**
   * La galaxia de granos de café: una espiral logarítmica cuyos puntos son
   * pequeños granos. Es el elemento con más personalidad del fondo, y solo
   * cuesta un dibujado porque se pre-renderiza y luego solo se rota.
   */
  _prepararGalaxia() {
    const tamano = 220;
    const lienzo = document.createElement('canvas');
    lienzo.width = tamano;
    lienzo.height = tamano;
    const c = lienzo.getContext('2d');
    const centro = tamano / 2;

    const brazos = 2;
    const porBrazo = 70;

    for (let brazo = 0; brazo < brazos; brazo++) {
      const desfase = (brazo / brazos) * Math.PI * 2;
      for (let i = 0; i < porBrazo; i++) {
        const t = i / porBrazo;
        // r = a·e^(b·θ) es la fórmula de la espiral logarítmica, la misma que
        // siguen las galaxias de verdad.
        const angulo = t * Math.PI * 2.4 + desfase;
        const radio = 8 * Math.exp(1.05 * angulo * 0.5);
        if (radio > centro - 6) break;

        const x = centro + Math.cos(angulo) * radio;
        const y = centro + Math.sin(angulo) * radio;

        // Del marrón oscuro del centro al ámbar claro del borde.
        c.fillStyle = t < 0.35 ? GALAXIA_GRANOS.CENTRO
                   : t < 0.75 ? GALAXIA_GRANOS.MEDIO
                   : GALAXIA_GRANOS.BORDE;
        c.globalAlpha = 0.35;

        const largo = 1.5 + t * 1.5;
        c.save();
        c.translate(x, y);
        c.rotate(angulo);
        c.beginPath();
        c.ellipse(0, 0, largo, largo * 0.65, 0, 0, Math.PI * 2);
        c.fill();
        // La hendidura que hace que se lea como grano y no como punto.
        c.strokeStyle = GALAXIA_GRANOS.CENTRO;
        c.globalAlpha = 0.25;
        c.lineWidth = 0.5;
        c.beginPath();
        c.moveTo(-largo * 0.6, 0);
        c.lineTo(largo * 0.6, 0);
        c.stroke();
        c.restore();
      }
    }

    this.galaxia = lienzo;
    // Siempre en el tercio superior y desplazada a un lado, jamás centrada:
    // centrada competiría con la formación.
    this.galaxiaX = PANTALLA.ANCHO * 0.78;
    this.galaxiaY = PANTALLA.ALTO * 0.16;
  }

  /**
   * La viñeta oscurece las esquinas. Es lo que hace que un proyectil se vea
   * incluso en el borde de la pantalla.
   */
  _prepararVineta() {
    const lienzo = document.createElement('canvas');
    lienzo.width = PANTALLA.ANCHO;
    lienzo.height = PANTALLA.ALTO;
    const c = lienzo.getContext('2d');

    const g = c.createRadialGradient(
      PANTALLA.ANCHO / 2, PANTALLA.ALTO / 2, PANTALLA.ALTO * 0.25,
      PANTALLA.ANCHO / 2, PANTALLA.ALTO / 2, PANTALLA.ALTO * 0.62
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.45)');
    c.fillStyle = g;
    c.fillRect(0, 0, PANTALLA.ANCHO, PANTALLA.ALTO);

    this.vineta = lienzo;
  }

  _crearPlaneta() {
    // Deliberadamente pequeño. Uno grande queda muy vistoso en una captura,
    // pero al descender pasa por detrás de la formación y compite con los
    // enemigos justo cuando hay que distinguirlos.
    const diametro = 62 + Math.random() * 44;
    const lienzo = document.createElement('canvas');
    lienzo.width = diametro;
    lienzo.height = diametro;
    const c = lienzo.getContext('2d');
    const r = diametro / 2;

    // Esfera de porcelana: el foco de luz desplazado es lo que le da volumen.
    const g = c.createRadialGradient(r - r * 0.35, r - r * 0.35, r * 0.1, r, r, r);
    g.addColorStop(0, PLANETA.ESMALTE_ILUMINADO);
    g.addColorStop(0.55, PLANETA.MEDIO_TONO);
    g.addColorStop(1, PLANETA.SOMBRA);
    c.fillStyle = g;
    c.beginPath();
    c.arc(r, r, r - 1, 0, Math.PI * 2);
    c.fill();

    // Bandas de esmalte.
    c.save();
    c.beginPath();
    c.arc(r, r, r - 1, 0, Math.PI * 2);
    c.clip();
    c.globalAlpha = 0.5;
    c.strokeStyle = PLANETA.BANDA_ESMALTE;
    c.lineWidth = 2;
    for (const desplazamiento of [-0.3, 0.15]) {
      c.beginPath();
      c.ellipse(r, r + r * desplazamiento, r, r * 0.28, 0, 0, Math.PI * 2);
      c.stroke();
    }

    // El "ecuador" de café, con su goteo. Es el detalle que convierte una
    // bola de porcelana en una taza planetaria.
    c.globalAlpha = 0.85;
    c.strokeStyle = PLANETA.LINEA_CAFE;
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(r, r, r * 0.98, r * 0.2, 0, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(r + r * 0.3, r + r * 0.18);
    c.lineTo(r + r * 0.3, r + r * 0.18 + 6);
    c.stroke();
    c.restore();

    return {
      lienzo,
      diametro,
      // Se sale parcialmente de cuadro: es más elegante, más barato y deja
      // libre el centro, que es donde ocurre la acción.
      x: Math.random() < 0.5 ? PANTALLA.ANCHO * 0.06 : PANTALLA.ANCHO * 0.94,
      y: -diametro,
      velocidad: 6,
    };
  }

  // -------------------------------------------------------------------------
  // Cada fotograma
  // -------------------------------------------------------------------------

  actualizar(dt) {
    this.tiempo += dt;
    this.estrellas.actualizar(dt);

    for (const n of this.nebulosas) {
      n.y += n.velocidad * dt;
      if (n.y > PANTALLA.ALTO) {
        n.y = -256 * n.escala;
        n.x = Math.random() * PANTALLA.ANCHO;
      }
    }

    if (this.planeta) {
      this.planeta.y += this.planeta.velocidad * dt;
      if (this.planeta.y > PANTALLA.ALTO + this.planeta.diametro) this.planeta = null;
    } else {
      this.esperaPlaneta -= dt;
      if (this.esperaPlaneta <= 0) {
        this.planeta = this._crearPlaneta();
        this.esperaPlaneta = 45 + Math.random() * 30;
      }
    }
  }

  dibujar(ctx) {
    // 1. Degradado base y estrellas.
    this.estrellas.dibujar(ctx, this.tiempo);

    ctx.save();

    // 2. Nebulosas de vapor, en modo aditivo para que se sumen entre ellas.
    ctx.globalCompositeOperation = 'lighter';
    for (const n of this.nebulosas) {
      ctx.globalAlpha = n.alpha;
      const lado = 256 * n.escala;
      ctx.drawImage(n.lienzo, n.x - lado / 2, n.y, lado, lado);
    }

    // 3. La galaxia de granos, girando muy despacio (1,5 grados por segundo).
    ctx.globalAlpha = 0.5;
    ctx.translate(this.galaxiaX, this.galaxiaY);
    ctx.rotate(this.tiempo * 0.026);
    ctx.drawImage(this.galaxia, -110, -110);

    ctx.restore();

    // 4. El planeta cerámico. Se atenúa cuanto más se acerque al centro del
    //    ancho, que es donde ocurre la acción: nunca puede competir con un
    //    enemigo ni con un proyectil.
    if (this.planeta) {
      const distanciaAlCentro = Math.abs(this.planeta.x - PANTALLA.ANCHO / 2);
      const cercania = 1 - Math.min(1, distanciaAlCentro / (PANTALLA.ANCHO / 2));
      ctx.save();
      ctx.globalAlpha = 0.42 * (1 - cercania * 0.6);
      ctx.drawImage(
        this.planeta.lienzo,
        this.planeta.x - this.planeta.diametro / 2,
        this.planeta.y
      );
      ctx.restore();
    }

    // 5. La rejilla del tercio inferior: marca visualmente el territorio del
    //    jugador, y con espaciado creciente da una falsa perspectiva.
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = FONDO.REJILLA_ZONA;
    ctx.lineWidth = 1;
    let y = PANTALLA.ALTO * 0.66;
    let separacion = 14;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(PANTALLA.ANCHO, Math.round(y) + 0.5);
      ctx.stroke();
      y += separacion;
      separacion *= 1.28;
    }
    ctx.restore();

    // 6. Viñeta. Va encima del fondo y debajo de la acción: es lo que hace
    //    que los proyectiles destaquen incluso en los bordes.
    ctx.drawImage(this.vineta, 0, 0);
  }
}
