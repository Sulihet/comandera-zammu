# Bubble Tea — actualización de menú (oct 2026)

> Spec del usuario — Spec-Driven Development
> Fecha: 2026-10-15 · Estado: 🟢 Aprobado

## Overview
Actualizar el menú de **Bubble Tea** (comandera y link) a la nueva carta del
local: cambian algunos sabores de Milk Tea y Soda, se renombra "Soda / Blue Soda"
a "Soda Tea", y Fruit Tea cambia su lista de sabores y su precio. Se **conserva**
el Pumpkin Spice (temporada) y no se tocan las bebidas normales.

## Usuario(s) objetivo
- **Mesero** (comandera) y **cliente** (link): arman el pedido con la carta nueva.
- **Barista**: recibe los sabores vigentes.
- **Administrador**: su celular (con sus "agotados" ya marcados) recibe el cambio
  sin perder esas marcas ni re-capturar nada.

## Contexto del problema
El local cambió su carta de Bubble Tea. La app tiene sabores que ya no existen y
le faltan los nuevos; además Fruit Tea subió de precio. Hay que dejar la app igual
a la carta nueva, en comandera y link.

## Alcance v1

**Cambios (solo Bubble Tea):**
- **Milk Tea** ($65/$75, precio igual):
  - Quitar **Blue Coco**. Agregar **Blue Pitahaya**.
  - Se quedan: Black Sugar, Mazapán, Taro, Blue Mango, Blue Fresa, Pistache.
- **Matcha** ($75/$85): sin cambios.
- **Yakult Tea** ($75/$85): sin cambios.
- **Soda / Blue Soda** → renombrar a **"Soda Tea"** ($55/$65, precio igual):
  - Quitar **Mango Blue**. Agregar **Dragon-Mango** y **Pitahaya Soda**.
  - Se quedan: Galaxy, Fresa Blue.
- **Fruit Tea** (precio **$65/$75 → $70/$80**):
  - Quitar **Maracuyá, Mango, Durazno**. Agregar **Tropical, Mango-Maracuya,
    Lichi-Durazno**. Se queda: Jamaica.
- **Pumpkin Spice 🍂 (temporada)**: se conserva tal cual.

**Queda FUERA:**
- Bebidas normales (Refresco, Té Arizona, Bebida Coreana): sin cambios.
- Cambiar dulzor, tamaños (Chico/Grande) o estructura general.
- Tocar otras categorías (banderillas, fast food, etc.).

## Comportamiento esperado
- **Comandera y link:** al abrir cada familia, la lista de sabores es la nueva
  (sin los eliminados, con los agregados). Fruit Tea muestra **$70/$80**. La
  familia de sodas se llama **"Soda Tea"**. Pumpkin Spice sigue disponible.
- **Celular del admin (menú ya guardado):** al abrir la app, el cambio se aplica
  solo (migración). Los **"agotados" por sabor** que el admin marcó en sabores que
  se quedan (ej. Galaxy, Jamaica) **se conservan**. Los sabores eliminados
  desaparecen (su estado deja de existir, sin error).
- **Link del cliente:** refleja la carta nueva al publicar el menú.
- **Barista / cierre:** reciben los sabores vigentes en el detalle de la línea.

## Posibles errores y mitigaciones
- **Sabor eliminado que estaba "agotado":** se elimina sin problema (su marca ya no
  aplica).
- **Precio de Fruit Tea editado a mano en el celular:** el cambio a $70/$80 se
  aplica solo si el precio sigue en el valor viejo ($65/$75); si el admin lo cambió
  a otro valor a propósito, no se pisa.
- **Pedido en curso con un sabor que se elimina:** la línea ya armada no se altera;
  el filtro aplica al abrir la hoja para armar.
- **Migración repetida:** es idempotente (no duplica sabores ni vuelve a quitar lo
  ya quitado).

## Futuro (v2)
- Un editor de sabores dentro de la pantalla Menú (agregar/quitar sabores sin
  tocar código), para que cambios así no dependan de una actualización de la app.
