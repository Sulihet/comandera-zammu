# Comandera Zammu Waifuu — Pedidos a cocina

**Negocio:** Zammu Waifuu (comida coreana / fast food). Ferrocarril de Cuernavaca 1.
Tel/pedidos: 55 6973 8176. IG: @zammuwaifuu.

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
  Dumplings (5 pzas) $70. Nivel de picante (Poco/Dos/Muy/Extremo), sin costo.
- **Fast Food** (precios actualizados):
  - Hamburguesa Hawaiana $85 (con papas $95).
  - Hamburguesa Sencilla $75 (con papas $85).
  - Hot Dog $75 (incluye papas).
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
  exportan e importan `{menu, kitchenNumber}` como archivo JSON para mover el menú entre
  celulares sin servidor.

## Decisiones de diseño
- **Cobertura especial = precio fijo**: las opciones con `overridePrice` (Boneless/
  Pizza = $70) reemplazan el precio total; las normales usan `priceDelta` (0). Ver
  `calcUnitPrice()` en `js/app.js`.
- **Un platillo con variantes/choices** en vez de un ítem por combinación: banderilla
  = base (variants) + cobertura (choice); baos/bebidas = choice de sabor; hamburguesas
  = variant con/sin papas. El editor de menú edita nombres, precios y disponibilidad.
- **Cierre agrupa por `nombre + detalle`**: así se ve cuántas de cada variante se
  vendieron (ej. "Banderilla (Queso · Cheddar)").
- **Extras = multi-selección** (`item.extras[]` con `priceDelta`, Set en la hoja);
  distinto de `choices` (radio). Los extras suman al precio y salen en línea `➕`.
- **Comer aquí / Para llevar**: atributo por pedido (`config.serviceMode`, toggle en el
  carrito). Va en el encabezado del mensaje y guardado en el pedido.
- **Mensaje a WhatsApp agrupado por categoría** (título en negrita + emoji del menú)
  para que cada cocinero identifique su sección. Ver `buildWhatsappText()`.
- **Logo real en el encabezado**: `<img class="brand-logo" src="icon.png">` (no emoji).
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
