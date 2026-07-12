---
name: design-plan
description: >-
  Paso "Plan" del flujo Spec-Driven Development. Se usa DESPUÉS de que el usuario
  aprobó el Spec ([design-spec]) y se activó el Modo Plan de Claude. Planea y
  propone el flujo completo del proyecto/feature, traduciendo el spec y las 4
  preguntas de [planning-QS] en pasos ejecutables y verificables. Guarda el plan
  en docs/plans/YYYY-MM-DD-title.md con: objetivo, contexto del problema, el spec
  de referencia, la lista de tareas a implementar con detalles, e información
  relevante. Úsalo cuando el spec esté aprobado y toque definir el CÓMO, o cuando
  el usuario pida "haz el plan", "planea la implementación", "arma las tareas".
---

# Design-Plan — traducir el spec en un plan ejecutable

## Dónde vive en el flujo

Este es el **paso 4 ("Plan")** de Spec-Driven Development (ver `CLAUDE.md`). Se
usa cuando **el spec ya está aprobado** ([design-spec] en estado 🟢) y **el Modo
Plan de Claude está activo**. Aquí sí se define el CÓMO: el flujo completo y la
lista de tareas para llegar a lo que pide el spec. Antes de detallar, asegúrate
de tener el marco de [planning-QS] (trabajo principal, límites, éxito, casos
raros).

Requisito previo: **no planees sin un spec aprobado.** Si no existe, vuelve a
[design-spec] primero.

## Paso 1 — Escribir el documento de plan

Crea el archivo en **`docs/plans/YYYY-MM-DD-title.md`** (crea las carpetas si no
existen). Usa la fecha de hoy y, cuando sea posible, el **mismo `title`** que el
spec correspondiente, para poder emparejarlos (ej. spec
`2026-07-12-envio-a-cocina-por-grupo.md` → plan
`2026-07-12-envio-a-cocina-por-grupo.md`). Escríbelo en el idioma del proyecto.

El documento debe contener al menos:

```markdown
# [Título del feature] — Plan

> Plan de implementación — Spec-Driven Development
> Fecha: YYYY-MM-DD

## Objetivo
[Qué logra este plan, en 1-3 frases. Alineado con el spec.]

## Contexto del problema
[Por qué se hace, qué restricciones aplican (del CLAUDE.md y del spec).]

## Spec de referencia
[Ruta al spec aprobado: docs/specs/YYYY-MM-DD-title.md. Resume en 1-2 líneas
qué exige, para no tener que abrirlo para lo básico.]

## Tareas a implementar
[Lista ordenada y ejecutable. Para cada tarea:
 - Qué se hace y en qué archivo(s).
 - Cómo se verifica que quedó (criterio observable).
 - Dependencias con otras tareas, si las hay.]

## Información importante
[Todo lo que crea relevante: decisiones técnicas, riesgos, casos raros a cubrir
(de planning-QS), impacto en el service worker/cache, datos a preservar, etc.]
```

Ajusta y añade secciones según el proyecto. Cada tarea debe ser **ejecutable y
verificable**: si no se puede comprobar que quedó, redefínela.

## Paso 2 — Presentar el plan

Resume el plan al usuario, indica dónde quedó (`docs/plans/...`) y, estando en
Modo Plan, propón salir del modo para ejecutar solo cuando el usuario esté de
acuerdo (usa `ExitPlanMode` para pedir la aprobación del plan). Ejecuta las
tareas en orden.

## Enlace con la verificación

El plan guardado es la vara contra la que se verifica al final. Por eso
[verify-after-changes] lo busca en **`docs/plans/YYYY-MM-DD-title.md`**: al
terminar la implementación se comparan los cambios contra este plan y contra el
spec del usuario.

## Resumen del flujo

1. Spec aprobado + Modo Plan activo → confirma el marco de [planning-QS].
2. Escribe `docs/plans/YYYY-MM-DD-title.md` (objetivo, contexto, spec de
   referencia, tareas con detalle, info importante).
3. Presenta el plan y, con el visto bueno, ejecuta las tareas en orden.
4. Al terminar de ejecutar → [verify-after-changes] compara contra este plan.
