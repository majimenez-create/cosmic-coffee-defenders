/**
 * PARTIDA — Donde se junta todo.
 * ==============================
 *
 * Orquesta al jugador, la formación, los proyectiles, las colisiones y la
 * puntuación. Es el único sitio que conoce las reglas del enfrentamiento.
 *
 * FASE 1: la escuadra está colocada y dispara, pero todavía no hace las
 * entradas en curva ni los picados de ataque. Eso llega en la fase 2.
 */

import {
  PANTALLA, DISPARO, DISPARO_ENEMIGO, ATAQUES, PUNTUACION,
  CICLO_FASES, JUGADOR as CFG_JUGADOR, EFECTOS,
} from '../config/balance.js';
import { HUD, JUGADOR as COL_JUGADOR, ENEMIGOS as COL_ENEMIGOS, TIPOGRAFIA } from '../config/palette.js';

import { Taza, ESTADO } from '../game/player.js';
import { Proyectiles } from '../game/bullets.js';
import { Formacion } from '../game/formation.js';
import { Particulas } from '../game/particles.js';
import { proyectilTocaCirculo, circulosTocan } from '../game/collision.js';

import { CampoDeEstrellas } from '../render/starfield.js';
import { dibujarTaza, dibujarGrano, dibujarDisparoJugador, dibujarDisparoEnemigo } from '../render/shapes.js';
import { dibujarHud } from '../render/hud.js';
import { dibujarTexto } from '../render/text.js';
import { leerRecord, guardarRecord } from '../services/scoreStore.js';

const FASE = {
  INTRO: 'intro',
  COMBATE: 'combate',
  OLEADA_LIMPIADA: 'limpiada',
  FIN_PARTIDA: 'fin',
};

export class Partida {
  constructor(entrada) {
    this.entrada = entrada;

    this.estrellas = new CampoDeEstrellas();
    this.particulas = new Particulas();
    this.disparosJugador = new Proyectiles(DISPARO.MAXIMO_EN_PANTALLA, false);
    this.disparosEnemigos = new Proyectiles(DISPARO_ENEMIGO.MAXIMO_EN_PANTALLA, true);
    this.formacion = new Formacion();
    this.taza = new Taza(this.disparosJugador);

    this.record = leerRecord();
    this.sacudida = 0;
    this.congelacion = 0;
    this.tiempo = 0;

    this.empezar();
  }

  empezar() {
    this.taza.reiniciar();
    this.disparosJugador.limpiar();
    this.disparosEnemigos.limpiar();
    this.particulas.limpiar();

    this.puntos = 0;
    this.puntosMostrados = 0;
    this.numeroFase = 1;
    this.siguienteVidaExtra = PUNTUACION.VIDA_EXTRA_CADA;

    this._entrarEnFase();
  }

  _entrarEnFase() {
    const plantilla = CICLO_FASES[(this.numeroFase - 1) % CICLO_FASES.length];
    // En la fase 1 solo existen las fases normales; bonus y jefe llegan
    // en la fase 4 del proyecto. Mientras tanto se reutilizan las normales.
    const tipos = plantilla.enemigos ?? ['grano'];
    this.formacion.poblar(tipos.includes('grano') ? tipos : ['grano']);

    this.fase = FASE.INTRO;
    this.temporizador = 1.3;
    this.tiempoDeFase = 0;

    // La puntería se mide por oleada, no por partida: así el dato del cartel
    // habla de lo que el jugador acaba de hacer.
    this.disparosAlEmpezarOleada = this.taza.disparosRealizados;
    this.acertados = 0;
    this.recargaEnemigos = this._esFaseFacil()
      ? ATAQUES.ESPERA_PRIMER_ATAQUE_FACIL
      : ATAQUES.ESPERA_PRIMER_ATAQUE;
  }

  _esFaseFacil() {
    return this.numeroFase <= 3;
  }

  // -------------------------------------------------------------------------
  // Lógica
  // -------------------------------------------------------------------------

  actualizar(dt) {
    this.tiempo += dt;
    this.entrada.actualizar();

    this.estrellas.actualizar(dt);
    this.particulas.actualizar(dt);
    this.sacudida = Math.max(0, this.sacudida - dt);

    // El marcador cuenta hacia el valor real en lugar de saltar de golpe.
    if (this.puntosMostrados < this.puntos) {
      this.puntosMostrados = Math.min(
        this.puntos,
        this.puntosMostrados + PUNTUACION.VELOCIDAD_CONTADOR * dt
      );
    }

    if (this.fase === FASE.FIN_PARTIDA) {
      this.temporizador -= dt;
      if (this.temporizador <= 0 && this.entrada.confirmarPulsado) this.empezar();
      this.entrada.finPaso();
      return;
    }

    if (this.fase === FASE.INTRO) {
      this.temporizador -= dt;
      // Ojo: durante la intro el jugador YA tiene el control y la escuadra ya
      // está en pantalla. Nunca hay un fotograma de pantalla vacía.
      if (this.temporizador <= 0) this.fase = FASE.COMBATE;
    }

    if (this.fase === FASE.OLEADA_LIMPIADA) {
      this.temporizador -= dt;
      if (this.temporizador <= 0) {
        this.numeroFase++;
        this._entrarEnFase();
      }
    }

    this.tiempoDeFase += dt;
    this.formacion.actualizar(dt);
    this.taza.actualizar(dt, this.entrada, this.tiempo);
    this.disparosJugador.actualizar(dt);
    this.disparosEnemigos.actualizar(dt);

    if (this.fase === FASE.COMBATE) this._dispararEnemigos(dt);
    this._resolverColisiones();

    if (this.fase === FASE.COMBATE && !this.formacion.quedanVivos) {
      this.fase = FASE.OLEADA_LIMPIADA;
      this.temporizador = 1.8;
    }

    this.entrada.finPaso();
  }

  _dispararEnemigos(dt) {
    this.recargaEnemigos -= dt;
    if (this.recargaEnemigos > 0) return;
    if (this.taza.estado !== ESTADO.VIVO) return;

    const tirador = this.formacion.elegirTirador();
    if (tirador) {
      this.disparosEnemigos.lanzar(tirador.x, tirador.y + 12, DISPARO_ENEMIGO.VELOCIDAD);
      tirador.recarga = 1.2;
    }

    // Las primeras fases perdonan más: es lo que engancha a quien abre el
    // enlace por primera vez.
    const base = ATAQUES.INTERVALO_BASE;
    this.recargaEnemigos = this._esFaseFacil() ? base * 1.6 : base;
  }

  _resolverColisiones() {
    // --- Disparos del jugador contra enemigos ---
    for (const p of this.disparosJugador.lista) {
      if (!p.activo) continue;
      for (const e of this.formacion.enemigos) {
        if (!e.vivo) continue;
        if (!proyectilTocaCirculo(p, e.x, e.y, e.radio)) continue;

        this.disparosJugador.apagar(p);
        this.acertados++;

        if (e.recibirImpacto()) {
          this._sumarPuntos(e.def.puntos);
          this.particulas.explosionEnemigo(
            e.x, e.y, e.def.particulasExplosion, COL_ENEMIGOS[e.tipo].cuerpo
          );
          this._sacudir(EFECTOS.SACUDIDA.enemigoPequeno);
          this.congelacion = EFECTOS.HITSTOP_MS.enemigoPequeno;
        } else {
          this.particulas.impacto(p.x, p.y);
        }
        break;
      }
    }

    if (!this.taza.esVulnerable) return;

    // --- Disparos enemigos contra la taza ---
    for (const p of this.disparosEnemigos.lista) {
      if (!p.activo) continue;
      if (!proyectilTocaCirculo(p, this.taza.x, this.taza.y, CFG_JUGADOR.RADIO_COLISION)) continue;
      this.disparosEnemigos.apagar(p);
      this._matarJugador();
      return;
    }

    // --- Choque directo con un enemigo ---
    for (const e of this.formacion.enemigos) {
      if (!e.vivo) continue;
      if (circulosTocan(this.taza.x, this.taza.y, CFG_JUGADOR.RADIO_COLISION, e.x, e.y, e.radio)) {
        this._matarJugador();
        return;
      }
    }
  }

  _matarJugador() {
    this.particulas.explosionJugador(this.taza.x, this.taza.y);
    this._sacudir(EFECTOS.SACUDIDA.jugador);
    this.congelacion = EFECTOS.HITSTOP_MS.jugador;

    const finPartida = this.taza.morir();

    // Al perder una vida se limpia la amenaza: los disparos enemigos se
    // apagan. Reaparecer dentro de una lluvia de balas sería injusto.
    this.disparosEnemigos.limpiar();

    if (finPartida) {
      this.fase = FASE.FIN_PARTIDA;
      this.temporizador = 1.2;
      if (this.puntos > this.record) {
        this.record = this.puntos;
        guardarRecord(this.record);
      }
    }
  }

  _sumarPuntos(cantidad) {
    this.puntos += cantidad;
    // El récord se guarda en cuanto se supera, no al morir: así una recarga
    // accidental nunca cuesta el récord.
    if (this.puntos > this.record) {
      this.record = this.puntos;
      guardarRecord(this.record);
    }
    if (this.puntos >= this.siguienteVidaExtra) {
      this.siguienteVidaExtra += PUNTUACION.VIDA_EXTRA_CADA;
      this.taza.ganarVida();
    }
  }

  _sacudir(config) {
    this.sacudida = Math.max(this.sacudida, config.duracion);
    this.sacudidaAmplitud = config.amplitud;
  }

  /** Milisegundos que el bucle debe congelar. Se consume al leerlo. */
  tomarCongelacion() {
    const ms = this.congelacion;
    this.congelacion = 0;
    return ms;
  }

  // -------------------------------------------------------------------------
  // Dibujo
  // -------------------------------------------------------------------------

  dibujar(ctx) {
    this.estrellas.dibujar(ctx, this.tiempo);

    ctx.save();
    if (this.sacudida > 0) {
      // Dos frecuencias distintas en X e Y para que la sacudida no sea una
      // línea recta. Decae exponencialmente.
      const fuerza = this.sacudidaAmplitud * Math.exp(-6 * (0.5 - this.sacudida));
      ctx.translate(
        Math.sin(this.tiempo * 140) * fuerza,
        Math.cos(this.tiempo * 117) * fuerza * 0.6
      );
    }

    this._dibujarEnemigos(ctx);
    this._dibujarJugador(ctx);
    this.particulas.dibujar(ctx);
    this._dibujarProyectiles(ctx);

    ctx.restore();

    dibujarHud(ctx, {
      puntos: this.puntos,
      puntosMostrados: this.puntosMostrados,
      record: this.record,
      vidas: this.taza.vidas,
      fase: this.numeroFase,
    });

    this._dibujarCarteles(ctx);
  }

  _dibujarEnemigos(ctx) {
    for (const e of this.formacion.enemigos) {
      if (!e.vivo) continue;
      ctx.save();
      ctx.translate(e.x, e.y);
      dibujarGrano(ctx, e.balanceo);

      // Destello blanco al recibir un impacto que no mata: enseña dónde has
      // acertado sin necesidad de números.
      if (e.destello > 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = e.destello / 0.08 * 0.6;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, e.radio, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _dibujarJugador(ctx) {
    if (this.taza.estado === ESTADO.MURIENDO) return;

    ctx.save();
    ctx.translate(this.taza.x, this.taza.y);

    if (this.taza.invulnerable > 0) {
      // Dos canales, no uno: parpadeo Y anillo que se contrae marcando el
      // tiempo que queda. Solo con el parpadeo, el jugador no sabe cuánto
      // le falta para volver a ser vulnerable.
      ctx.globalAlpha = Math.sin(this.tiempo * 50) > 0 ? 1 : 0.35;

      const restante = this.taza.invulnerable / CFG_JUGADOR.INVULNERABILIDAD;
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = COL_JUGADOR.CIAN;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 14 + 8 * Math.min(1, restante), this.tiempo * 3, this.tiempo * 3 + Math.PI * 1.66);
      ctx.stroke();
      ctx.restore();
    }

    dibujarTaza(ctx, this.taza.retroceso, this.tiempo);
    ctx.restore();
  }

  _dibujarProyectiles(ctx) {
    for (const p of this.disparosJugador.lista) {
      if (!p.activo) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      dibujarDisparoJugador(ctx);
      ctx.restore();
    }

    // Los proyectiles enemigos son LO ÚLTIMO que se dibuja del mundo. Solo el
    // HUD va por encima. Ningún efecto puede tapar una amenaza.
    for (const p of this.disparosEnemigos.lista) {
      if (!p.activo) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      dibujarDisparoEnemigo(ctx, p.edad);
      ctx.restore();
    }
  }

  _dibujarCarteles(ctx) {
    const centro = PANTALLA.ANCHO / 2;

    if (this.fase === FASE.INTRO) {
      const alpha = Math.min(1, this.temporizador * 3, (1.3 - this.temporizador) * 4);
      dibujarTexto(ctx, 'FASE ' + this.numeroFase, centro, 300, {
        tamano: TIPOGRAFIA.TAMANOS.AVISO_FASE,
        color: HUD.VALOR_DESTACADO,
        espaciado: TIPOGRAFIA.ESPACIADOS.TITULO,
        alineacion: 'centro',
        alpha: Math.max(0, alpha),
      });
    }

    if (this.fase === FASE.OLEADA_LIMPIADA) {
      dibujarTexto(ctx, 'OLEADA ' + this.numeroFase + ' DESPEJADA', centro, 290, {
        tamano: TIPOGRAFIA.TAMANOS.OPCION_MENU,
        color: HUD.TEXTO_PRIMARIO,
        espaciado: TIPOGRAFIA.ESPACIADOS.ENCABEZADO,
        alineacion: 'centro',
      });
      // La puntería es el gancho de rejugabilidad de Galaga: cuesta tres
      // líneas medirla y da un motivo para volver a intentarlo.
      const disparados = this.taza.disparosRealizados - this.disparosAlEmpezarOleada;
      const porcentaje = disparados ? Math.round((this.acertados / disparados) * 100) : 0;
      dibujarTexto(ctx, `PUNTERÍA ${this.acertados}/${disparados} · ${porcentaje} %`, centro, 316, {
        tamano: TIPOGRAFIA.TAMANOS.ETIQUETA_HUD,
        color: HUD.ETIQUETA,
        espaciado: TIPOGRAFIA.ESPACIADOS.ETIQUETA,
        alineacion: 'centro',
      });
    }

    if (this.fase === FASE.FIN_PARTIDA) {
      ctx.fillStyle = 'rgba(5,4,11,0.6)';
      ctx.fillRect(0, 0, PANTALLA.ANCHO, PANTALLA.ALTO);

      dibujarTexto(ctx, 'FIN DE PARTIDA', centro, 270, {
        tamano: TIPOGRAFIA.TAMANOS.ENCABEZADO,
        color: HUD.TEXTO_PRIMARIO,
        espaciado: TIPOGRAFIA.ESPACIADOS.ENCABEZADO,
        alineacion: 'centro',
      });

      if (this.puntos >= this.record && this.puntos > 0) {
        dibujarTexto(ctx, '¡NUEVO RÉCORD!', centro, 300, {
          tamano: TIPOGRAFIA.TAMANOS.OPCION_MENU,
          color: HUD.RECORD_NUEVO,
          espaciado: TIPOGRAFIA.ESPACIADOS.ENCABEZADO,
          alineacion: 'centro',
          alpha: Math.sin(this.tiempo * 6) > -0.3 ? 1 : 0.2,
        });
      }

      if (this.temporizador <= 0) {
        dibujarTexto(ctx, 'PULSA PARA JUGAR OTRA VEZ', centro, 380, {
          tamano: TIPOGRAFIA.TAMANOS.OPCION_MENU,
          color: COL_JUGADOR.CIAN,
          espaciado: TIPOGRAFIA.ESPACIADOS.ENCABEZADO,
          alineacion: 'centro',
          alpha: Math.sin(this.tiempo * 4) > -0.3 ? 1 : 0.25,
        });
      }
    }
  }
}
