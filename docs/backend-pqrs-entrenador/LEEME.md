# Backend: el Entrenador puede ENVIAR PQRS (pero no verlas ni responderlas)

El frontend ya tiene la pantalla `/entrenador/pqrs` (solo formulario de envío). Falta permitirle al
rol `Entrenador` hacer el `POST`. No modifiqué el backend; este cambio lo agregan ustedes.

## `src/routes/pqrs.routes.js`
Solo cambia la línea del POST (agregar `'Entrenador'`). El GET, PATCH y las respuestas se quedan
como están, así el entrenador NO puede listar ni responder PQRS:

```js
router.post('/', [authMiddleware, authorizationMiddleware(['Atleta', 'Entrenador'])], createPqrs);
```

El controlador (`createPqrs`) ya toma el remitente de `req.userFound._id`, por lo que funciona igual
para el entrenador. `dbGetPqrs` ya limita al atleta a sus propias PQRS; el entrenador no tiene acceso
al GET, así que no ve nada.
