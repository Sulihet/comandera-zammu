# Plan — Autoservicio de pedidos por link (WhatsApp Business), con menú sincronizado en vivo

## Context (por qué)

El WhatsApp del negocio (55 6973 8176 → `525569738176`) recibe **info y pedidos**.
Hoy el administrador contesta a mano y se traba en 3 puntos: en pico pierde pedidos,
gasta tiempo **ratificando** (la carta es amplia y el cliente pide general), y
**recaptura** el pedido del chat a la comandera.

Solución (spec aprobado `docs/specs/2026-08-27-autoservicio-pedido-por-link.md`, 🟢):
el cliente que escribe recibe automáticamente (mensaje de bienvenida gratis de
WhatsApp Business) un **link a un menú guiado**. El cliente arma su pedido tocando
platillos (base, cobertura, tipo de ramen, extras, cantidades, notas) y al confirmar
se abre WhatsApp con el pedido **ya formateado** hacia el negocio: cero ratificación,
cero recaptura, respuesta instantánea en pico.

**Decisión clave del usuario:** el menú del link debe **sincronizarse en vivo** con
lo que el admin edita en la comandera (precios y "agotado"), **sin depender de Claude
ni de avisos manuales**. Se logra publicando el menú al **Google Apps Script que ya
contempla la guía** (Camino A: la base vive en la cuenta de Google del admin). El
cliente lee ese menú en vivo. Si aún no hay Apps Script conectado (el admin lo verá
más tarde), el link cae al **menú de respaldo empacado** (`js/menu-data.js`) para no
quedarse en blanco.

Fuera de v1: no es bot conversacional, no usa WhatsApp API de paga, no cobra, no mete
el pedido solo al cierre del día (llega por WhatsApp; el admin lo registra).

## Arquitectura

Dos "pizarrones" de menú en celulares distintos, unidos por un puente en la nube:

- **Admin (comandera):** al editar el menú → **publica** el menú a su Apps Script
  (`fetch(sheetsUrl, {mode:'no-cors', POST, body:{type:'menu', menu}})`). Reusa el
  MISMO endpoint del cierre diario (`config.sheetsUrl`), diferenciado por `type`.
- **Apps Script (cuenta del admin):** guarda el menú (`doPost type:'menu'`) y lo sirve
  vía **JSONP** (`doGet` → `callback(menuJSON)`), que evita CORS desde GitHub Pages.
- **Cliente (`pedir.html`):** al abrir, hace **JSONP GET** del menú publicado; si falla
  o no hay URL, usa `DEFAULT_MENU` empacado. Los ítems `available:false` salen como
  "Agotado" (no se pueden pedir). Al confirmar, abre `wa.me/525569738176?text=...`.

Precio: una sola fuente de verdad. Se extrae la lógica pura de precio de `app.js` a
`js/menu-logic.js`, usada por comandera y link para que **nunca difieran**.

## Archivos

### Crear
- **`js/menu-logic.js`** — helpers puros compartidos: `calcUnitPrice(item, variant,
  selections, extras)` y `buildDetail(item, variant, selections)`, movidos tal cual
  desde `app.js` (`js/app.js:47-73`). Expone `window.MenuLogic = { calcUnitPrice, buildDetail }`.
- **`js/pedir-config.js`** — configuración editable en un solo lugar:
  - `MENU_FEED_URL` (Apps Script `/exec`; vacío hasta que el admin lo tenga → el link
    también acepta `#feed=`/`?feed=` en la URL para activarlo sin tocar código).
  - `WHATSAPP_NUMBER = '525569738176'`.
  - `INFO` = { horario: 'Viernes y sábados · 7:00–11:00 pm', direccion:
    'Ferrocarril de Cuernavaca 1', tel: '55 6973 8176', ig: '@zammuwaifuu',
    envio: '(editable — pendiente confirmar)' }.
- **`pedir.html`** — página del cliente (reusa `css/styles.css`). Secciones:
  cabecera con logo (`perro.png`); **Info** (horario, ubicación, tel, IG, envío);
  chips de categoría + grid de platillos; carrito con total; nombre + Comer aquí/
  Para llevar (ambos obligatorios, igual que la comandera); botón **Confirmar por
  WhatsApp**. Carga `menu-data.js`, `menu-logic.js`, `pedir-config.js`, `pedir.js`.
- **`js/pedir.js`** — lógica del link (subconjunto de `app.js`, sin Store/cierre/menú-editor):
  - `loadMenu()` — JSONP a `MENU_FEED_URL` (o hash/param); fallback a `DEFAULT_MENU`.
  - Render de chips + items (espejo de `renderPedido`, `js/app.js:78`); "Agotado"
    para `available:false`.
  - Hoja de platillo (espejo de `openItemSheet`, `js/app.js:163`) usando
    `MenuLogic.calcUnitPrice`/`buildDetail`.
  - Carrito en `localStorage` (clave propia `zw_client_cart`) para sobrevivir recargas.
  - Validación: nombre y modo obligatorios; carrito no vacío.
  - `buildClientOrderText(order)` — mensaje **completo** para el admin (todas las
    líneas + total + nombre + modo), distinto del de cocina. Abre
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`.

### Modificar
- **`js/app.js`**:
  - Quitar las copias locales de `calcUnitPrice`/`buildDetail` y usar
    `MenuLogic.*` (o alias local `const {calcUnitPrice, buildDetail} = MenuLogic`).
  - Agregar `publishMenu()` — POST `{type:'menu', menu}` a `config.sheetsUrl`
    (no-cors), **debounced** (~1.5s). Llamar desde `persistMenu()`, el toggle de
    disponibilidad (`change` en `data-avail`), y una vez al arrancar si hay `sheetsUrl`.
  - Botón manual **"📤 Publicar menú al link"** en el editor de menú (respaldo visible).
- **`index.html`** — cargar `js/menu-logic.js` **antes** de `js/app.js`.
- **`sw.js`** — subir `CACHE` a `zw-comandera-v26` y añadir a `ASSETS`:
  `./pedir.html`, `./js/pedir.js`, `./js/menu-logic.js`, `./js/pedir-config.js`.
- **`GUIA-GOOGLE-SHEETS.md`** — ampliar el código de Apps Script para:
  - `doPost`: si `data.type==='menu'` → guardar en `PropertiesService` (Script
    Properties; el menú stringificado pesa ~3–4KB, bajo el límite de 9KB/propiedad);
    si no, comportamiento actual (append de filas del cierre).
  - `doGet`: devolver el menú como JSONP (`callback(menuJSON)`), `MimeType.JAVASCRIPT`.
  - Instrucciones para **publicar de nuevo** el Web App tras editar el script.
- **Texto del mensaje de bienvenida de WhatsApp Business** (en la guía): saludo +
  el link a `pedir.html`, listo para pegar una sola vez en "Herramientas para la
  empresa → Mensaje de bienvenida".

## Notas de diseño / decisiones
- **Un solo endpoint** para cierre y menú (menos config para el admin): se distingue
  por `type` en el POST. Cuando el admin conecte `sheetsUrl` (Ajustes), se activan las
  dos cosas.
- **JSONP** (no fetch) para leer el menú: evita los problemas de CORS/redirect de
  Apps Script desde el navegador del cliente.
- **Fallback siempre**: sin feed o sin internet, el link muestra `DEFAULT_MENU`. El
  negocio funciona desde el día uno aunque el Sheet aún no exista.
- **Mensaje del link ≠ mensaje de cocina**: el del cliente lleva TODO + total (para que
  el admin lo lea/registre); el de cocina (comandera) sigue igual (parcial, sin total).
- **Envío**: línea editable en `pedir-config.js`; el usuario confirma zona/costo después.

## Verificación (verify-after-changes)
1. Levantar server local (preview) y abrir **`index.html`** (comandera) y **`pedir.html`**.
2. **Comandera intacta:** armar un pedido y revisar que los precios (banderilla especial
   $70, extras, con/sin papas) siguen idénticos tras mover la lógica a `menu-logic.js`.
   Confirmar que `publishMenu()` no truena sin `sheetsUrl` (no-op silencioso).
3. **Link sin feed:** en `pedir.html`, el menú carga del respaldo; agregar varios
   platillos con variantes/coberturas/extras/nota; verificar total correcto (paridad con
   comandera); "Agotado" no pedible.
4. **Confirmar por WhatsApp:** el botón abre `wa.me/525569738176` con el texto completo
   (nombre, modo, líneas, total) bien formateado; validaciones de nombre/modo/carrito.
5. **Feed simulado:** stub JSONP local (archivo que llame `callback({...menú modificado...})`)
   vía `?feed=` para comprobar que el link toma el menú publicado y refleja un precio
   cambiado y un "agotado".
6. **Persistencia:** recargar `pedir.html` con carrito → no se pierde.
7. Comparar contra spec y plan; si algo falla → volver a Ejecutar.
8. Al terminar y tocar CSS/JS: subir `CACHE` en `sw.js` (ya contemplado).

## Pendientes que dependen del admin (no bloquean el código)
- Conectar el Apps Script y pegar su `/exec` en Ajustes (`sheetsUrl`) → activa la
  sincronización en vivo. Mientras tanto, respaldo.
- Pegar el link + mensaje de bienvenida en WhatsApp Business.
- Confirmar texto de **envío**.

## Nota de proceso
Tras aprobación, guardar copia de este plan en
`docs/plans/2026-08-27-autoservicio-pedido-por-link.md` (convención del proyecto,
mismo `title` que el spec).
