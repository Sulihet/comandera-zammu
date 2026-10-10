# Bubble Tea — Pumpkin Spice (temporada) y Pistache (Milk Tea)

> Spec del usuario — Spec-Driven Development
> Fecha: 2026-10-09 · Estado: 🟢 Aprobado

## Overview
Sumar dos bebidas al menú de Bubble Tea: **Pistache** como sabor nuevo dentro de
la familia **Milk Tea** (permanente), y **Pumpkin Spice** como **platillo propio
de temporada** con su propio precio. Ambas en la comandera del mesero y en el link
del cliente.

## Usuario(s) objetivo
- **Mesero** (comandera): arma el pedido con los nuevos sabores/bebida.
- **Cliente** (link de autoservicio): los ve y los pide.
- **Barista** (indirecto): los recibe en el mensaje de WhatsApp.
- **Administrador**: puede apagar el Pumpkin Spice cuando acabe la temporada.

## Contexto del problema
El local sumó a su carta un sabor nuevo de Milk Tea (**Pistache**) y una bebida
**de temporada** (**Pumpkin Spice**). La app no los tiene; sin agregarlos no se
pueden pedir desde la comandera ni desde el link, ni llegan a la barista.

## Alcance v1

**Sí entra:**
- **Pistache** = sabor nuevo dentro del platillo **Milk Tea** (`bt_milktea`).
  - Misma base/precio que los demás Milk Tea: **Chico $65 / Grande $75**.
  - Permanente (no de temporada). Se suma al choice de sabor existente.
- **Pumpkin Spice** = **platillo propio** nuevo en la categoría Bubble Tea.
  - **Una sola bebida** (sin sub-sabores): en la hoja se elige **Tamaño**
    (Chico **$78** / Grande **$88**) y **Dulzor** (Poco/Normal/Extra, obligatorio,
    sin costo), igual que el resto de Bubble Tea.
  - Marcado como **temporada** (nota visible en el nombre).
  - Precio **editable** desde la sección Menú (como cualquier platillo con tamaños).
- Ambos aparecen en **comandera y link** (menú compartido) y se inyectan a los
  menús ya guardados en el celular (migración), sin borrar precios/ediciones.
- Van en el **detalle de la línea**: carrito, mensaje a la barista (sección
  🧋 BUBBLE TEA), cierre y resumen del día.

**Queda FUERA (v1):**
- Pumpkin Spice NO va dentro de la lista de sabores de Milk Tea (es platillo aparte).
- Sub-sabores del Pumpkin Spice (es una sola bebida).
- Un sistema de "temporada" con fechas automáticas: por ahora se apaga a mano con
  el toggle **Disponible/Agotado** del platillo cuando termine la temporada.
- Cambiar precios o estructura de las demás bebidas.

## Comportamiento esperado
- **Milk Tea (comandera y link):** al abrir Milk Tea, entre los sabores aparece
  **Pistache**; elegirlo no cambia el precio ($65/$75 según tamaño). Se arma con
  Tamaño → Sabor (incluye Pistache) → Dulzor, como hoy.
- **Pumpkin Spice (comandera y link):** aparece como platillo propio en Bubble Tea
  con su nota de temporada. Al abrirlo se elige **Tamaño** (Chico $78 / Grande $88)
  y **Dulzor**; no hay sub-sabor. "Agregar" se habilita al elegir tamaño y dulzor.
- **Detalle/mensaje:** la línea muestra el tamaño y (para Milk Tea) el sabor y el
  dulzor; para Pumpkin Spice, tamaño y dulzor. Llega a la barista en su sección.
- **Fin de temporada:** el admin apaga el Pumpkin Spice desde Menú
  (Disponible→Agotado); deja de verse en comandera y, al publicar, en el link.
- **Editar precio:** el Pumpkin Spice se edita por tamaño en la sección Menú.

## Posibles errores y mitigaciones
- **No elige tamaño o dulzor en Pumpkin Spice:** "Agregar" queda deshabilitado con
  "Elige las opciones para continuar" (patrón actual).
- **Menús ya guardados sin las novedades:** se inyectan por migración (Pistache al
  sabor de Milk Tea; Pumpkin Spice como platillo nuevo), sin tocar precios, sabores
  ni "agotado" por sabor que el usuario haya editado.
- **Temporada terminada pero bebida visible:** se resuelve apagándola (Agotado);
  no requiere cambio de código cada temporada.
- **Pedido en curso al momento del cambio:** las líneas ya armadas no se alteran.

## Futuro (v2)
- Marca visual de "temporada" más allá del nombre (etiqueta/emoji destacado).
- Programar inicio/fin de temporada por fecha (encendido/apagado automático).
- Más sabores o bebidas de temporada si se repiten cada año.
