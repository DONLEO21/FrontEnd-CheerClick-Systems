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
