import { CheckCircle2, Pencil, Power, Ban } from "lucide-react";
import { etiquetaTipoHabilidad } from "../../../components/utils/nivelEstilosHabilidad";

/**
 * Tarjeta de una habilidad (Gestión de habilidades, admin y entrenador).
 * puedeEditar: solo el administrador. Habilitar/deshabilitar lo pueden hacer ambos roles.
 * TODO(backend): la habilidad no guarda descripción; la tarjeta muestra código, nombre, tipo, nivel y estado.
 */
export default function TarjetaHabilidad({ habilidad: h, puedeEditar, onEditar, onCambiarEstado }) {
  const deshabilitada = h.estado === "inhabilitada";

  return (
    <article className={`adm-hab-card${deshabilitada ? " adm-hab-card--off" : ""}`}>
      <header className="adm-hab-card__cabeza">
        <span className="adm-hab-card__id">{h.codigo || "—"}</span>
        <span className={`adm-hab-estado ${deshabilitada ? "adm-hab-estado--off" : "adm-hab-estado--on"}`}>
          {deshabilitada ? <Ban size={13} aria-hidden="true" /> : <CheckCircle2 size={13} aria-hidden="true" />}
          {deshabilitada ? "Deshabilitada" : "Activa"}
        </span>
      </header>

      <h3 className="adm-hab-card__nombre">{h.texto}</h3>

      <div className="adm-hab-card__etiquetas">
        <span className={`adm-hab-tipo adm-hab-tipo--${h.categoria || "otro"}`}>{etiquetaTipoHabilidad(h.categoria) || "Sin tipo"}</span>
        <span className="adm-hab-nivel" title="Nivel de la habilidad">{h.nivel || "Todos los niveles"}</span>
      </div>

      <footer className="adm-hab-card__acciones">
        {puedeEditar && (
          <button type="button" className="ui-accion ui-accion--editar" title="Editar" aria-label={`Editar ${h.texto}`} onClick={() => onEditar(h)}>
            <Pencil size={16} />
          </button>
        )}
        <button
          type="button"
          className={`ui-accion ${deshabilitada ? "ui-accion--ok" : "ui-accion--peligro"}`}
          title={deshabilitada ? "Habilitar" : "Deshabilitar"}
          aria-label={`${deshabilitada ? "Habilitar" : "Deshabilitar"} ${h.texto}`}
          onClick={() => onCambiarEstado(h)}
        >
          <Power size={16} />
        </button>
      </footer>
    </article>
  );
}
