---
name: verify-after-changes
description: >-
  Ciclo entre los pasos "Ejecutar" y "Verificar" del flujo Spec-Driven
  Development. Se llama cuando se considera que ya terminó la implementación del
  plan y se enfoca en PROBAR los cambios de verdad: levantar el servidor, elegir
  casos de prueba importantes y probarlos directamente en el navegador (o el
  sitio que requiera el feature), recoger feedback y compararlo contra el Plan
  (docs/plans/YYYY-MM-DD-title.md) y el Spec del usuario
  (docs/specs/YYYY-MM-DD-title.md). Con ese feedback, arregla lo que falle o no
  alcance el objetivo, o da luz verde para terminar. Úsalo siempre que termines
  de implementar algo y antes de publicar o dar por cerrado el trabajo.
---

# Verify-After-Changes — probar antes de dar por hecho

## Dónde vive en el flujo

Este skill es el **bucle entre el paso 5 ("Ejecutar") y el paso 6 ("Verificar")**
de Spec-Driven Development (ver `CLAUDE.md`). Se invoca cuando crees que la
implementación del plan está terminada. Verificar no es leer el diff ni correr
solo el typecheck: es **ejercitar el cambio de verdad** y comparar el resultado
contra lo que se prometió en el spec y el plan.

Si algo no cumple → se vuelve a **ejecutar** (fix) y se repite este skill. Si
todo cumple → luz verde y se pasa al **paso 7 (Output / publicar)**.

## Paso 1 — Recuperar la vara de medir

Antes de probar, abre las dos referencias contra las que se compara:

- **El plan:** `docs/plans/YYYY-MM-DD-title.md` — las tareas y sus criterios de
  verificación.
- **El spec del usuario:** `docs/specs/YYYY-MM-DD-title.md` — el comportamiento
  esperado, el alcance v1 y los "posibles errores y mitigaciones".

Si no encuentras el par por fecha, empareja por `title`. Estos documentos
definen qué significa "cumple".

## Paso 2 — Probar en vivo

Prueba en el entorno real, no en abstracto:

1. **Levanta el servidor** con las herramientas de preview (`preview_start`; en
   este proyecto hay `.claude/launch.json`). Nunca uses `Bash` para servir.
2. **Elige los casos de prueba importantes** a partir del "Comportamiento
   esperado" y de los "Posibles errores y mitigaciones" del spec, más los casos
   raros del plan. No pruebes todo: prioriza lo que, si falla, rompe el objetivo.
3. **Ejercita cada caso directamente en el navegador** (o el sitio/superficie
   que aplique): `preview_snapshot`, `preview_click`, `preview_fill` para
   recorrer el flujo; `preview_console_logs`, `preview_logs`, `preview_network`
   para detectar errores; `preview_inspect` para valores de estilo.
4. **Recoge la evidencia**: qué pasó en cada caso (captura con
   `preview_screenshot` cuando el cambio sea visual).

Nunca pidas al usuario que verifique a mano: verifica tú y muestra la prueba.

## Paso 3 — Comparar contra plan y spec

Para cada caso probado, contrasta lo observado con lo prometido:

- ¿El comportamiento coincide con el "Comportamiento esperado" del spec?
- ¿Se respeta el "Alcance v1" (ni de menos ni de más)?
- ¿Los errores se manejan como dicen las "mitigaciones"?
- ¿Se cumplen los criterios de verificación de cada tarea del plan?

Anota lo que **cumple** y lo que **falla o no alcanza**.

## Paso 4 — Decidir: fix o luz verde

- **Si algo falla o no alcanza el objetivo** → vuelve a **Ejecutar**: arregla en
  el código (no parches temporales en el navegador), y repite desde el Paso 2.
  Este es el bucle ejecutar↔verificar; itéralo hasta que cierre.
- **Si todo cumple** → da **luz verde**: reporta al usuario qué se probó, con qué
  evidencia, y confirma que el trabajo cumple el spec. Recién entonces se puede
  avanzar al **paso 7 (Output / publicar)**.

## Recordatorio del proyecto

Si el cambio tocó CSS/JS, sube la versión `CACHE` en `sw.js` para que el celular
reciba la actualización (ver `CLAUDE.md`).

## Resumen del flujo

1. Abre el plan y el spec (la vara de medir).
2. Levanta el servidor y prueba los casos importantes en el navegador.
3. Compara lo observado contra el comportamiento esperado y los criterios.
4. Falla → fix y repite; cumple → luz verde y pasa a publicar.
