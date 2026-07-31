/**
 * ESCENAS — Qué pantalla está activa.
 * ===================================
 *
 * El juego tiene varias pantallas (portada, cómo jugar, partida) y solo una
 * puede estar activa a la vez. Este archivo es el interruptor.
 *
 * Es deliberadamente pequeño. Cada pantalla se ocupa de sí misma y no sabe
 * nada de las demás: solo pide "llévame a la portada" y este gestor se
 * encarga. Así se puede añadir una pantalla nueva sin tocar las existentes.
 */

export class GestorEscenas {
  constructor() {
    this.escenas = new Map();
    this.activa = null;
    this.nombreActivo = null;
  }

  registrar(nombre, escena) {
    this.escenas.set(nombre, escena);
    // Cada escena recibe la forma de cambiar de pantalla, sin necesitar
    // conocer al resto.
    escena.ir = (destino, datos) => this.ir(destino, datos);
  }

  ir(nombre, datos = null) {
    const siguiente = this.escenas.get(nombre);
    if (!siguiente) throw new Error(`No existe la pantalla "${nombre}"`);

    this.activa?.salir?.();
    this.activa = siguiente;
    this.nombreActivo = nombre;
    siguiente.entrar?.(datos);
  }

  actualizar(dt) {
    this.activa?.actualizar?.(dt);
  }

  /** Solo lo que debe seguir animándose durante la congelación de impacto. */
  actualizarEfectos(dt) {
    this.activa?.actualizarEfectos?.(dt);
  }

  dibujar(ctx) {
    this.activa?.dibujar?.(ctx);
  }

  perderFoco() {
    this.activa?.perderFoco?.();
  }

  tomarCongelacion() {
    return this.activa?.tomarCongelacion?.() ?? 0;
  }
}
