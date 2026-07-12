---
name: brainstorming
description: >-
  Paso "Aclarar idea" del flujo Spec-Driven Development. Se usa SIEMPRE al
  arrancar un nuevo proyecto, feature o desarrollo, ANTES de escribir un spec,
  un plan o código. Su trabajo es hacerle preguntas al usuario para eliminar
  ambigüedades y, al final, presentarle 2 o 3 alternativas concretas para
  empezar a trabajar. Úsalo cuando el usuario diga cosas como "quiero hacer",
  "se me ocurrió", "vamos a agregar", "necesito una función/pantalla/app",
  "tengo una idea", o cualquier señal de que empieza algo nuevo — aunque parezca
  pequeño y aunque no lo pida explícitamente. Es el primer skill del ciclo y
  antecede a [design-spec].
---

# Brainstorming — aclarar la idea antes de especificar

## Dónde vive en el flujo

Este es el **paso 2 ("Aclarar idea")** de la metodología Spec-Driven Development
(ver `CLAUDE.md`). Va justo después de que el usuario suelta una idea y **antes**
de escribir el spec con [design-spec]. Su único objetivo es que la idea deje de
ser difusa: entender de verdad al usuario y cerrar con opciones concretas para
arrancar.

No escribas plan ni código aquí. Aquí solo se piensa y se pregunta.

## Paso 1 — Preguntar para eliminar ambigüedades

Haz preguntas hasta entender el problema, no la solución. **Una a la vez**, en
lenguaje llano, esperando respuesta. Si algo queda vago, repregunta con un
ejemplo concreto ("dame un caso real de principio a fin"). Cubre al menos:

- **Qué problema real resuelve** y a quién le duele hoy.
- **Quién lo va a usar** y en qué momento/contexto (¿el mesero a media hora
  pico? ¿el administrador al cerrar?).
- **Cómo se hace hoy** sin esto, y qué falla de ese método.
- **Qué sería un buen resultado** — cómo notaríamos que funcionó.
- **Qué restricciones existen** (un solo celular, sin backend, español, wifi,
  lo que aplique del proyecto).

No dispares las cinco de golpe como formulario. Conversa: cada respuesta suele
abrir la siguiente pregunta. Para cuando ya no queden ambigüedades que cambien
el rumbo.

### Cuándo aligerar

Si la idea es minúscula y evidente, no interrogues de más: pregunta solo lo que
no puedas inferir y pasa directo a las alternativas. El objetivo es reducir
riesgo, no crear fricción.

## Paso 2 — Resumir el entendimiento

Antes de proponer nada, devuelve en 3-5 líneas lo que entendiste (problema,
usuario, resultado esperado, límites) y pide confirmación. Corrige si el usuario
te ajusta algo. Este resumen es la materia prima del spec.

## Paso 3 — Presentar 2 o 3 alternativas

Cierra el brainstorming ofreciendo **2 o 3 caminos distintos** para empezar a
trabajar. No son variaciones cosméticas: cada alternativa debe representar una
apuesta diferente (por ejemplo, más simple y rápida de hacer vs. más completa;
o resolver el 80% ahora vs. cubrir el caso raro desde el día uno).

Para cada alternativa da:

- **Nombre corto** y en una frase qué es.
- **Qué gana** el usuario con ella.
- **Qué cuesta / qué deja fuera** (esfuerzo, límites, riesgos).
- Cuándo conviene elegirla.

Termina con una **recomendación** tuya (cuál elegirías y por qué), pero deja que
el usuario decida. Puedes usar `AskUserQuestion` para que elija de forma clara.

## Al terminar

Cuando el usuario elija un camino, señala el siguiente paso: **pasar a
[design-spec]** para escribir la especificación del usuario (paso 3 del flujo).
No arranques el spec sin que haya una alternativa elegida.

## Resumen del flujo

1. Pregunta hasta eliminar ambigüedades (una a la vez).
2. Resume tu entendimiento y confírmalo.
3. Presenta 2-3 alternativas con pros/contras + tu recomendación.
4. Con la alternativa elegida → pasa a [design-spec].
