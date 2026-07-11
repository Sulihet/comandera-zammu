/* Lógica de la app: armar pedido, editar menú, cierre del día, envío a WhatsApp. */
(() => {
  'use strict';

  // ---------- Estado ----------
  let menu = Store.getMenu();
  let cart = Store.getCart();
  let config = Store.getConfig();
  let currentCat = menu.categories[0]?.id || null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const money = (n) => '$' + Math.round(n);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // ---------- Cálculo de precio de una línea ----------
  function calcUnitPrice(item, variant, selections, extras) {
    let base = variant ? variant.price : (item.price || 0);
    let override = null;
    (item.choices || []).forEach((ch) => {
      const optId = selections[ch.id];
      if (!optId) return;
      const opt = ch.options.find((o) => o.id === optId);
      if (!opt) return;
      if (opt.overridePrice != null) override = opt.overridePrice;
      else base += (opt.priceDelta || 0);
    });
    let total = override != null ? override : base;
    (item.extras || []).forEach((ex) => { if (extras && extras.has(ex.id)) total += (ex.priceDelta || 0); });
    return total;
  }

  function buildDetail(item, variant, selections) {
    const parts = [];
    if (variant) parts.push(variant.name);
    (item.choices || []).forEach((ch) => {
      const optId = selections[ch.id];
      if (!optId) return;
      const opt = ch.options.find((o) => o.id === optId);
      if (opt) parts.push(opt.name);
    });
    return parts.join(' · ');
  }

  // ==========================================================
  //  VISTA: PEDIDO
  // ==========================================================
  function renderPedido() {
    const chips = menu.categories.map((c) =>
      `<button class="chip ${c.id === currentCat ? 'active' : ''}" data-cat="${c.id}">${c.icon || ''} ${esc(c.name)}</button>`
    ).join('');
    $('#cat-chips').innerHTML = chips;

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

    renderCart();
  }

  function renderCart() {
    const box = $('#cart-lines');
    if (!cart.length) {
      box.innerHTML = '<p class="empty">Aún no hay platillos en el pedido.</p>';
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
  }

  function renderServiceMode() {
    const el = $('#service-mode');
    if (!el) return;
    const m = config.serviceMode || 'aqui';
    el.innerHTML = `
      <button class="seg ${m === 'aqui' ? 'active' : ''}" data-mode="aqui">🍽️ Comer aquí</button>
      <button class="seg ${m === 'llevar' ? 'active' : ''}" data-mode="llevar">🥡 Para llevar</button>`;
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
          <label>Nota para cocina <small>(modificaciones)</small></label>
          <input type="text" id="sheet-notes" placeholder="ej. sin cebolla, extra queso" value="${esc(notes)}">
        </div>` : '';

      const unit = calcUnitPrice(item, variant, selections, extras);
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

      // eventos internos
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
        // recoge la nota final por si el usuario no disparó oninput
        const ni = $('#sheet-notes', body);
        const extraNames = (item.extras || []).filter((ex) => extras.has(ex.id)).map((ex) => ex.name);
        cart.push({
          uid: uid(), itemId: item.id, name: item.name, cat: item.cat,
          detail: buildDetail(item, variant, selections),
          extras: extraNames,
          unitPrice: calcUnitPrice(item, variant, selections, extras),
          qty, notes: ni ? ni.value.trim() : '',
        });
        Store.saveCart(cart);
        closeModal();
        renderCart();
      };
    }
    draw();
    showModal(body);
  }

  // ==========================================================
  //  ENVÍO A WHATSAPP
  // ==========================================================
  function buildWhatsappText(order) {
    const d = new Date(order.ts);
    const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const modeLabel = order.serviceMode === 'llevar' ? '🥡 PARA LLEVAR' : '🍽️ COMER AQUÍ';
    let t = `🐶 *ZAMMU WAIFUU*\n*Pedido #${order.num}* · ${hora}\n*${modeLabel}*\n`;

    // agrupa las líneas por categoría, en el orden del menú
    const groups = {};
    order.lines.forEach((l) => {
      const k = l.cat || 'otros';
      if (!groups[k]) groups[k] = [];
      groups[k].push(l);
    });
    const order2 = menu.categories.map((c) => c.id);
    Object.keys(groups).forEach((k) => { if (!order2.includes(k)) order2.push(k); });

    const renderLine = (l) => {
      let s = `• ${l.qty}× ${l.name}`;
      if (l.detail) s += ` — ${l.detail}`;
      s += `\n`;
      if (l.extras && l.extras.length) s += `   ➕ ${l.extras.join(', ')}\n`;
      if (l.notes) s += `   📝 ${l.notes}\n`;
      return s;
    };

    order2.forEach((cid) => {
      const lines = groups[cid];
      if (!lines || !lines.length) return;
      const cat = menu.categories.find((c) => c.id === cid);
      const title = cat ? `${cat.icon || ''} ${cat.name}` : 'Otros';
      t += `\n*━━ ${title.trim().toUpperCase()} ━━*\n`;
      lines.forEach((l) => { t += renderLine(l); });
    });

    t += `\n*TOTAL: ${money(order.total)}*`;
    return t;
  }

  function sendOrder() {
    if (!cart.length) return;
    config.lastOrderNum = (config.lastOrderNum || 0) + 1;
    const order = {
      id: uid(), num: config.lastOrderNum, ts: Date.now(),
      serviceMode: config.serviceMode || 'aqui',
      lines: Store.clone(cart),
      total: cart.reduce((s, l) => s + l.unitPrice * l.qty, 0),
      canceled: false,
    };
    const orders = Store.getOrders();
    orders.push(order);
    Store.saveOrders(orders);
    Store.saveConfig(config);

    // limpia carrito
    cart = [];
    Store.saveCart(cart);
    renderCart();

    // comparte el pedido (permite elegir un grupo de WhatsApp)
    shareToKitchen(buildWhatsappText(order));
    toast(`Pedido #${order.num} listo ✅`);
  }

  async function shareToKitchen(text) {
    // 1) Web Share: abre WhatsApp con el texto ya escrito y deja elegir el GRUPO de cocina
    if (navigator.share) {
      try { await navigator.share({ text }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; } // el usuario canceló: no hacer nada
    }
    // 2) Respaldo: número directo si se configuró en Ajustes
    const num = (config.kitchenNumber || '').replace(/\D/g, '');
    if (num) { window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank'); return; }
    // 3) Último recurso: copiar al portapapeles para pegar en el grupo
    try { await navigator.clipboard.writeText(text); toast('Pedido copiado: pégalo en tu grupo de cocina'); }
    catch (e) { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); }
  }

  // ==========================================================
  //  VISTA: EDITAR MENÚ
  // ==========================================================
  function renderMenuEditor() {
    const box = $('#menu-editor');
    box.innerHTML = menu.categories.map((c) => {
      const items = menu.items.filter((i) => i.cat === c.id);
      const rows = items.map((i) => {
        const priceCtl = i.variants
          ? i.variants.map((v) => `<label class="mini">${esc(v.name)} <input type="number" inputmode="numeric" data-vprice="${i.id}:${v.id}" value="${v.price}"></label>`).join('')
          : `<label class="mini">Precio <input type="number" inputmode="numeric" data-price="${i.id}" value="${i.price || 0}"></label>`;
        const extrasCtl = (i.extras && i.extras.length)
          ? `<div class="edit-extras"><span class="extras-label">Extras (+ precio):</span>
              ${i.extras.map((ex) => `<label class="mini">${esc(ex.name)} <input type="number" inputmode="numeric" data-xprice="${i.id}:${ex.id}" value="${ex.priceDelta || 0}"></label>`).join('')}
            </div>`
          : '';
        return `<div class="edit-row ${i.available === false ? 'off' : ''}">
            <div class="edit-row-top">
              <input type="text" class="name-input" data-name="${i.id}" value="${esc(i.name)}">
              <button class="link-danger" data-delitem="${i.id}">✕</button>
            </div>
            <div class="edit-prices">${priceCtl}</div>
            ${extrasCtl}
            <label class="switch">
              <input type="checkbox" data-avail="${i.id}" ${i.available === false ? '' : 'checked'}>
              <span>${i.available === false ? 'Agotado' : 'Disponible'}</span>
            </label>
          </div>`;
      }).join('');
      return `<section class="edit-cat">
          <h3>${c.icon || ''} ${esc(c.name)}</h3>
          ${rows || '<p class="empty">Sin platillos.</p>'}
          <button class="btn-ghost" data-additem="${c.id}">+ Agregar platillo</button>
        </section>`;
    }).join('');
  }

  function persistMenu() { Store.saveMenu(menu); }

  // ==========================================================
  //  VISTA: CIERRE DEL DÍA
  // ==========================================================
  function renderCierre() {
    const orders = Store.getOrders().filter((o) => !o.canceled);
    const totals = {};
    let grand = 0;
    orders.forEach((o) => {
      o.lines.forEach((l) => {
        const key = l.name + (l.detail ? ` (${l.detail})` : '');
        if (!totals[key]) totals[key] = { qty: 0, money: 0 };
        totals[key].qty += l.qty;
        totals[key].money += l.unitPrice * l.qty;
        grand += l.unitPrice * l.qty;
      });
    });

    const rows = Object.entries(totals)
      .sort((a, b) => b[1].money - a[1].money)
      .map(([name, t]) => `<div class="close-row"><span class="q">${t.qty}×</span><span class="close-name">${esc(name)}</span><span>${money(t.money)}</span></div>`)
      .join('');

    $('#cierre-summary').innerHTML = `
      <div class="close-head">
        <div><span class="big-num">${orders.length}</span><small>pedidos hoy</small></div>
        <div><span class="big-num">${money(grand)}</span><small>total del día</small></div>
      </div>
      <h3>Vendido por platillo</h3>
      ${rows || '<p class="empty">Todavía no hay ventas hoy.</p>'}`;

    // pedidos de hoy (para anular)
    const allOrders = Store.getOrders();
    $('#today-orders').innerHTML = allOrders.length ? allOrders.slice().reverse().map((o) => {
      const d = new Date(o.ts);
      const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const resumen = o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ');
      return `<div class="order-row ${o.canceled ? 'canceled' : ''}">
          <div>
            <strong>#${o.num}</strong> · ${hora} · ${money(o.total)}
            <div class="order-sum">${esc(resumen)}</div>
          </div>
          ${o.canceled ? '<span class="tag">Anulado</span>' : `<button class="link-danger" data-cancel="${o.id}">Anular</button>`}
        </div>`;
    }).join('') : '<p class="empty">Sin pedidos aún.</p>';
  }

  function cancelOrder(id) {
    const orders = Store.getOrders();
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    if (!confirm(`¿Anular el pedido #${o.num}? Se descontará del cierre del día.`)) return;
    o.canceled = true;
    Store.saveOrders(orders);
    renderCierre();
    toast(`Pedido #${o.num} anulado`);
  }

  function closeDay() {
    const orders = Store.getOrders();
    const active = orders.filter((o) => !o.canceled);
    if (!active.length) { toast('No hay ventas para cerrar.'); return; }
    if (!confirm('¿Cerrar el día? Se guardará el resumen y se vaciarán los pedidos para empezar de nuevo.')) return;

    const totals = {};
    let grand = 0;
    active.forEach((o) => o.lines.forEach((l) => {
      const key = l.name + (l.detail ? ` (${l.detail})` : '');
      totals[key] = (totals[key] || 0) + l.qty;
      grand += l.unitPrice * l.qty;
    }));

    const closes = Store.getCloses();
    closes.push({ date: Store.todayStr(), closedAt: Date.now(), orderCount: active.length, grandTotal: grand, totals });
    Store.saveCloses(closes);

    Store.saveOrders([]);
    config.lastOrderNum = 0;
    config.dayStartedAt = Store.todayStr();
    Store.saveConfig(config);
    renderCierre();
    toast('Día cerrado ✅');
  }

  // ==========================================================
  //  MODAL / TOAST
  // ==========================================================
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

  // ==========================================================
  //  RESPALDO / RESTAURAR (mover menú entre celulares, sin servidor)
  // ==========================================================
  function exportBackup() {
    const data = { app: 'zammu-comandera', v: 1, exportedAt: new Date().toISOString(),
      menu, kitchenNumber: config.kitchenNumber || '' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zammu-menu-respaldo-${Store.todayStr()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Respaldo descargado ⬇️');
  }

  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !data.menu || !Array.isArray(data.menu.items) || !Array.isArray(data.menu.categories)) {
          throw new Error('formato');
        }
        if (!confirm('¿Restaurar este respaldo? Reemplazará el menú y los precios actuales de este celular.')) return;
        menu = data.menu;
        Store.saveMenu(menu);
        if (typeof data.kitchenNumber === 'string') { config.kitchenNumber = data.kitchenNumber; Store.saveConfig(config); }
        currentCat = menu.categories[0] ? menu.categories[0].id : null;
        closeModal();
        renderPedido();
        renderMenuEditor();
        toast('Menú restaurado ✅');
      } catch (e) {
        alert('Ese archivo no es un respaldo válido de la app.');
      }
    };
    reader.readAsText(file);
  }

  // ==========================================================
  //  AJUSTES
  // ==========================================================
  function openSettings() {
    const body = document.createElement('div');
    body.innerHTML = `
      <h2>Ajustes</h2>
      <div class="field">
        <label>Envío a cocina (grupo de WhatsApp)</label>
        <p class="hint" style="margin-top:0">Al tocar <b>Enviar a cocina</b>, se abre WhatsApp con el pedido ya escrito y eliges tu <b>grupo de cocina</b>. Consejo: fija (📌 pin) ese grupo en WhatsApp para que aparezca primero y sea un toque.</p>
      </div>
      <div class="field">
        <label>Número directo <small>(opcional — solo si NO usas grupo)</small></label>
        <input type="tel" id="cfg-num" inputmode="numeric" placeholder="ej. 525569738176" value="${esc(config.kitchenNumber || '')}">
        <p class="hint">Respaldo para celulares sin opción de “compartir”: el pedido iría directo a este número.</p>
      </div>
      <button class="btn-primary big" id="cfg-save">Guardar</button>

      <div class="field" style="margin-top:22px">
        <label>Respaldo del menú</label>
        <button class="btn-ghost" id="cfg-export">⬇️ Descargar respaldo</button>
        <label class="btn-ghost file-btn">⬆️ Restaurar desde archivo
          <input type="file" id="cfg-import" accept="application/json,.json" hidden>
        </label>
        <p class="hint">Guarda tus precios y ajustes en un archivo para pasarlos a otro celular si cambias de equipo.</p>
      </div>

      <button class="btn-ghost danger" id="cfg-reset">Restaurar menú original</button>`;
    $('#cfg-save', body).onclick = () => {
      config.kitchenNumber = $('#cfg-num', body).value.trim();
      Store.saveConfig(config);
      closeModal(); toast('Ajustes guardados');
    };
    $('#cfg-export', body).onclick = exportBackup;
    $('#cfg-import', body).onchange = (e) => { if (e.target.files[0]) importBackup(e.target.files[0]); };
    $('#cfg-reset', body).onclick = () => {
      if (!confirm('¿Restaurar el menú al original? Se perderán tus cambios de precios y platillos.')) return;
      menu = Store.resetMenu();
      currentCat = menu.categories[0].id;
      closeModal(); renderPedido(); renderMenuEditor(); toast('Menú restaurado');
    };
    showModal(body);
  }

  // ==========================================================
  //  NAVEGACIÓN Y EVENTOS GLOBALES
  // ==========================================================
  function switchView(view) {
    $$('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${view}`));
    $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
    if (view === 'pedido') renderPedido();
    if (view === 'menu') renderMenuEditor();
    if (view === 'cierre') renderCierre();
  }

  function bind() {
    // navegación
    $$('.nav-btn').forEach((b) => b.onclick = () => switchView(b.dataset.view));
    $('#btn-settings').onclick = openSettings;

    // pedido: chips + items (delegación)
    $('#cat-chips').onclick = (e) => {
      const btn = e.target.closest('[data-cat]');
      if (!btn) return;
      currentCat = btn.dataset.cat;
      renderPedido();
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
      Store.saveCart(cart);
      renderCart();
    };
    $('#btn-send').onclick = sendOrder;
    $('#service-mode').onclick = (e) => {
      const b = e.target.closest('[data-mode]');
      if (!b) return;
      config.serviceMode = b.dataset.mode;
      Store.saveConfig(config);
      renderServiceMode();
    };

    // editor de menú (delegación)
    $('#menu-editor').addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.name != null) {
        const it = menu.items.find((i) => i.id === t.dataset.name);
        if (it) { it.name = t.value; persistMenu(); }
      } else if (t.dataset.price != null) {
        const it = menu.items.find((i) => i.id === t.dataset.price);
        if (it) { it.price = Number(t.value) || 0; persistMenu(); }
      } else if (t.dataset.vprice != null) {
        const [iid, vid] = t.dataset.vprice.split(':');
        const it = menu.items.find((i) => i.id === iid);
        const v = it && it.variants.find((x) => x.id === vid);
        if (v) { v.price = Number(t.value) || 0; persistMenu(); }
      } else if (t.dataset.xprice != null) {
        const [iid, xid] = t.dataset.xprice.split(':');
        const it = menu.items.find((i) => i.id === iid);
        const ex = it && it.extras && it.extras.find((x) => x.id === xid);
        if (ex) { ex.priceDelta = Number(t.value) || 0; persistMenu(); }
      }
    });
    $('#menu-editor').addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.avail != null) {
        const it = menu.items.find((i) => i.id === t.dataset.avail);
        if (it) { it.available = t.checked; persistMenu(); renderMenuEditor(); }
      }
    });
    $('#menu-editor').addEventListener('click', (e) => {
      const del = e.target.closest('[data-delitem]');
      const add = e.target.closest('[data-additem]');
      if (del) {
        const it = menu.items.find((i) => i.id === del.dataset.delitem);
        if (it && confirm(`¿Eliminar "${it.name}" del menú?`)) {
          menu.items = menu.items.filter((i) => i.id !== del.dataset.delitem);
          persistMenu(); renderMenuEditor();
        }
      } else if (add) {
        const name = prompt('Nombre del nuevo platillo:');
        if (!name) return;
        const price = Number(prompt('Precio:', '0')) || 0;
        menu.items.push({ id: 'item_' + uid(), cat: add.dataset.additem, name: name.trim(), price, available: true, notes: true });
        persistMenu(); renderMenuEditor();
      }
    });

    // cierre
    $('#cierre-summary').closest('.view').addEventListener('click', (e) => {
      const cancel = e.target.closest('[data-cancel]');
      if (cancel) cancelOrder(cancel.dataset.cancel);
    });
    $('#btn-close-day').onclick = closeDay;
  }

  // ---------- Arranque ----------
  bind();
  switchView('pedido');

  // registra el service worker (PWA) si es posible
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
