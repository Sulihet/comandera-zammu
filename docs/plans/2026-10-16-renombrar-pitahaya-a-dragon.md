# Renombrar sabores: Pitahaya → Dragon — Plan

## Objetivo
Renombrar el texto de dos sabores: "Blue Pitahaya"→"Blue Dragon" (Milk Tea) y
"Pitahaya Soda"→"Dragon Soda" (Soda Tea), en menú de fábrica y menús guardados,
sin tocar ids, precios ni nada más.

## Spec de referencia
[docs/specs/2026-10-16-renombrar-pitahaya-a-dragon.md](../specs/2026-10-16-renombrar-pitahaya-a-dragon.md) (🟢).

## Tareas a implementar
- [ ] **1. `js/menu-data.js`** — renombrar `bluepitahaya`→"Blue Dragon" (Milk Tea)
  y `pitahayasoda`→"Dragon Soda" (Soda Tea). Ids iguales.
- [ ] **2. `js/store.js`** — en `bubbleTeaItems` (array de inserción) y en el bloque
  de migración oct-2026 usar los nombres nuevos; además agregar un paso **rename por
  id** idempotente que, en menús ya guardados, cambie el nombre de `bluepitahaya` a
  "Blue Dragon" y de `pitahayasoda` a "Dragon Soda" (sin tocar su `available`).
- [ ] **3. `sw.js`** — subir `CACHE` v67 → v68.
- [ ] **4. `CLAUDE.md`** — actualizar los nombres en la sección Menú.

## Verificación
- Comandera y link: Milk Tea muestra "Blue Dragon"; Soda Tea muestra "Dragon Soda".
- Migración: un menú guardado con los nombres viejos queda con los nuevos,
  conservando el "agotado" del sabor; idempotente al recargar.
- "Dragon-Mango Soda" **no** se toca.

## Información adicional
- Solo cambia el `name` (texto); los ids `bluepitahaya`/`pitahayasoda` se mantienen
  para no romper nada. Cierres/ventas pasadas guardan su propio texto (no se tocan).
