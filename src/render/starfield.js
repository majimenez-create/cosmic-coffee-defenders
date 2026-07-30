/**
 * CAMPO DE ESTRELLAS — El fondo espacial.
 * =======================================
 *
 * Tres capas que se mueven a velocidades distintas. Esa diferencia de
 * velocidad es lo único que crea la sensación de profundidad: las de arriba
 * están "lejos" y las de abajo "cerca".
 *
 * Regla de oro: el fondo nunca puede robar protagonismo. Si durante una
 * partida el jugador NOTA el fondo, el fondo ha ganado y el juego ha perdido.
 * Por eso las estrellas son tenues y hay un techo de cantidad.
 */

import { PANTALLA } from '../config/balance.js';
import { ESTRELLAS, FONDO } from '../config/palette.js';

const CAPAS = [
  { def: ESTRELLAS.LEJANA, proporcion: 0.5 },
  { def: ESTRELLAS.MEDIA, proporcion: 0.32 },
  { def: ESTRELLAS.CERCANA, proporcion: 0.18 },
];

export class CampoDeEstrellas {
  constructor() {
    this.capas = CAPAS.map(({ def, proporcion }) => ({
      def,
      estrellas: this._crear(Math.round(ESTRELLAS.CANTIDAD_BASE * proporcion)),
    }));

    // Unas pocas estrellas son granos de café. Es un guiño que casi no se ve,
    // y precisamente por eso funciona.
    this.granos = this._crear(6);

    this._degradado = null;
  }

  _crear(cantidad) {
    const lista = [];
    for (let i = 0; i < cantidad; i++) {
      lista.push({
        x: Math.random() * PANTALLA.ANCHO,
        y: Math.random() * PANTALLA.ALTO,
        fase: Math.random() * Math.PI * 2,
      });
    }
    return lista;
  }

  actualizar(dt) {
    for (const capa of this.capas) {
      for (const e of capa.estrellas) {
        e.y += capa.def.velocidad * dt;
        if (e.y > PANTALLA.ALTO) {
          e.y -= PANTALLA.ALTO;
          e.x = Math.random() * PANTALLA.ANCHO;
        }
      }
    }
    for (const g of this.granos) {
      g.y += ESTRELLAS.GRANO.velocidad * dt;
      if (g.y > PANTALLA.ALTO) {
        g.y -= PANTALLA.ALTO;
        g.x = Math.random() * PANTALLA.ANCHO;
      }
    }
  }

  dibujar(ctx, tiempo) {
    // El degradado se crea una sola vez, no en cada fotograma: crearlo 60
    // veces por segundo es un desperdicio que se nota en móviles modestos.
    if (!this._degradado) {
      this._degradado = ctx.createLinearGradient(0, 0, 0, PANTALLA.ALTO);
      this._degradado.addColorStop(0, FONDO.VACIO_SUPERIOR);
      this._degradado.addColorStop(0.55, FONDO.VACIO_MEDIO);
      this._degradado.addColorStop(1, FONDO.VACIO_BASE);
    }
    ctx.fillStyle = this._degradado;
    ctx.fillRect(0, 0, PANTALLA.ANCHO, PANTALLA.ALTO);

    // Se dibuja capa por capa para cambiar el color una sola vez por capa.
    // fillRect es más barato que arc para puntos de 1-2 px.
    this.capas.forEach((capa, indice) => {
      ctx.fillStyle = capa.def.color;
      const t = capa.def.tamano;
      for (const e of capa.estrellas) {
        // Solo la capa intermedia parpadea: si parpadearan todas, el cielo
        // entero vibraría y competiría con la acción.
        if (indice === 1) {
          ctx.globalAlpha = 0.5 + 0.5 * Math.sin(tiempo * 1.9 + e.fase);
        }
        ctx.fillRect(e.x, e.y, t, t);
      }
      ctx.globalAlpha = 1;
    });

    ctx.fillStyle = ESTRELLAS.GRANO.color;
    for (const g of this.granos) {
      ctx.fillRect(g.x, g.y, ESTRELLAS.GRANO.tamano, ESTRELLAS.GRANO.tamano);
    }
  }
}
