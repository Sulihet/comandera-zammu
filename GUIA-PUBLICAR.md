# Cómo publicar la app en internet (GitHub Pages) — paso a paso

Objetivo: que la app viva en un **link fijo** (ej. `https://tuusuario.github.io/comandera-zammu/`)
al que el celular que toma pedidos pueda entrar **siempre**, y que sea fácil de abrir
en cualquier equipo nuevo. Es **gratis** y no requiere saber programar. Se hace **una sola vez**.

> Todo esto se puede hacer desde el navegador, sin instalar nada ni usar la terminal.

---

## Paso 1 — Crea tu cuenta de GitHub (una vez)
1. Entra a **https://github.com** y toca **Sign up**.
2. Regístrate con tu correo. Es gratis.

## Paso 2 — Crea un repositorio nuevo
1. Ya dentro de GitHub, toca el **+** arriba a la derecha → **New repository**.
2. En **Repository name** escribe: `comandera-zammu`
3. Déjalo en **Public**.
4. Toca **Create repository**.

## Paso 3 — Sube los archivos de la app
1. En la página del repositorio recién creado, busca el enlace
   **“uploading an existing file”** (o botón **Add file → Upload files**).
2. **Arrastra TODOS los archivos y carpetas** de la app a esa ventana:
   - `index.html`
   - `manifest.webmanifest`
   - `sw.js`
   - `icon.png`
   - `.nojekyll`
   - la carpeta `css/` (con `styles.css`)
   - la carpeta `js/` (con `menu-data.js`, `store.js`, `app.js`)
   > Consejo: selecciona todo el contenido de la carpeta del proyecto y arrástralo junto.
3. Abajo toca **Commit changes**.

## Paso 4 — Enciende GitHub Pages
1. En el repositorio, ve a **Settings** (Configuración).
2. En el menú de la izquierda toca **Pages**.
3. En **Source** elige **Deploy from a branch**.
4. En **Branch** elige **main** y la carpeta **/ (root)**. Toca **Save**.
5. Espera 1–2 minutos y recarga. Aparecerá tu link, algo como:
   **`https://TUUSUARIO.github.io/comandera-zammu/`**

¡Ese es el link de la app! 🎉

## Paso 5 — Instálala en el celular que toma pedidos
1. Abre el link en el navegador del celular (en iPhone usa **Safari**; en Android, **Chrome**).
2. Toca **Compartir** (o el menú ⋮) → **Agregar a pantalla de inicio**.
3. Listo: aparece el ícono como una app normal. Ábrela desde ahí.

## Paso 6 — Configura el WhatsApp de cocina
1. Dentro de la app, toca el engrane **⚙️** arriba a la derecha.
2. Escribe el número de WhatsApp de cocina **con lada, sin +** (ej. `525569738176`).
3. Toca **Guardar**.

---

## Si cambias de celular
1. En el equipo nuevo abre **el mismo link** y agrégalo a la pantalla de inicio (Paso 5).
2. Si en el celular viejo cambiaste precios dentro de la app y quieres conservarlos:
   - En el viejo: **⚙️ → Descargar respaldo** (se guarda un archivo).
   - Pásate ese archivo al celular nuevo (WhatsApp, correo, AirDrop…).
   - En el nuevo: **⚙️ → Restaurar desde archivo** y elige ese archivo.

## Para actualizar la app más adelante
Cuando haya mejoras, se vuelven a subir los archivos cambiados (Paso 3, botón
**Add file → Upload files**) y en unos minutos el link se actualiza solo.
El celular tomará la nueva versión al reabrir la app (por eso el `sw.js` lleva número de versión).
