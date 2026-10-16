# Renombrar sabores: Pitahaya → Dragon

> Spec del usuario — Spec-Driven Development
> Fecha: 2026-10-16 · Estado: 🟢 Aprobado

## Overview
Cambiar el nombre de dos sabores de Bubble Tea (solo el texto): el sabor
**"Blue Pitahaya"** de Milk Tea pasa a **"Blue Dragon"**, y el sabor
**"Pitahaya Soda"** de Soda Tea pasa a **"Dragon Soda"**. En comandera y link.

## Usuario(s) objetivo
- **Mesero** (comandera) y **cliente** (link): ven los nombres nuevos al armar.
- **Barista**: recibe el nombre nuevo en el mensaje.

## Contexto del problema
El local decidió usar "Dragon" en lugar de "Pitahaya" en esas dos bebidas. Hay que
reflejar el cambio de nombre en la app.

## Alcance v1
**Sí entra:**
- Milk Tea: sabor **"Blue Pitahaya" → "Blue Dragon"** (mismo id interno).
- Soda Tea: sabor **"Pitahaya Soda" → "Dragon Soda"** (mismo id interno).
- En comandera y link (menú compartido) y en menús ya guardados (migración).

**Queda FUERA:**
- Cambiar precios, tamaños, dulzor o cualquier otra cosa.
- Otros sabores o bebidas (incluido "Dragon-Mango Soda", que no cambia).

## Comportamiento esperado
- Al abrir Milk Tea aparece **Blue Dragon** (ya no "Blue Pitahaya"); en el pedido
  se lee "Milk Tea · … · Blue Dragon".
- Al abrir Soda Tea aparece **Dragon Soda** (ya no "Pitahaya Soda").
- El cambio se ve igual en comandera, link, mensaje a la barista y cierre.
- En el celular del admin, el nombre cambia solo (migración), conservando el
  estado "agotado" de ese sabor si lo tenía.

## Posibles errores y mitigaciones
- **Menú guardado con el nombre viejo:** la migración lo renombra por id
  (idempotente: si ya dice el nombre nuevo, no hace nada).
- **Ventas/cierres pasados con el nombre viejo:** se conservan tal cual (guardan su
  propio texto); no es necesario reescribir el historial.

## Futuro (v2)
- Nada pendiente para este cambio.
