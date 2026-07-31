/**
 * MAIN — El arranque del juego.
 * =============================
 *
 * Crea las piezas compartidas (lienzo, reloj, controles, audio, fondo y
 * halos), registra las pantallas y arranca en la portada. Nada más: toda la
 * lógica vive en sus propios archivos.
 */

import { Lienzo } from './core/canvas.js';
import { Bucle } from './core/loop.js';
import { Entrada } from './core/input.js';
import { Audio } from './core/audio.js';
import { GestorEscenas } from './core/scenes.js';
import { Fondo } from './render/background.js';
import { Resplandor } from './render/glow.js';
import { Portada } from './scenes/title.js';
import { Partida } from './scenes/play.js';
import { PantallaAjustes } from './scenes/settings.js';
import { Ajustes } from './services/settings.js';
import {
  JUGADOR as COL_JUGADOR, DISPARO_JUGADOR, PELIGRO, ENEMIGOS,
} from './config/palette.js';

const lienzo = new Lienzo(document.getElementById('juego'));
const entrada = new Entrada(lienzo);
const audio = new Audio();

// El fondo y los halos son caros de preparar y los comparten todas las
// pantallas, así que se crean una sola vez aquí.
const fondo = new Fondo();
const resplandor = new Resplandor();
resplandor.precalentar([
  COL_JUGADOR.CIAN, DISPARO_JUGADOR.HALO, PELIGRO.PROYECTIL,
  ENEMIGOS.grano.cuerpo, ENEMIGOS.avispa.cuerpo, ENEMIGOS.cafetera.cuerpo,
]);

// Los ajustes se cargan antes que nada y se aplican en cuanto cambian.
const ajustes = new Ajustes();
ajustes.alCambiar = () => aplicarAjustes();

function aplicarAjustes() {
  audio.ponerVolumenes(
    ajustes.get('volumenGeneral') / 100,
    ajustes.get('volumenMusica') / 100,
    ajustes.get('volumenEfectos') / 100
  );
  entrada.sensibilidad = ajustes.get('sensibilidadTactil');
  // La velocidad reducida es la única opción que cambia la dificultad real,
  // así que se aplica al propio reloj del juego.
  bucle.escalaTiempo = ajustes.get('velocidadJuego');
}

const escenas = new GestorEscenas();
escenas.registrar('portada', new Portada(entrada, audio, fondo, resplandor, ajustes));
escenas.registrar('partida', new Partida(entrada, audio, fondo, resplandor, ajustes));
escenas.registrar('ajustes', new PantallaAjustes(entrada, audio, fondo, ajustes));

// El navegador prohíbe hacer sonar nada hasta que el jugador toca algo. En
// lugar de intentarlo y provocar un error en la consola, el motor de audio se
// enciende exactamente en el primer gesto.
entrada.alPrimerGesto = () => audio.despertar();

const bucle = new Bucle(
  (dt) => {
    escenas.actualizar(dt);
    // La congelación al destruir algo: unos milisegundos sin simular, pero
    // sin dejar de dibujar ni de animar la explosión. Es lo que hace que un
    // impacto se sienta como un golpe y no como un tirón.
    const ms = escenas.tomarCongelacion();
    if (ms > 0) bucle.congelar(ms);
  },
  () => escenas.dibujar(lienzo.ctx),
  (dt) => escenas.actualizarEfectos(dt)
);

// Al cambiar de pestaña o de aplicación, el juego se pone en pausa y espera.
// Nunca se reanuda solo: primero la cuenta atrás.
bucle.alPerderFoco = () => escenas.perderFoco();

aplicarAjustes();
escenas.ir('portada');
bucle.arrancar();

// El lienzo recibe el foco para que el teclado funcione desde el primer
// momento, sin tener que hacer clic antes.
lienzo.canvas.tabIndex = 0;
lienzo.canvas.focus();

// Acceso al estado del juego para poder comprobarlo durante el desarrollo.
// Solo se activa al ejecutar en local: en la web publicada no existe.
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  window.__juego = { lienzo, entrada, audio, escenas, fondo, resplandor, bucle };
}
