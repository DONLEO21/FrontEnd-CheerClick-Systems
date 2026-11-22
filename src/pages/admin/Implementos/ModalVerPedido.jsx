import { forwardRef } from "react";
import { etiquetaTalla } from "../../../data/tallas";
import { fechaCorta, formatoCOP, totalPedido, unidadesPedido } from "../../../data/pedidos";
import { abrirDataURL } from "../../../utils/archivos";
import IconoMetodoPago from "../../../components/Pagos/IconoMetodoPago";

import ImagenImplemento from "../../../components/Compartidos/ImagenImplemento";
const badgeEstado = {
  Pendiente: "badge-estado-pendiente",
  Aprobado: "badge-estado-aprobado",
  Rechazado: "badge-estado-rechazado",
  Cancelado: "badge-estado-rechazado",
};

const ModalVerPedido = forwardRef(function ModalVerPedido({ pedido }, ref) {
  const cerrar = () => ref.current.close();

  if (!pedido) return <dialog ref={ref} className="dialog-bootstrap" />;

  const items = pedido.items ?? [];
  const digital = !!pedido.requiereComprobante; // el método exige comprobante (los datos mandan, no el texto)
  const efectivo = !!pedido.metodoPago && !digital;
  const comprobanteEsImagen = pedido.comprobante?.startsWith("data:image");

  return (
    <dialog ref={ref} className="dialog-bootstrap">
      <div className="modal-content modal-detalle-pedido" style={{ width: "min(520px, 92vw)" }}>
        <div className="modal-header-detalle">
          <div className="detalle-icono">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 16H8" />
              <path d="M14 8H8" />
              <path d="M16 12H8" />
              <path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z" />
            </svg>
          </div>
          <div className="flex-grow-1">
            <h5 className="detalle-titulo mb-0">Detalle del Pedido</h5>
            <span className="detalle-codigo">{pedido.codigo || "—"}</span>
          </div>
          <button type="button" className="btn-cerrar-circular" onClick={cerrar}>×</button>
        </div>

        <div className="modal-body">
          <p className="seccion-detalle">Productos del pedido ({items.length})</p>
          <div className="pedido-adm-items">
            {items.map((item) => (
              <div
                className="caja-gris caja-implemento"
                key={`${item.implementoId}-${item.grupoTalla ?? ""}-${item.talla}`}
              >
                <ImagenImplemento
                  src={item.implementoImagen }
                  alt={item.implementoNombre}
                  className="img-modal"
                  style={{ width: "52px", height: "52px", padding: "4px", flexShrink: 0 }}
                />
                <div className="flex-grow-1">
                  <strong className="d-block">{item.implementoNombre}</strong>
                  <span className="text-muted small">
                    Talla {etiquetaTalla(item)} · {item.cantidad} × {formatoCOP(item.precioUnitario)}
                  </span>
                </div>
                <span className="text-danger fw-bold">{formatoCOP(item.cantidad * item.precioUnitario)}</span>
              </div>
            ))}
          </div>

          <p className="seccion-detalle">Solicitante</p>
          <div className="row g-2">
            <div className="col-6">
              <div className="caja-gris">
                <small className="dato-label">Atleta</small>
                <div>{pedido.atleta}</div>
              </div>
            </div>
            <div className="col-6">
              <div className="caja-gris">
                <small className="dato-label">Categoría</small>
                <div>{pedido.categoria}</div>
              </div>
            </div>
            <div className="col-6">
              <div className="caja-gris">
                <small className="dato-label">Fecha del pedido</small>
                <div>{fechaCorta(pedido.fecha)}</div>
              </div>
            </div>
            <div className="col-6">
              <div className="caja-gris">
                <small className="dato-label">Estado</small>
                <div>
                  <span className={`badge-estado ${badgeEstado[pedido.estado] ?? "badge-estado-pendiente"}`}>
                    {pedido.estado}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="caja-gris">
                <small className="dato-label">Unidades</small>
                <div>{unidadesPedido(pedido)}</div>
              </div>
            </div>
            <div className="col-6">
              <div className="caja-gris">
                <small className="dato-label">Total</small>
                <div className="text-danger fw-bold">{formatoCOP(totalPedido(pedido))}</div>
              </div>
            </div>
          </div>

          <p className="seccion-detalle">Método de Pago</p>
          <div className="caja-metodo-pago">
            <span className="metodo-pago-icono-inline">
              <IconoMetodoPago nombre={pedido.metodoPago} size={20} />
            </span>
            <strong>{pedido.metodoPago}</strong>
            <span className="check-metodo-pago">✓</span>
          </div>
          {pedido.estadoPago && (
            <p className="pedido-adm-llave">
              Estado del pago: <strong>{pedido.estadoPago}</strong>
              {pedido.codigoPago ? ` · ${pedido.codigoPago}` : ""}
            </p>
          )}
          {efectivo && (
            <>
              <p className="seccion-detalle">Comprobante</p>
              <div className="caja-comprobante">
                <span className="text-muted">Pago en efectivo, sin comprobante</span>
              </div>
            </>
          )}
          {digital && pedido.llavePago && (
            <p className="pedido-adm-llave">
              Llave de destino: <strong>{pedido.llavePago}</strong>
            </p>
          )}

          {digital && (
            <>
              <p className="seccion-detalle">Comprobante Adjunto</p>
              {pedido.comprobante ? (
                <div className="caja-comprobante">
                  {comprobanteEsImagen && (
                    <button
                      type="button"
                      className="comprobante-miniatura"
                      title="Abrir comprobante"
                      onClick={() => abrirDataURL(pedido.comprobante)}
                    >
                      <img src={pedido.comprobante} alt="Comprobante de pago" />
                    </button>
                  )}
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => abrirDataURL(pedido.comprobante)}>
                    Abrir comprobante
                  </button>
                </div>
              ) : (
                <div className="caja-comprobante">
                  <span className="text-muted">No se adjuntó comprobante</span>
                </div>
              )}
            </>
          )}

          {pedido.estado === "Rechazado" && pedido.motivoRechazo && (
            <div className="alert alert-danger py-2 mt-3 mb-0">
              <strong>Motivo del rechazo:</strong> {pedido.motivoRechazo}
            </div>
          )}
        </div>

        <div className="modal-footer-total">
          <div>
            <small className="dato-label d-block">Total del Pedido</small>
            <span className="text-danger fw-bold fs-5">{formatoCOP(totalPedido(pedido))}</span>
          </div>
        </div>
      </div>
    </dialog>
  );
});

export default ModalVerPedido;
