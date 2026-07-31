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
  PANTALLA, DISPARO, DISPARO_ENEMIGO, ATAQUES, PUNTUACION, PROGRESION,
  CICLO_FASES, JUGADOR as CFG_JUGADOR, EFECTOS, TIEMPOS, CARTELES, FORMACION,
  BONUS, JEFE, ALTO_CONTRASTE,
} from '../config/balance.js';
import {
  HUD, FONDO, JUGADOR as COL_JUGADOR, ENEMIGOS as COL_ENEMIGOS, TIPOGRAFIA,
  DISPARO_JUGADOR as COL_DISPARO, PELIGRO as COL_PELIGRO, JEFE as COL_JEFE,
} from '../config/palette.js';

import { Taza, ESTADO } from '../game/player.js';
import { Proyectiles } from '../game/bullets.js';
import { Formacion } from '../game/formation.js';
import { FaseBonus } from '../game/bonus.js';
import { Jefe, ESTADO_JEFE } from '../game/boss.js';
import { dibujarJefe, dibujarTelegrafiadoJefe } from '../render/bossShape.js';
import { Particulas } from '../game/particles.js';
import { proyectilTocaCirculo, circulosTocan } from '../game/collision.js';
import { Caminos } from '../game/paths.js';
import { TODOS as CAMINOS_TODOS, PICADOS } from '../game/pathLibrary.js';
import { ESTADO_ENEMIGO } from '../game/enemy.js';

import { Fondo } from '../render/background.js';
import { Resplandor } from '../render/glow.js';
import {
  dibujarTaza, dibujarGrano, dibujarAvispa, dibujarCafetera,
  dibujarDisparoJugador, dibujarDisparoEnemigo,
} from '../render/shapes.js';
import { dibujarHud } from '../render/hud.js';
import { dibujarTexto, dibujarTextoAjustado } from '../render/text.js';
import { leerRecord, guardarRecord } from '../services/scoreStore.js';

const FASE = {
  INTRO: 'intro',
  COMBATE: 'combate',
  OLEADA_LIMPIADA: 'limpiada',
  BONUS_AVISO: 'bonusAviso',
  BONUS: 'bonus',
  BONUS_RESULTADO: 'bonusResultado',
  JEFE_AVISO: 'jefeAviso',
  JEFE: 'jefe',
  PAUSA: 'pausa',
  REANUDANDO: 'reanudando',
  FIN_PARTIDA: 'fin',
};

/**
 * Cómo se dibuja cada tipo. La salvaguarda está en que si algún día se añade
 * un tipo al balance sin su dibujo, aquí no encontrará su función y se verá
 * enseguida, en lugar de aparecer disfrazado de otro enemigo con vida y
 * tamaño distintos.
 */
const DIBUJOS = {
  grano: (ctx, e) => dibujarGrano(ctx, e.balanceo),
  avispa: (ctx, e) => dibujarAvispa(ctx, e.escalaAlas ?? 1),
  cafetera: (ctx, e, tiempo) => dibujarCafetera(ctx, tiempo, e.vida < e.def.vida),
};
const TIPOS_DIBUJABLES = Object.keys(DIBUJOS);

export class Partida {
  /**
   * @param {import('../core/input.js').Entrada} entrada
   * @param {import('../core/audio.js').Audio} audio
   * @param {import('../render/background.js').Fondo} fondo
   * @param {import('../render/glow.js').Resplandor} resplandor
   */
  constructor(entrada, audio, fondo, resplandor, ajustes) {
    this.entrada = entrada;
    this.audio = audio;
    this.ajustes = ajustes;
    // El fondo y los halos se comparten con la portada: son caros de preparar
    // y no tiene sentido tener dos copias.
    this.fondo = fondo;
    this.resplandor = resplandor;
    this.particulas = new Particulas();
    this.disparosJugador = new Proyectiles(DISPARO.MAXIMO_EN_PANTALLA, false);
    this.disparosEnemigos = new Proyectiles(DISPARO_ENEMIGO.MAXIMO_EN_PANTALLA, true);

    // Las trayectorias se miden una sola vez al arrancar. A partir de aquí,
    // recorrerlas es gratis.
    this.caminos = new Caminos(CAMINOS_TODOS, new Set(Object.keys(PICADOS)));
    this.formacion = new Formacion(this.caminos);
    this.bonus = new FaseBonus(this.caminos);
    this.jefe = new Jefe();
    this.taza = new Taza(this.disparosJugador, ajustes);

    this.record = leerRecord();
    // Reservados de antemano, como las partículas: nada de crear objetos a
    // mitad de partida.
    this.puntosFlotantes = Array.from({ length: 6 }, () => ({
      x: 0, y: 0, cantidad: 0, vida: 0,
    }));
    this.sacudida = 0;
    this.sacudidaDuracion = 1;
    this.sacudidaAmplitud = 0;
    this.congelacion = 0;
    this.tiempo = 0;
  }

  /** Se llama cada vez que el gestor de escenas entra en la partida. */
  entrar() {
    this.record = leerRecord();
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

    // Se recuerda el récord con el que se ENTRA a la partida. Si no, como el
    // récord se actualiza en cuanto se supera, al final siempre parecería que
    // has hecho récord aunque hayas quedado muy por debajo.
    this.recordAlEmpezar = this.record;
    this.recordAvisado = false;

    this.audio.arrancarMusica();
    this._entrarEnFase();
  }

  _entrarEnFase() {
    const plantilla = CICLO_FASES[(this.numeroFase - 1) % CICLO_FASES.length];
    const pedidos = plantilla.enemigos ?? ['grano', 'avispa', 'cafetera'];
    const tipos = pedidos.filter((t) => TIPOS_DIBUJABLES.includes(t));

    // Cada vuelta al ciclo de 5 fases sube la dificultad un poco, con un
    // tope: la fase 40 debe ser dura, no imposible.
    const ciclo = Math.floor((this.numeroFase - 1) / CICLO_FASES.length);
    this.multiplicadorVelocidad = Math.min(
      PROGRESION.MULTIPLICADOR_VELOCIDAD_MAXIMO,
      PROGRESION.VELOCIDAD_ENEMIGOS_POR_CICLO ** ciclo
    );
    this.multiplicadorFrecuencia = Math.min(
      PROGRESION.MULTIPLICADOR_FRECUENCIA_MAXIMO,
      PROGRESION.FRECUENCIA_ATAQUES_POR_CICLO ** ciclo
    );

    this.tipoDeFase = plantilla.tipo;
    this.disparosJugador.limpiar();
    this.disparosEnemigos.limpiar();

    // La puntería se mide por oleada, no por partida: así el dato del cartel
    // habla de lo que el jugador acaba de hacer.
    this.disparosAlEmpezarOleada = this.taza.disparosRealizados;
    this.acertados = 0;

    if (plantilla.tipo === 'bonus') {
      this.bonus.empezar(TIPOS_DIBUJABLES, this.multiplicadorVelocidad);
      this.formacion.enemigos = [];
      this.fase = FASE.BONUS_AVISO;
      this.temporizador = BONUS.AVISO_INICIAL;
      return;
    }

    if (plantilla.tipo === 'jefe') {
      this.jefe.reiniciar();
      this.formacion.enemigos = [];
      this.fase = FASE.JEFE;
      return;
    }

    this.formacion.poblar(tipos.length ? tipos : ['grano'], this.multiplicadorVelocidad);

    // Las primeras fases avisan más tiempo antes de cada ataque, y con eso
    // basta para que cualquiera aprenda a leer los picados.
    // La alta legibilidad no solo cambia colores: también da más tiempo, porque
    // quien la activa suele necesitar las dos cosas.
    const margen = this.ajustes.get('altoContraste')
      ? ALTO_CONTRASTE.MULTIPLICADOR_TELEGRAFIADO
      : 1;
    this.formacion.telegrafiado = (this._esFaseFacil()
      ? ATAQUES.TELEGRAFIADO_PRIMERAS_FASES
      : ATAQUES.TELEGRAFIADO) * margen;

    this.fase = FASE.INTRO;
    this.temporizador = TIEMPOS.INTRO_FASE;
    this.recargaAtaque = this._esFaseFacil()
      ? ATAQUES.ESPERA_PRIMER_ATAQUE_FACIL
      : ATAQUES.ESPERA_PRIMER_ATAQUE;
  }

  _esFaseFacil() {
    return this.numeroFase <= PROGRESION.FASES_FACILES;
  }

  // -------------------------------------------------------------------------
  // Pausa
  // -------------------------------------------------------------------------

  /** Se llama cuando el jugador cambia de pestaña o de aplicación. */
  perderFoco() {
    this.pausar();
  }

  pausar() {
    if (this.fase === FASE.PAUSA || this.fase === FASE.FIN_PARTIDA) return;
    this.faseAntesDePausar = this.fase;
    this.temporizadorAntesDePausar = this.temporizador;
    this.fase = FASE.PAUSA;
    this.entrada.limpiar();
    this.audio.pausar();
  }

  /** Nunca se vuelve de golpe: primero la cuenta atrás 3 · 2 · 1. */
  reanudar() {
    this.fase = FASE.REANUDANDO;
    this.cuentaAtras = TIEMPOS.CUENTA_ATRAS_PAUSA * 3;
    this.audio.reanudar();
  }

  // -------------------------------------------------------------------------
  // Lógica
  // -------------------------------------------------------------------------

  /**
   * Lo único que sigue avanzando durante la congelación de impacto. Si se
   * congelara también la explosión, el golpe parecería una caída de
   * fotogramas en vez de un impacto.
   */
  actualizarEfectos(dt) {
    this.tiempo += dt;
    this.particulas.actualizar(dt);
    this.sacudida = Math.max(0, this.sacudida - dt);
  }

  actualizar(dt) {
    this.tiempo += dt;
    this.entrada.actualizar();

    // Silenciar está disponible en cualquier momento, incluso en pausa.
    if (this.entrada.silenciarPulsado) {
      this.silenciado = this.audio.alternarSilencio();
      this.avisoSilencio = TIEMPOS.AVISO_SILENCIO;
    }
    if (this.avisoSilencio > 0) this.avisoSilencio -= dt;

    this.fondo.actualizar(dt);
    this.particulas.actualizar(dt);
    this.sacudida = Math.max(0, this.sacudida - dt);
    for (const p of this.puntosFlotantes) {
      if (p.vida > 0) p.vida -= dt;
    }

    // El marcador cuenta hacia el valor real en lugar de saltar de golpe.
    if (this.puntosMostrados < this.puntos) {
      this.puntosMostrados = Math.min(
        this.puntos,
        this.puntosMostrados + PUNTUACION.VELOCIDAD_CONTADOR * dt
      );
    }

    switch (this.fase) {
      case FASE.PAUSA:
        if (this.entrada.confirmarPulsado || this.entrada.pausaPulsada) this.reanudar();
        this.entrada.finPaso();
        return;

      case FASE.REANUDANDO:
        this.cuentaAtras -= dt;
        if (this.cuentaAtras <= 0) {
          this.fase = this.faseAntesDePausar;
          this.temporizador = this.temporizadorAntesDePausar;
        }
        this.entrada.finPaso();
        return;

      case FASE.FIN_PARTIDA:
        this.temporizador -= dt;
        // Volver a la portada es una alternativa, nunca una obligación: la vía
        // rápida sigue siendo reintentar con una sola pulsación.
        if (this.entrada.pausaPulsada) {
          this.entrada.finPaso();
          this.ir('portada');
          return;
        }
        // El bloqueo inicial existe para que quien esté machacando el disparo
        // no se salte su propia puntuación sin verla. Pasado ese margen, la
        // pulsación se atiende aunque se hubiera hecho antes: nunca se come
        // una pulsación.
        if (this.entrada.confirmarPulsado) this.confirmacionPendiente = true;
        if (this.temporizador <= 0 && this.confirmacionPendiente) {
          this.confirmacionPendiente = false;
          this.empezar();
        }
        this.entrada.finPaso();
        return;

      case FASE.INTRO:
        this.temporizador -= dt;
        // Durante la intro el jugador YA tiene el control y la escuadra ya
        // está en pantalla. Nunca hay un fotograma de pantalla vacía.
        if (this.temporizador <= 0) this.fase = FASE.COMBATE;
        break;

      case FASE.OLEADA_LIMPIADA:
        this.temporizador -= dt;
        if (this.temporizador <= 0) {
          this.numeroFase++;
          this._entrarEnFase();
        }
        break;

      // --- Fase de bonificación ---
      case FASE.BONUS_AVISO:
        this.temporizador -= dt;
        if (this.temporizador <= 0) this.fase = FASE.BONUS;
        break;

      case FASE.BONUS:
        this.bonus.actualizar(dt);
        this.taza.actualizar(dt, this.entrada, this.tiempo);
        this.disparosJugador.actualizar(dt);
        this._colisionesBonus();
        if (this.bonus.terminada) {
          this._sumarPuntos(this.bonus.puntos);
          this.audio[this.bonus.perfecta ? 'nuevoRecord' : 'oleadaDespejada']();
          this.fase = FASE.BONUS_RESULTADO;
          this.temporizador = BONUS.RESULTADO;
        }
        this.entrada.finPaso();
        return;

      case FASE.BONUS_RESULTADO:
        this.temporizador -= dt;
        this.disparosJugador.actualizar(dt);
        if (this.temporizador <= 0) {
          this.numeroFase++;
          this._entrarEnFase();
        }
        this.entrada.finPaso();
        return;

      // --- El jefe ---
      case FASE.JEFE:
        this._actualizarJefe(dt);
        this.entrada.finPaso();
        return;
    }

    if (this.entrada.pausaPulsada) {
      this.pausar();
      this.entrada.finPaso();
      return;
    }

    this.formacion.actualizar(dt);

    const disparosAntes = this.taza.disparosRealizados;
    const invulnerableAntes = this.taza.invulnerable;
    this.taza.actualizar(dt, this.entrada, this.tiempo);
    if (this.taza.disparosRealizados > disparosAntes) this.audio.disparo();
    // Al acabarse la invulnerabilidad suena un aviso: nunca se vuelve a ser
    // mortal en silencio.
    if (invulnerableAntes > 0 && this.taza.invulnerable <= 0) {
      this.audio.finInvulnerabilidad();
    }

    this.disparosJugador.actualizar(dt);
    this.disparosEnemigos.actualizar(dt);

    // El zumbido de la escuadra aprieta conforme quedan menos enemigos: el
    // propio ritmo te dice cuánto te falta sin mirar la pantalla.
    const vivos = this.formacion.vivos.length;
    const tension = 1 - vivos / FORMACION.TOTAL;
    this.audio.actualizarMusica(dt, Math.max(0, Math.min(1, tension)));

    if (this.fase === FASE.COMBATE) this._ordenarAtaques(dt);
    this._dispararDesdePicados();
    this._resolverColisiones();

    if (this.fase === FASE.COMBATE && !this.formacion.quedanVivos) {
      this.fase = FASE.OLEADA_LIMPIADA;
      this.temporizador = TIEMPOS.FIN_OLEADA;
      this.audio.oleadaDespejada();
    }

    this.entrada.finPaso();
  }

  /**
   * Manda salir a atacar. Es lo que convierte una rejilla de dianas en un
   * juego: la escuadra quieta no mata a nadie.
   */
  _ordenarAtaques(dt) {
    if (this.taza.estado !== ESTADO.VIVO) return;

    this.recargaAtaque -= dt;
    if (this.recargaAtaque > 0) return;

    const salidos = this.formacion.lanzarAtaque(
      ATAQUES.ATACANTES_POR_TANDA, this.taza.x,
      // Cada tipo avisa con un sonido distinto: un jugador experto tiene que
      // poder esquivar de oído sin mirar arriba.
      (tipo) => this.audio.aviso(tipo)
    );

    let espera = ATAQUES.INTERVALO_BASE / this.multiplicadorFrecuencia;
    if (this._esFaseFacil()) espera /= PROGRESION.MULTIPLICADOR_FASES_FACILES;
    // Si no ha podido salir nadie (por el tope de atacantes o porque todos
    // están sobre el jugador), se reintenta pronto en lugar de perder la tanda.
    this.recargaAtaque = salidos ? espera : ATAQUES.ESCALON_ENTRE_AVISOS * 4;
  }

  /** Los enemigos en picado sueltan su disparo a mitad del recorrido. */
  _dispararDesdePicados() {
    for (const e of this.formacion.tiradoresEnPicado()) {
      const salio = this.disparosEnemigos.lanzar(
        e.x,
        e.y + DISPARO_ENEMIGO.DESPLAZAMIENTO_ORIGEN,
        DISPARO_ENEMIGO.VELOCIDAD * this.multiplicadorVelocidad
      );
      if (salio) this.audio.disparoEnemigo();
    }
  }

  /** El enfrentamiento con la Gran Tostadora Cósmica. */
  _actualizarJefe(dt) {
    this.jefe.actualizar(dt, this.taza.x);

    // Durante su entrada en escena el jugador conserva el control y es
    // invulnerable: es un acontecimiento, no una trampa.
    if (this.jefe.estado === ESTADO_JEFE.ENTRANDO) {
      this.taza.invulnerable = Math.max(this.taza.invulnerable, 0.2);
    }

    this.taza.actualizar(dt, this.entrada, this.tiempo);
    this.disparosJugador.actualizar(dt);
    this.disparosEnemigos.actualizar(dt);

    // Proyectiles del jefe.
    const salidas = this.jefe.disparosDeEstePaso(dt);
    if (salidas) {
      const config = JEFE.ATAQUES[this.jefe.ataque];
      for (const s of salidas) {
        const vy = config.velocidadProyectil * (s.factorVy ?? 1) * this.multiplicadorVelocidad;
        if (this.disparosEnemigos.lanzar(s.x, s.y, vy, s.vx ?? 0)) {
          this.audio.disparoEnemigo();
        }
      }
    }

    this._colisionesJefe();

    if (this.jefe.estado === ESTADO_JEFE.MUERTO) {
      this._sumarPuntos(JEFE.PUNTOS);
      this.fase = FASE.OLEADA_LIMPIADA;
      this.temporizador = TIEMPOS.FIN_OLEADA;
      this.audio.oleadaDespejada();
    }
  }

  _colisionesJefe() {
    // --- Tus disparos contra el jefe ---
    for (const p of this.disparosJugador.lista) {
      if (!p.activo || this.jefe.invulnerable) continue;
      if (!proyectilTocaCirculo(p, this.jefe.x, this.jefe.y, this.jefe.radio)) continue;

      this.disparosJugador.apagar(p);
      this.acertados++;

      const congelacion = this.jefe.recibirImpacto();
      // El destello es LOCAL, en el punto de impacto: enseña dónde estás
      // acertando, en lugar de iluminar la máquina entera.
      this.particulas.impacto(p.x, p.y);
      this.audio.impacto();

      if (congelacion > 0) {
        // Al cruzar un umbral, sí se siente: se le rompe algo.
        this.congelacion = congelacion;
        this._sacudir(EFECTOS.SACUDIDA.enemigoGrande);
        this.particulas.explosionEnemigo(p.x, p.y, 20, COL_JEFE.LATON_BRILLO);
        this.audio.explosionGrande();
      }

      if (this.jefe.estado === ESTADO_JEFE.MURIENDO) {
        this.particulas.explosionEnemigo(this.jefe.x, this.jefe.y, 60, COL_JEFE.LATON_BRILLO);
        this._sacudir(EFECTOS.SACUDIDA.jefe);
        this.congelacion = EFECTOS.HITSTOP_MS.jefe;
        this.audio.explosionGrande();
        // Nunca se puede morir después de haber matado al jefe: todos sus
        // proyectiles se apagan.
        this.disparosEnemigos.apagarTodos(null);
      }
      break;
    }

    if (!this.taza.esVulnerable) return;

    // --- Sus proyectiles contra la taza ---
    for (const p of this.disparosEnemigos.lista) {
      if (!p.activo) continue;
      if (!proyectilTocaCirculo(p, this.taza.x, this.taza.y, CFG_JUGADOR.RADIO_COLISION)) continue;
      this._matarJugador(p);
      return;
    }
  }

  /**
   * En la fase bonus solo hay una comprobación: tus disparos contra los
   * objetivos. Nada puede tocar a la taza, y eso es intencionado.
   */
  _colisionesBonus() {
    for (const p of this.disparosJugador.lista) {
      if (!p.activo) continue;
      for (const o of this.bonus.alcanzables) {
        if (!proyectilTocaCirculo(p, o.x, o.y, o.radio)) continue;

        this.disparosJugador.apagar(p);
        this.acertados++;
        o.recibirImpacto();
        this.bonus.abatidos++;

        this._mostrarPuntos(o.x, o.y, BONUS.PUNTOS_POR_OBJETIVO);
        this.particulas.explosionEnemigo(
          o.x, o.y, o.def.particulasExplosion, COL_ENEMIGOS[o.tipo].cuerpo
        );
        this.audio.explosionPequena();
        this._sacudir(EFECTOS.SACUDIDA.enemigoPequeno);
        break;
      }
    }
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
          // [BIBLIA] destruir un enemigo mientras ataca concede el doble.
          // Es lo que premia arriesgarse en vez de limpiar la formación quieta.
          const enPicado = e.estaAtacando;
          const puntos = e.def.puntos * (enPicado ? PUNTUACION.MULTIPLICADOR_EN_PICADO : 1);
          this._sumarPuntos(puntos);
          if (enPicado) this._mostrarPuntos(e.x, e.y, puntos);

          const categoria = e.def.categoriaImpacto;
          if (categoria === 'enemigoGrande') this.audio.explosionGrande();
          else this.audio.explosionPequena();
          this.particulas.explosionEnemigo(
            e.x, e.y, e.def.particulasExplosion, COL_ENEMIGOS[e.tipo].cuerpo
          );
          // Cada categoría tiene su propio peso: matar a la unidad de 400
          // puntos no puede sentirse igual que matar a la de 100.
          this._sacudir(EFECTOS.SACUDIDA[categoria]);
          this.congelacion = EFECTOS.HITSTOP_MS[categoria];
        } else {
          this.particulas.impacto(p.x, p.y);
          this.audio.impacto();
        }
        break;
      }
    }

    if (!this.taza.esVulnerable) return;

    // --- Disparos enemigos contra la taza ---
    for (const p of this.disparosEnemigos.lista) {
      if (!p.activo) continue;
      if (!proyectilTocaCirculo(p, this.taza.x, this.taza.y, CFG_JUGADOR.RADIO_COLISION)) continue;
      this._matarJugador(p);
      return;
    }

    // --- Choque directo con un enemigo ---
    for (const e of this.formacion.enemigos) {
      if (!e.vivo) continue;
      if (circulosTocan(this.taza.x, this.taza.y, CFG_JUGADOR.RADIO_COLISION, e.x, e.y, e.radio)) {
        this._matarJugador(null);
        return;
      }
    }
  }

  /**
   * @param {object|null} culpable  el proyectil que ha matado, si lo hubo
   */
  _matarJugador(culpable) {
    this.particulas.explosionJugador(this.taza.x, this.taza.y);
    this.audio.muerteJugador();
    this._sacudir(EFECTOS.SACUDIDA.jugador);
    this.congelacion = EFECTOS.HITSTOP_MS.jugador;

    const finPartida = this.taza.morir();

    // Toda muerte deja rastro: lo que te ha matado se queda quieto y visible
    // un momento, para que puedas ver qué ha sido. Convierte un "no sé qué ha
    // pasado" en un "vale, ha sido ese".
    this.disparosEnemigos.apagarTodos(culpable);

    if (finPartida) {
      this.fase = FASE.FIN_PARTIDA;
      this.temporizador = TIEMPOS.BLOQUEO_FIN_PARTIDA;
      this.confirmacionPendiente = false;
      this.audio.pararMusica();
      setTimeout(() => this.audio.finPartida(), 700);
      if (this.puntos > this.recordAlEmpezar) {
        setTimeout(() => this.audio.nuevoRecord(), 1600);
      }
    }
  }

  /**
   * Los puntos flotantes solo aparecen cuando aportan información: al abatir
   * un enemigo en picado, que vale el doble. Ponerlos en cada muerte sería
   * ruido en el 80 % de los casos.
   */
  _mostrarPuntos(x, y, cantidad) {
    const libre = this.puntosFlotantes.find((p) => p.vida <= 0);
    if (!libre) return;
    libre.x = x;
    libre.y = y;
    libre.cantidad = cantidad;
    libre.vida = TIEMPOS.PUNTOS_FLOTANTES;
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
      if (this.taza.ganarVida()) this.audio.vidaExtra();
    }
    // El récord se celebra en el momento de superarlo, una sola vez.
    if (!this.recordAvisado && this.puntos > this.recordAlEmpezar && this.recordAlEmpezar > 0) {
      this.recordAvisado = true;
      this.audio.nuevoRecord();
    }
  }

  _sacudir(config) {
    // El jugador puede desactivar el temblor por completo, y no pierde ninguna
    // información al hacerlo: todo lo que la sacudida comunica está también en
    // la explosión y en el sonido.
    if (!this.ajustes.get('sacudidaPantalla')) return;

    // Se guarda también la duración total: sin ella, una sacudida corta
    // empezaría ya casi apagada y no se vería.
    if (config.amplitud >= this.sacudidaAmplitud || this.sacudida <= 0) {
      this.sacudidaAmplitud = config.amplitud;
      this.sacudidaDuracion = config.duracion;
      this.sacudida = config.duracion;
    }
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
    this.fondo.dibujar(ctx);

    ctx.save();
    if (this.sacudida > 0) {
      const avance = 1 - this.sacudida / this.sacudidaDuracion;
      const fuerza = this.sacudidaAmplitud * Math.exp(-EFECTOS.SACUDIDA_DECAIMIENTO * avance);
      ctx.translate(
        Math.sin(this.tiempo * EFECTOS.SACUDIDA_FRECUENCIA_X) * fuerza,
        Math.cos(this.tiempo * EFECTOS.SACUDIDA_FRECUENCIA_Y) * fuerza * EFECTOS.SACUDIDA_PROPORCION_Y
      );
    }

    // El telegrafiado va DEBAJO de todo lo demás: avisa, pero nunca tapa.
    if (this.fase === FASE.JEFE) dibujarTelegrafiadoJefe(ctx, this.jefe, this.tiempo);

    this._dibujarEnemigos(ctx);
    this._dibujarObjetivosBonus(ctx);
    this._dibujarJefe(ctx);
    this._dibujarJugador(ctx);
    this.particulas.dibujar(ctx);
    this._dibujarPuntosFlotantes(ctx);
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

      // Halo tenue del color del enemigo. Muy suave: la escuadra tiene que
      // leerse por su forma, no brillar tanto que se convierta en manchas.
      this.resplandor.halo(ctx, e.x, e.y, e.radio * 1.6, COL_ENEMIGOS[e.tipo].cuerpo, 0.35);

      ctx.save();
      ctx.translate(e.x, e.y);

      // Al trazar una curva, el enemigo gira siguiendo la trayectoria. Sin
      // esto se desliza de lado como una pegatina y las curvas pierden toda
      // su gracia.
      if (e.angulo) ctx.rotate(e.angulo);

      DIBUJOS[e.tipo](ctx, e, this.tiempo);

      // Telegrafiado: dos destellos blancos mientras avisa. Junto con el
      // pequeño descenso, son los dos canales que anuncian el ataque.
      if (e.estado === ESTADO_ENEMIGO.AVISANDO) {
        const avance = 1 - e.aviso / e.avisoTotal;
        const parpadeo = Math.sin(avance * Math.PI * 6) > 0.2;
        if (parpadeo) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = COL_JUGADOR.PORCELANA_ESPECULAR;
          ctx.beginPath();
          ctx.arc(0, 0, e.radio, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Destello blanco al recibir un impacto que no mata: enseña dónde has
      // acertado sin necesidad de números.
      if (e.destello > 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (e.destello / TIEMPOS.DESTELLO_IMPACTO) * 0.6;
        ctx.fillStyle = COL_JUGADOR.PORCELANA_ESPECULAR;
        ctx.beginPath();
        ctx.arc(0, 0, e.radio, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _dibujarJefe(ctx) {
    if (this.fase !== FASE.JEFE || !this.jefe.vivo) return;
    const jefe = this.jefe;

    ctx.save();
    // Su temblor propio, que aparece cuando está malherido.
    const tx = jefe.temblor ? (Math.random() - 0.5) * jefe.temblor * 2 : 0;
    const ty = jefe.temblor ? (Math.random() - 0.5) * jefe.temblor * 2 : 0;
    ctx.translate(jefe.x + tx, jefe.y + ty);

    // Al perder la sustentación se inclina.
    if (jefe.estado === ESTADO_JEFE.MURIENDO) {
      ctx.rotate(Math.min(0.1, jefe.tiempoMuerte * 0.06));
    }

    dibujarJefe(ctx, jefe, this.tiempo, jefe.encendido ?? 1);

    // Destello local al recibir un impacto.
    if (jefe.destello > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (jefe.destello / 0.06) * 0.25;
      ctx.fillStyle = COL_JUGADOR.PORCELANA_ESPECULAR;
      ctx.fillRect(-JEFE.ANCHO / 2, -JEFE.ALTO / 2, JEFE.ANCHO, JEFE.ALTO);
    }
    ctx.restore();
  }

  _dibujarObjetivosBonus(ctx) {
    if (this.fase !== FASE.BONUS && this.fase !== FASE.BONUS_RESULTADO) return;

    for (const o of this.bonus.objetivos) {
      if (!o.alcanzable) continue;
      this.resplandor.halo(ctx, o.x, o.y, o.radio * 1.7, COL_ENEMIGOS[o.tipo].cuerpo, 0.4);
      ctx.save();
      ctx.translate(o.x, o.y);
      if (o.angulo) ctx.rotate(o.angulo);
      DIBUJOS[o.tipo](ctx, o, this.tiempo);
      ctx.restore();
    }
  }

  _dibujarPuntosFlotantes(ctx, dt) {
    for (const p of this.puntosFlotantes) {
      if (p.vida <= 0) continue;
      const avance = 1 - p.vida / TIEMPOS.PUNTOS_FLOTANTES;
      dibujarTexto(ctx, '+' + p.cantidad, p.x, p.y - avance * 18, {
        tamano: TIPOGRAFIA.TAMANOS.PUNTOS_FLOTANTES,
        color: HUD.VALOR_DESTACADO,
        espaciado: TIPOGRAFIA.ESPACIADOS.VALOR,
        alineacion: 'centro',
        alpha: 1 - avance,
      });
    }
  }

  _dibujarJugador(ctx) {
    if (this.taza.estado === ESTADO.MURIENDO) return;

    // La taza siempre brilla, en cualquier nivel de calidad: es el objeto que
    // el jugador tiene que encontrar de un vistazo en todo momento.
    const parpadeo = this.taza.invulnerable > 0 ? 0.5 : 1;
    this.resplandor.halo(ctx, this.taza.x, this.taza.y, 22, COL_JUGADOR.CIAN, 0.45 * parpadeo);

    ctx.save();
    ctx.translate(this.taza.x, this.taza.y);

    if (this.taza.invulnerable > 0) {
      // Dos canales, no uno: parpadeo Y anillo que se contrae marcando el
      // tiempo que queda. Solo con el parpadeo, el jugador no sabe cuánto le
      // falta para volver a ser vulnerable.
      // Con "reducir destellos" el parpadeo baja de 8 a 2,5 veces por segundo,
      // por debajo del umbral de seguridad fotosensible. No se pierde
      // información: el anillo sigue marcando el tiempo restante.
      const hz = this.ajustes.get('reducirDestellos')
        ? ALTO_CONTRASTE.FRECUENCIA_PARPADEO_MAXIMA * 0.83
        : CFG_JUGADOR.PARPADEO_INVULNERABLE;
      ctx.globalAlpha = Math.sin(this.tiempo * hz * Math.PI * 2) > 0 ? 1 : 0.35;

      const anillo = CFG_JUGADOR.ANILLO_INVULNERABLE;
      const restante = Math.min(1, this.taza.invulnerable / CFG_JUGADOR.INVULNERABILIDAD);
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = COL_JUGADOR.CIAN;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(
        0, 0,
        anillo.radioBase + anillo.radioExtra * restante,
        this.tiempo * anillo.giro,
        this.tiempo * anillo.giro + Math.PI * anillo.hueco
      );
      ctx.stroke();
      ctx.restore();
    }

    dibujarTaza(ctx, this.taza.retroceso, this.tiempo);
    ctx.restore();
  }

  _dibujarProyectiles(ctx) {
    for (const p of this.disparosJugador.lista) {
      if (!p.activo) continue;
      this.resplandor.halo(ctx, p.x, p.y, 13, COL_DISPARO.HALO, 0.9);
      ctx.save();
      ctx.translate(p.x, p.y);
      dibujarDisparoJugador(ctx);
      ctx.restore();
    }

    // Los proyectiles enemigos son LO ÚLTIMO que se dibuja del mundo. Solo el
    // HUD va por encima. Ningún efecto puede tapar una amenaza.
    for (const p of this.disparosEnemigos.lista) {
      if (!p.activo) continue;
      // El halo del proyectil enemigo nunca baja de este tamaño, en ningún
      // nivel de calidad: es lo que puede matarte y tiene que verse siempre.
      const legible = this.ajustes.get('altoContraste');
      this.resplandor.halo(ctx, p.x, p.y, legible ? 14 : 11, COL_PELIGRO.PROYECTIL, p.opacidad);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = p.opacidad;
      // En alta legibilidad el proyectil crece y gana un anillo blanco. Se
      // pierde algo de elegancia y se gana claridad: es decisión del jugador.
      if (legible) ctx.scale(1.35, 1.35);
      dibujarDisparoEnemigo(ctx, p.edad, p.culpable, legible);
      ctx.restore();
    }
  }

  /** ¿Hay alguna amenaza cerca de un cartel? Si la hay, el cartel se aparta. */
  _alphaCartel(y) {
    let alpha = 1;
    for (const p of this.disparosEnemigos.lista) {
      if (!p.activo) continue;
      if (Math.abs(p.y - y) < CARTELES.DISTANCIA_ATENUACION) {
        alpha = CARTELES.ALPHA_ATENUADO;
        break;
      }
    }
    return alpha;
  }

  _dibujarCarteles(ctx) {
    const centro = PANTALLA.ANCHO / 2;

    if (this.avisoSilencio > 0) {
      dibujarTexto(ctx, this.silenciado ? 'SONIDO OFF' : 'SONIDO ON',
        centro, CARTELES.Y_AVISO_SILENCIO, {
          tamano: TIPOGRAFIA.TAMANOS.ETIQUETA_HUD,
          color: HUD.ETIQUETA,
          espaciado: TIPOGRAFIA.ESPACIADOS.ETIQUETA,
          alineacion: 'centro',
          alpha: Math.min(1, this.avisoSilencio * 3),
        });
    }

    if (this.fase === FASE.INTRO) {
      const entrada = (TIEMPOS.INTRO_FASE - this.temporizador) * 4;
      const alpha = Math.max(0, Math.min(1, this.temporizador * 3, entrada));
      dibujarTexto(ctx, 'FASE ' + this.numeroFase, centro, CARTELES.Y_PRINCIPAL, {
        tamano: TIPOGRAFIA.TAMANOS.AVISO_FASE,
        color: HUD.VALOR_DESTACADO,
        espaciado: TIPOGRAFIA.ESPACIADOS.TITULO,
        alineacion: 'centro',
        alpha: alpha * this._alphaCartel(CARTELES.Y_PRINCIPAL),
      });
    }

    if (this.fase === FASE.OLEADA_LIMPIADA) {
      const alpha = this._alphaCartel(CARTELES.Y_PRINCIPAL);
      dibujarTexto(ctx, 'OLEADA ' + this.numeroFase + ' DESPEJADA', centro, CARTELES.Y_PRINCIPAL, {
        tamano: TIPOGRAFIA.TAMANOS.OPCION_MENU,
        color: HUD.TEXTO_PRIMARIO,
        espaciado: TIPOGRAFIA.ESPACIADOS.ENCABEZADO,
        alineacion: 'centro',
        alpha,
      });
      // La puntería es el gancho de rejugabilidad de Galaga: cuesta tres
      // líneas medirla y da un motivo para volver a intentarlo.
      const disparados = this.taza.disparosRealizados - this.disparosAlEmpezarOleada;
      const porcentaje = disparados ? Math.round((this.acertados / disparados) * 100) : 0;
      dibujarTexto(ctx, `PUNTERÍA ${this.acertados}/${disparados} · ${porcentaje} %`,
        centro, CARTELES.Y_SECUNDARIO, {
          tamano: TIPOGRAFIA.TAMANOS.ETIQUETA_HUD,
          color: HUD.ETIQUETA,
          espaciado: TIPOGRAFIA.ESPACIADOS.ETIQUETA,
          alineacion: 'centro',
          alpha,
        });
    }

    // --- El jefe: su entrada es un acontecimiento ---
    if (this.fase === FASE.JEFE && this.jefe.estado === ESTADO_JEFE.ENTRANDO) {
      const avance = 1 - this.jefe.temporizador / JEFE.ENTRADA;
      if (avance > 0.16) {
        const parpadeo = Math.sin(this.tiempo * 19) > -0.3;
        dibujarTexto(ctx, '¡ALERTA!', centro, 240, {
          tamano: TIPOGRAFIA.TAMANOS.ENCABEZADO,
          color: COL_PELIGRO.PROYECTIL,
          espaciado: TIPOGRAFIA.ESPACIADOS.ENCABEZADO,
          alineacion: 'centro',
          alpha: parpadeo ? 1 : 0.25,
        });
        // Se dibuja letra a letra: el nombre se va revelando.
        const nombre = JEFE.NOMBRE.toUpperCase();
        const reveladas = Math.min(nombre.length, Math.floor((avance - 0.16) * nombre.length * 3));
        dibujarTextoAjustado(ctx, nombre.slice(0, reveladas), centro, 272,
          PANTALLA.ANCHO - 30, {
            tamano: TIPOGRAFIA.TAMANOS.OPCION_MENU,
            color: HUD.VALOR_DESTACADO,
            espaciado: TIPOGRAFIA.ESPACIADOS.ETIQUETA,
            alineacion: 'centro',
          });
      }
    }

    // --- Fase de bonificación ---
    if (this.fase === FASE.BONUS_AVISO) {
      dibujarTexto(ctx, 'FASE ESPECIAL', centro, CARTELES.Y_PRINCIPAL, {
        tamano: TIPOGRAFIA.TAMANOS.AVISO_FASE,
        color: HUD.VALOR_DESTACADO,
        espaciado: TIPOGRAFIA.ESPACIADOS.TITULO,
        alineacion: 'centro',
      });
      // Decirlo explícitamente es lo que hace que el jugador se relaje y
      // disfrute la coreografía, en lugar de jugarla a la defensiva.
      dibujarTexto(ctx, 'NO PUEDEN DISPARARTE', centro, CARTELES.Y_PRINCIPAL + 28, {
        tamano: TIPOGRAFIA.TAMANOS.OPCION_MENU,
        color: COL_JUGADOR.CIAN,
        espaciado: TIPOGRAFIA.ESPACIADOS.ENCABEZADO,
        alineacion: 'centro',
      });
    }

    if (this.fase === FASE.BONUS) {
      // Contador de aciertos arriba: es el único dato que importa aquí.
      dibujarTexto(ctx, `${this.bonus.abatidos} / ${BONUS.OBJETIVOS}`, centro, 62, {
        tamano: TIPOGRAFIA.TAMANOS.VALOR_HUD,
        color: HUD.TEXTO_PRIMARIO,
        espaciado: TIPOGRAFIA.ESPACIADOS.VALOR,
        alineacion: 'centro',
      });
    }

    if (this.fase === FASE.BONUS_RESULTADO) {
      const perfecta = this.bonus.perfecta;
      dibujarTexto(ctx, perfecta ? '¡PERFECTO!' : 'FASE ESPECIAL', centro, CARTELES.Y_PRINCIPAL, {
        tamano: TIPOGRAFIA.TAMANOS.ENCABEZADO,
        color: perfecta ? HUD.RECORD_NUEVO : HUD.TEXTO_PRIMARIO,
        espaciado: TIPOGRAFIA.ESPACIADOS.ENCABEZADO,
        alineacion: 'centro',
      });
      dibujarTexto(ctx,
        `${this.bonus.abatidos} / ${BONUS.OBJETIVOS}  ·  +${this.bonus.puntos}`,
        centro, CARTELES.Y_PRINCIPAL + 26, {
          tamano: TIPOGRAFIA.TAMANOS.OPCION_MENU,
          color: HUD.VALOR_DESTACADO,
          espaciado: TIPOGRAFIA.ESPACIADOS.ENCABEZADO,
          alineacion: 'centro',
        });
    }

    if (this.fase === FASE.PAUSA) {
      ctx.fillStyle = FONDO.VELO_PANTALLA;
      ctx.fillRect(0, 0, PANTALLA.ANCHO, PANTALLA.ALTO);
      dibujarTexto(ctx, 'PAUSA', centro, CARTELES.Y_TITULO, {
        tamano: TIPOGRAFIA.TAMANOS.ENCABEZADO,
        color: HUD.TEXTO_PRIMARIO,
        espaciado: TIPOGRAFIA.ESPACIADOS.ENCABEZADO,
        alineacion: 'centro',
      });
      dibujarTexto(ctx, 'PULSA PARA CONTINUAR', centro, CARTELES.Y_LLAMADA, {
        tamano: TIPOGRAFIA.TAMANOS.OPCION_MENU,
        color: COL_JUGADOR.CIAN,
        espaciado: TIPOGRAFIA.ESPACIADOS.ENCABEZADO,
        alineacion: 'centro',
        alpha: Math.sin(this.tiempo * 4) > -0.3 ? 1 : 0.25,
      });
    }

    if (this.fase === FASE.REANUDANDO) {
      // La acción ya se ve, pero congelada. Nunca se reanuda de golpe.
      const numero = Math.ceil(this.cuentaAtras / TIEMPOS.CUENTA_ATRAS_PAUSA);
      dibujarTexto(ctx, String(numero), centro, CARTELES.Y_PRINCIPAL, {
        tamano: TIPOGRAFIA.TAMANOS.TITULO,
        color: HUD.VALOR_DESTACADO,
        alineacion: 'centro',
      });
    }

    if (this.fase === FASE.FIN_PARTIDA) {
      ctx.fillStyle = FONDO.VELO_PANTALLA;
      ctx.fillRect(0, 0, PANTALLA.ANCHO, PANTALLA.ALTO);

      dibujarTexto(ctx, 'FIN DE PARTIDA', centro, CARTELES.Y_TITULO, {
        tamano: TIPOGRAFIA.TAMANOS.ENCABEZADO,
        color: HUD.TEXTO_PRIMARIO,
        espaciado: TIPOGRAFIA.ESPACIADOS.ENCABEZADO,
        alineacion: 'centro',
      });

      // Se compara contra el récord con el que se ENTRÓ a la partida.
      if (this.puntos > this.recordAlEmpezar) {
        dibujarTexto(ctx, '¡NUEVO RÉCORD!', centro, CARTELES.Y_PRINCIPAL, {
          tamano: TIPOGRAFIA.TAMANOS.OPCION_MENU,
          color: HUD.RECORD_NUEVO,
          espaciado: TIPOGRAFIA.ESPACIADOS.ENCABEZADO,
          alineacion: 'centro',
          alpha: Math.sin(this.tiempo * 6) > -0.3 ? 1 : 0.2,
        });
      }

      if (this.temporizador <= 0) {
        dibujarTexto(ctx, 'PULSA PARA JUGAR OTRA VEZ', centro, CARTELES.Y_LLAMADA, {
          tamano: TIPOGRAFIA.TAMANOS.OPCION_MENU,
          color: COL_JUGADOR.CIAN,
          espaciado: TIPOGRAFIA.ESPACIADOS.ENCABEZADO,
          alineacion: 'centro',
          alpha: Math.sin(this.tiempo * 4) > -0.3 ? 1 : 0.25,
        });
        dibujarTexto(ctx, 'P · VOLVER AL INICIO', centro, CARTELES.Y_LLAMADA + 30, {
          tamano: TIPOGRAFIA.TAMANOS.ETIQUETA_HUD,
          color: HUD.ETIQUETA,
          espaciado: TIPOGRAFIA.ESPACIADOS.ETIQUETA,
          alineacion: 'centro',
        });
      }
    }
  }
}
