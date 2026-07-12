# Estados de pedido en la lista de Cierre (En preparación / Entregado)

> Spec del usuario — Spec-Driven Development
> Fecha: 2026-07-12 · Estado: 🟢 Aprobado
> Actualización: 2 estados (antes 3) — al enviar, el pedido nace "En preparación".

## Overview
Dar a cada pedido de la lista *Pedidos de hoy* (pestaña Cierre) un **estado
visible** de dos valores: al enviarse a cocina el pedido queda **En preparación**
y con un toque pasa a **Entregado** (y vuelve a En preparación si se toca de más).
Convierte esa lista en un tablero de control claro, donde de un vistazo se
distingue lo que sigue pendiente de lo ya entregado. Es solo control visual: no
toca el dinero ni el cierre del día.

## Usuario(s) objetivo
El **mesero** (la persona que toma la orden), durante el servicio y sobre todo en
hora pico, usando el mismo celular donde arma y envía los pedidos.

## Contexto del problema
Hoy, una vez que un pedido se envía a cocina, queda guardado en la lista de
*Pedidos de hoy* y **todos se ven igual**. El mesero usa esa lista como control,
pero no puede identificar cuáles pedidos siguen en cocina, cuáles se están
preparando y cuáles ya entregó. Eso genera confusión y lo obliga a preguntar a
cocina o al cliente. No existe hoy ninguna marca de avance por pedido.

## Alcance v1
**Entra:**
- Un **estado por pedido** con dos valores: **En preparación** (por defecto al
  enviarse) y **Entregado**.
- Un **control de un toque** en cada tarjeta de *Pedidos de hoy* que alterna el
  estado. Si se toca de más, **vuelve a En preparación** (para corregir un toque
  equivocado).
- **Diferenciación por color** del estado: verde = Entregado, ámbar/naranja =
  En preparación.
- **Persistencia** del estado en el celular: al recargar la página, cada pedido
  conserva su estado.
- Los pedidos entregados **siguen visibles en su lugar** (no se ocultan ni se
  reordenan), solo cambian de color/etiqueta.

**Fuera (queda para después):**
- Contador/resumen global de pendientes (ej. "3 en cocina · 2 en preparación").
- Filtros u ordenar por estado ("ver solo pendientes").
- Cualquier efecto sobre el **dinero, el cierre del día o el Historial**.
- Enviar el estado a cocina por WhatsApp o sincronizar entre dispositivos.

## Comportamiento esperado
- Cuando el mesero **envía/guarda un pedido**, este aparece en *Pedidos de hoy*
  con el estado **En preparación** (ámbar) por defecto.
- Cuando **toca el control de estado**, el pedido pasa a **Entregado** (verde) y
  permanece en su posición en la lista, claramente marcado.
- Si lo **toca de nuevo**, vuelve a **En preparación** (permite corregir sin borrar).
- El estado es **evidente por color y por etiqueta** sin tener que abrir el pedido.
- Si el mesero **recarga la app o vuelve más tarde**, cada pedido conserva el
  estado en el que quedó.
- El **total del día y el cierre no cambian** por marcar estados.

## Posibles errores y mitigaciones
- **Toque equivocado (marcó Entregado por error):** otro toque vuelve a
  En preparación; no hay que borrar ni rehacer el pedido.
- **Pedido editado/corregido** (flujo "✏️ CORRECCIÓN" existente): al reenviarse
  queda como **En preparación**, no arrastra un "Entregado" viejo.
- **Pedido anulado/cancelado:** el estado es solo visual; anular sigue funcionando
  como hoy y el pedido deja de contar en el cierre igual que antes.
- **Recarga o cierre inesperado del navegador:** el estado ya quedó guardado en el
  celular, así que no se pierde.
- **Cierre del día:** al cerrar el día y empezar uno nuevo, la lista se vacía como
  hoy; los estados se van con los pedidos del día cerrado (no estorban al día
  nuevo).
- **Daltonismo / color poco claro:** además del color, cada estado muestra un
  **texto/etiqueta** ("En cocina", "En preparación", "Entregado") para no depender
  solo del color.

## Futuro (v2)
- **Contador de pendientes** arriba de la lista (Opción B del brainstorming).
- **Filtro** "ver solo pendientes" u ocultar entregados (Opción C).
- Posible **hora** de cada cambio de estado (cuándo se entregó) para tiempos.
- Reordenar automáticamente para que lo pendiente quede arriba.
