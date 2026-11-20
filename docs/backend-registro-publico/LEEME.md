# Backend: listas públicas de niveles y planes (para el formulario de Registro)

> **Aplicado el 2026-11-20** directamente en el repo del backend (ver `docs/backend-cambios.md`). Esta guía queda como referencia.


El formulario de registro necesita mostrar los niveles y planes REALES, pero `GET /api/niveles` y
`GET /api/plan-asociado` exigen sesión. El frontend ya llama a estas dos rutas nuevas (sin token):

- `GET /api/niveles/publico`
- `GET /api/plan-asociado/publico`

Devuelven solo `_id` y `nombre` de lo que está **Activo** (el admin los gestiona en su CRUD, así que
el registro siempre refleja lo que él crea, edita o deshabilita).

> Este código lo agregan ustedes manualmente en el backend. No modifiqué el repositorio del backend.

## 1. `src/routes/niveles.routes.js`
Agregar ANTES de `router.get('/:id', ...)` (si queda después, Express tomará "publico" como un id):

```js
import NivelesModel from "../models/niveles.models.js"; // ajustar al nombre real del modelo

router.get('/publico', async (req, res) => {
    try {
        const data = await NivelesModel.find({ estado: 'Activo' }).select('_id nombre').sort({ nombre: 1 });
        res.json({ msg: 'Niveles disponibles para el registro', data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'No se pudieron consultar los niveles' });
    }
});
```

## 2. `src/routes/planAsociado.routes.js`
Igual: antes de `router.get('/:id', ...)`.

```js
import PlanAsociadoModel from "../models/planAsociado.models.js"; // ajustar al nombre real del archivo

router.get('/publico', async (req, res) => {
    try {
        const data = await PlanAsociadoModel.find({ estado: 'Activo' }).select('_id nombre').sort({ nombre: 1 });
        res.json({ msg: 'Planes disponibles para el registro', data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'No se pudieron consultar los planes' });
    }
});
```

## 3. Rate limit (opcional)
Si usan `express-rate-limit` en `/api/auth`, aplicar el mismo limitador a estas dos rutas.

## Relación usuario–nivel–plan
El registro ya envía `nivel` y `planAsociado` (ids) a `POST /api/auth/registro`, y el backend los guarda
en el usuario. No hace falta tabla adicional.
