# 2. Modelos: agregar el campo `codigo`

En `BackEnd/src/models/pagos.model.js`, dentro de `PagosSchema` (junto a `estado`):

```js
    codigo: {
        type: String,
        unique: true,
        sparse: true      // los pagos anteriores sin código no chocan entre sí
    },
```

En `BackEnd/src/models/habilidades.model.js`, dentro de `HabilidadesSchema` (junto a `nombre`):

```js
    codigo: {
        type: String,
        unique: true,
        sparse: true
    },
```

(`implementos` y `solicitud` ya tienen `codigo`.)
