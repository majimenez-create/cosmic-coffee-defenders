/**
 * FORMACIÓN — El corazón del juego.
 * =================================
 *
 * 24 enemigos en 3 filas de 8. La escuadra nunca está quieta:
 *
 *   - OSCILA: se desplaza lentamente a izquierda y derecha.
 *   - RESPIRA: los enemigos se separan y se juntan del centro.
 *   - Y cada fila va ligeramente desfasada, de modo que la respiración
 *     recorre la escuadra como una ola.
 *
 * Ese desfase cuesta una línea de código y multiplica la sensación de
 * "ejército perfectamente coordinado" que pide el documento de diseño.
 *
 * Esta clase también reparte las entradas coreografiadas y decide quién sale
 * a atacar.
 */

import { FORMACION, ATAQUES, PANTALLA } from '../config/balance.js';
import { Enemigo, ESTADO_ENEMIGO } from './enemy.js';
import { ENTRADAS, PICADOS_POR_TIPO } from './pathLibrary.js';

const NOMBRES_ENTRADA = Object.keys(ENTRADAS);

export class Formacion {
  /** @param {import('./paths.js').Caminos} caminos */
  constructor(caminos) {
    this.caminos = caminos;
    this.tiempo = 0;
    this.anclaX = PANTALLA.ANCHO / 2;
    this.anclaY = FORMACION.ANCLA_Y;
    this.enemigos = [];
    this.atacantes = 0;
  }

  /**
   * @param {string[]} tipos     qué tipos aparecen en esta fase
   * @param {number} velocidad   multiplicador de dificultad del ciclo
   */
  poblar(tipos, velocidad = 1) {
    this.enemigos = [];
    this.tiempo = 0;

    for (let fila = 0; fila < FORMACION.FILAS; fila++) {
      // Las filas de arriba llevan los enemigos más valiosos, como en los
      // clásicos: obliga a decidir si subes a por ellos o limpias abajo.
      const tipo = tipos[Math.min(fila, tipos.length - 1)];
      for (let col = 0; col < FORMACION.COLUMNAS; col++) {
        const enemigo = new Enemigo(tipo, col, fila);
        enemigo.velocidad = enemigo.def.velocidad * velocidad;
        this.enemigos.push(enemigo);
      }
    }

    this._repartirEntradas();
  }

  /**
   * Los enemigos entran en grupos de 4, cada grupo por una curva distinta y
   * con medio segundo de diferencia. Nunca aparecen colocados: siempre
   * llegan volando.
   */
  _repartirEntradas() {
    const porGrupo = FORMACION.ENEMIGOS_POR_GRUPO;
    this.enemigos.forEach((enemigo, indice) => {
      const grupo = Math.floor(indice / porGrupo);
      const nombre = NOMBRES_ENTRADA[grupo % NOMBRES_ENTRADA.length];
      // El espejo alterna por grupo: la mitad entra por la izquierda y la
      // mitad por la derecha, y sigue siendo completamente predecible.
      const espejo = grupo % 2 === 1;
      const camino = this.caminos.variante(nombre, espejo);

      // Dentro del grupo van en fila india, no amontonados.
      const retraso = grupo * FORMACION.ESPERA_ENTRE_GRUPOS +
                      (indice % porGrupo) * FORMACION.ESPERA_DENTRO_DEL_GRUPO;
      enemigo.entrar(camino, retraso);
    });
  }

  get vivos() {
    return this.enemigos.filter((e) => e.vivo);
  }

  get quedanVivos() {
    for (const e of this.enemigos) if (e.vivo) return true;
    return false;
  }

  /** ¿Han terminado todos de entrar? Hasta entonces nadie ataca. */
  get entradaCompletada() {
    for (const e of this.enemigos) {
      if (!e.vivo) continue;
      if (e.estado === ESTADO_ENEMIGO.ENTRANDO || e.estado === ESTADO_ENEMIGO.ACOPLANDO) {
        return false;
      }
    }
    return true;
  }

  actualizar(dt) {
    this.tiempo += dt;

    // Vaivén: la escuadra entera se desplaza despacio de lado a lado.
    const fase = (this.tiempo / FORMACION.VAIVEN_PERIODO) * Math.PI * 2;
    this.anclaX = PANTALLA.ANCHO / 2 + Math.sin(fase) * FORMACION.VAIVEN_AMPLITUD;

    this.atacantes = 0;
    for (const e of this.enemigos) {
      if (!e.vivo) continue;
      e.actualizar(dt, this, this.tiempo, this.caminos);
      if (e.estaAtacando || e.estado === ESTADO_ENEMIGO.AVISANDO) this.atacantes++;
    }
  }

  /**
   * Dónde está AHORA MISMO la casilla (columna, fila).
   *
   * Escribe el resultado en `destino` en lugar de devolver un objeto nuevo:
   * se llama 24 veces por paso, y crear 1.440 objetos por segundo para
   * tirarlos acto seguido es exactamente lo que provoca los tirones de
   * limpieza de memoria que este juego quiere evitar.
   */
  posicionDeCasilla(columna, fila, destino) {
    // Respiración: un factor que separa y acerca los enemigos del centro,
    // desfasado por fila para que se propague como una ola.
    const faseRespiro =
      (this.tiempo / FORMACION.RESPIRACION_PERIODO) * Math.PI * 2 +
      fila * FORMACION.DESFASE_POR_FILA;
    const respiro = 1 + Math.sin(faseRespiro) * FORMACION.RESPIRACION_AMPLITUD;

    const centrado = columna - (FORMACION.COLUMNAS - 1) / 2;
    destino.x = this.anclaX + centrado * FORMACION.SEPARACION_X * respiro;
    destino.y = this.anclaY + fila * FORMACION.SEPARACION_Y;
    return destino;
  }

  // -------------------------------------------------------------------------
  // Ataques
  // -------------------------------------------------------------------------

  /**
   * Manda a atacar hasta N enemigos. Devuelve cuántos han salido.
   *
   * Reglas de juego limpio que se respetan aquí:
   *   - Nunca más de 5 atacando a la vez.
   *   - Nadie sale mientras la escuadra esté entrando.
   *   - Los avisos van escalonados: dos telegrafiados simultáneos no se
   *     leerían por separado.
   *   - Nunca sale un enemigo que esté justo encima del jugador.
   */
  lanzarAtaque(cuantos, jugadorX) {
    if (!this.entradaCompletada) return 0;

    const hueco = ATAQUES.MAXIMO_SIMULTANEOS - this.atacantes;
    if (hueco <= 0) return 0;

    const candidatos = this.enemigos.filter((e) => {
      if (!e.vivo || !e.puedeSerElegidoParaAtacar) return false;
      // Nunca aparecer directamente encima del jugador: sería un ataque
      // imposible de esquivar.
      return Math.abs(e.x - jugadorX) > ATAQUES.MARGEN_SOBRE_JUGADOR;
    });

    if (!candidatos.length) return 0;

    let salidos = 0;
    const total = Math.min(cuantos, hueco, candidatos.length);
    const telegrafiado = this.telegrafiado ?? ATAQUES.TELEGRAFIADO;

    for (let i = 0; i < total; i++) {
      const indice = Math.floor(Math.random() * candidatos.length);
      const elegido = candidatos.splice(indice, 1)[0];

      const opciones = PICADOS_POR_TIPO[elegido.tipo];
      const nombre = opciones[Math.floor(Math.random() * opciones.length)];
      // El picado se espeja hacia el lado donde está el jugador, para que el
      // ataque tenga intención sin dejar de ser un patrón fijo y aprendible.
      const espejo = jugadorX < elegido.x;
      const camino = this.caminos.variante(nombre, espejo);

      elegido.avisar(telegrafiado + i * ATAQUES.ESCALON_ENTRE_AVISOS, camino);
      salidos++;
    }

    return salidos;
  }

  /** Los que están picando y les toca soltar su disparo en este paso. */
  *tiradoresEnPicado() {
    for (const e of this.enemigos) {
      if (!e.vivo) continue;
      if (e.debeDisparar()) yield e;
    }
  }
}
