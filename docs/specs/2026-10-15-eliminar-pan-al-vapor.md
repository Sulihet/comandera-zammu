# Eliminar Pan al Vapor (Baos) del menú

> Spec del usuario — Spec-Driven Development
> Fecha: 2026-10-15 · Estado: 🟢 Aprobado

## Overview
Quitar por completo la categoría **Pan al Vapor** (los 4 baos) del menú, en la
comandera y en el link del cliente. El local dejó de ofrecerla. El historial de
días ya cerrados que vendieron baos se conserva intacto.

## Usuario(s) objetivo
- **Mesero** (comandera) y **cliente** (link): ya no ven ni pueden pedir baos.
- **Administrador**: su celular (con menú ya guardado) pierde la categoría sin
  afectar el resto del menú ni los cierres pasados.

## Contexto del problema
Pan al Vapor ya no está en la carta. Mientras siga en la app, el mesero o el
cliente podrían pedir algo que no se vende. Hay que eliminarlo de forma limpia.

## Alcance v1

**Sí entra:**
- Quitar la **categoría `baos`** ("Pan al Vapor") del menú.
- Quitar los **4 platillos**: Bao Sencillo, Bao Gourmet, Paquete 4 Baos,
  Paquete 6 Baos.
- Aplica en **comandera y link** (menú compartido) y a los **menús ya guardados**
  en el celular (migración), sin tocar el resto del menú ni los precios/ediciones.
- Pan al Vapor deja de ir a cocina por WhatsApp (ya no existe la categoría).

**Queda FUERA:**
- Borrar o alterar el **historial de días cerrados**: los cierres pasados que
  incluyeron baos se conservan y se siguen mostrando/agrupando bien.
- Tocar otras categorías.

## Comportamiento esperado
- **Comandera y link:** la pestaña/categoría "Pan al Vapor" ya no aparece; no hay
  baos que elegir ni en el armado ni en el editor de Menú.
- **Celular del admin (menú guardado):** al abrir la app, la categoría y sus baos
  desaparecen solos (migración); el resto del menú (precios, agotados, Bubble Tea)
  queda igual.
- **Cocina:** un pedido nuevo nunca incluye baos (ya no existen).
- **Historial/cierre de días pasados:** si un día cerrado tenía baos, se sigue
  viendo correctamente agrupado como "Pan al vapor" en ese cierre.

## Posibles errores y mitigaciones
- **Carrito en curso con un bao:** caso muy raro; al recargar con el menú nuevo el
  bao ya no existe en el menú. (Se asume que no hay un pedido a medias con baos en
  el momento del cambio.)
- **Migración repetida:** idempotente (si ya no están, no hace nada).
- **Reportes históricos:** la lógica que agrupa ventas por concepto conserva el
  caso "Pan al vapor" para que los cierres viejos no se descoloquen.

## Futuro (v2)
- Si algún día regresa, se vuelve a agregar como categoría (o se evalúa un editor
  de categorías dentro de la pantalla Menú).
