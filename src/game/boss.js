/**
 * LA GRAN TOSTADORA CÓSMICA — El jefe.
 * ====================================
 *
 * Aparece cada cinco fases. Aguanta treinta impactos, se queda en la mitad
 * superior y se desplaza de lado a lado muy despacio.
 *
 * DOS DECISIONES QUE LO DEFINEN
 *
 * 1. NO TIENE BARRA DE VIDA. El daño se ve en su propio cuerpo: se le agrieta
 *    el cristal, le saltan las placas, se le rompen los manómetros y acaba
 *    perdiendo la tolva. Hay un cambio visible cada seis impactos. La
 *    información aparece donde el jugador ya está mirando, en lugar de
 *    obligarle a apartar la vista de los proyectiles.
 *
 * 2. ES EL OBJETO MÁS LENTO DE LA PANTALLA. Los enemigos normales laten a
 *    0,45, 0,90 y 6 veces por segundo; él a 0,25. La lentitud es lo que le da
 *    peso, no el tamaño.
 *
 * SUS TRES ATAQUES tienen la misma estructura de tres tiempos:
 *   CARGA  — pasa en su cuerpo, en tonos cálidos. Dice "va a pasar algo".
 *   MARCA  — dice dónde exactamente. Es el único momento en que aparece el
 *            color de peligro antes del proyectil.
 *   DISPARO.
 * Separar carga y marca permite anticipar sin teñir la pantalla de rojo, y
 * refuerza la lección: magenta = te va a alcanzar.
 */

import { JEFE, PANTALLA, ZONA_JUGADOR } from '../config/balance.js';

export const ESTADO_JEFE = {
  ENTRANDO: 'entrando',
  ESPERANDO: 'esperando',
  CARGANDO: 'cargando',
  MARCANDO: 'marcando',
  DISPARANDO: 'disparando',
  MURIENDO: 'muriendo',
  MUERTO: 'muerto',
};

const ATAQUES = ['verticales', 'abanico', 'granos'];

export class Jefe {
  constructor() {
    this.reiniciar();
  }

  reiniciar() {
    this.vida = JEFE.VIDA;
    this.estado = ESTADO_JEFE.ENTRANDO;
    this.tiempo = 0;
    this.temporizador = JEFE.ENTRADA;
    this.x = PANTALLA.ANCHO / 2;
    this.y = -JEFE.ALTO;
    this.radio = JEFE.ANCHO * 0.42;   // generoso, pero no tanto como su ancho
    this.ataque = null;
    this.indiceAtaque = 0;
    this.carrilesSeguros = [];
    this.granosPendientes = 0;
    this.recargaGranos = 0;
    this.temblor = 0;
    this.destello = 0;
    this.piezaGolpeada = null;
    this.umbralesCruzados = 0;
  }

  get vivo() {
    return this.estado !== ESTADO_JEFE.MUERTO;
  }

  get invulnerable() {
    return this.estado === ESTADO_JEFE.ENTRANDO ||
           this.estado === ESTADO_JEFE.MURIENDO ||
           this.estado === ESTADO_JEFE.MUERTO;
  }

  /** Cuánta vida le queda, de 0 a 1. Lo usa el dibujo para el daño visible. */
  get proporcionVida() {
    return this.vida / JEFE.VIDA;
  }

  /** En qué fase de deterioro está: 0 intacto, 5 agonizando. */
  get nivelDano() {
    let nivel = 0;
    for (const umbral of JEFE.UMBRALES_DANO) {
      if (this.vida <= umbral) nivel++;
    }
    return nivel;
  }

  get agonizando() {
    return this.nivelDano >= JEFE.UMBRALES_DANO.length;
  }

  // -------------------------------------------------------------------------

  /**
   * @returns {number} milisegundos de congelación que provoca este impacto
   */
  recibirImpacto() {
    if (this.invulnerable) return 0;

    const nivelAntes = this.nivelDano;
    this.vida--;
    this.destello = 0.06;

    if (this.vida <= 0) {
      this.estado = ESTADO_JEFE.MURIENDO;
      this.temporizador = JEFE.MUERTE;
      this.tiempoMuerte = 0;
      return 0;   // la secuencia de muerte gestiona sus propias congelaciones
    }

    // Solo los golpes que cruzan un umbral se sienten. Treinta congelaciones
    // destruirían el ritmo del enfrentamiento; así los cinco momentos
    // importantes se notan y los otros veinticinco no molestan.
    if (this.nivelDano > nivelAntes) {
      this.umbralesCruzados++;
      return JEFE.HITSTOP_UMBRAL_MS;
    }
    return 0;
  }

  actualizar(dt, jugadorX) {
    this.tiempo += dt;
    this.destello = Math.max(0, this.destello - dt);

    // Desde el tercer umbral tiembla de forma permanente.
    this.temblor = this.nivelDano >= 3 ? (this.nivelDano >= 4 ? 2 : 1) : 0;

    switch (this.estado) {
      case ESTADO_JEFE.ENTRANDO:
        this._entrar(dt);
        break;

      case ESTADO_JEFE.MURIENDO:
        this.tiempoMuerte += dt;
        this.temporizador -= dt;
        // Pierde la sustentación: desciende y se inclina.
        this.y += 22 * dt;
        if (this.temporizador <= 0) this.estado = ESTADO_JEFE.MUERTO;
        break;

      case ESTADO_JEFE.MUERTO:
        break;

      default:
        this._desplazarse(dt);
        this._gestionarAtaque(dt, jugadorX);
        break;
    }
  }

  /**
   * Desciende apagado: una silueta negra que crece. Es deliberado — la
   * silueta llega antes que el detalle, y la silueta es lo que hay que
   * memorizar para reconocerlo la próxima vez.
   */
  _entrar(dt) {
    this.temporizador -= dt;
    const avance = 1 - Math.max(0, this.temporizador) / JEFE.ENTRADA;

    // Baja durante el primer tercio y luego se enciende en cascada.
    const bajada = Math.min(1, avance / 0.62);
    const suave = 1 - (1 - bajada) ** 3;   // easeOutCubic
    this.y = -JEFE.ALTO + (JEFE.Y_CENTRO + JEFE.ALTO) * suave;

    // De 0 a 1: cuánto de su maquinaria se ha encendido ya.
    this.encendido = Math.max(0, Math.min(1, (avance - 0.66) / 0.14));

    if (this.temporizador <= 0) {
      this.y = JEFE.Y_CENTRO;
      this.encendido = 1;
      this.estado = ESTADO_JEFE.ESPERANDO;
      this.temporizador = JEFE.PAUSA_MINIMA_ENTRE_ATAQUES;
    }
  }

  /** Senoidal puro, sin acelerones. En los extremos se detiene un momento. */
  _desplazarse(dt) {
    const centro = (JEFE.X_MINIMA + JEFE.X_MAXIMA) / 2;
    const amplitud = (JEFE.X_MAXIMA - JEFE.X_MINIMA) / 2;
    const fase = (this.tiempo / JEFE.PERIODO_DESPLAZAMIENTO) * Math.PI * 2;
    this.x = centro + Math.sin(fase) * amplitud;
    this.y = JEFE.Y_CENTRO;
  }

  _gestionarAtaque(dt, jugadorX) {
    this.temporizador -= dt;

    switch (this.estado) {
      case ESTADO_JEFE.ESPERANDO:
        // Pausa obligatoria SIN un solo píxel magenta en pantalla. Ese
        // silencio visual es lo que hace legible el siguiente aviso.
        if (this.temporizador <= 0) this._empezarCarga(jugadorX);
        break;

      case ESTADO_JEFE.CARGANDO:
        if (this.temporizador <= 0) {
          this.estado = ESTADO_JEFE.MARCANDO;
          this.temporizador = this._config().marcaEn;
        }
        break;

      case ESTADO_JEFE.MARCANDO:
        if (this.temporizador <= 0) {
          this.estado = ESTADO_JEFE.DISPARANDO;
          this.temporizador = this._config().duracion;
          this.disparoLanzado = false;
        }
        break;

      case ESTADO_JEFE.DISPARANDO:
        if (this.ataque === 'granos') this.recargaGranos -= dt;
        if (this.temporizador <= 0) {
          this.estado = ESTADO_JEFE.ESPERANDO;
          this.temporizador = this._config().recarga + JEFE.PAUSA_MINIMA_ENTRE_ATAQUES;
          this.ataque = null;
        }
        break;
    }
  }

  _empezarCarga(jugadorX) {
    // Los ataques se turnan en orden fijo. Es un patrón, no una tirada de
    // dados: así se puede aprender y anticipar.
    this.ataque = ATAQUES[this.indiceAtaque % ATAQUES.length];
    this.indiceAtaque++;

    this.estado = ESTADO_JEFE.CARGANDO;
    const config = this._config();
    // En la agonía solo se acorta el aviso; la cadencia NO sube. Nada de
    // picos de dificultad injustos por estar a punto de ganar.
    const factor = this.agonizando ? 1 - JEFE.REDUCCION_TELEGRAFIADO_AGONIA : 1;
    this.temporizador = (config.telegrafiado - config.marcaEn) * factor;

    if (this.ataque === 'granos') {
      this._elegirCarrilesSeguros(jugadorX);
      this.recargaGranos = 0;
    }
  }

  /**
   * Los dos carriles seguros nunca están a más de dos carriles del jugador.
   * A 230 px/s, cruzar dos carriles son 520 ms, y el aviso dura 1200: margen
   * de más del doble. Así el ataque es siempre esquivable sin correr.
   */
  _elegirCarrilesSeguros(jugadorX) {
    const suyo = Math.floor(jugadorX / JEFE.ANCHO_CARRIL);
    const cercanos = [];
    for (let c = 0; c < JEFE.CARRILES; c++) {
      if (Math.abs(c - suyo) <= JEFE.DISTANCIA_MAXIMA_A_CARRIL_SEGURO) cercanos.push(c);
    }

    this.carrilesSeguros = [];
    // El primero es el del propio jugador, o el más cercano posible.
    const primero = cercanos.includes(suyo) ? suyo : cercanos[0];
    this.carrilesSeguros.push(primero);

    const resto = cercanos.filter((c) => c !== primero);
    if (resto.length) {
      this.carrilesSeguros.push(resto[Math.floor(Math.random() * resto.length)]);
    }
  }

  _config() {
    return JEFE.ATAQUES[this.ataque ?? 'verticales'];
  }

  // -------------------------------------------------------------------------
  // Consultas para quien dibuja y para quien lanza los proyectiles
  // -------------------------------------------------------------------------

  /** Posiciones de las bocas de los dos cañones, en coordenadas de pantalla. */
  bocasDeCanon() {
    return [
      { x: this.x - JEFE.ANCHO * 0.41, y: this.y + JEFE.ALTO * 0.37 },
      { x: this.x + JEFE.ANCHO * 0.41, y: this.y + JEFE.ALTO * 0.37 },
    ];
  }

  /** El centro de la mirilla, de donde sale el abanico. */
  mirilla() {
    return { x: this.x, y: this.y + JEFE.ALTO * 0.09 };
  }

  get carrilesPeligrosos() {
    const todos = [];
    for (let c = 0; c < JEFE.CARRILES; c++) {
      if (!this.carrilesSeguros.includes(c)) todos.push(c);
    }
    return todos;
  }

  /**
   * ¿Toca soltar proyectiles en este paso? Devuelve la lista de disparos que
   * hay que crear, o null.
   */
  disparosDeEstePaso(dt) {
    if (this.estado !== ESTADO_JEFE.DISPARANDO) return null;

    if (this.ataque === 'verticales') {
      if (this.disparoLanzado) return null;
      this.disparoLanzado = true;
      return this.bocasDeCanon().map((b) => ({ x: b.x, y: b.y, vx: 0 }));
    }

    if (this.ataque === 'abanico') {
      if (this.disparoLanzado) return null;
      this.disparoLanzado = true;
      const origen = this.mirilla();
      const velocidad = JEFE.ATAQUES.abanico.velocidadProyectil;
      return JEFE.ATAQUES.abanico.angulos.map((grados) => {
        const rad = (grados * Math.PI) / 180;
        return {
          x: origen.x, y: origen.y,
          vx: Math.sin(rad) * velocidad,
          factorVy: Math.cos(rad),
        };
      });
    }

    if (this.ataque === 'granos') {
      if (this.recargaGranos > 0) return null;
      this.recargaGranos = 1 / JEFE.GRANOS_POR_SEGUNDO_Y_CARRIL;
      // Un grano por carril peligroso, cayendo desde la tolva.
      return this.carrilesPeligrosos.map((carril) => ({
        x: carril * JEFE.ANCHO_CARRIL + JEFE.ANCHO_CARRIL / 2,
        y: this.y + JEFE.ALTO * 0.2,
        vx: 0,
      }));
    }

    return null;
  }

  /** Dónde está el suelo donde se pintan las marcas de los carriles. */
  static get alturaMarcas() {
    return ZONA_JUGADOR.Y - 100;
  }
}
