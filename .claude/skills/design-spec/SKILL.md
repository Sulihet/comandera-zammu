---
name: design-spec
description: >-
  Paso "Spec del usuario" del flujo Spec-Driven Development. Se usa DESPUÉS de
  tener claridad del problema (normalmente tras [brainstorming]) para diseñar un
  archivo de especificación desde el punto de vista del usuario: define QUÉ se
  quiere lograr y PARA QUIÉN, no el cómo. Genera el documento
  docs/specs/YYYY-MM-DD-title.md con secciones fijas (Overview, Usuarios
  objetivo, Contexto del problema, Alcance v1, Comportamiento esperado, Posibles
  errores y mitigaciones, Futuro v2) e incluye un approval gate para iterar el
  spec o aprobarlo y continuar con [design-plan]. Úsalo cuando el usuario diga
  "hagamos el spec", "escribe la especificación", "define qué queremos", o
  cuando ya haya claridad del problema y toque documentarlo antes de planear.
---

# Design-Spec — especificar QUÉ, no el CÓMO

## Dónde vive en el flujo

Este es el **paso 3 ("Spec del usuario")** de Spec-Driven Development (ver
`CLAUDE.md`). Va después de [brainstorming] (idea ya aclarada) y antes de
[design-plan] (el plan ejecutable). El spec describe **qué se quiere lograr y
para quién** — nunca el cómo técnico. Si te encuentras escribiendo pasos de
implementación, endpoints o nombres de funciones, te saliste del spec: eso va en
el plan.

## Paso 1 — Reunir lo necesario

Si vienes de [brainstorming], reutiliza ese entendimiento y la alternativa
elegida. Si te invocan en frío, haz antes las preguntas mínimas para no
especificar sobre supuestos. No inventes alcance: si algo no está claro,
pregunta.

## Paso 2 — Escribir el documento

Crea el archivo en **`docs/specs/YYYY-MM-DD-title.md`** (crea las carpetas si no
existen). Usa la fecha de hoy y un `title` corto en kebab-case que describa el
feature (ej. `2026-07-12-envio-a-cocina-por-grupo.md`). Escríbelo en el idioma
del proyecto (español por defecto).

El documento debe contener **exactamente estas secciones**:

```markdown
# [Título del feature]

> Spec del usuario — Spec-Driven Development
> Fecha: YYYY-MM-DD · Estado: 🟡 En revisión

## Overview
[2-4 frases: qué es y qué valor entrega. El resumen de una lectura.]

## Usuario(s) objetivo
[Quién lo usa, en qué rol y contexto. Si hay varios, lístalos.]

## Contexto del problema
[Qué duele hoy, cómo se resuelve actualmente y por qué no alcanza.]

## Alcance v1
[Qué SÍ entra en esta primera versión. Lista concreta y acotada. Incluye
también, explícitamente, lo que queda FUERA para evitar ambigüedad.]

## Comportamiento esperado
[Qué debe pasar, desde el punto de vista del usuario. Escríbelo como recorridos
observables: "cuando el usuario hace X, ocurre Y". Nada de detalle técnico.]

## Posibles errores y mitigaciones
[Casos raros, entradas inválidas, fallos previsibles → cómo debería
comportarse el sistema ante cada uno.]

## Futuro (v2)
[Ideas y mejoras que NO entran ahora pero conviene anotar para después.]
```

Mantén cada sección enfocada; el spec es corto y legible, no un documento
técnico. La sección más importante para evitar retrabajo es **Alcance v1** (qué
sí y qué no).

## Paso 3 — Approval gate (obligatorio)

Un spec no avanza solo. Después de escribir (o actualizar) el documento:

1. **Presenta el spec** al usuario: resume en pocas líneas lo esencial y dile
   dónde quedó el archivo (`docs/specs/...`).
2. **Pide su decisión explícita** con `AskUserQuestion`, dos caminos:
   - **Iterar** — el usuario da ajustes; edita el mismo archivo y vuelve a
     presentar. Repite este ciclo cuantas veces haga falta.
   - **Aprobar** — el spec queda cerrado.
3. **No pases a [design-plan] hasta que el spec esté aprobado.** Al aprobar,
   cambia el estado del encabezado a `🟢 Aprobado` y menciona que el siguiente
   paso es el plan (activar Modo Plan y usar [design-plan]).

Nunca asumas la aprobación. Si el usuario no la da con claridad, sigues en
"iterar".

## Resumen del flujo

1. Reúne el entendimiento (de [brainstorming] o preguntando).
2. Escribe `docs/specs/YYYY-MM-DD-title.md` con las 7 secciones fijas.
3. Approval gate: iterar (editar y repetir) o aprobar.
4. Aprobado → marca 🟢 y pasa a [design-plan].
