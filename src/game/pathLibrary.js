/**
 * CATÁLOGO DE TRAYECTORIAS
 * ========================
 *
 * Cada camino es una lista de puntos de control en coordenadas de 0 a 1:
 * (0,0) es la esquina superior izquierda y (1,1) la inferior derecha.
 *
 * Los puntos van de cuatro en cuatro: el primero es por dónde empieza, los dos
 * de en medio "tiran" de la curva hacia un lado, y el cuarto es dónde acaba.
 * Si se añaden tres más, se encadena otro tramo — así se dibujan bucles y
 * ochos completos.
 *
 * Todos los caminos empiezan FUERA de la pantalla: los enemigos nunca aparecen
 * de la nada, siempre entran.
 */

// ---------------------------------------------------------------------------
// ENTRADAS — cómo llega cada grupo al empezar la fase
// ---------------------------------------------------------------------------

export const ENTRADAS = {
  /** Sube por la izquierda, cruza en arco y baja hacia el centro. */
  arco_izquierda: [
    [-0.15, 0.30],
    [0.10, 0.05], [0.40, 0.02], [0.55, 0.18],
    [0.70, 0.34], [0.55, 0.45], [0.50, 0.30],
  ],

  /** Entra por arriba en zigzag suave. Es la más legible de todas. */
  zigzag_superior: [
    [0.20, -0.12],
    [0.20, 0.10], [0.70, 0.10], [0.70, 0.24],
    [0.70, 0.38], [0.30, 0.34], [0.50, 0.28],
  ],

  /**
   * Bucle completo por abajo antes de subir a la formación. Es la entrada
   * más espectacular y la que más se parece al original.
   */
  bucle_inferior: [
    [-0.10, 0.55],
    [0.25, 0.62], [0.45, 0.78], [0.55, 0.62],
    [0.65, 0.46], [0.35, 0.42], [0.40, 0.30],
    [0.44, 0.20], [0.50, 0.24], [0.50, 0.28],
  ],

  /** Cae en diagonal desde una esquina, cruzando toda la pantalla. */
  diagonal_larga: [
    [-0.12, -0.08],
    [0.30, 0.20], [0.80, 0.30], [0.85, 0.48],
    [0.88, 0.62], [0.55, 0.44], [0.50, 0.28],
  ],
};

// ---------------------------------------------------------------------------
// PICADOS — cómo ataca cada enemigo al salir de la formación
// ---------------------------------------------------------------------------

/**
 * Los picados se aplican como DESPLAZAMIENTO relativo desde el hueco del
 * enemigo, no como posiciones absolutas: la formación se está moviendo, así
 * que el ataque tiene que empezar donde esté el enemigo en ese momento.
 *
 * Por eso todos empiezan en (0,0) y las coordenadas son diferencias.
 */
export const PICADOS = {
  /** El más simple: se descuelga y baja en una curva suave. */
  descuelgue: [
    [0, 0],
    [0.02, 0.10], [0.10, 0.30], [0.06, 0.50],
    [0.02, 0.70], [-0.06, 0.85], [-0.04, 1.05],
  ],

  /** Baja abriéndose hacia un lado: obliga a moverse, no solo a esquivar. */
  barrido_lateral: [
    [0, 0],
    [0.14, 0.12], [0.30, 0.28], [0.26, 0.46],
    [0.22, 0.64], [-0.10, 0.72], [-0.20, 1.00],
  ],

  /**
   * Rizo cerrado a media altura y luego caída. Es el picado que más cuesta
   * aprenderse, y el que más satisfacción da cuando lo esquivas.
   */
  rizo: [
    [0, 0],
    [0.10, 0.14], [0.24, 0.24], [0.16, 0.36],
    [0.08, 0.48], [-0.10, 0.38], [-0.04, 0.30],
    [0.02, 0.24], [0.06, 0.60], [0.02, 1.02],
  ],

  /** Caída casi vertical, muy rápida. Poco aviso, poca curva. */
  clavado: [
    [0, 0],
    [0.01, 0.24], [-0.02, 0.52], [0.00, 0.76],
    [0.01, 0.90], [-0.01, 0.98], [0.00, 1.06],
  ],
};

// ---------------------------------------------------------------------------
// REGRESO — cómo vuelve a la formación tras atacar
// ---------------------------------------------------------------------------

/**
 * Tras salir por abajo, el enemigo reaparece por arriba, igual que en la
 * recreativa original. Este camino lo baja hasta la altura de la formación;
 * el último tramo, el acoplamiento exacto en su hueco, no es un camino fijo:
 * persigue la casilla, que se está moviendo. Ver enemy.js.
 */
export const REENTRADAS = {
  reentrada_suave: [
    [0.50, -0.10],
    [0.50, 0.02], [0.30, 0.10], [0.40, 0.20],
  ],
};

/** Todo junto, que es lo que necesita el medidor de trayectorias. */
export const TODOS = { ...ENTRADAS, ...PICADOS, ...REENTRADAS };

/** Qué picados usa cada tipo de enemigo. */
export const PICADOS_POR_TIPO = {
  // El básico ataca de la forma más sencilla y previsible.
  grano: ['descuelgue', 'clavado'],
  // La avispa hace las trayectorias raras: es su carácter.
  avispa: ['barrido_lateral', 'rizo'],
  // La cafetera es lenta y pesada: cae casi recta, pero aguanta dos impactos.
  cafetera: ['descuelgue', 'barrido_lateral'],
};
