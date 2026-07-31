/**
 * BALANCE — Todos los números que definen cómo se juega.
 * =====================================================
 *
 * Este es EL archivo para ajustar el juego. Si algo va muy rápido, muy lento,
 * es muy difícil o vale pocos puntos, se cambia aquí y en ningún otro sitio.
 *
 * REGLA DURA DEL PROYECTO: ningún número mágico fuera de este archivo y de
 * palette.js. Si aparece un 0.85 suelto en la lógica del juego, es un error.
 * (Lo exige la GAME_BIBLE, sección 19.)
 *
 * UNIDADES
 *   - Distancias en píxeles del lienzo lógico de 360 x 640.
 *   - Velocidades en píxeles por segundo.
 *   - Tiempos en segundos, salvo los que llevan _MS en el nombre.
 *
 * Los valores marcados con [BIBLIA] vienen literalmente del documento de
 * diseño. No se cambian sin decidirlo expresamente.
 */

// ---------------------------------------------------------------------------
// PANTALLA
// ---------------------------------------------------------------------------

export const PANTALLA = {
  ANCHO: 360,              // [BIBLIA] resolución lógica
  ALTO: 640,               // [BIBLIA] resolución lógica
  FPS_LOGICOS: 60,         // [BIBLIA] objetivo de 60 FPS
  ESCALA_MAXIMA: 3,        // tope de ampliación en monitores grandes
  DPR_MAXIMO: 2,           // más de 2 dispara el coste en móvil sin ganancia visible
  PASOS_MAXIMOS_POR_FRAME: 5, // evita el "salto" al volver de otra pestaña
};

// El jugador nunca sale del tercio inferior.
export const ZONA_JUGADOR = {
  Y: 572,                  // altura fija de la taza
  MARGEN_IZQUIERDO: 16,
  MARGEN_DERECHO: 344,
};

// Franjas reservadas al HUD. La acción ocurre entre medias.
export const HUD_LAYOUT = {
  BANDA_SUPERIOR: 40,
  BANDA_INFERIOR: 40,
};

// ---------------------------------------------------------------------------
// JUGADOR
// ---------------------------------------------------------------------------

export const JUGADOR = {
  VIDAS_INICIALES: 3,          // [BIBLIA]
  VIDAS_MAXIMAS: 5,            // [BIBLIA]
  VELOCIDAD: 230,              // [BIBLIA] px/s, sin aceleración ni inercia
  IMPACTOS_QUE_AGUANTA: 1,     // [BIBLIA] un toque y mueres
  INVULNERABILIDAD: 1.5,       // [BIBLIA] segundos tras reaparecer
  RADIO_COLISION: 9,
  ANCHO: 30,
  ALTO: 34,

  // Secuencia de muerte y reaparición (decidido con el equipo de UX).
  // La congelación al morir está en EFECTOS.HITSTOP_MS.jugador.
  ESPERA_REAPARICION: 0.9,     // desde la explosión hasta que vuelve la taza
  ENTRADA_REAPARICION: 0.3,    // lo que tarda en subir desde abajo
  GRACIA_TRAS_INVULNERABILIDAD: 0.3, // margen antes de reanudar ataques
  X_REAPARICION: 180,          // siempre en el centro: previsible

  ALTURA_BOCA: 14,             // desde dónde salen los disparos
  RECUPERACION_RETROCESO: 11,  // cuánto de rápido vuelve tras el culatazo
  PARPADEO_INVULNERABLE: 8,    // Hz. Baja a 2,5 con "reducir destellos"
  ANILLO_INVULNERABLE: { radioBase: 14, radioExtra: 8, giro: 3, hueco: 1.66 },
};

// ---------------------------------------------------------------------------
// DISPARO DEL JUGADOR
// ---------------------------------------------------------------------------

export const DISPARO = {
  VELOCIDAD: 520,              // [BIBLIA] px/s
  CADENCIA: 0.22,              // [BIBLIA] un disparo cada 0,22 s
  MAXIMO_EN_PANTALLA: 2,       // [BIBLIA] la regla que define el juego entero
  DANO: 1,                     // [BIBLIA]
  ANCHO: 3,
  ALTO: 12,
  RADIO_COLISION: 3,
  BUFER_MS: 120,               // si pulsas justo antes de poder disparar, no se pierde
  SEPARACION_DOBLE: 26,        // separación del disparo doble (ampliación futura)
};

// Modos de disparo. El jugador elige en Ajustes; los tres tienen la misma
// cadencia máxima, así que ninguno da ventaja y todos valen para el ranking.
export const MODO_DISPARO = {
  MANTENIDO: 'mantenido',      // por defecto en teclado y mando
  PULSADO: 'pulsado',          // para nostálgicos
  AUTOMATICO: 'automatico',    // por defecto en táctil, y opción de accesibilidad
};

// ---------------------------------------------------------------------------
// ENEMIGOS
// ---------------------------------------------------------------------------

/**
 * Los tres tipos de la biblia. El "Guardian" con rayo tractor del documento
 * antiguo NO entra en la versión 1; su hueco está previsto pero vacío.
 */
/**
 * Cada enemigo se distingue por TRES canales, no solo por el color:
 *   - Proporción: el grano y la avispa son más anchos que altos; la cafetera
 *     es la única más alta que ancha.
 *   - Tipo de movimiento: uno rota, otro se deforma, otro se traslada. Son
 *     tres canales físicamente distintos, y el ojo los separa aunque
 *     coincidan en velocidad.
 *   - Tempo: 0,90 / 6,0 / 0,45 Hz. Cada uno es al menos el doble del anterior,
 *     que es el mínimo para que se perciban como distintos.
 * Si algún día entra un cuarto enemigo, tendrá que inventar un cuarto tipo de
 * movimiento, no reutilizar uno de estos.
 */
export const ENEMIGOS = {
  grano: {
    nombre: 'Grano explorador',   // [BIBLIA]
    vida: 1,                      // [BIBLIA]
    puntos: 100,                  // [BIBLIA]
    velocidad: 175,               // rápido
    radio: 10,
    ancho: 24,
    alto: 20,                     // proporción 1,20
    dispara: false,               // [BIBLIA] el básico no dispara
    particulasExplosion: 22,
    categoriaImpacto: 'enemigoPequeno', // qué sacudida y congelación provoca
    // El desfase por columna hace que la escuadra respire en ola diagonal
    // en lugar de moverse como un bloque.
    animacion: { tipo: 'rotacion', hz: 0.90, amplitudGrados: 8, desfasePorColumna: 0.16 },
  },
  avispa: {
    nombre: 'Avispa de vapor',    // [BIBLIA]
    vida: 1,                      // [BIBLIA]
    puntos: 200,                  // [BIBLIA]
    velocidad: 155,
    radio: 12,
    ancho: 32,                    // envergadura con las alas desplegadas
    alto: 24,                     // proporción 1,33: la más achatada
    dispara: true,                // [BIBLIA] dispara UNA vez durante el ataque
    disparosPorAtaque: 1,         // [BIBLIA]
    particulasExplosion: 22,
    categoriaImpacto: 'enemigoPequeno',
    animacion: { tipo: 'deformacion', hz: 6.0, escalaAlas: [1.0, 0.75], desfasePorColumna: 0.16 },
  },
  cafetera: {
    nombre: 'Cafetera guardiana', // [BIBLIA]
    vida: 2,                      // [BIBLIA]
    puntos: 400,                  // [BIBLIA]
    velocidad: 115,               // [BIBLIA] más lenta
    radio: 16,
    ancho: 34,
    alto: 36,                     // proporción 0,94: la única más alta que ancha
    dispara: true,
    disparosPorAtaque: 2,
    particulasExplosion: 48,
    categoriaImpacto: 'enemigoGrande', // el único que se siente "pesado"
    animacion: { tipo: 'traslacion', hz: 0.45, amplitudPx: 2, desfasePorColumna: 0.16 },
    // Es el único enemigo que aguanta dos impactos, y el único con un
    // indicador de estado en el cuerpo: su manómetro. Con un impacto
    // recibido, la esfera se queda fija en ámbar y la aguja tiembla.
    // Así se comunican los 2 puntos de vida sin barras ni iconos.
    indicadorDano: 'manometro',
  },
};

export const DISPARO_ENEMIGO = {
  VELOCIDAD: 210,
  VELOCIDAD_MAXIMA_ABSOLUTA: 300, // techo pase lo que pase con la dificultad:
                                  // a 300 px/s siempre da tiempo a esquivar
  MAXIMO_EN_PANTALLA: 8,          // [BIBLIA]
  RADIO_COLISION: 4,
  ANCHO: 7,
  ALTO: 7,
  AVISO_ANTES_DE_DISPARAR: 0.15,  // chispa en el origen antes de salir
  DESPLAZAMIENTO_ORIGEN: 12,      // por debajo del enemigo que dispara
  RECARGA_TIRADOR: 1.2,           // lo que tarda ese enemigo en volver a tirar
  FUNDIDO_AL_LIMPIAR: 0.2,        // al morir el jugador los disparos se apagan
                                  // poco a poco, no desaparecen de golpe
};

// ---------------------------------------------------------------------------
// FORMACIÓN
// ---------------------------------------------------------------------------

export const FORMACION = {
  COLUMNAS: 8,                 // [BIBLIA] 3 filas de 8
  FILAS: 3,                    // [BIBLIA]
  TOTAL: 24,                   // [BIBLIA] 24 enemigos por fase
  ENEMIGOS_POR_GRUPO: 4,       // [BIBLIA] entran en grupos de 4
  ESPERA_ENTRE_GRUPOS: 0.5,
  ESPERA_DENTRO_DEL_GRUPO: 0.18, // van en fila india, no amontonados

  SEPARACION_X: 38,
  SEPARACION_Y: 34,
  ANCLA_Y: 140,

  // La formación nunca está quieta: se mueve, oscila y respira.
  VAIVEN_AMPLITUD: 16,         // [BIBLIA] se desplaza lentamente de izq. a der.
  VAIVEN_PERIODO: 6.0,
  RESPIRACION_AMPLITUD: 0.06,  // cuánto se separan y juntan del centro
  RESPIRACION_PERIODO: 3.2,
  DESFASE_POR_FILA: 0.35,      // hace que la respiración recorra la escuadra en ola

  // Cuando quedan muy pocos, dejan de volver a formación y siguen atacando.
  UMBRAL_ENFURECIDOS: 2,
  MULTIPLICADOR_VELOCIDAD_ENFURECIDOS: 1.2, // herencia de Galaga: se aceleran

  // El último tramo de la vuelta a casa. No es una curva fija: persigue la
  // casilla, que se está moviendo, para que el aterrizaje sea exacto.
  DURACION_ACOPLE: 0.45,
};

// ---------------------------------------------------------------------------
// ATAQUES
// ---------------------------------------------------------------------------

export const ATAQUES = {
  MAXIMO_SIMULTANEOS: 5,       // [BIBLIA] nunca más de 5 atacando a la vez
  TELEGRAFIADO: 0.45,          // aviso antes de salir de formación
  TELEGRAFIADO_PRIMERAS_FASES: 0.7, // más generoso en las fases 1-3
  SEPARACION_MINIMA_ENTRE_AVISOS: 0.12, // que no arranquen dos en el mismo frame
  ESPERA_PRIMER_ATAQUE: 3.0,   // desde el inicio de la fase
  ESPERA_PRIMER_ATAQUE_FACIL: 4.5, // en las fases 1-3
  INTERVALO_BASE: 2.4,         // tiempo medio entre tandas de ataque
  RECARGA_INICIAL_MAXIMA: 3.0, // desincroniza a los enemigos al empezar

  DESCENSO_AVISO: 4,           // se descuelga 4 px mientras avisa: el segundo
                               // canal del telegrafiado, además del destello
  AVANCE_MINIMO_PARA_DISPARAR: 0.25, // no dispara al salir, sino ya en camino
  ATACANTES_POR_TANDA: 2,      // cuántos salen juntos como máximo
  ESCALON_ENTRE_AVISOS: 0.12,  // dos avisos nunca arrancan en el mismo paso,
                               // o no se leerían por separado

  // Reglas de juego limpio de la biblia: nunca aparecer encima del jugador
  // ni lanzar ataques imposibles de esquivar.
  DISTANCIA_MINIMA_AL_JUGADOR: 180,
  MARGEN_SOBRE_JUGADOR: 40,    // nadie sale a atacar desde justo encima de ti
};

// ---------------------------------------------------------------------------
// CICLO DE FASES
// ---------------------------------------------------------------------------

/**
 * [BIBLIA] El juego usa un ciclo de 5 fases que se repite indefinidamente,
 * cada vuelta un poco más difícil. Nunca aparecen mecánicas nuevas.
 */
export const CICLO_FASES = [
  { tipo: 'normal', enemigos: ['grano'] },                        // fase 1
  { tipo: 'normal', enemigos: ['grano', 'avispa'] },              // fase 2
  { tipo: 'normal', enemigos: ['grano', 'avispa', 'cafetera'] },  // fase 3
  { tipo: 'bonus' },                                              // fase 4
  { tipo: 'jefe' },                                               // fase 5
];

export const PROGRESION = {
  VELOCIDAD_ENEMIGOS_POR_CICLO: 1.05,   // [BIBLIA] +5 % por vuelta
  VELOCIDAD_PROYECTILES_POR_CICLO: 1.05, // [BIBLIA] +5 % por vuelta
  FRECUENCIA_ATAQUES_POR_CICLO: 1.08,   // [BIBLIA] ataques algo más frecuentes

  // Topes: la dificultad sube indefinidamente pero nunca rompe las reglas
  // de juego limpio. Una fase 40 debe ser dura, no imposible.
  MULTIPLICADOR_VELOCIDAD_MAXIMO: 2.0,
  MULTIPLICADOR_FRECUENCIA_MAXIMO: 2.5,

  // Arranque amable: las primeras fases perdonan más, para enganchar a
  // cualquiera que abra el enlace por primera vez.
  FASES_FACILES: 3,
  MULTIPLICADOR_FASES_FACILES: 0.85,
};

// ---------------------------------------------------------------------------
// FASE BONUS
// ---------------------------------------------------------------------------

export const BONUS = {
  OBJETIVOS: 20,               // [BIBLIA]
  PUNTOS_POR_OBJETIVO: 200,    // [BIBLIA]
  BONIFICACION_PERFECTA: 5000, // [BIBLIA] si se destruyen todos
  // [BIBLIA] los enemigos no atacan: es una fase de lucimiento, sin castigo.

  OBJETIVOS_POR_GRUPO: 5,
  ESPERA_ENTRE_GRUPOS: 3.2,
  ESPERA_DENTRO_DEL_GRUPO: 0.28,
  FACTOR_VELOCIDAD: 0.85,      // algo más lentos que en combate: hay que poder
                               // apuntar y disfrutar el desfile
  AVISO_INICIAL: 1.2,          // el cartel de "sin disparos enemigos"
  RESULTADO: 2.2,              // lo que se muestra el recuento final
};

// ---------------------------------------------------------------------------
// JEFE — GRAN TOSTADORA CÓSMICA
// ---------------------------------------------------------------------------

export const JEFE = {
  NOMBRE: 'Gran Tostadora Cósmica', // [BIBLIA]
  VIDA: 30,                    // [BIBLIA] 30 impactos
  PUNTOS: 5000,                // [BIBLIA]
  APARECE_CADA: 5,             // [BIBLIA] fases

  ANCHO: 176,
  ALTO: 140,
  Y_CENTRO: 119,               // [BIBLIA] permanece en la mitad superior:
                               // ocupa de y=44 a y=184 y deja 456 px libres
  X_MINIMA: 98,                // recorrido horizontal, senoidal puro
  X_MAXIMA: 262,
  PERIODO_DESPLAZAMIENTO: 7.0, // [BIBLIA] se mueve horizontalmente
  PAUSA_EN_EXTREMOS: 0.4,      // momento para que el jugador se recoloque

  // Es el objeto más lento de la pantalla, por un factor de casi dos sobre el
  // siguiente. La lentitud es lo que le da peso, no el tamaño.
  RITMO_HZ: 0.25,

  /**
   * SIN BARRA DE VIDA. El daño se ve en su propio cuerpo, que es donde el
   * jugador ya está mirando. Hay un cambio visible cada 6 impactos:
   *   24 -> se agrieta el cristal de la mirilla
   *   18 -> salta la placa derecha y se rompe su manómetro
   *   12 -> salta la placa izquierda; empieza a temblar
   *    6 -> se desprende la tolva y cae una chimenea
   *    3 -> agonía: fisuras luminosas y chorros de vapor a presión
   * En la agonía NO sube la cadencia de ataque: nada de picos de dificultad
   * injustos. Solo se acorta el telegrafiado un 15 %.
   */
  UMBRALES_DANO: [24, 18, 12, 6, 3],
  HITSTOP_UMBRAL_MS: 40,       // solo al cruzar umbral; los otros golpes, 0
  REDUCCION_TELEGRAFIADO_AGONIA: 0.15,

  /**
   * [BIBLIA] debe avisar visualmente antes de cada ataque.
   * Los tres avisos tienen la misma estructura de tres tiempos:
   *   1. Carga  — pasa en el cuerpo del jefe, en tonos cálidos. "Va a pasar algo".
   *   2. Marca  — dice dónde exactamente. Único momento en que aparece el
   *               color de peligro antes del proyectil.
   *   3. Disparo.
   * Separar carga y marca permite anticipar sin teñir la pantalla de rojo, y
   * refuerza la lección: magenta = te va a alcanzar.
   */
  ATAQUES: {
    verticales: {
      telegrafiado: 0.9, marcaEn: 0.45, congelaEn: 0.08,
      velocidadProyectil: 260, duracion: 2.0, recarga: 1.6,
    },
    abanico: {
      telegrafiado: 1.0, marcaEn: 0.5,
      angulos: [-50, -25, 0, 25, 50],        // patrón fijo: aprendible
      angulosAmpliado: [-60, -40, -20, 0, 20, 40, 60], // en ciclos avanzados
      velocidadProyectil: 220, duracion: 1.4, recarga: 2.0,
    },
    granos: {
      telegrafiado: 1.6, marcaEn: 1.2, confirmacionEn: 0.4,
      velocidadProyectil: 300, duracion: 2.5, recarga: 2.4,
      // La lluvia avisa más tiempo porque hay que ver el hueco seguro.
    },
  },

  /**
   * Lluvia de granos: la pantalla se parte en 6 carriles y 2 son seguros.
   * El hueco se marca EN POSITIVO, con contorno cian (el color del jugador),
   * en su propia zona y antes de que exista un solo grano. No basta con
   * marcar el peligro: hay que marcar la salvación.
   */
  CARRILES: 6,
  CARRILES_SEGUROS: 2,
  ANCHO_CARRIL: 60,
  DISTANCIA_MAXIMA_A_CARRIL_SEGURO: 2, // cruzar 2 carriles son 520 ms y el
                                       // aviso dura 1200: margen del doble
  TRANSICION_ENTRE_OLEADAS: 0.7,
  PAUSA_MINIMA_ENTRE_ATAQUES: 1.2,     // sin un solo píxel magenta en pantalla:
                                       // ese silencio es lo que hace legible
                                       // el siguiente aviso
  /**
   * Densidad de la lluvia de granos, calculada para no chocar con el tope de 8
   * proyectiles enemigos en pantalla.
   *
   * Un grano tarda unos 1,6 s en cruzar la pantalla, así que el máximo
   * sostenible son unos 5 granos por segundo. Con 2 carriles por ráfaga y 2,2
   * ráfagas por segundo salen 4,4: la lluvia es continua de principio a fin y
   * nunca se pierde ningún grano por falta de sitio.
   */
  RAFAGAS_DE_GRANOS_POR_SEGUNDO: 2.2,
  CARRILES_POR_RAFAGA: 2,

  ENTRADA: 4.5,                // segundos de puesta en escena
  MUERTE: 2.2,                 // segundos de secuencia de destrucción
  DESTELLO_IMPACTO: 0.06,      // el parpadeo al recibir un golpe
  INVULNERABILIDAD_EN_ENTRADA: 0.2, // el jugador no puede morir mientras entra
  PARTICULAS_UMBRAL: 20,       // al romperse una pieza
  PARTICULAS_MUERTE: 60,
  UMBRAL_TEMBLOR: 3,           // desde qué nivel de daño tiembla
  UMBRAL_TEMBLOR_FUERTE: 4,
  VELOCIDAD_CAIDA: 22,         // px/s mientras se desploma
};

/**
 * El modo de alto contraste no solo cambia colores: también da más tiempo.
 * Quien lo activa suele necesitar ambas cosas.
 */
export const ALTO_CONTRASTE = {
  MULTIPLICADOR_TELEGRAFIADO: 1.2,
  PAUSA_MINIMA_ENTRE_ATAQUES: 1.5,
  FRECUENCIA_PARPADEO_MAXIMA: 3,  // Hz, umbral de seguridad fotosensitiva
};

// ---------------------------------------------------------------------------
// PUNTUACIÓN
// ---------------------------------------------------------------------------

export const PUNTUACION = {
  // [BIBLIA] destruir un enemigo mientras ataca concede el doble.
  MULTIPLICADOR_EN_PICADO: 2,
  VIDA_EXTRA_CADA: 20000,      // [BIBLIA]
  VELOCIDAD_CONTADOR: 3000,    // puntos por segundo al animar el marcador
};

// ---------------------------------------------------------------------------
// RITMO DE LAS PANTALLAS
// ---------------------------------------------------------------------------

/**
 * Cuánto dura cada cartel y cada transición. Son los números que marcan si el
 * juego se siente ágil o pesado, así que viven aquí y no repartidos.
 */
export const TIEMPOS = {
  INTRO_FASE: 1.3,             // el cartel "FASE 3"
  FIN_OLEADA: 1.8,             // el panel con la puntería
  BLOQUEO_FIN_PARTIDA: 0.4,    // sin esto, quien machaca el disparo se salta
                               // su propia puntuación sin llegar a verla
  CUENTA_ATRAS_PAUSA: 0.6,     // por cada número del 3 · 2 · 1
  DESTELLO_IMPACTO: 0.08,      // el parpadeo blanco del enemigo golpeado
  PUNTOS_FLOTANTES: 0.6,       // lo que dura el "+200" al abatir en picado
  AVISO_SILENCIO: 0.9,         // el cartel de SONIDO OFF / SONIDO ON
  SONIDO_FIN_PARTIDA: 0.7,     // cuándo suena la melodía de derrota
  SONIDO_RECORD: 1.6,          // y cuándo la fanfarria de récord, después
};

/** Posición vertical de cada cartel, para que no bailen entre pantallas. */
export const CARTELES = {
  Y_TITULO: 270,
  Y_PRINCIPAL: 300,
  Y_SECUNDARIO: 316,
  Y_LLAMADA: 380,
  Y_AVISO_SILENCIO: 56,        // justo bajo el HUD, fuera de la zona de juego
  // Si una amenaza se acerca más que esto a un cartel, el cartel se atenúa.
  // Ningún texto puede participar en la muerte del jugador.
  DISTANCIA_ATENUACION: 80,
  ALPHA_ATENUADO: 0.2,
};

// ---------------------------------------------------------------------------
// EFECTOS Y RENDIMIENTO
// ---------------------------------------------------------------------------

export const EFECTOS = {
  PARTICULAS_MAXIMAS: 400,     // techo global; por encima se reciclan las viejas
  ANILLOS_MAXIMOS: 8,          // anillos de choque simultáneos
  SHADOWBLUR_MAXIMO_POR_FRAME: 30, // la operación más cara de canvas

  SACUDIDA: {
    enemigoPequeno: { amplitud: 2, duracion: 0.12 },
    enemigoGrande:  { amplitud: 5, duracion: 0.26 },
    jugador:        { amplitud: 8, duracion: 0.50 },
    jefe:           { amplitud: 10, duracion: 0.90 },
  },
  // Cuánto de rápido se apaga la sacudida. Se aplica sobre el avance
  // relativo, no sobre segundos, para que una sacudida corta también empiece
  // a su amplitud completa.
  SACUDIDA_DECAIMIENTO: 6,
  SACUDIDA_FRECUENCIA_X: 140,
  SACUDIDA_FRECUENCIA_Y: 117,  // distinta de la de X, o la sacudida sería una
                               // línea recta en diagonal
  SACUDIDA_PROPORCION_Y: 0.6,

  HITSTOP_MS: {
    enemigoPequeno: 30,
    enemigoGrande: 70,
    jugador: 110,
    jefe: 140,
  },

  // Si el juego va lento, se recorta en este orden y nunca al revés.
  ORDEN_DEGRADACION: ['bloom', 'brilloFondo', 'nebulosas', 'particulasSecundarias', 'brilloEnemigos'],
  // Estos no se recortan jamás, a ningún precio:
  INTOCABLES: ['jugador', 'disparosJugador', 'disparosEnemigos', 'anillosDeChoque'],
};

// ---------------------------------------------------------------------------
// ACCESIBILIDAD Y AJUSTES
// ---------------------------------------------------------------------------

export const AJUSTES_POR_DEFECTO = {
  volumenGeneral: 80,
  volumenMusica: 62,           // suficiente para que la melodía enganche, sin
                               // tapar los avisos de ataque, que salvan vidas
  volumenEfectos: 80,
  sacudidaPantalla: true,      // [BIBLIA] activable/desactivable
  reducirDestellos: false,
  altoContraste: false,        // [BIBLIA] alto contraste para proyectiles
  modoDisparo: MODO_DISPARO.MANTENIDO,
  sensibilidadTactil: 1.0,     // 0.75 preciso / 1.0 normal / 1.4 rápido
  tamanoHud: 'normal',
  velocidadJuego: 1.0,         // 1.0 normal / 0.85 asistido
  vibracion: false,
};

export const ASISTENCIA = {
  VELOCIDAD_LENTA: 0.85,
  // El modo lento es la única opción que cambia la dificultad real, así que
  // marca la partida como asistida y no compite en el ranking mundial.
  // Todas las demás opciones de accesibilidad puntúan con total normalidad.
  EXCLUYE_DEL_RANKING: ['velocidadJuego'],
  FRECUENCIA_MAXIMA_PARPADEO: 3, // Hz. Umbral de seguridad fotosensitiva.
};

// ---------------------------------------------------------------------------
// CONTROLES
// ---------------------------------------------------------------------------

/**
 * Se usa event.code y no event.key: con event.key, un teclado francés AZERTY
 * o un Dvorak rompería el WASD.
 */
export const TECLAS = {
  IZQUIERDA: ['ArrowLeft', 'KeyA', 'KeyJ'],
  DERECHA: ['ArrowRight', 'KeyD', 'KeyL'],
  DISPARO: ['Space', 'ArrowUp', 'KeyW', 'KeyZ'],
  PAUSA: ['KeyP', 'Escape'],   // P es la principal: en pantalla completa el
                               // navegador se queda con Escape
  SILENCIAR: ['KeyM'],
  PANTALLA_COMPLETA: ['KeyF'],
  CONFIRMAR: ['Enter', 'Space'],
  AYUDA: ['KeyH'],
  AJUSTES: ['KeyO'],
  RECORDS: ['KeyR'],
  // Solo para navegar menús: la taza nunca sube ni baja.
  ARRIBA: ['ArrowUp', 'KeyW'],
  ABAJO: ['ArrowDown', 'KeyS'],
};

export const TACTIL = {
  // Arrastre relativo: la taza se mueve lo mismo que tu dedo, sin saltar de
  // golpe adonde tocas. Resuelve que el dedo tape la nave y que te maten al
  // recolocar el dedo.
  Y_MINIMA_CAPTURA: 160,
  VELOCIDAD_MAXIMA: 368,       // tope para que el ranking compare cosas comparables
  SENSIBILIDADES: { preciso: 0.75, normal: 1.0, rapido: 1.4 },
  AREA_TACTIL_MINIMA_CSS: 48,  // píxeles reales, no lógicos
};

export const MANDO = {
  ZONA_MUERTA: 0.25,
  AVISO_CONEXION: 1.5,         // segundos que se muestra "MANDO CONECTADO"
};
