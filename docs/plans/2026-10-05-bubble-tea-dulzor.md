# Bubble Tea — elección de dulzor — Plan

> Plan de implementación — Spec-Driven Development
> Fecha: 2026-10-05

## Objetivo
Agregar una elección obligatoria de **dulzor** (Poco dulce · Normal · Extra dulce,
sin costo) a los 5 platillos de Bubble Tea, visible en comandera y link, que viaja
en el detalle de la línea (barista, cierre, resumen). El armado sigue: Tamaño →
Sabor → Dulzor.

## Contexto del problema
El Bubble Tea solo tiene tamaño + sabor; el dulzor se pierde o queda en nota libre.
Restricciones: PWA estática, menú en localStorage (migración), lógica de armado y
detalle compartida por `app.js`/`pedir.js` vía `menu-logic.js`, subir `CACHE` en
`sw.js` al tocar JS.

## Spec de referencia
[docs/specs/2026-10-05-bubble-tea-dulzor.md](../specs/2026-10-05-bubble-tea-dulzor.md)
(🟢). Exige: 3 niveles, obligatorio, sin preseleccionar, gratis, solo Bubble Tea,
en comandera y link, reflejado en el mensaje a la barista.

## Tareas a implementar

### 1. Menú por defecto — `js/menu-data.js`
- A cada uno de los 5 platillos de Bubble Tea (`bt_milktea`, `bt_matcha`,
  `bt_yakult`, `bt_soda`, `bt_fruit`) agregar un segundo choice **después** del de
  sabor:
  `{ id:'dulzor', name:'Dulzor', required:true, options:[
     {id:'poco',name:'Poco dulce'}, {id:'normal',name:'Normal'}, {id:'extra',name:'Extra dulce'} ] }`.
- Sin `priceDelta` (gratis).
- **Verificación:** al resetear menú, cada Bubble Tea abre con Tamaño, Sabor y
  Dulzor; precio no cambia con el dulzor.

### 2. Migración para menús guardados — `js/store.js` (`migrateMenu`)
- Para cada `bt_*`, si su lista de choices no tiene uno con `id:'dulzor'`,
  agregarlo (mismos datos que la tarea 1), **sin** tocar el choice de sabor ni el
  `available` por sabor ya editado.
- Marcar `changed = true` para persistir.
- **Verificación:** con un menú viejo (bubble tea sin dulzor, con algún sabor
  agotado), al abrir la app aparece el Dulzor y se conserva el agotado por sabor.

### 3. Armado — comandera y link (sin código nuevo)
- `openItemSheet` (`app.js`) y la hoja de `pedir.js` renderizan los choices de
  forma genérica; `complete` ya exige todos los `required`; `MenuLogic.buildDetail`
  ya concatena todas las opciones elegidas. El dulzor aparece y se exige solo.
- **Verificación:** en comandera y link, "Agregar" queda deshabilitado hasta
  elegir tamaño + sabor + dulzor; la línea muestra "… · <sabor> · <dulzor>".

### 4. Mensaje a la barista / cierre (sin código nuevo)
- `buildWhatsappText` imprime `l.detail`, que ya incluirá el dulzor; el cierre
  agrupa por `nombre + detalle`.
- **Verificación:** el mensaje de un Bubble Tea muestra el dulzor en la línea; el
  cierre lo refleja en el desglose.

### 5. Service worker — `sw.js`
- Subir `CACHE` v63 → v64 (se tocó JS).

## Información importante
- **El modelo ya soporta multi-choice**: Bubble Tea pasa de 1 a 2 choices (sabor +
  dulzor); no requiere cambios en el renderizado ni en el cálculo de precio.
- **Orden en la hoja**: Bubble Tea no tiene choice `tipo`, así que `choicesFirst`
  no aplica: sale Tamaño (variante) → Sabor → Dulzor, en el orden del array.
- **Editor "agotado por sabor"**: apunta solo al choice `id:'sabor'`; agregar
  `dulzor` no lo afecta y no se agregan toggles por nivel de dulzor (no se piden).
- **Gratis**: las opciones de dulzor no llevan `priceDelta`; el precio sigue por
  tamaño.
- **Publicar al link**: el dulzor viaja en el menú publicado; el cliente lo ve tras
  "📤 Publicar menú al link" (o el auto-publish al editar).
- **Cache**: el celular necesita recargar/cerrar-abrir para recibir el JS nuevo.
