import { useEffect, useMemo, useRef, useState } from "react";
import { getPedidos, marcarRecibido } from "../../../services/PedidosService";
import { ATLETA_ACTUAL } from "../../../services/AtletaActual";
import { etiquetaTalla } from "../../../data/tallas";
import { fechaCorta, formatoCOP, parsearFecha, totalPedido, unidadesPedido } from "../../../data/pedidos";
import FiltroSelect from "../../../components/Compartidos/FiltroSelect";
import IconoMetodoPago from "../../../components/Pagos/IconoMetodoPago";
import ModalCancelarPedido from "./ModalCancelarPedido";
import FormularioResena from "./FormularioResena";

const claseEstado = {
  Pendiente: "estado-pendiente",
  Aprobado: "estado-listo",
  Rechazado: "estado-rechazado",
  Cancelado: "estado-cancelado",
};

const etiquetaEstado = (p) =>
  p.estado === "Aprobado" ? (p.recibido ? "Recibido" : "Listo para entregar") : p.estado;

export default function MisPedidos({ onAviso }) {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroFecha, setFiltroFecha] = useState("mas-recientes");

  const [seleccionado, setSeleccionado] = useState(null);
  const modalCancelarRef = useRef(null);

  const cargar = async () => {
    setCargando(true);
    setError("");
    try {
      const datos = await getPedidos();
      setPedidos(datos.filter((p) => p.atleta === ATLETA_ACTUAL.nombre));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const pedidosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const lista = pedidos.filter((p) => {
      const coincideBusqueda =
        !texto ||
        p.id.toLowerCase().includes(texto) ||
        (p.items ?? []).some((i) => i.implementoNombre.toLowerCase().includes(texto));
      const coincideEstado = filtroEstado === "todos" || p.estado.toLowerCase() === filtroEstado;
      return coincideBusqueda && coincideEstado;
    });
    return lista.sort((a, b) =>
      filtroFecha === "mas-recientes"
        ? parsearFecha(b.fecha) - parsearFecha(a.fecha)
        : parsearFecha(a.fecha) - parsearFecha(b.fecha)
    );
  }, [pedidos, busqueda, filtroEstado, filtroFecha]);

  const pedirCancelar = (p) => {
    setSeleccionado(p);
    modalCancelarRef.current.showModal();
  };

  const handleMarcarRecibido = async (p) => {
    try {
      await marcarRecibido(p);
      cargar();
      onAviso("Pedido marcado como recibido.");
    } catch (err) {
      onAviso(err.message, "error");
    }
  };

  return (
    <section aria-label="Mis pedidos de implementos">
      <div className="barra-filtros-modulo">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Buscar pedido o producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filtro-selectores">
          <FiltroSelect
            label="Estado"
            value={filtroEstado}
            onChange={setFiltroEstado}
            options={[
              { value: "todos", label: "Todos" },
              { value: "pendiente", label: "Pendiente" },
              { value: "aprobado", label: "Aprobado" },
              { value: "rechazado", label: "Rechazado" },
              { value: "cancelado", label: "Cancelado" },
            ]}
          />
          <FiltroSelect
            label="Fecha"
            value={filtroFecha}
            onChange={setFiltroFecha}
            options={[
              { value: "mas-recientes", label: "Actuales" },
              { value: "menos-recientes", label: "Antiguos" },
            ]}
          />
        </div>
      </div>

      {error && <div className="alerta-error">{error}</div>}

      <h2 className="subtitulo-seccion">Mis Pedidos</h2>

      <div className="lista-pedidos">
        {cargando && <p>Cargando pedidos...</p>}
        {!cargando && pedidosFiltrados.length === 0 && <p>No tienes pedidos registrados.</p>}

        {!cargando &&
          pedidosFiltrados.map((p) => (
            <article className="tarjeta-pedido" key={p.id}>
              <header className="pedido-cabecera">
                <div>
                  <span className="pedido-codigo">{p.id}</span>
                  <span className="pedido-fecha">
                    {fechaCorta(p.fecha)} · {unidadesPedido(p)} unidad(es)
                  </span>
                </div>
                <span className={`estado-tag ${claseEstado[p.estado]}`}>{etiquetaEstado(p)}</span>
              </header>

              <ul className="pedido-items">
                {(p.items ?? []).map((item) => (
                  <li className="pedido-item" key={`${item.implementoId}-${item.grupoTalla ?? ""}-${item.talla}`}>
                    <div className="pedido-item-fila">
                      <img src={item.implementoImagen } alt={item.implementoNombre} className="img-pedido" />
                      <div className="pedido-item-info">
                        <h4>{item.implementoNombre}</h4>
                        <p className="pedido-item-detalle">
                          Talla {etiquetaTalla(item)} · {item.cantidad} × {formatoCOP(item.precioUnitario)}
                        </p>
                      </div>
                      <span className="pedido-item-total">{formatoCOP(item.precioUnitario * item.cantidad)}</span>
                    </div>

                    {p.estado === "Aprobado" && p.recibido && (
                      item.resenaEnviada ? (
                        <span className="pedido-resena-ok">✓ Reseña enviada</span>
                      ) : (
                        <FormularioResena
                          pedido={p}
                          item={item}
                          onEnviada={() => {
                            cargar();
                            onAviso("¡Gracias por tu reseña!");
                          }}
                        />
                      )
                    )}
                  </li>
                ))}
              </ul>

              <footer className="pedido-pie">
                <div className="pedido-pie-info">
                  <p className="pago-metodo">
                    <IconoMetodoPago id={p.metodoPagoId} size={14} />
                    {p.metodoPago}
                  </p>
                  {p.estado === "Rechazado" && p.motivoRechazo && (
                    <p className="motivo-rechazo">Motivo: {p.motivoRechazo}</p>
                  )}
                </div>
                <div className="pedido-total">
                  <span>Total</span>
                  <strong>{formatoCOP(totalPedido(p))}</strong>
                </div>
                {(p.estado === "Pendiente" || (p.estado === "Aprobado" && !p.recibido)) && (
                  <div className="pedido-acciones">
                    {p.estado === "Pendiente" && (
                      <button type="button" className="btn-cancelar-pedido" onClick={() => pedirCancelar(p)}>
                        Cancelar pedido
                      </button>
                    )}
                    {p.estado === "Aprobado" && !p.recibido && (
                      <button type="button" className="label-marcar-recibido" onClick={() => handleMarcarRecibido(p)}>
                        Marcar como recibido
                      </button>
                    )}
                  </div>
                )}
              </footer>
            </article>
          ))}
      </div>

      <ModalCancelarPedido
        ref={modalCancelarRef}
        pedido={seleccionado}
        onCancelado={() => {
          cargar();
          onAviso("Pedido cancelado.");
        }}
        onError={(mensaje) => onAviso(mensaje, "error")}
      />
    </section>
  );
}
