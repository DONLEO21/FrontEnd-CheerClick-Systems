import { useCallback, useEffect, useState } from "react";

/**
 * Carga UNA fuente de datos y expone { datos, cargando, error, recargar }. Cada tarjeta de un dashboard usa la suya,
 * así que si una falla las demás siguen funcionando y solo esa muestra "Reintentar". Nunca inventa datos de relleno.
 * `cargar` debe ser una función estable (definida fuera del componente o con useCallback).
 */
export default function useFuente(cargar) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: "" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vivo = true;
    cargar()
      .then((datos) => vivo && setEstado({ datos, cargando: false, error: "" }))
      .catch((e) => vivo && setEstado({ datos: null, cargando: false, error: e?.message || "No se pudo cargar la información." }));
    return () => { vivo = false; };
  }, [cargar, intento]);

  const recargar = useCallback(() => {
    setEstado((s) => ({ ...s, cargando: true, error: "" }));
    setIntento((n) => n + 1);
  }, []);

  return { ...estado, recargar };
}
