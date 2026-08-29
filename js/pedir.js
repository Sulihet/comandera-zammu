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
    try { localStorage.setItem(K, JSON.stringify({ cart, name, mode, address, reference, geoloc, addrMode, payMode, payBill, payBillOther })); } catch (e) { /* modo privado, etc. */ }
  }
  const _s = loadState();
  let cart = Array.isArray(_s.cart) ? _s.cart : [];
  let name = typeof _s.name === 'string' ? _s.name : '';
  // El cliente por WhatsApp NO come en el local: solo Recoger o A domicilio.
  let mode = (_s.mode === 'recoger' || _s.mode === 'domicilio') ? _s.mode : null;
  let address = typeof _s.address === 'string' ? _s.address : '';
  // Referencias (entre calles, color de casa…) cuando escribe su dirección. Opcional.
  let reference = typeof _s.reference === 'string' ? _s.reference : '';
  // Ubicación GPS opcional (para domicilio): {lat, lng} o null.
  // OJO: no llamar esta variable "location" (taparía window.location y rompe el feed).
  let geoloc = (_s.geoloc && typeof _s.geoloc.lat === 'number' && typeof _s.geoloc.lng === 'number') ? _s.geoloc : null;
  // En domicilio, cómo indica su ubicación: 'texto' (escribe dirección) o 'ubicacion' (GPS).
  let addrMode = (_s.addrMode === 'ubicacion') ? 'ubicacion' : 'texto';
  // Pago SOLO aplica a domicilio: 'efectivo' | 'transferencia' | null.
  let payMode = (['efectivo', 'transferencia'].indexOf(_s.payMode) >= 0) ? _s.payMode : null;
  // Con cuánto paga (denominación) en domicilio + efectivo, para llevar cambio.
  let payBill = typeof _s.payBill === 'string' ? _s.payBill : '';
  // Cantidad escrita a mano cuando el billete es "Otro".
  let payBillOther = typeof _s.payBillOther === 'string' ? _s.payBillOther : '';

  // Métodos de pago (domicilio) y billetes rápidos.
  const PAY = {
    efectivo:      { ic: '💵', name: 'Efectivo' },
    transferencia: { ic: '🏦', name: 'Transferencia' },
  };
  const BILLS = ['Pago justo', '$100', '$200', '$500', 'Otro'];

  // Denominación efectiva (resuelve "Otro" a la cantidad escrita, ej. "$700").
  function billValue() {
    if (payBill === 'Otro') { const v = (payBillOther || '').replace(/[^\d]/g, ''); return v ? '$' + v : ''; }
    return payBill;
  }

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
    // [icono, etiqueta, texto, href?]  -> href hace el texto clickeable
    const rows = [
      ['🕒', 'Horario', i.horario, null],
      ['📍', 'Dónde', i.direccion, i.mapsUrl],
      ['📞', 'Teléfono', i.tel, i.tel ? 'tel:' + i.tel.replace(/\s+/g, '') : null],
      ['📸', 'Instagram', i.ig, i.igUrl],
      ['🎵', 'TikTok', i.tiktok, i.tiktokUrl],
    ].filter((r) => r[2]);
    $('#info-card').innerHTML = `<h2>Información</h2>` + rows.map((r) => {
      const val = r[3]
        ? `<a href="${esc(r[3])}" target="_blank" rel="noopener">${esc(r[2])}</a>`
        : esc(r[2]);
      return `<div class="info-row"><span class="ic">${r[0]}</span><span><b>${esc(r[1])}:</b> ${val}</span></div>`;
    }).join('');

    // El envío va como nota en la caja de "¿Cómo hago mi pedido?".
    const env = $('#howto-envio');
    if (env) env.innerHTML = i.envio ? `🛵 <b>Envío:</b> ${esc(i.envio)}` : '';
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
      <button class="seg seg-2 ${mode === 'recoger' ? 'active' : ''}" data-mode="recoger">🥡 Recoger<small>Paso por él al local</small></button>
      <button class="seg seg-2 ${mode === 'domicilio' ? 'active' : ''}" data-mode="domicilio">🛵 A domicilio<small>Me lo llevan a mi dirección</small></button>`;
    renderAddress();
    renderPayment();
  }

  // Tipo de pago: SOLO para envío a domicilio (al recoger, se paga en el local).
  // En efectivo, pide con cuánto paga para llevar cambio ("Otro" = cantidad a mano).
  function renderPayment() {
    const wrap = $('#pay-wrap');
    if (!wrap) return;
    if (mode !== 'domicilio') { wrap.innerHTML = ''; return; }

    const segs = ['efectivo', 'transferencia'].map((k) =>
      `<button class="seg ${payMode === k ? 'active' : ''}" data-pay="${k}">${PAY[k].ic} ${PAY[k].name}</button>`
    ).join('');

    let billBlock = '';
    if (payMode === 'efectivo') {
      const chips = BILLS.map((b) =>
        `<button class="opt ${payBill === b ? 'sel' : ''}" data-bill="${esc(b)}">${esc(b)}</button>`
      ).join('');
      const otherInput = payBill === 'Otro'
        ? `<input type="number" inputmode="numeric" id="pay-other" class="pay-other" placeholder="¿Con cuánto? ej. 700" value="${esc(payBillOther)}">`
        : '';
      billBlock = `<div class="field"><label>¿Con cuánto pagas? <small>(para llevarte cambio)</small></label><div class="opt-row">${chips}</div>${otherInput}</div>`;
    }

    // al elegir transferencia: avisamos que los datos van en el WhatsApp
    let transferNote = '';
    if (payMode === 'transferencia') {
      transferNote = `<div class="pedir-note">Al enviar tu pedido, en WhatsApp te aparecerán los datos para transferir. Haz tu pago y mándanos tu comprobante para empezar a preparar tu pedido.</div>`;
    }
    wrap.innerHTML = `<div class="field"><label>¿Cómo vas a pagar?</label><div class="service-mode pay-seg">${segs}</div></div>${billBlock}${transferNote}`;
    $$('[data-pay]', wrap).forEach((b) => b.onclick = () => {
      payMode = b.dataset.pay;
      if (payMode !== 'efectivo') { payBill = ''; payBillOther = ''; } // el cambio solo aplica a efectivo
      saveState();
      renderPayment();
    });
    $$('[data-bill]', wrap).forEach((b) => b.onclick = () => {
      payBill = b.dataset.bill;
      if (payBill !== 'Otro') payBillOther = '';
      saveState();
      renderPayment();
    });
    const oi = $('#pay-other', wrap);
    if (oi) oi.oninput = (e) => { payBillOther = e.target.value; saveState(); };
  }

  // La dirección solo se pide (y es obligatoria) cuando es A domicilio.
  // Además, el cliente puede adjuntar su ubicación GPS (opcional): agrega un link
  // de mapa al pedido para ubicarlo con precisión.
  function renderAddress() {
    const wrap = $('#address-wrap');
    if (!wrap) return;
    // Recoger: avisamos que le llegará un WhatsApp cuando esté listo.
    if (mode === 'recoger') {
      wrap.innerHTML = `<div class="pedir-note">🥡 Recoge en el local. Te avisaremos por WhatsApp cuando tu pedido esté listo para que pases por él.</div>`;
      return;
    }
    if (mode !== 'domicilio') { wrap.innerHTML = ''; return; }

    // El cliente elige cómo indicar dónde: escribir dirección o compartir ubicación.
    const picker = `
      <p class="hint" style="margin:0 0 8px">Elige <b>Escribir dirección</b> si prefieres teclearla, o <b>Compartir ubicación</b> para enviar tu ubicación exacta desde el celular (más preciso).</p>
      <div class="service-mode addr-picker">
        <button class="seg ${addrMode === 'texto' ? 'active' : ''}" data-addr="texto">✍️ Escribir dirección</button>
        <button class="seg ${addrMode === 'ubicacion' ? 'active' : ''}" data-addr="ubicacion">📍 Compartir ubicación</button>
      </div>`;

    const inputBlock = addrMode === 'ubicacion'
      ? (geoloc
          ? `<button type="button" class="btn-outline loc-on" id="btn-loc">✅ Ubicación compartida · toca para quitar</button>`
          : `<button type="button" class="btn-primary big" id="btn-loc">📍 Compartir mi ubicación</button>`)
      : `<input type="text" id="cust-address" placeholder="Calle y número, colonia" maxlength="160" value="${esc(address)}">
         <input type="text" id="cust-ref" class="mt8" placeholder="Referencias: entre calles, color de casa… (opcional)" maxlength="160" value="${esc(reference)}">`;

    wrap.innerHTML = `
      <div class="field">
        <label>¿Dónde te llevamos el pedido?</label>
        ${picker}
        ${inputBlock}
        <p class="hint">Recuerda que cuando envíes tu pedido, te confirmamos el costo del envío por WhatsApp según la distancia.</p>
      </div>`;

    $$('[data-addr]', wrap).forEach((b) => b.onclick = () => { addrMode = b.dataset.addr; saveState(); renderAddress(); });
    const inp = $('#cust-address');
    if (inp) inp.oninput = (e) => { address = e.target.value; saveState(); };
    const ref = $('#cust-ref');
    if (ref) ref.oninput = (e) => { reference = e.target.value; saveState(); };
    const btn = $('#btn-loc');
    if (btn) btn.onclick = toggleLocation;
  }

  function toggleLocation() {
    if (geoloc) { geoloc = null; saveState(); renderAddress(); return; } // quitar
    if (!navigator.geolocation) { toast('Tu teléfono no permite compartir ubicación; escribe tu dirección'); return; }
    toast('Obteniendo tu ubicación…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        geoloc = { lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) };
        saveState();
        renderAddress();
        toast('Ubicación adjunta ✅');
      },
      () => { toast('No se pudo obtener tu ubicación; escribe tu dirección 📍'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
              ${(l.dressings && l.dressings.length) ? `<div class="cart-detail">🧂 ${esc(l.dressings.join(', '))}</div>` : ''}
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
    let variant = null;                 // nada preseleccionado: el cliente elige
    const selections = {};              // (idem para las opciones obligatorias)
    const touched = {};                 // choices que el cliente ya tocó (para "Ninguno")
    // hamburguesas/hot dog: el Tipo (Con carne/Vegetariana) va ANTES que las papas
    const choicesFirst = !!(item.variants && (item.choices || []).some((ch) => ch.id === 'tipo'));
    const extras = new Set();
    // Aderezos, solo en el link del cliente. Por ID de platillo (ej. papas) o por
    // categoría (banderillas salada/dulce); el ID gana si existe.
    const ader = cfg.ADEREZOS ? (cfg.ADEREZOS[item.id] || cfg.ADEREZOS[item.cat]) : null;
    const dressings = new Set();
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
            ${!ch.required ? `<button class="opt ${(touched[ch.id] && !selections[ch.id]) ? 'sel' : ''}" data-choice="${ch.id}" data-opt="">Ninguno</button>` : ''}
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

      const aderezosHtml = ader ? `
        <div class="field">
          <label>Aderezos <small>(elige hasta ${ader.max}${dressings.size ? ` · ${dressings.size} elegido${dressings.size === 1 ? '' : 's'}` : ''})</small></label>
          <div class="opt-row">
            ${ader.list.map((a) =>
              `<button class="opt ${dressings.has(a) ? 'sel' : ''}" data-ader="${esc(a)}">${esc(a)}</button>`
            ).join('')}
          </div>
        </div>` : '';

      // ejemplo de la nota según el platillo (compartido con la comandera)
      const notePlaceholder = MenuLogic.notePlaceholder(item);
      const notesHtml = item.notes ? `
        <div class="field">
          <label>Nota <small>(modificaciones)</small></label>
          <input type="text" id="sheet-notes" placeholder="${notePlaceholder}" value="${esc(notes)}">
        </div>` : '';

      const unit = MenuLogic.calcUnitPrice(item, variant, selections, extras);
      // falta elegir: variante (si tiene) y las opciones obligatorias
      const complete = (!item.variants || variant) && (item.choices || []).every((ch) => !ch.required || selections[ch.id]);
      const opciones = choicesFirst ? `${choicesHtml}${variantHtml}` : `${variantHtml}${choicesHtml}`;
      const addBtn = complete
        ? `<button class="btn-primary big" id="sheet-add">Agregar &nbsp;·&nbsp; ${money(unit * qty)}</button>`
        : `<button class="btn-primary big" id="sheet-add" disabled>Elige las opciones para continuar</button>`;
      body.innerHTML = `
        <h2>${esc(item.name)}</h2>
        ${opciones}${extrasHtml}${aderezosHtml}${notesHtml}
        <div class="field qty-field">
          <label>Cantidad</label>
          <div class="stepper">
            <button data-qty="-1">−</button>
            <span id="sheet-qty">${qty}</span>
            <button data-qty="1">+</button>
          </div>
        </div>
        ${addBtn}`;

      $$('[data-variant]', body).forEach((b) => b.onclick = () => { variant = item.variants.find((v) => v.id === b.dataset.variant); draw(); });
      $$('[data-choice]', body).forEach((b) => b.onclick = () => {
        touched[b.dataset.choice] = true;
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
      $$('[data-ader]', body).forEach((b) => b.onclick = () => {
        const a = b.dataset.ader;
        if (dressings.has(a)) { dressings.delete(a); }
        else if (dressings.size >= ader.max) { toast(`Puedes elegir hasta ${ader.max} aderezos`); return; }
        else { dressings.add(a); }
        draw();
      });
      const notesInput = $('#sheet-notes', body);
      if (notesInput) notesInput.oninput = (e) => { notes = e.target.value; };
      $('#sheet-add', body).onclick = () => {
        if (!complete) return;
        const ni = $('#sheet-notes', body);
        const extraNames = (item.extras || []).filter((ex) => extras.has(ex.id)).map((ex) => ex.name);
        cart.push({
          uid: uid(), itemId: item.id, name: item.name, cat: item.cat,
          detail: MenuLogic.buildDetail(item, variant, selections),
          extras: extraNames,
          dressings: [...dressings],
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
    const modeLabel = mode === 'domicilio' ? '🛵 A DOMICILIO' : '🥡 RECOGER';
    let t = `🐶 *ZAMMU WAIFUU — Pedido en línea*\n`;
    t += `*👤 ${name}*  ·  *${modeLabel}*\n`;
    if (mode === 'domicilio') {
      if (addrMode === 'ubicacion' && geoloc) t += `🗺️ Ubicación: https://maps.google.com/?q=${geoloc.lat},${geoloc.lng}\n`;
      else if (address.trim()) {
        t += `📍 ${address.trim()}\n`;
        if (reference.trim()) t += `🔎 Ref: ${reference.trim()}\n`;
      }
    }
    if (mode === 'domicilio' && PAY[payMode]) {
      t += `${PAY[payMode].ic} Pago: ${PAY[payMode].name}`;
      if (payMode === 'efectivo') {
        if (payBill === 'Pago justo') t += ' — pago justo (sin cambio)';
        else { const bv = billValue(); if (bv) t += ` — paga con ${bv} (llevar cambio)`; }
      }
      t += `\n`;
      // datos de transferencia (para que el cliente pueda pagar antes)
      const tr = cfg.TRANSFER;
      if (payMode === 'transferencia' && tr && tr.clabe) {
        t += `➡️ *Transfiere a:*\n`;
        if (tr.banco) t += `   • Banco: ${tr.banco}\n`;
        t += `   • CLABE: ${tr.clabe}\n`;
        if (tr.titular) t += `   • Titular: ${tr.titular}\n`;
        t += `📸 Cuando transfieras, mándanos tu *comprobante aquí mismo* 💛 y empezamos a preparar tu pedido. ¡Gracias!\n`;
      }
    }
    t += `━━━━━━━━━━\n`;
    cart.forEach((l) => {
      t += `• ${l.qty}× ${l.name}${l.detail ? ` — ${l.detail}` : ''} — ${money(l.unitPrice * l.qty)}\n`;
      if (l.dressings && l.dressings.length) t += `   🧂 Aderezos: ${l.dressings.join(', ')}\n`;
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
    if (mode !== 'recoger' && mode !== 'domicilio') { toast('Elige: 🥡 Recoger o 🛵 A domicilio'); return; }
    if (mode === 'domicilio') {
      if (addrMode === 'ubicacion' && !geoloc) { toast('Toca "Compartir mi ubicación" 📍'); return; }
      if (addrMode === 'texto' && !address.trim()) {
        toast('Escribe tu dirección para el envío 📍');
        const a = $('#cust-address'); if (a) a.focus();
        return;
      }
      if (!PAY[payMode]) { toast('Elige cómo vas a pagar 💳'); return; }
      if (payMode === 'efectivo' && !billValue()) {
        toast('Indica con cuánto pagas (para el cambio) 💵');
        const oi = $('#pay-other'); if (oi) oi.focus();
        return;
      }
    }

    // Candado antierrores: confirmar la elección antes de abrir WhatsApp.
    showConfirm();
  }

  // Pantalla de confirmación: repite la elección en grande para que el cliente
  // no envíe con la opción equivocada por accidente.
  function showConfirm() {
    const total = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
    let entrega;
    if (mode === 'domicilio') {
      let donde;
      if (addrMode === 'ubicacion') {
        donde = `🗺️ ${geoloc ? 'Ubicación compartida ✅' : ''}`;
      } else {
        donde = `📍 ${esc(address.trim())}`;
        if (reference.trim()) donde += `<br>🔎 ${esc(reference.trim())}`;
      }
      entrega = `<div class="confirm-mode dom">🛵 ENVÍO A DOMICILIO</div><div class="confirm-sub">${donde}</div>`;
    } else {
      const local = (cfg.INFO && cfg.INFO.direccion) ? esc(cfg.INFO.direccion) : '';
      entrega = `<div class="confirm-mode rec">🥡 RECOGER EN EL LOCAL</div>${local ? `<div class="confirm-sub">📍 ${local}</div>` : ''}`;
    }
    // pago (solo domicilio) y cambio si aplica
    let pago = '';
    if (mode === 'domicilio' && PAY[payMode]) {
      let pagoTxt = PAY[payMode].name;
      if (payMode === 'efectivo') {
        if (payBill === 'Pago justo') pagoTxt += ' · pago justo';
        else { const bv = billValue(); if (bv) pagoTxt += ` · paga con ${bv}`; }
      }
      pago = `<div class="confirm-sub">${PAY[payMode].ic} Pago: ${esc(pagoTxt)}</div>`;
      if (payMode === 'transferencia') {
        pago += `<div class="confirm-sub" style="font-size:12.5px;color:var(--muted)">Al enviar tu pedido, en WhatsApp te aparecerán los datos para transferir. Haz tu pago y mándanos tu comprobante para empezar a preparar tu pedido.</div>`;
      }
    }

    const lines = cart.map((l) => {
      const ader = (l.dressings && l.dressings.length) ? ` · 🧂 ${esc(l.dressings.join(', '))}` : '';
      return `<div class="confirm-line"><span>${l.qty}× ${esc(l.name)}${l.detail ? ` — ${esc(l.detail)}` : ''}${ader}</span><b>${money(l.unitPrice * l.qty)}</b></div>`;
    }).join('');

    const body = document.createElement('div');
    body.innerHTML = `
      <h2>Confirma tu pedido</h2>
      <div class="confirm-box">
        <div class="confirm-name">👤 ${esc(name.trim())}</div>
        ${entrega}
        ${pago}
        <div class="confirm-lines">${lines}</div>
        <div class="confirm-total"><span>Total</span><b>${money(total)}</b></div>
      </div>
      <p class="hint" style="margin:6px 0 18px">Revisa que tu pedido esté correcto. Al enviar, se abrirá WhatsApp con tu pedido listo.</p>
      <button class="btn-primary big" id="confirm-send">✅ Sí, enviar por WhatsApp</button>
      <button class="btn-ghost" id="confirm-edit">✏️ Cambiar</button>`;
    $('#confirm-send', body).onclick = doSend;
    $('#confirm-edit', body).onclick = closeModal;
    showModal(body);
  }

  // Arma el pedido estructurado para enviarlo a la comandera (por el Apps Script).
  // Es lo que la comandera muestra en su bandeja "En línea" y convierte en pedido.
  function buildOrderPayload() {
    return {
      id: uid(),
      ts: Date.now(),
      source: 'online',
      customerName: name.trim(),
      serviceMode: mode,                 // 'recoger' | 'domicilio'
      addrMode: mode === 'domicilio' ? addrMode : null,
      address: mode === 'domicilio' && addrMode === 'texto' ? address.trim() : '',
      reference: mode === 'domicilio' && addrMode === 'texto' ? reference.trim() : '',
      geoloc: mode === 'domicilio' && addrMode === 'ubicacion' ? geoloc : null,
      payMode: mode === 'domicilio' ? payMode : null,
      payBill: mode === 'domicilio' && payMode === 'efectivo' ? billValue() : '',
      lines: cart.map((l) => ({
        itemId: l.itemId, name: l.name, cat: l.cat, detail: l.detail,
        extras: l.extras || [], dressings: l.dressings || [],
        unitPrice: l.unitPrice, qty: l.qty, notes: l.notes || '',
      })),
      total: cart.reduce((s, l) => s + l.unitPrice * l.qty, 0),
    };
  }

  // Envía el pedido a la comandera vía el Apps Script (no-cors, a ciegas). WhatsApp
  // sigue siendo el respaldo: si esto falla, el pedido igual llega por el chat.
  function sendOrderToComandera(order) {
    const url = feedUrl();
    if (!url) return; // sin backend: solo WhatsApp
    try {
      fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true, body: JSON.stringify({ type: 'order', order }) }).catch(() => {});
    } catch (e) { /* el WhatsApp cubre el pedido */ }
  }

  function doSend() {
    const text = buildOrderText();
    // 1) manda el pedido a la comandera (antes de navegar a WhatsApp)
    sendOrderToComandera(buildOrderPayload());

    const num = (cfg.WHATSAPP_NUMBER || '').replace(/\D/g, '');
    const base = num ? `https://wa.me/${num}` : 'https://wa.me/';
    const urlWa = `${base}?text=${encodeURIComponent(text)}`;

    closeModal();

    // Respaldo raro: sin número configurado y con Web Share disponible, usa share.
    if (!num && navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      window.location.href = urlWa;
    }

    // Vacía el pedido para el siguiente; el nombre se conserva por comodidad.
    cart = [];
    mode = null;
    address = '';
    reference = '';
    geoloc = null;
    addrMode = 'texto';
    payMode = null;
    payBill = '';
    payBillOther = '';
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
