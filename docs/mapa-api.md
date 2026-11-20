# Mapa de la capa de conexión (frontend → api → endpoints)

Toda petición HTTP sale de `src/api/client.js` (axios, una sola instancia). Cada recurso del backend tiene su
archivo `src/api/<recurso>.api.js`. Los `services/*.js` son una capa delgada que **mapea datos** (formato del
backend → formato de la interfaz) y llama a esos módulos; los componentes no usan axios ni `fetch` para el backend.

**Forma de las respuestas** (verificada en el backend): éxito `{ msg, data?, token? }` (la asistencia agrega
`success: true`); error `{ msg }` o `{ errors: { campo: 'mensaje' } }`. `client.js` devuelve el cuerpo ya
desempaquetado y lanza `ApiError` (mensaje legible) en los errores. Token: cabecera `X-Token`.

| Módulo del frontend | Servicio | Archivo api | Endpoints |
|---|---|---|---|
| Login, registro, recuperar clave | `services/sesion.js` | `auth.api.js` | POST `/auth/login`, `/auth/registro`, `/auth/olvide-contrasena`, `/auth/reenviar-codigo`, `/auth/verificar-codigo`, `/auth/restablecer-contrasena`; GET `/auth/renovar-token` |
| Registro público (niveles/planes) | `services/catalogos.js` | `niveles.api.js`, `planes.api.js` | GET `/niveles/publico`, `/plan-asociado/publico` (sin token) |
| Cuentas (admin) | `services/adminUsuarios.js` | `usuarios.api.js` | GET `/usuarios/solicitudes`, `/usuarios`, `/usuarios/:id/detalle`, `/usuarios/:id/certificado-eps`; POST `/usuarios`; PATCH `/usuarios/solicitudes/:id/aprobar\|rechazar`, `/usuarios/:id/status\|rol` |
| Perfil (3 roles) | `services/perfil.js` | `perfil.api.js`, `contacto_emergencia.api.js` | GET/PATCH `/perfilusuario/me`; POST `/perfilusuario`; PUT `/perfilusuario/me/foto\|certificado-eps\|contactos` (multipart la foto y el certificado); GET `/perfilusuario/me/certificado-eps` |
| Niveles / Horarios | `services/horariosService.js` | `niveles.api.js`, `horarios.api.js`, `plantilla_horario.api.js`, `competencias.api.js` | CRUD `/niveles`, `/horarios`, `/plantilla_horario`, `/competencias` |
| Asistencia | `services/asistenciaService.js` | `asistencia.api.js` | GET `/asistencia/planilla`, `/asistencia`; PUT `/asistencia/dia` |
| Justificaciones | `services/justificacionesService.js`, `rendimientoAtletaService.js` | `justificaciones.api.js` | GET/POST/PATCH `/justificacion` |
| Pagos (admin y atleta) | `services/pagosService.js` | `pagos.api.js`, `mensualidades.api.js`, `inscripciones_competencias.api.js` | GET/POST/PATCH `/pagos`, `/mensualidades`; GET/POST `/inscripciones_competencias` |
| Métodos de pago | `services/MetodosPagoService.js` | `metodos_pago.api.js` | CRUD `/metodo-pago` (nombre + `qr` opcional) |
| Planes asociados | `services/planesService.js` | `planes.api.js` | GET/POST/PATCH `/plan-asociado` (no hay DELETE: se deshabilita) |
| Habilidades / Rendimiento | `services/rendimientoAdminService.js`, `rendimientoAtletaService.js` | `habilidades.api.js`, `tipos_habilidad.api.js`, `rendimiento.api.js` | GET/POST/PATCH `/habilidad`, GET `/tipo-habilidad`, GET `/rendimiento`, GET/PUT `/rendimiento/atleta/:id` |
| Implementos y pedidos | `services/ImplementosService.js`, `PedidosService.js`, `SolicitudesService.js`, `ResenaService.js` | `implementos.api.js`, `solicitudes.api.js`, `resenas.api.js` | GET/POST/PATCH `/implementos`, `/solicitud`, `/resena` |
| PQRS | `services/pqrsService.js` | `pqrs.api.js`, `respuestas_pqrs.api.js` | GET/POST/PATCH `/pqrs`; GET/POST `/respuesta_pqrs` |
| Notificaciones (campana) | `services/notificacionesService.js` | `notificaciones.api.js` | GET `/notificaciones`; PATCH `/notificaciones/:id/leida`, `/notificaciones/leer-todas` |
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
