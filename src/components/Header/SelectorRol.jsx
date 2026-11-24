import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useSesion } from "../../context/SesionContext";
import { RUTA_INICIO } from "../../services/sesion";
import { ETIQUETA_ROL } from "../../utils/roles";

/**
 * Etiqueta de rol del encabezado. Con un solo rol es solo texto; si el usuario tiene más de uno (p. ej. un administrador
 * que también entrena) se vuelve un desplegable para cambiar de rol. Al elegir uno se guarda como rol activo y se navega a
 * su panel; menú, barra lateral, dashboard y título cambian porque salen de la ruta del rol.
 */
export default function SelectorRol({ rol }) {
  const { sesion, cambiarRol } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => setAbierto(false), [pathname]);
  useEffect(() => {
    if (!abierto) return;
    const alClicFuera = (e) => {
      if (!contenedorRef.current?.contains(e.target)) setAbierto(false);
    };
    const alEscape = (e) => e.key === "Escape" && setAbierto(false);

    document.addEventListener("click", alClicFuera);
    document.addEventListener("keydown", alEscape);
    return () => {
      document.removeEventListener("click", alClicFuera);
      document.removeEventListener("keydown", alEscape);
    };
  }, [abierto]);

  // Un usuario con un solo rol no ve el desplegable
  if (sesion.roles.length < 2) {
    return <span className="etiqueta-rol">{rol}</span>;
  }

  const elegir = (nuevo) => {
    setAbierto(false);
    if (nuevo === sesion.rol && pathname.startsWith(RUTA_INICIO[nuevo])) return;
    if (cambiarRol(nuevo)) navigate(RUTA_INICIO[nuevo]);
  };

  return (
    <div className={`selector-rol ${abierto ? "abierto" : ""}`} ref={contenedorRef}>
      <button
        type="button"
        className="etiqueta-rol"
        onClick={() => setAbierto((a) => !a)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={`Rol activo: ${rol}. Cambiar de rol`}
      >
        {rol}
        <i className="bi bi-chevron-down chevron-rol" aria-hidden="true" />
      </button>

      <div className="menu-rol" role="menu">
        {sesion.roles.map((r) => (
          <button
            key={r}
            type="button"
            className={`menu-rol__opcion ${r === sesion.rol ? "menu-rol__opcion--activa" : ""}`}
            role="menuitemradio"
            aria-checked={r === sesion.rol}
            onClick={() => elegir(r)}
          >
            {ETIQUETA_ROL[r] ?? r}
            {r === sesion.rol && <Check size={14} strokeWidth={2.5} aria-hidden="true" />}
          </button>
        ))}
      </div>
    </div>
  );
}
