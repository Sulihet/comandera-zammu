# Plan — Nombre del cliente en el pedido (obligatorio)

## Context
Los pedidos hoy se identifican solo por número y hora, y al entregar el mesero no
sabe rápido de quién es cada uno. Este cambio agrega a la comanda un campo
**"Nombre del cliente"** junto al toggle 🍽️/🥡, **obligatorio**: sin nombre no se
envía a cocina ni se guarda. El nombre viaja con el pedido y aparece en el mensaje
de WhatsApp (encabezado `👤 Nombre`), en la lista de *Pedidos de hoy*, en el detalle
expandido y en el resumen del día (actual e Historial).

- Spec de referencia: `docs/specs/2026-07-17-nombre-de-cliente-en-pedido.md` (🟢 Aprobado)
- Alternativa elegida: **C · A + detalle y resumen** (obligatorio + visible en detalle y resumen).

## Marco (planning-QS)
- **Trabajo principal:** campo obligatorio de nombre en la comanda; bloquea envío/
  guardado si está vacío; el nombre viaja con el pedido y se muestra donde importa.
- **NO hace:** autocompletar nombres, búsqueda por nombre, otros datos del cliente.
- **Éxito:** enviar/guardar vacío → bloquea + avisa + enfoca; con nombre → sale en
  WhatsApp, Pedidos de hoy, detalle y resumen; persiste al recargar; edición lo conserva.
- **Casos raros:** vacío/solo espacios, nombres largos/emojis, pedidos viejos sin
  nombre, corrección, recarga a mitad de armado.

## Decisión de diseño
El nombre en curso se guarda en **`config.customerName`** (mismo patrón que
`config.serviceMode`: sobrevive recarga y se sincroniza al teclear). Al enviar se
copia al pedido (`order.customerName`) y `config.customerName` se limpia.

## Archivos a modificar
- `index.html` — input del nombre dentro de `.cart`.
- `js/app.js` — sync del input, validación, guardado en el pedido, y mostrarlo en
  WhatsApp / Cierre / detalle / resumen.
- `css/styles.css` — ajuste menor de espaciado (reutiliza `.field`).
- `sw.js` — subir `CACHE` de `v16` a `v17`.

## Tareas

### 1. Input en la comanda (`index.html`, dentro de `.cart`, ~línea 29-30)
Entre `#edit-banner` y `#service-mode` agregar:
```html
<div class="field cart-name-field">
  <label for="customer-name">Nombre del cliente</label>
  <input type="text" id="customer-name" placeholder="ej. Ana" autocomplete="off" maxlength="40">
</div>
```
Reutiliza `.field` (label + input full-width ya estilizados, css línea 184-187).

### 2. Sincronizar el input con el estado (`js/app.js`)
- En `renderCart` (~línea 85): tras pintar, fijar el valor:
  `const nm = $('#customer-name'); if (nm) nm.value = config.customerName || '';`
- En `bind()` (junto al listener de `#service-mode`, ~línea 823): agregar
  `$('#customer-name').oninput = (e) => { config.customerName = e.target.value; Store.saveConfig(config); };`

### 3. Validación obligatoria (`sendOrder`, ~línea 272)
Al inicio de `sendOrder`, antes de crear el pedido:
```js
const customerName = (config.customerName || '').trim();
if (!customerName) {
  toast('Escribe el nombre del cliente');
  const nm = $('#customer-name'); if (nm) nm.focus();
  return;
}
```
(Se valida al tocar el botón; el botón sigue habilitado para dar el aviso.)

### 4. Guardar el nombre en el pedido y limpiar (`sendOrder`)
- Añadir `customerName` al objeto `order` (junto a `status: 'preparacion'`).
- Tras enviar, limpiar: `config.customerName = '';` (se persiste con el `saveConfig`
  ya existente; el input se limpia en `renderCart`).

### 5. Nombre en el mensaje de WhatsApp (`buildWhatsappText`, ~línea 238)
En la línea del `*Pedido #...*`, insertar el nombre:
```
*Pedido #12 — ✏️ CORRECCIÓN? — 👤 Ana* · 14:30
```
Concretamente añadir `${order.customerName ? ' — 👤 ' + order.customerName : ''}`
tras el marcador de corrección.

### 6. Nombre en Pedidos de hoy (`renderCierre`, encabezado ~línea 487-490)
Mostrar el nombre en el `.order-head` (junto a #/hora/estado) y también en el
`.detail-foot` del detalle expandido. Usar `esc(o.customerName || '—')` para
pedidos viejos sin nombre.

### 7. Nombre en el resumen del día (`reportText`, ~línea 341)
En la línea de cada orden (`*#num* · hora · mode · $total`) añadir `· 👤 ${nombre}`.
Cubre día actual (`shareDayReport`) e Historial (`shareCloseReport`). Añadirlo
también al `hist-order-head` de `renderHistorial` (~línea 630) para consistencia
en pantalla. Tolerar pedidos sin nombre (omitir el `👤`).

### 8. CSS (`css/styles.css`)
`.cart .field { margin-bottom: 12px; }` para que el campo respire junto al toggle.
Reutiliza el resto de estilos existentes de `.field`.

### 9. Cache PWA (`sw.js`, línea 3)
`const CACHE = 'zw-comandera-v17';`.

## Casos raros (cómo se resuelven)
- **Vacío/solo espacios:** `trim()` en la validación → bloquea con aviso y foco.
- **Nombres largos:** `maxlength=40` + `esc()`; el layout no se rompe.
- **Pedidos viejos sin nombre:** `o.customerName || '—'` en Cierre; en WhatsApp/
  resumen se omite el `👤`.
- **Edición/corrección** (`editOrder`, ~línea 531): al cargar el pedido, fijar
  `config.customerName = o.customerName || ''` y `Store.saveConfig(config)` para
  que el campo muestre el nombre previo y se pueda cambiar.
- **Recarga a mitad de armado:** al vivir en `config.customerName`, el nombre en
  curso se conserva (igual que el modo).

## Verificación (verify-after-changes)
Con `preview_start` (launch.json) y navegador:
1. Con ítems en el carrito y **nombre vacío**, tocar Enviar → NO se crea el pedido,
   sale toast "Escribe el nombre del cliente" y el campo recibe foco.
2. Escribir nombre y enviar (ítem no-cocina, p. ej. Refresco, para no abrir share)
   → el pedido se guarda con `customerName`; el campo se limpia.
3. En Cierre, el pedido muestra el nombre en el encabezado y al expandir.
4. Ítem de cocina: inspeccionar el texto de `buildWhatsappText` → encabezado con `👤`.
5. `reportText` (resumen del día) incluye el nombre por orden.
6. Editar un pedido → el campo aparece con el nombre previo; cambiarlo y reenviar.
7. Escribir nombre, recargar → el campo conserva el nombre (config.customerName).
8. Pedido viejo sin `customerName` → se muestra con "—", sin romper la lista.
9. Sin errores en `preview_console_logs`. Screenshot de la comanda con el campo y de
   Pedidos de hoy con el nombre.

Al terminar y verificar, guardar el plan en
`docs/plans/2026-07-17-nombre-de-cliente-en-pedido.md` (design-plan) y bump de `sw.js`.
