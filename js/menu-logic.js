/*
 * Lógica pura del menú, compartida por la comandera (app.js) y el link del
 * cliente (pedir.js). Una sola fuente de verdad para el precio, de modo que la
 * app y el autoservicio NUNCA calculen distinto.
 * Sin DOM, sin Store: solo funciones puras sobre el modelo de menu-data.js.
 */
const MenuLogic = (() => {
  // Precio de una línea: base (variante o item.price) + priceDelta de los
  // choices; overridePrice reemplaza el total (ej. cobertura Boneless/Pizza = $70);
  // los extras (multi-selección) suman aparte.
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

  // Texto del detalle de la línea: "Variante · Opción1 · Opción2".
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

  // Ejemplo (placeholder) de la nota según el platillo. Compartido por la comandera
  // y el link para que el ejemplo sea el mismo en los dos. Recibe el item completo
  // para poder distinguir las papas dentro de Fast Food (sin confundir el hot dog).
  function notePlaceholder(item) {
    const cat = item && item.cat;
    const name = (item && item.name) || '';
    if (cat === 'salada' || cat === 'dulce') return 'ej. alguna nota o petición especial';
    if (cat === 'fastfood') {
      const esPapas = (item && item.id === 'papas_francesa') || (/papas/i.test(name) && !/hot\s*dog/i.test(name));
      if (esPapas) return 'ej. bien doradas, sin sal, con cátsup';
      return 'ej. sin cebolla, sin picante';
    }
    if (cat === 'coreano') return 'ej. sin cebollín, sin ajonjolí';
    return 'ej. alguna nota o petición especial';
  }

  return { calcUnitPrice, buildDetail, notePlaceholder };
})();
