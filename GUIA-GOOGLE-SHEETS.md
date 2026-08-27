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
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var d = JSON.parse(e.postData.contents);
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
