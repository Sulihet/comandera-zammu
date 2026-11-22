# Ponche Navideño también va a cocina — Plan

## Objetivo
Tratar el Ponche (`ponche_nav`, cat `bebidas`) como línea de cocina y mostrarlo en
su propia sección 🎄 PONCHE NAVIDEÑO del mensaje a cocina, sin afectar las demás
bebidas.

## Spec de referencia
[docs/specs/2026-11-21-ponche-a-cocina.md](../specs/2026-11-21-ponche-a-cocina.md) (🟢).

## Tareas a implementar
- [ ] **1. `js/app.js` — `isKitchenLine`**: agregar un predicado `isPonche(l)`
  (`l.itemId === 'ponche_nav' || /ponche/i.test(l.name)`) y que `isKitchenLine`
  devuelva true también para el Ponche. Así `orderHasKitchen` y `kitchenSig` lo
  incluyen (envío y reenvío en correcciones).
- [ ] **2. `js/app.js` — `buildWhatsappText`**: al agrupar, mandar las líneas de
  Ponche a una llave propia `'ponche'` (en vez de su `cat` 'bebidas'); tras el
  recorrido de categorías, si hay líneas de Ponche, agregar la sección
  `*━━ 🎄 PONCHE NAVIDEÑO ━━*` con esas líneas.
- [ ] **3. `sw.js`** — subir `CACHE` v71 → v72.
- [ ] **4. `CLAUDE.md`** — documentar que el Ponche va a cocina (excepción dentro de
  Bebidas) y su sección propia.

## Verificación
- Pedido con Ponche → botón "Enviar a cocina"; mensaje con `━━ 🎄 PONCHE NAVIDEÑO ━━`.
- Pedido de puro Ponche → también se envía.
- Pedido con Refresco/Té/Bebida Coreana (sin ponche) → sigue "Guardar (no va a
  cocina)"; no aparece sección de bebidas en el mensaje.
- Pedido mixto (ponche + fast food) → ambas secciones salen bien.

## Información adicional
- **Detección robusta** por `itemId` o nombre (cubre comandera y pedidos en línea).
- **Cierre**: sin cambios (Ponche sigue en 🥤 Bebidas).
- **Publicar**: merge a `main` + push; subir `CACHE`. Rama `feat/ponche-a-cocina`;
  al terminar, restaurar el stash de roles.
