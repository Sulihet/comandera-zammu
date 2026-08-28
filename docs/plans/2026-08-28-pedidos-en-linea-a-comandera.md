# Plan — Pedidos en línea directo a la comandera (con revisión del mesero)

## Context (por qué)
Hoy el pedido del cliente llega como **texto de WhatsApp** y el mesero lo **recopia**
a la comandera para mandarlo a cocina y que cuente en el cierre: lento en pico y con
riesgo de error. Spec aprobado (`docs/specs/2026-08-28-pedidos-en-linea-a-comandera.md`,
🟢, camino 🅐). Meta: al confirmar en el link, el pedido **entra solo a la comandera**
como "pedido en línea" pendiente **y además** abre WhatsApp (copia del cliente, opción
B). El mesero lo **revisa** y decide **✅ Aceptar y enviar a cocina / ✏️ Editar / ✖
Rechazar**. Puente = el **mismo Apps Script** que ya sirve el menú. Fuera de v1: sonido,
aviso de vuelta al cliente, tiempo real (eso es 🅑, se suma después).

## Arquitectura (reusa lo existente)
`Cliente (pedir.js) → POST no-cors al Apps Script → Sheet "Pedidos" (pendiente) → la
comandera consulta por JSONP cada ~20s → bandeja → Aceptar marca estado + lo vuelve
pedido normal + lo manda a cocina.`

- **JSONP** para leer (evita CORS), igual que `loadLiveMenu()` en `js/pedir.js:53`.
- **POST `mode:'no-cors'`** para escribir, igual que `sendToSheets()`/`publishMenu()`.
- El pedido aceptado se comporta como **cualquier pedido** de la comandera (cierre,
  historial, cancelar, reenviar) reutilizando `shareToKitchen`, `buildWhatsappText`,
  `markKitchenSent`, `editOrder`.

## Estructura del pedido (cliente ↔ backend ↔ comandera)
```js
{ id, ts, source:'online', customerName,
  serviceMode:'recoger'|'domicilio', addrMode:'texto'|'ubicacion',
  address, reference, geoloc,            // domicilio
  payMode:'efectivo'|'transferencia'|null, payBill,   // payBill ya resuelto (billValue())
  lines:[{ itemId, name, cat, detail, extras:[], dressings:[], unitPrice, qty, notes }],
  total }
```
Al **Aceptar**, la comandera le agrega `num` (config.lastOrderNum++), `status:'preparacion'`,
`canceled:false`, `online:true` y (tras el share) `kitchenSent`.

## Backend — Apps Script (`GUIA-GOOGLE-SHEETS.md`, el admin re-implementa)
Ampliar el script ya desplegado:
- **`doPost`** por `data.type`:
  - `'order'` → append a hoja **"Pedidos"** fila `[ts, id, cliente, total, 'pendiente',
    JSON.stringify(order)]` (con `LockService`; dedupe si el `id` ya existe).
  - `'order_status'` → busca la fila por `id` y pone `Estado` = `aceptado`/`rechazado`.
  - (menu / cierre: sin cambios).
- **`doGet`**: si `e.parameter.orders` → devuelve **JSONP** con el arreglo de pedidos
  `Estado==='pendiente'` (parsea el JSON de cada fila); si no, el menú (como hoy).
- Guía: sección nueva + paso **"Implementar → Gestionar implementaciones → editar"**
  para actualizar sin cambiar la URL.

## Cliente — `js/pedir.js`
- En **`doSend()`** (js/pedir.js, donde hoy arma `buildOrderText()` y abre WhatsApp):
  antes de navegar, `fetch(feedUrl(), { method:'POST', mode:'no-cors', keepalive:true,
  body: JSON.stringify({ type:'order', order }) })` (envuelto en try/catch; el WhatsApp
  sigue siendo el respaldo si falla). `keepalive:true` para que la petición se complete
  aunque la página navegue a WhatsApp.
- Nuevo helper `buildOrderPayload()` que arma el objeto de arriba desde el estado ya
  existente (`cart, name, mode, address, reference, geoloc, addrMode, payMode`,
  `billValue()`), con `id = uid()`.

## Comandera — `js/app.js` + `index.html` + `css/styles.css`
- **JSONP helper** `fetchJsonp(url, done)` (espejo de `loadLiveMenu` de pedir.js).
- **Estado** `onlineOrders=[]` y un set local de **procesados** (`Store` nuevo
  `getOnlineDone/saveOnlineDone`, clave `zw_online_done`) para no re-mostrar un aceptado/
  rechazado aunque el backend tarde en marcarlo.
- **`fetchOnlineOrders()`** → JSONP `${config.sheetsUrl}?orders=1&callback=…` → filtra los
  `done` locales → set `onlineOrders` → actualiza **globito** y re-render si la vista está
  activa. Se llama al arrancar (si hay `sheetsUrl`) y con `setInterval` ~20s, más botón
  **🔄 Refrescar**.
- **5ª pestaña** `data-view="online"` (`📥 En línea`) en la `bottom-nav` y `<section
  id="view-online">` en `index.html`; `switchView('online')` en `js/app.js:1026`.
- **`renderOnline()`** → lista de pendientes (nombre, hora, entrega, total, badge "nuevo").
  Tocar uno abre detalle completo (líneas con `🧂` aderezos, entrega con dirección/
  ubicación, pago, total) con 3 botones:
  - **`acceptOnline(id)`** → arma `order` (num, serviceMode, campos ricos, `online:true`),
    `Store.saveOrders`, `postOrderStatus(id,'aceptado')`, marca done, y
    `shareToKitchen(buildWhatsappText(order))` + `markKitchenSent` (reutiliza el flujo de
    `sendOrder`; el WhatsApp a cocina solo sale si `orderHasKitchen`).
  - **`editOnline(id)`** → carga `lines` al carrito como `editOrder` (js/app.js:644), marca
    done, `switchView('pedido')`; al enviar es un pedido normal.
  - **`rejectOnline(id)`** → `postOrderStatus(id,'rechazado')` + marca done.
- **`postOrderStatus(id,status)`** → POST no-cors `{type:'order_status', id, status}`.
- **`serviceMeta(mode)`** → `{icon,label}` para `aqui/llevar/recoger/domicilio`; usarlo en
  los puntos de etiqueta ya existentes (js/app.js:240, 414, 582, 617, 806) para que los
  pedidos `domicilio/recoger` se muestren bien.
- **`buildWhatsappText`** (js/app.js:240): renderizar `l.dressings` (línea `🧂 Aderezos:`)
  para que cocina prepare/empaque los aderezos de un pedido en línea (los aderezos en el
  sitio son self-serve, pero a domicilio/para recoger no).
- **Globito**: sobre el botón de nav "En línea", con la cantidad de pendientes.
- La bandeja y el polling **solo** si `config.sheetsUrl` está configurado (si no, la
  pestaña queda vacía con una nota "conecta tu Google Sheets").

## Archivos
- **Crear/editar:** `GUIA-GOOGLE-SHEETS.md` (Apps Script ampliado + paso de re-deploy).
- **`js/pedir.js`** — `doSend()` POSTea el pedido; `buildOrderPayload()`.
- **`js/app.js`** — bandeja "En línea": fetchJsonp, fetchOnlineOrders, polling, renderOnline,
  acceptOnline/editOnline/rejectOnline, postOrderStatus, serviceMeta, dressings en
  buildWhatsappText, badge.
- **`js/store.js`** — `getOnlineDone/saveOnlineDone` (clave `zw_online_done`).
- **`index.html`** — 5ª pestaña + `section#view-online`.
- **`css/styles.css`** — badge del nav + estilos de la bandeja (reusa `.order-card`).
- **`sw.js`** — subir `CACHE` (a v48) y no hay assets nuevos que listar.
- **`CLAUDE.md`** — documentar el feature.

## Notas de diseño / decisiones
- **Respaldo siempre:** si el POST del link falla, el pedido igual sale por WhatsApp; no
  se pierde. Si el `sheetsUrl` no está, todo se comporta como hoy.
- **Sin duplicados:** `id` único por intento + dedupe en el backend + set `done` local.
- **Un endpoint, varios `type`** (menu/cierre/order/order_status): menos config para el
  admin; se distingue por `type` en el POST y por `?orders` en el GET.
- **Aderezos a cocina** solo importan en pedidos en línea (a domicilio/recoger); en el
  sitio son self-serve, pero los pedidos del mesero no llevan `dressings`, así que
  renderizarlos es inofensivo.
- **v1 = polling ~20s** (sin sonido); 🅑 (sonido/avisos/tiempo real) se monta encima.

## Verificación (verify-after-changes)
1. Levantar server local (nuevo puerto = origen limpio) y abrir comandera y link.
2. **Backend:** actualizar el Apps Script del admin con el código nuevo (o probar contra
   el `/exec` real). Confirmar que `doGet?orders` responde JSONP y `doPost type:order`
   agrega fila.
3. **Cliente → comandera:** armar un pedido en el link (con aderezos + domicilio +
   efectivo/billete), confirmar. Verificar que (a) abre WhatsApp con el texto y (b) a los
   ~20s aparece en la bandeja "En línea" con globito.
4. **Aceptar:** revisar el detalle (aderezos, dirección, pago, total), tocar Aceptar →
   aparece en "Pedidos de hoy" con su `num`, cuenta en el cierre, y sale el WhatsApp a
   cocina (con `🧂` aderezos). El pendiente desaparece y no reaparece al refrescar.
5. **Editar** y **Rechazar:** el pedido sale de la bandeja; Editar lo carga al carrito.
6. **Sin conexión / sin sheetsUrl:** el link solo abre WhatsApp; la comandera no truena.
7. Comparar contra spec; si algo falla → volver a Ejecutar. Subir `CACHE` en `sw.js`.

## Pendientes que dependen del admin
- **Re-implementar el Apps Script** con el código nuevo (Gestionar implementaciones →
  editar, para no cambiar la URL). Sin eso, los pedidos en línea no llegan (pero el link
  sigue funcionando por WhatsApp).

## Nota de proceso
Tras aprobación, guardar copia del plan en
`docs/plans/2026-08-28-pedidos-en-linea-a-comandera.md` (convención del proyecto).
