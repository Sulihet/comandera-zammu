/* Capa de persistencia: todo vive en localStorage del propio celular. */
const Store = (() => {
  const K = {
    menu: 'zw_menu', orders: 'zw_orders', config: 'zw_config',
    closes: 'zw_closes', cart: 'zw_cart', onlineDone: 'zw_online_done',
  };

  function load(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Migraciones para menús ya guardados en el celular (cambios estructurales
  // del código que deben aparecer sin borrar los precios/ediciones del usuario).
  function migrateMenu(m) {
    if (!m || !Array.isArray(m.items)) return false;
    let changed = false;
    // Tipo de ramen (Habanero Limón / Queso / Carbonara) antes del picante, en ramen y dumpling&ramen
    const ensureSopa = (id) => {
      const it = m.items.find((x) => x.id === id);
      if (!it) return;
      it.choices = it.choices || [];
      const sopa = it.choices.find((ch) => ch.id === 'sopa');
      if (!sopa) {
        it.choices.unshift({ id: 'sopa', name: 'Tipo de ramen', required: true, options: [
          { id: 'habanerolimon', name: 'Habanero Limón' }, { id: 'queso', name: 'Queso' }, { id: 'carbonara', name: 'Carbonara' },
        ] });
        changed = true;
      } else if (sopa.name === 'Tipo de sopa') {
        sopa.name = 'Tipo de ramen'; // renombra en menús ya migrados
        changed = true;
      }
    };
    ensureSopa('ramen');
    ensureSopa('dumpling_ramen');

    // Tipo (Con carne / Vegetariana) en hamburguesas y hot dog.
    const ensureTipo = (id) => {
      const it = m.items.find((x) => x.id === id);
      if (!it) return;
      it.choices = it.choices || [];
      if (!it.choices.some((ch) => ch.id === 'tipo')) {
        it.choices.unshift({ id: 'tipo', name: 'Tipo', required: true, options: [
          { id: 'carne', name: 'Con carne' }, { id: 'vegetariana', name: 'Vegetariana' },
        ] });
        changed = true;
      }
    };
    ensureTipo('ham_hawaiana');
    ensureTipo('ham_sencilla');
    ensureTipo('hotdog');

    // Papas a la francesa (Orden completa $65 / Media orden $35) en Fast Food
    if (!m.items.some((x) => x.id === 'papas_francesa')) {
      const idx = m.items.map((x) => x.cat).lastIndexOf('fastfood');
      const papas = {
        id: 'papas_francesa', cat: 'fastfood', name: 'Papas a la francesa', available: true, notes: true,
        variants: [
          { id: 'completa', name: 'Orden completa', price: 65 },
          { id: 'media', name: 'Media orden', price: 35 },
        ],
      };
      if (idx >= 0) m.items.splice(idx + 1, 0, papas); else m.items.push(papas);
      changed = true;
    }

    // Bubble Tea (barista): categoría nueva + 5 platillos (tamaño + sabor).
    m.categories = m.categories || [];
    if (!m.categories.some((c) => c.id === 'bubbletea')) {
      const bebIdx = m.categories.findIndex((c) => c.id === 'bebidas');
      const cat = { id: 'bubbletea', name: 'Bubble Tea', icon: '🧋' };
      if (bebIdx >= 0) m.categories.splice(bebIdx, 0, cat); else m.categories.push(cat);
      changed = true;
    }
    const bubbleTeaItems = [
      { id: 'bt_milktea', cat: 'bubbletea', name: 'Milk Tea', available: true, notes: true,
        variants: [{ id: 'chico', name: 'Chico 430 ml', price: 65 }, { id: 'grande', name: 'Grande 560 ml', price: 75 }],
        choices: [{ id: 'sabor', name: 'Sabor', required: true, options: [
          { id: 'blacksugar', name: 'Black Sugar' }, { id: 'mazapan', name: 'Mazapán' }, { id: 'taro', name: 'Taro' },
          { id: 'bluecoco', name: 'Blue Coco' }, { id: 'bluemango', name: 'Blue Mango' }, { id: 'bluefresa', name: 'Blue Fresa' },
        ] }] },
      { id: 'bt_matcha', cat: 'bubbletea', name: 'Matcha', available: true, notes: true,
        variants: [{ id: 'chico', name: 'Chico 430 ml', price: 75 }, { id: 'grande', name: 'Grande 560 ml', price: 85 }],
        choices: [{ id: 'sabor', name: 'Sabor', required: true, options: [
          { id: 'ube', name: 'Ube' }, { id: 'mango', name: 'Mango' }, { id: 'fresa', name: 'Fresa' },
        ] }] },
      { id: 'bt_yakult', cat: 'bubbletea', name: 'Yakult Tea', available: true, notes: true,
        variants: [{ id: 'chico', name: 'Chico 430 ml', price: 75 }, { id: 'grande', name: 'Grande 560 ml', price: 85 }],
        choices: [{ id: 'sabor', name: 'Sabor', required: true, options: [
          { id: 'mango', name: 'Mango' }, { id: 'fresa', name: 'Fresa' }, { id: 'maracuya', name: 'Maracuyá' },
        ] }] },
      { id: 'bt_soda', cat: 'bubbletea', name: 'Soda / Blue Soda', available: true, notes: true,
        variants: [{ id: 'chico', name: 'Chico 430 ml', price: 55 }, { id: 'grande', name: 'Grande 560 ml', price: 65 }],
        choices: [{ id: 'sabor', name: 'Sabor', required: true, options: [
          { id: 'galaxy', name: 'Galaxy Soda' }, { id: 'fresablue', name: 'Fresa Blue Soda' }, { id: 'mangoblue', name: 'Mango Blue Soda' },
        ] }] },
      { id: 'bt_fruit', cat: 'bubbletea', name: 'Fruit Tea', available: true, notes: true,
        variants: [{ id: 'chico', name: 'Chico 430 ml', price: 65 }, { id: 'grande', name: 'Grande 560 ml', price: 75 }],
        choices: [{ id: 'sabor', name: 'Sabor', required: true, options: [
          { id: 'maracuya', name: 'Maracuyá' }, { id: 'jamaica', name: 'Jamaica' }, { id: 'mango', name: 'Mango' }, { id: 'durazno', name: 'Durazno' },
        ] }] },
    ];
    // Inserta los que falten, justo antes de la primera línea de bebidas (o al final).
    let insAt = m.items.findIndex((x) => x.cat === 'bebidas');
    if (insAt < 0) insAt = m.items.length;
    bubbleTeaItems.forEach((bt) => {
      if (!m.items.some((x) => x.id === bt.id)) {
        m.items.splice(insAt, 0, bt);
        insAt++;
        changed = true;
      }
    });

    return changed;
  }

  // --- Menú ---
  function getMenu() {
    let m = load(K.menu, null);
    if (!m) { m = clone(DEFAULT_MENU); save(K.menu, m); return m; }
    if (migrateMenu(m)) save(K.menu, m); // aplica cambios estructurales nuevos
    return m;
  }
  function saveMenu(m) { save(K.menu, m); }
  function resetMenu() { const m = clone(DEFAULT_MENU); save(K.menu, m); return m; }

  // --- Config ---
  function getConfig() {
    return load(K.config, { kitchenNumber: '', lastOrderNum: 0, dayStartedAt: todayStr() });
  }
  function saveConfig(c) { save(K.config, c); }

  // --- Pedidos del día ---
  function getOrders() { return load(K.orders, []); }
  function saveOrders(o) { save(K.orders, o); }

  // --- Cierres archivados ---
  function getCloses() { return load(K.closes, []); }
  function saveCloses(c) { save(K.closes, c); }

  // --- Carrito en curso ---
  function getCart() { return load(K.cart, []); }
  function saveCart(c) { save(K.cart, c); }

  // --- Pedidos en línea ya procesados (aceptados/rechazados) ---
  // Guarda solo los ids, para no re-mostrar un pedido aunque el backend tarde
  // en marcarlo. Se recorta para no crecer sin límite.
  function getOnlineDone() { return load(K.onlineDone, []); }
  function markOnlineDone(id) {
    const arr = getOnlineDone();
    if (!arr.includes(id)) { arr.push(id); save(K.onlineDone, arr.slice(-300)); }
  }

  return {
    todayStr, clone,
    getMenu, saveMenu, resetMenu,
    getConfig, saveConfig,
    getOrders, saveOrders,
    getCloses, saveCloses,
    getCart, saveCart,
    getOnlineDone, markOnlineDone,
  };
})();
