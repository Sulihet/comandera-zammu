# Ponche Navideño también va a cocina

> Spec del usuario — Spec-Driven Development
> Fecha: 2026-11-21 · Estado: 🟢 Aprobado

## Overview
Hacer que el **Ponche Navideño** (hoy un ítem dentro de Bebidas) **sí se envíe a
cocina** por WhatsApp cuando se pide, en su **propia sección** 🎄 PONCHE NAVIDEÑO
del mensaje. Las demás bebidas (Refresco, Té Arizona, Bebida Coreana) **no cambian**
(siguen sin enviarse).

## Usuario(s) objetivo
- **Mesero** (comandera) y **cliente** (link / pedido en línea): al pedir Ponche,
  llega a cocina.
- **Cocina**: recibe el Ponche en su apartado para prepararlo.

## Contexto del problema
El Ponche quedó dentro de Bebidas, y las bebidas no se mandan a nadie. Cocina pidió
recibir el Ponche para prepararlo, así que hay que incluirlo en el mensaje de cocina
sin arrastrar al resto de las bebidas.

## Alcance v1
**Sí entra:**
- El **Ponche Navideño** (`ponche_nav`) se trata como **línea de cocina**: un pedido
  con Ponche se envía al grupo de WhatsApp (igual que Fast Food/Coreano/Bubble Tea).
- En el mensaje a cocina aparece en su **propia sección** `━━ 🎄 PONCHE NAVIDEÑO ━━`.
- Aplica en comandera y en pedidos en línea del link (mismo `buildWhatsappText`).
- Un pedido que **solo** trae Ponche **sí se envía** (el botón ya no dice "no va a
  cocina").

**Queda FUERA:**
- Enviar a cocina las demás bebidas (Refresco/Té/Bebida Coreana): siguen igual.
- Cambiar dónde vive el Ponche en el menú (sigue dentro de Bebidas) ni su precio.
- Un segundo mensaje/hilo aparte para cocina (va en el mismo mensaje del grupo).

## Comportamiento esperado
- **Armar y enviar:** un pedido con Ponche hace que el botón sea "📲 Enviar a cocina"
  y, al enviar, el mensaje al grupo incluye `━━ 🎄 PONCHE NAVIDEÑO ━━` con las líneas
  de ponche (tamaño y nota).
- **Solo ponche:** un pedido de puro Ponche también se envía a cocina.
- **Corrección:** si al editar cambia el Ponche (se suma/quita/cambia), se reenvía el
  mensaje (cuenta como cambio de cocina); cambiar otras bebidas no reenvía.
- **Cierre:** sin cambios (el Ponche sigue contando dentro de 🥤 Bebidas en el cierre).

## Posibles errores y mitigaciones
- **Pedido en línea sin `itemId`:** el Ponche se detecta por `itemId === 'ponche_nav'`
  **o** por el nombre ("Ponche"), para cubrir cualquier ruta.
- **No arrastrar otras bebidas:** solo el Ponche es línea de cocina; Refresco/Té/
  Bebida Coreana siguen excluidos.
- **Pedido en curso:** las líneas ya armadas no se alteran.

## Futuro (v2)
- Si más productos de Bebidas deben ir a cocina, generalizar con una marca por ítem
  (`kitchen: true`) en vez de detectar por id/nombre.
