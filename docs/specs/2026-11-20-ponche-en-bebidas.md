# Ponche Navideño dentro de Bebidas (no categoría propia)

> Spec del usuario — Spec-Driven Development
> Fecha: 2026-11-20 · Estado: 🟢 Aprobado

## Overview
Mover el **Ponche Navideño** de ser una categoría propia a ser **un ítem más
dentro de la categoría Bebidas**, junto a Refresco, Té Arizona y Bebida Coreana.
Sigue siendo de temporada (🎄) y con sus 3 tamaños/precios. Choco-bombas NO cambia
(sigue como categoría aparte).

## Usuario(s) objetivo
- **Mesero** (comandera) y **cliente** (link): encuentran el Ponche dentro de Bebidas.
- **Administrador**: su celular recibe el cambio sin perder ediciones.

## Contexto del problema
El Ponche quedó como categoría propia, pero el admin prefiere tenerlo agrupado con
las demás bebidas (Refresco, Té, Bebida Coreana) para que el menú sea más natural.

## Alcance v1

**Sí entra:**
- Quitar la categoría propia **"Ponche Navideño"** del menú.
- El producto **Ponche Navideño 🎄 (temporada)** pasa a la categoría **Bebidas**
  (4º ítem, junto a Refresco/Té Arizona/Bebida Coreana), con los mismos tamaños y
  precios: **Chico $25 · Medio litro $35 · Un litro $55**.
- En comandera y link, y en menús ya guardados (migración), sin perder ediciones.

**Queda FUERA:**
- Choco-bombas: se queda como su propia categoría (no cambia).
- Cambiar precios, tamaños o el resto de las bebidas.

## Comportamiento esperado
- **Comandera y link:** ya no aparece la pestaña/categoría "Ponche Navideño"; el
  Ponche se ve dentro de **Bebidas**, después de Bebida Coreana. Se arma igual
  (elegir tamaño).
- **Cierre:** al estar en Bebidas, el Ponche cuenta dentro del concepto **🥤 Bebidas**
  (ya no como concepto propio 🎄); se distingue por su nombre en el desglose.
- **Celular del admin (menú guardado con la categoría vieja):** al abrir la app, la
  categoría "Ponche Navideño" desaparece y el ítem queda dentro de Bebidas,
  conservando precio/agotado que el admin haya editado.
- **Link:** refleja el cambio al publicar el menú.

## Posibles errores y mitigaciones
- **Menú ya migrado con `ponche` como categoría:** la migración quita esa categoría
  y reasigna el ítem a `bebidas` (idempotente; si ya está en bebidas, no hace nada).
- **Ventas previas con el Ponche como categoría propia:** se conserva el caso en el
  cierre para no descolocar un posible día con esa venta (igual que con baos).
- **Pedido en curso:** las líneas ya armadas no se alteran.

## Futuro (v2)
- Si se agregan más bebidas de temporada, evaluar una subsección "Navidad".
