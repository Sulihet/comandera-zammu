# Menú navideño: Gansito, Ponche Navideño y Choco-bombas

> Spec del usuario — Spec-Driven Development
> Fecha: 2026-11-20 · Estado: 🟢 Aprobado

## Overview
Agregar tres productos de **temporada navideña** al menú, visibles en la comandera
y en el link del cliente: una **banderilla de Gansito**, un **Ponche Navideño**
(categoría nueva) y unas **Choco-bombas** (categoría nueva). Son de temporada:
se marcan en el nombre (🎄) y se apagan con el toggle "Agotado" al terminar.

## Usuario(s) objetivo
- **Mesero** (comandera) y **cliente** (link): los ven y los piden.
- **Administrador**: los apaga al acabar la temporada.

## Contexto del problema
Llega la temporada navideña y el local sumó tres productos especiales. La app no
los tiene; sin agregarlos no se pueden tomar ni en la comandera ni en el link.

## Alcance v1

**Sí entra:**
- **Banderilla de Gansito** 🎄 — nuevo sabor dentro de **Banderillas Dulces**,
  precio **$50** (los otros dulces son $60; este queda fijo en $50). Como toda
  banderilla, **no va a cocina**; cuenta en el cierre.
- **Ponche Navideño** 🎄 — **categoría nueva** con un producto en 3 tamaños:
  **Chico $25 · Medio litro $35 · Un litro $55**. **No va a WhatsApp** (como los
  refrescos); cuenta en el cierre. El mesero lo entrega.
- **Choco-bombas** 🎄 — **categoría nueva** con un producto en 3 presentaciones:
  **1 pza $35 · Caja de 2 $60 · Caja de 4 $115**. **No va a WhatsApp**; cuenta en
  el cierre.
- Los tres aparecen en **comandera y link** (menú compartido) y se inyectan a los
  menús ya guardados en el celular (migración), sin tocar el resto.
- En el cierre, Ponche y Choco-bombas aparecen como **conceptos propios**; la
  banderilla de Gansito cuenta dentro del concepto Banderillas.

**Queda FUERA:**
- Que Ponche o Choco-bombas se envíen a cocina/barra por WhatsApp.
- Fechas automáticas de temporada (se apaga a mano con "Agotado").
- Tocar otros productos o categorías.

## Comportamiento esperado
- **Banderillas Dulces:** al abrir, entre los tipos aparece **Gansito 🎄 (temporada)**;
  elegirlo deja el total en **$50** (los otros siguen en $60). Se arma y cuenta normal.
- **Ponche Navideño:** categoría nueva con su producto; al abrirlo se elige el
  **Tamaño** (Chico $25 / Medio litro $35 / Un litro $55). "Agregar" se habilita al
  elegir tamaño; permite nota libre.
- **Choco-bombas:** categoría nueva con su producto; se elige la **Presentación**
  (1 pza $35 / Caja 2 $60 / Caja 4 $115).
- **Cierre:** los tres suman al total del día; Ponche y Choco-bombas salen como
  conceptos propios 🎄/🍫; Gansito dentro de Banderillas.
- **Link del cliente:** refleja los tres al publicar el menú.
- **Fin de temporada:** el admin los apaga en Menú (Disponible→Agotado) y, al
  publicar, dejan de verse en el link.

## Posibles errores y mitigaciones
- **No elige tamaño/presentación:** "Agregar" queda deshabilitado con "Elige las
  opciones para continuar" (patrón actual).
- **Menús ya guardados sin las novedades:** se inyectan por migración (idempotente),
  sin tocar precios/ediciones ni "agotados" existentes.
- **Concepto no reconocido en el cierre:** se agregan los conceptos de Ponche y
  Choco-bombas para que no caigan en "Otros".
- **Pedido en curso al momento del cambio:** las líneas ya armadas no se alteran.

## Futuro (v2)
- Agrupar lo de temporada bajo una sola sección "Navidad" si crece.
- Programar encendido/apagado por fecha.
