# Pedidos en línea directo a la comandera (con revisión del mesero)

> Spec del usuario — Spec-Driven Development
> Fecha: 2026-08-28 · Estado: 🟢 Aprobado

## Overview
El pedido que un cliente arma en el link (`pedir.html`) deja de tener que
**recopiarse** a mano: al confirmar, entra **directo a la comandera del mesero**
como un "pedido en línea" pendiente, **y además** abre WhatsApp para que el cliente
tenga su copia (opción B del brainstorming). El mesero ve una bandeja de entrada,
**revisa** cada pedido y, si el cliente no quiere cambios, lo **acepta y lo manda a
cocina** con un toque (contando en el cierre del día). El puente entre el celular del
cliente y el del mesero es el **mismo Google/Apps Script** que ya sirve el menú.

## Usuario(s) objetivo
- **Mesero / administrador** (comandera): recibe los pedidos ya estructurados, los
  revisa y los envía a cocina sin volver a teclearlos.
- **Cliente** (link): su pedido llega solo; conserva su copia por WhatsApp.

## Contexto del problema
Hoy el pedido del cliente llega como **texto de WhatsApp**. El mesero lo lee y lo
**vuelve a capturar** en la comandera para poder mandarlo a cocina y que cuente en el
cierre. Eso es lento (sobre todo en pico) y se presta a errores de transcripción.
La comandera guarda todo **localmente** en su celular y no hay forma de que el pedido
del cliente (otro celular) entre solo. Ya existe el Apps Script del admin (sirve el
menú en vivo por JSONP y recibe datos por POST), que puede servir de puente.

## Alcance v1 (camino 🅐)

**SÍ entra:**
- **Envío del cliente al backend:** al confirmar en el link, además de abrir WhatsApp,
  el pedido (estructura completa: cliente, líneas con aderezos/extras/notas, modo de
  entrega, dirección/ubicación, pago, total) se **envía al Apps Script** y queda como
  **pendiente**.
- **Bandeja "Pedidos en línea" en la comandera:** una sección/pestaña nueva que
  **consulta cada ~20 s** si hay pedidos nuevos y los muestra con un **globito de aviso**
  (ej. "2 nuevos"). También un botón para **refrescar** manualmente.
- **Revisión y decisión por pedido:** al tocar uno, el mesero ve **todo el detalle** y
  puede:
  - **✅ Aceptar y enviar a cocina** → el pedido pasa a ser un pedido normal de la
    comandera (cuenta en el cierre) y se manda a cocina por WhatsApp (flujo actual).
  - **✏️ Editar** → se carga al carrito para ajustarlo y enviarlo (reusa el flujo de
    edición existente).
  - **✖ Rechazar** → se descarta (no cuenta en el cierre).
- **Sin duplicados:** cada pedido en línea trae un **id único**; una vez aceptado o
  rechazado, no vuelve a aparecer como pendiente.
- **Respaldo:** si el backend falla al enviar desde el link, el cliente igual manda su
  pedido por **WhatsApp** (como hoy); no se pierde el pedido.

**NO entra (fuera de v1):**
- **Sonido/vibración** al llegar un pedido (eso es 🅑, se suma después).
- **Aviso automático de vuelta al cliente** ("aceptado", "en cocina") — el mesero se
  comunica por WhatsApp como hoy.
- **Tiempo real instantáneo** (Firebase); v1 usa consulta cada ~20 s.
- **Estados avanzados** del pedido en línea más allá de pendiente/aceptado/rechazado.
- No cambia nada del cálculo de precio, menú, ni de la comandera existente salvo
  agregar la bandeja.

## Comportamiento esperado
- **Cliente confirma en el link** → (1) el pedido se **envía al Apps Script** y (2) se
  abre **WhatsApp** con la copia (igual que hoy). Ve su mensaje de "pedido enviado".
- **En la comandera**, sin que el mesero haga nada, a los pocos segundos aparece un
  **globito** en "Pedidos en línea" con la cantidad de pendientes.
- **El mesero abre la bandeja** → ve la lista de pedidos en línea (nombre, hora,
  entrega, total) y toca uno para ver el **detalle completo**.
- **Si el cliente no quiere cambios** → el mesero toca **✅ Aceptar y enviar a cocina**;
  el pedido se registra en el día y sale el WhatsApp a cocina (si aplica, con las
  reglas actuales de qué va a cocina). El pendiente desaparece de la bandeja.
- **Si hay ajustes** → **✏️ Editar** carga el pedido al carrito para modificarlo y
  enviarlo; **✖ Rechazar** lo descarta.
- Los pedidos aceptados se comportan **igual que cualquier pedido** de la comandera
  (cierre, historial, cancelar, reenviar a cocina, etc.).

## Posibles errores y mitigaciones
- **Sin internet en el link al confirmar** → no se puede enviar al backend; el cliente
  igual manda por WhatsApp (respaldo) y el mesero lo captura si hace falta. El link no
  se traba: avisa que "se envió por WhatsApp".
- **Sin internet en la comandera** → la bandeja no puede consultar; muestra "sin
  conexión, reintentando" y sigue funcionando lo demás. Al volver la red, aparece.
- **Pedido duplicado** (el cliente toca enviar dos veces) → id único por intento;
  además el mesero ve el duplicado y puede rechazar uno.
- **El backend (Apps Script) no está configurado** → si no hay URL, el link se comporta
  como hoy (solo WhatsApp) y la comandera no muestra la bandeja. Se activa al conectar
  el Apps Script (ya conectado en este proyecto).
- **Dos pedidos llegan casi al mismo tiempo** → el backend los encola (con bloqueo);
  la comandera los muestra a ambos.
- **El mesero acepta y el cliente después pide un cambio** → usa **Editar** sobre el
  pedido ya en la comandera (flujo actual de corrección).

## Futuro (v2)
- **🅑:** sonido/vibración al llegar un pedido nuevo + botón "Avisar al cliente" por
  WhatsApp + estados (nuevo → aceptado → en cocina).
- Confirmación automática de vuelta al cliente en la propia página ("tu pedido fue
  recibido / aceptado").
- Tiempo real (Firebase u otro) si el volumen lo pide.
- Tiempo estimado de entrega/preparación mostrado al cliente.
