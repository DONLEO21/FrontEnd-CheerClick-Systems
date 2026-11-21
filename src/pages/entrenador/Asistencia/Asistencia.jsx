import { useEffect, useState } from "react";
import AsistenciaJustificaciones from "../../../pages/admin/Asistencia/AsistenciaJustificaciones";
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
      <div className="p-4">
        <p>Cargando tu nivel asignado…</p>
      </div>
    );
  }

  if (niveles.length === 0) {
    return (
      <div className="p-4">
        <h1>Asistencia</h1>
        <p>Aún no tienes un nivel asignado como entrenador.</p>
      </div>
    );
  }

  return (
    <AsistenciaJustificaciones
      niveles={niveles}
      subtitulo={
        niveles.length > 1
          ? "Asistencia de tus niveles asignados."
          : "Asistencia de tu nivel asignado."
      }
    />
  );
}
