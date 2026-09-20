# Bubble Tea — Plan

> Plan de implementación — Spec-Driven Development
> Fecha: 2026-09-19

## Objetivo
Agregar la categoría **Bubble Tea** 🧋 (5 familias, cada una con tamaño
Chico/Grande + choice de sabor) al menú compartido, para que aparezca en la
comandera y en el link del cliente, se envíe al grupo de WhatsApp en su propia
sección `🧋 BUBBLE TEA` (la prepara la barista), y cuente en el cierre como
concepto propio.

## Contexto del problema
El negocio sumó Bubble Tea a su carta y la app no lo tiene. Restricciones del
proyecto (CLAUDE.md): PWA estática sin build, menú vive en localStorage (por eso
hay migración), lógica de precio compartida por comandera y link (`menu-logic.js`),
y hay que subir la versión `CACHE` de `sw.js` al tocar JS.

## Spec de referencia
[docs/specs/2026-09-19-bubble-tea.md](../specs/2026-09-19-bubble-tea.md) (🟢 Aprobado).
Exige: categoría nueva con 5 platillos (variante de tamaño obligatoria + choice de
sabor, sin otras opciones), envío al mismo grupo en sección propia, cuenta en el
cierre, aparece en comandera y link; sin tocar las bebidas actuales.

## Tareas a implementar

### 1. Menú por defecto — `js/menu-data.js`
- Agregar la categoría `{ id: 'bubbletea', name: 'Bubble Tea', icon: '🧋' }` a
  `categories`. Colocarla **antes de `bebidas`** para que en el mensaje de
  WhatsApp la sección salga junto a lo de cocina/barra y separada de las bebidas.
- Agregar 5 items (patrón hamburguesa: `variants` de tamaño + `choices` de sabor,
  `notes: true`), ids `bt_milktea`, `bt_matcha`, `bt_yakult`, `bt_soda`,
  `bt_fruit`:
  - **Milk Tea** — Chico $65 / Grande $75 · sabores: Black Sugar, Mazapán, Taro,
    Blue Coco, Blue Mango, Blue Fresa.
  - **Matcha** — Chico $75 / Grande $85 · sabores: Ube, Mango, Fresa.
  - **Yakult Tea** — Chico $75 / Grande $85 · sabores: Mango, Fresa, Maracuyá.
  - **Soda / Blue Soda** — Chico $55 / Grande $65 · sabores: Galaxy, Fresa Blue,
    Mango Blue.
  - **Fruit Tea** — Chico $65 / Grande $75 · sabores: Maracuyá, Jamaica, Mango,
    Durazno.
  - Variantes con ids `chico` / `grande` y nombres "Chico 430 ml" / "Grande 560 ml".
  - Choice `{ id:'sabor', name:'Sabor', required:true, options:[...] }`.
- **Verificación:** al resetear menú, aparece la pestaña/categoría Bubble Tea con
  5 platillos y precios correctos por tamaño.

### 2. Migración para menús guardados — `js/store.js` (`migrateMenu`)
- Inyectar a menús ya guardados en el celular, sin borrar ediciones:
  - Si `m.categories` no tiene `bubbletea`, insertarla **antes de `bebidas`**
    (o al final si no existe bebidas).
  - Si faltan los 5 items `bt_*`, agregarlos (mismos datos que la tarea 1),
    idealmente contiguos y ubicados junto a la categoría.
- Debe marcar `changed = true` para que se persista.
- **Verificación:** con un menú viejo en localStorage (sin bubbletea), al abrir la
  app aparece la categoría con sus 5 platillos y no se pierden precios editados.

### 3. Enviar a la barra por WhatsApp — `js/app.js`
- Agregar `'bubbletea'` a `KITCHEN_CATS`.
- Confirmar que `isKitchenLine` no lo excluye (el filtro de hot-dog es por nombre;
  los nombres de Bubble Tea no lo activan). Con esto, `buildWhatsappText` genera
  automáticamente la sección `🧋 BUBBLE TEA` (recorre `menu.categories`), y
  `orderHasKitchen`/`kitchenSig` lo cuentan como algo que va al grupo.
- **Verificación:** un pedido con Bubble Tea produce mensaje con sección
  `🧋 BUBBLE TEA`; un pedido **solo** de Bubble Tea sí se envía (el botón no cae en
  "Guardar pedido (no va a cocina)").

### 4. Cierre — concepto propio — `js/app.js` (`conceptOf`)
- Agregar rama: `if (cat === 'bubbletea') return { key:'bubbletea', label:'Bubble Tea', icon:'🧋', order: 5.5 }`
  (entre bebidas y baos, o el orden que se vea mejor; no debe caer en "Otros").
- **Verificación:** al vender Bubble Tea y ver el cierre, aparece el concepto
  🧋 Bubble Tea con cantidad e ingreso, agrupado por familia · tamaño · sabor, y
  suma al total del día.

### 5. Placeholder de nota (opcional, menor) — `js/menu-logic.js`
- En `notePlaceholder`, agregar `if (cat === 'bubbletea') return 'ej. menos dulce, sin hielo';`
  para dar un ejemplo útil de nota en la hoja del platillo (comandera y link).
- **Verificación:** al abrir un Bubble Tea, el campo de nota muestra ese ejemplo.

### 6. Link del cliente — `js/pedir.js`
- No requiere cambios de código: renderiza categorías/items genéricamente y calcula
  precio con `MenuLogic`. Solo **verificar** que Bubble Tea se ve, se puede armar
  (tamaño + sabor, "Agregar" deshabilitado hasta completar), suma al total y sale
  en el mensaje del cliente. (Aderezos no aplican: no está en `PEDIR_CONFIG.ADEREZOS`.)

### 7. Service worker — `sw.js`
- Subir la versión `CACHE` (v61 → v62) porque se tocó JS, para que el celular
  reciba la actualización.
- **Verificación:** `CACHE` incrementado.

## Información importante
- **Sin opciones nuevas**: el Bubble Tea reutiliza el modelo existente (variantes +
  choice), así que `MenuLogic.calcUnitPrice`/`buildDetail` ya lo soportan sin
  cambios. No hay `extras` ni `overridePrice`.
- **Precio por familia consistente**: dentro de cada familia todas las bebidas
  cuestan igual, por eso el precio vive en la variante de tamaño del platillo y el
  sabor no altera el precio (choice sin `priceDelta`).
- **Casos raros (planning-QS):**
  - Pedido **solo de barra** → debe enviarse (cubierto por la tarea 3).
  - **Agotado** → el flag `available:false` ya lo maneja el editor/link.
  - **Corrección** → al reeditar, si cambia lo de barra/cocina se reenvía; si no,
    no (lógica de `kitchenSig` existente, ya incluye bubbletea al añadirlo a
    `KITCHEN_CATS`).
- **Fuera de alcance** (no tocar): bebidas actuales, azúcar/hielo/toppings,
  descripciones largas, mensaje separado para la barista.
- **Orden de la sección en el mensaje**: depende de la posición de `bubbletea` en
  `menu.categories`; por eso se coloca antes de `bebidas` (tareas 1 y 2).
- **Publicar al link**: tras editar/guardar el menú, el admin usa "Publicar menú al
  link" (o el auto-publish) como con cualquier cambio de menú; no es código nuevo.
