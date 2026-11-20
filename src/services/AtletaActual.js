// Datos del usuario autenticado (antes eran valores fijos de prueba).
import { almacenSesion } from "../api/client";

const nombreCompleto = () => {
  const u = almacenSesion.usuario();
  return u ? [u.nombre, u.apellido].filter(Boolean).join(" ") : "";
};

export const ATLETA_ACTUAL = {
  get nombre() { return nombreCompleto(); },
  // TODO(backend): el login solo devuelve el id del nivel, no su nombre.
  get categoria() { return ""; },
};

export const ENTRENADOR_ACTUAL = {
  get nombre() { return nombreCompleto(); },
};
