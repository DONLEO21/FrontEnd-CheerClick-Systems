
import { formatearFechaCorta, formatearMoneda } from "./horariosAtletaData";

// Estado de la inscripción: si ya pagó o está pendiente de verificación, la tarjeta lo muestra en vez del botón "Pagar"
const ETIQUETA_INSCRIPCION = {
  pendiente: "Pago pendiente de verificación",
  pagado: "Inscripción pagada",
  rechazado: "Pago rechazado",
};

export default function TarjetaCampeonatoAtleta({ torneo, inscripcion, onVerDetalles, onPagar }) {
  const estado = inscripcion?.estado;
  return (
    <article className="tarjeta-campeonato" role="listitem">
      <figure className="imagen-campeonato">
        {torneo.imagen ? (
          <img src={torneo.imagen} alt={torneo.nombre} />
        ) : (
          <div className="placeholder-imagen-campeonato">
            <i className="bi bi-trophy" />
          </div>
        )}
      </figure>
      <div className="cuerpo-tarjeta-campeonato">
        <header className="cabecera-info-campeonato">
          <h3 className="nombre-campeonato">{torneo.nombre}</h3>
          <time className="fecha-campeonato">{formatearFechaCorta(torneo.fecha)}</time>
        </header>
        <p className="ciudad-campeonato"><i className="bi bi-geo-alt" /> {torneo.ciudad}</p>
        <p className="costo-campeonato">{formatearMoneda(torneo.costo)} inscripción</p>
      </div>
      <footer className="acciones-campeonato">
        <button className="btn-detalles-campeonato" type="button" onClick={() => onVerDetalles(torneo)}>
          Ver detalles
        </button>
        {estado === "pendiente" || estado === "pagado" ? (
          <span className={`estado-inscripcion estado-inscripcion--${estado}`} role="status">
            <i className={`bi ${estado === "pagado" ? "bi-check-circle-fill" : "bi-hourglass-split"}`} /> {ETIQUETA_INSCRIPCION[estado]}
          </span>
        ) : (
          <button className="btn-pagar-campeonato" type="button" onClick={() => onPagar(torneo)}>
            <i className="bi bi-credit-card" /> {estado === "rechazado" ? "Reenviar comprobante" : "Pagar"}
          </button>
        )}
      </footer>
    </article>
  );
}
