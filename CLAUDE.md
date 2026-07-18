# Comandera Zammu Waifuu — Pedidos a cocina

**Negocio:** Zammu Waifuu (comida coreana / fast food). Ferrocarril de Cuernavaca 1.
Tel/pedidos: 55 6973 8176. IG: @zammuwaifuu.

## Metodología de trabajo: Spec-Driven Development (obligatoria)

**Todo** feature, cambio o desarrollo en este proyecto (y en cualquier proyecto)
se hace con **Spec-Driven Development**: se define QUÉ construir y se verifica
contra ello, antes de ejecutar. No se salta al código sin pasar por el spec y el
plan. Los 7 pasos y su skill asociado:

1. **Feature, proyecto o desarrollo** — surge la idea o la petición.
2. **Aclarar idea** (entender al usuario) → skill **`brainstorming`**: pregunta
   para eliminar ambigüedades y termina ofreciendo 2-3 alternativas para empezar.
3. **Spec del usuario** (QUÉ se quiere y para quién, no el cómo) → skill
   **`design-spec`**: escribe `docs/specs/YYYY-MM-DD-title.md` y tiene un
   **approval gate** (iterar o aprobar). No se avanza sin spec aprobado.
4. **Plan** (traduce el spec en pasos ejecutables y verificables) → al activar el
   **Modo Plan** se usa **`planning-QS`** (las 4 preguntas: trabajo principal,
   límites, éxito, casos raros) y luego **`design-plan`**, que guarda el plan en
   `docs/plans/YYYY-MM-DD-title.md`.
5. **Ejecutar** — se implementan las tareas del plan.
6. **Verificar** → skill **`verify-after-changes`** (bucle entre Ejecutar y
   Verificar): levanta el servidor, prueba casos clave en el navegador y compara
   contra el plan y el spec. **No cumple → fix (volver a Ejecutar)**; **sí cumple
   → luz verde** y se pasa al output.
7. **Output / publicar** — se entrega o publica (GitHub Pages, ver
   `GUIA-PUBLICAR.md`) y, si tocó CSS/JS, se sube la versión `CACHE` en `sw.js`.

- Specs → `docs/specs/YYYY-MM-DD-title.md`. Planes → `docs/plans/YYYY-MM-DD-title.md`
  (mismo `title` que su spec para emparejarlos).
- Los skills viven en `.claude/skills/<nombre>/SKILL.md` dentro del proyecto.

## Trabajo principal
Web app en el celular donde **un mesero** arma el pedido de un cliente tocando
platillos de un menú (sin escribir a mano), le agrega modificaciones, y lo envía
**por WhatsApp** ya formateado y claro al celular de cocina. Elimina los errores
y la pérdida de información del método actual (mandar la orden a mano por chat).

## Fuera de alcance
- **No cobra** ni maneja pagos.
- **No imprime tickets.**
- **No lleva inventario.**
- **No maneja mesas ni datos del cliente.**
- Un solo mesero / un solo celular tomando pedidos (negocio familiar).

## Cómo se ve el éxito
- El mesero abre la app, arma el pedido tocando platillos del menú, ajusta
  cantidades y agrega notas/modificaciones ("sin cebolla", "extra queso").
- Con un botón, el pedido sale **por WhatsApp** al celular de cocina, limpio y
  estructurado (sin ambigüedad de qué se pidió).
- Al final del día genera un **cierre**: cantidad vendida por cada platillo y el
  **total de dinero** del día. Sin datos de mesa ni cliente.
- Fácil y rápida de usar; funciona en cualquier celular con wifi.

## Casos raros a tener en cuenta
- **Modificaciones frecuentes** al pedido → cada platillo debe permitir notas
  libres y/o modificadores rápidos.
- **Cancelar o corregir** un pedido ya enviado → poco frecuente pero posible;
  debe poder anularse y que el cierre del día se ajuste.
- **Menú cambiante** → poder agregar/editar/eliminar platillos, cambiar precio y
  marcar "agotado" durante el día.
- Wifi estable (no es prioridad el modo sin conexión, pero conviene que no se
  pierdan los datos del día si se recarga la página).

## Hosting (decidido)
- **GitHub Pages** (elección del usuario): link fijo y gratuito, instalable como PWA,
  sobrevive el cambio de celular. Guía en `GUIA-PUBLICAR.md`.
- Los cambios de precio hechos *dentro* de la app viven en localStorage del celular;
  para moverlos a otro equipo se usa Respaldo/Restaurar. Los precios "de fábrica" se
  mantienen en `js/menu-data.js`.

## Arquitectura (propuesta, por confirmar)
- **PWA** (HTML/CSS/JS), instalable en el celular ("agregar a pantalla de inicio"),
  sin pasar por tienda de apps.
- **Sin servidor ni cuentas**: como solo un celular toma pedidos, todo (menú,
  pedidos del día, cierre) se guarda **localmente en ese celular** (localStorage/
  IndexedDB). Cero costo mensual, cero login.
- **Cocina recibe por WhatsApp**: la app abre WhatsApp con el mensaje del pedido
  ya formateado hacia el número/grupo de cocina (link wa.me / Web Share).
- El **cierre del día** se calcula solo a partir de los pedidos guardados; se
  puede cerrar el día y empezar uno nuevo.

## Menú (fuente de verdad para el default de la app)
- **Banderillas Saladas** — precio = base + cobertura:
  - Base: Salchicha $55 · Combinada $55 · Queso $60.
  - Coberturas normales (sin costo extra): Papas · Sencilla (PanKoreano) · Ruffles ·
    Cheddar · Flamin' Hot · Ramen.
  - Coberturas especiales: **Boneless $70 · Pizza $70** → precio total FIJO $70
    (reemplaza el precio de la base, sin importar cuál base se elija).
- **Banderillas Dulces** $60 c/u: Milky Way · Kinder Delice · Choco Roles.
- **Coreano:** Ramen Zammu Waifuu $105 · Dumpling & Ramen (mitad/mitad) $100 ·
  Dumplings (5 pzas) $70. **Tipo de sopa** (Habanero Limón / Queso / Carbonara, primero)
  solo en Ramen y Dumpling & Ramen; luego nivel de picante (Poco/Dos/Muy/Extremo). Sin costo.
- **Fast Food** (precios actualizados):
  - Hamburguesa Hawaiana $85 (con papas $95).
  - Hamburguesa Sencilla $75 (con papas $85).
  - Hot Dog $75 (incluye papas).
  - Papas a la francesa: Orden completa $65 · Media orden $35.
  - **Extras de hamburguesa** (multi-selección, se cobran aparte): Carne extra $15 ·
    Tocino $10 · Queso amarillo $5.
- **Pan al Vapor (Baos):** Sencillo $30 (caramelo/chocolate/nutella) ·
  Gourmet $35 (pistacho/cheese cake/frutos rojos) · Paquete 4 baos $105 ·
  Paquete 6 baos $165.
- **Bebidas:** Refresco $20 · Té Arizona $20 · Bebida coreana $55.

## Estructura de carpetas
- Raíz: la app (PWA estática, sin build). `css/`, `js/`, íconos y manifest.

## Qué hace cada archivo
- `index.html` — estructura de la app y carga de scripts.
- `css/styles.css` — estilos (mobile-first, táctil, paleta Zammu).
- `js/menu-data.js` — menú por defecto (`DEFAULT_MENU`) según el menú de arriba.
- `js/store.js` — persistencia en localStorage (menú, pedidos, cierre, config, carrito).
- `js/app.js` — lógica de UI: armar pedido, editar menú, cierre del día, envío a WhatsApp.
- `manifest.webmanifest` + `sw.js` — instalable como PWA / cache offline básico.
- `icon.png` — ícono = **logo real** de Zammu Waifuu (448×448, fondo rosa cuadrado).
- `.nojekyll` + `GUIA-PUBLICAR.md` — publicación en GitHub Pages (guía paso a paso sin terminal).
- **Respaldo/Restaurar**: en Ajustes (⚙️), `exportBackup()`/`importBackup()` en `js/app.js`
  exportan e importan un JSON (formato `v:2`) con `{menu, kitchenNumber, lastOrderNum,
  dayStartedAt, orders, closes}`. Sirve para mover el menú entre celulares y como red de
  seguridad de la jornada. Al restaurar, el menú/precios se reemplazan siempre; los
  **pedidos del día se restauran solo si el usuario confirma** (segundo diálogo).

## Decisiones de diseño
- **Cobertura especial = precio fijo**: las opciones con `overridePrice` (Boneless/
  Pizza = $70) reemplazan el precio total; las normales usan `priceDelta` (0). Ver
  `calcUnitPrice()` en `js/app.js`.
- **Un platillo con variantes/choices** en vez de un ítem por combinación: banderilla
  = base (variants) + cobertura (choice); baos/bebidas = choice de sabor; hamburguesas
  = variant con/sin papas. El editor de menú edita nombres, precios y disponibilidad.
- **Cierre agrupa por `nombre + detalle`**: así se ve cuántas de cada variante se
  vendieron (ej. "Banderilla (Queso · Cheddar)").
- **Pedidos de hoy = tarjetas expandibles**: tocar el encabezado despliega el detalle
  completo (líneas, extras, notas, modo). Ver `renderCierre()` y `toggleCard()`.
- **Cierre ordenado**: "Pedidos de hoy" → "Ventas por concepto" → "Cierre del día"
  (números grandes en `#cierre-head`) + botones Enviar resumen / Cerrar día, al final.
  Ver `index.html` y `renderCierre()`.
- **Ventas por concepto** (`conceptOf()`): agrupa las ventas en Hamburguesas, Banderillas
  (salada+dulce), Coreano, Hot-dogs, Bebidas y Pan al vapor; cada concepto muestra cantidad
  e ingreso y se expande a los platillos específicos. Fast Food se parte en Hamburguesas
  vs Hot-dogs por el nombre.
- **Migración de menú** (`migrateMenu()` en `store.js`): inyecta cambios estructurales
  nuevos (ej. el "Tipo de sopa") a menús ya guardados en el celular, sin borrar precios ni
  ediciones del usuario. Necesario porque el menú vive en localStorage.
- **Resumen del día para el administrador** (`reportText()` + `shareText()`): texto
  legible con fecha, nº pedidos, total, **desglose por platillo con dinero** y
  **detalle de cada orden**. Se comparte por WhatsApp/correo. Botón en Cierre (día
  actual) y en cada día del Historial. Los cierres viejos sin `orders` omiten el detalle.
- **Historial de días cerrados** (4ª pestaña 📚): `closeDay()` guarda cada cierre en
  `Store.closes` con `{date, closedAt, orderCount, grandTotal, totals:{qty,money}, orders}`
  (detalle completo). `renderHistorial()` los muestra expandibles. Tolera cierres viejos
  donde `totals` era solo cantidad (número).
- **Editar pedido enviado** (`editOrder()`): recarga las líneas al carrito, quita el
  original y fija `editingNum`. Al reenviar, `sendOrder()` reutiliza el número, marca
  `corrected` y el mensaje sale como "✏️ CORRECCIÓN". El cierre no se duplica.
- **Extras = multi-selección** (`item.extras[]` con `priceDelta`, Set en la hoja);
  distinto de `choices` (radio). Los extras suman al precio y salen en línea `➕`.
  Sus precios son **editables en la sección Menú** (inputs `data-xprice="item:extra"`).
- **Comer aquí / Para llevar**: atributo por pedido (`config.serviceMode`, toggle en el
  carrito). **Obligatorio y sin default**: si no se elige, no se envía (igual que el nombre
  del cliente); se resetea a `null` tras cada envío para forzar la elección. Va en el
  encabezado del mensaje y guardado en el pedido.
- **Cancelar / Editar pedido**: botones sólidos (Editar mostaza, Cancelar rojo) en el
  detalle del pedido; "Anular" se renombró a "Cancelar". Al editar, `editingOriginal`
  guarda el pedido íntegro para poder **Cancelar la edición** (`cancelEdit()`), que
  restaura el original sin cambios. Ver `renderCierre()` y el banner en `renderCart()`.
- **Ventas por concepto — Papas**: Papas a la francesa es su propio concepto (`🍟 Papas`,
  detectado por nombre en fastfood), no se cuenta como Hamburguesa. Ver `conceptOf()`.
- **Producto libre** (`openCustomSheet()`): botón en Pedido para agregar a la orden un
  concepto + precio escritos a mano (dulces coreanos, bebidas, vasos, etc.). La línea usa
  `itemId:'custom'`, `cat:'otros'`; cuenta en el total y en el Cierre bajo el concepto
  `🛒 Otros`, y NO se envía a cocina (otros no está en `KITCHEN_CATS`).
- **Papas a la francesa** también se inyecta a menús ya guardados vía `migrateMenu()`.
- **Mensaje a WhatsApp agrupado por categoría** (título en negrita + emoji del menú)
  para que cada cocinero identifique su sección. Ver `buildWhatsappText()`. **Sin total**
  (cocina no necesita el monto) y **solo con categorías de cocina**.
- **Solo se envía a cocina lo que ellos preparan**: `KITCHEN_CATS = [fastfood, coreano,
  baos]`. Al enviar, el pedido SIEMPRE se guarda (cuenta en el cierre); el WhatsApp solo
  sale si el pedido incluye alguna categoría de cocina. Si es solo bebidas/banderillas,
  no se envía (el botón cambia a "Guardar pedido (no va a cocina)"). Ver `sendOrder()` y
  `orderHasKitchen()`.
- **Reenvío en correcciones = solo si cambió cocina**: al editar, se guarda `kitchenSig()`
  del pedido original; al reenviar, solo se manda el WhatsApp si la firma de cocina cambió
  (se sumó/quitó/modificó Fast Food/Coreano/Pan). Sumar/quitar banderillas o bebidas
  actualiza la orden pero NO reenvía. Ver `editingKitchenSig` y `sendOrder()`.
- **Mensaje a cocina — "Con todo" y "Extra"**: una hamburguesa sin nota se marca
  `🍔 Con todo`; los extras salen como `Extra <nombre>` (sin duplicar si el nombre ya
  incluye "extra", ej. "Carne extra"). Ver `renderLine()` en `buildWhatsappText()`.
- **Logo real en el encabezado**: `<img class="brand-logo" src="icon.png">` (no emoji).
- **Confirmación de envío a cocina + reenvío**: `shareToKitchen()` devuelve `true`/`false`
  (false = el mesero canceló el share). `sendOrder()` guarda `order.kitchenSent` y, si es
  false, muestra `alert` "no se envió a cocina". En "Pedidos de hoy", los pedidos con
  `kitchenSent===false` llevan borde rojo + etiqueta "⚠️ No llegó a cocina · toca para
  reenviar". **Todo** pedido de cocina tiene además botón **📲 Reenviar a cocina**
  (`resendKitchen()`), que cubre el caso no detectable de "se envió al chat equivocado".
- **Envío a un GRUPO de WhatsApp** (elección del usuario): `sendOrder()` usa la Web Share
  API (`navigator.share`) para abrir WhatsApp con el pedido ya escrito y que el mesero
  elija su grupo de cocina (se recomienda fijarlo/pin). WhatsApp no permite deep-link a
  un grupo con texto, por eso se usa el share sheet. Respaldo: si no hay `share`, usa
  `wa.me/<kitchenNumber>` (número directo opcional en Ajustes) y, en última instancia,
  copia al portapapeles.
- **PWA local sin backend** en vez de app nativa o app con servidor: hay un solo
  celular tomando pedidos y wifi estable, así que un backend añade costo y
  complejidad sin beneficio. Reevaluar solo si en el futuro hay más de un mesero.
- **Envío por WhatsApp** en vez de pantalla de cocina propia: cocina ya usa
  WhatsApp; se reduce la curva de aprendizaje y no requiere otro dispositivo con
  la app abierta.

## Preferencias y convenciones
- Idioma del proyecto y de la interfaz: **español**.
- Prioridad: **facilidad y rapidez de uso** para el mesero.
- **Paleta mostaza tenue** (nada de rojo): `--primary #d3ad55` para superficies con
  texto café oscuro `--on-primary #453611`; `--accent-ink #977213` para texto/números
  mostaza sobre blanco; fondo crema `#fbf7ec`. Definida en `css/styles.css`.
- **Ícono**: `icon.png` = logo real de la marca (lo entregó el usuario). El PNG original
  venía como JPEG 448×425; se convirtió a PNG y se cuadró a 448×448 rellenando con el
  rosa del fondo `#fceff5` (vía `sips`). Marcado `purpose: any` (no maskable) para que
  Android no recorte el texto "Zammu/Waifuu".
- **Ojo con el service worker**: cachea los assets. Al cambiar CSS/JS hay que subir la
  versión `CACHE` en `sw.js` (va en v2) para que el celular reciba la actualización.
