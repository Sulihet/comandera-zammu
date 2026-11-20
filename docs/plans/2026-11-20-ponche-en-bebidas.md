# Ponche Navideño dentro de Bebidas — Plan

## Objetivo
Mover `ponche_nav` de la categoría `ponche` (propia) a la categoría `bebidas`, y
eliminar la categoría `ponche`. En menú de fábrica y menús guardados. Choco-bombas
no cambia.

## Spec de referencia
[docs/specs/2026-11-20-ponche-en-bebidas.md](../specs/2026-11-20-ponche-en-bebidas.md) (🟢).

## Tareas a implementar
- [ ] **1. `js/menu-data.js`** — quitar la categoría `{ id:'ponche', ... }`; cambiar
  el item `ponche_nav` a `cat:'bebidas'` y colocarlo junto a las bebidas (después de
  Bebida Coreana). Choco-bombas (categoría e item) se queda igual.
- [ ] **2. `js/store.js` (`migrateMenu`)** — reemplazar el bloque que creaba la
  categoría `ponche`: ya NO crear esa categoría; si un menú guardado la tiene,
  quitarla; si `ponche_nav` existe con `cat:'ponche'`, cambiarlo a `cat:'bebidas'`;
  si no existe, crearlo en `bebidas`. Choco-bombas sin cambios. Idempotente, sin
  pisar precio/agotado.
- [ ] **3. `js/app.js` (`conceptOf`)** — conservar el caso `ponche` (por si hubo una
  venta con esa categoría); el Ponche nuevo (cat bebidas) cae en el concepto Bebidas.
- [ ] **4. `sw.js`** — subir `CACHE` v69 → v70.
- [ ] **5. `CLAUDE.md`** — reubicar el Ponche bajo Bebidas en la doc.

## Verificación
- Comandera y link: no aparece la categoría "Ponche Navideño"; el Ponche está dentro
  de Bebidas con sus 3 tamaños.
- Cierre: el Ponche cuenta bajo 🥤 Bebidas.
- Migración: un menú guardado con la categoría `ponche` → categoría eliminada y el
  ítem reasignado a bebidas, conservando ediciones; idempotente.
- Choco-bombas intacto (sigue como categoría propia).

## Información adicional
- **Publicar**: tras verificar, merge a `main` y push (GitHub Pages). Subir `CACHE`.
- **Rama**: `feat/ponche-en-bebidas` (desde main). Al terminar, restaurar el stash
  de roles en `feat/multi-dispositivo-roles`.
