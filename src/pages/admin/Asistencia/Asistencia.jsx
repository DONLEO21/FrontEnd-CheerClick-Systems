import { useEffect, useState } from "react";
import AsistenciaJustificaciones from "./AsistenciaJustificaciones";
import { obtenerNiveles } from "../../../services/asistenciaService";
import EstadoError from "../../../components/Compartidos/EstadoError";

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

  if (error) {
    return (
      <div className="p-4">
        <h1>Asistencia</h1>
        <EstadoError mensaje={error} onReintentar={cargar} />
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="p-4" aria-busy="true" aria-label="Cargando niveles">
        <div className="ui-skeleton-grupo">
          {Array.from({ length: 3 }, (_, i) => <span key={i} className="ui-skeleton ui-skeleton--bloque" />)}
        </div>
      </div>
    );
  }

  return <AsistenciaJustificaciones niveles={niveles} />;
}