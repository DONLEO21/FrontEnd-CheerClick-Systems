import { useCallback, useEffect, useState } from "react";
import AsistenciaPanel from "./AsistenciaPanel";
import JustificacionesPanel from "./JustificacionPanel";
import { obtenerJustificaciones } from "../../../services/justificacionesService";
import EstadoError from "../../../components/Compartidos/EstadoError";
import "./Asistencia.css";

function AsistenciaJustificacionesContenido({ niveles = [], subtitulo, cargandoNiveles = false, errorNiveles = "", onReintentarNiveles }) {
  const [vista, setVista] = useState("asistencia"); // "asistencia" | "justificaciones"
  // TODO: el contador de pendientes aún no se muestra en la UI
  // eslint-disable-next-line no-unused-vars
  const [pendientes, setPendientes] = useState(0);

  const nivelIds = niveles.map((n) => String(n.id));
  const claveNiveles = nivelIds.join(",");

  const actualizarConteoPendientes = useCallback(() => {
    if (nivelIds.length === 0) {
      setPendientes(0);
      return;
    }
    obtenerJustificaciones()
      .then((data) => {
        const propias = data.filter((j) => nivelIds.includes(String(j.nivelId)));
        setPendientes(propias.filter((j) => j.estado === "pendiente").length);
      })
      .catch(() => setPendientes(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nivelIds se recalcula solo cuando cambia claveNiveles
  }, [claveNiveles]);

  useEffect(() => {
    actualizarConteoPendientes();
  }, [actualizarConteoPendientes]);

  return (
    <div className="p-4">
      <div className="ui-tabs" role="tablist" style={{ marginBottom: 16 }}>
        <button
          type="button"
          role="tab"
          aria-selected={vista === "asistencia"}
          className={`ui-tab${vista === "asistencia" ? " ui-tab--activa" : ""}`}
          onClick={() => setVista("asistencia")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
          </svg>
          Tomar asistencia
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={vista === "justificaciones"}
          className={`ui-tab${vista === "justificaciones" ? " ui-tab--activa" : ""}`}
          onClick={() => setVista("justificaciones")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Justificaciones
        </button>
      </div>

      {cargandoNiveles ? (
        <div className="ui-skeleton-grupo" aria-busy="true" aria-label="Cargando niveles">
          {Array.from({ length: 3 }, (_, i) => <span key={i} className="ui-skeleton ui-skeleton--bloque" />)}
        </div>
      ) : errorNiveles ? (
        <EstadoError mensaje={errorNiveles} onReintentar={onReintentarNiveles} />
      ) : vista === "asistencia" ? (
        <AsistenciaPanel niveles={niveles} subtitulo={subtitulo} />
      ) : (
        <JustificacionesPanel
          niveles={niveles}
          onCambio={actualizarConteoPendientes}
        />
      )}
    </div>
  );
}

// Clase raíz del módulo: todos sus estilos viven bajo .adm-asistencia
export default function AsistenciaJustificaciones(props) {
  return (
    <div className="adm-asistencia">
      <AsistenciaJustificacionesContenido {...props} />
    </div>
  );
}
