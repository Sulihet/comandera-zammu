# Nombre del cliente en el pedido (obligatorio)

> Spec del usuario — Spec-Driven Development
> Fecha: 2026-07-17 · Estado: 🟢 Aprobado

## Overview
Agregar a la comanda un campo **Nombre del cliente**, **obligatorio**, ubicado
junto al selector 🍽️ Comer aquí / 🥡 Para llevar. Sin nombre no se puede enviar a
cocina ni guardar el pedido. El nombre viaja con el pedido y se ve donde importa
para identificar y entregar: en la lista de *Pedidos de hoy*, en el mensaje de
WhatsApp a cocina, en el detalle del pedido y en el resumen del día.

## Usuario(s) objetivo
El **mesero** (quien toma la orden), al armar y enviar el pedido; y de rebote
**cocina** (recibe el nombre en el WhatsApp) y el **administrador** (lo ve en el
resumen del día).

## Contexto del problema
Hoy los pedidos se identifican solo por número y hora. Al momento de entregar, el
mesero no tiene forma rápida de saber de quién es cada pedido, lo que provoca
confusión y preguntas ("¿de quién era este hot dog?"). No existe hoy ningún dato
del cliente en la comanda.

## Alcance v1
**Entra:**
- Un **campo de texto "Nombre del cliente"** en la pantalla de armado del pedido,
  junto al toggle Comer aquí / Para llevar.
- **Obligatorio:** al tocar Enviar/Guardar con el campo vacío (o solo espacios),
  el pedido **no se envía ni se guarda**; se avisa al mesero y se enfoca el campo.
- Aplica **tanto** a pedidos que van a cocina **como** a los que solo se guardan
  (bebidas/banderillas).
- El nombre **se guarda con el pedido** y aparece en:
  - la tarjeta de **Pedidos de hoy** (Cierre), en el encabezado, junto a #/hora/estado;
  - el **encabezado del mensaje de WhatsApp** a cocina (ej. `Pedido #12 — 👤 Ana`);
  - el **detalle expandido** del pedido;
  - el **resumen del día** que se comparte con el administrador (día actual e Historial).
- Al **editar/corregir** un pedido, el nombre se recarga y puede modificarse.

**Fuera (queda para después):**
- Sugerencias/autocompletar con nombres usados en el día.
- Teléfono u otros datos del cliente; búsqueda por nombre.
- Hacer obligatorio nada más que el nombre (no se pide mesa ni contacto).

## Comportamiento esperado
- Al armar un pedido, el mesero ve el campo **"Nombre del cliente"** junto al
  selector de modo, con la lista de platillos y el botón de enviar.
- Si intenta **enviar/guardar sin nombre**, la app **lo impide**, muestra un aviso
  ("Escribe el nombre del cliente") y **enfoca** el campo. El pedido no se crea.
- Con nombre escrito, al **enviar a cocina** el mensaje de WhatsApp sale con el
  nombre en el encabezado (`👤 Nombre`), como en el ejemplo acordado.
- Con nombre escrito, si el pedido **solo se guarda** (no va a cocina), también
  queda guardado con su nombre.
- En **Pedidos de hoy**, cada pedido muestra el nombre para identificarlo; al
  expandirlo, el nombre también aparece en el detalle.
- En el **resumen del día** (actual e Historial), cada orden incluye su nombre.
- Al **editar** un pedido, el campo aparece con el nombre previo y se puede cambiar
  antes de reenviar.
- Tras enviar/guardar, el campo **se limpia** junto con el resto de la comanda.

## Posibles errores y mitigaciones
- **Campo vacío o solo espacios:** se trata como vacío → bloquea enviar/guardar,
  con aviso y foco en el campo.
- **Nombres largos o con emojis/caracteres raros:** se aceptan pero se recortan
  espacios sobrantes; se muestran sin romper el layout de la tarjeta ni el mensaje.
- **Pedidos viejos sin nombre** (creados antes de este cambio): se muestran sin
  nombre (o con un guion) y no rompen la lista ni el resumen.
- **Edición de un pedido:** al reenviar como corrección, conserva o actualiza el
  nombre; no lo pierde.
- **Recarga a mitad de armado:** el nombre en curso se conserva junto con la
  comanda (igual que el modo y las líneas).

## Futuro (v2)
- **Autocompletar** con los nombres usados en el día (Opción B del brainstorming).
- Búsqueda/filtro de pedidos por nombre en Cierre.
- Otros datos opcionales (teléfono) si algún día se hacen entregas.
