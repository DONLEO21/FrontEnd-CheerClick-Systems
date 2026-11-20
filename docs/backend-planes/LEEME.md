# Backend: descripción en los planes asociados

> **Aplicado el 2026-11-20** directamente en el repo del backend (ver `docs/backend-cambios.md`). Esta guía queda como referencia.


El CRUD de planes (pestaña **Pagos → Planes asociados**) usa `GET/POST/PATCH /api/plan-asociado`, que ya existen.
No hay `DELETE`: el plan se "deshabilita" con `estado: 'Inactivo'` y se vuelve a habilitar con `'Activo'`.

Lo único que falta es el campo **descripción** (el modelo actual solo tiene `nombre`, `valor`, `estado`).
El frontend ya la envía y la muestra; mientras el modelo no la tenga, Mongoose la ignora.

## `src/models/planAsociado.model.js` — agregar dentro del schema
```js
descripcion: {
    type: String,
    trim: true,
    maxlength: [200, 'La descripción no puede superar los 200 caracteres'],
    default: ''
},
```

## Observación sobre el valor
En el modelo, `min: [true, '...']` equivale a `min: 1` (true se convierte en 1). Funciona, pero lo correcto es:
```js
min: [1, 'El valor del plan debe ser mayor a 0']
```

## Para el registro público
Ver `docs/backend-registro-publico/LEEME.md` (`GET /api/plan-asociado/publico`, solo planes Activos).
