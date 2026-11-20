# Eliminar Pumpkin Spice del menú

> Spec del usuario — Spec-Driven Development
> Fecha: 2026-11-20 · Estado: 🟢 Aprobado

## Overview
Quitar por completo el platillo **Pumpkin Spice 🍂 (temporada)** de Bubble Tea, en
comandera y link. Terminó su temporada (otoño) y el admin no quiere verlo
bloqueado/gris en la comandera durante meses. Se elimina del código y deja de
re-inyectarse.

## Usuario(s) objetivo
- **Mesero** (comandera) y **cliente** (link): ya no lo ven.
- **Administrador**: su celular pierde el ítem sin afectar el resto del menú.

## Contexto del problema
Pumpkin Spice es un platillo base de Bubble Tea que la app **re-inyecta** en cada
carga (migración), así que "Eliminar" desde el editor no funciona (vuelve). Para
quitarlo de verdad hay que sacarlo del código y dejar de re-inyectarlo.

## Alcance v1
**Sí entra:**
- Quitar el item `bt_pumpkin` del menú de fábrica (`menu-data.js`).
- Dejar de re-inyectarlo en la migración y **quitarlo** de los menús ya guardados.
- Aplica en comandera y link.

**Queda FUERA:**
- Tocar los demás Bubble Tea ni otros productos de temporada (Gansito, Ponche,
  Choco-bombas).
- Borrar el historial: los cierres pasados que vendieron Pumpkin Spice se conservan.

## Comportamiento esperado
- **Comandera y link:** Pumpkin Spice ya no aparece en Bubble Tea (ni gris ni
  bloqueado: desaparece).
- **Celular del admin:** al abrir la app, el ítem se va solo (migración) y no vuelve
  a reaparecer; el resto del Bubble Tea queda igual.
- **Historial:** un día cerrado con Pumpkin Spice se sigue viendo bien (datos
  guardados, independientes del menú).

## Posibles errores y mitigaciones
- **Migración repetida:** idempotente (si ya no está, no hace nada).
- **Pedido en curso con Pumpkin Spice:** caso muy raro; al recargar ya no existe en
  el menú.
- **Reportes históricos:** `conceptOf('bubbletea')` sigue existiendo, así que una
  venta pasada de Pumpkin Spice se agrupa bien bajo Bubble Tea.

## Futuro (v2)
- Si el próximo otoño regresa, se vuelve a agregar en código (como se hizo este año).
