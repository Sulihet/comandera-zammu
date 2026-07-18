/* Capa de persistencia: todo vive en localStorage del propio celular. */
const Store = (() => {
  const K = {
    menu: 'zw_menu', orders: 'zw_orders', config: 'zw_config',
    closes: 'zw_closes', cart: 'zw_cart',
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
    // Tipo de sopa (Habanero Limón / Queso / Carbonara) antes del picante, en ramen y dumpling&ramen
    const ensureSopa = (id) => {
      const it = m.items.find((x) => x.id === id);
      if (!it) return;
      it.choices = it.choices || [];
      if (!it.choices.some((ch) => ch.id === 'sopa')) {
        it.choices.unshift({ id: 'sopa', name: 'Tipo de sopa', required: true, options: [
          { id: 'habanerolimon', name: 'Habanero Limón' }, { id: 'queso', name: 'Queso' }, { id: 'carbonara', name: 'Carbonara' },
        ] });
        changed = true;
      }
    };
    ensureSopa('ramen');
    ensureSopa('dumpling_ramen');

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

  return {
    todayStr, clone,
    getMenu, saveMenu, resetMenu,
    getConfig, saveConfig,
    getOrders, saveOrders,
    getCloses, saveCloses,
    getCart, saveCart,
  };
})();
