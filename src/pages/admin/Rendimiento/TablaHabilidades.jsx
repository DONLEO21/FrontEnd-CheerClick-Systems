import { Power } from "lucide-react";
import {
  obtenerClaseTipoHabilidad,
  etiquetaTipoHabilidad,
} from "../../../components/utils/nivelEstilosHabilidad";

function TablaHabilidades({
  habilidades,
  onEditar,
  onCambiarEstado,
}) {
  return (
    <section className="container adm-rendimiento-panel-h">
      <table className="table align-middle adm-rendimiento-tabla-h">
        <thead>
          <tr>
            <td>ID</td>
            <td>Habilidad</td>
            <td>Tipo</td>
            <td>Estado</td>
            <td>Acciones</td>
          </tr>
        </thead>
        <tbody>
          {habilidades.length > 0 ? (
            habilidades.map((h) => (
              <tr key={h.id}>
                <td>
                  <span>{h.codigo ?? h.id}</span>
                </td>

                <td className="edad-ne">{h.texto}</td>

                <td>
                  <button className={obtenerClaseTipoHabilidad(h.categoria)}>
                    {etiquetaTipoHabilidad(h.categoria)}
                  </button>
                </td>

                <td>
                  {h.estado === "inhabilitada" ? (
                    <button
                      className="adm-rendimiento-btn-desa"
                      onClick={() => onCambiarEstado(h)}
                      title="Click para habilitar"
                    >
                      <svg
                        className="adm-rendimiento-sim-desa"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M4.929 4.929 19.07 19.071" />
                      </svg>{" "}
                      Deshabilitada
                    </button>
                  ) : (
                    <button
                      className="adm-rendimiento-btn-activ"
                      onClick={() => onCambiarEstado(h)}
                      title="Click para deshabilitar"
                    >
                      <svg
                        className="adm-rendimiento-sim-acti"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>{" "}
                      Activa
                    </button>
                  )}
                </td>

                <td>
                  <div className="adm-rendimiento-con-acci">
                    <button className="btn-lapiz" title="Editar" aria-label={`Editar ${h.texto}`} onClick={() => onEditar(h)}>
                      <i className="svg-de bi bi-pencil"></i>
                    </button>

                    <button
                      type="button"
                      className={"btn-estado" + (h.estado === "inhabilitada" ? " btn-estado--habilitar" : "")}
                      title={h.estado === "inhabilitada" ? "Habilitar" : "Deshabilitar"}
                      aria-label={(h.estado === "inhabilitada" ? "Habilitar " : "Deshabilitar ") + h.texto}
                      onClick={() => onCambiarEstado(h)}
                    >
                      <Power size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center py-4 text-muted">
                No se encontraron habilidades que coincidan con la búsqueda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

export default TablaHabilidades;