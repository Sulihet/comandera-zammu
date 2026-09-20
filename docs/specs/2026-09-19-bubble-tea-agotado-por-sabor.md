# Bubble Tea — agotado por sabor (en el editor de Menú)

> Spec del usuario — Spec-Driven Development
> Fecha: 2026-09-19 · Estado: 🟢 Aprobado

## Overview
En la sección **Menú** (editor), cada familia de Bubble Tea debe poder
**encender/apagar cada sabor por individual** (marcar agotado un sabor específico),
en vez de un solo interruptor para toda la familia. Así, cuando no hay una bebida
puntual (ej. "Taro"), se apaga solo ese sabor. El desglose por sabor vive **solo
en el editor**; el armado del pedido sigue siendo familia + elegir sabor.

## Usuario(s) objetivo
- **Administrador / mesero** en la sección Menú: marca agotado un sabor concreto
  durante el día.
- **Mesero (comandera)** y **cliente (link)** al armar: ya no ven el sabor apagado.

## Contexto del problema
Hoy el "agotado" es por platillo (familia completa: Milk Tea, Matcha…). Si falta
un solo sabor, no hay forma de quitarlo sin apagar toda la familia. El menú
cambia durante el día, así que se necesita granularidad por sabor.

## Alcance v1

**Sí entra:**
- En el editor de Menú, para cada platillo de **Bubble Tea**, listar sus **sabores**
  con un interruptor **Disponible / Agotado** por cada uno.
- El estado de cada sabor se guarda y **viaja al link del cliente** al publicar el
  menú (igual que el "agotado" por platillo hoy).
- Al armar el pedido (comandera **y** link), un sabor apagado **no aparece** entre
  las opciones de sabor.
- Se mantiene el interruptor de **toda la familia** (Disponible/Agotado del
  platillo completo) como hasta ahora.

**Queda FUERA (v1):**
- Cambiar el armado del pedido a "19 bebidas individuales": sigue siendo 5
  familias + choice de sabor. El desglose por sabor es **solo del editor**.
- Toggles por opción en otras categorías (baos, refrescos, coberturas): esto es
  **solo para Bubble Tea** por ahora.
- Precios por sabor: el precio sigue por tamaño de la familia (no cambia).

## Comportamiento esperado
- **Editor:** bajo cada platillo de Bubble Tea aparece la lista de sabores; cada
  uno con su toggle. Al apagar uno, queda marcado "Agotado" y se guarda; el resto
  de sabores no se afecta. El toggle de la familia completa sigue disponible.
- **Comandera:** al abrir un Bubble Tea, la sección "Sabor" muestra solo los
  sabores disponibles. Si el mesero apagó "Taro", ya no puede elegir Taro.
- **Link del cliente:** tras publicar el menú, el cliente tampoco ve el sabor
  apagado.
- **Publicar:** el estado por sabor se publica junto con el menú (mismo mecanismo
  que el "agotado" por platillo).

## Posibles errores y mitigaciones
- **Se apagan todos los sabores de una familia:** el platillo se abre pero no hay
  sabor que elegir, así que "Agregar" queda deshabilitado (no se puede pedir).
  Aceptable; lo natural sería que el admin apague la familia completa en ese caso.
- **Menús ya guardados sin el campo por sabor:** un sabor sin marca se considera
  **disponible** (no requiere migración; apagar es explícito).
- **Sabor apagado que estaba en un pedido en curso:** el pedido ya armado no se
  altera; el filtro aplica al abrir la hoja para elegir.

## Futuro (v2)
- Extender los toggles por opción a otras categorías si hace falta.
- Aviso visual en la comandera cuando una familia quedó sin sabores disponibles.
