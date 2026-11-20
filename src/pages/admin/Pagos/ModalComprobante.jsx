import Modal from "./Modal";
import { abrirDataURL } from "../../../utils/archivos";

/** Comprobante enviado por el atleta: imagen o PDF guardado como data-URL (ver pagosService). */
function ModalComprobante({ comprobante, onCerrar }) {
  const archivo = comprobante?.archivo ?? "";
  const esImagen = archivo.startsWith("data:image/");
  const esPdf = archivo.startsWith("data:application/pdf");
  const verificable = esImagen || esPdf;
  const nombre = verificable ? "Comprobante de pago" : archivo;
  const abrir = () => abrirDataURL(archivo).catch(() => {});

  return (
    <Modal className="adm-pagos-menu-regis2" abierto={!!comprobante} onCerrar={onCerrar}>
      {comprobante && (
        <>
          <aside className="adm-pagos-cabe-menu">
            <div className="adm-pagos-infor-cabe">
              <svg className="adm-pagos-sim-menu" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
                <path d="M14 2v5a1 1 0 0 0 1 1h5" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
              </svg>
              <span className="adm-pagos-titu-menu">Comprobante de Pago</span>
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
                <h4>{comprobante.atleta?.nombre ?? "Atleta no encontrado"}</h4>
                <div className="adm-pagos-id-usu">
                  <h5>ID atleta:</h5>
                  <button className="fon-blanco">{comprobante.atleta?.id}</button>
                </div>
              </div>
            </div>
            <div className="adm-pagos-mes-conte">
              <button className="chip-modal">{comprobante.etiqueta}</button>
            </div>
          </section>

          

          {comprobante.archivo ? (
            <>
              <section className="adm-pagos-conte-compro">
                <div className="adm-pagos-docu-infor">
                  <div>
                    <button className="fondo-none border-0">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
                        <path d="M14 2v5a1 1 0 0 0 1 1h5" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <h4>{nombre}</h4>
                    <span>Subido por atleta</span>
                  </div>
                </div>
                <div className="adm-pagos-infor-pago">
                  <h5 className="informacion-pag"><i className="sim-pago bi bi-wallet2"></i>{comprobante.metodo}</h5>
                  <h5 className="informacion-pag"><i className="sim-pago bi bi-bank"></i>Ref: {comprobante.referencia}</h5>
                  <h5 className="informacion-pag"><i className="sim-pago bi bi-calendar"></i>{comprobante.fecha}</h5>
                </div>
              </section>
              {esImagen && (
                <div className="adm-pagos-vista-compro">
                  <img src={archivo} alt="Comprobante de pago" onClick={abrir} />
                </div>
              )}
              <footer className="adm-pagos-btn-compro">
                {verificable ? (
                  <>
                    <a className="btn-accion-compro" href={archivo} download={"comprobante" + (esPdf ? ".pdf" : ".jpg")}>Descargar</a>
                    <button type="button" className="btn-accion-compro" onClick={abrir}>Abrir en pestaña</button>
                  </>
                ) : (
                  <span className="adm-pagos-sin-archivo">El archivo no está disponible para verlo.</span>
                )}
              </footer>
            </>
          ) : (
            <section className="adm-pagos-conte-compro">
              <div className="adm-pagos-docu-infor">
                <div>
                  <h4>Sin comprobante</h4>
                  <span>El atleta todavía no ha subido su comprobante</span>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </Modal>
  );
}

export default ModalComprobante;