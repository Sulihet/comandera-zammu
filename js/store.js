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

  // --- Menú ---
  function getMenu() {
    let m = load(K.menu, null);
    if (!m) { m = clone(DEFAULT_MENU); save(K.menu, m); }
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
