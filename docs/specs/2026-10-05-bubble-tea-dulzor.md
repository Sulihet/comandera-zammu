# Bubble Tea — elección de dulzor

> Spec del usuario — Spec-Driven Development
> Fecha: 2026-10-05 · Estado: 🟢 Aprobado

## Overview
Agregar a cada platillo de **Bubble Tea** una elección de **dulzor** con 3
niveles (**Poco dulce · Normal · Extra dulce**), obligatoria y sin costo. Así el
cliente que pide su bebida más o menos dulce queda registrado con exactitud y la
barista prepara el nivel correcto, sin ambigüedad ni recaptura.

## Usuario(s) objetivo
- **Mesero** (comandera): arma el pedido y elige el dulzor junto con tamaño y sabor.
- **Cliente** (link de autoservicio): elige su dulzor al armar su bebida.
- **Barista** (indirecto): recibe el nivel de dulzor en el mensaje de WhatsApp.

## Contexto del problema
Hoy el Bubble Tea solo tiene tamaño + sabor. Los clientes piden a veces "más
dulce" o "menos dulce", y eso se queda en una nota libre (si acaso) o se pierde,
generando bebidas mal hechas o preguntas de vuelta. No hay una forma estándar de
capturar el dulzor.

## Alcance v1

**Sí entra:**
- Una elección nueva de **dulzor** en **los 5 platillos de Bubble Tea**
  (Milk Tea, Matcha, Yakult Tea, Soda / Blue Soda, Fruit Tea).
- Niveles: **Poco dulce · Normal · Extra dulce**.
- **Obligatoria y sin preseleccionar**: el botón "Agregar" sigue deshabilitado
  hasta elegir tamaño, sabor **y** dulzor (mismo patrón actual).
- **Sin costo** (no modifica el precio).
- Aparece en la **comandera y en el link del cliente** (menú compartido).
- El dulzor elegido viaja en el **detalle de la línea** del pedido: en el carrito,
  en el mensaje a la barista (sección 🧋 BUBBLE TEA), en el cierre y en el resumen.
- Se aplica a los menús ya guardados en el celular sin borrar precios/ediciones
  (migración), y se refleja en el link al publicar el menú.

**Queda FUERA (v1):**
- Dulzor en las bebidas actuales (Refresco, Té Arizona, Bebida coreana): no cambian.
- Otros niveles o escala por porcentaje (0/25/50/75/100): v1 usa solo los 3.
- Otras personalizaciones de Bubble Tea (hielo, toppings/perlas extra): no entran.
- Costo por nivel de dulzor: es gratis.

## Comportamiento esperado
- **Armar (mesero y cliente):** al abrir un Bubble Tea, además de **Tamaño** y
  **Sabor**, aparece **Dulzor** con sus 3 opciones, ninguna preseleccionada. El
  botón "Agregar" se habilita solo cuando se eligieron las tres. El precio no
  cambia según el dulzor.
- **En el carrito / pedido:** la línea muestra tamaño · sabor · dulzor
  (ej. "Milk Tea — Grande 560 ml · Taro · Extra dulce").
- **Mensaje a la barista:** la línea de Bubble Tea incluye el dulzor en su detalle,
  junto a tamaño y sabor.
- **Cierre:** las ventas se agrupan por platillo + detalle, así que el dulzor
  queda reflejado en el desglose (como ya pasa con tamaño y sabor).
- **Link del cliente:** tras publicar el menú, el cliente ve y elige el dulzor
  igual que en la comandera.

## Posibles errores y mitigaciones
- **No elige dulzor:** el botón "Agregar" permanece deshabilitado con el aviso
  "Elige las opciones para continuar" (mismo patrón actual).
- **Menús ya guardados sin la elección de dulzor:** se inyecta por migración a los
  5 platillos de Bubble Tea, sin tocar precios ni "agotado" por sabor ya editados.
- **Pedido en curso al momento del cambio:** las líneas ya armadas no se alteran;
  el dulzor aplica al abrir la hoja para armar.

## Futuro (v2)
- Dulzor (o nivel de hielo) en otras bebidas si se pide.
- Escala por porcentaje si el local la adopta.
- Toppings/perlas extra (posiblemente con costo).
