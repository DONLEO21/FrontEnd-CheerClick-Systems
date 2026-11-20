
import { Reply, Pencil, Power } from "lucide-react";
import { ESTADOS, PRIORIDADES, etiquetaDe, radicadoDe } from "./pqrsData";

const formatearFecha = (iso) => {
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
};

export default function FilaPqrs({ pqrs, onResponder, onModificar, onInhabilitar }) {
  const inhabilitada = pqrs.inhabilitada;
  const resuelta = pqrs.estado === "resuelto";

  const motivoResponder = inhabilitada
    ? "Habilita la PQRS para poder responderla"
    : resuelta
    ? "Esta PQRS ya fue resuelta"
    : undefined;

  return (
    <tr className={inhabilitada ? "pqrs-fila--inhabilitada" : ""}>
      <td>{radicadoDe(pqrs)}</td>
      <td>{pqrs.asunto}</td>
      <td>
        <span className={`pqrs-insignia pqrs-estado--${pqrs.estado}`}>
          {etiquetaDe(ESTADOS, pqrs.estado)}
        </span>
      </td>
      <td>
        <span className={`pqrs-insignia pqrs-prioridad--${pqrs.prioridad}`}>
          {etiquetaDe(PRIORIDADES, pqrs.prioridad)}
        </span>
      </td>
      <td>
        <time dateTime={pqrs.fecha}>{formatearFecha(pqrs.fecha)}</time>
      </td>
      <td>{pqrs.remitente}</td>
      <td>
        <div className="ui-acciones">
          <button
            type="button"
            className="ui-accion ui-accion--info"
            disabled={inhabilitada || resuelta}
            title={motivoResponder ?? "Responder"}
            aria-label="Responder PQRS"
            onClick={() => onResponder(pqrs)}
          >
            <Reply size={16} />
          </button>
          <button
            type="button"
            className="ui-accion ui-accion--editar"
            disabled={inhabilitada}
            title="Modificar"
            aria-label="Modificar PQRS"
            onClick={() => onModificar(pqrs)}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className={"ui-accion " + (inhabilitada ? "ui-accion--ok" : "ui-accion--peligro")}
            title={inhabilitada ? "Habilitar" : "Inhabilitar"}
            aria-label={inhabilitada ? "Habilitar PQRS" : "Inhabilitar PQRS"}
            onClick={() => onInhabilitar(pqrs)}
          >
            <Power size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
