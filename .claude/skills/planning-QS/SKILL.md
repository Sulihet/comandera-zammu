---
name: planning-QS
description: >-
  Paso "Plan" del flujo Spec-Driven Development. Se llama en cuanto se activa el
  Modo Plan de Claude, para ayudar a definir el plan respondiendo 4 preguntas
  clave antes de detallarlo: (1) ¿Cuál es el trabajo principal?, (2) ¿Qué NO va
  a hacer — los límites?, (3) ¿Cómo se ve el éxito?, (4) ¿Qué casos raros
  existen? Úsalo siempre que entres en Modo Plan para un feature, proyecto o
  desarrollo, como antesala de [design-plan]. Sus respuestas alimentan el
  documento de plan.
---

# Planning-QS — las 4 preguntas que enmarcan el plan

## Dónde vive en el flujo

Este skill se dispara **al activar el Modo Plan** de Claude, dentro del **paso 4
("Plan")** de Spec-Driven Development (ver `CLAUDE.md`). Es la antesala de
[design-plan]: antes de proponer tareas y arquitectura, fija el marco del trabajo
con cuatro preguntas. Con un spec ya aprobado ([design-spec]), muchas respuestas
saldrán de ahí — úsalas y confírmalas, no las repreguntes a ciegas.

## Las 4 preguntas

Responde estas cuatro, apoyándote en el spec aprobado y preguntando al usuario
lo que falte. El objetivo es que nadie empiece a planear sobre supuestos.

1. **¿Cuál es el trabajo principal?**
   El objetivo central en una o dos frases: qué construimos y para quién. Si es
   difuso, aterrízalo con un caso real de uso de principio a fin.

2. **¿Qué NO va a hacer? (los límites)**
   Lo que queda explícitamente fuera de alcance en esta iteración. Es la
   pregunta que más retrabajo evita. Si no está claro, propón tú los recortes
   obvios y pide confirmación.

3. **¿Cómo se ve el éxito?**
   Criterios observables de que está terminado y funciona ("el usuario toca X y
   recibe Y"), no sensaciones. Estos criterios serán la vara de
   [verify-after-changes] al final.

4. **¿Qué casos raros existen?**
   Los edge cases que sí importan y podrían romper el diseño si se ignoran:
   entradas vacías, datos grandes, fallos de red, uso inesperado, formatos
   inválidos. No hace falta cazarlos todos; nombra los que cambian el diseño.

## Al terminar

Resume las cuatro respuestas en pocas líneas y confírmalas con el usuario. Ese
marco es la base directa del documento de plan: **pasa a [design-plan]** para
traducir spec + estas respuestas en el flujo completo y la lista de tareas, y
guardarlo en `docs/plans/YYYY-MM-DD-title.md`.

## Resumen del flujo

1. Modo Plan activo → responde las 4 preguntas (usa el spec como fuente).
2. Confirma el marco con el usuario.
3. Pasa a [design-plan] para escribir el plan ejecutable.
