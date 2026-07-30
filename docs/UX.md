# Especificación de experiencia

Todo en píxeles del lienzo lógico de **360 × 640**, salvo donde diga «CSS px»
(tamaño físico real, que es lo que importa para los objetivos táctiles).

---

## Cinco reglas de oro

**1. La entrada manda sobre todo lo demás.** Se lee cada fotograma y se aplica en
ese mismo fotograma: cero inercia, cero suavizado, cero zonas muertas. Ninguna
animación puede quitarle el control al jugador sin haberlo anunciado antes.

**2. Nada mata sin avisar, y toda muerte deja rastro.** Todo ataque se telegrafía
con 400 ms como mínimo y por al menos dos canales. Ningún enemigo o proyectil
aparece dentro del tercio inferior. Y al morir, **lo que te ha matado se queda
visible y marcado 400 ms**.

**3. Los efectos nunca compiten con la información.** Si hay que elegir entre
espectáculo y legibilidad, gana la legibilidad, siempre.

**4. Ninguna información existe en un solo canal.** Nunca solo color, nunca solo
sonido, nunca solo parpadeo. Y todo efecto intenso es desactivable sin que el
jugador pierda información ni quede fuera del ranking.

**5. Volver a jugar cuesta una pulsación y menos de un segundo.** Cualquier menú
intermedio entre el jugador y la siguiente partida es un fallo de diseño.

---

## Por qué el lienzo es fijo

Habrá ranking mundial. Si el área jugable cambiara de proporción según el
dispositivo, la dificultad cambiaría (más ancho = más sitio para esquivar) y el
ranking dejaría de tener sentido. **Lienzo fijo = todos juegan la misma partida.**

Lo que sobra a los lados no son barras negras: el campo de estrellas se dibuja
por detrás a pantalla completa y el área de juego lleva un marco interior de
1 px. Parece el cristal de una recreativa, no un error de escala.

---

## Mapa de pantallas

```
CARGA
  └─> PORTADA ──(Cómo jugar)──> AYUDA ──> PORTADA
        │      ──(Ajustes)─────> AJUSTES ──> PORTADA
        │      ──(Récords)─────> TABLA ──> PORTADA
        └─(empezar)─> PARTIDA
                        ├─ INTRO_FASE
                        ├─ ENTRADA (coreografía)
                        ├─ COMBATE  <──┐
                        ├─ MUERTE ─> REAPARICIÓN ─┘
                        ├─ FIN_OLEADA ─> INTRO_FASE
                        ├─ BONUS ─> RESULTADO_BONUS ─> INTRO_FASE
                        ├─ PAUSA (superpuesta)
                        └─ ULTIMA_MUERTE ─> GAME_OVER
                                              ├─(si entra en el top 10)─> INICIALES ─> TABLA
                                              └─ RESULTADO ─┬─> PARTIDA (reintentar)
                                                            └─> PORTADA
```

**Portada.** Título respirando muy despacio, récord, «PULSA PARA EMPEZAR»
parpadeando, recordatorio de controles según el dispositivo, y tres botones
secundarios: `CÓMO JUGAR` · `AJUSTES` · `RÉCORDS`. Sin demo automática.

**De la portada a tener el control: 400 ms como máximo.** Este número es sagrado.

**Intro de fase.** `FASE 1` centrado, 1300 ms en total. Pero **los enemigos empiezan
a entrar en el milisegundo cero**, superpuestos al texto: no hay ni un solo
fotograma de pantalla vacía, y el jugador tiene control desde el principio.

**Fin de oleada.** Panel de 1800 ms con `OLEADA 3 DESPEJADA` y **`PUNTERÍA 42/61 ·
69 %`**. La puntería es el gancho de rejugabilidad de Galaga y cuesta tres líneas
de código: se mide y se muestra.

**Bonus.** Antes: `FASE ESPECIAL · SIN DISPAROS ENEMIGOS` durante 1200 ms. Decir
explícitamente que no te pueden matar es lo que hace que el jugador se relaje y
disfrute la coreografía. Al terminar: `¡PERFECTO! +5.000` o el recuento. Sin
castigo, sin «has fallado».

**Pausa.** Al continuar, **cuenta atrás 3 · 2 · 1** con la acción ya visible pero
congelada. Nunca se reanuda de golpe.

**Game over.** Explosión → 800 ms de negro con solo las estrellas → `GAME OVER`
entrando con escala → panel con puntuación, récord, oleada alcanzada y puntería.
Botón grande `JUGAR OTRA VEZ`.

**Búfer de entrada.** En toda transición, cualquier pulsación durante el fundido
**se encola** y se aplica al terminar: quien pulsa rápido nunca se queda comiendo
pulsaciones. Única excepción: los primeros 400 ms del game over ignoran la
entrada, para que nadie se salte su propia puntuación por estar machacando.

---

## Perder una vida — secuencia exacta

| t (ms) | Qué pasa |
|---:|---|
| 0 | Impacto. Congelación de 90 ms. **Lo que te ha matado se pinta con contorno rojo y se mantiene visible 400 ms** aunque debiera desaparecer |
| 0–60 | Destello blanco al 25 % (0 % si «reducir destellos») |
| 90–340 | Sacudida de pantalla, 6 px decayendo |
| 90–790 | Explosión de porcelana y café |
| 300 | El HUD retira un icono de vida parpadeando 3 veces: que se vea la resta |
| 400–900 | **Todos los enemigos en picado abortan y vuelven a formación. Los proyectiles enemigos se apagan en 200 ms** (no desaparecen de golpe) |
| 900 | La taza reaparece **siempre en x=180**, previsible, entrando desde abajo |
| 1200 | Vuelve el control. Invulnerabilidad 1500 ms: parpadeo **y** anillo que se contrae marcando el tiempo restante |
| 2700 | El anillo estalla con destello y sonido. Los ataques se reanudan 300 ms después |

Nunca se reanuda la invulnerabilidad en silencio: el jugador debe **ver y oír**
que vuelve a ser vulnerable.

---

## Los primeros 30 segundos

Cero tutorial modal. Los avisos solo aparecen en las **3 primeras partidas**
(contador guardado en el navegador) y se cancelan al cumplir su objetivo.

- **En la portada** ya se dibujan las teclas `[←] [→]` con «MOVER» y `[ESPACIO]`
  con «DISPARAR», o el icono de arrastre en móvil. Esto ya enseña el juego antes
  de empezar.
- **t = 400 ms:** bajo la taza, `◀ MOVER ▶`. Desaparece a los 60 px de
  desplazamiento o a los 5 s.
- **Después:** `DISPARA [ESPACIO]`. Desaparece al primer disparo. En móvil no
  aparece nunca porque el disparo es automático; en su lugar, `DISPARO
  AUTOMÁTICO` durante 1800 ms.
- **t ≈ 3 s:** primer picado, telegrafiado 700 ms (en vez de 450) durante las
  oleadas 1–3, y con una línea guía vertical que marca la columna del atacante.

Ningún aviso ocupa más de 20 px de alto. **Si un enemigo o proyectil se acerca a
menos de 80 px de un aviso, el aviso baja al 20 % de opacidad.** Nunca un cartel
puede participar en tu muerte.

---

## Controles

### Teclado

| Acción | Teclas |
|---|---|
| Mover | `←` `→`, `A` `D`, `J` `L` |
| Disparar | `Espacio`, `↑`, `W`, `Z` |
| Pausa | `P` (principal), `Esc` |
| Silenciar | `M` |
| Pantalla completa | `F` |

Se usa **`event.code`, nunca `event.key`**: con `event.key`, un teclado francés
AZERTY o un Dvorak rompería el WASD.

**Izquierda y derecha a la vez:** gana la última pulsada. No se cancelan entre sí
(eso produce paradas fantasma que el jugador percibe como fallo del juego) ni
gana siempre la izquierda (asimetría injusta).

**Conflicto de `Esc`:** en pantalla completa, el navegador se queda con esa tecla
y el juego nunca la recibe. Por eso `P` es la principal, y además el juego
**pausa automáticamente al salir de pantalla completa**: quien pulsa `Esc`
esperando pausar obtiene una pausa igualmente.

**Búfer de disparo de 120 ms:** si pulsas justo antes de que la cadencia se
libere, el disparo sale en cuanto puede en vez de perderse. Es invisible y hace
que el arma se sienta obediente.

### Táctil — arrastre relativo

Se descartaron tres alternativas:
- **Arrastre absoluto** (la taza va donde tocas): al tocar, la taza se
  teletransporta al dedo. Muerte garantizada al recolocar el dedo.
- **Zona táctil dedicada:** desperdicia 100 px de pantalla y el control se pierde
  si el dedo se sale de la zona en mitad de un esquive.
- **Botones virtuales:** sin bordes que sentir, el pulgar se desliza fuera; y la
  velocidad fija impide microajustes.

**Cómo funciona el elegido:** al tocar, la taza **no se mueve ni un píxel**. Se
guarda dónde está el dedo y dónde está la taza. A partir de ahí, la taza se
mueve lo mismo que el dedo. Al levantar, se queda donde está.

Detalles que marcan la diferencia:
- **Reanclaje automático:** si la taza está pegada a un borde y el dedo sigue
  empujando, se reajusta el ancla para que el gesto de vuelta responda al
  instante. Sin esto, el control «se siente roto».
- **Herencia de dedo:** si levantas un dedo mientras hay otro apoyado, ese otro
  hereda el control sin salto. El jugador puede «caminar» con los dedos por la
  pantalla indefinidamente. Solo es posible con arrastre relativo, y es la razón
  principal para elegirlo.
- **El dedo nunca tapa la nave** porque el control es relativo: el pulgar se
  apoya donde resulta cómodo, normalmente por debajo de la taza. En las dos
  primeras partidas se sugiere una banda con `ARRASTRA AQUÍ`, que es sugerencia,
  no obligación.

**Disparo en móvil: automático permanente.** La única habilidad que importa en un
fixed shooter táctil es el posicionamiento. Pedir un segundo pulgar significa
tapar más pantalla y añadir una fuente de error sin ninguna decisión interesante
detrás: el jugador quiere disparar el 100 % del tiempo. El límite de 2 balas
sigue haciendo el trabajo de «no dispares a lo loco».

### Mando

Se detecta al conectarse y se avisa con `MANDO CONECTADO` durante 1,5 s. Cruceta
o stick izquierdo para mover (zona muerta 0,25), botón principal para disparar,
Start para pausar.

---

## HUD

| Elemento | Dónde | Prioridad |
|---|---|---:|
| **Puntuación** | Arriba izquierda, etiqueta de 8 px sobre valor de 16 px | 1 |
| **Vidas** | **Abajo** izquierda, tazas de 14 px | 2 |
| **Récord** | Arriba centro, más pequeño y en ámbar | 3 |
| **Fase** | Abajo derecha | 4 |

La mirada del jugador vive en el tercio inferior central. La puntuación va
arriba porque se consulta poco durante la acción y mucho al morir. **Las vidas
van abajo**, en periferia cercana, porque es lo que más se comprueba de reojo.

**La puntuación no salta de golpe:** cuenta hacia el valor real a 3000 puntos por
segundo con un pequeño pop.

**Los puntos flotantes solo aparecen cuando aportan información:** `+200` para
enemigos abatidos **en picado** (valen el doble, hay que enseñarlo), para el bonus
y para el jefe. Los abatidos en formación no generan texto: sería ruido en el
80 % de las muertes.

**Qué no se muestra nunca:** FPS, reloj, temporizador de oleada, barra de vida del
jugador, munición, combo, minimapa, número de enemigos restantes, logros, botones
de redes sociales.

> Regla para futuras peticiones: **si un elemento no cambia la decisión que el
> jugador tomará en los próximos 3 segundos, no va en el HUD.**

**Canvas o HTML:** el HUD en partida va en canvas (debe estar sincronizado con el
fotograma; en HTML iría uno o dos fotogramas por detrás). Los menús, pausa,
ajustes, game over y entrada de iniciales van en HTML superpuesto, porque así se
obtienen gratis el foco de teclado, `Tab`, los lectores de pantalla y los
objetivos táctiles de 48 px.

---

## Telegrafiado y juego limpio

- **450 ms antes** de que un enemigo salga de formación: dos destellos blancos,
  crece un 8 % y desciende 4 px como tomando impulso. En las oleadas 1–3 son
  700 ms más una línea vertical tenue marcando su columna.
- Sonido distinto por tipo de enemigo: un jugador experto debe poder **esquivar
  de oído**.
- Nunca más de 5 atacando a la vez, y **nunca dos telegrafiados en el mismo
  fotograma**: se escalonan 120 ms para que sean legibles por separado.
- Los proyectiles enemigos avisan con una chispa en el origen 150 ms antes.
- **Velocidad máxima absoluta de un proyectil: 300 px/s**, pase lo que pase con el
  escalado de dificultad. A esa velocidad tarda 1,7 s en cruzar la pantalla:
  siempre esquivable.
- Ningún proyectil ni enemigo aparece dentro del tercio inferior ni a menos de
  180 px del jugador.
- **Últimos 2 enemigos:** se aceleran un 20 % (herencia de Galaga). Hay que
  comunicarlo con un pulso visual y un cambio de tono, o parece un fallo.
- **Silencio útil:** entre la última explosión de una oleada y el cartel de la
  siguiente hay 400 ms sin nada. El juego necesita respirar o todo el resto de
  retroalimentación pierde valor.

---

## Accesibilidad

| Opción | Valores | Por defecto |
|---|---|---|
| Reducir destellos | Sí / No | No (Sí si el sistema lo pide) |
| Sacudida de pantalla | Sí / No | Sí |
| Alta legibilidad de proyectiles | Sí / No | No |
| Modo de disparo | Mantenido / Pulsado / Automático | Mantenido (Automático en táctil) |
| Sensibilidad táctil | 0,75 / 1,0 / 1,4 | 1,0 |
| Volumen general / música / efectos | 0–100 | 80 / 50 / 80 |
| Tamaño del HUD | Normal / Grande | Normal |
| Velocidad de juego | 100 % / 85 % | 100 % |

- **Reducir destellos** garantiza que nada parpadee por encima de **3 Hz**, que es
  el umbral de seguridad fotosensitiva. El parpadeo de invulnerabilidad baja de
  8 a 2,5 Hz y se compensa con el anillo.
- **Velocidad 85 %** es la única opción que cambia la dificultad real: marca la
  partida como asistida y no entra en el ranking mundial. Se avisa antes de
  activarla, con claridad y sin tono culpabilizador.
- **Todas las demás opciones puntúan con normalidad.** Una opción de
  accesibilidad que te expulsa del ranking no es accesibilidad.
- **La pausa está siempre disponible.** Si se pide durante una animación de
  muerte, se encola y se ejecuta en cuanto es posible; nunca se descarta.
- **Nunca se reduce el movimiento de la jugabilidad** (velocidades de enemigos o
  proyectiles) por `prefers-reduced-motion`: eso cambiaría el juego, no la
  presentación.

**Sonido en el primer arranque.** Los navegadores bloquean el audio hasta que hay
un gesto del usuario. Por eso el motor de audio **no se crea al cargar la
página**, sino en el primer gesto real, que en la práctica es el «pulsa para
empezar». Cero errores en consola. La música arranca al 50 %: un juego que
arranca a todo volumen se cierra. Y **ninguna información existe solo en el
canal de audio**: quien juegue sin sonido recibe exactamente lo mismo.

---

## Casos límite

| Caso | Comportamiento |
|---|---|
| **Girar el móvil a horizontal** | Se pausa y se ofrecen dos botones: `CONTINUAR ASÍ` y `SEGUIR` (que se activa al volver a vertical). Nunca una pantalla muerta que solo dice «gira el móvil»: hay gente con la rotación bloqueada por accesibilidad |
| **Perder el foco** (cambiar de pestaña o de app) | Pausa en el mismo fotograma y audio a cero. **Nunca se reanuda automáticamente:** el jugador continúa cuando quiere, y entonces sale la cuenta atrás |
| **Volver de segundo plano** | El tope de 5 pasos por fotograma impide el salto de varios segundos de simulación. Es el fallo número uno de los juegos web |
| **Pantallas muy anchas** | Escala con tope de 3× y el sobrante se rellena con el mismo campo de estrellas. Nada animado en los laterales: competiría con la acción |
| **Móviles muy alargados** | Se aprovechan las franjas para mover el HUD fuera del área de juego. El campo queda completamente limpio: es el mejor caso posible |
| **Recargar a mitad de partida** | No se guarda la partida: es un arcade. Pero **el récord se guarda en el instante en que se supera**, no al morir, así que una recarga accidental nunca cuesta el récord |
| **Modo privado / sin almacenamiento** | El juego nunca falla por esto. Aviso pequeño: `EL RÉCORD NO SE GUARDARÁ EN ESTE NAVEGADOR` |
| **Rendimiento bajo** | Degradación automática y silenciosa de efectos. **Nunca se reduce la velocidad del juego** ni se saltan pasos de lógica |
| **Ranking caído o sin conexión** | El juego es 100 % jugable sin red. El envío queda en cola y se reintenta |
| **Teclas pulsadas al perder el foco** | Se vacía el estado de teclas. Si no, la taza se queda «atascada» moviéndose sola al volver |
