# Fix: no se pueden quitar items de un pedido en línea

> Spec del usuario — Spec-Driven Development
> Fecha: 2026-11-21 · Estado: 🟢 Aprobado

## Overview
Corregir un bug: cuando el mesero carga al carrito un **pedido hecho desde el menú
del cliente** (pedido en línea) para ajustarlo, **no puede quitar ninguna línea** con
el botón "Quitar". La causa es que esas líneas llegan **sin `uid`**, y el botón borra
por `uid`.

## Usuario(s) objetivo
- **Mesero/vendedora** (comandera): al editar un pedido en línea, necesita poder
  quitar o cambiar items.

## Contexto del problema
El link del cliente (`pedir.js`) arma el pedido con líneas **sin `uid`**
(`buildOrderPayload`). La comandera, al **Editar** ese pedido (`editOnline`) o un
pedido ya aceptado (`editOrder`), clona esas líneas al carrito. El botón "Quitar"
usa `data-del="${l.uid}"` y el filtro `l.uid !== del.dataset.del`; con `uid`
indefinido, `data-del` queda `"undefined"` en todas las líneas y el filtro **nunca
coincide**, así que no se borra ninguna. (Reproducido: una línea sin `uid` no se
puede quitar; una con `uid` sí.)

## Alcance v1
**Sí entra:**
- Garantizar que **toda línea que entra al carrito tenga `uid`**: al cargar pedidos
  en línea (`editOnline`), pedidos guardados (`editOrder`) y al aceptar un pedido en
  línea (`acceptOnline`), asignar un `uid` nuevo a las líneas que no lo tengan.
- Que el link (`pedir.js`) incluya `uid` en cada línea del pedido, para que los
  nuevos pedidos en línea ya lleguen con `uid`.

**Queda FUERA:**
- Cambiar la UI del carrito o el flujo de pedidos en línea.
- Otros aspectos del pedido (precios, envío, etc.).

## Comportamiento esperado
- **Editar pedido en línea:** el mesero carga el pedido, y el botón **"Quitar"**
  elimina correctamente la línea elegida (y solo esa).
- **Editar pedido aceptado:** igual, se puede quitar cualquier línea.
- **Pedidos nuevos desde el link:** llegan con `uid` por línea (origen correcto).
- El resto del flujo (cambiar cantidades, agregar otras cosas, reenviar) no cambia.

## Posibles errores y mitigaciones
- **Pedidos ya recibidos sin `uid`** (los que llegaron con el bug): se arreglan igual,
  porque el `uid` se asigna **al cargarlos** en la comandera (no depende de que el link
  ya lo mandara).
- **Colisión de `uid`:** se usa el generador `uid()` existente; se respeta el `uid` que
  ya traiga la línea para no romper referencias.

## Futuro (v2)
- Unificar el armado de líneas (comandera y link) en una sola función para que
  siempre incluya `uid` de origen.
