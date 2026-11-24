import { createContext, useContext, useState, useCallback } from "react";
import { almacenSesion } from "../api/client";
import { fijarRolActivo, rolActivoDe } from "../services/sesion";
import { rolesDe } from "../utils/roles";

const SesionContext = createContext(null);

// Forma que consumen las pantallas: { rol, rolPrincipal, roles, atletaId, usuario }
//   rol          = rol ACTIVO (el elegido en el selector del header; persiste al recargar)
//   rolPrincipal = el rol de la cuenta; roles = todos los que posee (principal + adicionales)
// (atletaId es el id real del usuario autenticado; antes era un valor fijo de prueba).
// Se lee del almacén en cada uso, así siempre refleja la sesión actual (login / logout).
function desdeAlmacen() {
  const usuario = almacenSesion.usuario();
  return usuario
    ? { rol: rolActivoDe(usuario), rolPrincipal: usuario.rol, roles: rolesDe(usuario), atletaId: usuario.id, usuario }
    : { rol: null, rolPrincipal: null, roles: [], atletaId: null, usuario: null };
}

export function SesionProvider({ children }) {
  const [, setVersion] = useState(0);
  // Fuerza que los componentes vuelvan a leer la sesión guardada
  const refrescar = useCallback(() => setVersion((v) => v + 1), []);

  // Cambia el rol activo (solo si el usuario lo posee) y vuelve a pintar
  const cambiarRol = useCallback((rol) => {
    const usuario = almacenSesion.usuario();
    if (!usuario || !rolesDe(usuario).includes(rol)) return false;
    fijarRolActivo(rol);
    setVersion((v) => v + 1);
    return true;
  }, []);

  return (
    <SesionContext.Provider value={{ refrescar, cambiarRol }}>
      {children}
    </SesionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSesion() {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error("useSesion debe usarse dentro de <SesionProvider>");
  return { sesion: desdeAlmacen(), refrescar: ctx.refrescar, cambiarRol: ctx.cambiarRol };
}
