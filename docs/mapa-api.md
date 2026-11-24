# Mapa de la capa de conexión (frontend → api → endpoints)

Toda petición HTTP sale de `src/api/client.js` (axios, una sola instancia). Cada recurso del backend tiene su
archivo `src/api/<recurso>.api.js`. Los `services/*.js` son una capa delgada que **mapea datos** (formato del
backend → formato de la interfaz) y llama a esos módulos; los componentes no usan axios ni `fetch` para el backend.

**Forma de las respuestas** (verificada en el backend): éxito `{ msg, data?, token? }` (la asistencia agrega
`success: true`); error `{ msg }` o `{ errors: { campo: 'mensaje' } }`. `client.js` devuelve el cuerpo ya
desempaquetado y lanza `ApiError` (mensaje legible) en los errores. Token: cabecera `X-Token`.

| Módulo del frontend | Servicio | Archivo api | Endpoints |
|---|---|---|---|
| Login, registro, recuperar clave | `services/sesion.js` | `auth.api.js` | POST `/auth/login`, `/auth/registro`, `/auth/olvide-contrasena`, `/auth/reenviar-codigo`, `/auth/verificar-codigo`, `/auth/restablecer-contrasena`; GET `/auth/renovar-token`; **PATCH `/auth/cambiar-contrasena`** (contraseña temporal obligatoria); el login y renovar-token traen `debeCambiarClave`, `perfilCompleto`, `camposFaltantes`; 403 `CAMBIO_CLAVE_REQUERIDO` / `PERFIL_INCOMPLETO` (ver `api/client.js`) |
| Registro público (niveles/planes) | `services/catalogos.js` | `niveles.api.js`, `planes.api.js` | GET `/niveles/publico`, `/plan-asociado/publico` (sin token) |
| Cuentas (admin) | `services/adminUsuarios.js` | `usuarios.api.js` | GET `/usuarios/solicitudes`, `/usuarios`, `/usuarios/:id/detalle`, `/usuarios/:id/certificado-eps` (Blob con token), `/usuarios/entrenadores`; POST `/usuarios` (`tambienEntrenador` solo admin); PATCH `/usuarios/solicitudes/:id/aprobar\|rechazar`, `/usuarios/:id/status\|rol`, **`/usuarios/:id/ficha\|nivel\|plan\|entrenador`** (todos solo administrador) |
| Perfil (3 roles) | `services/perfil.js` | `perfil.api.js`, `contacto_emergencia.api.js` | GET/PATCH `/perfilusuario/me` (PATCH también guarda `nombre` y `apellido`); POST `/perfilusuario`; PUT `/perfilusuario/me/foto\|certificado-eps\|contactos` (multipart la foto y el certificado); GET `/perfilusuario/me/certificado-eps` |
| Niveles / Horarios | `services/horariosService.js` | `niveles.api.js`, `horarios.api.js`, `plantilla_horario.api.js`, `competencias.api.js` | CRUD `/niveles` (el entrenador se guarda por **ID** con el selector buscable; `GET /usuarios/entrenadores`), `/horarios`, `/plantilla_horario`, `/competencias`. La cabecera `X-Vista: entrenador` (la pone `api/client.js` cuando el rol activo es entrenador) limita los datos a los niveles propios |
| Asistencia | `services/asistenciaService.js` | `asistencia.api.js` | GET `/asistencia/planilla`, `/asistencia`; PUT `/asistencia/dia` (body `{ nivel, fecha: AAAA-MM-DD, registros: [{ usuario, tipoNovedad: Presente\|Tarde\|Inasistencia\|Justificado, motivo? }] }`; respuesta `{ success, msg, data, advertencias }`) |
| Justificaciones | `services/justificacionesService.js`, `rendimientoAtletaService.js` | `justificaciones.api.js` | GET/POST/PATCH `/justificacion` |
| Pagos (admin y atleta) | `services/pagosService.js` | `pagos.api.js`, `mensualidades.api.js`, `inscripciones_competencias.api.js` | GET/POST/PATCH `/pagos`, `/mensualidades`; **`GET /mensualidades/mi-plan`** (atleta: plan vigente, valor y día de corte); GET/POST `/inscripciones_competencias`. **Nuevo:** el atleta paga en efectivo con `PATCH /pagos/:id { metodoPago, fechaPago }` sin comprobante (el backend lo deja «Pendiente de confirmación» y avisa a los administradores); el admin lo confirma con `PATCH /pagos/:id { estado: 'Pagado' }`. La generación mensual automática no tiene botón en la interfaz: `POST /mensualidades/generar` (admin) |
| Métodos de pago | `services/MetodosPagoService.js` | `metodos_pago.api.js` | CRUD `/metodo-pago` (nombre + `qr` opcional + **`requiereComprobante`** + opcionales **`llave`, `numeroTelefono`, `numeroCuenta`**; Efectivo siempre `false` y sin datos). Un solo componente `DatosPagoMetodo` los muestra en todos los pagos |
| Planes asociados | `services/planesService.js` | `planes.api.js` | GET/POST/PATCH `/plan-asociado` (no hay DELETE: se deshabilita) |
| Habilidades (admin y entrenador, un solo módulo) | `services/rendimientoAdminService.js` | `habilidades.api.js`, `tipos_habilidad.api.js` | GET `/habilidad?nivelId=` (**nuevo**: nivel + generales; el entrenador solo sus niveles), PATCH `/habilidad` (entrenador: solo `estado`), POST `/habilidad` (solo admin, `nivel` opcional), GET `/tipo-habilidad` |
| Rendimiento (listado de TODOS los atletas) | `services/rendimientoAdminService.js`, `rendimientoAtletaService.js` | `rendimiento.api.js` | GET `/rendimiento/resumen` (todos los atletas con `edad` calculada en el backend y `rendimiento: null` si no tienen evaluaciones; el entrenador, solo sus niveles), GET/PUT `/rendimiento/atleta/:id` |
| Implementos y pedidos | `services/ImplementosService.js`, `PedidosService.js`, `SolicitudesService.js`, `ResenaService.js` | `implementos.api.js`, `solicitudes.api.js`, `resenas.api.js` | GET/POST/PATCH `/implementos`, `/solicitud`, `/resena`. **Nuevo:** `POST /solicitud { items, metodoPago, comprobante? }` crea el pago del pedido (efectivo sin comprobante → «Pendiente de confirmación» + aviso al admin); el listado trae `pago` poblado |
| PQRS | `services/pqrsService.js` | `pqrs.api.js`, `respuestas_pqrs.api.js` | GET/POST/PATCH `/pqrs`; GET/POST `/respuesta_pqrs` |
| Sesiones válidas (rendimiento) | `services/rendimientoAdminService.js` | `horarios.api.js` | **Nuevo:** GET `/horarios/sesiones?nivelId=&hasta=hoy&limite=` |
| Landing (niveles y horarios) | `services/landing.js` | `niveles.api.js` | GET `/niveles/publico` (sin token; ahora con `entrenador` y `horarios`) |
| Notificaciones (campana, `useNotificaciones`) | `services/notificacionesService.js` | `notificaciones.api.js` | GET `/notificaciones`, GET `/notificaciones/no-leidas` (polling 60 s); PATCH `/notificaciones/:id/leida`, `/notificaciones/leer-todas` |
| Dashboards | `pages/*/Dashboard/*Data.js` | `asistencia.api.js`, `rendimiento.api.js`, `mensualidades.api.js`, `pqrs.api.js`, `inscripciones_competencias.api.js` | lecturas GET de los anteriores |

Módulos del backend que existen y tienen archivo api pero la interfaz aún no usa: `implemento_talla.api.js`
(`/implementoTalla`), `solicitud_implementos.api.js` (`/solicitudImplementos`).

**Archivos pedidos en la referencia que NO se crearon** (no existe el recurso en el backend):
`roles.api.js` (el rol se cambia con `usuarios.api.js → cambiarRol`; no hay `/roles`) y `carrito.api.js`
(el carrito vive en el frontend, `CarritoContext`; al confirmar se crea una `solicitud`).

## Variables de entorno
- `VITE_API_URL`: origen del backend **sin** `/api`. Vacío en desarrollo (proxy de Vite).
- `VITE_PROXY_TARGET`: a dónde reenvía Vite `/api` y `/uploads` en desarrollo (debe coincidir con `PORT` del backend).
- Backend: `CORS_ORIGIN` (lista separada por comas). Solo hace falta si el frontend se sirve desde otro origen.


## Códigos visibles (consecutivos, los asigna el backend)
`IM001` implementos · `PG001` pagos · `HA001` habilidades · `SL001` pedidos. Cada lista/detalle devuelve `codigo`; las búsquedas
(`?buscar=`) lo aceptan. El `_id` interno solo se usa para relaciones y nunca se muestra. Migración de datos existentes:
`node --env-file .env scripts/migrar-codigos.js` (ver `docs/backend-cambios.md`).

## Dashboards
No hay `/dashboard/*`: se calculan con endpoints existentes (`/mensualidades`, `/competencias`, `/pqrs`, `/solicitud`, `/asistencia`, `/rendimiento`).
Cada tarjeta carga su fuente por separado (`hooks/useFuente.js`): esqueleto, error con «Reintentar» y mensaje de vacío; nunca cifras de relleno.

## Códigos visibles (actualizado)
Nuevos: `NV` niveles · `PL` planes · `MP` métodos de pago · `HR` horarios · `JU` justificaciones · `RS` reseñas · `RD` rendimiento ·
`NT` notificaciones · `CP` competencias · `IC` inscripciones. Sin cambios: `AT/EN/AD`, `PQ`, `IM`, `PG`, `HA`, `SL`.
