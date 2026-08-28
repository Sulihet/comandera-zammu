# Conectar la app a una Google Sheet (para el ADMINISTRADOR)

Objetivo: que cada vez que se **Cierra el día** en la app, el resumen de ventas se
copie solo a una **Google Sheet del administrador**, para consultar y hacer gráficas.

> Estos pasos los hace **el administrador**, desde **su** cuenta de Google. Al final
> solo comparte un **link** (nunca su contraseña). Es de una sola vez, ~10 minutos.

---

## Paso 1 — Crear la hoja
1. Entra a **https://sheets.new** (o Drive → Nuevo → Hojas de cálculo de Google).
2. Ponle nombre, ej. **"Ventas Zammu Waifuu"**.

## Paso 2 — Abrir Apps Script
1. En la hoja: menú **Extensiones → Apps Script**.
2. Borra todo lo que aparezca en el editor.
3. Copia y pega **todo** este código:

```javascript
// Sirve datos al link/comandera por JSONP (evita CORS).
//  - ?orders=1  -> pedidos en línea pendientes (para la comandera)
//  - (si no)    -> el MENÚ en vivo (para el link del cliente)
function doGet(e) {
  var cb = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : 'callback';
  var payload;
  if (e && e.parameter && e.parameter.orders) {
    payload = JSON.stringify(getPendingOrders());
  } else {
    payload = PropertiesService.getScriptProperties().getProperty('MENU') || 'null';
  }
  return ContentService
    .createTextOutput(cb + '(' + payload + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

// Lee la hoja "Pedidos" y devuelve solo los pendientes (arreglo de objetos order).
function getPendingOrders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Pedidos');
  if (!sh || sh.getLastRow() < 2) return [];
  var vals = sh.getDataRange().getValues(); // [Fecha, Id, Cliente, Total, Estado, JSON]
  var out = [];
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][4]) === 'pendiente') {
      try { out.push(JSON.parse(vals[i][5])); } catch (err) { /* fila corrupta: se omite */ }
    }
  }
  return out;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var d = JSON.parse(e.postData.contents);

    // La comandera publica el menú (para el link del cliente): lo guardamos.
    if (d && d.type === 'menu') {
      PropertiesService.getScriptProperties().setProperty('MENU', JSON.stringify(d.menu));
      return ContentService.createTextOutput(JSON.stringify({ ok: true, saved: 'menu' }));
    }

    var ss0 = SpreadsheetApp.getActiveSpreadsheet();

    // El cliente manda un pedido en línea: lo guardamos como "pendiente".
    if (d && d.type === 'order' && d.order) {
      var p = ss0.getSheetByName('Pedidos') || ss0.insertSheet('Pedidos');
      if (p.getLastRow() === 0) p.appendRow(['Fecha', 'Id', 'Cliente', 'Total', 'Estado', 'JSON']);
      // dedupe: si el id ya existe, no lo agrega otra vez
      var ex = p.getDataRange().getValues();
      for (var r = 1; r < ex.length; r++) {
        if (String(ex[r][1]) === String(d.order.id)) {
          return ContentService.createTextOutput(JSON.stringify({ ok: true, dup: true }));
        }
      }
      p.appendRow([new Date(), d.order.id, d.order.customerName || '', d.order.total || 0,
        'pendiente', JSON.stringify(d.order)]);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, saved: 'order' }));
    }

    // La comandera marca un pedido en línea como aceptado/rechazado.
    if (d && d.type === 'order_status' && d.id) {
      var ps = ss0.getSheetByName('Pedidos');
      if (ps) {
        var rows = ps.getDataRange().getValues();
        for (var k = 1; k < rows.length; k++) {
          if (String(rows[k][1]) === String(d.id)) { ps.getRange(k + 1, 5).setValue(d.status || 'aceptado'); break; }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, saved: 'status' }));
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var stamp = new Date();
    var tz = Session.getScriptTimeZone();

    function sameDate(cell, date) {
      if (cell instanceof Date) return Utilities.formatDate(cell, tz, 'yyyy-MM-dd') === date;
      return String(cell) === date;
    }
    function clearDate(sh, date) {
      var vals = sh.getDataRange().getValues();
      for (var i = vals.length - 1; i >= 1; i--) {
        if (sameDate(vals[i][0], date)) sh.deleteRow(i + 1);
      }
    }

    // Hoja "Ventas": una fila por platillo (para graficar)
    var v = ss.getSheetByName('Ventas') || ss.insertSheet('Ventas');
    if (v.getLastRow() === 0) v.appendRow(['Fecha', 'Concepto', 'Platillo', 'Cantidad', 'Ingreso', 'Enviado']);
    clearDate(v, d.date); // evita duplicar si se reenvía el mismo día
    (d.items || []).forEach(function (it) {
      v.appendRow([d.date, it.concepto, it.platillo, it.cantidad, it.ingreso, stamp]);
    });

    // Hoja "Cierres": una fila por día
    var c = ss.getSheetByName('Cierres') || ss.insertSheet('Cierres');
    if (c.getLastRow() === 0) c.appendRow(['Fecha', 'Pedidos', 'Total', 'Enviado']);
    clearDate(c, d.date);
    c.appendRow([d.date, d.orderCount, d.grandTotal, stamp]);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }));
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }));
  } finally {
    lock.releaseLock();
  }
}
```

4. Guarda con el ícono 💾 (o Ctrl/Cmd + S).

## Paso 3 — Publicar como aplicación web
1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. En el engrane ⚙️ (Seleccionar tipo) elige **Aplicación web**.
3. Configura:
   - **Descripción:** Comandera Zammu
   - **Ejecutar como:** *Yo* (tu cuenta)
   - **Quién tiene acceso:** **Cualquier persona** (Anyone)
4. Toca **Implementar**.
5. Google pedirá **autorizar**: elige tu cuenta → si sale "Google no verificó esta app",
   toca **Configuración avanzada → Ir a … (no seguro) → Permitir**. (Es normal: es tu
   propio script personal.)
6. Copia la **"URL de la aplicación web"** (termina en **/exec**).

## Paso 4 — Conectar la app
- Pásale esa URL al mesero. En la app: **⚙️ Ajustes → "Google Sheets del administrador"
  → pega la URL → Guardar**.

¡Listo! Al **Cerrar el día**, aparecerán filas nuevas en las hojas **"Ventas"** y **"Cierres"**.

> **¿Ya tenías el script conectado de antes?** El código de arriba trae mejoras nuevas
> (menú en vivo y **pedidos en línea**). Para activarlas, actualiza tu implementación:
> **Implementar → Gestionar implementaciones → ✏️ editar → Versión: Nueva → Implementar**
> (así **no cambia la URL**). Sin esto, los pedidos en línea no llegarán a la comandera.

---

## Paso 5 — Activar el link de pedidos del cliente (WhatsApp)

Con el mismo Apps Script ya conectado, el **link del cliente** (`pedir.html`) muestra
tu menú **en vivo**: cuando el mesero cambia un precio o marca **"agotado"** en la
comandera, el link del cliente lo refleja solo. No hay que hacer nada extra: la
comandera **publica el menú automáticamente** a este mismo script (además puedes
forzarlo con el botón **📤 Publicar menú al link** en la pestaña **Menú**).

> Si aún no conectas el script, el link igual funciona con un **menú de respaldo**;
> al conectarlo empieza la sincronización en vivo.

### 5.1 — Arma el link del cliente
El link es la dirección donde publicaste la app + `pedir.html`. Por ejemplo, si la
comandera vive en `https://tuusuario.github.io/zammu/`, el link del cliente es:

```
https://tuusuario.github.io/zammu/pedir.html
```

Para que el cliente vea el menú en vivo, el link debe conocer tu URL `/exec`. Dos
formas (elige una):

- **A) Fácil (recomendada):** pega tu URL `/exec` en el archivo `js/pedir-config.js`,
  en `MENU_FEED_URL`, y vuelve a publicar. El link queda limpio (el de arriba).
- **B) Sin tocar código:** agrega tu URL al final del link así (todo en una línea):

  ```
  https://tuusuario.github.io/zammu/pedir.html#feed=PEGA_AQUI_TU_URL_/exec
  ```

### 5.2 — Pon el link en el Mensaje de bienvenida de WhatsApp Business
Así, **en cuanto un cliente escribe**, recibe el link al instante (sin que nadie
conteste):

1. En **WhatsApp Business** (celular del negocio): **Ajustes → Herramientas para la
   empresa → Mensaje de bienvenida**.
2. Actívalo y pega este texto (mensaje de bienvenida final):

   ```
   ¡Hola! 🐶 Gracias por escribir a Zammu Waifuu 🍜

   Haz tu pedido aquí en 1 minuto: elige tus platillos y personalízalos a tu gusto 👇
   https://bit.ly/TuPedidoZammuWaifuu

   🕒 Viernes y sábados · 7:00 a 11:00 pm
   🥡 Recoge en el local o 🛵 pídelo a domicilio
   📍 Ferrocarril de Cuernavaca 1

   ¡Con gusto te atendemos! ✨
   ```

   > El link corto `https://bit.ly/TuPedidoZammuWaifuu` apunta al menú del cliente
   > (`pedir.html`). Al pegarlo, WhatsApp muestra la tarjeta con el logo de Zammu.

3. En "Destinatarios" deja **Todos**. Guarda.

Cuando el cliente arma su pedido y toca **Enviar**, WhatsApp se abre con el pedido ya
escrito **hacia el número del negocio**: solo lo manda, y tú lo recibes limpio y
completo, listo para pasarlo a cocina con la comandera.

---

## Cómo graficar (en la hoja del administrador)
- **Hoja "Ventas"**: selecciona los datos → **Insertar → Gráfico** (o **Insertar → Tabla
  dinámica**) para ver ingresos por **concepto**, por **platillo** o por **fecha**.
- **Hoja "Cierres"**: total y número de pedidos por día → gráfico de línea para la tendencia.

## Notas
- Necesita **wifi** al cerrar el día. Si falla, en 📚 **Historial** hay un botón
  **☁️ Enviar a Google Sheets** para reenviar ese día (no duplica: reemplaza las filas de esa fecha).
- Mantén la URL **privada** (quien la tenga puede escribir en la hoja). Si quieres más
  seguridad (una contraseña/token), se puede agregar — avísame.
- Si cambias el código del script, usa **Implementar → Gestionar implementaciones** para
  actualizar (así la URL no cambia).
