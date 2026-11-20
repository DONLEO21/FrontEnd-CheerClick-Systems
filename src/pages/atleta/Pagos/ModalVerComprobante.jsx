import Modal from "../../admin/Pagos/Modal";
import { abrirDataURL } from "../../../utils/archivos";

/** Muestra el comprobante que envió el atleta (imagen o PDF) y los datos del pago. */
function ModalVerComprobante({ mensualidad, atleta, onCerrar }) {
  const comprobante = mensualidad?.comprobante ?? "";
  const esImagen = comprobante.startsWith("data:image/");
  const esPdf = comprobante.startsWith("data:application/pdf");
  const hayArchivo = esImagen || esPdf;
  const abrir = () => abrirDataURL(comprobante).catch(() => {});

  return (
    <Modal className="atl-pagos-menu-regis2-atleta" abierto={!!mensualidad} onCerrar={onCerrar}>
      {mensualidad && (
        <>
          <aside className="atl-pagos-cabe-menu-atl">
            <div className="atl-pagos-infor-cabe-atl">
              <svg className="atl-pagos-sim-menu-atl" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
                <path d="M14 2v5a1 1 0 0 0 1 1h5" />
              </svg>
              <span className="atl-pagos-titu-menu-atl">Comprobante de pago · {mensualidad.mes}</span>
            </div>
            <div>
              <svg className="atl-pagos-sim-x-atl" onClick={onCerrar} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </div>
          </aside>

          <section className="atl-comp-cuerpo">
            {atleta?.nombre && <p className="atl-comp-atleta">{atleta.nombre}</p>}

            {esImagen && (
              <button type="button" className="atl-comp-imagen" onClick={abrir} title="Abrir en una pestaña nueva">
                <img src={comprobante} alt="Comprobante de pago" />
              </button>
            )}
            {esPdf && (
              <div className="atl-comp-pdf">
                <span>Comprobante en PDF</span>
              </div>
            )}
            {!hayArchivo && (
              <p className="atl-comp-sin">El archivo de este comprobante no está disponible para verlo.</p>
            )}

            <dl className="atl-comp-datos">
              <div><dt>Estado</dt><dd>{mensualidad.registrado ? "Validado por el club" : "En revisión"}</dd></div>
              <div><dt>Método</dt><dd>{mensualidad.metodo || "—"}</dd></div>
              <div><dt>Referencia</dt><dd>{mensualidad.referencia || "—"}</dd></div>
              <div><dt>Fecha de pago</dt><dd>{mensualidad.fechaPago || "—"}</dd></div>
            </dl>
          </section>

          <footer className="atl-pagos-btn-compro-atl">
            {hayArchivo && (
              <>
                <a className="atl-btn" href={comprobante} download={"comprobante-" + mensualidad.mes.toLowerCase() + (esPdf ? ".pdf" : ".jpg")}>Descargar</a>
                <button type="button" className="atl-btn" onClick={abrir}>Abrir en pestaña</button>
              </>
            )}
            <button type="button" className="atl-btn" onClick={onCerrar}>Cerrar</button>
          </footer>
        </>
      )}
    </Modal>
  );
}
export default ModalVerComprobante;
