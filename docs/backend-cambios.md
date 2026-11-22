# Cambios hechos en el backend (BackEnd-CheerClick_Systems)

Autorizados por el usuario el 2026-11-20. Verificados arrancando el servidor con una base local falsa (nunca
contra Atlas): `/health`, CORS, y que las rutas públicas ya no piden token. **No se hicieron commits.**
El repo ya tenía cambios propios sin commitear (`email.services.js`, `bruno/`): no se tocaron.

| Punto | Archivo(s) | Cambio |
|---|---|---|
| 2.1 Registro público | `routes/niveles.routes.js`, `routes/planAsociado.routes.js` (+ controllers y services) | Nuevas rutas **sin token** `GET /api/niveles/publico` y `GET /api/plan-asociado/publico`: solo los **Activos**, ordenados, con los campos mínimos (`nombre`; el plan también `descripcion` y `valor`). Van antes de `/:id`. |
| 2.1 CORS | `index.js` | `cors` (dependencia nueva) **solo si** existe `CORS_ORIGIN` (lista separada por comas). Permite `Content-Type` y `X-Token`. Sin la variable no se habilita (en desarrollo se usa el proxy de Vite). |
| Comprobantes | `index.js` | `express.json({ limit: '5mb' })` (antes 100 kb) para comprobantes en base64. |
| 2.2 / 4.5 Rol administrador | — (ya estaba bien) | `POST /usuarios` (solo admin) ya acepta `Administrador`; el registro público **siempre** crea `Atleta` e ignora el rol del cuerpo. La interfaz ofrece «Administrador» solo en «Crear usuario» del panel. |
| 2.3 Detalle de cuenta | — (ya estaba bien) | `GET /usuarios/:id/detalle` ya devuelve `nivel` y `planAsociado` poblados, también en cuentas aprobadas. Faltaba mostrarlos en el frontend. |
| 2.4 Métodos de pago | `models/metodoPago.model.js`, `services/metodoPago.services.js` | Campo opcional `qr`. «Efectivo» nunca guarda QR (hook `pre('validate')` y regla en `PATCH`). Se rechaza crear «Pago presencial». No había datos semilla ni enums de «presencial» en el backend. Si en la base existe un documento «Pago presencial», elimínalo desde Pagos → Métodos de pago. |
| Planes | `models/planAsociado.model.js` | Campo `descripcion` (máx. 200) y `min: 1` en `valor` (antes `min: [true, …]`). |
| 2.5 / 4.9 Asistencia | `controllers/asistencia.controllers.js`, `services/asistencia.services.js`, `helpers/errores.helpers.js` | Respuestas con `success: true/false` (la asistencia y el helper de errores). `PUT /asistencia/dia`: si falla la sincronización de una justificación **después** de guardar, ya no responde error: responde 200 con `advertencias: [...]`. |

## Pendientes / por confirmar
- Titular y llave/cuenta de los métodos de pago (el modelo solo tiene `nombre` y `qr`).
- Subida real de archivos de comprobante (hoy viajan como data-URL en el campo `comprobante`).
- Marca de «aviso de bienvenida visto» en el backend (hoy en `localStorage`).
- `POST /pqrs` para el rol Entrenador (ver `docs/backend-pqrs-entrenador/LEEME.md`).
- IDs consecutivos IM/PG/HA (ver `docs/backend-ids/`).
- La edad de los atletas no viene en la lista de usuarios (promedio de edad en Rendimiento).


## Ronda 2026-11-20 (segunda parte)

| Punto | Archivo(s) | Cambio |
|---|---|---|
| **Bug: entrenador sin acceso a asistencia/rendimiento** | `helpers/acceso.helpers.js` | `NivelModel` se usaba sin importarse y se consultaba un campo `entrenador` que no existe (el nivel guarda `usuario`): toda petición de un entrenador terminaba en `ReferenceError`/500. Era la causa de «No hay atletas registrados en este nivel». |
| Habilidades (permisos) | `routes/habilidades.routes.js`, `controllers/habilidades.controllers.js` | `POST` solo administrador. El entrenador solo puede hacer `PATCH { estado }` (otro campo responde 403). La habilidad no guarda nivel, así que no se puede limitar «a su nivel». |
| Implementos entregados | `services/solicitud.services.js` | Un pedido `Entregado` no cambia de estado: responde 409 con mensaje claro. |
| Mensualidades automáticas | `services/generacionMensualidades.services.js`, `jobs/mensualidades.job.js`, `index.js`, `models/mensualidades.model.js`, `models/pagos.model.js`, `controllers/mensualidades.controllers.js`, `routes/mensualidades.routes.js` | Cron (`node-cron`, dependencia nueva) el día 1 de cada mes a las 00:05 en `America/Bogota`. Por cada atleta activo con plan crea un `Pago` pendiente + su `Mensualidad` (valor del plan, vencimiento configurable). Idempotente: verificación previa + índice único `usuario+periodo` (campo nuevo `periodo` AAAA-MM). Al arrancar genera el mes actual si faltó. `POST /api/mensualidades/generar` (admin, body opcional `{ periodo }`). En `Pago`, `comprobante` y `metodoPago` ya solo son obligatorios cuando el estado es `Pagado`. |
| Notificaciones | `models/notificacion.model.js`, `services/`, `controllers/`, `routes/notificaciones.routes.js` | Tipo `pago`, campos `titulo` y `enlace`. Nuevo `GET /api/notificaciones/no-leidas`. Cada mensualidad generada notifica al atleta («Tu mensualidad de … ya está disponible. Valor: $…», enlace `/atleta/pagos`). |
| Rendimiento (listado) | `services/rendimiento.services.js`, `models/rendimiento.models.js`, `models/nota.model.js` (nuevo) | El módulo estaba a medias: `HabilidadesModel` comentado pero usado, `NotaModel` inexistente, el modelo no tenía `usuario` (Mongoose lo descartaba) y el resumen llamaba a `dbGetUsuario(nivel)`. Reparado. `GET /rendimiento/resumen` ahora devuelve TODOS los atletas activos (equivale a un LEFT JOIN) con `rendimiento: null` si no tienen evaluaciones; el entrenador solo ve los de sus niveles. |

### Variables de entorno nuevas (todas opcionales)
`MENSUALIDADES_CRON` (por defecto `5 0 1 * *`), `MENSUALIDADES_TZ` (`America/Bogota`), `MENSUALIDAD_DIA_VENCIMIENTO` (10), `MENSUALIDADES_AUTO=false` (desactiva el job y la recuperación al arrancar).

### Pendiente
- Marcar como `Vencido` las mensualidades pendientes cuando pase su `fechaVencimiento` (hoy nada lo hace).
- Habilidad con nivel y descripción; notas del entrenador legibles.


## Ronda 2026-11-20 (tercera parte)

Verificado contra una MongoDB **local y desechable** (nunca contra Atlas): guardado de asistencia como admin y entrenador,
pagos en efectivo, códigos consecutivos con 10 altas en paralelo, filtro de habilidades por nivel, edad, y arranque con el job.

| Punto | Archivo(s) | Cambio |
|---|---|---|
| **Causa raíz: asistencia no guardaba** | `models/asistencia.model.js` | `StrictModeError: Path "fecha" is not in schema`. El modelo era una versión vieja sin `nivel` ni `fecha` (el servicio los usa para el upsert) y con `horario` obligatorio. Reescrito: `nivel`, `fecha` (texto AAAA-MM-DD), `horario` opcional. El índice único antiguo `{usuario, horario}` (con `horario: null` solo permitía UN registro por atleta en toda su vida) se reemplaza por `{usuario, fecha}` parcial único + `{nivel, fecha}`. |
| Migración de índices de asistencia | `helpers/migraciones.helpers.js`, `scripts/migrar-asistencia.js`, `index.js` | Idempotente. Se ejecuta sola al arrancar el servidor y también a mano: `node --env-file .env scripts/migrar-asistencia.js`. No toca documentos. |
| Pago en efectivo | `models/metodoPago.model.js`, `models/pagos.model.js`, `helpers/metodoPago.helpers.js`, `services/solicitudPago.services.js`, `controllers/pagos.controllers.js`, `services/notificaciones.services.js` | Atributo `requiereComprobante` en el método (Efectivo = false). Estado nuevo `Pendiente de confirmación`. El atleta solo puede crear/actualizar SUS pagos, con los campos `metodoPago`, `fechaPago`, `comprobante`, `observaciones` (no puede marcarse `Pagado` ni tocar el pago de otro: antes sí podía). Comprobante obligatorio solo si el método lo requiere. El efectivo avisa a todos los administradores (campanita). |
| Bug: `GET /mensualidades/:id` | `services/mensualidades.services.js` | No hacía `populate`: el frontend no veía estado/método/comprobante del pago tras enviarlo. |
| Códigos consecutivos | `helpers/consecutivo.helpers.js`, modelos `implementos`, `pagos`, `habilidades`, `solicitud` | Campo `codigo` único, indexado, inmutable (plugin). Contador atómico (`findOneAndUpdate + $inc` en la colección `contadors`), se consume solo cuando el documento ya pasó la validación (sin huecos por intentos fallidos). Búsqueda por código en implementos, pagos, mensualidades y habilidades. Los modelos de implementos y solicitudes no tenían el campo `codigo` (el servicio lo asignaba pero Mongoose lo descartaba). |
| Migración de códigos | `scripts/migrar-codigos.js` | `node --env-file .env scripts/migrar-codigos.js`. Idempotente: solo asigna a los registros SIN código, por fecha de creación, y deja el contador al día. |
| Habilidades por nivel (**supuesto**) | `models/habilidades.model.js`, `services/`, `controllers/habilidades.controllers.js` | Campo `nivel` opcional (`null` = aplica a todos los niveles). `GET /habilidad?nivelId=` devuelve las de ese nivel + las generales. El entrenador solo puede pedir sus niveles (403 si no). |
| Edad en Rendimiento | `helpers/fecha.helpers.js`, `services/rendimiento.services.js` | `/rendimiento/resumen` devuelve `edad` calculada desde la fecha de nacimiento del perfil (día de hoy en America/Bogota); `null` si no hay fecha. |
| Auditoría de niveles | `scripts/auditar-niveles.js` | Solo lectura: lista niveles y marca duplicados, parecidos o sin atletas/horarios. |

### Orden recomendado para desplegar
1. `node --env-file .env scripts/migrar-asistencia.js` (o simplemente arrancar el servidor: lo hace solo).
2. `node --env-file .env scripts/migrar-codigos.js` (asigna IM/PG/HA/SL a lo existente).
3. Revisar el resultado de `node --env-file .env scripts/auditar-niveles.js`.


## Ronda 2026-11-20 (cuarta parte)

Verificado contra la MongoDB **local y desechable** (nunca contra Atlas). IDs ya personalizados **sin cambios**: usuarios (AT/EN/AD),
PQRS (PQ0001), implementos (IM), pagos (PG), habilidades (HA) y pedidos (SL).

| Punto | Archivo(s) | Cambio |
|---|---|---|
| **Causa raíz: «El pago es obligatorio»** | `services/solicitud.services.js`, `controllers/solicitud.controllers.js`, `models/solicitud.model.js` | El modelo exigía `pago` pero `POST /solicitud` nunca lo creaba (comentario `PENDIENTE(pagos)`): fallaba **cualquier** método. Ahora recibe `{ items, metodoPago, comprobante? }`, crea el `Pago` con la regla compartida (`dbCrearPagoPedido`) y lo enlaza. También estaba mal el `ref: "pagos"` (el modelo se llama `Pagos`). |
| Pedido en efectivo | `services/solicitudPago.services.js` | Efectivo: sin comprobante, pago «Pendiente de confirmación», aviso a los administradores. Digital: comprobante obligatorio. Al marcar el pedido `Entregado`, un pago en efectivo pendiente pasa a `Pagado`. Si algo falla se libera el stock y se borra el pago. El listado devuelve `pago` poblado (método, estado, comprobante, código PG). |
| Método «Efectivo» garantizado | `helpers/migraciones.helpers.js` (`asegurarMetodosPago`), `index.js` | Idempotente, al arrancar: crea «Efectivo» si no existe y completa `requiereComprobante` (digitales = true). |
| **Sesiones válidas** | `helpers/sesiones.helpers.js`, `controllers/horarios.controllers.js`, `routes/horarios.routes.js` | `GET /api/horarios/sesiones?nivelId=&hasta=hoy&limite=` (admin y entrenador; entrenador solo sus niveles): días de entrenamiento del nivel (plantilla semanal), nunca futuros. |
| Validación en rendimiento | `services/rendimiento.services.js` | `PUT /rendimiento/atleta/:id`: la fecha debe ser un día de sesión del nivel del atleta y no futura (400 con mensaje). Si ya existe un rendimiento en esa fecha (registro antiguo) no se bloquea. Nota máx. 250. Sin horario cargado solo se exige que no sea futura (**supuesto**). |
| **Códigos nuevos** | modelos `nivel`, `planAsociado`, `metodoPago`, `horario`, `justificacion`, `resena`, `rendimiento`, `notificacion`, `competencia`, `inscripcion_competencia` | NV, PL, MP, HR, JU, RS, RD, NT, CP, IC + 3 dígitos (plugin `pluginCodigo`, contador atómico, inmutable, sin huecos por altas inválidas). `insertMany` y el upsert masivo de rendimiento reservan códigos con `reservarCodigos` (un solo `$inc` por lote). |
| Migración y verificación | `scripts/migrar-codigos.js`, `scripts/verificar-codigos.js`, `helpers/entidadesConCodigo.js` | `npm run migrar:codigos` y `npm run verificar:codigos` (0 sin código, 0 duplicados, 0 formato inválido; sale con código 1 si hay problemas). |
| Landing pública | `services/niveles.services.js` | `GET /niveles/publico` ahora devuelve también `entrenador` (solo nombre) y `horarios` de los niveles **Activos**. |
| Fecha de nacimiento | `helpers/fecha.helpers.js`, `controllers/perfilUsuario.controllers.js`, `scripts/auditar-fechas-nacimiento.js` | No futura; administrador y entrenador ≥ 18; atleta ≥ 5. Se valida al crear y editar el perfil. `npm run auditar:fechas` lista (sin modificar) los perfiles existentes que incumplen. |
| Auditorías de solo lectura | `scripts/auditar-niveles.js`, `scripts/auditar-imagenes.js` | `npm run auditar:niveles` («Nivel 3»), `npm run auditar:imagenes` (imágenes repetidas / rutas no públicas). |

### Orden recomendado
1. Arrancar el servidor (índices de asistencia y método «Efectivo» se arreglan solos).
2. `npm run migrar:codigos` y luego `npm run verificar:codigos`.
3. Revisar `npm run auditar:niveles`, `npm run auditar:fechas` y `npm run auditar:imagenes`.


## Ronda 2026-11-22 (doble pago)

| Punto | Archivo(s) | Cambio |
|---|---|---|
| Un pago ya enviado no se vuelve a pagar | `services/solicitudPago.services.js` (`dbAtletaActualizaPago`) | `PATCH /pagos/:id` del atleta responde **409** si el pago está `Pagado` («Esta mensualidad ya fue pagada») o ya enviado/en efectivo pendiente («Ya hay un pago en verificación»). La escritura es una actualización condicional **atómica** (solo si sigue sin enviar o `Rechazado`): dos envíos simultáneos → uno pasa y el otro 409. Un pago `Rechazado` sí se puede reintentar. |
