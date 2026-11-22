import { useEffect, useState } from "react";
import AsistenciaJustificaciones from "./AsistenciaJustificaciones";
import { obtenerNiveles } from "../../../services/asistenciaService";

export default function Asistencia() {
  const [niveles, setNiveles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = () => {
    setCargando(true);
    setError("");
    obtenerNiveles()
      // el backend ya devuelve solo los niveles que puede ver el rol (el entrenador, los suyos)
      .then((data) => setNiveles(data.filter((n) => !n.inhabilitado)))
      .catch((e) => setError(e?.message || "No se pudieron cargar los niveles."))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  // Las pestañas "Tomar asistencia" / "Justificaciones" SIEMPRE se ven: si los niveles cargan, fallan o no existen,
  // lo dice el contenido de la pestaña (con Reintentar), no desaparece el módulo.
  return <AsistenciaJustificaciones niveles={niveles} cargandoNiveles={cargando} errorNiveles={error} onReintentarNiveles={cargar} />;
}
