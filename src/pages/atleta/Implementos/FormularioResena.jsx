import { Fragment, useState } from "react";
import { crearResena } from "../../../services/ResenaService";
import { marcarResenaEnviada } from "../../../services/PedidosService";
import { ATLETA_ACTUAL } from "../../../services/AtletaActual";
import { hoyISO } from "../../../data/pedidos";

// Reseña de UN producto del pedido (cada producto se califica por separado)
export default function FormularioResena({ pedido, item, onEnviada }) {
  const [abierto, setAbierto] = useState(false);
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const idBase = `rating-${pedido.id}-${item.implementoId}-${item.talla}`.replace(/\s+/g, "");

  const enviar = async () => {
    if (!calificacion) {
      setError("Selecciona una calificación.");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      await crearResena({
        implementoId: item.implementoId,
        implementoNombre: item.implementoNombre,
        pedidoId: pedido.id,
        atleta: ATLETA_ACTUAL.nombre,
        calificacion,
        comentario,
        fecha: hoyISO(),
      });
      await marcarResenaEnviada(pedido.id, item);
      onEnviada();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) {
    return (
      <button type="button" className="btn-abrir-resena" onClick={() => setAbierto(true)}>
        ★ Calificar este producto
      </button>
    );
  }

  return (
    <div className="seccion-comentario-recibido">
      <label>Tu reseña de {item.implementoNombre} (opcional):</label>

      <div className="estrellas-rating" role="group" aria-label="Calificación del producto">
        {[5, 4, 3, 2, 1].map((valor) => (
          <Fragment key={valor}>
            <input
              type="radio"
              id={`${idBase}-${valor}`}
              name={idBase}
              checked={calificacion === valor}
              onChange={() => setCalificacion(valor)}
            />
            <label htmlFor={`${idBase}-${valor}`} title={`${valor} estrellas`}>★</label>
          </Fragment>
        ))}
      </div>

      {error && <p className="alerta-error">{error}</p>}

      <textarea
        placeholder="Ej: El producto llegó en perfectas condiciones…"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />

      <button type="button" className="btn-enviar-comentario" onClick={enviar} disabled={enviando}>
        {enviando ? "Enviando..." : "Enviar reseña"}
      </button>
    </div>
  );
}
