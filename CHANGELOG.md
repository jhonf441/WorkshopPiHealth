# WorkshopPiHealth -- historial de versiones

## 2.4.5 -- 2026-10-30

- Manifest: sbcRequired true (needs WorkshopService); side bar keeps the group names

## 2.4.4 -- 2026-10-29

- Phone layout fixes (44 px touch targets, no overflow), Workbench full-screen section picker, clamps hint, interrupted jobs off the table, Machine scale label

## 2.4.3 -- 2026-10-29

- Audit and UX fixes: Jog owns workzeroaxis.g, restart notice with time, shared pulse table with update and download, side bar tooltips, spacing, wider field

## 2.4.2 -- 2026-10-29

- State chips with an icon: the icon carries the color and there is no dot (family.css); chosen chip tinted

## 2.4.1 -- 2026-10-29

- PID chart read from the service (any screen), Activity shows its active filters, health state without the duplicate icon

## 2.4.0 -- 2026-10-29

- Side bars: no gray line, a chosen item goes to the start of its section; Printing: start-up chip without the mode rows, tests notice only when the chip is not green, no-sensor fault reading; Vision: settings cards packed in columns, laser crosses only with Laser mode; Zones: visible mode dot

## 2.3.28 -- 2026-10-28

- Design family: final shared styles

## 2.3.27 -- 2026-10-28

- Design family: page bar with lead, own design css removed, section color as --wf-sec

## 2.3.26 -- 2026-10-28

- Header badge icon always white; Lights: how-it-works note inside the Summary, save bar only with changes

## 2.3.25 -- 2026-10-28

- Minimalist design: neutral page bar with a solid badge, neutral cards with a 2 px top line, state as dot and word, no colored edges

## 2.3.24 -- 2026-10-28

- Menu caption back to System health

## 2.3.23 -- 2026-10-27

- Plan warnings in words, risk dialogs in DWC style, mesh point selection, link to Machine modes

## 2.3.22 -- 2026-10-27

- Side bar no longer makes the page jump when a shorter section is chosen; start-up chip as in every page (header, same wording)

## 2.3.21 -- 2026-10-26

- Run-time guard: the 3.6 build refuses to start on a host with window.DWC and the 3.7 build outside DWC 3.7.x (visible warning); shipped as a strict per-line zip (dwcVersion 3.6 / 3.7)

## 2.3.20 -- 2026-10-26

- Shorter menu caption

## 2.3.19 -- 2026-10-24

- Start-up assistant: active lines highlighted, single-step way back, dark select options; Lights time picker and defaults; Printing FFF switch; Mesh handles above the points

## 2.3.18 -- 2026-10-24

- Start-up card reports its pending count to the service (machine setup list)

## 2.3.17 -- 2026-10-23

- Follow a sign-in or logout made in another tab

## 2.3.16 -- 2026-10-23

- One sign-in for every tab (token in localStorage)

## 2.3.15 -- 2026-10-23

- Header: no health chip while signed out

## 2.3.14 -- 2026-10-23

- Compact live job strip in the bar; page header treats an expired session as sign in; numeric PIN field

## 2.3.13 -- 2026-10-23

- Page header asks who is signed in; PIN field is numeric

## 2.3.12 -- 2026-10-23

- Common page header: health chip, session chip, quiet start-up icon when ready

## 2.3.11 -- 2026-10-22

- Side-bar pin only while the bar is open; Lights panel counts only the faults the service marks

## 2.3.10 -- 2026-10-22

- Pin on every side bar, thin scrollbars, one sign-in dialog

## 2.3.9 -- 2026-10-22

- Sign-in never opens by itself; keyboard only on touch

## 2.3.8 -- 2026-10-22

- Fix names, values and catalog markers the English rename left behind

## 2.3.7 -- 2026-10-22

- Sessions made clear: not-signed-in chip, sign-in on visitor 403, refusal toast

## 2.3.6 -- 2026-10-22

- Sign-in dialog focus and kiosk keyboard helper; Jog blocked touches explained

## 2.3.5 -- 2026-10-22

- Kiosk keyboard helper call, sign-in dialog font

## 2.3.4 -- 2026-10-22

- Jog and bars tell why an action is blocked and ask for the session; Jog loses the Machine pointer sections

## 2.3.3 -- 2026-10-22

- Sign-in dialog redesign and on-screen keyboard; single floating panel for power actions; risk bar on one line; Jog gear and scrollbar; side tabs transition

## 2.3.2 -- 2026-10-21

- PIN sign enters by itself when the PIN has the length that worked last time

## 2.3.1 -- 2026-10-21

- Page routes in English with redirects from the old ones, localStorage keys migrated to English

## 2.3.0 -- 2026-10-21

- Health history from the service with range selector, read-only for lower roles

## 2.2.3 -- 2026-10-21

- Page reloads when the DWC language changes; Vision pins dsf-python below 3.7; meter wizard copy over http

## 2.2.2 -- 2026-10-21

- English migration: texts through the catalog, no in-browser translator, interfaces per part

## 2.2.1 -- 2026-10-20

- English names: remaining values, ids, theme panels and the Vision backend keys (fixes a mismatch with the page)

## 2.2.0 -- 2026-10-20

- All the code, data keys and enum values are in English; stored data is converted by the one-off migration script

## 2.1.2 -- 2026-10-18

- Start-up entry is a chip in the page header

## 2.1.1 -- 2026-10-16

- Start-up row is only the live-job bridge (Duet services are in the table of the page and cannot be started from here)

## 2.1.0 -- 2026-10-16

- Start-up card is now a dialog opened from a strip on the page (one card per function, progress, step-by-step assistant), with a plain explanation for every row

## 2.0.9 -- 2026-10-16

- Start-up assistant (shared piece), Lights: the strip pin is chosen in Advanced (plain LED removed)

## 2.0.8 -- 2026-10-15

- Start-up card (shared piece): Printing assistant renamed so it no longer collides with the card

## 2.0.7 -- 2026-10-15

- Rebuilt with the shared start-up card piece

## 2.0.6 -- 2026-10-15

- Spanish texts with accents and enie

## 2.0.5 -- 2026-10-15

- Hide every mention of another plugin when it is absent

## 2.0.4 -- 2026-10-14

- Cleanup: no more lookups of the old service Id (PiCustomCodes) or mentions of the removed custom G-codes

## 2.0.3 -- 2026-10-14

- Header is a card row (same as the other pages) instead of a card title

## 2.0.2 -- 2026-10-13

- Files and macros written by the plugin are in English; bilingual risk texts

## 2.0.1 -- 2026-10-13

- Official localization completed: no Spanish text left in the sources, texts with parameters are single keys

## 2.0.0 -- 2026-10-13

- Needs WorkshopService 2.0: calls its central API (POST /machine/WorkshopService/api) instead of the custom codes M9003 / M9010, which are gone

## 1.7.0 -- 2026-10-13

- Official DWC localization: es.json / en.json via registerPluginLocalization

## 1.6.1 -- 2026-10-12

- Read-only database summary with link to Services; heartbeat; system wording

## 1.6.0 -- 2026-10-12

- Salud: reparar fechas danadas, estado desde DWC y solo con la pagina a la vista; dwcVersion 3.6; sin sbcRequired

## 1.5.2 -- 2026-10-11

- Declara la dependencia de WorkshopService

## 1.5.1 -- 2026-10-11

- Respaldos: aviso cuando no hay memoria USB para elegir otro lugar

## 1.5.0 -- 2026-10-11

- Carpetas en ingles bajo 0:/sys/workshop (datos, disenos, malla, cortar por partes); arreglos de la Mesa de trabajo

## 1.4.1 -- 2026-10-11

- Las paginas vuelven a cargar (punto y coma en safe-saving.js)

## 1.4.0 -- 2026-10-11

- Id nuevo en ingles (Workshop...) y guardado seguro ante cortes de luz

# TallerSalud -- historial de versiones

## 1.3.1 -- 2026-10-11

- Compatibilidad con los Id nuevos en ingles (etapa 1, sin cambiar el Id); Motores: tabla de referencias del techo de pulsos

## 1.3.0 -- 2026-10-10

- Base de datos: libre de la tarjeta, explicacion, alerta de poco espacio

## 1.2.0 -- 2026-10-10

- Tarjeta Base de datos del Servicio de la Pi (solo si existe)

## 1.1.11 -- 2026-10-10

- Con el servicio de la Pi detenido, los datos extendidos se atenuan con el aviso de que no estan al dia

## 1.1.10 -- 2026-10-10

- Estilo comun segun DESIGN.md (alto de botones, colores de la paleta, encabezados)

## 1.1.9 -- 2026-10-10

- Los comandos de la pagina van por HTTP desde el primero (antes salian por G-code mientras cargaban los plugins) y reintentan ~15 s si el servicio se esta reiniciando

## 1.1.8 -- 2026-10-10

- Estandar de advertencias y nombre visible del servicio (Servicio de la Pi)

## 1.1.7 -- 2026-10-10

- Comunicacion: el aviso de falta el servicio de la Pi explica en el lugar como se comunica la Pi con la Duet (antes enlazaba a GitHub)

## 1.1.6 -- 2026-10-10

- Aviso con enlace a la explicacion cuando falta el servicio de la Pi (sin modo SBC, sin PiCustomCodes o detenido)

## 1.1.5 -- 2026-10-10

- Linea de diseno comun: colores por significado, encabezado con el icono del menu, textos legibles con el tema claro de DWC

## 1.1.4 -- 2026-10-09

- Ctrl+rueda / Ctrl+tecla pasan al zoom de Chrome

## 1.1.3 -- 2026-10-09

- Fila del Puente G-code generica: cuantos programas y sus nombres, en vez de 'Cliente del puente conectado'

## 1.1.2 -- 2026-10-09

- Graficos: el tooltip se ve tambien en escala 'sin picos' (antes quedaba fuera del grafico)

## 1.1.1 -- 2026-10-09

- Pantallas agrupadas por equipo (antes salia esta Pi y la PC repetidas, una por sesion)

## 1.1.0 -- 2026-10-09

- Salud de la Pi completa: voltaje y limitacion, WiFi y conexiones, servicios, Duet, pantallas, y alertas al celular que se prenden/apagan

# TallerSalud

## 1.0.0
- Pagina "Salud de la Pi": CPU, temperatura, RAM y almacenamiento de la Raspberry Pi, con estado (OK / alerta / limite) y graficas de la ultima hora. Lee los datos que DSF ya publica en el object model (sbc, volumes): no agrega carga a la Pi.
