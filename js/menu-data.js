/*
 * Menú por defecto de Zammu Waifuu.
 * Modelo de un platillo:
 *   { id, cat, name, available,
 *     price?        -> precio simple fijo
 *     variants?[]   -> {id, name, price}  (elegir una; define el precio base)
 *     choices?[]    -> {id, name, required, options:[{id,name,priceDelta?,overridePrice?}]}
 *         priceDelta   suma al precio base
 *         overridePrice reemplaza el precio total (ej. cobertura Boneless/Pizza = $70 fijo)
 *     notes?        -> true si permite nota libre (modificaciones "sin cebolla", etc.)
 *   }
 */
const DEFAULT_MENU = {
  categories: [
    { id: 'salada',   name: 'Banderillas Saladas', icon: '🍢' },
    { id: 'dulce',    name: 'Banderillas Dulces',  icon: '🍡' },
    { id: 'coreano',  name: 'Coreano',             icon: '🍜' },
    { id: 'fastfood', name: 'Fast Food',           icon: '🍔' },
    { id: 'baos',     name: 'Pan al Vapor',        icon: '🥟' },
    { id: 'bebidas',  name: 'Bebidas',             icon: '🥤' },
  ],
  items: [
    // ---- Banderillas Saladas: base + cobertura ----
    {
      id: 'ban_salada', cat: 'salada', name: 'Banderilla', available: true, notes: true,
      variants: [
        { id: 'salchicha', name: 'Salchicha', price: 55 },
        { id: 'combinada', name: 'Combinada', price: 55 },
        { id: 'queso',     name: 'Queso',     price: 60 },
      ],
      choices: [
        {
          id: 'cob', name: 'Cobertura', required: true,
          options: [
            { id: 'papas',    name: 'Papas' },
            { id: 'sencilla', name: 'Sencilla' },
            { id: 'ruffles',  name: 'Ruffles' },
            { id: 'cheddar',  name: 'Cheddar' },
            { id: 'flamin',   name: "Flamin' Hot" },
            { id: 'ramen',    name: 'Ramen' },
            { id: 'boneless', name: 'Boneless (especial)', overridePrice: 70 },
            { id: 'pizza',    name: 'Pizza (especial)',    overridePrice: 70 },
          ],
        },
      ],
    },

    // ---- Banderillas Dulces ----
    {
      id: 'ban_dulce', cat: 'dulce', name: 'Banderilla Dulce', available: true, notes: true, price: 60,
      choices: [
        {
          id: 'tipo', name: 'Tipo', required: true,
          options: [
            { id: 'milkyway', name: 'Milky Way' },
            { id: 'kinder',   name: 'Kinder Delice' },
            { id: 'choco',    name: 'Choco Roles' },
          ],
        },
      ],
    },

    // ---- Coreano ----
    {
      id: 'ramen', cat: 'coreano', name: 'Ramen Zammu Waifuu', available: true, notes: true, price: 105,
      choices: [
        { id: 'sopa', name: 'Tipo de sopa', required: true, options: [
          { id: 'habanerolimon', name: 'Habanero Limón' }, { id: 'queso', name: 'Queso' }, { id: 'carbonara', name: 'Carbonara' },
        ] },
        { id: 'picante', name: 'Picante', required: false, options: [
          { id: 'poco', name: 'Poco picante' }, { id: 'dos', name: 'Dos picante' },
          { id: 'muy', name: 'Muy picante' }, { id: 'extremo', name: 'Extremo picante' },
        ] },
      ],
    },
    {
      id: 'dumpling_ramen', cat: 'coreano', name: 'Dumpling & Ramen', available: true, notes: true, price: 100,
      choices: [
        { id: 'sopa', name: 'Tipo de sopa', required: true, options: [
          { id: 'habanerolimon', name: 'Habanero Limón' }, { id: 'queso', name: 'Queso' }, { id: 'carbonara', name: 'Carbonara' },
        ] },
        { id: 'picante', name: 'Picante', required: false, options: [
          { id: 'poco', name: 'Poco picante' }, { id: 'dos', name: 'Dos picante' },
          { id: 'muy', name: 'Muy picante' }, { id: 'extremo', name: 'Extremo picante' },
        ] },
      ],
    },
    {
      id: 'dumplings', cat: 'coreano', name: 'Dumplings (5 pzas)', available: true, notes: true, price: 70,
      choices: [{ id: 'picante', name: 'Picante', required: false, options: [
        { id: 'poco', name: 'Poco picante' }, { id: 'dos', name: 'Dos picante' },
        { id: 'muy', name: 'Muy picante' }, { id: 'extremo', name: 'Extremo picante' },
      ] }],
    },

    // ---- Fast Food ----
    {
      id: 'ham_hawaiana', cat: 'fastfood', name: 'Hamburguesa Hawaiana', available: true, notes: true,
      variants: [
        { id: 'sinpapas', name: 'Sin papas', price: 85 },
        { id: 'conpapas', name: 'Con papas', price: 95 },
      ],
      extras: [
        { id: 'carne',   name: 'Carne extra',    priceDelta: 15 },
        { id: 'tocino',  name: 'Tocino',         priceDelta: 10 },
        { id: 'quesoam', name: 'Queso amarillo', priceDelta: 5 },
      ],
    },
    {
      id: 'ham_sencilla', cat: 'fastfood', name: 'Hamburguesa Sencilla', available: true, notes: true,
      variants: [
        { id: 'sinpapas', name: 'Sin papas', price: 75 },
        { id: 'conpapas', name: 'Con papas', price: 85 },
      ],
      extras: [
        { id: 'carne',   name: 'Carne extra',    priceDelta: 15 },
        { id: 'tocino',  name: 'Tocino',         priceDelta: 10 },
        { id: 'quesoam', name: 'Queso amarillo', priceDelta: 5 },
      ],
    },
    { id: 'hotdog', cat: 'fastfood', name: 'Hot Dog (incluye papas)', available: true, notes: true, price: 75 },

    // ---- Pan al Vapor (Baos) ----
    {
      id: 'bao_sencillo', cat: 'baos', name: 'Bao Sencillo', available: true, price: 30,
      choices: [{ id: 'sabor', name: 'Sabor', required: true, options: [
        { id: 'caramelo', name: 'Caramelo' }, { id: 'chocolate', name: 'Chocolate semiamargo' }, { id: 'nutella', name: 'Nutella' },
      ] }],
    },
    {
      id: 'bao_gourmet', cat: 'baos', name: 'Bao Gourmet', available: true, price: 35,
      choices: [{ id: 'sabor', name: 'Sabor', required: true, options: [
        { id: 'pistacho', name: 'Crema de pistacho' }, { id: 'cheesecake', name: 'Cheese cake' }, { id: 'frutosrojos', name: 'Crema de frutos rojos' },
      ] }],
    },
    { id: 'bao_paq4', cat: 'baos', name: 'Paquete 4 Baos', available: true, price: 105, notes: true },
    { id: 'bao_paq6', cat: 'baos', name: 'Paquete 6 Baos', available: true, price: 165, notes: true },

    // ---- Bebidas ----
    {
      id: 'refresco', cat: 'bebidas', name: 'Refresco', available: true, price: 20,
      choices: [{ id: 'tipo', name: 'Tipo', required: false, options: [
        { id: 'coca', name: 'Coca Cola' }, { id: 'pepsi', name: 'Pepsi' }, { id: 'manzana', name: 'Manzana' },
        { id: '7up', name: '7up' }, { id: 'squirt', name: 'Squirt' }, { id: 'mirinda', name: 'Mirinda' },
      ] }],
    },
    {
      id: 'arizona', cat: 'bebidas', name: 'Té Arizona', available: true, price: 20,
      choices: [{ id: 'sabor', name: 'Sabor', required: false, options: [
        { id: 'verde', name: 'Té verde' }, { id: 'kiwifresa', name: 'Kiwi Fresa' }, { id: 'sandia', name: 'Sandía' }, { id: 'mango', name: 'Mango' },
      ] }],
    },
    {
      id: 'bebida_coreana', cat: 'bebidas', name: 'Bebida Coreana', available: true, price: 55,
      choices: [{ id: 'sabor', name: 'Sabor', required: false, options: [
        { id: 'limonada', name: 'Limonada azul' }, { id: 'fresa', name: 'Fresa' }, { id: 'moras', name: 'Moras' }, { id: 'naranja', name: 'Naranja' },
      ] }],
    },
  ],
};
