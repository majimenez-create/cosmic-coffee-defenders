/**
 * MAIN — El arranque del juego.
 * =============================
 *
 * Crea el lienzo, los controles, el audio y la partida, y los conecta al
 * reloj. Nada más: toda la lógica vive en sus propios archivos.
 */

import { Lienzo } from './core/canvas.js';
import { Bucle } from './core/loop.js';
import { Entrada } from './core/input.js';
import { Audio } from './core/audio.js';
import { Partida } from './scenes/play.js';

const lienzo = new Lienzo(document.getElementById('juego'));
const entrada = new Entrada(lienzo);
const audio = new Audio();
const partida = new Partida(entrada, audio);

// El navegador prohíbe hacer sonar nada hasta que el jugador toca algo. En
// lugar de intentarlo y provocar un error en la consola, el motor de audio se
// enciende exactamente en el primer gesto.
entrada.alPrimerGesto = () => {
  audio.despertar();
  audio.arrancarMusica();
};

const bucle = new Bucle(
  (dt) => {
    partida.actualizar(dt);
    // La congelación al destruir algo: unos milisegundos sin simular, pero
    // sin dejar de dibujar ni de animar la explosión. Es lo que hace que un
    // impacto se sienta como un golpe y no como un tirón.
    const ms = partida.tomarCongelacion();
    if (ms > 0) bucle.congelar(ms);
  },
  () => partida.dibujar(lienzo.ctx),
  (dt) => partida.actualizarEfectos(dt)
);

// Al cambiar de pestaña o de aplicación, el juego se pone en pausa y espera.
// Nunca se reanuda solo: primero la cuenta atrás.
bucle.alPerderFoco = () => partida.perderFoco();

bucle.arrancar();

// El lienzo recibe el foco para que el teclado funcione desde el primer
// momento, sin tener que hacer clic antes.
lienzo.canvas.tabIndex = 0;
lienzo.canvas.focus();

// Acceso al estado del juego para poder comprobarlo durante el desarrollo.
// Solo se activa al ejecutar en local: en la web publicada no existe.
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  window.__juego = { lienzo, entrada, audio, partida, bucle };
}
