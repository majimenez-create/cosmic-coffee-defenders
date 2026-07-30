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
import { EXPLOSION } from '../config/palette.js';

class Particula {
  constructor() {
    this.activa = false;
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.radio = 1;
    this.vida = 0;
    this.vidaTotal = 1;
    this.color = '#FFF';
    this.gravedad = 0;
    this.rozamiento = 0.9;
  }
}

export class Particulas {
  constructor() {
    this.lista = Array.from({ length: EFECTOS.PARTICULAS_MAXIMAS }, () => new Particula());
    this.anillos = [];
  }

  _libre() {
    for (const p of this.lista) if (!p.activa) return p;
    // Si no queda ninguna libre se recicla la más antigua: mejor perder una
    // chispa vieja que dejar de dibujar la explosión nueva.
    let masVieja = this.lista[0];
    for (const p of this.lista) if (p.vida < masVieja.vida) masVieja = p;
    return masVieja;
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

    this.anillos.push({ x, y, radio: 4, radioMax: 22, vida: 0.18, vidaTotal: 0.18 });
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
        color: Math.random() < 0.5 ? EXPLOSION.ESQUIRLA_PORCELANA : '#AFC0D6',
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
        color: '#3FD2FF',
        rozamiento: 0.88,
      });
    }

    this.anillos.push({ x, y, radio: 5, radioMax: 40, vida: 0.3, vidaTotal: 0.3 });
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

    for (let i = this.anillos.length - 1; i >= 0; i--) {
      const a = this.anillos[i];
      a.vida -= dt;
      if (a.vida <= 0) this.anillos.splice(i, 1);
    }
  }

  dibujar(ctx) {
    ctx.save();
    // Composición aditiva: las chispas que se solapan se suman y dan un
    // blanco caliente en el centro de la explosión, gratis.
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.lista) {
      if (!p.activa) continue;
      ctx.globalAlpha = Math.max(0, p.vida / p.vidaTotal);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const a of this.anillos) {
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
    this.anillos = [];
  }
}
