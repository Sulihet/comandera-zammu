# Bubble Tea — Pumpkin Spice (temporada) y Pistache (Milk Tea)

## Objetivo
Agregar **Pistache** como sabor nuevo del platillo Milk Tea (precio $65/$75) y
**Pumpkin Spice** como platillo propio de temporada en Bubble Tea (Chico $78 /
Grande $88 + dulzor obligatorio, sin sub-sabores), visibles en comandera y link,
con migración para menús ya guardados.

## Contexto del problema
El local sumó un sabor de Milk Tea (Pistache) y una bebida de temporada (Pumpkin
Spice). Hay que meterlos al menú compartido (comandera + link). Restricciones:
PWA estática, menú en localStorage (migración), armado/detalle/precio compartidos
por `menu-logic.js`, subir `CACHE` en `sw.js` al tocar JS.

## Spec de referencia
[docs/specs/2026-10-09-bubble-tea-pumpkin-pistache.md](../specs/2026-10-09-bubble-tea-pumpkin-pistache.md)
(🟢). Pumpkin Spice como platillo aparte (opción B elegida), no dentro de la lista
de sabores de Milk Tea.

## Tareas a implementar

- [ ] **1. Pistache en Milk Tea — `js/menu-data.js`**
  Agregar `{ id:'pistache', name:'Pistache' }` a las opciones del choice `sabor`
  de `bt_milktea`. Sin `priceDelta` (mismo precio $65/$75).
  *Verificación:* al abrir Milk Tea aparece Pistache; elegirlo no cambia el precio.

- [ ] **2. Pumpkin Spice como platillo — `js/menu-data.js`**
  Agregar un item nuevo en la categoría `bubbletea` (después de `bt_fruit`):
  `id:'bt_pumpkin'`, `name:'Pumpkin Spice 🍂 (temporada)'`, `cat:'bubbletea'`,
  `available:true`, `notes:true`, `variants:[{chico,$78},{grande,$88}]`, y
  `choices:[ dulzor (Poco/Normal/Extra, required) ]`. **Sin** choice de sabor.
  *Verificación:* aparece como platillo propio en Bubble Tea; la hoja pide Tamaño
  ($78/$88) y Dulzor; "Agregar" se habilita al elegir ambos; precio correcto.

- [ ] **3. Migración — `js/store.js` (`migrateMenu`)**
  - A `bt_milktea` ya guardado: si su choice `sabor` no tiene la opción `pistache`,
    agregarla (sin tocar precios ni `available` por sabor).
  - Si no existe el item `bt_pumpkin`, insertarlo (mismos datos que la tarea 2),
    junto a los demás Bubble Tea (antes de la primera línea de `bebidas`).
  - Marcar `changed = true` para persistir.
  *Verificación:* con un menú viejo (Milk Tea con precio editado y un sabor
  agotado, sin Pumpkin Spice), al abrir la app aparecen Pistache y Pumpkin Spice,
  y se conservan precios y "agotado por sabor".

- [ ] **4. Armado / detalle / barista / cierre — sin código nuevo**
  `openItemSheet` (app.js) y la hoja de `pedir.js` renderizan variantes y choices
  genéricamente; `MenuLogic.calcUnitPrice`/`buildDetail` ya calculan precio y
  detalle; `buildWhatsappText` imprime el detalle en la sección 🧋 BUBBLE TEA.
  *Verificación:* un pedido con Pistache (Milk Tea) y uno con Pumpkin Spice salen
  correctos en el mensaje a la barista y suman bien en el cierre.

- [ ] **5. Service worker — `sw.js`**
  Subir `CACHE` v64 → v65.

## Información adicional
- **Pumpkin Spice = platillo propio** (decisión del usuario, opción B): precio
  editable por tamaño en la sección Menú (`data-vprice`), sin el truco de
  `priceDelta`. Tiene dulzor como el resto de Bubble Tea; NO tiene choice de sabor
  (es una sola bebida), así que el editor "agotar por sabor" simplemente no le
  muestra ese bloque (solo aplica a items con choice `sabor`).
- **Temporada**: se marca con el texto en el nombre ("🍂 (temporada)"); al acabar
  la temporada se apaga con el toggle Disponible/Agotado del platillo (sin tocar
  código). Migración idempotente: no duplica si ya existe.
- **Pistache**: sabor permanente, mismo precio que Milk Tea (sin priceDelta).
- **Casos raros**: sin tamaño/dulzor → "Agregar" deshabilitado; migración no pisa
  precios ni agotado; pedidos en curso no se alteran.
- **Publicar al link**: ambos viajan en el menú publicado; el cliente los ve tras
  "📤 Publicar menú al link" (o el auto-publish al editar).
- **Cache**: el celular necesita recargar/cerrar-abrir para recibir el JS nuevo.
