# 3. Servicios: asignar el código al crear

`BackEnd/src/services/pagos.services.js`

```js
import { generarCodigo } from "../helpers/codigo.helpers.js";   // <- agregar el import

const dbInsertPago = async (newPago) => {
    newPago.codigo = await generarCodigo(PagosModel, 'PG');     // <- agregar esta línea
    return await PagosModel.create(newPago);
}
```

`BackEnd/src/services/habilidades.services.js`

```js
import { generarCodigo } from "../helpers/codigo.helpers.js";   // <- agregar el import

const dbCreateHabilidad = async (newHabilidad) => {
    newHabilidad.codigo = await generarCodigo(HabilidadesModel, 'HA');   // <- agregar esta línea
    return await HabilidadesModel.create(newHabilidad)
}
```

Implementos ya llama `generarCodigo(ImplementoModel, 'IM')`: con el helper nuevo pasa a dar IM001, IM002…
