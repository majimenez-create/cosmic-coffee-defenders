/**
 * AJUSTES — Las preferencias del jugador.
 * =======================================
 *
 * Se guardan en el navegador y se aplican en cuanto se cambian.
 *
 * PRINCIPIO QUE MANDA AQUÍ
 * Todas las opciones de accesibilidad puntúan con total normalidad en el
 * ranking. Una opción de accesibilidad que te expulsa de la competición no es
 * accesibilidad: es un castigo con buenas intenciones.
 *
 * La única excepción es la velocidad reducida, porque cambia la dificultad
 * real del juego y no solo su presentación. Esa marca la partida como asistida,
 * se avisa con claridad antes de activarla, y sin tono culpabilizador.
 */

import { AJUSTES_POR_DEFECTO, MODO_DISPARO, ASISTENCIA, TACTIL } from '../config/balance.js';

const CLAVE = 'ccd_ajustes';

/** Cada opción, con sus valores posibles y cómo se lee en pantalla. */
export const OPCIONES = [
  {
    id: 'volumenGeneral', nombre: 'VOLUMEN GENERAL',
    tipo: 'porcentaje', paso: 10,
  },
  {
    id: 'volumenMusica', nombre: 'MÚSICA',
    tipo: 'porcentaje', paso: 10,
  },
  {
    id: 'volumenEfectos', nombre: 'EFECTOS',
    tipo: 'porcentaje', paso: 10,
  },
  {
    id: 'modoDisparo', nombre: 'DISPARO',
    tipo: 'lista',
    valores: [MODO_DISPARO.MANTENIDO, MODO_DISPARO.PULSADO, MODO_DISPARO.AUTOMATICO],
    etiquetas: ['MANTENIDO', 'PULSADO', 'AUTOMÁTICO'],
    ayuda: 'Los tres disparan igual de rápido',
  },
  {
    id: 'sensibilidadTactil', nombre: 'SENSIBILIDAD TÁCTIL',
    tipo: 'lista',
    valores: [TACTIL.SENSIBILIDADES.preciso, TACTIL.SENSIBILIDADES.normal, TACTIL.SENSIBILIDADES.rapido],
    etiquetas: ['PRECISA', 'NORMAL', 'RÁPIDA'],
  },
  {
    id: 'sacudidaPantalla', nombre: 'TEMBLOR DE PANTALLA',
    tipo: 'interruptor',
  },
  {
    id: 'reducirDestellos', nombre: 'REDUCIR DESTELLOS',
    tipo: 'interruptor',
    ayuda: 'Nada parpadea más de 3 veces por segundo',
  },
  {
    id: 'altoContraste', nombre: 'ALTA LEGIBILIDAD',
    tipo: 'interruptor',
    ayuda: 'Proyectiles más grandes y con más tiempo de aviso',
  },
  {
    id: 'velocidadJuego', nombre: 'VELOCIDAD DEL JUEGO',
    tipo: 'lista',
    valores: [1.0, ASISTENCIA.VELOCIDAD_LENTA],
    etiquetas: ['NORMAL', '85 % · ASISTIDA'],
    ayuda: 'La partida asistida no entra en el ranking',
  },
];

export class Ajustes {
  constructor() {
    this.valores = { ...AJUSTES_POR_DEFECTO };
    this._cargar();
    this._aplicarPreferenciasDelSistema();
    this.alCambiar = null;
  }

  _cargar() {
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE) || '{}');
      for (const clave of Object.keys(AJUSTES_POR_DEFECTO)) {
        if (guardado[clave] !== undefined) this.valores[clave] = guardado[clave];
      }
    } catch {
      // Si el guardado está corrupto o el navegador lo prohíbe, se juega con
      // los valores por defecto. El juego nunca falla por esto.
    }
  }

  /**
   * Si el sistema operativo pide movimiento reducido, se respeta. Pero solo la
   * PRESENTACIÓN: nunca se toca la velocidad de los enemigos ni de los
   * proyectiles, porque eso cambiaría el juego, no su aspecto.
   */
  _aplicarPreferenciasDelSistema() {
    try {
      if (this._yaGuardado) return;
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        this.valores.sacudidaPantalla = false;
        this.valores.reducirDestellos = true;
        this.movimientoReducidoDetectado = true;
      }
    } catch { /* navegador sin matchMedia */ }
  }

  get _yaGuardado() {
    try {
      return localStorage.getItem(CLAVE) !== null;
    } catch {
      return false;
    }
  }

  guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(this.valores));
    } catch { /* modo privado: se mantiene solo en memoria */ }
  }

  get(id) {
    return this.valores[id];
  }

  /** @param {1|-1} direccion */
  cambiar(id, direccion) {
    const opcion = OPCIONES.find((o) => o.id === id);
    if (!opcion) return;

    if (opcion.tipo === 'interruptor') {
      this.valores[id] = !this.valores[id];
    } else if (opcion.tipo === 'porcentaje') {
      const nuevo = this.valores[id] + direccion * opcion.paso;
      this.valores[id] = Math.max(0, Math.min(100, nuevo));
    } else if (opcion.tipo === 'lista') {
      const actual = opcion.valores.indexOf(this.valores[id]);
      const indice = (actual + direccion + opcion.valores.length) % opcion.valores.length;
      this.valores[id] = opcion.valores[indice];
    }

    this.guardar();
    this.alCambiar?.(id, this.valores[id]);
  }

  /** Cómo se lee el valor actual en la pantalla de ajustes. */
  textoDe(id) {
    const opcion = OPCIONES.find((o) => o.id === id);
    const valor = this.valores[id];

    if (opcion.tipo === 'interruptor') return valor ? 'SÍ' : 'NO';
    if (opcion.tipo === 'porcentaje') return valor + ' %';
    const indice = opcion.valores.indexOf(valor);
    return opcion.etiquetas[indice] ?? String(valor);
  }

  /** ¿Esta partida cuenta para el ranking mundial? */
  get puntuaValida() {
    return this.valores.velocidadJuego === 1.0;
  }
}
