# Eliminar Pan al Vapor (Baos) — Plan

## Objetivo
Quitar la categoría `baos` y sus 4 platillos del menú (comandera y link), en el
menú de fábrica (`menu-data.js`) y en los menús ya guardados (`migrateMenu`), sin
afectar el resto del menú ni los cierres pasados.

## Contexto del problema
Pan al Vapor salió de la carta. El menú vive en localStorage, así que hay que
empujar la eliminación por migración. `baos` es categoría de cocina
(`KITCHEN_CATS`) y tiene un caso en `conceptOf` que debe **conservarse** para no
descolocar los cierres viejos. Subir `CACHE` en `sw.js`.

## Spec de referencia
[docs/specs/2026-10-15-eliminar-pan-al-vapor.md](../specs/2026-10-15-eliminar-pan-al-vapor.md) (🟢).

## Tareas a implementar

- [ ] **1. `js/menu-data.js` — quitar categoría e items**
  Eliminar la categoría `{ id:'baos', name:'Pan al Vapor' }` y los 4 items
  `bao_sencillo`, `bao_gourmet`, `bao_paq4`, `bao_paq6`.

- [ ] **2. `js/app.js` — `KITCHEN_CATS`**
  Quitar `'baos'` del arreglo (ya no hay baos que mandar a cocina).
  *No tocar* el caso `baos` de `conceptOf` (lo necesitan los cierres históricos).

- [ ] **3. `js/store.js` (`migrateMenu`) — eliminar de menús guardados**
  Agregar bloque idempotente: quitar la categoría `baos` de `m.categories` y los
  items con `cat === 'baos'` de `m.items` (marcando `changed` solo si había algo
  que quitar).

- [ ] **4. `sw.js`** — subir `CACHE` v66 → v67.

- [ ] **5. `CLAUDE.md`** — quitar Pan al Vapor de la sección Menú y ajustar las
  menciones (p. ej. `KITCHEN_CATS` ya sin baos), dejando nota del cambio.

## Verificación
- Comandera: no aparece la pestaña "Pan al Vapor"; no hay baos en el editor de Menú.
- Link: no aparece "Pan al Vapor".
- Migración: con un menú viejo que tenía baos (y otras ediciones), al abrir la app
  los baos desaparecen y el resto queda igual; idempotente al recargar.
- Historial: un cierre viejo con baos se sigue viendo agrupado como "Pan al vapor"
  (el caso de `conceptOf` sigue existiendo).

## Información adicional
- **Idempotencia:** remove por `filter`; `changed` solo si realmente quitó algo.
- **conceptOf:** se conserva el caso `baos` a propósito (datos históricos).
- **Cache:** cerrar/reabrir la app para el JS nuevo; publicar menú para el link.
