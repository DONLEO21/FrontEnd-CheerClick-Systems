import { useState } from "react";
import Modal from "./Modal";

function ModalDetalleCompetencia({ competencia, pagos, onCerrar, onValidar, onRechazar, onVerComprobante }) {
  const [filtro, setFiltro] = useState("todos");

  const visibles = pagos.filter((p) => {
    if (filtro === "pagados") return p.estado === "validado";
    if (filtro === "pendientes") return p.estado !== "validado";
    return true;
  });

  return (
    <Modal className="adm-pagos-menu-regis3" abierto={!!competencia} onCerrar={onCerrar}>
      {competencia && (
        <>
          <aside className="adm-pagos-cabe-menu">
            <div className="adm-pagos-infor-tro">
              <svg className="adm-pagos-sim-tro" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
                <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
                <path d="M18 9h1.5a1 1 0 0 0 0-5H18" /><path d="M4 22h16" />
                <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
                <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
              </svg>
              <span className="adm-pagos-titu-menu">{competencia.nombre}</span>
              <button className="adm-pagos-btn-tro">{competencia.nivel}</button>
            </div>
            <div id="x-cabe">
              <svg className="adm-pagos-sim-x" onClick={onCerrar} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </div>
          </aside>

          <section className="adm-pagos-targetas-tro">
            <div className="targe-tro">
              <h4 className="adm-pagos-titu-tro">Pagaron</h4>
              <span className="adm-pagos-avlor-tro">{competencia.pagados}/{competencia.inscritos}</span>
            </div>
            <div className="targe-tro">
              <h4 className="adm-pagos-titu-tro">Validados</h4>
              <span className="adm-pagos-avlor-tro">{competencia.validados}/{competencia.pagados}</span>
            </div>
            <div className="targe-tro">
              <h4 className="adm-pagos-titu-tro">Recaudado</h4>
              <span className="adm-pagos-avlor-tro">
                {competencia.recaudado.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
              </span>
            </div>
          </section>

          <section className="adm-pagos-botones-tro">
            <button className={filtro === "todos" ? "btn-filt" : "btn-fil"} onClick={() => setFiltro("todos")}>Todos</button>
            <button className={filtro === "pagados" ? "btn-filt" : "btn-fil"} onClick={() => setFiltro("pagados")}>Pagados</button>
            <button className={filtro === "pendientes" ? "btn-filt" : "btn-fil"} onClick={() => setFiltro("pendientes")}>Pendiente</button>
          </section>

          <section className="adm-pagos-tro-atle">
            {visibles.map((p) => (
              <div className="adm-pagos-atle-targe" key={p.id}>
                <div className="adm-pagos-a-t">
                  <div><div className="adm-pagos-deta-fto"></div></div>
                  <div>
                    <h5 className="adm-pagos-nombre-atl">{p.atleta?.nombre ?? "Atleta no encontrado"}</h5>
                    <span className="adm-pagos-ID-fecha">{p.codigo || "—"} · {p.fechaPago}</span>
                  </div>
                </div>
                <div className="adm-pagos-acci-a">
                  {p.estado === "validado" ? (
                    <span className="pill-registrado">Validado</span>
                  ) : p.estado === "rechazado" ? (
                    <span className="pill-registrado" style={{ background: "#fdeaea", color: "#cc0000" }}>Rechazado</span>
                  ) : (
                    <>
                      <button className="regi" onClick={() => onValidar(p)}>Validar</button>
                      <button className="regi" style={{ background: "#fff", color: "#cc0000", border: "1px solid #cc0000" }} onClick={() => onRechazar?.(p)}>Rechazar</button>
                    </>
                  )}
                  <button className="btn-ojo btn-sm btn-light" onClick={() => onVerComprobante(p)}>
                    <i class="svg-de bi bi-eye"></i>
                  </button>
                </div>
              </div>
            ))}
            {visibles.length === 0 && <p className="text-muted">Ningún atleta coincide con este filtro.</p>}
          </section>
        </>
      )}
    </Modal>
  );
}

export default ModalDetalleCompetencia;