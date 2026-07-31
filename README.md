# Cosmic Coffee Defenders

Un arcade espacial en el que una taza de café defiende el núcleo energético del
universo. Oleadas infinitas, tres vidas, un impacto y mueres.

**Fácil de entender en treinta segundos. Difícil de dominar en cientos de partidas.**

> 🎮 **Estado: terminado.** Juego completo con oleadas infinitas, fase de
> bonificación, jefe, sonido, ajustes de accesibilidad y ranking mundial.

---

## Qué es

Un *fixed shooter* de la escuela de las recreativas de los ochenta, con temática
de café. La taza se mueve solo horizontalmente por el tercio inferior y dispara
hacia arriba. Los enemigos entran por trayectorias curvas coreografiadas, forman
una escuadra que respira, y salen en picado a atacar.

No hay árboles de habilidades, ni mejoras permanentes, ni inventario. Cada
partida empieza de cero. Todo depende de la habilidad del jugador.

## Cómo se juega

| | Ordenador | Móvil | Mando |
|---|---|---|---|
| Mover | `←` `→` o `A` `D` | Arrastra el dedo | Cruceta o stick |
| Disparar | `Espacio` (mantenido) | Automático | Botón principal |
| Pausa | `P` | Botón de pausa | Start |

Y en la portada: `H` cómo jugar · `O` ajustes · `R` récords · `M` silenciar.

---

## Cómo está hecho

**HTML5 Canvas y JavaScript, sin nada más.** Sin librerías, sin dependencias, sin
compilación. El navegador abre los archivos tal cual y el juego funciona.

Todo lo que se ve está dibujado por código: no hay ni una sola imagen. Los
sonidos se generan en el navegador: no hay ni un solo archivo de audio.

### Estructura

```
index.html          La página. Es lo único que abre el navegador
style.css           Centra el lienzo y desactiva los gestos del navegador
docs/               Documentos de diseño y decisiones del proyecto
src/
  config/           TODOS los números y colores. Se ajusta el juego desde aquí
  core/             El motor: lienzo, reloj, controles, sonido, estados
  game/             Las reglas: jugador, enemigos, formación, curvas, jefe
  render/           Lo que se ve: formas, brillos, estrellas, HUD, texto
  scenes/           Las pantallas: menú, partida, pausa, bonus, game over
  services/         Guardado del récord y ranking online
```

### Dos decisiones que explican el resto

**El juego piensa exactamente 60 veces por segundo**, da igual la potencia del
dispositivo. Los patrones de ataque tienen que ser aprendibles, y eso solo se
cumple si una coreografía recorre siempre el mismo camino en un móvil viejo y
en un ordenador rápido. También hace que el ranking mundial compare partidas
comparables.

**Todo se dibuja sobre un lienzo fijo de 360 × 640** que se amplía hasta llenar la
pantalla sin recortar nunca nada. Si el área jugable cambiara de proporción
según el dispositivo, la dificultad cambiaría con ella.

---

## Ejecutarlo en local

El juego usa módulos de JavaScript, y por seguridad los navegadores **no los
cargan al abrir el archivo con doble clic**. Hace falta servirlo:

- **La forma más simple:** usar la dirección publicada. Cada cambio se despliega
  automáticamente.
- **En VS Code:** extensión *Live Preview* o *Live Server*, botón derecho sobre
  `index.html` → abrir con Live Server.
- **Con Python instalado:**

```bash
python -m http.server 8000
```

y abrir `http://localhost:8000`.

---

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/GAME_BIBLE.md`](docs/GAME_BIBLE.md) | **Fuente de la verdad.** Números, fases, enemigos, jefe |
| [`docs/DECISIONES.md`](docs/DECISIONES.md) | Qué manda sobre qué y qué se decidió expresamente |
| [`docs/ARTE.md`](docs/ARTE.md) | Paleta, geometría de cada unidad, efectos, reglas visuales |
| [`docs/UX.md`](docs/UX.md) | Pantallas, controles, tiempos, HUD, accesibilidad |

---

## Hoja de ruta

- [x] **Fase 0** — Cimientos: estructura, configuración y despliegue
- [x] **Fase 1** — Se puede jugar: mover, disparar, destruir, morir, puntuar
- [x] **Fase 2** — Se siente como Galaga: curvas, formación que respira, picados
- [x] **Fase 3** — Identidad: la taza, los enemigos, el fondo, el sonido, los menús
- [x] **Fase 4** — Ciclo completo: fase bonus y la Gran Tostadora Cósmica
- [x] **Fase 5** — Pulido: ajustes, mando, accesibilidad y equilibrado
- [x] **Fase 6** — Ranking mundial

### Cuándo estará terminado

Cuando se pueda jugar con teclado, mando y dedos; existan los tres enemigos y el
jefe; funcionen el ciclo de cinco fases, las vidas, la puntuación y el récord;
haya menú, pausa, ajustes y game over; se mantengan 60 fps en un móvil normal; y
no quede ni un aviso en la consola del navegador.

Y un criterio que no está en ninguna lista pero es el que de verdad importa:
**que al perder te den ganas de darle otra vez.**
