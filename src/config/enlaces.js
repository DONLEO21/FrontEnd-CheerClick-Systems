// Enlaces externos del club (no dependen del usuario ni de la base de datos).
// Se cambian en el archivo .env con VITE_POLIZA_URL (ver .env.example); si no está, el botón sale deshabilitado.
export const URL_POLIZA = (import.meta.env.VITE_POLIZA_URL ?? '').trim();
