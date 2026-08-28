# Autoservicio de pedidos por link (WhatsApp Business)

> Spec del usuario — Spec-Driven Development
> Fecha: 2026-08-27 · Estado: 🟢 Aprobado

## Overview
El cliente que escribe al WhatsApp de Zammu Waifuu (55 6973 8176) recibe **al
instante** una respuesta automática con un **link a un menú guiado**. Ahí el
cliente arma su propio pedido tocando platillos (base, cobertura, tipo de ramen,
extras, cantidades), igual que la comandera. Al confirmar, el pedido regresa **ya
formateado y sin ambigüedad**, listo para mandarse a cocina sin que el
administrador lo tenga que ratificar ni recapturar. No usa la API de paga de
WhatsApp: aprovecha el **mensaje de bienvenida** gratuito de WhatsApp Business
como disparador.

## Usuario(s) objetivo
- **Cliente** (quien escribe al WhatsApp): arma su pedido solo desde el celular,
  sin instalar nada, tocando un link. Puede ser alguien que nunca ha visto el
  menú completo.
- **Administrador** (quien hoy contesta el WhatsApp): deja de teclear y ratificar;
  recibe pedidos exactos y listos para enviar a cocina.

## Contexto del problema
Hoy el administrador contesta a mano el WhatsApp, que recibe tanto **dudas de
información** como **pedidos**. Falla en tres puntos:
1. **Horas pico:** no se responde a tiempo y se pierden pedidos.
2. **Ratificación:** la carta es amplia y el cliente pide en general ("una
   banderilla"), así que se va mucho tiempo preguntándole exactamente qué quiere
   (base, cobertura, tipo de ramen, picante, etc.).
3. **Re-captura:** el pedido acordado por chat hay que teclearlo otra vez en la
   comandera para poder mandarlo a cocina.

La cuenta es **WhatsApp Business App gratuita** (no API), que no permite un
chatbot conversacional oficial, pero **sí** permite un mensaje de bienvenida/
ausencia automático donde cabe un link.

## Alcance v1

**SÍ entra:**
- Una **página web de menú para el cliente** (autoservicio), basada en el mismo
  menú de la comandera (banderillas saladas/dulces, coreano con tipo de ramen y
  picante, fast food, baos, bebidas), con sus precios, variantes, coberturas,
  choices y extras.
- El cliente **arma el pedido tocando** platillos, elige variantes/coberturas/
  extras, ajusta cantidades y agrega **notas/modificaciones** por línea.
- Al confirmar, el cliente ve un **resumen con total** y un botón que **manda el
  pedido formateado de vuelta por WhatsApp** al número del negocio (o a quien
  reciba), en el mismo formato limpio que ya usa la comandera.
- El cliente captura su **nombre** y elige **Recoger** o **A domicilio** (el cliente
  por WhatsApp no está en el local, así que **no** hay "Comer aquí"). Si elige **A
  domicilio**, escribe su **dirección** (obligatoria), que viaja dentro del pedido; el
  negocio confirma el costo del envío por WhatsApp según la distancia.
- Una **sección de información** dentro del link: horario, ubicación, teléfono,
  IG y aviso de si hay o no envío (texto fijo, editable por el admin).
- Un **texto de mensaje de bienvenida** listo para pegar en WhatsApp Business,
  con el saludo + el link, para que el admin lo configure una sola vez.

**NO entra (fuera de alcance v1):**
- **No** es un bot que conversa por chat ni contesta en lenguaje libre.
- **No** usa WhatsApp Business API de paga ni migra el número.
- **No** cobra ni procesa pagos.
- **No** gestiona envíos/logística de reparto (solo informa si hay o no).
- **No** conecta automáticamente el pedido del cliente al cierre del día de la
  comandera (el pedido llega por WhatsApp; el admin decide cómo registrarlo).
- **No** requiere que el cliente instale ni cree cuenta.

## Comportamiento esperado
- **Cliente escribe al WhatsApp** → recibe de inmediato el mensaje de bienvenida
  automático con el saludo y el **link** al menú.
- **Cliente abre el link** → ve el menú por categorías, con precios. Puede leer la
  sección de **información** (horario, ubicación, envío) sin armar pedido.
- **Cliente toca un platillo** → elige lo que aplique (base y cobertura de la
  banderilla, tipo de ramen y picante, extras de hamburguesa, sabor de bao,
  etc.), pone cantidad y, si quiere, una **nota**. El platillo se agrega a su
  pedido con el **precio correcto** (incluida la regla de cobertura especial
  Boneless/Pizza = $70 fijo).
- **Cliente revisa su pedido** → ve las líneas, el **total**, captura su
  **nombre** y elige **Comer aquí / Para llevar**.
- **Cliente confirma** → se abre WhatsApp con el **pedido ya escrito y formateado**
  (limpio, estructurado, agrupado como en la comandera) dirigido al negocio; el
  cliente solo lo envía.
- **Administrador** recibe ese mensaje exacto → ya no ratifica ni recaptura; lo
  pasa a cocina con la comandera (o como decida).

## Posibles errores y mitigaciones
- **Cliente confirma sin nombre o sin elegir Comer aquí/Para llevar** → no se
  permite enviar; se le pide completar (mismo criterio obligatorio que la
  comandera).
- **Cliente arma pedido vacío** → el botón de confirmar está deshabilitado hasta
  que haya al menos una línea.
- **Precio de un platillo cambió en la comandera** → el menú del link debe
  reflejar los precios vigentes; se define en el plan cómo se mantienen
  sincronizados (los precios "de fábrica" viven en el código; los cambios del
  admin viven en su celular).
- **Cliente sin WhatsApp o el share falla** → como respaldo, poder **copiar** el
  pedido formateado al portapapeles para pegarlo manualmente (mismo respaldo que
  ya usa la comandera).
- **Producto agotado** → si el admin marcó un platillo como agotado, no debe
  poder pedirse desde el link.
- **Cliente pide algo que no está en el menú** → el menú es cerrado (se toca, no
  se escribe), así que solo puede pedir lo que existe; dudas fuera de eso las
  cubre la sección de información o el admin por chat.

## Futuro (v2)
- Migrar a **WhatsApp Business API** para un bot 100% conversacional (sin link),
  si el volumen lo justifica.
- Que el pedido del cliente **entre directo** al cierre del día de la comandera
  (sin recaptura del admin).
- **Confirmación de tiempo de espera** o estado del pedido de vuelta al cliente.
- **Envío a domicilio** con dirección y costo dentro del flujo.
- Sugerencias/combos ("¿quieres papas con eso?") para subir el ticket.
