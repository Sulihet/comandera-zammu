/* Lógica de la app: armar pedido, editar menú, cierre del día, envío a WhatsApp. */
(() => {
  'use strict';

  // ---------- Estado ----------
  let menu = Store.getMenu();
  let cart = Store.getCart();
  let config = Store.getConfig();
  let currentCat = menu.categories[0]?.id || null;
  let editingNum = null; // nº del pedido que se está editando (corrección), o null
  let editingKitchenSig = null; // firma de las líneas de cocina del pedido original (para detectar cambios)
  let editingOriginal = null; // copia íntegra del pedido en edición (para poder cancelar la edición)

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const money = (n) => '$' + Math.round(n);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // Categorías que cocina SÍ prepara (solo estas se envían por WhatsApp).
  const KITCHEN_CATS = ['fastfood', 'coreano', 'baos'];
  // El hot-dog NO se manda a cocina (lo prepara otra persona), aunque sea fastfood.
  const isKitchenLine = (l) => KITCHEN_CATS.includes(l.cat) && !/hot\s*dog/i.test(l.name);
  const orderHasKitchen = (lines) => lines.some(isKitchenLine);

  // firma de las líneas de cocina; sirve para saber si una corrección cambió
  // algo que cocina prepara (y así decidir si se reenvía el WhatsApp).
  function kitchenSig(lines) {
    return lines
      .filter(isKitchenLine)
      .map((l) => `${l.name}|${l.detail || ''}|${(l.extras || []).slice().sort().join(',')}|${(l.notes || '').trim()}|${l.qty}`)
      .sort()
      .join('||');
  }

  // Estado del pedido en la lista de Cierre (solo control visual, no toca dinero).
  // 2 valores: al enviarse nace "En preparación" y con un toque alterna a "Entregado".
  const ORDER_STATUS = ['preparacion', 'entregado'];
  const STATUS_META = {
    preparacion: { label: '⏳ En preparación', cls: 'st-prep' },
    entregado:   { label: '✅ Entregado',      cls: 'st-entregado' },
  };
  const statusOf = (o) => (o && STATUS_META[o.status]) ? o.status : 'preparacion'; // compat pedidos viejos
  const nextStatus = (s) => ORDER_STATUS[(ORDER_STATUS.indexOf(statusOf({ status: s })) + 1) % ORDER_STATUS.length];

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

    // banner de edición (con opción de cancelar la edición)
    const eb = $('#edit-banner');
    if (eb) {
      eb.hidden = editingNum == null;
      if (editingNum != null) {
        eb.innerHTML = `<span>✏️ Editando pedido #${editingNum} — ajusta y vuelve a enviar</span>
          <button id="btn-cancel-edit" class="link-cancel-edit">✖ Cancelar edición</button>`;
        const cb = $('#btn-cancel-edit'); if (cb) cb.onclick = cancelEdit;
      } else {
        eb.innerHTML = '';
      }
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
    const nm = $('#customer-name');
    if (nm) nm.value = config.customerName || '';
  }

  function renderServiceMode() {
    const el = $('#service-mode');
    if (!el) return;
    const m = config.serviceMode; // sin default: el mesero DEBE elegir
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
    let t = `🐶 *ZAMMU WAIFUU*\n*Pedido #${order.num}${order.corrected ? ' — ✏️ CORRECCIÓN' : ''}${order.customerName ? ' — 👤 ' + order.customerName : ''}* · ${hora}\n*${modeLabel}*\n`;

    // solo las líneas que cocina prepara (excluye hot-dog)
    const groups = {};
    order.lines.forEach((l) => {
      if (!isKitchenLine(l)) return;
      if (!groups[l.cat]) groups[l.cat] = [];
      groups[l.cat].push(l);
    });

    // antepone "Extra" al extra, salvo que el nombre ya lo incluya (ej. "Carne extra")
    const extraLabel = (n) => (/extra/i.test(n) ? n : `Extra ${n}`);
    const renderLine = (l) => {
      let s = `• ${l.qty}× ${l.name}`;
      if (l.detail) s += ` — ${l.detail}`;
      s += `\n`;
      const esHamburguesa = /hamburgues/i.test(l.name);
      const tieneNota = !!(l.notes && l.notes.trim());
      // hamburguesa sin comentarios = con todo (así se avisa a cocina)
      if (esHamburguesa && !tieneNota) s += `   ✅ Con todo\n`;
      if (l.extras && l.extras.length) s += `   ➕ ${l.extras.map(extraLabel).join(', ')}\n`;
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

  async function sendOrder() {
    if (!cart.length) return;
    // el nombre del cliente es obligatorio: sin él no se envía ni se guarda
    const customerName = (config.customerName || '').trim();
    if (!customerName) {
      toast('Escribe el nombre del cliente');
      const nm = $('#customer-name'); if (nm) nm.focus();
      return;
    }
    // el modo de servicio es obligatorio: el mesero debe elegir (sin default)
    if (config.serviceMode !== 'aqui' && config.serviceMode !== 'llevar') {
      toast('Elige: 🍽️ Comer aquí o 🥡 Para llevar');
      return;
    }
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
      serviceMode: config.serviceMode,
      corrected,
      lines: Store.clone(cart),
      total: cart.reduce((s, l) => s + l.unitPrice * l.qty, 0),
      canceled: false,
      status: 'preparacion', // nace "En preparación" al enviarse a cocina
      customerName,
    };
    const orders = Store.getOrders();
    orders.push(order);
    Store.saveOrders(orders);
    // limpia para el siguiente pedido: nombre y modo de servicio se vuelven a pedir
    config.customerName = '';
    config.serviceMode = null;
    Store.saveConfig(config);

    // ¿(re)enviar a cocina? En una corrección, SOLO si cambió algo de lo que
    // cocina prepara (Fast Food / Coreano / Pan). Sumar o quitar banderillas o
    // bebidas actualiza la orden pero no reenvía el mensaje.
    const kitchenChanged = !corrected || (kitchenSig(order.lines) !== editingKitchenSig);
    const sendKitchen = orderHasKitchen(order.lines) && kitchenChanged;

    // limpia carrito y estado de edición
    cart = [];
    Store.saveCart(cart);
    editingNum = null;
    editingKitchenSig = null;
    editingOriginal = null;
    renderCart();

    if (sendKitchen) {
      const ok = await shareToKitchen(buildWhatsappText(order));
      markKitchenSent(order.id, ok); // registra si llegó o no
      if (ok) {
        toast(corrected ? `Corrección del #${order.num} enviada a cocina ✅` : `Pedido #${order.num} enviado a cocina ✅`);
      } else {
        alert(`⚠️ El pedido #${order.num} NO se envió a cocina.\n\nQuedó guardado. Reenvíalo desde 💰 Cierre → "Pedidos de hoy" con el botón 📲 Reenviar a cocina.`);
      }
    } else if (corrected) {
      toast(`Pedido #${order.num} actualizado ✅ (sin cambios para cocina)`);
    } else {
      toast(`Pedido #${order.num} guardado ✅ (no va a cocina)`);
    }
  }

  // Devuelve true si el pedido se compartió/abrió en WhatsApp; false si el usuario canceló.
  async function shareToKitchen(text) {
    // 1) Web Share: abre WhatsApp con el texto ya escrito y deja elegir el GRUPO de cocina
    if (navigator.share) {
      try { await navigator.share({ text }); return true; }
      catch (e) { if (e && e.name === 'AbortError') return false; } // el usuario canceló
      // otros errores del share: cae al respaldo
    }
    // 2) Respaldo: número directo si se configuró en Ajustes
    const num = (config.kitchenNumber || '').replace(/\D/g, '');
    if (num) { window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank'); return true; }
    // 3) Último recurso: copiar al portapapeles para pegar en el grupo
    try { await navigator.clipboard.writeText(text); toast('Pedido copiado: pégalo en tu grupo de cocina'); return true; }
    catch (e) { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); return true; }
  }

  function markKitchenSent(id, ok) {
    const orders = Store.getOrders();
    const o = orders.find((x) => x.id === id);
    if (o) { o.kitchenSent = ok; Store.saveOrders(orders); }
  }

  // Reenvía a cocina el WhatsApp de un pedido ya guardado (cancelado, chat equivocado, etc.)
  async function resendKitchen(id) {
    const orders = Store.getOrders();
    const o = orders.find((x) => x.id === id);
    if (!o || o.canceled) return;
    if (!orderHasKitchen(o.lines)) { toast('Este pedido no lleva nada de cocina'); return; }
    const ok = await shareToKitchen(buildWhatsappText(o));
    markKitchenSent(id, ok);
    renderCierre();
    toast(ok ? `Pedido #${o.num} reenviado a cocina ✅` : '⚠️ No se envió — inténtalo de nuevo');
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

  function reportText(dateStr, totals, count, grand, orders) {
    let t = `📊 *ZAMMU WAIFUU — Resumen del día*\n🗓️ ${fmtDate(dateStr)}\n`;
    t += `━━━━━━━━━━━━\n`;
    t += `🧾 Pedidos: ${count}\n`;
    t += `💰 *TOTAL: ${money(grand)}*\n\n`;

    // desglose por platillo con su monto total
    t += `*Vendido por platillo:*\n`;
    Object.entries(totals || {})
      .map(([name, v]) => ({ name, qty: typeof v === 'number' ? v : v.qty, mon: typeof v === 'number' ? null : v.money }))
      .sort((a, b) => (b.mon || 0) - (a.mon || 0))
      .forEach((r) => { t += `• ${r.qty}× ${r.name}${r.mon != null ? ` — ${money(r.mon)}` : ''}\n`; });

    // detalle de cada orden (si está disponible)
    if (Array.isArray(orders) && orders.length) {
      t += `\n*Detalle de órdenes:*\n`;
      orders.forEach((o) => {
        const d = new Date(o.ts);
        const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        const mode = o.serviceMode === 'llevar' ? '🥡' : '🍽️';
        const cli = o.customerName ? ` · 👤 ${o.customerName}` : '';
        t += `\n*#${o.num}${o.corrected ? ' ✏️' : ''}*${cli} · ${hora} · ${mode} · ${money(o.total)}\n`;
        o.lines.forEach((l) => {
          t += `   • ${l.qty}× ${l.name}${l.detail ? ` — ${l.detail}` : ''}`;
          if (l.extras && l.extras.length) t += ` ➕ ${l.extras.join(', ')}`;
          if (l.notes) t += ` 📝 ${l.notes}`;
          t += `\n`;
        });
      });
    }
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
    const orders = Store.getOrders();
    const active = orders.filter((o) => !o.canceled);
    const { totals, grand, count } = dayBreakdown(orders);
    if (!count) { toast('No hay ventas hoy para enviar.'); return; }
    shareText(reportText(Store.todayStr(), totals, count, grand, active));
  }

  function shareCloseReport(close) {
    shareText(reportText(close.date, close.totals || {}, close.orderCount || 0, close.grandTotal || 0, close.orders || null));
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
  // agrupa un platillo en un "concepto general" para el Cierre
  function conceptOf(l) {
    const cat = l.cat;
    if (cat === 'salada' || cat === 'dulce') return { key: 'banderillas', label: 'Banderillas', icon: '🍢', order: 2 };
    if (cat === 'coreano') return { key: 'coreano', label: 'Coreano', icon: '🍜', order: 3 };
    if (cat === 'bebidas') return { key: 'bebidas', label: 'Bebidas', icon: '🥤', order: 5 };
    if (cat === 'baos') return { key: 'baos', label: 'Pan al vapor', icon: '🥟', order: 6 };
    if (cat === 'fastfood') {
      if (/hot\s*dog/i.test(l.name)) return { key: 'hotdogs', label: 'Hot-dogs', icon: '🌭', order: 4 };
      if (/papas/i.test(l.name)) return { key: 'papas', label: 'Papas', icon: '🍟', order: 4.5 };
      return { key: 'hamburguesas', label: 'Hamburguesas', icon: '🍔', order: 1 };
    }
    return { key: 'otros', label: 'Otros', icon: '🛒', order: 9 };
  }

  function renderCierre() {
    const orders = Store.getOrders().filter((o) => !o.canceled);

    // agrupa: concepto general -> { qty, money, items: { platillo: {qty,money} } }
    const concepts = {};
    let grand = 0;
    orders.forEach((o) => o.lines.forEach((l) => {
      const c = conceptOf(l);
      const m = l.unitPrice * l.qty;
      grand += m;
      if (!concepts[c.key]) concepts[c.key] = { label: c.label, icon: c.icon, order: c.order, qty: 0, money: 0, items: {} };
      const g = concepts[c.key];
      g.qty += l.qty; g.money += m;
      const ik = l.name + (l.detail ? ` (${l.detail})` : '');
      if (!g.items[ik]) g.items[ik] = { qty: 0, money: 0 };
      g.items[ik].qty += l.qty; g.items[ik].money += m;
    }));

    // números grandes arriba
    $('#cierre-head').innerHTML = `
      <div class="close-head">
        <div><span class="big-num">${orders.length}</span><small>pedidos hoy</small></div>
        <div><span class="big-num">${money(grand)}</span><small>total del día</small></div>
      </div>`;

    // ventas por concepto (tarjetas expandibles: concepto -> platillos)
    const conceptCards = Object.values(concepts).sort((a, b) => a.order - b.order).map((g) => {
      const items = Object.entries(g.items).sort((a, b) => b[1].money - a[1].money)
        .map(([name, v]) => `<div class="concept-item"><span class="q">${v.qty}×</span><span class="nm">${esc(name)}</span><span class="mn">${money(v.money)}</span></div>`).join('');
      return `<div class="order-card">
          <div class="order-head" data-toggle="c-${esc(g.label)}">
            <div><strong>${g.icon} ${esc(g.label)}</strong> <span class="order-sum">${g.qty} vendido${g.qty === 1 ? '' : 's'}</span></div>
            <div class="concept-right"><strong>${money(g.money)}</strong><span class="chevron">▸</span></div>
          </div>
          <div class="order-detail" hidden>${items}</div>
        </div>`;
    }).join('');
    $('#cierre-summary').innerHTML = conceptCards || '<p class="empty">Todavía no hay ventas hoy.</p>';

    // pedidos de hoy (tocar para desglosar; editar o anular)
    const allOrders = Store.getOrders();
    $('#today-orders').innerHTML = allOrders.length ? allOrders.slice().reverse().map((o) => {
      const d = new Date(o.ts);
      const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const resumen = o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ');
      const modeIcon = o.serviceMode === 'llevar' ? '🥡' : '🍽️';
      const cliente = esc(o.customerName || '—');
      const st = statusOf(o);
      const statusChip = o.canceled ? '' :
        `<button class="order-status ${STATUS_META[st].cls}" data-status="${o.id}">${STATUS_META[st].label}</button>`;
      const needsKitchen = !o.canceled && orderHasKitchen(o.lines);
      const notSent = needsKitchen && o.kitchenSent === false; // se sabe que NO llegó
      const notSentBadge = notSent
        ? `<button class="not-sent" data-resend="${o.id}">⚠️ No llegó a cocina · toca para reenviar</button>` : '';

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

      return `<div class="order-card ${o.canceled ? 'canceled' : (notSent ? 'not-sent-card' : STATUS_META[st].cls)}">
          <div class="order-head" data-toggle="${o.id}">
            <div>
              <strong>#${o.num}</strong> ${o.corrected ? '✏️' : ''} · 👤 ${cliente} · ${hora} · ${modeIcon} · ${money(o.total)}
              <div class="order-sum">${esc(resumen)}</div>
              ${notSentBadge}
            </div>
            ${statusChip}
            <span class="chevron">▸</span>
          </div>
          <div class="order-detail" data-detail="${o.id}" hidden>
            ${detailLines}
            <div class="detail-foot">
              <span>👤 ${cliente} · ${o.serviceMode === 'llevar' ? '🥡 Para llevar' : '🍽️ Comer aquí'}</span>
              <strong>Total ${money(o.total)}</strong>
            </div>
            ${o.canceled ? '<div class="tag">Cancelado</div>' : `
              ${needsKitchen ? `<button class="act-btn act-resend full" data-resend="${o.id}">📲 Reenviar a cocina</button>` : ''}
              <div class="order-actions">
                <button class="act-btn act-edit" data-edit="${o.id}">✏️ Editar</button>
                <button class="act-btn act-cancel" data-cancel="${o.id}">✖ Cancelar</button>
              </div>`}
          </div>
        </div>`;
    }).join('') : '<p class="empty">Sin pedidos aún.</p>';
  }

  // Alterna el estado del pedido (En preparación ↔ Entregado). Solo control visual.
  function advanceStatus(id) {
    const orders = Store.getOrders();
    const o = orders.find((x) => x.id === id);
    if (!o || o.canceled) return;
    o.status = nextStatus(statusOf(o));
    Store.saveOrders(orders);
    renderCierre();
  }

  function cancelOrder(id) {
    const orders = Store.getOrders();
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    if (!confirm(`¿Cancelar el pedido #${o.num}? Se descontará del cierre del día.`)) return;
    o.canceled = true;
    Store.saveOrders(orders);
    renderCierre();
    toast(`Pedido #${o.num} cancelado`);
  }

  function editOrder(id) {
    if (cart.length) { alert('Tienes un pedido en curso. Envíalo o quítalo antes de editar otro.'); return; }
    const orders = Store.getOrders();
    const o = orders.find((x) => x.id === id);
    if (!o || o.canceled) return;
    if (!confirm(`¿Editar el pedido #${o.num}? Se cargará para modificarlo y lo vuelves a enviar como corrección.`)) return;
    // carga las líneas al carrito y quita el original (se re-guardará con el mismo número al reenviar)
    editingOriginal = Store.clone(o); // guarda el original íntegro por si se cancela la edición
    cart = Store.clone(o.lines);
    Store.saveCart(cart);
    config.serviceMode = o.serviceMode || 'aqui';
    config.customerName = o.customerName || ''; // recarga el nombre para poder editarlo
    Store.saveConfig(config);
    editingNum = o.num;
    editingKitchenSig = kitchenSig(o.lines); // recuerda cómo estaba la parte de cocina
    Store.saveOrders(orders.filter((x) => x.id !== id));
    switchView('pedido');
    toast(`Editando pedido #${o.num}: ajusta y vuelve a enviar`);
  }

  // Cancela la edición: restaura el pedido original tal cual y limpia el carrito.
  function cancelEdit() {
    if (editingNum == null) return;
    if (!confirm('¿Cancelar la edición? El pedido volverá como estaba, sin cambios.')) return;
    const num = editingNum;
    if (editingOriginal) {
      const orders = Store.getOrders();
      if (!orders.some((x) => x.id === editingOriginal.id)) orders.push(editingOriginal);
      Store.saveOrders(orders);
    }
    cart = [];
    Store.saveCart(cart);
    editingNum = null;
    editingKitchenSig = null;
    editingOriginal = null;
    config.customerName = '';
    config.serviceMode = null;
    Store.saveConfig(config);
    renderCart();
    switchView('cierre');
    toast(`Edición cancelada — pedido #${num} intacto`);
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
          const cli = o.customerName ? ` · 👤 ${esc(o.customerName)}` : '';
          const lines = o.lines.map((l) => `<div class="hist-line">• ${l.qty}× ${esc(l.name)}${l.detail ? ` — ${esc(l.detail)}` : ''}${(l.extras && l.extras.length) ? ` ➕ ${esc(l.extras.join(', '))}` : ''}${l.notes ? ` 📝 ${esc(l.notes)}` : ''}</div>`).join('');
          return `<div class="hist-order"><div class="hist-order-head">#${o.num}${o.corrected ? ' ✏️' : ''}${cli} · ${hora} · ${modeIcon} · ${money(o.total)}</div>${lines}</div>`;
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
  // Producto libre: concepto + precio escritos a mano (para lo que no está en el menú).
  function openCustomSheet() {
    let qty = 1;
    const body = document.createElement('div');
    body.innerHTML = `
      <h2>Producto libre</h2>
      <p class="hint" style="margin-top:0">Para lo que no está en el menú (dulces coreanos, bebidas, vasos, etc.). No se manda a cocina.</p>
      <div class="field">
        <label>¿Qué es? <small>(concepto)</small></label>
        <input type="text" id="cust-name" placeholder="ej. Dulce coreano, Bebida de leche, Vaso">
      </div>
      <div class="field">
        <label>Precio</label>
        <input type="number" id="cust-price" inputmode="numeric" placeholder="ej. 25">
      </div>
      <div class="field">
        <label>Nota <small>(opcional)</small></label>
        <input type="text" id="cust-notes" placeholder="detalle opcional">
      </div>
      <div class="field qty-field">
        <label>Cantidad</label>
        <div class="stepper">
          <button data-cqty="-1">−</button><span id="cust-qty">1</span><button data-cqty="1">+</button>
        </div>
      </div>
      <button class="btn-primary big" id="cust-add">Agregar</button>`;

    const priceEl = () => $('#cust-price', body);
    const updateBtn = () => {
      const p = Number(priceEl().value) || 0;
      $('#cust-add', body).textContent = p > 0 ? `Agregar · ${money(p * qty)}` : 'Agregar';
    };
    $$('[data-cqty]', body).forEach((b) => b.onclick = () => {
      qty = Math.max(1, qty + Number(b.dataset.cqty));
      $('#cust-qty', body).textContent = qty;
      updateBtn();
    });
    priceEl().oninput = updateBtn;

    $('#cust-add', body).onclick = () => {
      const name = $('#cust-name', body).value.trim();
      const raw = priceEl().value;
      const price = Number(raw);
      if (!name) { toast('Escribe el concepto'); return; }
      if (raw === '' || !isFinite(price) || price < 0) { toast('Escribe un precio válido'); return; }
      cart.push({
        uid: uid(), itemId: 'custom', name, cat: 'otros',
        detail: '', extras: [], unitPrice: price, qty,
        notes: $('#cust-notes', body).value.trim(),
      });
      Store.saveCart(cart);
      closeModal();
      renderCart();
      toast('Agregado al pedido');
    };
    showModal(body);
  }

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
    $('#btn-custom').onclick = openCustomSheet;
    $('#cart-lines').onclick = (e) => {
      const del = e.target.closest('[data-del]');
      if (!del) return;
      cart = cart.filter((l) => l.uid !== del.dataset.del);
      Store.saveCart(cart);
      renderCart();
    };
    $('#btn-send').onclick = sendOrder;
    $('#customer-name').oninput = (e) => {
      config.customerName = e.target.value;
      Store.saveConfig(config);
    };
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
      const status = e.target.closest('[data-status]');
      const resend = e.target.closest('[data-resend]');
      const toggle = e.target.closest('[data-toggle]');
      const edit = e.target.closest('[data-edit]');
      const cancel = e.target.closest('[data-cancel]');
      if (resend) { resendKitchen(resend.dataset.resend); return; } // no debe expandir la tarjeta
      if (status) { advanceStatus(status.dataset.status); return; }
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
