# Bubble Tea — nueva categoría de bebidas de barra

> Spec del usuario — Spec-Driven Development
> Fecha: 2026-09-19 · Estado: 🟢 Aprobado

## Overview
Agregar al menú una categoría nueva, **Bubble Tea** 🧋, con 5 familias de bebidas
que prepara la **barista**. El mesero (y el cliente en el link) puede armar el
pedido eligiendo la familia, el **tamaño** (Chico 430 ml / Grande 560 ml) y el
**sabor**. El Bubble Tea se envía al **mismo grupo de WhatsApp** de cocina pero en
su **propia sección** para que la barista identifique lo suyo, y cuenta en el
cierre del día como un concepto propio.

## Usuario(s) objetivo
- **Mesero** (comandera, `index.html`): arma el pedido del cliente tocando el
  menú a media hora pico.
- **Cliente** (link de autoservicio, `pedir.html`): arma su propio pedido y lo
  envía por WhatsApp al negocio.
- **Barista** (indirecto): recibe en el grupo de WhatsApp, en su sección, solo el
  Bubble Tea que debe preparar.
- **Administrador**: ve el Bubble Tea reflejado en el cierre y el resumen del día.

## Contexto del problema
El negocio sumó Bubble Tea a su carta pero la app no lo tiene. Hoy no hay forma de
tomar ese pedido tocando el menú, ni de que la barista lo reciba limpio, ni de que
cuente en el cierre. Además, las bebidas actuales (Refresco, Té Arizona, Bebida
coreana) **no se mandan a nadie** por WhatsApp; el Bubble Tea sí necesita llegar a
quien lo prepara (la barista), sin mezclarse con lo de cocina.

## Alcance v1

**Sí entra:**
- Categoría nueva **Bubble Tea** en el menú compartido (aparece en la comandera y
  en el link del cliente).
- **5 platillos, uno por familia**, cada uno con:
  - **Variante de tamaño obligatoria**: Chico (430 ml) y Grande (560 ml), con
    precio distinto.
  - **Choice de sabor obligatorio** (sin costo): elige la bebida específica.
  - **Nota libre** por línea (como el resto del menú).
- Precios y sabores por familia:
  | Familia | Chico 430 | Grande 560 | Sabores |
  |---|---|---|---|
  | Milk Tea | $65 | $75 | Black Sugar · Mazapán · Taro · Blue Coco · Blue Mango · Blue Fresa |
  | Matcha | $75 | $85 | Ube · Mango · Fresa |
  | Yakult Tea | $75 | $85 | Mango · Fresa · Maracuyá |
  | Soda / Blue Soda | $55 | $65 | Galaxy · Fresa Blue · Mango Blue |
  | Fruit Tea | $65 | $75 | Maracuyá · Jamaica · Mango · Durazno |
- **Envío a WhatsApp**: el Bubble Tea **sí se manda** al grupo (se suma a las
  categorías que van a cocina/barra), dentro del **mismo mensaje** de siempre pero
  con su **propia sección titulada `🧋 BUBBLE TEA`**.
- **Cierre del día**: el Bubble Tea cuenta en el total y aparece en "Ventas por
  concepto" como concepto propio **🧋 Bubble Tea**, y en el desglose por platillo
  del resumen del administrador.
- **Editor de menú**: se puede editar nombre, precios (por tamaño) y marcar
  "agotado" igual que el resto, y se publica al link.
- Nada preseleccionado en la hoja del platillo (tamaño y sabor empiezan sin
  elegir; "Agregar" nace deshabilitado hasta completar), consistente con el resto.

**Queda FUERA (v1):**
- Opciones extra del Bubble Tea: **nivel de azúcar, hielo, toppings/perlas extra,
  aderezos**. Por ahora solo tamaño + sabor + nota libre.
- Cambiar el comportamiento de las bebidas actuales (Refresco, Té, Bebida
  coreana): siguen **sin enviarse** a nadie.
- Mensaje/hilo de WhatsApp separado solo para la barista (se usa el mismo mensaje
  con sección aparte).
- Mostrar las descripciones largas de cada bebida (las de la imagen) en la app.

## Comportamiento esperado
- **Armar (mesero y cliente):** al abrir un platillo de Bubble Tea, el usuario ve
  la elección de **tamaño** (Chico/Grande, con su precio) y la de **sabor**;
  ninguna viene preseleccionada. El botón "Agregar" se habilita solo cuando eligió
  tamaño **y** sabor. El precio mostrado corresponde al tamaño elegido.
- **En el carrito / pedido:** cada línea de Bubble Tea muestra familia, tamaño,
  sabor y nota, y suma su precio al total como cualquier platillo.
- **Envío:** al enviar el pedido, si incluye Bubble Tea, el mensaje de WhatsApp al
  grupo trae la sección **`🧋 BUBBLE TEA`** con sus líneas, junto a las secciones
  de cocina que correspondan. Un pedido que **solo** trae Bubble Tea (o Bubble Tea
  + bebidas/banderillas) **sí se envía** al grupo, porque ahora hay algo para la
  barista.
- **Cierre:** al cerrar el día, el Bubble Tea vendido aparece agrupado por
  familia + tamaño + sabor en las ventas, dentro del concepto 🧋 Bubble Tea, con
  cantidad e ingreso; el total del día lo incluye.
- **Link del cliente:** el cliente ve la categoría Bubble Tea con precios y estado
  "agotado" en vivo (según lo publicado por el admin), igual que el resto del menú.

## Posibles errores y mitigaciones
- **No elige tamaño o sabor:** el botón "Agregar" permanece deshabilitado con el
  aviso "Elige las opciones para continuar" (mismo patrón actual).
- **Bebida agotada:** si el admin marca la familia como agotada, el cliente la ve
  agotada y no la puede pedir; el mesero la ve marcada en el editor.
- **Pedido solo de barra:** debe enviarse igual (no debe caer en el caso "no va a
  cocina / guardar pedido"), porque la barista necesita recibirlo.
- **Corrección de un pedido con Bubble Tea:** si al editar cambia lo de barra/
  cocina, se reenvía; si solo cambian bebidas normales/banderillas, no. (Se
  respeta la lógica actual de "reenvío solo si cambió lo que va al grupo".)
- **Celular recarga / se pierde señal:** los pedidos del día siguen guardados
  localmente como hoy; el Bubble Tea no cambia eso.

## Futuro (v2)
- Opciones de personalización: nivel de azúcar, cantidad de hielo, toppings/perlas
  extra (posiblemente con costo, estilo "extras" de hamburguesa).
- Aderezos/toppings en el link del cliente (como banderillas/papas).
- Mostrar la descripción de cada bebida en el link para ayudar a elegir.
- Evaluar si la barista necesita su propio hilo/mensaje separado si el volumen
  crece.
