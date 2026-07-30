# Decisiones del proyecto

Este documento registra qué manda sobre qué y qué se ha decidido expresamente.
Si alguna vez hay dudas sobre cómo debe ser algo, se resuelven aquí.

---

## Jerarquía de documentos

| Documento | Papel |
|---|---|
| **`GAME_BIBLE.md`** | **Fuente de la verdad.** Números, fases, enemigos, jefe, pantallas, ajustes |
| `game-description.md` | Referencia de tono y espíritu: filosofía, dirección artística, la formación que «respira» |
| `ARTE.md` | Especificación visual: paleta, geometría de cada unidad, efectos |
| `UX.md` | Especificación de experiencia: pantallas, controles, tiempos, accesibilidad |

Cuando la biblia y el documento de descripción se contradicen, **manda la biblia**.
El documento de descripción se conserva porque contiene el alma del proyecto
(«cada muerte debe sentirse justa», las nebulosas de vapor, las galaxias de
granos de café) que la biblia no recoge.

---

## Contradicciones entre documentos, ya resueltas

| Punto | Descripción | Biblia | Decisión |
|---|---|---|---|
| Tecnología | — | Godot 4.x | **Web: HTML5 Canvas + JavaScript** |
| Enemigos | Scout, Hunter, Commander, Guardian | Grano, Avispa, Cafetera | **Los tres de la biblia** |
| Jefe | No existe | Gran Tostadora Cósmica | **Sí, cada 5 fases** |
| Rayo tractor y nave doble | Sí | No | **Fuera de la v1**, hueco preparado |
| Botón «Salir» del menú | — | Sí | **Sustituido por «Récords»** |
| Disparo | Pulsar repetidamente | Cadencia 0,22 s, máx. 2 | **Mantener pulsado** |

### Por qué no usamos Godot

La biblia lo recomienda, pero: no está instalado, requiere trabajar en un
editor visual, y su exportación a navegador pesa entre 15 y 30 MB y arranca
lento en móvil. Con web puro el juego abre al instante desde un enlace,
funciona en cualquier móvil y se despliega en Vercel sin configurar nada.
**Todo lo demás de la biblia se respeta al 100 %.**

### Por qué no hay que machacar el botón de disparo

En el Galaga original machacar no daba ninguna ventaja: el límite real era el
**máximo de 2 balas en pantalla**, que la biblia también fija. Esa tensión de
recurso se conserva íntegra manteniendo pulsado. Exigir machaqueo solo añade
dolor de muñeca en partidas largas, sin aportar ninguna habilidad medible, y
contradice la filosofía de «cada muerte debe sentirse justa».

Existen los tres modos en Ajustes (mantenido, pulsado, automático). Los tres
tienen la misma cadencia máxima, así que **ninguno da ventaja y los tres valen
para el ranking mundial**.

---

## Decisiones de producto

- **Dispositivos:** ordenador (teclado y mando) y móvil (táctil). Ambos de primera.
- **Estilo visual:** neo-arcade, todo dibujado por código. Sin imágenes ni fuentes descargadas.
- **Sonido:** generado con Web Audio. Sin archivos de audio.
- **Idioma en pantalla:** español. El título se queda en inglés.
- **Dificultad:** las 3 primeras fases perdonan más, para enganchar a quien
  abre el enlace por primera vez. Después sube en serio.
- **Puntuaciones:** récord local primero; ranking mundial con Supabase en la fase 6.
- **Propósito:** portfolio. Código limpio, comentado en español y documentado.

## Decisiones de accesibilidad

- **Vida del jefe:** sin barra. El daño se ve en su propio cuerpo, que es donde
  el jugador ya está mirando. Cambio visible cada 6 impactos.
- **Modo lento al 85 %:** disponible, marcado como partida asistida y **fuera del
  ranking mundial**. Es la única opción que cambia la dificultad real.
- **El resto de opciones de accesibilidad puntúan con total normalidad.** Una
  opción de accesibilidad que te expulsa del ranking no es accesibilidad.

---

## Reglas técnicas innegociables

1. **Ningún número mágico fuera de `src/config/`.** Si aparece un `0.85` suelto
   en la lógica, es un error de diseño.
2. **El rosa magenta `#FF2D6F` está reservado** a lo que puede matarte. No
   aparece en fondos, HUD, explosiones ni en el cuerpo en reposo de ningún
   enemigo.
3. **Ninguna información se codifica solo con color.** Silueta, tamaño, ritmo y
   forma llevan la información; el color la refuerza.
4. **Los proyectiles enemigos son lo último que se dibuja.** Solo el HUD va por
   encima. Ningún efecto puede tapar una amenaza.
5. **El juego piensa 60 veces por segundo exactas**, independientemente del
   dispositivo. Es lo que hace que los patrones sean aprendibles y que el
   ranking compare partidas comparables.
6. **Nombres de archivo siempre en minúsculas.** Windows no distingue mayúsculas
   pero el servidor de Vercel sí: un `import './Player.js'` funcionaría en local
   y rompería en producción.
