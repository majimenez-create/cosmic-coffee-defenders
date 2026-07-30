# GAME DESCRIPTION
## Proyecto: Cosmic Coffee Defenders

Version 1.0

> **Nota del proyecto:** este documento es la referencia de **tono y espíritu**.
> Cuando contradiga a `GAME_BIBLE.md`, manda la biblia. Ver `DECISIONES.md`.

---

# HIGH CONCEPT

Cosmic Coffee Defenders es un videojuego arcade de acción 2D inspirado en la época dorada de las máquinas recreativas de los años 80.

El jugador controla una pequeña taza de café espacial equipada con tecnología futurista cuya misión consiste en proteger el núcleo energético del universo del café frente a una invasión de criaturas mecánicas y organismos extraterrestres.

La experiencia debe sentirse inmediata, sencilla de aprender y extremadamente difícil de dominar.

No existen árboles de habilidades.

No existen mejoras permanentes.

No existen inventarios.

Todo depende de la habilidad del jugador.

Cada partida comienza desde cero.

El objetivo es obtener la máxima puntuación posible sobreviviendo al mayor número de oleadas.

---

# GÉNERO

Arcade

Fixed Shooter

Acción

Skill Based

High Score Game

Partidas rápidas

---

# DURACIÓN

Una partida normal debe durar entre 5 y 15 minutos.

Un jugador experto puede superar los 30 minutos.

No existe final.

El juego aumenta su dificultad indefinidamente.

---

# GAME LOOP

Inicio de partida

↓

Presentación de la fase

↓

Entrada coreografiada de enemigos

↓

Los enemigos forman una escuadra organizada

↓

Comienzan los ataques

↓

El jugador destruye enemigos

↓

Obtiene puntos

↓

Aparecen enemigos especiales

↓

Finaliza la oleada

↓

Pantalla Bonus ocasional

↓

Nueva oleada con mayor dificultad

↓

Repetir hasta perder todas las vidas.

---

# EL JUGADOR

El protagonista es una elegante taza de café futurista.

La taza representa una nave espacial.

Siempre permanece orientada hacia arriba.

Nunca rota.

Nunca cambia de perspectiva.

Su movimiento es extremadamente preciso.

El jugador únicamente puede desplazarse horizontalmente.

Nunca puede abandonar el tercio inferior de la pantalla.

La respuesta del control debe ser instantánea.

Sin aceleración.

Sin inercia.

Sin física.

El movimiento debe sentirse perfecto.

---

# DISPARO

El arma principal consiste en proyectiles de energía de café.

Los disparos salen del centro de la taza.

Viajan completamente rectos.

No rebotan.

No atraviesan enemigos.

Desaparecen al salir de pantalla.

La cadencia es rápida pero limitada.

El jugador debe pulsar repetidamente el botón de disparo.

> **Decisión del proyecto:** se sustituye por disparo mantenido. El límite de
> 2 proyectiles en pantalla ya aporta la tensión de recurso sin exigir
> machaqueo. Los tres modos existen en Ajustes. Ver `DECISIONES.md`.

---

# ENEMIGOS

Los enemigos llegan desde el espacio siguiendo espectaculares trayectorias curvas.

Nunca aparecen directamente colocados.

Siempre realizan una entrada dinámica antes de ocupar su posición definitiva.

Una vez completada la entrada forman una escuadra perfectamente organizada.

Cada enemigo posee un comportamiento específico.

Durante la partida algunos abandonan la formación para atacar individualmente.

Tras finalizar el ataque intentan regresar exactamente a su posición inicial.

Si la posición ya no existe porque el enemigo ha muerto, continúan atacando hasta ser destruidos.

---

# TIPOS DE ENEMIGOS

> **Decisión del proyecto:** la versión 1 usa los tres tipos de la biblia
> (Grano explorador, Avispa de vapor, Cafetera guardiana) más el jefe. El
> Guardian con rayo tractor queda archivado para más adelante.

## Scout

Muy rápido.

Un solo impacto.

Ataques sencillos.

Poca puntuación.

---

## Hunter

Mayor resistencia.

Ataques más agresivos.

Trayectorias más complejas.

Puntuación media.

---

## Commander

Gran tamaño.

Puede coordinar ataques.

Mayor resistencia.

Alta puntuación.

---

## Guardian

Enemigo especial.

Puede capturar al jugador mediante un rayo tractor de vapor.

Si consigue capturar la taza, esta desaparece del campo de batalla.

Posteriormente puede rescatarse destruyendo al Guardian.

Cuando esto sucede ambas tazas vuelven unidas.

A partir de ese momento el jugador dispara el doble.

---

# FORMACIÓN

La formación de enemigos constituye el corazón del juego.

Todos los enemigos permanecen organizados en filas perfectamente simétricas.

La formación nunca permanece completamente quieta.

Respira.

Oscila.

Late lentamente.

Debe transmitir la sensación de un ejército perfectamente coordinado.

---

# ATAQUES

Los enemigos abandonan la formación de manera individual o en pequeños grupos.

Cada tipo dispone de patrones únicos.

Todos los patrones son aprendibles.

El jugador nunca debe sentir que la dificultad depende del azar.

Siempre debe poder mejorar mediante práctica.

---

# VIDAS

El jugador comienza con tres vidas.

Cada impacto destruye inmediatamente la taza.

No existe barra de salud.

No existe regeneración.

No existe escudo permanente.

Al perder una vida aparece una breve animación de explosión y la taza reaparece tras unos segundos.

---

# BONUS STAGE

Cada varias fases aparece una pantalla especial.

Los enemigos realizan coreografías espectaculares.

No disparan.

El objetivo consiste en destruir el mayor número posible.

Si se eliminan todos se obtiene una bonificación perfecta.

---

# PROGRESIÓN

Cada nueva fase incrementa ligeramente:

Velocidad de los enemigos.

Frecuencia de ataques.

Número de enemigos atacando simultáneamente.

Complejidad de las trayectorias.

Nunca aparecen mecánicas completamente nuevas.

El juego aumenta únicamente mediante la evolución de los patrones existentes.

---

# PUNTUACIÓN

Cada enemigo destruido concede puntos.

Los enemigos destruidos durante un ataque valen más que cuando permanecen en formación.

Las fases bonus conceden grandes recompensas.

Se otorgan vidas extra al alcanzar determinadas puntuaciones.

---

# INTERFAZ

La interfaz ocupa el mínimo espacio posible.

Elementos visibles:

Puntuación actual.

Récord.

Número de vidas.

Número de fase.

No existen mapas.

No existen inventarios.

No existen indicadores innecesarios.

Toda la atención debe centrarse en la acción.

---

# DIRECCIÓN ARTÍSTICA

El universo combina estética arcade clásica con un acabado moderno.

Todo gira alrededor del café.

Nebulosas de vapor.

Galaxias formadas por granos de café.

Planetas cerámicos.

Explosiones de partículas doradas.

Energía color ámbar.

Tecnología inspirada en cafeteras de alta gama.

El resultado debe transmitir elegancia, nostalgia y espectacularidad sin perder la simplicidad visual que caracteriza a los grandes clásicos arcade.

---

# FILOSOFÍA

El jugador debe entender el juego en menos de treinta segundos.

Dominarlo puede llevar cientos de partidas.

Cada muerte debe sentirse justa.

Cada victoria debe sentirse ganada.

La experiencia debe recordar a las grandes recreativas clásicas mientras construye un universo completamente nuevo basado en el café como fuente de energía del cosmos.
