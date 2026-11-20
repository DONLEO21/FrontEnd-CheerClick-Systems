import { createContext, useContext, useState, useCallback } from "react";
import { almacenSesion } from "../api/client";

const SesionContext = createContext(null);

// Forma que consumen las pantallas: { rol, atletaId, usuario }
// (atletaId es el id real del usuario autenticado; antes era un valor fijo de prueba).
// Se lee del almacén en cada uso, así siempre refleja la sesión actual (login / logout).
function desdeAlmacen() {
  const usuario = almacenSesion.usuario();
  return usuario
    ? { rol: usuario.rol, atletaId: usuario.id, usuario }
    : { rol: null, atletaId: null, usuario: null };
}

export function SesionProvider({ children }) {
  const [, setVersion] = useState(0);
  // Fuerza que los componentes vuelvan a leer la sesión guardada
  const refrescar = useCallback(() => setVersion((v) => v + 1), []);

  return (
    <SesionContext.Provider value={{ refrescar }}>
      {children}
    </SesionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSesion() {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error("useSesion debe usarse dentro de <SesionProvider>");
  return { sesion: desdeAlmacen(), refrescar: ctx.refrescar };
}
