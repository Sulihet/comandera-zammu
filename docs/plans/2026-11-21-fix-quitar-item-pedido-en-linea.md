# Fix: no se pueden quitar items de un pedido en línea — Plan

## Objetivo
Garantizar que toda línea cargada al carrito tenga `uid`, para que el botón "Quitar"
funcione con pedidos en línea (y aceptados). Que el link incluya `uid` de origen.

## Spec de referencia
[docs/specs/2026-11-21-fix-quitar-item-pedido-en-linea.md](../specs/2026-11-21-fix-quitar-item-pedido-en-linea.md) (🟢).

## Tareas a implementar
- [ ] **1. `js/app.js` — helper `ensureUids`**: `const ensureUids = (lines) => (lines||[]).map((l) => (l.uid ? l : { ...l, uid: uid() }));`
- [ ] **2. `js/app.js`** — usarlo al poblar el carrito / guardar líneas:
  - `editOnline`: `cart = ensureUids(Store.clone(src.lines || []));`
  - `editOrder`: `cart = ensureUids(Store.clone(o.lines));`
  - `acceptOnline`: `lines: ensureUids(Store.clone(src.lines || [])),` (así un pedido
    en línea aceptado queda con `uid` y se puede editar después).
- [ ] **3. `js/pedir.js` (`buildOrderPayload`)** — agregar `uid: l.uid` a cada línea.
- [ ] **4. `sw.js`** — subir `CACHE` v72 → v73.
- [ ] **5. `CLAUDE.md`** — nota del fix (líneas con `uid` siempre).

## Verificación
- Simular un pedido en línea (líneas sin `uid`) → `editOnline` → en el carrito, "Quitar"
  elimina la línea elegida (y solo esa).
- Carrito normal (líneas con `uid`): sigue funcionando.
- Aceptar un pedido en línea y luego editarlo (`editOrder`): también se pueden quitar.
- `pedir.js`: las líneas del payload incluyen `uid`.

## Información adicional
- Fix robusto del lado de la comandera (no depende de que el link ya mandara `uid`),
  así cubre pedidos ya recibidos.
- **Publicar**: merge a `main` + push; subir `CACHE`. Rama `fix/pedidos-en-linea-quitar-item`;
  al terminar, restaurar el stash de roles. (El link SÍ cambia → conviene también
  "Publicar menú al link" no aplica aquí; el link se actualiza al desplegar `pedir.js`.)
