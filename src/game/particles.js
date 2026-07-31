/**
 * PARTÍCULAS — Explosiones y chispas.
 * ===================================
 *
 * Este es el único sistema del juego donde reutilizar objetos importa de
 * verdad: una explosión grande lanza 48 partículas, y con varias a la vez se
 * llega a cientos por segundo. Si se crearan y tiraran, el navegador haría
 * limpieza de memoria a mitad de partida y se notaría el tirón.
 *
 * Por eso las partículas se crean TODAS al arrancar y luego solo se encienden
 * y se apagan.
 */

import { EFECTOS } from '../config/balance.js';
import { EXPLOSION, JUGADOR } from '../config/palette.js';

class Particula {
  constructor() {
    this.activa = false;
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.radio = 1;
    this.vida = 0;
    this.vidaTotal = 1;
    this.color = EXPLOSION.DESTELLO;
    this.gravedad = 0;
    this.rozamiento = 0.9;
    // Las partículas oscuras (café) no pueden dibujarse en modo aditivo: un
    // color oscuro sumado a un fondo oscuro no se ve. Van en un segundo pase.
    this.aditiva = true;
  }
}

export class Particulas {
  constructor() {
    this.lista = Array.from({ length: EFECTOS.PARTICULAS_MAXIMAS }, () => new Particula());
    this.anillos = Array.from({ length: EFECTOS.ANILLOS_MAXIMOS }, () => ({
      activo: false, x: 0, y: 0, radio: 0, radioMax: 0, vida: 0, vidaTotal: 1,
    }));
  }

  _libre() {
    for (const p of this.lista) if (!p.activa) return p;
    // Si no queda ninguna libre se recicla la que está más cerca de apagarse:
    // mejor perder una chispa que ya iba a desaparecer que dejar de dibujar
    // la explosión nueva.
    let masCercaDeApagarse = this.lista[0];
    for (const p of this.lista) {
      if (p.vida < masCercaDeApagarse.vida) masCercaDeApagarse = p;
    }
    return masCercaDeApagarse;
  }

  /** Los anillos también se reutilizan, por coherencia con las partículas. */
  _anilloLibre() {
    for (const a of this.anillos) if (!a.activo) return a;
    return this.anillos[0];
  }

  _lanzarAnillo(x, y, radio, radioMax, vida) {
    const a = this._anilloLibre();
    a.activo = true;
    a.x = x;
    a.y = y;
    a.radio = radio;
    a.radioMax = radioMax;
    a.vida = vida;
    a.vidaTotal = vida;
  }

  _lanzar(x, y, opciones) {
    const p = this._libre();
    p.activa = true;
    p.x = x;
    p.y = y;
    p.vx = opciones.vx;
    p.vy = opciones.vy;
    p.radio = opciones.radio;
    p.vida = opciones.vida;
    p.vidaTotal = opciones.vida;
    p.color = opciones.color;
    p.gravedad = opciones.gravedad ?? 0;
    p.rozamiento = opciones.rozamiento ?? 0.9;
    p.aditiva = opciones.aditiva ?? true;
  }

  /** Explosión de un enemigo: chispas doradas y esquirlas de su color. */
  explosionEnemigo(x, y, cantidad, colorCuerpo) {
    const chispas = Math.round(cantidad * 0.55);
    const esquirlas = Math.round(cantidad * 0.27);

    for (let i = 0; i < chispas; i++) {
      const angulo = Math.random() * Math.PI * 2;
      const velocidad = 60 + Math.random() * 100;
      this._lanzar(x, y, {
        vx: Math.cos(angulo) * velocidad,
        vy: Math.sin(angulo) * velocidad,
        radio: 1.5 + Math.random() * 1.5,
        vida: 0.35 + Math.random() * 0.2,
        color: Math.random() < 0.4 ? EXPLOSION.DESTELLO : EXPLOSION.CHISPA_MEDIA,
      });
    }

    for (let i = 0; i < esquirlas; i++) {
      const angulo = Math.random() * Math.PI * 2;
      const velocidad = 40 + Math.random() * 50;
      this._lanzar(x, y, {
        vx: Math.cos(angulo) * velocidad,
        vy: Math.sin(angulo) * velocidad,
        radio: 1.5 + Math.random() * 1.5,
        vida: 0.5,
        color: colorCuerpo,
      });
    }

    this._lanzarAnillo(x, y, 4, 22, 0.18);
  }

  /**
   * Muerte del jugador: la única explosión con gravedad. La porcelana se
   * rompe y el café se derrama, y eso solo se lee si las partículas CAEN.
   */
  explosionJugador(x, y) {
    for (let i = 0; i < 20; i++) {
      const angulo = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6;
      const velocidad = 70 + Math.random() * 110;
      this._lanzar(x, y, {
        vx: Math.cos(angulo) * velocidad,
        vy: Math.sin(angulo) * velocidad,
        radio: 1.5 + Math.random() * 2,
        vida: 1.1,
        color: Math.random() < 0.5 ? EXPLOSION.ESQUIRLA_PORCELANA : JUGADOR.SOMBRA_CERAMICA,
        gravedad: 220,
        rozamiento: 1,
      });
    }

    for (let i = 0; i < 25; i++) {
      const angulo = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.8;
      const velocidad = 50 + Math.random() * 90;
      this._lanzar(x, y, {
        vx: Math.cos(angulo) * velocidad,
        vy: Math.sin(angulo) * velocidad,
        radio: 1 + Math.random() * 2,
        vida: 1.0,
        color: Math.random() < 0.5 ? EXPLOSION.GOTA_CAFE : EXPLOSION.HUMO_CAFE,
        gravedad: 220,
        rozamiento: 1,
        aditiva: false, // el café es oscuro: en modo aditivo no se vería
      });
    }

    for (let i = 0; i < 15; i++) {
      const angulo = Math.random() * Math.PI * 2;
      const velocidad = 80 + Math.random() * 80;
      this._lanzar(x, y, {
        vx: Math.cos(angulo) * velocidad,
        vy: Math.sin(angulo) * velocidad,
        radio: 1.5,
        vida: 0.6,
        color: JUGADOR.CIAN,
        rozamiento: 0.88,
      });
    }

    this._lanzarAnillo(x, y, 5, 40, 0.3);
  }

  /** Chispas pequeñas de un impacto que no mata. */
  impacto(x, y) {
    for (let i = 0; i < 5; i++) {
      const angulo = Math.random() * Math.PI * 2;
      const velocidad = 40 + Math.random() * 60;
      this._lanzar(x, y, {
        vx: Math.cos(angulo) * velocidad,
        vy: Math.sin(angulo) * velocidad,
        radio: 1.2,
        vida: 0.2,
        color: EXPLOSION.CHISPA_MEDIA,
      });
    }
  }

  actualizar(dt) {
    for (const p of this.lista) {
      if (!p.activa) continue;
      p.vida -= dt;
      if (p.vida <= 0) { p.activa = false; continue; }

      p.vy += p.gravedad * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.rozamiento !== 1) {
        p.vx *= p.rozamiento;
        p.vy *= p.rozamiento;
      }
    }

    for (const a of this.anillos) {
      if (!a.activo) continue;
      a.vida -= dt;
      if (a.vida <= 0) a.activo = false;
    }
  }

  dibujar(ctx) {
    ctx.save();

    // Primer pase, en modo normal: lo oscuro (el café derramado).
    for (const p of this.lista) {
      if (!p.activa || p.aditiva) continue;
      ctx.globalAlpha = Math.max(0, p.vida / p.vidaTotal);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
      ctx.fill();
    }

    // Segundo pase, aditivo: las chispas que se solapan se suman y dan un
    // blanco caliente en el centro de la explosión, gratis.
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.lista) {
      if (!p.activa || !p.aditiva) continue;
      ctx.globalAlpha = Math.max(0, p.vida / p.vidaTotal);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const a of this.anillos) {
      if (!a.activo) continue;
      const avance = 1 - a.vida / a.vidaTotal;
      ctx.globalAlpha = 1 - avance;
      ctx.strokeStyle = EXPLOSION.ANILLO_CHOQUE;
      ctx.lineWidth = 3 * (1 - avance) + 0.5;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radio + (a.radioMax - a.radio) * avance, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  limpiar() {
    for (const p of this.lista) p.activa = false;
    for (const a of this.anillos) a.activo = false;
  }
}
