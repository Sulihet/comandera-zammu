/*
 * Configuración del LINK DEL CLIENTE (pedir.html). Todo lo editable en un solo
 * lugar para no tocar la lógica. El admin (o Claude) llena estos valores.
 */
const PEDIR_CONFIG = {
  // Número de WhatsApp del negocio, en formato internacional SIN "+" (México = 52).
  // 55 6973 8176  ->  52 55 6973 8176
  WHATSAPP_NUMBER: '525569738176',

  // URL del Apps Script (/exec) del administrador que sirve el menú en vivo.
  // Dejar VACÍO hasta que el admin lo tenga: mientras, el link usa el menú de
  // respaldo empacado (js/menu-data.js). También se puede activar sin tocar
  // código agregando ?feed=<url> o #feed=<url> al final del link del cliente.
  MENU_FEED_URL: '',

  // Información que ve el cliente en el link (texto libre, editable).
  INFO: {
    horario: 'Viernes y sábados · 7:00 pm a 11:00 pm',
    direccion: 'Ferrocarril de Cuernavaca 1',
    tel: '55 6973 8176',
    ig: '@zammuwaifuu',
    // Recoger o envío a domicilio (el cliente decide). Tarifa por distancia.
    envio: 'Recoge tu pedido o pídelo a domicilio: distancia corta $20 · media $30 · larga $40. Mándanos tu dirección al enviar el pedido y te confirmamos el costo.',
  },
};
