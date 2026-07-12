/* Lógica de la app: armar pedido, editar menú, cierre del día, envío a WhatsApp. */
(() => {
  'use strict';

  // ---------- Estado ----------
  let menu = Store.getMenu();
  let cart = Store.getCart();
  let config = Store.getConfig();
  let currentCat = menu.categories[0]?.id || null;
  let editingNum = null; // nº del pedido que se está editando (corrección), o null

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const money = (n) => '$' + Math.round(n);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // Categorías que cocina SÍ prepara (solo estas se envían por WhatsApp).
  const KITCHEN_CATS = ['fastfood', 'coreano', 'baos'];
  const orderHasKitchen = (lines) => lines.some((l) => KITCHEN_CATS.includes(l.cat));

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

    // banner de edición
    const eb = $('#edit-banner');
    if (eb) {
      eb.hidden = editingNum == null;
      if (editingNum != null) eb.textContent = `✏️ Editando pedido #${editingNum} — ajusta y vuelve a enviar`;
    }

    const btn = $('#btn-send');
    btn.disabled = !cart.length;
    // el texto avisa qué pasará al tocarlo
    const hasK = orderHasKitchen(cart);
    if (!cart.length) {
      btn.textContent = '📲 Enviar a cocina (WhatsApp)';
    } else if (editingNum != null) {
      btn.textContent = hasK ? '📲 Reenviar corrección a cocina' : '💾 Guardar corrección (no va a cocina)';
    } else {
      btn.textContent = hasK ? '📲 Enviar a cocina (WhatsApp)' : '💾 Guardar pedido (no va a cocina)';
    }
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
    let t = `🐶 *ZAMMU WAIFUU*\n*Pedido #${order.num}${order.corrected ? ' — ✏️ CORRECCIÓN' : ''}* · ${hora}\n*${modeLabel}*\n`;

    // solo las líneas de categorías que cocina prepara
    const groups = {};
    order.lines.forEach((l) => {
      if (!KITCHEN_CATS.includes(l.cat)) return;
      if (!groups[l.cat]) groups[l.cat] = [];
      groups[l.cat].push(l);
    });

    const renderLine = (l) => {
      let s = `• ${l.qty}× ${l.name}`;
      if (l.detail) s += ` — ${l.detail}`;
      s += `\n`;
      if (l.extras && l.extras.length) s += `   ➕ ${l.extras.join(', ')}\n`;
      if (l.notes) s += `   📝 ${l.notes}\n`;
      return s;
    };

    // recorre en el orden del menú, solo categorías de cocina con líneas
    menu.categories.forEach((cat) => {
      const lines = groups[cat.id];
      if (!lines || !lines.length) return;
      t += `\n*━━ ${`${cat.icon || ''} ${cat.name}`.trim().toUpperCase()} ━━*\n`;
      lines.forEach((l) => { t += renderLine(l); });
    });

    return t; // sin total: cocina no necesita el monto
  }

  function sendOrder() {
    if (!cart.length) return;
    const corrected = editingNum != null;
    let num;
    if (corrected) {
      num = editingNum; // reutiliza el número original
    } else {
      config.lastOrderNum = (config.lastOrderNum || 0) + 1;
      num = config.lastOrderNum;
    }
    const order = {
      id: uid(), num, ts: Date.now(),
      serviceMode: config.serviceMode || 'aqui',
      corrected,
      lines: Store.clone(cart),
      total: cart.reduce((s, l) => s + l.unitPrice * l.qty, 0),
      canceled: false,
    };
    const orders = Store.getOrders();
    orders.push(order);
    Store.saveOrders(orders);
    Store.saveConfig(config);

    // limpia carrito y estado de edición
    cart = [];
    Store.saveCart(cart);
    editingNum = null;
    renderCart();

    // el pedido YA quedó guardado y contará en el cierre del día.
    // Solo se envía a cocina si incluye algo que ellos preparan.
    if (orderHasKitchen(order.lines)) {
      shareToKitchen(buildWhatsappText(order));
      toast(corrected ? `Corrección del #${order.num} enviada ✅` : `Pedido #${order.num} enviado a cocina ✅`);
    } else {
      toast(corrected ? `Corrección del #${order.num} guardada ✅` : `Pedido #${order.num} guardado ✅ (no va a cocina)`);
    }
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

  // ---------- Resumen del día (para enviar al administrador) ----------
  function dayBreakdown(orders) {
    const active = orders.filter((o) => !o.canceled);
    const totals = {};
    let grand = 0;
    active.forEach((o) => o.lines.forEach((l) => {
      const key = l.name + (l.detail ? ` (${l.detail})` : '');
      if (!totals[key]) totals[key] = { qty: 0, money: 0 };
      totals[key].qty += l.qty;
      totals[key].money += l.unitPrice * l.qty;
      grand += l.unitPrice * l.qty;
    }));
    return { totals, grand, count: active.length };
  }

  function reportText(dateStr, totals, count, grand) {
    let t = `📊 *ZAMMU WAIFUU — Resumen del día*\n🗓️ ${fmtDate(dateStr)}\n`;
    t += `━━━━━━━━━━━━\n`;
    t += `🧾 Pedidos: ${count}\n`;
    t += `💰 *TOTAL: ${money(grand)}*\n\n`;
    t += `*Vendido por platillo:*\n`;
    Object.entries(totals || {})
      .map(([name, v]) => ({ name, qty: typeof v === 'number' ? v : v.qty, mon: typeof v === 'number' ? null : v.money }))
      .sort((a, b) => (b.mon || 0) - (a.mon || 0))
      .forEach((r) => { t += `• ${r.qty}× ${r.name}${r.mon != null ? ` — ${money(r.mon)}` : ''}\n`; });
    return t;
  }

  async function shareText(text) {
    if (navigator.share) {
      try { await navigator.share({ text }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(text); toast('Resumen copiado ✅ pégalo donde quieras'); }
    catch (e) { window.prompt('Copia el resumen:', text); }
  }

  function shareDayReport() {
    const { totals, grand, count } = dayBreakdown(Store.getOrders());
    if (!count) { toast('No hay ventas hoy para enviar.'); return; }
    shareText(reportText(Store.todayStr(), totals, count, grand));
  }

  function shareCloseReport(close) {
    shareText(reportText(close.date, close.totals || {}, close.orderCount || 0, close.grandTotal || 0));
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

    // pedidos de hoy (tocar para desglosar; editar o anular)
    const allOrders = Store.getOrders();
    $('#today-orders').innerHTML = allOrders.length ? allOrders.slice().reverse().map((o) => {
      const d = new Date(o.ts);
      const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const resumen = o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ');
      const modeIcon = o.serviceMode === 'llevar' ? '🥡' : '🍽️';

      const detailLines = o.lines.map((l) => `
        <div class="detail-line">
          <span class="q">${l.qty}×</span>
          <div>
            <div class="cart-name">${esc(l.name)}</div>
            ${l.detail ? `<div class="cart-detail">${esc(l.detail)}</div>` : ''}
            ${(l.extras && l.extras.length) ? `<div class="cart-detail">➕ ${esc(l.extras.join(', '))}</div>` : ''}
            ${l.notes ? `<div class="cart-note">📝 ${esc(l.notes)}</div>` : ''}
          </div>
          <span>${money(l.unitPrice * l.qty)}</span>
        </div>`).join('');

      return `<div class="order-card ${o.canceled ? 'canceled' : ''}">
          <div class="order-head" data-toggle="${o.id}">
            <div>
              <strong>#${o.num}</strong> ${o.corrected ? '✏️' : ''} · ${hora} · ${modeIcon} · ${money(o.total)}
              <div class="order-sum">${esc(resumen)}</div>
            </div>
            <span class="chevron">▸</span>
          </div>
          <div class="order-detail" data-detail="${o.id}" hidden>
            ${detailLines}
            <div class="detail-foot">
              <span>${o.serviceMode === 'llevar' ? '🥡 Para llevar' : '🍽️ Comer aquí'}</span>
              <strong>Total ${money(o.total)}</strong>
            </div>
            ${o.canceled ? '<div class="tag">Anulado</div>' : `<div class="order-actions">
              <button class="btn-ghost" data-edit="${o.id}">✏️ Editar</button>
              <button class="btn-ghost danger" data-cancel="${o.id}">Anular</button>
            </div>`}
          </div>
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

  function editOrder(id) {
    if (cart.length) { alert('Tienes un pedido en curso. Envíalo o quítalo antes de editar otro.'); return; }
    const orders = Store.getOrders();
    const o = orders.find((x) => x.id === id);
    if (!o || o.canceled) return;
    if (!confirm(`¿Editar el pedido #${o.num}? Se cargará para modificarlo y lo vuelves a enviar como corrección.`)) return;
    // carga las líneas al carrito y quita el original (se re-guardará con el mismo número al reenviar)
    cart = Store.clone(o.lines);
    Store.saveCart(cart);
    config.serviceMode = o.serviceMode || 'aqui';
    Store.saveConfig(config);
    editingNum = o.num;
    Store.saveOrders(orders.filter((x) => x.id !== id));
    switchView('pedido');
    toast(`Editando pedido #${o.num}: ajusta y vuelve a enviar`);
  }

  function closeDay() {
    const orders = Store.getOrders();
    const active = orders.filter((o) => !o.canceled);
    if (!active.length) { toast('No hay ventas para cerrar.'); return; }
    if (!confirm('¿Cerrar el día? Quedará guardado en el 📚 Historial y se vaciarán los pedidos para empezar de nuevo.')) return;

    // desglose por platillo con cantidad y dinero
    const totals = {};
    let grand = 0;
    active.forEach((o) => o.lines.forEach((l) => {
      const key = l.name + (l.detail ? ` (${l.detail})` : '');
      if (!totals[key]) totals[key] = { qty: 0, money: 0 };
      totals[key].qty += l.qty;
      totals[key].money += l.unitPrice * l.qty;
      grand += l.unitPrice * l.qty;
    }));

    const closes = Store.getCloses();
    closes.push({
      id: uid(),
      date: Store.todayStr(),
      closedAt: Date.now(),
      orderCount: active.length,
      grandTotal: grand,
      totals,                          // { "platillo": {qty, money} }
      orders: Store.clone(active),     // detalle completo para consultar después
    });
    Store.saveCloses(closes);

    Store.saveOrders([]);
    config.lastOrderNum = 0;
    config.dayStartedAt = Store.todayStr();
    Store.saveConfig(config);
    renderCierre();
    renderHistorial();
    toast('Día cerrado y guardado en Historial ✅');
  }

  // expande/colapsa una tarjeta (.order-card) desde su encabezado
  function toggleCard(headEl) {
    const card = headEl.closest('.order-card');
    if (!card) return;
    const detail = card.querySelector('.order-detail');
    const chevron = headEl.querySelector('.chevron');
    const open = detail.hidden;
    detail.hidden = !open;
    if (chevron) chevron.textContent = open ? '▾' : '▸';
  }

  // ==========================================================
  //  VISTA: HISTORIAL (días cerrados)
  // ==========================================================
  function fmtDate(ymd) {
    const p = String(ymd || '').split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : (ymd || '');
  }

  function renderHistorial() {
    const closes = Store.getCloses();
    const box = $('#historial-list');
    if (!closes.length) { box.innerHTML = '<p class="empty">Aún no hay días cerrados. Se guardarán aquí al usar “Cerrar día”.</p>'; return; }

    box.innerHTML = closes.slice().reverse().map((c) => {
      // desglose por platillo (compatible con cierres viejos donde totals era solo cantidad)
      const rows = Object.entries(c.totals || {})
        .map(([name, v]) => {
          const qty = typeof v === 'number' ? v : v.qty;
          const mon = typeof v === 'number' ? null : v.money;
          return { name, qty, mon };
        })
        .sort((a, b) => (b.mon || 0) - (a.mon || 0))
        .map((r) => `<div class="close-row"><span class="q">${r.qty}×</span><span class="close-name">${esc(r.name)}</span>${r.mon != null ? `<span>${money(r.mon)}</span>` : ''}</div>`)
        .join('');

      // detalle de pedidos (si el cierre lo guardó)
      const ordersHtml = Array.isArray(c.orders) && c.orders.length ? `
        <h4 class="detail-h">Pedidos (${c.orders.length})</h4>
        ${c.orders.map((o) => {
          const d = new Date(o.ts);
          const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          const modeIcon = o.serviceMode === 'llevar' ? '🥡' : '🍽️';
          const lines = o.lines.map((l) => `<div class="hist-line">• ${l.qty}× ${esc(l.name)}${l.detail ? ` — ${esc(l.detail)}` : ''}${(l.extras && l.extras.length) ? ` ➕ ${esc(l.extras.join(', '))}` : ''}${l.notes ? ` 📝 ${esc(l.notes)}` : ''}</div>`).join('');
          return `<div class="hist-order"><div class="hist-order-head">#${o.num}${o.corrected ? ' ✏️' : ''} · ${hora} · ${modeIcon} · ${money(o.total)}</div>${lines}</div>`;
        }).join('')}` : '<p class="hint">Este día se cerró con una versión anterior: se guardó el resumen, sin el detalle de cada pedido.</p>';

      return `<div class="order-card">
          <div class="order-head" data-htoggle="${c.id || c.closedAt}">
            <div>
              <strong>${fmtDate(c.date)}</strong> · ${money(c.grandTotal || 0)} · ${c.orderCount || 0} pedidos
            </div>
            <span class="chevron">▸</span>
          </div>
          <div class="order-detail" hidden>
            <h4 class="detail-h">Vendido por platillo</h4>
            ${rows || '<p class="empty">Sin desglose.</p>'}
            ${ordersHtml}
            <button class="btn-ghost" data-share="${c.id || c.closedAt}">📤 Enviar resumen de este día</button>
          </div>
        </div>`;
    }).join('');
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
    const data = {
      app: 'zammu-comandera', v: 2, exportedAt: new Date().toISOString(),
      menu,
      kitchenNumber: config.kitchenNumber || '',
      lastOrderNum: config.lastOrderNum || 0,
      dayStartedAt: config.dayStartedAt || Store.todayStr(),
      orders: Store.getOrders(),   // pedidos del día
      closes: Store.getCloses(),   // cierres archivados
    };
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
        if (typeof data.kitchenNumber === 'string') config.kitchenNumber = data.kitchenNumber;

        // pedidos del día (opcional): solo si el respaldo los incluye
        let restauroPedidos = false;
        if (Array.isArray(data.orders) && data.orders.length) {
          const activos = data.orders.filter((o) => !o.canceled);
          const monto = activos.reduce((s, o) => s + (o.total || 0), 0);
          if (confirm(`El respaldo incluye ${activos.length} pedido(s) del día (${money(monto)}). ¿Restaurarlos también? Reemplazará los pedidos actuales de este celular.`)) {
            Store.saveOrders(data.orders);
            if (Array.isArray(data.closes)) Store.saveCloses(data.closes);
            if (typeof data.lastOrderNum === 'number') config.lastOrderNum = data.lastOrderNum;
            if (typeof data.dayStartedAt === 'string') config.dayStartedAt = data.dayStartedAt;
            restauroPedidos = true;
          }
        }

        Store.saveConfig(config);
        currentCat = menu.categories[0] ? menu.categories[0].id : null;
        closeModal();
        renderPedido();
        renderMenuEditor();
        renderCierre();
        toast(restauroPedidos ? 'Menú y pedidos restaurados ✅' : 'Menú restaurado ✅');
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
        <p class="hint">Guarda tu menú, precios <b>y los pedidos del día</b> en un archivo. Sirve para pasar el menú a otro celular o como red de seguridad de la jornada.</p>
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
    if (view === 'historial') renderHistorial();
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

    // cierre: desglosar (toggle), editar y anular
    $('#cierre-summary').closest('.view').addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-toggle]');
      const edit = e.target.closest('[data-edit]');
      const cancel = e.target.closest('[data-cancel]');
      if (edit) { editOrder(edit.dataset.edit); return; }
      if (cancel) { cancelOrder(cancel.dataset.cancel); return; }
      if (toggle) toggleCard(toggle);
    });
    $('#btn-close-day').onclick = closeDay;
    $('#btn-share-day').onclick = shareDayReport;

    // historial: compartir resumen o expandir un día cerrado
    $('#view-historial').addEventListener('click', (e) => {
      const share = e.target.closest('[data-share]');
      if (share) {
        const key = share.dataset.share;
        const c = Store.getCloses().find((x) => String(x.id || x.closedAt) === key);
        if (c) shareCloseReport(c);
        return;
      }
      const h = e.target.closest('[data-htoggle]');
      if (h) toggleCard(h);
    });
  }

  // ---------- Arranque ----------
  bind();
  switchView('pedido');

  // registra el service worker (PWA) si es posible
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
