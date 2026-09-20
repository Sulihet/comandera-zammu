# Bubble Tea — agotado por sabor — Plan

> Plan de implementación — Spec-Driven Development
> Fecha: 2026-09-19

## Objetivo
Permitir encender/apagar cada **sabor** de Bubble Tea por individual desde el
editor de Menú; un sabor apagado desaparece del armado (comandera y link) y su
estado viaja al link al publicar. El armado sigue siendo familia + choice de sabor.

## Contexto del problema
El "agotado" hoy es por platillo (familia completa). Falta granularidad por sabor.
Restricciones: PWA estática, menú en localStorage, lógica de sabor compartida por
comandera (`app.js`) y link (`pedir.js`), subir `CACHE` de `sw.js` al tocar JS/CSS.

## Spec de referencia
[docs/specs/2026-09-19-bubble-tea-agotado-por-sabor.md](../specs/2026-09-19-bubble-tea-agotado-por-sabor.md)
(🟢). Exige: toggle por sabor solo en el editor, para Bubble Tea; sabor apagado no
se puede elegir al armar; estado por sabor se publica al link.

## Tareas a implementar

### 1. Editor de Menú — toggle por sabor — `js/app.js` (`renderMenuEditor`)
- Para cada item con `cat === 'bubbletea'` que tenga un choice `id:'sabor'`,
  renderizar bajo la fila un bloque "Sabores" con cada opción y un checkbox
  `data-oavail="<itemId>:<optId>"`, etiqueta **Disponible/Agotado**
  (`o.available === false` = agotado).
- Mantener intacto el toggle de la familia completa (`data-avail`).
- **Verificación:** en Menú, cada Bubble Tea muestra su lista de sabores con toggles.

### 2. Handler del toggle por sabor — `js/app.js` (bind, `change` del editor)
- En el listener `change` de `#menu-editor`, manejar `data-oavail`: partir
  `itemId:optId`, encontrar el item, su choice `sabor` y la opción; setear
  `opt.available = t.checked`; `persistMenu()` + `renderMenuEditor()`.
- **Verificación:** apagar/encender un sabor persiste (recargar y sigue igual) y
  dispara la publicación al link (misma ruta que `data-avail`).

### 3. Ocultar sabor agotado al armar — comandera — `js/app.js` (`openItemSheet`)
- En el render de opciones de choice, filtrar `ch.options.filter((o) => o.available !== false)`.
- **Verificación:** apagar "Taro" en Menú → al abrir Milk Tea en Pedido, Taro no
  aparece; el resto sí.

### 4. Ocultar sabor agotado al armar — link — `js/pedir.js`
- Mismo filtro `o.available !== false` donde se pintan las opciones del choice.
- **Verificación:** con el menú de respaldo, un sabor con `available:false` no se
  ve en la hoja del link.

### 5. Publicación al link
- No requiere código nuevo: `persistMenu()` ya llama a `publishMenu()` y el menú
  publicado incluye las opciones completas (con su `available`). El link filtra en
  la tarea 4.
- **Verificación:** el objeto de menú guardado contiene `available:false` en la
  opción apagada.

### 6. Estilos mínimos — `css/styles.css` (si hace falta)
- Un bloque compacto para la lista de sabores en el editor (reutilizar `.mini` /
  `.switch` en lo posible; agregar clase `.edit-flavors` solo si mejora la lectura).
- **Verificación:** la lista se ve ordenada y tocable en móvil.

### 7. Service worker — `sw.js`
- Subir `CACHE` v62 → v63 (se tocó JS y quizá CSS).

## Información importante
- **Sin migración**: opciones sin `available` = disponibles (`!== false`). Apagar
  es explícito; menús viejos siguen funcionando.
- **Solo Bubble Tea**: el bloque de sabores en el editor se limita a
  `cat === 'bubbletea'`. El filtro `available !== false` en las hojas es genérico
  pero inofensivo (ninguna otra opción trae ese campo).
- **Edge case (todos los sabores off)**: la familia se abre sin sabor elegible →
  "Agregar" queda deshabilitado (no se puede pedir). Aceptable en v1.
- **Cache**: recordar que el celular necesita recargar para recibir el JS nuevo
  (SW "primero la red").
