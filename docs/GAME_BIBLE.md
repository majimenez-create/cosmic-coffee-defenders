# GAME BIBLE — COSMIC COFFEE

## 1. Concepto

Juego arcade 2D de disparos con pantalla vertical.

El jugador controla una **taza de café espacial** situada en la parte inferior. Debe destruir oleadas de enemigos, esquivar ataques y conseguir la mayor puntuación posible.

La partida es sencilla, rápida y basada en habilidad.

---

## 2. Objetivo

- Destruir todos los enemigos de cada fase.
- Evitar enemigos y proyectiles.
- Superar el mayor número de fases posible.
- Conseguir la máxima puntuación.

La partida termina cuando el jugador pierde sus tres vidas.

---

## 3. Pantalla

- Vista 2D vertical.
- Resolución lógica recomendada: `360 × 640`.
- Cámara fija.
- Fondo espacial con estrellas y nebulosas suaves.
- El jugador permanece en la zona inferior.

---

## 4. Controles

| Acción | Teclado | Mando |
|---|---|---|
| Mover izquierda | A / Flecha izquierda | Cruceta izquierda |
| Mover derecha | D / Flecha derecha | Cruceta derecha |
| Disparar | Espacio | Botón principal |
| Pausa | Esc | Start |

El jugador solo puede moverse horizontalmente.

---

## 5. Jugador

### Taza espacial

- Taza blanca de porcelana.
- Detalles metálicos y luces azules.
- Café visible en el interior.
- Vapor animado.
- Pequeños propulsores inferiores.
- Siempre orientada hacia arriba.

### Parámetros

| Propiedad | Valor inicial |
|---|---:|
| Vidas | 3 |
| Velocidad | 230 px/s |
| Movimiento | Horizontal |
| Salud | 1 impacto |
| Invulnerabilidad tras reaparecer | 1,5 s |

El movimiento debe responder inmediatamente, sin aceleración ni inercia.

---

## 6. Disparo

La taza dispara pequeños pulsos de energía de café.

| Propiedad | Valor inicial |
|---|---:|
| Daño | 1 |
| Velocidad | 520 px/s |
| Cadencia | 1 disparo cada 0,22 s |
| Dirección | Recta hacia arriba |
| Máximo simultáneo | 2 |

Los disparos desaparecen al impactar o salir de la pantalla.

---

## 7. Enemigos

### Grano explorador

- Enemigo básico.
- 1 punto de vida.
- Movimiento rápido.
- 100 puntos.

### Avispa de vapor

- Realiza ataques en curva.
- Dispara una vez durante el ataque.
- 1 punto de vida.
- 200 puntos.

### Cafetera guardiana

- Enemigo grande.
- 2 puntos de vida.
- Más lento.
- 400 puntos.

---

## 8. Comportamiento enemigo

1. Los enemigos entran desde la parte superior.
2. Siguen curvas sencillas.
3. Ocupan una formación ordenada.
4. Algunos abandonan la formación para atacar.
5. Si sobreviven, regresan a su posición.

Reglas:

- Los patrones deben ser fáciles de reconocer.
- No deben aparecer enemigos encima del jugador.
- No debe haber ataques imposibles de esquivar.
- Máximo de 5 enemigos atacando al mismo tiempo.
- Máximo de 8 proyectiles enemigos en pantalla.

---

## 9. Formación

- 24 enemigos por fase.
- 3 filas de 8.
- La formación se mueve lentamente de izquierda a derecha.
- Los enemigos entran en grupos de 4.
- La fase termina cuando todos son destruidos.

---

## 10. Fases

El juego utiliza un ciclo de 5 fases:

| Fase | Contenido |
|---:|---|
| 1 | Enemigos básicos |
| 2 | Enemigos básicos y avispas |
| 3 | Más ataques simultáneos |
| 4 | Fase de bonificación |
| 5 | Jefe |

Después de la fase 5, el ciclo se repite con mayor dificultad.

### Aumento de dificultad

- Enemigos un 5 % más rápidos por ciclo.
- Ataques ligeramente más frecuentes.
- Proyectiles enemigos un 5 % más rápidos.
- Nunca superar los límites máximos de pantalla.

---

## 11. Fase de bonificación

- Los enemigos realizan una coreografía.
- No atacan al jugador.
- Aparecen 20 objetivos.
- Cada objetivo concede 200 puntos.
- Destruirlos todos concede 5.000 puntos adicionales.

---

## 12. Jefe

### Gran Tostadora Cósmica

- Aparece cada 5 fases.
- Permanece en la mitad superior.
- Tiene 30 puntos de vida.
- Se mueve horizontalmente.

Ataques:

1. Disparos verticales.
2. Disparos en abanico.
3. Caída de granos ardientes con huecos seguros.

Debe avisar visualmente antes de cada ataque.

Recompensa: 5.000 puntos.

---

## 13. Puntuación

| Acción | Puntos |
|---|---:|
| Grano explorador | 100 |
| Avispa de vapor | 200 |
| Cafetera guardiana | 400 |
| Jefe | 5.000 |
| Fase de bonificación perfecta | 5.000 extra |

- Destruir un enemigo mientras ataca concede el doble.
- Se obtiene una vida extra cada 20.000 puntos.
- Máximo de 5 vidas.
- Guardar el récord local.

---

## 14. Interfaz

### HUD

Mostrar únicamente:

- puntuación;
- récord;
- fase;
- vidas.

### Pantallas

1. Menú principal.
2. Cómo jugar.
3. Partida.
4. Pausa.
5. Game Over.
6. Ajustes.

Menú principal:

- Jugar.
- Cómo jugar.
- Ajustes.
- Salir.

Después de Game Over:

- mostrar puntuación y récord;
- permitir reintentar inmediatamente;
- permitir volver al menú.

---

## 15. Dirección artística

Estilo arcade retro con acabado moderno.

### Paleta

- Fondo azul muy oscuro.
- Blanco porcelana.
- Ámbar y cobre.
- Azul claro para el jugador.
- Rosa o rojo para amenazas.

### Elementos visuales

- Estrellas con movimiento lento.
- Vapor saliendo de la taza.
- Disparos ámbar.
- Explosiones de porcelana, café y partículas.
- Enemigos inspirados en granos, cafeteras y vapor.

La pantalla debe ser clara y no estar saturada.

---

## 16. Audio

- Música electrónica retro.
- Sonido corto para disparar.
- Impactos metálicos y de porcelana.
- Explosiones breves.
- Vapor para ataques especiales.
- Sonido distinto para vida extra y nuevo récord.

Ajustes:

- volumen general;
- volumen de música;
- volumen de efectos.

---

## 17. Animaciones y efectos

### Jugador

- Vapor en reposo.
- Pequeño retroceso al disparar.
- Parpadeo durante invulnerabilidad.
- Explosión al morir.

### Enemigos

- Movimiento en reposo.
- Aviso antes de atacar.
- Giro durante las curvas.
- Destello al recibir daño.
- Explosión al ser destruidos.

Los efectos nunca deben ocultar proyectiles o enemigos.

---

## 18. Accesibilidad

- Controles configurables.
- Disparo automático opcional.
- Temblor de pantalla activable o desactivable.
- Modo de alto contraste para proyectiles.
- Volumen separado.
- Texto en español.

---

## 19. Especificaciones técnicas

### Tecnología recomendada

- Godot 4.x.
- GDScript.
- Objetivo de 60 FPS.
- Exportación para Windows y navegador.

### Organización

```text
project/
├── scenes/
├── scripts/
├── assets/
│   ├── sprites/
│   ├── audio/
│   └── fonts/
├── data/
└── ui/
```

### Sistemas necesarios

- Control del jugador.
- Disparos.
- Enemigos.
- Formación.
- Ataques.
- Colisiones.
- Fases.
- Jefe.
- Puntuación y vidas.
- Menús y HUD.
- Audio.
- Guardado del récord.

Los valores de velocidad, daño y puntuación deben guardarse en un archivo de configuración, no repetidos por el código.

---

## 20. Orden de desarrollo

1. Crear pantalla y movimiento del jugador.
2. Añadir disparos.
3. Crear un enemigo básico.
4. Añadir colisiones y puntuación.
5. Crear formación y ataques.
6. Añadir vidas y reaparición.
7. Crear las cinco fases.
8. Programar el jefe.
9. Añadir menús, HUD y récord.
10. Incorporar gráficos, sonido y ajustes.
11. Probar y equilibrar.
12. Exportar el juego.

---

## 21. Reglas para Claude Code

- Implementar primero una versión funcional con gráficos provisionales.
- No añadir nuevas mecánicas sin indicación.
- Mantener el código sencillo y dividido por sistemas.
- No copiar código, personajes, gráficos, música ni patrones exactos de otros juegos.
- Comprobar cada sistema antes de continuar.
- Mantener 60 FPS.
- Evitar errores y advertencias.
- Documentar cualquier cambio importante.

---

## 22. Criterios de juego terminado

El juego está completo cuando:

- el jugador puede moverse y disparar;
- existen tres tipos de enemigos;
- los enemigos entran, forman grupos y atacan;
- hay cinco fases y un jefe;
- funcionan vidas, puntuación y récord;
- existen menú, pausa y Game Over;
- hay gráficos y sonidos básicos;
- puede jugarse con teclado y mando;
- mantiene 60 FPS;
- puede exportarse para Windows y navegador.

---

## Resumen final

**Cosmic Coffee** debe ser un juego arcade pequeño y directo: una taza espacial se mueve horizontalmente, dispara energía de café y destruye enemigos organizados en formaciones. El juego debe ser fácil de aprender, difícil de dominar, visualmente claro y rápido de reiniciar.
