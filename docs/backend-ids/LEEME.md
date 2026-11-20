# IDs consecutivos (IM001, PG001, HA001) — pasos para el backend

1. Reemplazar `src/helpers/codigo.helpers.js` por `1-codigo.helpers.js`.
2. Agregar el campo `codigo` en los modelos de Pagos y Habilidades (`2-modelos.md`).
3. Asignar el código al crear pagos y habilidades (`3-servicios.md`).
4. (Opcional) Numerar lo que ya existe con `4-asignar-codigos-existentes.js`.
5. Reiniciar el backend.

El frontend ya muestra `codigo` cuando existe y, si todavía no, muestra el id interno.
No hay ninguna utilidad de ids en el frontend.
