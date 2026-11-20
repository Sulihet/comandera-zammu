# Eliminar Pumpkin Spice del menú — Plan

## Objetivo
Quitar `bt_pumpkin` del menú de fábrica y de los menús guardados, y dejar de
re-inyectarlo en la migración. Comandera y link.

## Spec de referencia
[docs/specs/2026-11-20-quitar-pumpkin-spice.md](../specs/2026-11-20-quitar-pumpkin-spice.md) (🟢).

## Tareas a implementar
- [ ] **1. `js/menu-data.js`** — eliminar el item `bt_pumpkin` (bloque Pumpkin Spice).
- [ ] **2. `js/store.js` (`migrateMenu`)** — quitar `bt_pumpkin` del arreglo
  `bubbleTeaItems` (para que NO se re-inyecte), y agregar un paso idempotente que
  **elimine** `bt_pumpkin` de `m.items` si está presente (para menús ya guardados).
- [ ] **3. `sw.js`** — subir `CACHE` v70 → v71.
- [ ] **4. `CLAUDE.md`** — quitar/actualizar la mención de Pumpkin Spice.

## Verificación
- Comandera y link: Bubble Tea sin Pumpkin Spice (ni gris ni bloqueado).
- Migración: un menú guardado con `bt_pumpkin` → se elimina; idempotente al recargar
  (no reaparece). Resto del Bubble Tea intacto.
- Historial: un cierre viejo con Pumpkin Spice se sigue viendo.

## Información adicional
- **No tocar `conceptOf`**: `bubbletea` sigue; cubre ventas históricas de Pumpkin.
- **Publicar**: merge a `main` + push (GitHub Pages). Subir `CACHE`.
- **Rama**: `feat/quitar-pumpkin-spice` (desde main). Al terminar, restaurar el stash
  de roles en `feat/multi-dispositivo-roles`.
