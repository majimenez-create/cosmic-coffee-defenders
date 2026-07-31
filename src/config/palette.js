/**
 * PALETA — Todos los colores del juego.
 * =====================================
 *
 * Junto a balance.js, el único sitio donde puede haber valores sueltos.
 * Si un color aparece escrito a mano en cualquier otro archivo, es un error.
 *
 * REGLA DE ORO Nº 1 — EL CANAL DE PELIGRO ES EXCLUSIVO
 * El rosa magenta #FF2D6F pertenece ÚNICAMENTE a lo que puede matarte:
 * proyectiles enemigos, avisos de ataque y el aviso de vida perdida.
 * No aparece en fondos, ni en el HUD, ni en explosiones, ni en el cuerpo en
 * reposo de ningún enemigo. Si mañana hace falta un color nuevo para algo,
 * se saca de cualquier sitio menos de aquí.
 *
 * REGLA DE ORO Nº 2 — SILUETA PRIMERO, COLOR DESPUÉS
 * Ninguna información se codifica solo con color. Los tres enemigos se
 * distinguen por forma, tamaño y ritmo de animación. Un jugador daltónico
 * debe poder jugar sin ninguna adaptación.
 */

// ---------------------------------------------------------------------------
// FONDO Y ESPACIO
// ---------------------------------------------------------------------------

export const FONDO = {
  VACIO_BASE: '#05040B',       // color de limpieza del lienzo
  VACIO_SUPERIOR: '#0E0B1E',   // parada alta del degradado vertical
  VACIO_MEDIO: '#080614',

  NEBULOSA_FRIA: '#3A2A5E',    // manchas de vapor lejanas
  NEBULOSA_CALIDA: '#4A3A2A',  // vapor de café
  NEBULOSA_AZUL: '#243A52',

  REJILLA_ZONA: '#2A1B3D',     // líneas del tercio inferior: territorio del jugador
  VINETA: '#000000',

  // Velos oscuros. Se declaran aquí para que nadie reconstruya el color base
  // a mano en otro archivo: si mañana el fondo cambia, cambian con él.
  VELO_HUD: 'rgba(5, 4, 11, 0.5)',
  VELO_TRANSPARENTE: 'rgba(5, 4, 11, 0)',
  VELO_PANTALLA: 'rgba(5, 4, 11, 0.6)',
};

/**
 * Tres capas de estrellas con paralaje. La velocidad crea la profundidad.
 *
 * El alpha está deliberadamente bajo: el fondo no puede competir con la
 * acción. Si durante una oleada el jugador NOTA el fondo, el fondo ha ganado
 * y el juego ha perdido.
 */
export const ESTRELLAS = {
  LEJANA:  { color: '#4A4468', tamano: 1.0, velocidad: 8,  alpha: 0.75 },
  MEDIA:   { color: '#8C86A8', tamano: 1.5, velocidad: 22, alpha: 0.60 },
  CERCANA: { color: '#E8E4F0', tamano: 2.0, velocidad: 55, alpha: 0.55 },
  GRANO:   { color: '#C98A4B', tamano: 2.0, velocidad: 22, alpha: 0.7 }, // guiño: granos de café
  CANTIDAD_BASE: 155,          // para 360x640; se escala por raíz del área
  CANTIDAD_MAXIMA: 260,
};

export const PLANETA = {
  ESMALTE_ILUMINADO: '#E8EEF6',
  MEDIO_TONO: '#9AAAC2',
  SOMBRA: '#2A3346',
  BANDA_ESMALTE: '#5A6E96',
  LINEA_CAFE: '#6B4A2E',       // el "ecuador" de café que gotea
  ANILLO: '#C2703A',
};

export const GALAXIA_GRANOS = {
  CENTRO: '#6B4A2E',
  MEDIO: '#C2703A',
  BORDE: '#FFD27A',
};

// ---------------------------------------------------------------------------
// JUGADOR — taza de porcelana con identidad cian
// ---------------------------------------------------------------------------

export const JUGADOR = {
  PORCELANA_ESPECULAR: '#FFFFFF', // la parada de luz del cilindro cerámico
  PORCELANA_CLARA: '#F4F7FB',
  PORCELANA_MEDIA: '#DCE4EE',
  SOMBRA_CERAMICA: '#AFC0D6',
  SOMBRA_PROFUNDA: '#7A8CA3',
  HUECO_ICONO: '#0A1A24',      // el interior del icono de vida del HUD

  CIAN: '#3FD2FF',             // color de identidad del jugador
  CIAN_NUCLEO: '#B8F4FF',
  CIAN_PROFUNDO: '#0E5C8A',

  CAFE_INTERIOR: '#4A2C17',    // el café visible dentro de la taza
  CREMA: '#D8A566',
  BANDA_TECNICA: '#FFB020',    // el detalle "cafetera de alta gama"

  PROPULSOR: '#7FF0FF',
  PROPULSOR_NUCLEO: '#FFFFFF',
  VAPOR: '#DCE9F5',            // vapor en reposo, siempre por detrás de la taza
};

// Disparos del jugador: ámbar, forma de cápsula alargada, suben.
export const DISPARO_JUGADOR = {
  NUCLEO: '#FFFDF2',
  CUERPO: '#FFD27A',
  HALO: '#FFAE3B',
  ESTELA: '#C2703A',
};

// ---------------------------------------------------------------------------
// ENEMIGOS
// ---------------------------------------------------------------------------

/**
 * Cada enemigo tiene una silueta y un ritmo propios, no solo un color:
 *   grano    — óvalo, 24 px, balanceo lento (1,6 s)
 *   avispa   — punta de flecha, 28 px, aleteo rápido (6 Hz)
 *   cafetera — hexágono coronado, 36 px, respiración lenta (0,8 Hz)
 */
export const ENEMIGOS = {
  grano: {
    cuerpo: '#7BE06A',
    sombra: '#2E7A3C',
    brillo: '#D6FFB0',
    acento: '#FFB020',         // las antenas
    hendidura: '#1C4F27',      // la raja característica del grano de café
    sensores: '#0A1A0E',
  },
  avispa: {
    cuerpo: '#FF8A3D',
    sombra: '#8A3A12',
    brillo: '#FFD9A8',
    acento: '#3A1A08',         // las bandas de avispa
    visor: '#FFE0A8',
  },
  cafetera: {
    cuerpo: '#B36BFF',
    cuerpoClaro: '#D9B0FF',
    sombra: '#4A1C86',
    brillo: '#E7CCFF',
    acento: '#FFC24B',         // la corona: tapa y válvulas de presión
    placas: '#7A3ECC',
    ojo: '#1A0A2E',            // la aguja del manómetro
    esferaManometro: '#F4EFE6',
  },
};

/**
 * JEFE — Gran Tostadora Cósmica.
 * Una máquina industrial de metal y latón, no una criatura. Su punto focal es
 * la mirilla del tambor, donde se ven los granos tostándose. Su silueta es la
 * más achatada del juego y no se parece a ninguna de las tres enemigas.
 */
export const JEFE = {
  METAL_OSCURO: '#2A3346',
  METAL_MEDIO: '#5C7290',
  METAL_CLARO: '#93A8BF',
  METAL_BRILLO: '#C8D6E5',
  METAL_LUZ: '#E8EEF6',

  LATON: '#C2703A',            // biseles, aros y remates
  LATON_BRILLO: '#FFD27A',

  CHIMENEA: '#5C4A3A',
  CHIMENEA_SOMBRA: '#3A2C22',

  CRISTAL_MIRILLA: '#2A1B10',
  CRISTAL_BORDE: '#4A2C17',
  FUEGO_INTERIOR: '#FF8A3D',   // crece conforme le vas dando
  GRANO_TOSTANDOSE: '#6B4A2E',

  ESFERA_MANOMETRO: '#F4EFE6',
  AGUJA: '#2A3346',

  LLAMA_QUEMADOR: '#FF8A3D',
  LLAMA_NUCLEO: '#FFD27A',

  FISURA: '#FFD27A',           // las grietas por las que se escapa el calor
  HUMO_NEGRO: '#2A2018',
  AURA_CALOR: '#FF8A3D',
};

// ---------------------------------------------------------------------------
// PELIGRO — canal exclusivo, ver regla de oro nº 1
// ---------------------------------------------------------------------------

export const PELIGRO = {
  PROYECTIL: '#FF2D6F',
  PROYECTIL_NUCLEO: '#FFFFFF',
  PROYECTIL_CONTORNO: '#2A0010', // el anillo oscuro que lo separa de todo lo demás
  HALO: '#FF2D6F',
  TELEGRAFIADO: '#FF2D6F',
  // Modo alto contraste: el proyectil crece, gana anillo blanco y todo lo
  // demás baja de saturación para que solo la amenaza esté saturada.
  ANILLO_ALTO_CONTRASTE: '#FFFFFF',
};

// ---------------------------------------------------------------------------
// EXPLOSIONES
// ---------------------------------------------------------------------------

export const EXPLOSION = {
  DESTELLO: '#FFFDF5',
  CHISPA_MEDIA: '#FFD27A',
  CHISPA_EXTERIOR: '#FF8A3D',
  HUMO_CAFE: '#6B4A2E',
  ESQUIRLA_PORCELANA: '#F4F7FB',
  GOTA_CAFE: '#4A2C17',        // solo en la muerte del jugador: algo se ha derramado
  ANILLO_CHOQUE: '#FFF3D6',
};

// ---------------------------------------------------------------------------
// INTERFAZ
// ---------------------------------------------------------------------------

export const HUD = {
  TEXTO_PRIMARIO: '#F4EFE6',   // blanco porcelana, nunca blanco puro
  ETIQUETA: '#8E9AB0',
  CUERPO_TEXTO: '#C3CBD9',
  VALOR_DESTACADO: '#FFC24B',
  SELECCION: '#FFB020',
  CURSOR: '#3FD2FF',
  AVISO: '#FF2D6F',            // solo para "vida perdida"
  RECORD_NUEVO: '#7BE06A',
  MARCO: '#C2703A',
};

/**
 * Tipografía sin descargar nada. Lo que evoca una recreativa no es la fuente
 * en sí, sino la combinación de un tipo geométrico muy pesado, MAYÚSCULAS y
 * un espaciado amplio entre letras.
 */
export const TIPOGRAFIA = {
  PILA: '"Arial Black", "Arial Bold", "Segoe UI Black", "Helvetica Neue", Roboto, sans-serif',
  PESO: 900,
  TAMANOS: {
    TITULO: 34,
    ENCABEZADO: 24,
    AVISO_FASE: 28,
    OPCION_MENU: 15,
    OPCION_SELECCIONADA: 17,
    ETIQUETA_HUD: 8,
    VALOR_HUD: 14,
    PUNTUACION: 16,            // el dato principal: el más grande del HUD
    RECORD: 12,                // terciario: solo importa cuando te acercas
    CUERPO: 11,
    PUNTOS_FLOTANTES: 10,
  },
  ESPACIADOS: {
    TITULO: 0.14,
    ENCABEZADO: 0.12,
    ETIQUETA: 0.16,
    VALOR: 0.04,
  },
};

// ---------------------------------------------------------------------------
// ORDEN DE DIBUJO — regla de oro nº 3
// ---------------------------------------------------------------------------

/**
 * Los proyectiles enemigos son lo último del mundo que se pinta. Solo el HUD
 * va por encima. La GAME_BIBLE lo dice sin ambigüedad en su sección 17:
 * "los efectos nunca deben ocultar proyectiles o enemigos". Esta regla es lo
 * primero que se rompe en la práctica, así que queda escrita aquí.
 */
export const ORDEN_DIBUJO = [
  'fondo',
  'vineta',
  'vaporJugador',
  'enemigos',
  'jugador',
  'particulas',
  'disparosJugador',
  'disparosEnemigos',
  'destellosPantalla',
  'hud',
];
