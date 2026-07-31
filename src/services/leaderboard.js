/**
 * RANKING MUNDIAL
 * ===============
 *
 * Se habla directamente con la API de Supabase mediante peticiones normales de
 * red, sin ninguna librería. No hace falta: son dos llamadas, una para leer y
 * otra para enviar.
 *
 * SOBRE LA CLAVE QUE HAY AQUÍ ABAJO
 * Es pública por diseño y no es un descuido: en Supabase la clave publicable
 * está pensada para viajar en el navegador. Lo que protege los datos son las
 * reglas de la propia base de datos, que permiten únicamente leer el ranking y
 * añadir una puntuación. No se puede modificar ni borrar nada, ni acceder a
 * ninguna otra tabla.
 *
 * Y se asume con honestidad: esto NO es un sistema antitrampas. Alguien
 * decidido puede enviar una puntuación falsa. Para un juego de portfolio es una
 * decisión consciente y proporcionada; evitarlo de verdad exigiría validar la
 * partida entera en un servidor.
 *
 * EL JUEGO FUNCIONA SIN RED. Si no hay conexión o el servicio falla, se sigue
 * jugando igual y el récord local se guarda como siempre. El ranking es un
 * añadido, nunca un requisito.
 */

const URL_BASE = 'https://cilwiwbjljlzajniddmk.supabase.co/rest/v1/puntuaciones';
const CLAVE_PUBLICA = 'sb_publishable_oquLW9F0i2wHGuGV9VQqaA_hs15r3QP';

const CLAVE_COLA = 'ccd_cola_ranking';
const TOPE = 10;
const ESPERA_MAXIMA = 6000;

function cabeceras(extra = {}) {
  return {
    'apikey': CLAVE_PUBLICA,
    'Authorization': `Bearer ${CLAVE_PUBLICA}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

/** Corta la espera si el servidor no responde: el juego no puede quedarse colgado. */
function conTiempoLimite(promesa, ms = ESPERA_MAXIMA) {
  let temporizador;
  const limite = new Promise((_, rechazar) => {
    temporizador = setTimeout(() => rechazar(new Error('tiempo agotado')), ms);
  });
  return Promise.race([promesa, limite]).finally(() => clearTimeout(temporizador));
}

/**
 * Las diez mejores puntuaciones.
 * @returns {Promise<Array<{iniciales:string, puntos:number, fase:number}>|null>}
 *   null si no se ha podido consultar. Nunca lanza: quien llama solo tiene que
 *   distinguir "hay datos" de "no hay datos".
 */
export async function leerRanking() {
  try {
    const consulta = `${URL_BASE}?select=iniciales,puntos,fase&order=puntos.desc,creado_en.asc&limit=${TOPE}`;
    const respuesta = await conTiempoLimite(fetch(consulta, { headers: cabeceras() }));
    if (!respuesta.ok) return null;

    const datos = await respuesta.json();
    // Nada de lo que llega por la red se dibuja sin comprobar. Dos motivos:
    // si la respuesta no fuera un array, el dibujado fallaría en CADA
    // fotograma; y las iniciales las escribe otra persona, así que aunque la
    // base de datos las limite, el cliente no tiene por qué confiar.
    if (!Array.isArray(datos)) return null;

    return datos.slice(0, TOPE).map((f) => ({
      iniciales: normalizarIniciales(String(f?.iniciales ?? '')),
      puntos: Math.max(0, Math.min(99999999, Math.floor(Number(f?.puntos) || 0))),
      fase: Math.max(1, Math.min(9999, Math.floor(Number(f?.fase) || 1))),
    }));
  } catch {
    return null;
  }
}

/**
 * Envía una puntuación. Si falla, la deja en una cola para reintentarla más
 * adelante: una mala conexión no debe costarle a nadie su récord.
 *
 * @returns {Promise<boolean>} true si llegó al servidor
 */
export async function enviarPuntuacion(iniciales, puntos, fase) {
  const fila = {
    iniciales: normalizarIniciales(iniciales),
    puntos: Math.max(0, Math.floor(puntos)),
    fase: Math.max(1, Math.floor(fase)),
  };

  const enviada = await _intentarEnviar(fila);
  if (!enviada) _encolar(fila);
  return enviada;
}

async function _intentarEnviar(fila) {
  try {
    const respuesta = await conTiempoLimite(fetch(URL_BASE, {
      method: 'POST',
      headers: cabeceras({ 'Prefer': 'return=minimal' }),
      body: JSON.stringify(fila),
    }));
    return respuesta.ok;
  } catch {
    return false;
  }
}

/**
 * Reintenta lo que quedó pendiente. Se llama al volver la conexión.
 *
 * El cerrojo y el vaciado previo de la cola no son adornos: sin ellos, dos
 * llamadas simultáneas (por ejemplo entrar en la pantalla de récords justo
 * cuando vuelve la conexión) leían la misma cola y enviaban las mismas filas
 * dos veces. Y una puntuación duplicada en el ranking NO SE PUEDE BORRAR: por
 * diseño no existe permiso de borrado.
 */
let reintentoEnMarcha = false;

export async function reintentarPendientes() {
  if (reintentoEnMarcha) return;

  const cola = _leerCola();
  if (!cola.length) return;

  reintentoEnMarcha = true;
  // Se vacía ANTES de enviar: así una segunda llamada no encuentra nada que
  // duplicar. Lo que falle se vuelve a encolar.
  _guardarCola([]);

  try {
    const quedan = [];
    for (const fila of cola) {
      const enviada = await _intentarEnviar(fila);
      if (!enviada) quedan.push(fila);
    }
    if (quedan.length) _guardarCola(quedan);
  } finally {
    reintentoEnMarcha = false;
  }
}

/**
 * ¿Esta puntuación entra en el top 10? Se consulta antes de pedir las
 * iniciales, para no hacer escribir a alguien que no va a salir en la tabla.
 */
export async function entraEnRanking(puntos) {
  const ranking = await leerRanking();
  if (ranking === null) return null;        // sin conexión: se decide fuera
  if (ranking.length < TOPE) return true;
  return puntos > ranking[ranking.length - 1].puntos;
}

/** Tres letras mayúsculas, rellenando con espacios si hacen falta. */
export function normalizarIniciales(texto) {
  return (texto || 'AAA')
    .toUpperCase()
    .replace(/[^A-Z ]/g, '')
    .padEnd(3, ' ')
    .slice(0, 3);
}

// ---------------------------------------------------------------------------
// Cola de envíos pendientes
// ---------------------------------------------------------------------------

function _leerCola() {
  try {
    const cola = JSON.parse(localStorage.getItem(CLAVE_COLA) || '[]');
    return Array.isArray(cola) ? cola.slice(0, 20) : [];
  } catch {
    return [];
  }
}

function _guardarCola(cola) {
  try {
    // slice(-20) y no slice(0,20): si hay que descartar, se descartan las
    // MÁS VIEJAS. Al contrario se tiraban las puntuaciones recién hechas.
    if (cola.length) localStorage.setItem(CLAVE_COLA, JSON.stringify(cola.slice(-20)));
    else localStorage.removeItem(CLAVE_COLA);
  } catch { /* modo privado */ }
}

function _encolar(fila) {
  const cola = _leerCola();
  cola.push(fila);
  _guardarCola(cola);
}

export function hayPendientes() {
  return _leerCola().length > 0;
}
