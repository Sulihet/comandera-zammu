# Menú navideño: Gansito, Ponche Navideño y Choco-bombas — Plan

## Objetivo
Agregar 3 productos de temporada (Gansito en Banderillas Dulces $50; Ponche
Navideño categoría nueva $25/$35/$55; Choco-bombas categoría nueva $35/$60/$115),
en comandera y link, con migración y conceptos propios en el cierre. Ninguno va a
WhatsApp.

## Contexto del problema
Temporada navideña. El menú vive en localStorage, así que se empuja por migración.
Ponche y Choco-bombas son categorías nuevas → requieren caso en `conceptOf` para no
caer en "Otros". Subir `CACHE` en `sw.js`.

## Spec de referencia
[docs/specs/2026-11-20-menu-navideno.md](../specs/2026-11-20-menu-navideno.md) (🟢).

## Tareas a implementar

- [ ] **1. `js/menu-data.js` — Gansito en Banderillas Dulces**
  Agregar al choice `tipo` de `ban_dulce` la opción
  `{ id:'gansito', name:'Gansito 🎄 (temporada)', overridePrice: 50 }`.

- [ ] **2. `js/menu-data.js` — categoría + item Ponche Navideño**
  Categoría `{ id:'ponche', name:'Ponche Navideño', icon:'🎄' }` (después de
  `bebidas`). Item `bt... ` → `{ id:'ponche_nav', cat:'ponche', name:'Ponche Navideño 🎄 (temporada)', available:true, notes:true, variants:[ chico $25, medio $35, litro $55 ] }`.

- [ ] **3. `js/menu-data.js` — categoría + item Choco-bombas**
  Categoría `{ id:'chocobombas', name:'Choco-bombas', icon:'🍫' }` (después de
  `ponche`). Item `{ id:'chocobomba', cat:'chocobombas', name:'Choco-bomba 🎄 (temporada)', available:true, notes:true, variants:[ 1 pza $35, caja2 $60, caja4 $115 ] }`.

- [ ] **4. `js/app.js` — `conceptOf`**
  Agregar `ponche` → `{ key:'ponche', label:'Ponche Navideño', icon:'🎄', order:7 }`
  y `chocobombas` → `{ key:'chocobombas', label:'Choco-bombas', icon:'🍫', order:8 }`.
  (NO tocar `KITCHEN_CATS`: ninguno va a WhatsApp.)

- [ ] **5. `js/store.js` (`migrateMenu`) — inyectar a menús guardados**
  Idempotente: agregar la opción Gansito a `ban_dulce` si falta; agregar las
  categorías `ponche` y `chocobombas` si faltan (después de `bebidas`); agregar los
  items `ponche_nav` y `chocobomba` si faltan. Sin tocar precios/ediciones/agotados.

- [ ] **6. `sw.js`** — subir `CACHE` v68 → v69.

- [ ] **7. `CLAUDE.md`** — documentar los 3 productos de temporada.

## Verificación
- Comandera y link: aparece Gansito en Dulces (total $50 al elegirlo); categorías
  Ponche Navideño ($25/$35/$55) y Choco-bombas ($35/$60/$115) con sus tamaños.
- Cierre: Ponche y Choco-bombas como conceptos propios; Gansito dentro de Banderillas.
- Ninguno genera mensaje a cocina (no están en KITCHEN_CATS).
- Migración: menú viejo recibe los 3 sin perder lo demás; idempotente.

## Información adicional
- **Gansito $50**: se modela con `overridePrice:50` en la opción (base dulce = $60);
  `calcUnitPrice` ya soporta `overridePrice`. El botón "Agregar" muestra $50.
- **Temporada**: marcado en el nombre (🎄); se apaga con el toggle Disponible/Agotado.
- **No a WhatsApp**: `ponche` y `chocobombas` NO se agregan a `KITCHEN_CATS`.
- **Publicar al link**: dar "📤 Publicar menú al link"; **Cache**: cerrar/reabrir app.
- **Rama**: `feat/menu-navideno` (desde main). Al terminar, restaurar el stash de
  roles en `feat/multi-dispositivo-roles`.
