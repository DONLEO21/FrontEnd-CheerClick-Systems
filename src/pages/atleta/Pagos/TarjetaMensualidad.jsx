import { pesos, ESTADOS, accionDePago } from "../../../components/utils/PagosAtleta";

const CLASE_ESTADO = {
  pagado: "atl-esta-paga",
  pendiente: "atl-esta-pen",
  vencido: "atl-esta-ven",
  rechazado: "atl-esta-ven",
};

function TarjetaMensualidad({ mensualidad, onSubir, onVer }) {
  const estado = ESTADOS[mensualidad.estado] ?? ESTADOS.pendiente;
  const claseEstado = CLASE_ESTADO[mensualidad.estado] ?? CLASE_ESTADO.pendiente;
  const accion = accionDePago(mensualidad); // registrado | verificando | reintentar | pagar (ver utils/PagosAtleta.js)
  const efectivo = !!mensualidad.efectivo;

  const textoFecha =
    accion === "registrado"
      ? `Pagado: ${mensualidad.fechaPago ?? "—"} · ${mensualidad.metodo ?? ""}`
      : accion === "verificando"
        ? mensualidad.efectivoSolicitado ? "Pago en efectivo · pendiente de confirmación" : "Comprobante enviado · en verificación"
        : accion === "reintentar"
          ? `Rechazado${mensualidad.observaciones ? `: ${mensualidad.observaciones}` : ""}`
          : `Generado: ${mensualidad.generacion}`;

  return (
    <div className="atl-tar-infor">
      <h4 className="atl-tar-titulo">{mensualidad.mes}</h4>
      <button type="button" className={claseEstado}>{estado.texto}</button>
      <h3 className="atl-tar-precio">{pesos(mensualidad.valor)}</h3>
      <p className="atl-tar-fecha">{textoFecha}</p>

      {accion === "registrado" && (
        mensualidad.comprobante && !efectivo ? (
          <button type="button" className="atl-ver-compro" onClick={() => onVer(mensualidad)}>
            <IconoOjo /> Ver comprobante
          </button>
        ) : (
          <span className="atl-pago-registrado" role="status">
            <IconoCheck /> {efectivo ? "Pago en efectivo registrado" : "Pago registrado"}
          </span>
        )
      )}

      {accion === "verificando" && (
        <button type="button" className="atl-subir-compro" disabled aria-disabled="true" title="Ya enviaste un pago: el club lo está verificando">
          <IconoReloj /> Pago en verificación
        </button>
      )}

      {(accion === "pagar" || accion === "reintentar") && (
        <button type="button" className="atl-subir-compro" onClick={() => onSubir(mensualidad)}>
          <IconoTarjeta /> {accion === "reintentar" ? "Volver a pagar" : "Pagar mensualidad"}
        </button>
      )}
    </div>
  );
}

const trazo = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className: "atl-sim-compro", "aria-hidden": true };
const IconoTarjeta = () => (<svg {...trazo}><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>);
const IconoCheck = () => (<svg {...trazo}><path d="M20 6 9 17l-5-5" /></svg>);
const IconoReloj = () => (<svg {...trazo}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>);
const IconoOjo = () => (
  <svg {...trazo}><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
);
export default TarjetaMensualidad;
