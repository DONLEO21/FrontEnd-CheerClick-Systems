import { forwardRef, Fragment, useRef, useState } from "react";
import { useCarrito } from "../../../context/CarritoContext";
import { getImplementos } from "../../../services/ImplementosService";
import { getMetodosPago } from "../../../services/MetodosPagoService";
import DatosPagoMetodo from "../../../components/Compartidos/DatosPagoMetodo";
import { crearPedido } from "../../../services/PedidosService";
import { etiquetaTalla } from "../../../data/tallas";
import { formatoCOP } from "../../../data/pedidos";
import { prepararComprobante } from "../../../utils/archivos";
import IconoMetodoPago from "../../../components/Pagos/IconoMetodoPago";

import ImagenImplemento from "../../../components/Compartidos/ImagenImplemento";
const IconoBolsa = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
  </svg>
);

const CarritoDrawer = forwardRef(function CarritoDrawer({ onPedidoCreado }, ref) {
  const { items, unidades, total, cambiarCantidad, quitar, vaciar } = useCarrito();

  const [paso, setPaso] = useState("carrito"); // "carrito" | "pago"
  const [metodos, setMetodos] = useState([]); // métodos activos que devuelve la API (incluye Efectivo)
  const [metodoId, setMetodoId] = useState("");
  const [comprobante, setComprobante] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [validando, setValidando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const enviandoRef = useRef(false); // bloqueo inmediato: el estado de React llega tarde ante dos clics seguidos
  const [error, setError] = useState("");

  const metodo = metodos.find((m) => m.id === metodoId) ?? null;
  // Los DATOS mandan: el método dice si exige comprobante (Efectivo: no)
  const exigeComprobante = !!metodo?.requiereComprobante;

  const reiniciar = () => {
    setPaso("carrito");
    setMetodoId("");
    setComprobante("");
    setNombreArchivo("");
    setError("");
  };

  const cerrar = () => ref.current.close();

  // Comprueba contra el catálogo actual que todo siga disponible y con stock
  const verificarDisponibilidad = async () => {
    const actuales = await getImplementos();
    const problemas = [];
    items.forEach((i) => {
      const imp = actuales.find((a) => a.id === i.implementoId);
      if (!imp || imp.estado !== "Disponible") {
        problemas.push(`${i.implementoNombre} ya no está disponible.`);
        return;
      }
      if (i.grupoTalla) {
        const t = (imp.tallas ?? []).find((x) => x.grupo === i.grupoTalla && x.talla === i.talla);
        const stock = Number(t?.stock) || 0;
        if (stock <= 0) problemas.push(`${i.implementoNombre} (talla ${i.talla}) está agotado.`);
        else if (stock < i.cantidad)
          problemas.push(`De ${i.implementoNombre} (talla ${i.talla}) solo quedan ${stock} unidad(es).`);
      }
    });
    return problemas;
  };

  const irAPago = async () => {
    setValidando(true);
    setError("");
    try {
      const [problemas, metodos] = await Promise.all([
        verificarDisponibilidad(),
        getMetodosPago(),
      ]);
      if (problemas.length > 0) {
        setError(problemas.join(" "));
        return;
      }
      const activos = metodos.filter((m) => m.activo);
      if (activos.length === 0) {
        setError("No hay métodos de pago disponibles por ahora. Intenta de nuevo más tarde.");
        return;
      }
      setMetodos(activos);
      // Efectivo primero (queda preseleccionado) y sin comprobante; los digitales después
      const preferido = activos.find((m) => !m.requiereComprobante) ?? activos[0];
      setMetodoId(preferido.id);
      setPaso("pago");
    } catch (err) {
      setError(err.message);
    } finally {
      setValidando(false);
    }
  };

  const elegirMetodo = (id) => {
    setMetodoId(id);
    setComprobante("");
    setNombreArchivo("");
    setError("");
  };

  const elegirComprobante = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    try {
      setError("");
      setComprobante(await prepararComprobante(archivo));
      setNombreArchivo(archivo.name);
    } catch (err) {
      setComprobante("");
      setNombreArchivo("");
      setError(err.message);
    }
  };

  const confirmar = async () => {
    if (enviandoRef.current) return; // sin dobles envíos (doble clic): el botón también se deshabilita
    if (!metodo) {
      setError("Selecciona un método de pago.");
      return;
    }
    if (exigeComprobante && !comprobante) {
      setError("Adjunta el comprobante de pago para continuar.");
      return;
    }
    enviandoRef.current = true; // desde aquí no hay validaciones que retornen: se libera en el finally
    setEnviando(true);
    setError("");
    try {
      const pedido = await crearPedido({
        items: items.map((i) => ({
          implementoId: i.implementoId,
          implementoNombre: i.implementoNombre,
          implementoImagen: i.implementoImagen,
          grupoTalla: i.grupoTalla,
          talla: i.talla,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          resenaEnviada: false,
        })),
        metodoPagoId: metodo.id,
        comprobante: exigeComprobante ? comprobante : "",
      });
      vaciar();
      onPedidoCreado(pedido);
      cerrar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
      enviandoRef.current = false;
    }
  };

  // Clic en el fondo oscuro (el propio <dialog>) cierra el carrito
  const clicFuera = (e) => {
    if (e.target === e.currentTarget) cerrar();
  };

  const vacio = items.length === 0;

  return (
    <dialog ref={ref} className="dialog-carrito" onClose={reiniciar} onClick={clicFuera}>
      <header className="carrito-header">
        <div className="modal-header-icono"><IconoBolsa /></div>
        <div className="carrito-header-texto">
          <h3>{paso === "pago" ? "Finalizar pedido" : "Mi carrito"}</h3>
          <span>
            {vacio ? "Sin productos" : `${items.length} producto(s) · ${unidades} unidad(es)`}
          </span>
        </div>
        <button type="button" className="btn-cerrar-modal" onClick={cerrar} aria-label="Cerrar carrito">✕</button>
      </header>

      {!vacio && (
        <div className="carrito-pasos" aria-label="Progreso del pedido">
          <div className={`carrito-paso ${paso === "carrito" ? "activo" : "hecho"}`}>
            <span className="carrito-paso-num">{paso === "carrito" ? "1" : "✓"}</span>
            Carrito
          </div>
          <span className="carrito-paso-linea" />
          <div className={`carrito-paso ${paso === "pago" ? "activo" : ""}`}>
            <span className="carrito-paso-num">2</span>
            Pago
          </div>
        </div>
      )}

      <div className="carrito-cuerpo">
        {error && <div className="alerta-error" role="alert">{error}</div>}

        {vacio && (
          <div className="carrito-vacio">
            <div className="carrito-vacio-icono"><IconoBolsa size={30} /></div>
            <h4>Tu carrito está vacío</h4>
            <p>Agrega implementos desde el catálogo y pídelos todos en un solo pedido.</p>
            <button type="button" className="btn-carrito-secundario" onClick={cerrar}>Ir al catálogo</button>
          </div>
        )}

        {/* Paso 1: productos */}
        {!vacio && paso === "carrito" && (
          <>
            <ul className="carrito-lista">
              {items.map((i) => (
                <li className="carrito-item" key={i.clave}>
                  <ImagenImplemento src={i.implementoImagen } alt={i.implementoNombre} className="carrito-item-img" />
                  <div className="carrito-item-info">
                    <p className="carrito-item-nombre">{i.implementoNombre}</p>
                    <p className="carrito-item-detalle">
                      Talla {etiquetaTalla(i)} · {formatoCOP(i.precioUnitario)} c/u
                    </p>
                    <div className="carrito-item-fila">
                      <div className="control-cantidad control-cantidad--sm">
                        <button type="button" aria-label="Quitar una unidad"
                          onClick={() => cambiarCantidad(i.clave, i.cantidad - 1)}>−</button>
                        <input
                          type="number"
                          min={1}
                          max={i.stock}
                          value={i.cantidad}
                          aria-label={`Cantidad de ${i.implementoNombre}`}
                          onChange={(e) => cambiarCantidad(i.clave, e.target.value)}
                        />
                        <button type="button" aria-label="Agregar una unidad"
                          disabled={i.cantidad >= i.stock}
                          onClick={() => cambiarCantidad(i.clave, i.cantidad + 1)}>+</button>
                      </div>
                      <span className="carrito-item-subtotal">{formatoCOP(i.cantidad * i.precioUnitario)}</span>
                    </div>
                  </div>
                  <button type="button" className="carrito-item-quitar" title="Quitar del carrito"
                    aria-label={`Quitar ${i.implementoNombre} del carrito`} onClick={() => quitar(i.clave)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn-vaciar-carrito" onClick={vaciar}>Vaciar carrito</button>
          </>
        )}

        {/* Paso 2: pago */}
        {!vacio && paso === "pago" && (
          <>
            <div className="form-section">
              <p className="form-section-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Método de pago
              </p>

              <div className="opciones-pago-tarjetas opciones-pago-tarjetas--auto" role="radiogroup" aria-label="Método de pago">
                {metodos.map((m) => (
                  <Fragment key={m.id}>
                    <input type="radio" name="metodo-pago" id={`pago-${m.id}`}
                      checked={metodoId === m.id} onChange={() => elegirMetodo(m.id)} />
                    <label htmlFor={`pago-${m.id}`} className="tarjeta-pago-label">
                      <div className="pago-icono"><IconoMetodoPago nombre={m.nombre} /></div>
                      <span className="pago-titulo">{m.nombre}</span>
                      <span className="pago-subtitulo">{m.requiereComprobante ? "Pago digital" : "Al recoger en el club"}</span>
                    </label>
                  </Fragment>
                ))}
              </div>
            </div>

            {/* Datos para pagar (QR, llave, teléfono, cuenta), valor y concepto: componente compartido por todos los pagos */}
            <DatosPagoMetodo
              metodo={metodo}
              valor={total}
              concepto={`Pedido de implementos (${unidades} ${unidades === 1 ? "artículo" : "artículos"})`}
              textoEfectivo="Pagarás en efectivo al recoger tu pedido en el club. Tu pedido quedará pendiente hasta la entrega."
            />

            {exigeComprobante && (
              <>
                <div className="form-section">
                  <p className="form-section-label">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Comprobante
                  </p>
                  <label htmlFor="comprobante-pago" className={`zona-upload ${nombreArchivo ? "zona-upload--activa" : ""}`}>
                    <p className="zona-upload-texto">
                      {nombreArchivo ? "Comprobante cargado" : "Haz clic para subir el comprobante"}
                    </p>
                    <span className="zona-upload-hint">PNG, JPG o PDF · Máx. 5 MB</span>
                    <span className="zona-upload-nombre">{nombreArchivo || "Ningún archivo seleccionado"}</span>
                  </label>
                  <input type="file" id="comprobante-pago" accept="image/*,.pdf" style={{ display: "none" }}
                    onChange={elegirComprobante} />
                </div>
              </>
            )}

            <div className="modal-resumen-precio">
              {items.map((i) => (
                <div className="resumen-fila" key={i.clave}>
                  <span className="resumen-label">{i.cantidad} × {i.implementoNombre} ({i.talla})</span>
                  <span className="resumen-valor">{formatoCOP(i.cantidad * i.precioUnitario)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {!vacio && (
        <footer className="carrito-pie">
          <div className="resumen-fila resumen-total">
            <span>Total del pedido</span>
            <span>{formatoCOP(total)}</span>
          </div>

          {paso === "carrito" ? (
            <button type="button" className="btn-enviar-pedido" onClick={irAPago} disabled={validando}>
              {validando ? "Verificando disponibilidad..." : "Continuar al pago"}
            </button>
          ) : (
            <div className="carrito-pie-botones">
              <button type="button" className="btn-carrito-secundario"
                onClick={() => { setPaso("carrito"); setError(""); }} disabled={enviando}>
                Volver
              </button>
              <button type="button" className="btn-enviar-pedido" onClick={confirmar} disabled={enviando}>
                {enviando ? "Enviando..." : "Confirmar pedido"}
              </button>
            </div>
          )}
        </footer>
      )}
    </dialog>
  );
});

export default CarritoDrawer;