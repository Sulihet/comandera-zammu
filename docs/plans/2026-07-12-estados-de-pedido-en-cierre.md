# Estados de pedido en la lista de Cierre — Plan

> Plan de implementación — Spec-Driven Development
> Fecha: 2026-07-12

## Objetivo
Agregar a cada pedido de *Pedidos de hoy* (pestaña Cierre) un estado de **2
valores** — **En preparación** (default al enviar) ↔ **Entregado** — que el
mesero alterna con un toque, diferenciado por color y etiqueta. Solo control
visual: no toca dinero, cierre ni Historial. Persistente en localStorage.

## Contexto del problema
El mesero usa la lista de *Pedidos de hoy* como tablero de control, pero todos los
pedidos se ven igual y no distingue los pendientes de los ya entregados.
Restricciones del proyecto: un solo celular, sin backend, español, PWA con service
worker cacheado (hay que subir la versión de `CACHE` al cambiar CSS/JS).

## Spec de referencia
`docs/specs/2026-07-12-estados-de-pedido-en-cierre.md` (🟢 Aprobado, 2 estados).
Exige: default "En preparación" al enviar, toque para alternar a "Entregado" y de
vuelta, color + etiqueta, persistencia, y cero efecto en montos/cierre.

## Tareas a implementar

1. **Modelo de estado** (`js/app.js`, ~línea 19, junto a `KITCHEN_CATS`):
   `ORDER_STATUS = ['preparacion','entregado']`; `STATUS_META` con label+clase;
   `statusOf(o)` (default 'preparacion', compat pedidos viejos) y `nextStatus(s)`.
2. **Default al crear** (`sendOrder`, ~línea 272): añadir `status: 'preparacion'`
   al objeto `order`.
3. **Avanzar estado** (`js/app.js`, junto a `cancelOrder`): `advanceStatus(id)` →
   cargar orders, `o.status = nextStatus(statusOf(o))`, `saveOrders`, `renderCierre`.
4. **Render del chip** (`renderCierre`, ~línea 472): botón `.order-status` con
   `data-status="${o.id}"` en el `.order-head` (antes del `.chevron`), solo si no
   está anulado; clase `st-<estado>` también en `.order-card` para el borde.
5. **Handler del toque** (`bind`, delegación de cierre, ~línea 853): antes del
   check de `toggle`, `if (status) { advanceStatus(...); return; }` para que el
   chip no expanda la tarjeta.
6. **Estilos** (`css/styles.css`, ~línea 127): `.order-status` + `.st-prep`
   (ámbar) y `.st-entregado` (verde) + borde izquierdo por estado. Texto+emoji
   además del color (accesibilidad). Nada de rojo.
7. **Cache PWA** (`sw.js`, línea 3): `CACHE` `v15` → `v16`.

## Información importante
- **Qué NO se toca:** `dayBreakdown`, `reportText`, `closeDay`, `renderHistorial`
  y el WhatsApp a cocina ignoran `status`; el campo viaja en el pedido sin afectar
  montos. `editOrder` no cambia (al reenviar, `sendOrder` re-crea con
  `status:'preparacion'`).
- **Compat:** pedidos guardados antes de este cambio no tienen `status`;
  `statusOf` los trata como "En preparación".
- **Verificación:** ver sección homónima; la vara son este plan y el spec
  (usada por `verify-after-changes`).

## Verificación (verify-after-changes)
Con `preview_start` (launch.json) y navegador:
1. Crear pedido → chip "⏳ En preparación" (ámbar).
2. Tocar chip → "✅ Entregado" (verde) → tocar → vuelve a "En preparación"; el chip
   NO expande la tarjeta.
3. Tocar el encabezado (fuera del chip) → sí expande el detalle.
4. Marcar Entregado, recargar → conserva estado.
5. El "total del día" y el desglose del Cierre no cambian con los estados.
6. Anular → sin chip. Editar y reenviar → nace "En preparación".
7. Sin errores en consola. Screenshot con los 2 colores.
