/*
 * Link del cliente (pedir.html): el cliente arma su pedido tocando el menú y al
 * confirmar se abre WhatsApp con el pedido ya formateado hacia el negocio.
 * - El menú se lee EN VIVO del Apps Script del admin (JSONP); si no hay feed o
 *   falla, usa el menú de respaldo empacado (DEFAULT_MENU de menu-data.js).
 * - Precio calculado con MenuLogic (mismísima lógica que la comandera).
 * - Carrito, nombre y modo se guardan en localStorage para sobrevivir recargas.
 */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const money = (n) => '$' + Math.round(n);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const cfg = (typeof PEDIR_CONFIG !== 'undefined') ? PEDIR_CONFIG : { WHATSAPP_NUMBER: '', MENU_FEED_URL: '', INFO: {} };

  // ---------- Estado (persistido en el celular del cliente) ----------
  const K = 'zw_client_state';
  function loadState() {
    try { return JSON.parse(localStorage.getItem(K)) || {}; } catch (e) { return {}; }
  }
  function saveState() {
    try { localStorage.setItem(K, JSON.stringify({ cart, name, mode })); } catch (e) { /* modo privado, etc. */ }
  }
  const _s = loadState();
  let cart = Array.isArray(_s.cart) ? _s.cart : [];
  let name = typeof _s.name === 'string' ? _s.name : '';
  let mode = (_s.mode === 'aqui' || _s.mode === 'llevar') ? _s.mode : null;

  let menu = DEFAULT_MENU;          // respaldo hasta que llegue el menú en vivo
  let currentCat = menu.categories[0] ? menu.categories[0].id : null;
  let usingFallback = true;         // ¿mostrando el menú empacado (no el del admin)?

  // ---------- Origen del menú en vivo (feed) ----------
  // Prioridad: ?feed= / #feed= en la URL  >  MENU_FEED_URL de la config.
  function feedUrl() {
    const fromQuery = new URLSearchParams(location.search).get('feed');
    let fromHash = '';
    const h = location.hash.replace(/^#/, '');
    if (h) { const m = new URLSearchParams(h).get('feed'); if (m) fromHash = m; }
    return (fromQuery || fromHash || cfg.MENU_FEED_URL || '').trim();
  }

  // Lee el menú por JSONP (evita CORS desde el navegador del cliente).
  function loadLiveMenu(done) {
    const url = feedUrl();
    if (!url) { done(null); return; }
    const cbName = 'zwMenuCb_' + Date.now().toString(36);
    let finished = false;
    const timer = setTimeout(() => finish(null), 6000);
    function finish(data) {
      if (finished) return; finished = true;
      clearTimeout(timer);
      try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
      if (s.parentNode) s.parentNode.removeChild(s);
      done(data);
    }
    window[cbName] = (data) => finish(data);
    const s = document.createElement('script');
    s.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + cbName + '&t=' + Date.now();
    s.onerror = () => finish(null);
    document.head.appendChild(s);
  }

  function isValidMenu(m) {
    return m && Array.isArray(m.categories) && m.categories.length && Array.isArray(m.items);
  }

  // ---------- INFO ----------
  function renderInfo() {
    const i = cfg.INFO || {};
    const rows = [
      ['🕒', 'Horario', i.horario],
      ['📍', 'Dónde', i.direccion],
      ['📞', 'Teléfono', i.tel],
      ['📸', 'Instagram', i.ig],
      ['🛵', 'Envío', i.envio],
    ].filter((r) => r[2]);
    $('#info-card').innerHTML = `<h2>Información</h2>` + rows.map((r) =>
      `<div class="info-row"><span class="ic">${r[0]}</span><span><b>${esc(r[1])}:</b> ${esc(r[2])}</span></div>`
    ).join('');
  }

  // ---------- Menú ----------
  function renderMenu() {
    $('#cat-chips').innerHTML = menu.categories.map((c) =>
      `<button class="chip ${c.id === currentCat ? 'active' : ''}" data-cat="${c.id}">${c.icon || ''} ${esc(c.name)}</button>`
    ).join('');

    const items = menu.items.filter((i) => i.cat === currentCat);
    $('#item-list').innerHTML = items.length ? items.map((i) => {
      const priceLabel = i.variants
        ? 'desde ' + money(Math.min(...i.variants.map((v) => v.price)))
        : money(i.price || 0);
      const off = i.available === false;
      return `<button class="item-card ${off ? 'off' : ''}" data-item="${i.id}" ${off ? 'disabled' : ''}>
          <span class="item-name">${esc(i.name)}</span>
          <span class="item-price">${off ? 'Agotado' : priceLabel}</span>
        </button>`;
    }).join('') : '<p class="empty">Sin platillos en esta categoría.</p>';

    renderFallbackNote();
  }

  function renderFallbackNote() {
    const box = $('#fallback-note');
    if (!box) return;
    // Solo avisamos si NO hay feed configurado (útil en pruebas). Si hay feed pero
    // falló, mostramos el respaldo en silencio para no alarmar al cliente.
    box.innerHTML = (usingFallback && !feedUrl())
      ? `<div class="pedir-fallback">📋 Menú de referencia. Confirma disponibilidad y precios al enviar tu pedido.</div>`
      : '';
  }

  function renderServiceMode() {
    $('#service-mode').innerHTML = `
      <button class="seg ${mode === 'aqui' ? 'active' : ''}" data-mode="aqui">🍽️ Comer aquí</button>
      <button class="seg ${mode === 'llevar' ? 'active' : ''}" data-mode="llevar">🥡 Para llevar</button>`;
  }

  function renderCart() {
    const box = $('#cart-lines');
    if (!cart.length) {
      box.innerHTML = '<p class="empty">Aún no has agregado nada. Toca un platillo de arriba 👆</p>';
    } else {
      box.innerHTML = cart.map((l) => `
        <div class="cart-line">
          <div class="cart-line-main">
            <span class="q">${l.qty}×</span>
            <div>
              <div class="cart-name">${esc(l.name)}</div>
              ${l.detail ? `<div class="cart-detail">${esc(l.detail)}</div>` : ''}
              ${(l.extras && l.extras.length) ? `<div class="cart-detail">➕ ${esc(l.extras.join(', '))}</div>` : ''}
              ${l.notes ? `<div class="cart-note">📝 ${esc(l.notes)}</div>` : ''}
            </div>
          </div>
          <div class="cart-line-side">
            <span>${money(l.unitPrice * l.qty)}</span>
            <button class="link-danger" data-del="${l.uid}">Quitar</button>
          </div>
        </div>`).join('');
    }
    const total = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
    $('#cart-total').textContent = money(total);
    $('#btn-send').disabled = !cart.length;
    renderServiceMode();
    const nm = $('#customer-name');
    if (nm && nm.value !== name) nm.value = name;
  }

  // ---------- Hoja de configuración de un platillo ----------
  function openItemSheet(item) {
    let variant = item.variants ? item.variants[0] : null;
    const selections = {};
    (item.choices || []).forEach((ch) => { if (ch.required) selections[ch.id] = ch.options[0].id; });
    const extras = new Set();
    let qty = 1;
    let notes = '';

    const body = document.createElement('div');
    function draw() {
      const variantHtml = item.variants ? `
        <div class="field">
          <label>Elige una opción</label>
          <div class="opt-row">${item.variants.map((v) =>
            `<button class="opt ${variant && variant.id === v.id ? 'sel' : ''}" data-variant="${v.id}">${esc(v.name)}<small>${money(v.price)}</small></button>`
          ).join('')}</div>
        </div>` : '';

      const choicesHtml = (item.choices || []).map((ch) => `
        <div class="field">
          <label>${esc(ch.name)}${ch.required ? '' : ' <small>(opcional)</small>'}</label>
          <div class="opt-row">
            ${!ch.required ? `<button class="opt ${!selections[ch.id] ? 'sel' : ''}" data-choice="${ch.id}" data-opt="">Ninguno</button>` : ''}
            ${ch.options.map((o) =>
              `<button class="opt ${selections[ch.id] === o.id ? 'sel' : ''}" data-choice="${ch.id}" data-opt="${o.id}">${esc(o.name)}${o.overridePrice != null ? `<small>${money(o.overridePrice)}</small>` : ''}</button>`
            ).join('')}
          </div>
        </div>`).join('');

      const extrasHtml = (item.extras && item.extras.length) ? `
        <div class="field">
          <label>Extras <small>(opcional, se cobran aparte)</small></label>
          <div class="opt-row">
            ${item.extras.map((ex) =>
              `<button class="opt ${extras.has(ex.id) ? 'sel' : ''}" data-extra="${ex.id}">${esc(ex.name)}<small>+${money(ex.priceDelta)}</small></button>`
            ).join('')}
          </div>
        </div>` : '';

      const notesHtml = item.notes ? `
        <div class="field">
          <label>Nota <small>(modificaciones)</small></label>
          <input type="text" id="sheet-notes" placeholder="ej. sin cebolla, extra queso" value="${esc(notes)}">
        </div>` : '';

      const unit = MenuLogic.calcUnitPrice(item, variant, selections, extras);
      body.innerHTML = `
        <h2>${esc(item.name)}</h2>
        ${variantHtml}${choicesHtml}${extrasHtml}${notesHtml}
        <div class="field qty-field">
          <label>Cantidad</label>
          <div class="stepper">
            <button data-qty="-1">−</button>
            <span id="sheet-qty">${qty}</span>
            <button data-qty="1">+</button>
          </div>
        </div>
        <button class="btn-primary big" id="sheet-add">Agregar &nbsp;·&nbsp; ${money(unit * qty)}</button>`;

      $$('[data-variant]', body).forEach((b) => b.onclick = () => { variant = item.variants.find((v) => v.id === b.dataset.variant); draw(); });
      $$('[data-choice]', body).forEach((b) => b.onclick = () => {
        selections[b.dataset.choice] = b.dataset.opt || null;
        if (!b.dataset.opt) delete selections[b.dataset.choice];
        draw();
      });
      $$('[data-qty]', body).forEach((b) => b.onclick = () => { qty = Math.max(1, qty + Number(b.dataset.qty)); draw(); });
      $$('[data-extra]', body).forEach((b) => b.onclick = () => {
        const id = b.dataset.extra;
        if (extras.has(id)) extras.delete(id); else extras.add(id);
        draw();
      });
      const notesInput = $('#sheet-notes', body);
      if (notesInput) notesInput.oninput = (e) => { notes = e.target.value; };
      $('#sheet-add', body).onclick = () => {
        const ni = $('#sheet-notes', body);
        const extraNames = (item.extras || []).filter((ex) => extras.has(ex.id)).map((ex) => ex.name);
        cart.push({
          uid: uid(), itemId: item.id, name: item.name, cat: item.cat,
          detail: MenuLogic.buildDetail(item, variant, selections),
          extras: extraNames,
          unitPrice: MenuLogic.calcUnitPrice(item, variant, selections, extras),
          qty, notes: ni ? ni.value.trim() : '',
        });
        saveState();
        closeModal();
        renderCart();
        toast('Agregado a tu pedido');
      };
    }
    draw();
    showModal(body);
  }

  // ---------- Enviar el pedido por WhatsApp (hacia el negocio) ----------
  function buildOrderText() {
    const modeLabel = mode === 'llevar' ? '🥡 PARA LLEVAR' : '🍽️ COMER AQUÍ';
    let t = `🐶 *ZAMMU WAIFUU — Pedido en línea*\n`;
    t += `*👤 ${name}*  ·  *${modeLabel}*\n`;
    t += `━━━━━━━━━━\n`;
    cart.forEach((l) => {
      t += `• ${l.qty}× ${l.name}${l.detail ? ` — ${l.detail}` : ''} — ${money(l.unitPrice * l.qty)}\n`;
      if (l.extras && l.extras.length) t += `   ➕ ${l.extras.join(', ')}\n`;
      if (l.notes) t += `   📝 ${l.notes}\n`;
    });
    const total = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
    t += `━━━━━━━━━━\n`;
    t += `💰 *Total: ${money(total)}*\n`;
    return t;
  }

  function sendOrder() {
    if (!cart.length) return;
    if (!name.trim()) { toast('Escribe tu nombre 🙂'); const nm = $('#customer-name'); if (nm) nm.focus(); return; }
    if (mode !== 'aqui' && mode !== 'llevar') { toast('Elige: 🍽️ Comer aquí o 🥡 Para llevar'); return; }

    const text = buildOrderText();
    const num = (cfg.WHATSAPP_NUMBER || '').replace(/\D/g, '');
    const base = num ? `https://wa.me/${num}` : 'https://wa.me/';
    const urlWa = `${base}?text=${encodeURIComponent(text)}`;

    // Respaldo raro: sin número configurado y con Web Share disponible, usa share.
    if (!num && navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      window.location.href = urlWa;
    }

    // Vacía el pedido para el siguiente; el nombre se conserva por comodidad.
    cart = [];
    mode = null;
    saveState();
    renderCart();
    toast('Abriendo WhatsApp… solo dale enviar 📲');
  }

  // ---------- Modal / Toast ----------
  function showModal(node) {
    const root = $('#modal-root');
    root.innerHTML = '';
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.appendChild(node);
    overlay.appendChild(sheet);
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
    root.appendChild(overlay);
    root.classList.add('show');
  }
  function closeModal() { $('#modal-root').classList.remove('show'); $('#modal-root').innerHTML = ''; }

  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ---------- Eventos ----------
  function bind() {
    $('#cat-chips').onclick = (e) => {
      const btn = e.target.closest('[data-cat]');
      if (!btn) return;
      currentCat = btn.dataset.cat;
      renderMenu();
    };
    $('#item-list').onclick = (e) => {
      const btn = e.target.closest('[data-item]');
      if (!btn) return;
      const item = menu.items.find((i) => i.id === btn.dataset.item);
      if (item) openItemSheet(item);
    };
    $('#cart-lines').onclick = (e) => {
      const del = e.target.closest('[data-del]');
      if (!del) return;
      cart = cart.filter((l) => l.uid !== del.dataset.del);
      saveState();
      renderCart();
    };
    $('#customer-name').oninput = (e) => { name = e.target.value; saveState(); };
    $('#service-mode').onclick = (e) => {
      const b = e.target.closest('[data-mode]');
      if (!b) return;
      mode = b.dataset.mode;
      saveState();
      renderServiceMode();
    };
    $('#btn-send').onclick = sendOrder;
  }

  // ---------- Arranque ----------
  renderInfo();
  renderMenu();
  renderCart();
  bind();

  // Intenta traer el menú en vivo del admin; si llega, reemplaza el respaldo.
  loadLiveMenu((live) => {
    if (isValidMenu(live)) {
      menu = live;
      usingFallback = false;
      if (!menu.categories.some((c) => c.id === currentCat)) {
        currentCat = menu.categories[0] ? menu.categories[0].id : null;
      }
      renderMenu();
    }
  });
})();
