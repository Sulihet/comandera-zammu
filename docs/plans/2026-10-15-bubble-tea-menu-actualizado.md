# Bubble Tea — actualización de menú (oct 2026) — Plan

## Objetivo
Dejar el menú de Bubble Tea (comandera y link) igual a la carta nueva: ajustar
sabores de Milk Tea y Soda, renombrar Soda→"Soda Tea", y cambiar sabores + precio
de Fruit Tea ($70/$80). Conservar Pumpkin Spice y las bebidas normales. Aplicarlo
tanto al menú de fábrica (`menu-data.js`) como a los menús ya guardados
(`migrateMenu`), preservando los "agotados" del usuario.

## Contexto del problema
El local cambió su carta. La app tiene sabores que ya no existen y le faltan los
nuevos; Fruit Tea subió de precio. El menú vive en localStorage del celular y el
editor no permite editar la lista de sabores, así que el cambio se empuja por
migración. Subir `CACHE` en `sw.js`.

## Spec de referencia
[docs/specs/2026-10-15-bubble-tea-menu-actualizado.md](../specs/2026-10-15-bubble-tea-menu-actualizado.md) (🟢).

## Tareas a implementar

- [ ] **1. `js/menu-data.js` — Milk Tea**
  En el choice `sabor` de `bt_milktea`: quitar `bluecoco` (Blue Coco) y poner
  `bluepitahaya` (Blue Pitahaya) en su lugar (antes de Blue Mango).

- [ ] **2. `js/menu-data.js` — Soda Tea**
  `bt_soda`: renombrar `name` a **"Soda Tea"**. En `sabor`: quitar `mangoblue`
  (Mango Blue Soda); agregar `dragonmango` ("Dragon-Mango Soda") y `pitahayasoda`
  ("Pitahaya Soda"). Se quedan galaxy y fresablue.

- [ ] **3. `js/menu-data.js` — Fruit Tea**
  `bt_fruit`: cambiar variantes de precio a **Chico $70 / Grande $80**. En `sabor`:
  dejar `jamaica`; quitar `maracuya`, `mango`, `durazno`; agregar `tropical`
  ("Tropical"), `mangomaracuya` ("Mango-Maracuya"), `lichidurazno` ("Lichi-Durazno").

- [ ] **4. `js/store.js` (`migrateMenu`) — aplicar a menús guardados**
  Agregar un bloque idempotente que, sobre el menú guardado:
  - Milk Tea: quita `bluecoco`; agrega `bluepitahaya` si falta (antes de bluemango).
  - Soda: si `name === 'Soda / Blue Soda'` → "Soda Tea"; quita `mangoblue`; agrega
    `dragonmango` y `pitahayasoda` si faltan.
  - Fruit Tea: quita `maracuya`/`mango`/`durazno`; agrega `tropical`,
    `mangomaracuya`, `lichidurazno` si faltan (deja `jamaica`); si el precio sigue
    en el viejo valor (chico 65 → 70, grande 75 → 80) lo actualiza.
  - Preserva el `available` (agotado) de los sabores que se quedan; no re-agrega lo
    quitado (los add van con presence-check; los remove con filter).
  *Verificación:* con un menú viejo (con agotados y Fruit a 65/75), tras abrir la
  app: Blue Coco/Mango Blue/Maracuyá/Mango/Durazno ya no están; aparecen los
  nuevos; Soda se llama "Soda Tea"; Fruit cuesta 70/80; los agotados de galaxy y
  jamaica se conservan.

- [ ] **5. `sw.js`** — subir `CACHE` v65 → v66.

- [ ] **6. `CLAUDE.md`** — actualizar la sección Menú de Bubble Tea con la carta nueva.

## Información adicional
- **Idempotencia**: remove = `filter`; add = `if (!options.some(id))`; rename y precio
  guardados por valor viejo. Así la migración puede correr muchas veces sin duplicar
  ni pelear con ediciones futuras del usuario.
- **Fruit Tea precio**: solo se fuerza si sigue en 65/75 (si el admin lo cambió a
  propósito a otro valor, no se pisa).
- **Armado/detalle/barista/cierre/link**: salen solos (modelo genérico de
  variantes + choices; `MenuLogic`/`buildWhatsappText`).
- **Pumpkin Spice y bebidas normales**: no se tocan.
- **Publicar al link**: tras actualizar, el admin da "📤 Publicar menú al link"
  (o auto-publish). **Cache**: cerrar/reabrir la app para el JS nuevo.
