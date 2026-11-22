import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { nombreDeRuta, tituloCompleto } from "../constants/titulosRutas";

/**
 * Pone el título de la pestaña: "<Módulo> | CheerClick". Se llama UNA vez por layout (PanelLayout, Landing y AuthPage),
 * no en cada página. `nombre` (opcional) fuerza el nombre cuando la pantalla no se distingue por la ruta (p. ej. las
 * pantallas internas de /acceso). Sin nombre ni ruta conocida queda "CheerClick".
 */
export default function useTituloPagina(nombre) {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = tituloCompleto(nombre ?? nombreDeRuta(pathname));
  }, [pathname, nombre]);
}
