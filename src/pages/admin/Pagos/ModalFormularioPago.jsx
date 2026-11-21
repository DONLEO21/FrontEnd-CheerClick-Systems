import { useState } from "react";
import Modal from "./Modal";

function ModalFormularioPago({ pago, metodos = [], guardando, onCerrar, onGuardar }) {
  const [fecha, setFecha] = useState("");
  const [metodoId, setMetodoId] = useState("");
  const [observaciones, setObservaciones] = useState("");
  

  const listo = !!fecha && !!metodoId;

  const guardar = () => {
    const metodo = metodos.find((m) => m.id === metodoId)?.nombre ?? "";
    onGuardar({ fechaPago: fecha, metodoId, metodo, observaciones });
    setFecha("");
    setMetodoId("");
    setObservaciones("");
  };

  return (
    <Modal className="adm-pagos-menu-regis" abierto={!!pago} onCerrar={onCerrar}>
      {pago && (
        <>
          <aside className="adm-pagos-cabe-menu">
            <div className="adm-pagos-infor-cabe">
              <svg className="adm-pagos-sim-menu" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 16H8" /><path d="M14 8H8" /><path d="M16 12H8" />
                <path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z" />
              </svg>
              <span className="adm-pagos-titu-menu">Registrar Pago</span>
            </div>
            <div id="x-cabe">
              <svg className="adm-pagos-sim-x" onClick={onCerrar} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </div>
          </aside>

          <section className="adm-pagos-infor-usu">
            <div className="adm-pagos-conte-usu">
              <div className="adm-pagos-foto"><div className="adm-pagos-detalle-menu"></div></div>
              <div className="adm-pagos-usu-tex">
                <h4>{pago.atleta?.nombre ?? "Atleta no encontrado"}</h4>
                <div className="adm-pagos-id-usu">
                  <h5>Código atleta:</h5>
                  <button className="fon-blanco">{pago.atleta?.codigo || "—"}</button>
                </div>
              </div>
            </div>
            <div className="adm-pagos-mes-conte">
              {pago.etiquetas.map((e) => (
                <button key={e.texto} className="chip-modal">{e.texto}</button>
              ))}
            </div>
          </section>

          <h4 className="dentro-menu">Información del cobro</h4>
          <section className="adm-pagos-targetas-cobro">
            <div className="targe-a">
              <div className="targe-co">
                <h5><i className="sim-targe bi bi-person"></i>ID del pago</h5>
                <button className="fon-blan">{pago.codigo || "—"}</button>
              </div>
              <div className="targe-co">
                <h5><i className="sim-targe bi bi-calendar"></i>Fecha generación</h5>
                <span className="adm-pagos-gen">{pago.generacion}</span>
              </div>
            </div>
            <div className="targe-a">
              <div className="targe-co">
                <h5><i className="sim-targe bi bi-cash"></i>Valor total</h5>
                <span className="adm-pagos-total">
                  {pago.valor.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="targe-co">
                <h5><i className="sim-targe bi bi-flag-fill"></i>Estado actual</h5>
                <span className="chip-modal">{pago.estadoTexto}</span>
              </div>
            </div>
          </section>

          <div className="adm-pagos-linea"></div>
          <h4 className="dentro-menu">Registrar Pago</h4>
          <section className="adm-pagos-res-pago">
            <div className="conte-input">
              <label className="label-titu" htmlFor="fecha-pago">Fecha de Pago</label>
              <input id="fecha-pago" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="conte-input">
              <label className="label-titu" htmlFor="metodo-pago">Método de pago</label>
              <select id="metodo-pago" value={metodoId} onChange={(e) => setMetodoId(e.target.value)}>
                <option value="">{metodos.length ? "Selecciona un método" : "No hay métodos configurados"}</option>
                {metodos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
          </section>
          <label className="label" htmlFor="ob">Observaciones</label>
          <textarea id="ob" className="adm-pagos-ob" maxLength={100} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />

          <section className="adm-pagos-conte-btn">
            <button className="adm-pagos-cancelar" onClick={onCerrar}>Cancelar</button>
            <button className="adm-pagos-registrar" disabled={!listo || guardando} onClick={guardar}>
              {guardando ? "Guardando…" : "Registrar Pago"}
            </button>
          </section>
        </>
      )}
    </Modal>
  );
}

export default ModalFormularioPago;