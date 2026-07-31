/**
 * ENEMIGO — Una unidad de la escuadra.
 * ====================================
 *
 * Detalle importante: un enemigo NO guarda su posición en pantalla. Guarda su
 * CASILLA (fila 2, columna 5). La posición se le pregunta a la formación.
 *
 * Gracias a eso, la escuadra puede moverse y respirar sin que nadie se
 * desalinee, y cuando un enemigo vuelve de atacar aterriza exacto en su hueco
 * aunque la formación se haya desplazado mientras estaba fuera. Es lo que
 * impide que la formación se tuerza con el tiempo.
 *
 * LOS CINCO ESTADOS
 *   ENTRANDO    recorre su curva de entrada al empezar la fase
 *   ACOPLANDO   último tramo: persigue su casilla hasta encajar
 *   EN_FORMACION  su posición ES la de su casilla, no integra nada
 *   AVISANDO    telegrafía que va a atacar (destellos y descenso)
 *   PICANDO     recorre su curva de ataque
 *   REENTRANDO  vuelve a aparecer por arriba tras salir por abajo
 *   ENFURECIDO  ya no vuelve a formación: encadena ataques hasta morir
 */

import { ENEMIGOS, FORMACION, ATAQUES, TIEMPOS, PANTALLA } from '../config/balance.js';

export const ESTADO_ENEMIGO = {
  ENTRANDO: 'entrando',
  ACOPLANDO: 'acoplando',
  EN_FORMACION: 'formacion',
  AVISANDO: 'avisando',
  PICANDO: 'picando',
  REENTRANDO: 'reentrando',
  ENFURECIDO: 'enfurecido',
};

/** Objeto de trabajo reutilizado: evita crear basura en cada paso. */
const punto = { x: 0, y: 0, angulo: 0 };

export class Enemigo {
  /**
   * @param {'grano'|'avispa'|'cafetera'} tipo
   */
  constructor(tipo, columna, fila) {
    this.tipo = tipo;
    this.def = ENEMIGOS[tipo];
    this.columna = columna;
    this.fila = fila;

    this.vida = this.def.vida;
    this.vivo = true;
    this.estado = ESTADO_ENEMIGO.EN_FORMACION;

    this.x = 0;
    this.y = 0;
    this.radio = this.def.radio;
    this.angulo = 0;          // hacia dónde mira al trazar una curva
    this.balanceo = 0;

    // La velocidad de esta fase, ya con la dificultad del ciclo aplicada. Es
    // la referencia para cualquier cambio posterior, para que los cambios no
    // se vayan acumulando unos sobre otros.
    this.velocidadBase = this.def.velocidad;

    // Cada unidad anima con un desfase propio para que la escuadra respire
    // en ola diagonal en lugar de moverse como un bloque.
    this.desfase =
      columna * this.def.animacion.desfasePorColumna +
      fila * FORMACION.DESFASE_POR_FILA;

    this.destello = 0;        // parpadeo blanco al recibir un impacto
    this.recarga = Math.random() * ATAQUES.RECARGA_INICIAL_MAXIMA;
    this.disparosHechos = 0;

    // Recorrido de curvas.
    this.camino = null;
    this.distancia = 0;
    this.velocidad = this.def.velocidad;
    this.origenX = 0;         // desde dónde se aplica un picado
    this.origenY = 0;
    this.aviso = 0;
    this.acople = 0;
    this.acopleDesdeX = 0;
    this.acopleDesdeY = 0;
  }

  // -------------------------------------------------------------------------
  // Transiciones
  // -------------------------------------------------------------------------

  /** Empieza su entrada coreografiada al comenzar la fase. */
  entrar(camino, retraso = 0) {
    this.estado = ESTADO_ENEMIGO.ENTRANDO;
    this.camino = camino;
    this.distancia = -retraso * this.velocidad; // espera su turno fuera
    camino.posicionEn(0, punto);
    this.x = punto.x;
    this.y = punto.y;
  }

  /** Telegrafía el ataque antes de lanzarse: nada mata sin avisar. */
  avisar(duracion, camino) {
    this.estado = ESTADO_ENEMIGO.AVISANDO;
    this.aviso = duracion;
    this.avisoTotal = duracion;
    this.caminoPicado = camino;
  }

  _empezarPicado() {
    this.estado = ESTADO_ENEMIGO.PICANDO;
    this.camino = this.caminoPicado;
    this.distancia = 0;
    // El picado se aplica como desplazamiento desde donde está AHORA, porque
    // la formación se mueve y el hueco de salida nunca es el mismo.
    this.origenX = this.x;
    this.origenY = this.y;
    this.disparosHechos = 0;
  }

  _empezarReentrada(camino) {
    this.estado = ESTADO_ENEMIGO.REENTRANDO;
    this.camino = camino;
    this.distancia = 0;
  }

  _empezarAcople() {
    this.estado = ESTADO_ENEMIGO.ACOPLANDO;
    this.acople = 0;
    this.acopleDesdeX = this.x;
    this.acopleDesdeY = this.y;
  }

  enfurecer() {
    this.estado = ESTADO_ENEMIGO.ENFURECIDO;
    // Se parte de la velocidad BASE de esta fase, no de la actual.
    //
    // Partir de la actual parecía lo correcto (conserva el multiplicador de
    // dificultad del ciclo), pero `enfurecer()` se llama al terminar CADA
    // ataque, así que la velocidad se multiplicaba una y otra vez: tras unas
    // vueltas los dos últimos enemigos iban tan rápido que no se les podía
    // alcanzar y la oleada no terminaba nunca.
    this.velocidad = this.velocidadBase * FORMACION.MULTIPLICADOR_VELOCIDAD_ENFURECIDOS;
  }

  get estaEnFormacion() {
    return this.estado === ESTADO_ENEMIGO.EN_FORMACION;
  }

  get estaAtacando() {
    return this.estado === ESTADO_ENEMIGO.PICANDO ||
           this.estado === ESTADO_ENEMIGO.ENFURECIDO;
  }

  get puedeSerElegidoParaAtacar() {
    return this.estado === ESTADO_ENEMIGO.EN_FORMACION;
  }

  /** @returns {boolean} true si ha muerto con este impacto */
  recibirImpacto() {
    this.vida--;
    this.destello = TIEMPOS.DESTELLO_IMPACTO;
    if (this.vida <= 0) {
      this.vivo = false;
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // Paso de simulación
  // -------------------------------------------------------------------------

  /**
   * @param {import('./formation.js').Formacion} formacion
   * @param {object} caminos  el catálogo, para pedir la reentrada
   */
  actualizar(dt, formacion, tiempo, caminos) {
    if (!this.vivo) return;

    this.destello = Math.max(0, this.destello - dt);
    this.recarga = Math.max(0, this.recarga - dt);

    switch (this.estado) {
      case ESTADO_ENEMIGO.ENTRANDO:
        this._recorrer(dt, false);
        if (this.distancia >= this.camino.final) this._empezarAcople();
        break;

      case ESTADO_ENEMIGO.REENTRANDO:
        this._recorrer(dt, false);
        if (this.distancia >= this.camino.final) this._empezarAcople();
        break;

      case ESTADO_ENEMIGO.ACOPLANDO:
        this._acoplar(dt, formacion);
        break;

      case ESTADO_ENEMIGO.EN_FORMACION:
        // Su posición ES la de su casilla. No integra nada, así que es
        // imposible que acumule desviación con el tiempo.
        formacion.posicionDeCasilla(this.columna, this.fila, this);
        this.angulo = 0;
        break;

      case ESTADO_ENEMIGO.AVISANDO:
        formacion.posicionDeCasilla(this.columna, this.fila, this);
        // Se descuelga un poco, como tomando impulso. Junto al destello, son
        // los dos canales que anuncian el ataque.
        this.y += (1 - this.aviso / this.avisoTotal) * ATAQUES.DESCENSO_AVISO;
        this.aviso -= dt;
        if (this.aviso <= 0) this._empezarPicado();
        break;

      case ESTADO_ENEMIGO.PICANDO:
      case ESTADO_ENEMIGO.ENFURECIDO:
        this._recorrer(dt, true);
        if (this.distancia >= this.camino.final) this._terminarPicado(formacion, caminos);
        break;
    }

    this._animarEnReposo(tiempo);
  }

  _recorrer(dt, relativo) {
    this.distancia += this.velocidad * dt;
    if (this.distancia < 0) return; // aún esperando su turno de entrada

    this.camino.posicionEn(this.distancia, punto);
    if (relativo) {
      this.x = this.origenX + punto.x;
      this.y = this.origenY + punto.y;
    } else {
      this.x = punto.x;
      this.y = punto.y;
    }
    // El ángulo se mide desde "mirando hacia abajo", que es la orientación
    // natural de un enemigo que baja.
    this.angulo = punto.angulo - Math.PI / 2;
  }

  /**
   * El último tramo NO es una curva fija. El hueco se mueve mientras el
   * enemigo vuelve, así que un camino predefinido lo dejaría desalineado.
   * En su lugar persigue su casilla, consultada en cada paso, con una
   * suavización que hace que el aterrizaje no dé un salto.
   */
  _acoplar(dt, formacion) {
    this.acople = Math.min(1, this.acople + dt / FORMACION.DURACION_ACOPLE);

    formacion.posicionDeCasilla(this.columna, this.fila, punto);
    const suave = 1 - (1 - this.acople) * (1 - this.acople); // easeOutQuad

    this.x = this.acopleDesdeX + (punto.x - this.acopleDesdeX) * suave;
    this.y = this.acopleDesdeY + (punto.y - this.acopleDesdeY) * suave;
    this.angulo = (1 - suave) * this.angulo;

    if (this.acople >= 1) {
      this.estado = ESTADO_ENEMIGO.EN_FORMACION;
      this.angulo = 0;
    }
  }

  _terminarPicado(formacion, caminos) {
    // Si quedan muy pocos compañeros, ya no vuelve: se queda atacando hasta
    // que lo destruyan. Lo pide el documento de diseño y evita el anticlímax
    // de perseguir a dos enemigos que se esconden arriba.
    if (formacion.cuantosVivos <= FORMACION.UMBRAL_ENFURECIDOS) {
      this.enfurecer();
      this.distancia = 0;
      this.origenX = this.x;
      this.origenY = -PANTALLA.ALTO * 0.1; // reaparece por arriba
      this.y = this.origenY;
      return;
    }

    this._empezarReentrada(caminos.obtener('reentrada_suave'));
  }

  _animarEnReposo(tiempo) {
    const anim = this.def.animacion;
    if (anim.tipo === 'rotacion' && this.estaEnFormacion) {
      const amplitud = (anim.amplitudGrados * Math.PI) / 180;
      this.balanceo = Math.sin(tiempo * anim.hz * Math.PI * 2 + this.desfase) * amplitud;
    } else if (anim.tipo === 'deformacion') {
      const [a, b] = anim.escalaAlas;
      const onda = 0.5 + 0.5 * Math.sin(tiempo * anim.hz * Math.PI * 2 + this.desfase);
      this.escalaAlas = b + (a - b) * onda;
      this.balanceo = 0;
    } else if (anim.tipo === 'traslacion' && this.estaEnFormacion) {
      this.y += Math.sin(tiempo * anim.hz * Math.PI * 2 + this.desfase) * anim.amplitudPx;
      this.balanceo = 0;
    }
  }

  /** ¿Le toca disparar durante este ataque? */
  debeDisparar() {
    if (!this.def.dispara) return false;
    if (!this.estaAtacando) return false;
    if (this.disparosHechos >= this.def.disparosPorAtaque) return false;
    // Dispara pasado un tramo del recorrido, no al salir: si disparara justo
    // al arrancar, el proyectil nacería demasiado arriba para verlo venir.
    const avance = this.distancia / this.camino.final;
    if (avance < ATAQUES.AVANCE_MINIMO_PARA_DISPARAR) return false;
    this.disparosHechos++;
    return true;
  }
}
