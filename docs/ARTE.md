# Especificación visual

Estilo: **neo-arcade**. Geometría limpia, neón cálido, cero ruido.
Todo se dibuja por código sobre un lienzo de **360 × 640**. Sin imágenes.

Los colores exactos viven en `src/config/palette.js`. Aquí está el **cómo** y el
**por qué**: las formas, los ritmos y las reglas.

---

## Reglas de oro

**1. El canal de peligro es exclusivo.** `#FF2D6F` pertenece únicamente a lo que
puede matarte: proyectiles enemigos, marcas de trayectoria y el aviso de vida
perdida. No aparece en fondos, HUD, explosiones ni en el cuerpo en reposo de
ningún enemigo. Si mañana hace falta un color nuevo, se saca de cualquier sitio
menos de aquí.

**2. Silueta primero, color después.** Antes de dar por bueno cualquier elemento,
dibújalo relleno de negro puro sobre blanco a 24 px. Si no se distingue de los
otros, el problema es la forma. Un jugador daltónico debe poder jugar sin
ninguna adaptación.

**3. El fondo nunca supera el 18 % de luminancia ni los 8 px/s.** Si durante una
oleada el jugador **nota** el fondo, el fondo ha ganado y el juego ha perdido. La
espectacularidad va en las explosiones y en el movimiento de la formación,
nunca en el decorado.

**4. Cada efecto tiene presupuesto y se degrada, nunca se rompe.** Cuando el
fotograma se alarga se recorta en este orden: bloom → resplandor del fondo →
nebulosas → partículas secundarias → resplandor de enemigos. El jugador, los
proyectiles y los anillos de choque no se recortan jamás.

**5. Nada tapa un proyectil.** Orden de dibujo obligatorio:
`fondo → viñeta → vapor → enemigos → jugador → partículas → disparos del
jugador → disparos enemigos → destellos → HUD`.

---

## Por qué los disparos enemigos nunca se confunden

La separación no se apoya en el color, sino en **seis canales a la vez**:

| Canal | Disparo del jugador | Disparo enemigo |
|---|---|---|
| Tono | Ámbar, 40° | Magenta, 340° |
| Forma | Cápsula 3 × 12 px | Rombo 7 × 7 px con contorno oscuro |
| Proporción | 4,0 | 1,0 |
| Dirección | Siempre sube | Siempre baja |
| Animación | Estable | Pulsa a 8 Hz y rota 180°/s |
| Luminancia | 0,688 | 0,243 |

En escala de grises, el disparo del jugador es **dos veces y media más brillante**
que el enemigo. Un jugador daltónico los distingue por brillo y por forma.

Tres salvaguardas: el magenta está reservado; el proyectil enemigo lleva
contorno de 1 px `#2A0010` que lo separa de explosiones doradas y nebulosas; y
se dibuja el último de todo.

**Modo alto contraste:** el proyectil enemigo pasa a 9 × 9 px, gana anillo blanco
de 1,5 px, y todos los enemigos bajan un 40 % de saturación para que solo la
amenaza esté saturada.

---

## El jugador — la taza

**30 × 34 px.** Origen en el centro de la base. Nunca rota.
De atrás hacia delante:

1. **Plato/alerón** — trapecio invertido `(-15,12) (15,12) (9,17) (-9,17)`, esquinas
   de 2 px. Da anchura y lectura de nave estable.
2. **Propulsores** — dos rectángulos de 4 × 5 px en `(±7,15)`. Llama triangular de
   5 px de ancho, altura oscilante 4–9 px a 20 Hz.
3. **Cuerpo** — trapecio `(-11,-6) (11,-6) (7,12) (-7,12)`, radio 3 px. Degradado
   **horizontal** de 4 paradas con la parada blanca **descentrada al 25 %**. Esa
   parada descentrada es lo único que convierte un trapecio plano en un
   cilindro cerámico: es el truco más importante del sprite.
4. **Asa a la derecha** — `arc(11, 2, 6, -1.15, 1.15)`, grosor 3. El asa es el
   único signo que dice «taza» de forma inequívoca a 34 px.
5. **Ala izquierda** — el mismo arco espejado y recortado, en cian. Equilibra la
   masa visual: la asimetría se lee como intencional, no como error.
6. **Labio de la taza (el cañón)** — elipse `rx 11 · ry 3.5` blanca; dentro, elipse
   de café oscuro y un creciente de crema. **Ese óvalo oscuro arriba es lo que
   hace que se lea como taza aunque se vea de reojo.**
7. **Núcleo de energía** — rombo de 5 × 7 px cian emergiendo del café, pulsando a
   2 Hz. De aquí salen los disparos.
8. **Banda técnica** — franja ámbar de 3 px con dos remaches cian. Es el detalle
   «cafetera de alta gama» y ancla la lectura de máquina, no de vajilla.
9. **Vapor en reposo** — 2–3 partículas/s, ascienden 18 px/s con deriva senoidal.
   Se dibujan **detrás** de la taza.

**Animaciones:** retroceso de 2 px al disparar (90 ms); durante la
invulnerabilidad, alpha alternando a 8 Hz **más** un anillo cian que se contrae
marcando el tiempo restante (dos canales, no uno).

---

## Los tres enemigos

Cada uno usa un **tipo de movimiento físicamente distinto**. Ese es el
discriminador más fuerte, más que el tempo: uno rota, otro se deforma, otro se
traslada. El ojo los separa aunque coincidan en velocidad.

| | Forma base | Ancho | Alto | Proporción | Movimiento | Tempo |
|---|---|---:|---:|---:|---|---:|
| **Grano explorador** | Óvalo inclinado | 24 | 20 | 1,20 | Rotación ±8° | 0,90 Hz |
| **Avispa de vapor** | Punta de flecha con alas | 32 | 24 | 1,33 | Deformación de alas | 6,0 Hz |
| **Cafetera guardiana** | Hexágono coronado | 34 | 36 | 0,94 | Traslación ±2 px | 0,45 Hz |

La cafetera es **la única unidad más alta que ancha** de toda la pantalla. Ese
discriminador funciona en silueta, en visión periférica y a cualquier distancia.
Los tres tempos son cada uno al menos el doble del anterior, que es el mínimo
para percibirlos como distintos.

> Si algún día entra un cuarto enemigo, tendrá que inventar un **cuarto tipo de
> movimiento** (pulsación de color, traslación horizontal), no reutilizar uno.

### Grano explorador
Elipse `rx 11 · ry 9` rotada −12°, radial con foco desplazado. Hendidura en S
vertical con arista de luz de 1 px. Dos sensores oscuros con punto especular:
dan cara sin dibujar cara. Dos antenas rematadas en ámbar.
Fase de cada individuo = `columna × 0,16 rad` → la formación respira en ola
diagonal.

### Avispa de vapor
Polígono en punta hacia abajo, alas barridas hacia atrás, **tres bandas oscuras
horizontales** (es lo que grita «avispa»), visor trapezoidal y aguijón.
Aleteo: las alas escalan en Y de 1,00 a 0,75 a 6 Hz.
**Telegrafía:** el visor parpadea en magenta tres veces en 450 ms y las alas se
pliegan justo antes de lanzarse.

### Cafetera guardiana
Hexágono de 30 × 25 px achatado, degradado vertical violeta. Dos placas
laterales con remaches que evocan una cafetera italiana. Anillo orbital girando
a 12°/s.

**Corona = tapa y válvulas de presión:** pomo central de 11 px y dos chimeneas
laterales de 8 px **de las que sale vapor**. Es el único ámbar sobre un cuerpo
enemigo en todo el juego, y funciona como etiqueta de valor: ámbar = 400 puntos.
El jugador aprende a priorizarla sin que nadie se lo diga.

**Manómetro central** (en lugar de un ojo): esfera clara con bisel de latón y
aguja. En reposo oscila ±25° a 0,35 Hz. Al telegrafiar, la aguja barre al máximo
y la esfera vira a magenta los últimos 150 ms.
**Con un impacto recibido, la esfera queda fija en ámbar y la aguja tiembla a
12 Hz.** Así se comunican sus 2 puntos de vida sin barras ni iconos: la única
unidad que aguanta dos golpes es también la única con indicador de estado.

---

## El jefe — Gran Tostadora Cósmica

**176 × 140 px**, centro en `y = 119`. Ocupa de y=44 a y=184 y deja **456 px
verticales libres**: más de dos tercios de pantalla. Nunca desciende.

Es una máquina industrial, no una criatura. De atrás hacia delante: aura de
calor · dos chimeneas humeantes · tolva de granos con ventana de nivel · **el
tambor tostador** (la masa dominante, rectángulo redondeado de 144 × 68 con
degradado vertical de 5 paradas y costillas) · **la mirilla** (punto focal:
círculo de r 26 con bisel de latón, cristal oscuro, fuego interior y 10 granos
orbitando a 60°/s) · dos cañones colgantes · dos manómetros · quemador con 7
llamas · faldón.

**Silueta:** masa horizontal ancha y baja, dos chimeneas y una tolva escalonadas
arriba, dos cañones colgando por debajo. Es la relación de aspecto más achatada
del juego y no se parece a ninguna silueta enemiga.

**Ritmo: 0,25 Hz.** Es el objeto más lento de la pantalla por un factor de casi
dos sobre el siguiente. **La lentitud es el recurso, no el tamaño.** Los granos
de la mirilla giran a 60°/s constantes e invariables: son el reloj del jefe, y
si algo se sale de ese ritmo es que va a pasar algo. El quemador parpadea a
12 Hz y es el único elemento rápido: por contraste, hace que todo lo demás
parezca aún más lento.

### Daño progresivo, sin barra de vida

| Vida | Qué cambia |
|---:|---|
| 24 | Tres grietas radiales en el cristal. La tolva baja de 10 a 7 granos |
| 18 | **Salta la placa derecha**: hueco dentado con fuego dentro. Su manómetro se rompe con la aguja clavada. La chimenea derecha añade humo negro |
| 12 | Salta la placa izquierda. Las grietas pasan de 3 a 6 y se tiñen de ámbar: el calor las atraviesa. Empieza a temblar |
| 6 | **Se desprende la tolva** y cae una chimenea. El fuego interior desborda el bisel |
| 3 | **Agonía:** fisuras luminosas recorren el tambor y salen chorros de vapor a presión cada 400 ms |

Hay un cambio visible **cada 6 impactos**, y cada golpe suelto se siente: 5
chispas, un anillo y **la pieza golpeada** (solo esa) destella en blanco 60 ms.
Que el destello sea local enseña al jugador dónde está impactando.

Hitstop de 40 ms **solo al cruzar umbral**. Treinta congelaciones destruirían el
ritmo; así los cinco momentos importantes se sienten y los otros veinticinco no
molestan.

En la agonía **la cadencia de ataque no sube**: nada de picos de dificultad
injustos. Solo se acorta el telegrafiado un 15 %.

### Los tres ataques

Los tres tienen la misma estructura de tres tiempos:

1. **Carga** — pasa en el cuerpo del jefe, en tonos cálidos. Dice *va a pasar algo*.
2. **Marca** — dice *va a pasar exactamente aquí*. Único momento en que aparece
   el magenta antes del proyectil.
3. **Disparo.**

Separar carga y marca permite anticipar sin teñir la pantalla de rojo, y
consolida la lección: **magenta = te va a alcanzar**.

**1 · Disparos verticales (aviso 900 ms).** Carga: las agujas de los manómetros
suben al máximo, los cañones se retraen y se extienden, las llamas doblan su
altura. Marca (a 450 ms): desde cada boca desciende una línea de guiones
magenta hasta el borde inferior, que **se mueve con el jefe**. A 80 ms del
disparo la línea se congela: nadie muere por un cañón que se desplazó en el
último fotograma.

**2 · Abanico (aviso 1000 ms).** Sale de la **mirilla**, no de los cañones: ese
cambio de origen es la primera pista y hace que los dos ataques no se
confundan. Carga: el tambor bascula, el fuego se intensifica y el bisel de latón
se pone al rojo. Marca (a 500 ms): cinco rayos guía en los ángulos exactos
−50°, −25°, 0°, +25°, +50°, que se abren desde la vertical en 200 ms.
**La información está en los huecos:** el jugador ve medio segundo antes los
cuatro pasillos por los que no va a pasar nada. Los ángulos salen siempre de
una tabla fija: el patrón es aprendible y nunca aleatorio.

**3 · Lluvia de granos ardientes (aviso 1600 ms).** El principio que lo resuelve:
**el hueco se marca en positivo, en el suelo, en la zona del jugador, y antes de
que exista un solo grano.** No basta con marcar el peligro; hay que marcar la
salvación.

La pantalla se divide en 6 carriles de 60 px. Dos son seguros.
- Los 4 peligrosos se rellenan de magenta al 10 %.
- Los 2 seguros quedan vacíos y reciben un marcador **positivo** en el tercio
  inferior: rectángulo de solo contorno **cian** con chaflanes y una flecha ▲ que
  late a 2 Hz. El cian es el color del jugador: «aquí es donde tú vas». No hace
  falta explicarlo.
- **Doble codificación deliberada:** peligro = relleno magenta; seguridad =
  contorno cian y vacío. Funciona por color, por relleno/vacío y por
  presencia/ausencia de icono.
- Durante toda la lluvia los marcadores permanecen. El jugador nunca deja de ver
  dónde está a salvo.

Cuatro reglas duras: los carriles seguros no cambian dentro de una oleada; entre
oleadas hay 700 ms de transición y **al menos un carril seguro se mantiene en
común**; los carriles seguros nunca están a más de 2 carriles del jugador (a
230 px/s son 520 ms, y el aviso dura 1200: margen del doble); y el ataque no se
lanza si quedan proyectiles de los otros dos por debajo de y=400.

**Pausa mínima entre ataques: 1,2 s sin un solo píxel magenta en pantalla.** Ese
silencio visual es lo que hace que el siguiente aviso se lea.

### Entrada (4,5 s) y muerte (2,2 s)

**Entrada.** El jugador conserva el control desde el segundo cero y es invulnerable
durante toda la secuencia. Las estrellas frenan al 20 %, las nebulosas viran a
tonos cálidos, entra `¡ALERTA!` y el nombre dibujándose letra a letra, y el jefe
**desciende apagado**: una silueta negra plana que crece. Es deliberado: **la
silueta llega antes que el detalle, y la silueta es lo que hay que memorizar.**
Luego arranca en cascada de abajo arriba —llamas, metal, mirilla, manómetros,
chimeneas— y remata con una onda de choque que empuja las estrellas hacia fuera.

Durante toda la entrada **no aparece un solo píxel magenta salvo la palabra
¡ALERTA!**. El jugador aprende en el primer segundo que ese color significa
«esto te mata».

**Muerte.** Hitstop de 140 ms y **todos los proyectiles enemigos en pantalla se
convierten en chispas doradas**: nunca se puede morir después de haber matado al
jefe. Luego fugas de vapor a presión y fisuras propagándose, tres explosiones
encadenadas (chimenea, cañón que sale despedido girando, y la mirilla
reventando con un chorro de granos), el jefe se inclina perdiendo sustentación,
y detonación final con tres anillos concéntricos y 120 partículas.
**El cuerpo deja de dibujarse en el instante del destello: nunca se ve un
cadáver.**

---

## Explosiones

Presupuesto global: **400 partículas vivas**, en arrays preasignados para que no
haya recolección de basura a mitad de partida.

| | Partículas | Composición |
|---|---:|---|
| Enemigo pequeño | 22 | 12 chispas doradas · 6 esquirlas · 4 volutas de vapor · anillo · destello |
| Enemigo grande | 48 | Ídem ampliado, con **dos anillos desfasados 90 ms** |
| **Jugador** | 60 | La única con gravedad: 20 esquirlas de porcelana y 25 gotas de café **caen**, porque algo se ha derramado. Más 15 chispas cian |

**Jerarquía de impacto:**

| Evento | Congelación | Sacudida |
|---|---:|---|
| Impacto sin muerte | 0 ms | — |
| Muerte de enemigo pequeño | 30 ms | 2 px |
| Muerte de enemigo grande | 70 ms | 5 px |
| Muerte del jugador | 110 ms | 8 px |
| Muerte del jefe | 140 ms | 10 px |

Durante la congelación se sigue **dibujando y animando las partículas de la
propia explosión**: si se congela todo, parece un tirón en vez de un impacto.
Nunca más de 140 ms.

La sacudida se aplica a la acción al 100 % y al fondo al 40 % (el paralaje
también afecta a la sacudida). **El HUD nunca se sacude.**

---

## Resplandor

`shadowBlur` es entre 10 y 50 veces más caro que el trazo equivalente. **Está
prohibido dentro del bucle de juego.** Solo se permite al generar texturas al
arrancar y en pantallas estáticas como la portada.

Alternativas, por orden de preferencia:
1. **Atlas de halos pregenerado** (recomendada): al arrancar se dibuja un halo
   radial por color en un lienzo aparte; en el juego es un solo `drawImage`.
   Uno o dos órdenes de magnitud más barato, y visualmente casi idéntico.
2. **Doble trazo** para formas lineales: mismo camino con grosor 6 al 18 %, luego
   3 al 35 %, luego el núcleo. Tres trazos, cero desenfoque.
3. **Bloom a un cuarto de resolución** en un solo pase: coste fijo, independiente
   del número de objetos.

El jugador, sus disparos y los proyectiles enemigos **conservan resplandor en
todos los niveles de calidad**, sin excepción.

---

## Fondo

Capas: degradado base · tres nebulosas de vapor pregeneradas · **una galaxia en
espiral hecha de granos de café** (pregenerada una vez, solo se rota a 1,5°/s) ·
155 estrellas en tres capas de paralaje · **un planeta cerámico como máximo**,
con su «ecuador» de café goteando · rejilla de zona en el tercio inferior que
marca el territorio del jugador · viñeta.

Reglas: la galaxia siempre en el tercio superior y desplazada a un lado, jamás
centrada. El planeta nunca supera el 60 % de luminancia dentro del 50 % central
del ancho, que es donde ocurre la acción. Las estrellas escalan por **raíz del
área** en pantallas grandes, no linealmente, o el cielo se satura.

---

## Tipografía

Sin descargar nada: `Arial Black` con alternativas de sistema, **siempre en
mayúsculas y con mucho espaciado entre letras**. Lo que evoca una recreativa no
es la fuente, es esa combinación.

El espaciado se dibuja carácter a carácter porque la propiedad automática del
navegador no existe en todos. Los números se dibujan con paso fijo para que la
puntuación **no baile** al cambiar de cifra.

Tamaños en `src/config/palette.js`. Mínimo absoluto 8 px lógicos, y solo para
etiquetas; nunca para datos. En móviles estrechos se **sube** la escala del HUD
un 15 %, nunca se baja.

---

## Archivado para más adelante

**Guardian cromado** — reloj de arena con pinzas, 34 × 36, 3 impactos, 800 puntos,
rayo tractor de vapor, cromado de 5 paradas. No entra en la v1.

Al recuperarlo habrá que separarlo de la cafetera guardiana: su tempo de 0,6 Hz
choca con el 0,45 de ella, y su proporción 0,94 es idéntica. Habría que
estrecharlo a 28 × 38 y cambiarle el tipo de movimiento a apertura y cierre de
pinzas puro.
